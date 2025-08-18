import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import User from '../models/User';
import { sendEmail } from '../utils/sendEmail';

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Utils: Generate JWT
const generateToken = (payload: object) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not defined');
  const expiresIn = process.env.JWT_EXPIRE || '30d';
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

// Register
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, role, firstName, lastName } = req.body;

    if (!email || !password || !role || !firstName || !lastName) {
      return res.status(400).json({
        message: 'Email, password, role, first name and last name are required',
        missingFields: {
          email: !email,
          password: !password,
          role: !role,
          firstName: !firstName,
          lastName: !lastName
        }
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists',
        email: existingUser.email
      });
    }

    const user = await User.create({ email, password, role, firstName, lastName });

    const token = generateToken({ _id: user._id });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profileComplete: user.profileComplete
      },
      token
    });
  } catch (err) {
    console.error('Register error:', err);

    // More detailed error response
    const errorResponse: any = {
      message: 'Server error during registration'
    };

    if (err instanceof Error) {
      errorResponse.error = err.message;
      if (err.name === 'ValidationError') {
        errorResponse.details = (err as any).errors;
      }
    }

    res.status(500).json(errorResponse);
  }
};

// Login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({ _id: user._id });

    res.status(200).json({
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profileComplete: user.profileComplete,
      },
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Google Login
export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ message: 'Invalid Google token' });
    }

    const { email, given_name, family_name, picture, sub } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        firstName: given_name,
        lastName: family_name,
        avatar: picture,
        googleId: sub,
        role: 'student',
        password: crypto.randomBytes(16).toString('hex'),
      });
    }

    const token = generateToken({ _id: user._id });

    res.status(200).json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profileComplete: user.profileComplete,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(500).json({ message: 'Google authentication failed' });
  }
};

// Forgot Password
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return res.status(200).json({ message: 'If an account exists, a password reset email has been sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set token and expiry (1 hour from now)
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    // Create reset URL - using your frontend URL
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    // Email content
    const subject = 'Yuvshiksha Password Reset';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6d28d9;">Password Reset Request</h2>
        <p>You requested a password reset for your Yuvshiksha account.</p>
        <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
        <a href="${resetUrl}" 
           style="display: inline-block; padding: 10px 20px; background-color: #6d28d9; color: white; text-decoration: none; border-radius: 8px; margin: 15px 0;">
           Reset Password
        </a>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="font-size: 12px; color: #6b7280; word-break: break-all;">${resetUrl}</p>
      </div>
    `;

    // Send email using Resend
    await sendEmail(email, subject, html);

    res.status(200).json({ message: 'Password reset email sent' });
  } catch (err) {
    console.error('Forgot password error:', err);
    const errorMessage =
      process.env.NODE_ENV === 'development' && err instanceof Error
        ? err.message
        : undefined;
    res.status(500).json({
      message: 'Failed to process password reset request',
      error: errorMessage
    });
  }
};

// Reset Password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    // Hash the token to compare with DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

export default {
  register,
  login,
  googleLogin,
  forgotPassword,
  resetPassword
};