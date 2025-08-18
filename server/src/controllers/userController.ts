import { Request, Response } from 'express';
import { sendEmail } from '../utils/sendEmail';

export const registerUser = async (req: Request, res: Response) => {
  const { name, email } = req.body;

  try {
    // Do your registration logic here...

    await sendEmail(
      email,
      'Welcome to Yuvshiksha!',
      `<h2>Hi ${name},</h2><p>Thanks for joining Yuvshiksha!</p>`
    );

    res.status(200).json({ message: 'Registration successful and email sent' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};
