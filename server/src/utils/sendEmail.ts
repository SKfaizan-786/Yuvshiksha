import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io',
  port: parseInt(process.env.MAILTRAP_PORT || '2525'),
  auth: {
    user: process.env.MAILTRAP_USERNAME,
    pass: process.env.MAILTRAP_PASSWORD,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Yuvshiksha <no-reply@yuvshiksha.dev>',
      to: to,
      subject: subject,
      html: html
    });
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email sent to Mailtrap successfully!');
      console.log(`📬 Check your Mailtrap inbox for: ${subject}`);
      if (info && info.messageId) {
        console.log('Message ID:', info.messageId);
      }
    }
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Email could not be sent');
  }
};