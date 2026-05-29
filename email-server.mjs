import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create Gmail transporter
// Note: Requires Gmail App Password (not regular password)
// Generate at: https://myaccount.google.com/apppasswords
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Verify transporter configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter configuration error:', error);
  } else {
    console.log('Email server ready to send messages');
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'dwello-email-api' });
});

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
  const { to, subject, message, tenantName, property } = req.body;

  // Validate required fields
  if (!to || !subject || !message) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['to', 'subject', 'message']
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return res.status(400).json({ error: 'Invalid email address format' });
  }

  // Configure email options
  const mailOptions = {
    from: `"Dwello Support" <${process.env.GMAIL_USER}>`,
    to: to,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${subject}</h2>
        ${tenantName ? `<p><strong>To:</strong> ${tenantName}</p>` : ''}
        <div style="margin: 20px 0; line-height: 1.6;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          Sent from <strong>Dwello Property Management</strong>
        </p>
        ${property ? `<p style="color: #666; font-size: 12px;">Property: ${property}</p>` : ''}
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({
      error: 'Failed to send email',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Email API server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
