import { Router } from 'express';
import passport from 'passport';
import {
  register,
  login,
  googleLogin,
  forgotPassword,
  resetPassword,
  logout
} from '../controllers/auth-controller';

const router = Router();


router.post('/register', (req, res, next) => {
  console.log('Received registration data:', req.body);
  next();
}, register);
router.post('/login', login);
router.post('/google', googleLogin);

// Google OAuth routes for browser-based authentication
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'select_account'
}));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication
    // Redirect to mobile app or web app based on user agent
    const userAgent = req.headers['user-agent'] || '';

    if (userAgent.includes('Expo')) {
      // Mobile app - redirect to a deep link or show success page
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Login Successful</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 16px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              text-align: center;
            }
            h1 { color: #6d28d9; margin-bottom: 16px; }
            p { color: #6b7280; }
            .checkmark {
              width: 80px;
              height: 80px;
              border-radius: 50%;
              display: block;
              margin: 0 auto 20px;
              stroke-width: 3;
              stroke: #6d28d9;
              stroke-miterlimit: 10;
              box-shadow: inset 0 0 0 #6d28d9;
              animation: fill 0.4s ease-in-out 0.4s forwards, scale 0.3s ease-in-out 0.9s both;
            }
            @keyframes fill {
              100% { box-shadow: inset 0 0 0 30px #6d28d9; }
            }
            @keyframes scale {
              0%, 100% { transform: none; }
              50% { transform: scale3d(1.1, 1.1, 1); }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
              <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
            <h1>Login Successful!</h1>
            <p>You can close this window and return to the app.</p>
          </div>
          <script>
            // Auto-close after 2 seconds
            setTimeout(() => { window.close(); }, 2000);
          </script>
        </body>
        </html>
      `);
    } else {
      // Web app - redirect to dashboard
      res.redirect(process.env.FRONTEND_URL || 'https://yuvsiksha.in');
    }
  }
);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', logout);

export default router;