
import dotenv from 'dotenv';
dotenv.config();

// Use Resend API for transactional emails
export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM || 'Yuvshiksha <no-reply@yuvshiksha.dev>';
    if (!apiKey) throw new Error('RESEND_API_KEY not set');

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html
      })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Resend email failed');
    }
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email sent via Resend successfully!');
      console.log(`📬 Check your Resend dashboard for: ${subject}`);
      if (data && data.id) {
        console.log('Resend Message ID:', data.id);
      }
    }
    return data;
  } catch (error) {
    console.error('Error sending email via Resend:', error);
    throw new Error('Email could not be sent');
  }
};