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
  res.sendFile(path.join(__dirname, '../views/mobile-payment.html'));
});

export default router;