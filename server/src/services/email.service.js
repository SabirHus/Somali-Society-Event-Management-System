// server/src/services/email.service.js - Email and PDF Ticket Generation

import { Resend } from 'resend';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import logger from '../utils/logger.js';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// --- Internal Helpers ---

/** * Generates a PDF ticket containing event details and a QR code.
 * Returns the PDF as a Buffer.
 */
async function generateTicketPDF({ name, eventName, eventDate, eventTime, location, code,}) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Generate QR code buffer (data to be scanned)
      const qrBuffer = await QRCode.toBuffer(code, {
        errorCorrectionLevel: 'H',
        width: 300,
        margin: 1
      });

      // Format date for PDF display
      const formattedDate = new Date(eventDate).toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // --- PDF Layout ---
      doc.fontSize(28).fillColor('#0074D9').text('Somali Society', 50, 50);
      doc.fontSize(12).fillColor('#666').text('Salford', 50, 82);
      
      // Vertical line separator
      doc.moveTo(400, 50).lineTo(400, 550).strokeColor('#0074D9').lineWidth(3).stroke();
      
      // Event Info
      doc.fontSize(22).fillColor('#003B73').text(eventName, 50, 130, { width: 330 });
      
      // Detail Sections
      doc.fontSize(12).fillColor('#666').text('Date/Time', 50, 200);
      doc.fontSize(11).fillColor('#000').text(`${formattedDate} ${eventTime}`, 50, 220);
      
      doc.fontSize(12).fillColor('#666').text('Location', 50, 260);
      doc.fontSize(11).fillColor('#000').text(location, 50, 280);
      
      doc.fontSize(12).fillColor('#666').text('Name', 50, 320);
      doc.fontSize(13).fillColor('#000').text(name, 50, 340);
      
      // Booking Code (Right side)
      doc.fontSize(12).fillColor('#666').text('Booking Code', 420, 120);
      doc.fontSize(14).fillColor('#003B73').text(code, 420, 140, { width: 130 });
      
      // QR Code
      doc.image(qrBuffer, 95, 390, { width: 240, height: 240 });
      
      // Footer/Branding
      doc.fontSize(14).fillColor('#0074D9').text(`SOMSOC ${eventName}`, 50, 650, { align: 'center', width: 500 });
      
      doc.fontSize(9).fillColor('#999').text(
        'Somali Society Salford | Registered Student Society',
        50,
        720,
        { align: 'center', width: 500 }
      );
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// --- Public Service Functions ---

/** * Sends order confirmation email with a table-based HTML body and PDF ticket attachment.
 * @param {object} details - Booking and attendee details.
 * @param {Array} attendees - Array of attendee objects (for multi-ticket support)
 */
export async function sendOrderEmail({ email, name, code, quantity, amount, location, eventName, eventDate, eventTime, attendees }) {
  try {
    // 1. Generate PDF tickets - one per attendee
    const attachments = [];
    
    if (attendees && attendees.length > 0) {
      // Generate PDF for each attendee
      for (let i = 0; i < attendees.length; i++) {
        const attendee = attendees[i];
        const pdfBuffer = await generateTicketPDF({
          name: attendee.name,
          eventName,
          eventDate,
          eventTime,
          location,
          code: attendee.code,
        });
        
        attachments.push({
          filename: `ticket-${attendee.code}.pdf`,
          content: pdfBuffer,
        });
      }
    } else {
      // Fallback: single ticket (backward compatibility)
      const pdfBuffer = await generateTicketPDF({
        name,
        eventName,
        eventDate,
        eventTime,
        location,
        code,
      });
      
      attachments.push({
        filename: `ticket-${code}.pdf`,
        content: pdfBuffer,
      });
    }
    
    // 2. Format details for email body
    const formattedDate = new Date(eventDate).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const formattedAmount = `£${amount.toFixed(2)}`;
    const defaultFrom = `Somali Soc Tickets <tickets@somsocsal.com>`;
    const ticketCount = attendees ? attendees.length : quantity;

    // 3. Send email via Resend
    const { data, error } = await resend.emails.send({
      from: process.env.MAIL_FROM || defaultFrom, 
      to: email,
      subject: `✅ ${eventName} - Ticket Confirmation`,
      headers: {
          // List-Unsubscribe header for better deliverability with Microsoft/Google
          'List-Unsubscribe': `<mailto:somsocsalford@gmail.com?subject=Unsubscribe from SomaliSoc Tickets>, <${process.env.APP_URL || 'https://somsocsal.com'}/unsubscribe>`
      },
      attachments: attachments,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            /* Reset styles and essential mobile-first CSS */
            body, table, td, p, a, li, blockquote {
                margin: 0;
                padding: 0;
                border-collapse: collapse;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                color: #333333;
                line-height: 1.5;
            }
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
            }
            .header {
                background: linear-gradient(135deg, #003B73 0%, #0074D9 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0 0 10px 0;
                font-size: 28px;
                font-weight: 700;
            }
            .content {
                padding: 40px 30px;
            }
            .greeting {
                font-size: 16px;
                color: #333;
                margin: 0 0 20px 0;
            }
            .booking-code-box {
                background: #003B73;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 8px;
                margin: 30px 0;
            }
            .booking-code-label {
                font-size: 14px;
                opacity: 0.9;
                margin: 0 0 8px 0;
            }
            .booking-code {
                font-size: 32px;
                font-weight: 700;
                letter-spacing: 3px;
                margin: 0;
            }
            .info-box-table {
                background: #f8f9fa;
                border-left: 4px solid #0074D9;
                padding: 20px;
                margin: 20px 0;
                border-radius: 4px;
                width: 100%;
            }
            .info-row td {
                padding: 8px 0;
                border-bottom: 1px solid #dee2e6;
            }
            .info-row:last-child td {
                border-bottom: none;
            }
            .info-label {
                font-weight: 600;
                color: #495057;
                width: 30%;
                text-align: left;
            }
            .info-value {
                color: #212529;
                text-align: right;
            }
            .notice-box {
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 20px;
                margin: 20px 0;
                border-radius: 4px;
            }
            .footer {
                background: #f8f9fa;
                padding: 30px;
                text-align: center;
                color: #6c757d;
                font-size: 14px;
            }
            .footer a {
                color: #0074D9;
                text-decoration: none;
            }
          </style>
        </head>
        <body>
          <center>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="center">
                <div class="email-container">
                  <!-- Header -->
                  <div class="header">
                    <h1>&#x1F389; Booking Confirmed!</h1>
                    <p>${eventName}</p>
                  </div>
                  
                  <!-- Content -->
                  <div class="content">
                    <p class="greeting">Hi ${name},</p>
                    <p class="greeting">Thank you for registering! Your booking has been confirmed. Your ticket is attached.</p>
                    
                    <!-- Booking Code -->
                    <div class="booking-code-box" style="background: #003B73; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 30px 0;">
                      <p class="booking-code-label" style="font-size: 14px; opacity: 0.9; margin: 0 0 8px 0;">Your Booking Code</p>
                      <p class="booking-code" style="font-size: 32px; font-weight: 700; letter-spacing: 3px; margin: 0;">${code}</p>
                    </div>
                    
                    <!-- Event Details (Table structure for maximum compatibility) -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="info-box-table" style="background: #f8f9fa; border-left: 4px solid #0074D9; padding: 20px; margin: 20px 0; border-radius: 4px;">
                      <tr>
                        <td style="padding: 0;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                            
                            <tr class="info-row">
                              <td class="info-label" style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-weight: 600; color: #495057; width: 30%; text-align: left;">Event:</td>
                              <td class="info-value" style="padding: 8px 0; border-bottom: 1px solid #dee2e6; color: #212529; text-align: right;">${eventName}</td>
                            </tr>
                            <tr class="info-row">
                              <td class="info-label" style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-weight: 600; color: #495057; width: 30%; text-align: left;">Date:</td>
                              <td class="info-value" style="padding: 8px 0; border-bottom: 1px solid #dee2e6; color: #212529; text-align: right;">${formattedDate}</td>
                            </tr>
                            <tr class="info-row">
                              <td class="info-label" style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-weight: 600; color: #495057; width: 30%; text-align: left;">Time:</td>
                              <td class="info-value" style="padding: 8px 0; border-bottom: 1px solid #dee2e6; color: #212529; text-align: right;">${eventTime}</td>
                            </tr>
                            <tr class="info-row">
                              <td class="info-label" style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-weight: 600; color: #495057; width: 30%; text-align: left;">Location:</td>
                              <td class="info-value" style="padding: 8px 0; border-bottom: 1px solid #dee2e6; color: #212529; text-align: right;">${location}</td>
                            </tr>
                            <tr class="info-row">
                              <td class="info-label" style="padding: 8px 0; border-bottom: 1px solid #dee2e6; font-weight: 600; color: #495057; width: 30%; text-align: left;">Tickets:</td>
                              <td class="info-value" style="padding: 8px 0; border-bottom: 1px solid #dee2e6; color: #212529; text-align: right;">${quantity}</td>
                            </tr>
                            <tr class="info-row" style="border-bottom: none;">
                              <td class="info-label" style="padding: 8px 0; border-bottom: none; font-weight: 700; color: #003B73; width: 30%; text-align: left;">Total Paid:</td>
                              <td class="info-value" style="padding: 8px 0; border-bottom: none; font-weight: 700; color: #003B73; text-align: right;">${formattedAmount}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- PDF Attachment Notice -->
                    <div class="notice-box">
                      <strong>📱 ${ticketCount > 1 ? 'QR Codes Attached' : 'QR Code Attached'}</strong>
                      <p>${ticketCount > 1 ? 
                        `You have ${ticketCount} PDF tickets attached to this email. Each person should download their ticket and show it at the event entrance for quick check-in!` : 
                       'Your QR code ticket is attached to this email. Download it and show it at the event entrance for quick check-in!'
                     }</p>
                    </div>
                    
                    <!-- CTA -->
                    <div style="text-align: center; margin: 30px 0;">
                      <p style="font-size: 18px; color: #0074D9; font-weight: 600; margin: 0 0 20px 0;">
                        See you at the event! &#x1F38A;
                      </p>
                    </div>
                    
                    <!-- Need Help -->
                    <h3 style="color: #003B73; margin: 30px 0 15px 0;">Need Help?</h3>
                    <p style="color: #495057;">
                      For event information, check out our 
                      <a href="https://www.instagram.com/uos.somsoc/" style="color: #0074D9; text-decoration: none; margin: 0 8px;">
                        Instagram
                      </a>
                       or 
                        <a href="https://chat.whatsapp.com/Ba1DrDXZpRo3N4aWrcV6rl" style="color: #0074D9; text-decoration: none; margin: 0 8px;">
                        WhatsApp
                      </a><br>
                    </p>
                  </div>
                  
                  <!-- Footer -->
                  <div class="footer" style="background: #f8f9fa; padding: 30px; text-align: center; color: #6c757d; font-size: 14px;">
                    <p style="margin: 0 0 10px 0;">© 2025 Somali Society Salford. All rights reserved.</p>
                    <p style="margin: 0; font-size: 12px;">
                      This is an automated confirmation email. Please do not reply to this email.
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          </table>
          </center>
        </body>
        </html>
      `
    });

    if (error) {
      logger.error('Email send failed', { error, email });
      throw new Error(`Failed to send email confirmation. Please check system logs for details.`);
    }

    logger.info('Order email sent successfully', { email, code });
    return data;
  } catch (error) {
    logger.error('sendOrderEmail error', { error: error.message, email });
    throw error;
  }
}