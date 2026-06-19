import nodemailer from 'nodemailer';

const REQUIRED_FIELDS = ['to', 'subject', 'message'];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getRequestBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const emailConfigured = Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
  if (!emailConfigured) {
    return res.status(503).json({
      error: 'Email service is not configured',
      required: ['GMAIL_USER', 'GMAIL_APP_PASSWORD']
    });
  }

  const body = getRequestBody(req);
  const { to, subject, message, tenantName, tenant_name: tenantNameFallback, property } = body;
  const missing = REQUIRED_FIELDS.filter(field => !String(body[field] || '').trim());
  if (missing.length) {
    return res.status(400).json({ error: 'Missing required fields', required: REQUIRED_FIELDS });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return res.status(400).json({ error: 'Invalid email address format' });
  }

  const displayTenantName = tenantName || tenantNameFallback;
  const safeSubject = escapeHtml(subject);
  const safeTenantName = displayTenantName ? escapeHtml(displayTenantName) : '';
  const safeProperty = property ? escapeHtml(property) : '';
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  try {
    const info = await transporter.sendMail({
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
    });

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Email sending error:', error.message);
    return res.status(500).json({
      error: 'Failed to send email',
      details: error.message
    });
  }
}
