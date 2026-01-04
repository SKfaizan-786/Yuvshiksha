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

// Inline HTML template - MOBILE-SAFE VERSION
function getPaymentHTML(sessionId: string, orderId: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Secure Payment - Yuvsiksha</title>
<script src="https://sdk.cashfree.com/js/ui/checkout.js"></script>
<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}
#payment-container {
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
}
.loader {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #111;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.loader-text {
  color: #111;
  font-size: 16px;
  font-weight: 600;
}
</style>
</head>
<body>
<div id="payment-container">
  <div class="loader">
    <div class="spinner"></div>
    <div class="loader-text">Loading payment...</div>
  </div>
</div>

<script>
const SESSION_ID = "${sessionId}";
const ORDER_ID = "${orderId}";

console.log("🔧 Initializing mobile-safe Cashfree checkout");
console.log("📦 Session ID:", SESSION_ID);
console.log("🆔 Order ID:", ORDER_ID);

// Check if running in mobile app
const urlParams = new URLSearchParams(window.location.search);
const isMobileApp = urlParams.get('source') === 'mobile';

// Initialize Cashfree (mobile-safe method)
Cashfree.init({ mode: "production" });

// Start checkout (mobile-safe method)
Cashfree.checkout({
  paymentSessionId: SESSION_ID,
  redirectTarget: "_self",
  onSuccess: function(data) {
    console.log("✅ Payment successful:", data);
    if (isMobileApp) {
      window.location.href = \`yuvshiksha://payment-success?orderId=\${ORDER_ID}\`;
    } else {
      window.location.href = \`https://yuvsiksha.in/payment-success?orderId=\${ORDER_ID}\`;
    }
  },
  onFailure: function(data) {
    console.log("❌ Payment failed:", data);
    if (isMobileApp) {
      window.location.href = \`yuvshiksha://payment-cancelled?orderId=\${ORDER_ID}\`;
    } else {
      window.location.href = \`https://yuvsiksha.in/teacher-dashboard\`;
    }
  },
  onClose: function() {
    console.log("🚪 Payment window closed");
    if (isMobileApp) {
      window.location.href = \`yuvshiksha://payment-cancelled?orderId=\${ORDER_ID}\`;
    } else {
      window.location.href = \`https://yuvsiksha.in/teacher-dashboard\`;
    }
  }
});
</script>
</body>
</html>`;
}

export default router;