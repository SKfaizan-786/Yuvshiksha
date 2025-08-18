import express from 'express';
import {
  createCashfreeOrder,
  verifyPayment,
  getPaymentStatus
} from '../controllers/payment-controller';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleCheck';

const router = express.Router();


// Create Cashfree order
router.post('/cashfree-order', createCashfreeOrder);

// Verify payment (for PaymentSuccess.jsx)
router.post('/verify', verifyPayment);

// Poll payment status
router.get('/status', getPaymentStatus);

export default router;
