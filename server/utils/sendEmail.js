const { Resend } = require('resend');

// Fall back to nodemailer for local dev if RESEND_API_KEY is not set
const useResend = !!process.env.RESEND_API_KEY;

let nodemailerTransport = null;
if (!useResend) {
  const nodemailer = require('nodemailer');
  nodemailerTransport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
  });
}

const sendEmail = async (options) => {
  if (useResend) {
    // ── Resend (HTTP-based, works on Railway) ────────────────
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: `Cosen Platform <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`,
      to: [options.email],
      subject: options.subject,
      text: options.message,
      html: options.html || `<p>${options.message}</p>`,
    });

    if (error) throw new Error(error.message);
    console.log(`✅ Resend: Email sent to ${options.email}`);
  } else {
    // ── Nodemailer fallback (local dev only) ─────────────────
    await nodemailerTransport.verify();
    const info = await nodemailerTransport.sendMail({
      from: `Cosen Platform <${process.env.EMAIL_FROM}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html,
    });
    console.log(`✅ Nodemailer: Email sent to ${options.email} — ${info.messageId}`);
  }
};

module.exports = sendEmail;
