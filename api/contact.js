// For nodemailer v7+
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  console.log('📧 Contact API called - Nodemailer v7');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Checking environment variables...');
    console.log('EMAIL_USER exists:', !!process.env.EMAIL_USER);
    console.log('EMAIL_PASS exists:', !!process.env.EMAIL_PASS);
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('❌ Missing email credentials');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const { name, email, message } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    console.log('📝 Form data received:', { name, email, message: message?.substring(0, 50) + '...' });
    
    if (!name || !email || !message) {
      console.log('❌ Missing fields');
      return res.status(400).json({ error: 'All fields are required' });
    }

    console.log('🔧 Creating email transporter...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log('📨 Sending email...');
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: `New Contact Form Message from ${name} - NavAI`,
      text: `
New Contact Form Submission

Name: ${name}
Email: ${email}
Message:
${message}

Sent from NavAI contact form
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    
    res.json({ success: true, message: 'Message sent successfully!' });
    
  } catch (error) {
    console.error('❌ Email error:', error);
    res.status(500).json({ error: 'Failed to send message: ' + error.message });
  }
}
