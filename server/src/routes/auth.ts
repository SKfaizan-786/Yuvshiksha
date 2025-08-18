import { Router } from 'express';
import { 
  register, 
  login, 
  googleLogin,
  forgotPassword,
  resetPassword
} from '../controllers/auth-controller';

const router = Router();

router.post('/register', (req, res, next) => {
  console.log('Received registration data:', req.body);
  next();
}, register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;