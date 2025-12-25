import express from 'express';
import path from 'path';
import fs from 'fs';
import {
    createCashfreeOrder,
    verifyPayment,
    getPaymentStatus
} from '../controllers/payment-controller';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleCheck';

const router = express.Router();

router.post('/cashfree-order', authMiddleware, createCashfreeOrder);
router.post('/verify', verifyPayment); // Removed authMiddleware
router.get('/status', authMiddleware, getPaymentStatus);

// Mobile payment bridge page
router.get('/mobile-checkout', (req, res) => {
    const { session, orderId } = req.query;

    if (!session || !orderId) {
        return res.status(400).send('Missing session or orderId parameter');
    }

    console.log('📄 Serving mobile payment page for:', { session, orderId });

    // Try to read from file first (for development)
    const htmlPath = path.resolve(__dirname, '../views/mobile-payment.html');

    if (fs.existsSync(htmlPath)) {
        console.log('✅ Found HTML file, serving from:', htmlPath);
        res.sendFile(htmlPath);
    } else {
        // Fallback: serve inline HTML (for production when views folder isn't copied)
        console.log('⚠️ HTML file not found, serving inline HTML');
        res.send(getPaymentHTML(session as string, orderId as string));
    }
});

// Inline HTML template (fallback for production)
function getPaymentHTML(sessionId: string, orderId: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment - Yuvsiksha</title>
    <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 400px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
        }
        .logo { font-size: 32px; font-weight: bold; color: #667eea; margin-bottom: 10px; }
        .subtitle { color: #666; margin-bottom: 30px; font-size: 14px; }
        .loader {
            width: 50px; height: 50px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 30px auto;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .status { color: #333; font-size: 16px; margin-top: 20px; }
        .error { background: #fee; border: 1px solid #fcc; border-radius: 8px; padding: 15px; margin-top: 20px; color: #c33; }
        .success { background: #efe; border: 1px solid #cfc; border-radius: 8px; padding: 15px; margin-top: 20px; color: #3c3; }
        .retry-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            margin-top: 15px;
            cursor: pointer;
            font-size: 14px;
        }
        #cashfree-container { margin-top: 20px; min-height: 400px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">Yuvsiksha</div>
        <div class="subtitle">Secure Payment Gateway</div>
        <div id="status-container">
            <div class="loader"></div>
            <div class="status">Initializing payment...</div>
        </div>
        <div id="cashfree-container"></div>
    </div>
    <script>
        const paymentSessionId = '${sessionId}';
        const orderId = '${orderId}';
        let initTimeout;
        
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const source = urlParams.get('source'); // 'mobile' or null (website)
        const isMobileApp = source === 'mobile';
        
        console.log('Payment page loaded with:', { paymentSessionId, orderId, source, isMobileApp });
        
        if (!paymentSessionId) {
            showError('Invalid payment link. Missing session ID.');
        } else {
            // Set timeout for initialization
            initTimeout = setTimeout(() => {
                console.error('Payment initialization timeout');
                handleRedirect('cancelled', 'Payment timeout');
            }, 15000); // 15 second timeout
            
            initializePayment();
        }
        
        // Redirect helper - handles both mobile app and website
        function handleRedirect(status, reason = '') {
            if (isMobileApp) {
                // Mobile app - use deep link
                if (status === 'success') {
                    window.location.href = \`yuvshiksha://payment-success?orderId=\${orderId}\`;
                } else {
                    window.location.href = \`yuvshiksha://payment-cancelled?orderId=\${orderId}\`;
                }
            } else {
                // Website - use web URL
                if (status === 'success') {
                    window.location.href = \`https://yuvsiksha.in/payment-success?orderId=\${orderId}\`;
                } else {
                    window.location.href = \`https://yuvsiksha.in/teacher-dashboard\`;
                }
            }
        }
        
        async function initializePayment() {
            try {
                console.log('Step 1: Checking Cashfree SDK...');
                
                // Check if Cashfree SDK is loaded
                if (typeof Cashfree === 'undefined') {
                    throw new Error('Cashfree SDK not loaded. Please check your internet connection.');
                }
                
                console.log('Step 2: Cashfree SDK loaded successfully');
                
                // Wait a bit for SDK to be fully ready
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                console.log('Step 3: Initializing Cashfree instance...');
                const cashfree = Cashfree({ mode: 'production' });
                
                console.log('Step 4: Creating checkout options...');
                const checkoutOptions = {
                    paymentSessionId: paymentSessionId,
                    redirectTarget: '_self'
                };
                
                console.log('Step 5: Opening Cashfree checkout...');
                document.getElementById('status-container').innerHTML = 
                    '<div class="status">Loading payment options...</div>';
                
                clearTimeout(initTimeout);
                
                cashfree.checkout(checkoutOptions).then((result) => {
                    console.log('Payment result:', result);
                    
                    if (result.error) {
                        console.error('Payment error:', result.error);
                        handleRedirect('cancelled', result.error.message);
                    }
                    
                    if (result.paymentDetails) {
                        console.log('Payment successful:', result.paymentDetails);
                        handleRedirect('success');
                    }
                }).catch((error) => {
                    console.error('Checkout error:', error);
                    handleRedirect('cancelled', error.message);
                });
                
            } catch (error) {
                clearTimeout(initTimeout);
                console.error('Payment initialization error:', error);
                handleRedirect('cancelled', error.message);
            }
        }
        
        // Handle page visibility change (when user switches apps)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('Page hidden - user may have switched apps');
            } else {
                console.log('Page visible again');
            }
        });
    </script>
</body>
</html>`;
}

export default router;