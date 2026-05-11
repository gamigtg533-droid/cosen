const axios = require('axios');

const sendEmail = async (options) => {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not set. Add it to your environment variables.');
  }

  const payload = {
    sender: {
      name: process.env.EMAIL_FROM_NAME || 'Cosen Platform',
      email: process.env.EMAIL_FROM || 'cosen.hub@gmail.com',
    },
    to: [{ email: options.email }],
    subject: options.subject,
    textContent: options.message,
    htmlContent: options.html || `<p>${options.message}</p>`,
  };

  const response = await axios.post(
    'https://api.brevo.com/v3/smtp/email',
    payload,
    {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      timeout: 10000,
    }
  );

  console.log(`✅ Brevo: Email sent to ${options.email} — messageId: ${response.data.messageId}`);
  return response.data;
};

module.exports = sendEmail;
