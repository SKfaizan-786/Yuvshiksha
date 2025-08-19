import { Request, Response } from 'express';
import EmailOTP from '../models/EmailOTP';
import { sendEmail } from '../utils/sendEmail';

// Generate a 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP to email
export const sendOtpToEmail = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Upsert OTP for email
  await EmailOTP.findOneAndUpdate(
    { email },
    { otp, expiresAt, verified: false },
    { upsert: true, new: true }
  );


  // Send email (Mailtrap)
  await sendEmail(
    email,
    'Your OTP for Yuvshiksha Registration',
    `<p>Your OTP is: <b>${otp}</b>. It will expire in 5 minutes.</p>`
  );

  res.json({ message: 'OTP sent to email' });
};

// Verify OTP
export const verifyEmailOtp = async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

  const record = await EmailOTP.findOne({ email });
  if (!record) return res.status(400).json({ message: 'No OTP found for this email' });
  if (record.verified) return res.status(400).json({ message: 'Email already verified' });
  if (record.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired' });
  if (record.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

  record.verified = true;
  await record.save();
  res.json({ message: 'Email verified' });
};
