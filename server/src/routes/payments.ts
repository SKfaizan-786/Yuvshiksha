import express from 'express';
import path from 'path';
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
  // Use absolute path from project root
  const htmlPath = path.resolve(__dirname, '../views/mobile-payment.html');
  console.log('📄 Attempting to serve mobile payment page from:', htmlPath);
  console.log('📍 Current __dirname:', __dirname);

  res.sendFile(htmlPath, (err) => {
    if (err) {
      console.error('❌ Error serving mobile payment page:', err);
      res.status(500).send('Error loading payment page');
    } else {
      console.log('✅ Successfully served mobile payment page');
    }
  });
});

export default router;