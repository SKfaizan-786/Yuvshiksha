import { Router } from 'express';
import { sendOtpToEmail, verifyEmailOtp } from '../controllers/email-otp-controller';

const router = Router();

router.post('/send-otp', sendOtpToEmail);
router.post('/verify-otp', verifyEmailOtp);

export default router;
