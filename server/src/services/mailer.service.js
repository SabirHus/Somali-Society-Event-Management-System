// server/src/services/mailer.service.js
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import dayjs from 'dayjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pull event + mail settings
const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM,
  EVENT_TITLE,
  EVENT_DATE,
  EVENT_TIME,
  EVENT_LOCATION,
  EVENT_CURRENCY = 'gbp',
} = process.env;

let cachedTransport = null;

async function getTransport() {
  if (cachedTransport) return cachedTransport;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    cachedTransport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: false,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  } else {
    // Dev fallback: Ethereal (test-only)
    const test = await nodemailer.createTestAccount();
    cachedTransport = nodemailer.createTransport({
      host: test.smtp.host, port: test.smtp.port, secure: test.smtp.secure,
      auth: { user: test.user, pass: test.pass },
    });
    console.log('Using Ethereal test SMTP. Login:', test.user);
  }
  return cachedTransport;
}

// Helper: make a PDF ticket Buffer
async function makeTicketPdf({ attendee, orderId, amount, qrText }) {
  // Build QR image as Buffer
  const qrDataUrl = await QRCode.toDataURL(qrText, { margin: 1, width: 512 });
  const qrBuf = Buffer.from(qrDataUrl.split(',')[1], 'base64');

  // Optional logo file (use the one in web/public if you want)
  const logoPath = path.resolve(process.cwd(), 'web', 'public', 'logo.png');
  const hasLogo = fs.existsSync(logoPath);

  // Render PDF
  const doc = new PDFDocument({ size: 'A4', margin: 36 });
  const chunks = [];
  return await new Promise((resolve, reject) => {
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    if (hasLogo) {
      doc.image(logoPath, 36, 28, { width: 140 });
    }
    doc.fontSize(22).fillColor('#123b7a')
      .text(EVENT_TITLE || 'Somali Society Event', hasLogo ? 190 : 36, 36, { continued: false });

    doc.moveDown(1);

    // Ticket info panel
    doc.rect(36, 100, doc.page.width - 72, 120).fill('#f1f7ff');
    doc.fillColor('#000').fontSize(14);
    doc.text(`Name`, 56, 116);           doc.font('Helvetica-Bold').text(attendee.name || '', 180, 116);
    doc.font('Helvetica').text(`Email`, 56, 140); doc.font('Helvetica-Bold').text(attendee.email || '', 180, 140);
    doc.font('Helvetica').text(`Order #`, 56, 164); doc.font('Helvetica-Bold').text(orderId, 180, 164);
    doc.font('Helvetica').text(`Total`, 56, 188); doc.font('Helvetica-Bold').text(formatMoney(amount, EVENT_CURRENCY), 180, 188);

    doc.font('Helvetica').text(`Date/Time`, 360, 116); doc.font('Helvetica-Bold').text(`${fmtDate(EVENT_DATE)} ${EVENT_TIME}`, 460, 116);
    doc.font('Helvetica').text(`Location`, 360, 140);  doc.font('Helvetica-Bold').text(EVENT_LOCATION || '', 460, 140);

    // QR
    doc.image(qrBuf, 170, 260, { width: 270, height: 270 });
    doc.moveDown(2);

    // Footer note
    doc.font('Helvetica').fontSize(10).fillColor('#333')
      .text('Please note: Event tickets are non-refundable and non-transferable.', 36, 560);

    doc.end();
  });
}

function fmtDate(iso) {
  if (!iso) return '';
  return dayjs(iso).format('DD/MM/YYYY');
}
function formatMoney(amountInMinor, currency = 'gbp') {
  // amount_total from Stripe is in minor units
  const symbol = currency.toLowerCase() === 'usd' ? 'USD' :
                 currency.toLowerCase() === 'eur' ? 'EUR' : 'GBP';
  return `${symbol} ${(amountInMinor / 100).toFixed(2)}`;
}

function emailHtml({ attendee, orderId, amount, qrDataUrl }) {
  const brandBlue = '#123b7a';
  const light = '#f1f7ff';
  const total = formatMoney(amount, EVENT_CURRENCY);

  const logoCid = 'soc-logo@inline';

  return {
    html:
`<div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;background:#ffffff;padding:0;margin:0">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f9ff;padding:24px 0">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="background:#fff;border-radius:14px;border:1px solid #e6ecf2;overflow:hidden">
          <tr>
            <td style="padding:24px 24px 8px">
              <img src="cid:${logoCid}" alt="Somali Society" style="width:120px;display:block;margin:0 auto 8px" />
              <h1 style="margin:8px 0 0;text-align:center;font-size:22px;color:${brandBlue};">${EVENT_TITLE || 'Somali Society Event'}</h1>
              <p style="text-align:center;margin:6px 0 0;color:#333">Thank you for your payment.</p>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 24px 0">
              <table role="presentation" width="100%" style="background:${light};border-radius:12px;padding:16px">
                <tr>
                  <td style="font-size:14px;color:#000">Order #</td>
                  <td style="text-align:right;font-weight:700">${orderId}</td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#000">Name</td>
                  <td style="text-align:right">${escapeHtml(attendee.name || '')}</td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#000">Event</td>
                  <td style="text-align:right">${escapeHtml(EVENT_TITLE || '')}</td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#000">Date/Time</td>
                  <td style="text-align:right">${fmtDate(EVENT_DATE)} ${EVENT_TIME}</td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#000">Total</td>
                  <td style="text-align:right;font-weight:700">${total}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 24px 0;text-align:center">
              <img src="${qrDataUrl}" alt="Ticket QR" style="width:180px;height:180px;border-radius:8px;border:1px solid #e6ecf2" />
              <p style="font-size:12px;color:#666;margin:8px 0 0">Your QR code is also attached in the PDF ticket.</p>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 24px 20px">
              <p style="font-size:12px;color:#444;margin:0">
                Please note: <strong>Event tickets are non-refundable and non-transferable.</strong>
              </p>
            </td>
          </tr>
        </table>

        <p style="font-size:12px;color:#8899aa;margin:12px 0 0">© Somali Society Salford</p>
      </td>
    </tr>
  </table>
</div>`,
    attachments: [{   // inline logo
      filename: 'logo.png',
      path: path.resolve(process.cwd(), 'web', 'public', 'logo.png'),
      cid: logoCid,
    }],
  };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

/**
 * Send "Order Confirmation" email with attached PDF ticket.
 * @param {Object} args
 * @param {string} args.to
 * @param {Object} args.attendee {name,email,code}
 * @param {string} args.orderId Stripe session id or payment intent id
 * @param {number} args.amount Stripe amount_total (minor units)
 */
export async function sendOrderEmail({ to, attendee, orderId, amount }) {
  const transport = await getTransport();

  // QR text can simply be the attendee code you scan at the door
  const qrText = attendee.code;

  // Data URL for in-email QR
  const qrDataUrl = await QRCode.toDataURL(qrText, { margin: 1, width: 180 });

  // Ticket PDF
  const pdf = await makeTicketPdf({
    attendee,
    orderId,
    amount,
    qrText,
  });

  const { html, attachments } = emailHtml({ attendee, orderId, amount, qrDataUrl });

  const info = await transport.sendMail({
    from: MAIL_FROM || 'Somali Society <no-reply@localhost>',
    to,
    subject: `Order Confirmation | Somali Society Salford`,
    html,
    attachments: [
      ...attachments.filter(a => fs.existsSync(a.path)),
      {   // PDF ticket
        filename: `Ticket-${attendee.code}.pdf`,
        content: pdf,
        contentType: 'application/pdf',
      },
    ],
  });

  if (nodemailer.getTestMessageUrl && info.messageId) {
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) console.log('Ethereal preview:', preview);
  }
}
