import express from 'express';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
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
router.get('/verify/:orderId', async (req, res) => {
    // Mobile app payment verification endpoint
    try {
        const { orderId } = req.params;
        console.log('🔍 Verifying payment for order:', orderId);

        const response = await axios.get(
            `${process.env.CASHFREE_BASE_URL}/orders/${orderId}`,
            {
                headers: {
                    'x-client-id': process.env.CASHFREE_APP_ID,
                    'x-client-secret': process.env.CASHFREE_SECRET_KEY,
                    'x-api-version': '2022-09-01',
                }
            }
        );

        const data: any = response.data;
        console.log('💳 Cashfree order status:', data?.order_status);

        res.json({
            success: true,
            status: data?.order_status || 'PENDING',
            message: data?.order_status === 'PAID' ? 'Payment successful' : 'Payment pending or failed',
            orderId: orderId
        });
    } catch (error: any) {
        console.error('❌ Payment verification error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            status: 'ERROR',
            message: 'Verification failed',
            error: error.response?.data || error.message
        });
    }
});
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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
            background: #f8f9fa;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px 32px;
            max-width: 440px;
            width: 100%;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .icon-wrapper {
            width: 80px;
            height: 80px;
            margin: 0 auto 24px;
            background: #f3f4f6;
            border-radius: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .icon-wrapper svg {
            width: 40px;
            height: 40px;
            color: #374151;
        }
        
        .title {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 8px;
        }
        
        .subtitle {
            color: #6b7280;
            font-size: 15px;
            font-weight: 500;
        }
        
        .status-container {
            text-align: center;
            padding: 32px 0;
        }
        
        .loader {
            width: 52px;
            height: 52px;
            border: 3px solid #e5e7eb;
            border-top: 3px solid #111827;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .status-text {
            color: #111827;
            font-size: 17px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .status-subtext {
            color: #6b7280;
            font-size: 14px;
            line-height: 1.6;
        }
        
        .security-badge {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-top: 32px;
            padding: 14px 18px;
            background: #f0fdf4;
            border-radius: 12px;
            border: 1px solid #bbf7d0;
        }
        
        .security-icon {
            width: 18px;
            height: 18px;
            color: #16a34a;
        }
        
        .security-text {
            color: #16a34a;
            font-size: 14px;
            font-weight: 600;
        }
        
        #cashfree-container {
            margin-top: 24px;
            min-height: 400px;
        }
        
        /* Mobile optimizations */
        @media (max-width: 480px) {
            body {
                padding: 16px;
            }
            
            .container {
                padding: 32px 24px;
            }
            
            .title {
                font-size: 22px;
            }
            
            .icon-wrapper {
                width: 72px;
                height: 72px;
            }
            
            .icon-wrapper svg {
                width: 36px;
                height: 36px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="icon-wrapper">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                </svg>
            </div>
            <div class="title">Processing Payment</div>
            <div class="subtitle">Opening secure payment gateway...</div>
        </div>
        
        <div id="status-container" class="status-container">
            <div class="loader"></div>
            <div class="status-text">Initializing Payment</div>
            <div class="status-subtext">Please wait while we prepare your secure payment...</div>
        </div>
        
        <div class="security-badge">
            <svg class="security-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span class="security-text">256-bit SSL Encrypted</span>
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