// import { Resend } from 'resend';
// import dotenv from 'dotenv';

// dotenv.config();

// const resend = new Resend(process.env.RESEND_API_KEY as string);

// export const sendEmail = async (to: string, subject: string, html: string) => {
//   try {
//     const { data, error } = await resend.emails.send({
//       from: process.env.EMAIL_FROM as string,
//       to,
//       subject,
//       html,
//     });

//     if (error) {
//       console.error('Email sending failed:', error);
//       throw new Error(error.message);
//     }

//     console.log('Email sent:', data);
//     return data;
//   } catch (err) {
//     console.error('Error in sendEmail:', err);
//     throw err;
//   }
// };

// src/utils/sendEmail.ts
import nodemailer from 'nodemailer';

// Mailtrap SMTP configuration
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "ed384b5610bea6", // Replace with yours
    pass: "90fc497147c1b5"  // Replace with yours
  }
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: '"Yuvshiksha" <no-reply@yuvshiksha.dev>', // Can be any fake sender
      to,
      subject,
      html,
    });
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info)); // View email in Mailtrap
    console.log("Email sent to Mailtrap. Check inbox manually."); // <-- Added message
    return info;
  } catch (err) {
    console.error("Error sending email:", err);
    throw err;
  }
};