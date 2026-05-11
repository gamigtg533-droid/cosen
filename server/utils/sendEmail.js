const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,       // smtp.gmail.com
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,                       // false = STARTTLS on port 587
    requireTLS: true,                    // force upgrade to TLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,         // allow self-signed certs in some envs
    },
  });

  // Verify connection before sending
  await transporter.verify();

  const message = {
    from: `${process.env.EMAIL_FROM_NAME || 'Cosen Platform'} <${process.env.EMAIL_FROM}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  const info = await transporter.sendMail(message);
  console.log(`✅ Email sent to ${options.email} — MessageId: ${info.messageId}`);
  return info;
};

module.exports = sendEmail;
