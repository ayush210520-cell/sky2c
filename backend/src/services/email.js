/**
 * Email service – sends status update emails via Nodemailer.
 * Configure EMAIL_* in .env (e.g. Gmail with App Password).
 */
import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) {
    console.warn('EMAIL_USER or EMAIL_PASS not set – emails will not be sent');
    return null;
  }
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

/**
 * Build tracking URL for customer (frontend tracking page).
 */
function getTrackingUrl(shipmentNumber) {
  const base = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  return `${base}/track/${encodeURIComponent(shipmentNumber)}`;
}

/**
 * Send status update email to customer.
 * @param {Object} params
 * @param {string} params.customerEmail
 * @param {string} params.shipmentNumber
 * @param {string} params.currentStatus
 * @param {string} params.currentLocationName
 * @param {string} params.assignedTo
 */
export async function sendStatusUpdateEmail({
  customerEmail,
  shipmentNumber,
  currentStatus,
  currentLocationName,
  assignedTo,
}) {
  const transport = getTransporter();
  if (!transport) return { sent: false, error: 'Email not configured' };

  const trackingLink = getTrackingUrl(shipmentNumber);
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a365d; color: white; padding: 16px; border-radius: 8px 8px 0 0; }
    .content { background: #f7fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 8px 12px 8px 0; color: #4a5568; }
    td { padding: 8px 12px 8px 0; }
    .btn { display: inline-block; background: #3182ce; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px; }
    .footer { margin-top: 24px; font-size: 12px; color: #718096; }
  </style>
</head>
<body>
  <div class="header">
    <h2 style="margin: 0;">Shipment Status Update</h2>
  </div>
  <div class="content">
    <p>Your shipment status has been updated.</p>
    <table>
      <tr><th>Shipment Number</th><td><strong>${escapeHtml(shipmentNumber)}</strong></td></tr>
      <tr><th>Current Status</th><td>${escapeHtml(currentStatus)}</td></tr>
      <tr><th>Current Location</th><td>${escapeHtml(currentLocationName || '—')}</td></tr>
      <tr><th>Assigned To</th><td>${escapeHtml(assignedTo || '—')}</td></tr>
    </table>
    <p>
      <a class="btn" href="${escapeHtml(trackingLink)}">Track Shipment</a>
    </p>
    <p class="footer">You received this email because you are the registered customer for this shipment.</p>
  </div>
</body>
</html>
  `.trim();

  const text = `
Shipment Status Update

Shipment Number: ${shipmentNumber}
Current Status: ${currentStatus}
Current Location: ${currentLocationName || '—'}
Assigned To: ${assignedTo || '—'}

Track your shipment: ${trackingLink}
  `.trim();

  try {
    await transport.sendMail({
      from,
      to: customerEmail,
      subject: `Shipment ${shipmentNumber} – ${currentStatus}`,
      text,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error('Email send error:', err);
    return { sent: false, error: err.message };
  }
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
