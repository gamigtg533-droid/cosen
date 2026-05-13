const axios = require('axios');

/**
 * Sends an OTP using the Fast2SMS API.
 * @param {string} to - The 10-digit mobile number.
 * @param {string} otp - The numeric OTP to send.
 */
const sendSms = async (to, otp) => {
  if (!process.env.FAST2SMS_API_KEY) {
    console.warn('⚠️ Fast2SMS API Key is missing. Check your .env file.');
    return;
  }

  try {
    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        route: 'otp',
        variables_values: otp,
        numbers: to,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.return === false) {
      console.error('❌ Fast2SMS failed:', response.data.message);
      throw new Error(response.data.message[0] || 'Fast2SMS error');
    }

    console.log('✅ OTP sent via Fast2SMS to', to);
    return response.data;
  } catch (error) {
    console.error('❌ Error sending SMS via Fast2SMS:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = sendSms;
