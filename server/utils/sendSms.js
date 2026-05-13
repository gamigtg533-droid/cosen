const axios = require('axios');

/**
 * Sends a transactional SMS via Brevo SMS API.
 * @param {object} options
 * @param {string} options.to   - Phone number in E.164 format, e.g. "+919876543210"
 * @param {string} options.content - SMS body text (max 160 chars for single SMS)
 */
const sendSms = async ({ to, content }) => {
  const apiKey = process.env.BREVO_API_KEY;
  const sender = process.env.SMS_SENDER_NAME || 'COSEN';

  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not set.');
  }

  const payload = {
    sender,
    recipient: to,
    content,
    type: 'transactional',
  };

  const response = await axios.post(
    'https://api.brevo.com/v3/transactionalSMS/sms',
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

  console.log(`✅ Brevo SMS: sent to ${to} — reference: ${response.data.reference}`);
  return response.data;
};

module.exports = sendSms;
