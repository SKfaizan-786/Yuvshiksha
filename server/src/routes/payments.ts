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
            min-height: 10vh;
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
        
        if (!paymentSessionId) {
            document.getElementById('status-container').innerHTML = '<div class="error">Invalid payment link. Missing session ID.</div>';
        } else {
            initializePayment();
        }
        
        async function initializePayment() {
            try {
                console.log('Initializing Cashfree with session:', paymentSessionId);
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const cashfree = Cashfree({ mode: 'production' });
                const checkoutOptions = {
                    paymentSessionId: paymentSessionId,
                    redirectTarget: '_self'
                };
                
                console.log('Opening Cashfree checkout...');
                document.getElementById('status-container').style.display = 'none';
                
                cashfree.checkout(checkoutOptions).then((result) => {
                    console.log('Payment result:', result);
                    
                    if (result.error) {
                        console.error('Payment error:', result.error);
                        showError(result.error.message || 'Payment failed');
                        setTimeout(() => {
                            window.location.href = \`yuvshiksha://payment-failed?orderId=\${orderId}&reason=\${encodeURIComponent(result.error.message || 'Payment failed')}\`;
                        }, 2000);
                    }
                    
                    if (result.paymentDetails) {
                        console.log('Payment successful:', result.paymentDetails);
                        showSuccess();
                        setTimeout(() => {
                            window.location.href = \`yuvshiksha://payment-success?orderId=\${orderId}\`;
                        }, 1500);
                    }
                });
            } catch (error) {
                console.error('Payment initialization error:', error);
                showError(error.message || 'Failed to initialize payment');
                setTimeout(() => {
                    window.location.href = \`yuvshiksha://payment-failed?orderId=\${orderId}&reason=\${encodeURIComponent(error.message)}\`;
                }, 2000);
            }
        }
        
        function showError(message) {
            document.getElementById('status-container').style.display = 'block';
            document.getElementById('status-container').innerHTML = \`<div class="error"><strong>Payment Failed</strong><br>\${message}</div>\`;
        }
        
        function showSuccess() {
            document.getElementById('status-container').style.display = 'block';
            document.getElementById('status-container').innerHTML = '<div class="success"><strong>✓ Payment Successful!</strong><br>Redirecting back to app...</div>';
        }
    </script>
</body>
</html>`;
}

export default router;