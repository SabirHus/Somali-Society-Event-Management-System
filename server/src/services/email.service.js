import { Resend } from 'resend';
import QRCode from 'qrcode';
import logger from '../utils/logger.js';

const resend = new Resend(process.env.RESEND_API_KEY);

// Define your social media links here
const INSTAGRAM_URL = 'https://www.instagram.com/'; // Replace with the actual link
const WHATSAPP_GC_URL = 'https://chat.whatsapp.com/Ba1DrDXZpRo3N4aWrcV6rl'; // Replace with the actual link

async function generateQRCodeBuffer(text) {
  try {
    const buffer = await QRCode.toBuffer(text, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return buffer;
  } catch (error) {
    logger.error('Failed to generate QR code', { error: error.message });
    throw error;
  }
}

export async function sendOrderEmail({ email, name, code, quantity, amount, location, eventName }) {
  try {
    const qrCodeBuffer = await generateQRCodeBuffer(code);

    const { data, error } = await resend.emails.send({
      from: process.env.MAIL_FROM || 'Somali Society Salford <tickets@somsocsal.com>',
      to: email,
      subject: `✅ ${eventName} - Ticket Confirmation`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #003B73 0%, #0074D9 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              background: #f8f9fa;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .ticket-info {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #0074D9;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #e9ecef;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: 600;
              color: #003B73;
            }
            .value {
              color: #495057;
            }
            .booking-code {
              background: #003B73;
              color: white;
              padding: 15px;
              text-align: center;
              border-radius: 8px;
              font-size: 24px;
              font-weight: bold;
              letter-spacing: 2px;
              margin: 20px 0;
            }
            .qr-notice {
              background: #e3f2fd;
              border-left: 4px solid #0074D9;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #6c757d;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Booking Confirmed!</h1>
            <p>${eventName}</p>
          </div>
          
          <div class="content">
            <p>Hi ${name},</p>
            <p>Thank you for registering! Your booking has been confirmed.</p>
            
            <div class="booking-code">
              ${code}
            </div>
            
            <div class="ticket-info">
              <div class="info-row">
                <span class="label">Event:</span>
                <span class="value">${eventName}</span>
              </div>
              <div class="info-row">
                <span class="label">Location:</span>
                <span class="value">${location}</span>
              </div>
              <div class="info-row">
                <span class="label">Booking Code:</span>
                <span class="value">${code}</span>
              </div>
              <div class="info-row">
                <span class="label">Tickets:</span>
                <span class="value">${quantity}</span>
              </div>
              <div class="info-row">
                <span class="label">Total Paid:</span>
                <span class="value">£${amount.toFixed(2)}</span>
              </div>
            </div>
            
            <div class="qr-notice">
              <strong>📱 QR Code Attached</strong>
              <p style="margin: 10px 0 0 0;">Your QR code ticket is attached to this email. Download it and show it at the event entrance for quick check-in!</p>
            </div>
            
            <h3>What to bring:</h3>
            <ul>
              <li>✅ The attached QR code (printed or on your phone)</li>
              <li>✅ Your booking code: <strong>${code}</strong></li>
            </ul>
            
            <h3>Need Help?</h3>
            <p>For more information, check out our social media:</p>
<div class="social-links" style="margin-top: 15px;">
    <a href="${INSTAGRAM_URL}" target="_blank" style="text-decoration: none; color: #0074D9; display: inline-flex; align-items: center; font-weight: 500;">
        <img src="/.instagram.png"" alt="Instagram" style="width: 24px; height: 24px; margin-right: 8px;">
        Check our Instagram
    </a>
    <a href="${WHATSAPP_GC_URL}" target="_blank" style="text-decoration: none; color: #0074D9; display: inline-flex; align-items: center; font-weight: 500;">
        <img src="/.whatsapp.png" alt="WhatsApp" style="width: 24px; height: 24px; margin-right: 8px;">
        Join The WhatsApp Group
    </a>
          </div>
          
          <div class="footer">
            <p>© 2025 Somali Society Salford. All rights reserved.</p>
            <p style="font-size: 12px; color: #adb5bd;">
              This is an automated confirmation email. Please do not reply.
            </p>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `ticket-${code}.png`,
          content: qrCodeBuffer,
        }
      ]
    });

    if (error) {
      throw error;
    }

    logger.info('Confirmation email sent', {
      email,
      messageId: data?.id,
      code
    });

    return data;
  } catch (error) {
    logger.error('Failed to send order confirmation email', {
      error: error.message,
      email,
      code
    });
    throw error;
  }
}

export async function sendPasswordResetEmail({ email, name, resetUrl }) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.MAIL_FROM || 'Somali Society Salford <noreply@somsocsal.com>',
      to: email,
      subject: 'Password Reset Request - Somali Society Salford',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #0074D9;
              color: white !important;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .warning {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 12px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Password Reset Request</h2>
            <p>Hi ${name},</p>
            <p>We received a request to reset your password for your Somali Society Salford admin account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul>
                <li>This link expires in 1 hour</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Never share this link with anyone</li>
              </ul>
            </div>
            <p>Or copy and paste this URL into your browser:</p>
            <p style="word-break: break-all; color: #0074D9;">${resetUrl}</p>
            <div class="footer">
              <p>This is an automated email from Somali Society Salford.</p>
              <p>If you need help, please contact support.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      throw error;
    }

    logger.info('Password reset email sent', {
      email,
      messageId: data?.id
    });

    return data;
  } catch (error) {
    logger.error('Failed to send password reset email', {
      error: error.message,
      email
    });
    throw error;
  }
}