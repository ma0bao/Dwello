import 'dotenv/config';
import express from 'express';
import { Resend } from 'resend';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { rateLimit } from 'express-rate-limit';

import propertiesRouter from './routes/properties.mjs';
import profileRouter from './routes/profile.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 3000);

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(PROJECT_ROOT));

// Global API limiter: 60 req/min per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' }
});

// Tight limiter for auth-sensitive endpoints: 5 req/min per IP
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please wait a minute.' }
});

app.use('/api', apiLimiter);
app.use('/api/profile', authLimiter);

const emailConfigured = Boolean(process.env.RESEND_API_KEY);
const resend = emailConfigured ? new Resend(process.env.RESEND_API_KEY) : null;

if (emailConfigured) {
  console.log('Email service ready with Resend');
} else {
  console.warn('Email is disabled until RESEND_API_KEY is set in .env');
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

app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY
  });
});

app.use('/api/properties', propertiesRouter);
app.use('/api/profile', profileRouter);

app.post('/api/send-email', async (req, res) => {
  if (!resend) {
    return res.status(503).json({
      error: 'Email service is not configured',
      required: ['RESEND_API_KEY']
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

  try {
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Dwello <onboarding@resend.dev>',
      to: [to],
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
    });

    console.log('Resend response:', JSON.stringify(data, null, 2));

    if (data.error) {
      console.error('Resend API error:', data.error);
      const isDomainError = data.error.message?.includes('verify a domain');
      return res.status(isDomainError ? 403 : 500).json({
        error: 'Failed to send email',
        details: data.error.message || 'Unknown error from Resend',
        hint: isDomainError
          ? 'Resend requires domain verification. For testing, send to your Resend signup email, or verify a domain at resend.com/domains'
          : undefined
      });
    }

    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: data.id || data.data?.id
    });
  } catch (error) {
    console.error('Email sending error:', error);
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
