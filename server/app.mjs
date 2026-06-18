import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import propertiesRouter from './routes/properties.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 3000);

dotenv.config({ path: path.join(PROJECT_ROOT, '.env') });

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(PROJECT_ROOT));

const emailConfigured = Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);

const transporter = emailConfigured
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    })
  : null;

if (transporter) {
  transporter.verify((error) => {
    if (error) {
      console.error('Email transporter configuration error:', error.message);
    } else {
      console.log('Email server ready to send messages');
    }
  });
} else {
  console.warn('Email is disabled until GMAIL_USER and GMAIL_APP_PASSWORD are set in .env');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'dwello-api',
    emailConfigured
  });
});

app.use('/api/properties', propertiesRouter);

app.post('/api/send-email', async (req, res) => {
  if (!transporter) {
    return res.status(503).json({
      error: 'Email service is not configured',
      required: ['GMAIL_USER', 'GMAIL_APP_PASSWORD']
    });
  }

  const { to, subject, message, tenantName, tenant_name: tenantNameFallback, property } = req.body;
  const displayTenantName = tenantName || tenantNameFallback;

  if (!to || !subject || !message) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['to', 'subject', 'message']
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return res.status(400).json({ error: 'Invalid email address format' });
  }

  const safeSubject = escapeHtml(subject);
  const safeTenantName = displayTenantName ? escapeHtml(displayTenantName) : '';
  const safeProperty = property ? escapeHtml(property) : '';
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

  const mailOptions = {
    from: `"Dwello Support" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${safeSubject}</h2>
        ${safeTenantName ? `<p><strong>To:</strong> ${safeTenantName}</p>` : ''}
        <div style="margin: 20px 0; line-height: 1.6;">${safeMessage}</div>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">Sent from <strong>Dwello Property Management</strong></p>
        ${safeProperty ? `<p style="color: #666; font-size: 12px;">Property: ${safeProperty}</p>` : ''}
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Email sending error:', error.message);
    res.status(500).json({
      error: 'Failed to send email',
      details: error.message
    });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(PROJECT_ROOT, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Dwello app running at http://localhost:${PORT}`);
  console.log(`API health check: http://localhost:${PORT}/api/health`);
});
