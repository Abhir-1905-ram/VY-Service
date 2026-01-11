const axios = require('axios');
require('dotenv').config();

// Fast2SMS Configuration
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || 'Jl4UqidSMpLTZ5QFbNXoxEesk0YfWHtPRw8Ozvuy2AIDhcVjCgGsRJHpi3tga4lcLv5PxnZqEVKX1bMU';
const FAST2SMS_URL = 'https://www.fast2sms.com/dev/bulkV2';

/**
 * Format phone number for Fast2SMS (10 digits)
 */
function formatPhoneNumber(phoneNumber) {
  // Remove all non-digit characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // If 10 digits, return as is
  if (cleanNumber.length === 10) {
    return cleanNumber;
  }
  
  // If 12 digits and starts with 91 (India country code), remove it
  if (cleanNumber.length === 12 && cleanNumber.startsWith('91')) {
    return cleanNumber.substring(2);
  }
  
  // If 11 digits and starts with 0, remove the 0
  if (cleanNumber.length === 11 && cleanNumber.startsWith('0')) {
    return cleanNumber.substring(1);
  }
  
  // If 13 digits and starts with +91, extract last 10
  if (cleanNumber.length === 13 && cleanNumber.startsWith('91')) {
    return cleanNumber.substring(3);
  }
  
  // Return last 10 digits if longer, or return as is if valid length
  return cleanNumber.length > 10 ? cleanNumber.slice(-10) : cleanNumber;
}

/**
 * Generate repair notification message
 */
function generateRepairNotificationMessage(customerName, deviceType, deviceBrand) {
  return `Hello ${customerName},

Your ${deviceBrand} ${deviceType} has been successfully registered for repair.
Our team has started working on your device and will notify you once it's ready.

Thank you for choosing our service! 🙏`;
}

/**
 * Send SMS via Fast2SMS
 */
async function sendSMS(phoneNumber, message) {
  try {
    if (!FAST2SMS_API_KEY) {
      console.warn('Fast2SMS API Key not configured. SMS will not be sent.');
      return {
        success: false,
        message: 'SMS service not configured',
      };
    }

    const formattedNumber = formatPhoneNumber(phoneNumber);
    
    // Validate phone number (must be 10 digits)
    if (formattedNumber.length !== 10 || !/^\d{10}$/.test(formattedNumber)) {
      console.error(`❌ Invalid phone number format: ${phoneNumber} (formatted: ${formattedNumber})`);
      return {
        success: false,
        message: `Invalid phone number format: ${phoneNumber}`,
      };
    }

    console.log(`📱 Sending SMS to: ${formattedNumber}`);
    console.log(`💬 Message: ${message.substring(0, 50)}...`);
    console.log(`🔑 API Key (first 10 chars): ${FAST2SMS_API_KEY.substring(0, 10)}...`);

    const requestBody = {
      route: 'q',
      message: message,
      language: 'english',
      flash: 0,
      numbers: formattedNumber
    };

    console.log(`📤 Request Body:`, JSON.stringify(requestBody, null, 2));

    const response = await axios.post(
      FAST2SMS_URL,
      requestBody,
      {
        headers: {
          'authorization': FAST2SMS_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log(`📥 Fast2SMS Response Status:`, response.status);
    console.log(`📥 Fast2SMS Response Data:`, JSON.stringify(response.data, null, 2));

    if (response.data && response.data.return === true) {
      console.log(`✅ SMS sent successfully to ${formattedNumber}`);
      console.log(`📊 Request ID: ${response.data.request_id || 'N/A'}`);
      return {
        success: true,
        message: 'SMS sent successfully',
        requestId: response.data.request_id,
      };
    } else {
      console.error('❌ Fast2SMS API returned false or error:', response.data);
      const errorMsg = response.data?.message || response.data?.msg || 'Failed to send SMS';
      console.error(`❌ Error details:`, errorMsg);
      return {
        success: false,
        message: errorMsg,
        responseData: response.data,
      };
    }
  } catch (error) {
    console.error('❌ Exception sending SMS:', error.message);
    if (error.response) {
      console.error('❌ Response Status:', error.response.status);
      console.error('❌ Response Data:', JSON.stringify(error.response.data, null, 2));
      
      const responseData = error.response.data || {};
      const internalStatusCode = responseData.status_code || responseData.statusCode;
      
      // Handle special case: Minimum transaction requirement (Status Code 999)
      if (internalStatusCode === 999 || (responseData.message && responseData.message.includes('100 INR'))) {
        const errorMsg = 'Fast2SMS API requires a minimum transaction of 100 INR before activation. Please add credits to your account at https://www.fast2sms.com';
        console.error('\n⚠️  ═══════════════════════════════════════════════════');
        console.error('⚠️  FAST2SMS ACCOUNT ACTIVATION REQUIRED');
        console.error('⚠️  ═══════════════════════════════════════════════════');
        console.error('📋 To activate your Fast2SMS API, you need to:');
        console.error('   1. Login to https://www.fast2sms.com');
        console.error('   2. Add credits (minimum 100 INR) to your wallet');
        console.error('   3. Send at least one SMS worth 100 INR or more');
        console.error('   4. After completing the transaction, API will be activated');
        console.error('⚠️  ═══════════════════════════════════════════════════\n');
        
        return {
          success: false,
          message: errorMsg,
          statusCode: error.response.status,
          internalStatusCode: internalStatusCode,
          responseData: responseData,
          requiresTransaction: true,
        };
      }
      
      // Common Fast2SMS error codes with helpful messages
      const errorMessages = {
        401: 'Invalid Authentication - Check your Fast2SMS API key',
        411: 'Invalid Phone Number format - Must be 10 digits',
        416: 'Insufficient wallet balance - Add credits to your Fast2SMS account',
        417: 'Temporary blocked - Try again later',
        418: 'Daily limit exceeded'
      };
      
      const statusCode = error.response.status;
      const errorMsg = errorMessages[statusCode] || 
                      responseData.message || 
                      responseData.msg || 
                      error.message || 
                      'Failed to send SMS';
      
      console.error(`💡 Error Code ${statusCode}${internalStatusCode ? ` (internal: ${internalStatusCode})` : ''}: ${errorMsg}`);
      
      return {
        success: false,
        message: errorMsg,
        statusCode: statusCode,
        responseData: error.response.data,
      };
    } else if (error.request) {
      console.error('❌ No response received:', error.request);
      return {
        success: false,
        message: 'No response from Fast2SMS server. Please check your internet connection.',
      };
    } else {
      console.error('❌ Request setup error:', error.message);
      return {
        success: false,
        message: error.message || 'Failed to send SMS',
      };
    }
  }
}

/**
 * Send SMS to multiple phone numbers
 */
async function sendSMSToMultiple(phoneNumbers, message) {
  // Handle comma-separated phone numbers
  const numbers = phoneNumbers.split(',').map(n => n.trim()).filter(n => n.length > 0);
  const results = [];

  for (const number of numbers) {
    const result = await sendSMS(number, message);
    results.push({
      phoneNumber: number,
      ...result,
    });
    // Delay between messages to avoid rate limiting (500ms delay)
    if (numbers.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}

module.exports = {
  sendSMS,
  sendSMSToMultiple,
  generateRepairNotificationMessage,
  formatPhoneNumber,
};

