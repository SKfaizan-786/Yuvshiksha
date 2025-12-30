import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import User from '../models/User';
import { sendEmail } from '../utils/sendEmail';
import { IUser } from '../models/User';

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
    const { email, password, role, firstName, lastName, gender, maritalStatus } = req.body;

    if (!email || !password || !role || !firstName || !lastName || (role === 'teacher' && !maritalStatus)) {
      return res.status(400).json({
        message: 'Email, password, role, first name, last name, and marital status (for teachers) are required',
        missingFields: {
          email: !email,
          password: !password,
          role: !role,
          firstName: !firstName,
          lastName: !lastName,
          maritalStatus: role === 'teacher' && !maritalStatus
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

    let userData: any = { email, password, role, firstName, lastName };
    if (role === 'teacher') {
      userData.teacherProfile = { gender, maritalStatus };
    }
    const user = await User.create(userData);

    const token = generateToken({ _id: user._id });

    // Set the JWT as an httpOnly cookie (for web)
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: '.yuvshiksha.in',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(201).json({
      message: 'User registered successfully',
      token, // Return token in response for mobile app
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profileComplete: user.profileComplete
      },
    });
  } catch (err) {
    console.error('Register error:', err);

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

    // Check if user exists
    if (!user) {
      return res.status(401).json({ message: 'Email not registered. Please sign up first' });
    }

    // Check if password is correct
    if (!(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = generateToken({ _id: user._id });

    // Set the JWT as an httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(200).json({
      message: 'Successfully logged in',
      token, // Return token in response for mobile app
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profileComplete: user.profileComplete,
      },
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
      return res.status(401).json({ message: 'You are not registered. Please sign up first.' });
    }

    const token = generateToken({ _id: user._id });

    // Set the JWT as an httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(200).json({
      token, // Return token in response for mobile app
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
      return res.status(200).json({ message: 'If an account exists, a password reset email has been sent' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetUrl = `${process.env.BASE_URL}/reset-password/${resetToken}`;

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


// Logout: clear the auth cookie
export const logout = (req: Request, res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: process.env.COOKIE_DOMAIN || undefined // set if needed
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

export default {
  register,
  login,
  googleLogin,
  forgotPassword,
  resetPassword,
  logout
};