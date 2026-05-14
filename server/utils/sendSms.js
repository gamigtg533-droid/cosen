const axios = require('axios');

/**
 * Sends an OTP using the Fast2SMS API.
 * @param {string} to - The mobile number (can include +91 prefix).
 * @param {string} otp - The numeric OTP to send.
 */
const sendSms = async (to, otp) => {
  if (!process.env.FAST2SMS_API_KEY) {
    const err = new Error('FAST2SMS_API_KEY is not configured on the server.');
    console.error('❌', err.message);
    throw err;
  }

  // Fast2SMS expects a plain 10-digit number without country code
  const cleaned = to.replace(/^\+91/, '').replace(/\D/g, '').slice(-10);
  console.log(`📱 Sending OTP to: ${cleaned}`);

  try {
    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        route: 'otp',
        variables_values: otp,
        numbers: cleaned,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.return === false) {
      const msg = Array.isArray(response.data.message)
        ? response.data.message[0]
        : response.data.message || 'Fast2SMS error';
      console.error('❌ Fast2SMS rejected the request:', msg);
      throw new Error(msg);
    }

    console.log('✅ OTP sent via Fast2SMS to', cleaned);
    return response.data;
  } catch (error) {
    console.error('❌ Error sending SMS via Fast2SMS:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = sendSms;
