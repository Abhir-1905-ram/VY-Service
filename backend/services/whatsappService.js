const axios = require('axios');
require('dotenv').config();

// WhatsApp Business API Configuration
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || 'EAAWST9pmgOUBQbWVpqSrIpfhkJ2CDeoTMApGqKGtS9ZCEBlwPwZCWkSpCvO39Kl5JcfzdNZBCF6aIng4GsjpTsbuSfHOOeLPvRZBFyhDI6h0YgmXtiKtJvyC3oKhDbKaABW7otRRIL9Q865NNoiH2ZA8uLVCP2mKWv1jzjv7SfZCixRtPUnSS1WlkwRQl4SjdvROyGEQbUjIiBXitTfs1BNUOnVwZCqZCZCjmw2g9ZAznAsHXowWi24dN8VMlkfV1q8qiwdkp623n78LIteupEywvkdQZDZD';
// Phone Number ID from your WhatsApp Business Account
// You can find this in Meta Business Suite > WhatsApp > API Setup
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '904081392796508';
// WhatsApp Business Account ID
const WHATSAPP_BUSINESS_ACCOUNT_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '865567122874723';
// WhatsApp API Version
const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v22.0';
// Base URL for WhatsApp Graph API
const WHATSAPP_API_URL = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

/**
 * Format phone number for WhatsApp (international format: +91XXXXXXXXXX)
 * WhatsApp requires phone numbers in international format without leading zeros
 */
function formatPhoneNumber(phoneNumber) {
  // Remove all non-digit characters
  let cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // If 10 digits, add India country code (91)
  if (cleanNumber.length === 10) {
    return `91${cleanNumber}`;
  }
  
  // If 12 digits and starts with 91 (India), return as is
  if (cleanNumber.length === 12 && cleanNumber.startsWith('91')) {
    return cleanNumber;
  }
  
  // If 11 digits and starts with 0, remove 0 and add 91
  if (cleanNumber.length === 11 && cleanNumber.startsWith('0')) {
    return `91${cleanNumber.substring(1)}`;
  }
  
  // If 13 digits and starts with 91, return as is
  if (cleanNumber.length === 13 && cleanNumber.startsWith('91')) {
    return cleanNumber;
  }
  
  // If already has country code or is valid international format
  if (cleanNumber.length >= 10) {
    // Extract last 10 digits and prepend 91 if Indian number
    if (cleanNumber.length === 10 || (cleanNumber.length === 11 && cleanNumber.startsWith('0'))) {
      return `91${cleanNumber.slice(-10)}`;
    }
    return cleanNumber;
  }
  
  // Default: assume Indian number and add country code
  return `91${cleanNumber.slice(-10)}`;
}

/**
 * Generate repair notification message
 */
function generateRepairNotificationMessage(customerName, deviceType, deviceBrand) {
  return `Hello ${customerName},

Your ${deviceBrand} ${deviceType} has been successfully registered for repair.
Thank you for choosing our service! `;
}

/**
 * Send WhatsApp message via WhatsApp Business API
 */
async function sendWhatsAppMessage(phoneNumber, message) {
  try {
    if (!WHATSAPP_ACCESS_TOKEN) {
      console.warn('⚠️  WhatsApp Access Token not configured. WhatsApp message will not be sent.');
      return {
        success: false,
        message: 'WhatsApp service not configured',
      };
    }

    if (!WHATSAPP_PHONE_NUMBER_ID) {
      console.warn('⚠️  WhatsApp Phone Number ID not configured. Please set WHATSAPP_PHONE_NUMBER_ID in environment variables.');
      return {
        success: false,
        message: 'WhatsApp Phone Number ID not configured',
      };
    }

    const formattedNumber = formatPhoneNumber(phoneNumber);
    
    // Validate phone number (must be at least 10 digits)
    if (formattedNumber.length < 10 || !/^\d+$/.test(formattedNumber)) {
      console.error(`❌ Invalid phone number format: ${phoneNumber} (formatted: ${formattedNumber})`);
      return {
        success: false,
        message: `Invalid phone number format: ${phoneNumber}`,
      };
    }

    console.log(`📱 Sending WhatsApp message to: +${formattedNumber}`);
    console.log(`💬 Message: ${message.substring(0, 50)}...`);
    console.log(`🔑 Access Token (first 20 chars): ${WHATSAPP_ACCESS_TOKEN.substring(0, 20)}...`);
    console.log(`📞 Phone Number ID: ${WHATSAPP_PHONE_NUMBER_ID}`);
    console.log(`🌐 Full API URL: ${WHATSAPP_API_URL}`);
    
    // Verify Phone Number ID is correct (should be long numeric string, not a phone number)
    if (WHATSAPP_PHONE_NUMBER_ID.length < 10 || WHATSAPP_PHONE_NUMBER_ID === formattedNumber) {
      console.error(`❌ ERROR: Phone Number ID appears incorrect. Got: ${WHATSAPP_PHONE_NUMBER_ID}, Expected: 904081392796508`);
      return {
        success: false,
        message: `Invalid Phone Number ID configuration. Expected 904081392796508, got ${WHATSAPP_PHONE_NUMBER_ID}`,
      };
    }

    const requestBody = {
      messaging_product: 'whatsapp',
      to: formattedNumber,
      type: 'text',
      text: {
        preview_url: false,
        body: message
      }
    };

    console.log(`📤 Request URL: ${WHATSAPP_API_URL}`);
    console.log(`📤 Request Body:`, JSON.stringify({
      ...requestBody,
      text: { ...requestBody.text, body: message.substring(0, 50) + '...' }
    }, null, 2));

    const response = await axios.post(
      WHATSAPP_API_URL,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log(`📥 WhatsApp API Response Status:`, response.status);
    console.log(`📥 WhatsApp API Response Data:`, JSON.stringify(response.data, null, 2));

    if (response.data && response.data.messages && response.data.messages.length > 0) {
      const messageId = response.data.messages[0].id;
      console.log(`✅ WhatsApp message sent successfully to +${formattedNumber}`);
      console.log(`📊 Message ID: ${messageId}`);
      return {
        success: true,
        message: 'WhatsApp message sent successfully',
        messageId: messageId,
      };
    } else {
      console.error('❌ WhatsApp API returned unexpected response:', response.data);
      return {
        success: false,
        message: 'Failed to send WhatsApp message - unexpected response',
        responseData: response.data,
      };
    }
  } catch (error) {
    console.error('❌ Exception sending WhatsApp message:', error.message);
    if (error.response) {
      console.error('❌ Response Status:', error.response.status);
      console.error('❌ Response Data:', JSON.stringify(error.response.data, null, 2));
      
      const responseData = error.response.data || {};
      const statusCode = error.response.status;
      
      // Common WhatsApp Business API error codes with helpful messages
      const errorMessages = {
        400: 'Bad Request - Check phone number format and message content',
        401: 'Unauthorized - Check your WhatsApp Access Token',
        403: 'Forbidden - Check permissions and Phone Number ID',
        404: 'Not Found - Check Phone Number ID and API version',
        429: 'Rate limit exceeded - Too many requests. Please wait before retrying',
        500: 'WhatsApp API server error - Try again later',
      };
      
      let errorMsg = errorMessages[statusCode] || 
                    responseData.error?.message || 
                    responseData.error?.error_user_msg ||
                    responseData.message || 
                    error.message || 
                    'Failed to send WhatsApp message';
      
      // Handle specific WhatsApp error codes
      if (responseData.error) {
        const errorCode = responseData.error.code;
        const errorSubCode = responseData.error.error_subcode;
        
        if (errorCode === 131047) {
          errorMsg = 'Phone number not registered on WhatsApp. Make sure the number is active on WhatsApp.';
        } else if (errorCode === 131026) {
          errorMsg = 'Recipient phone number is invalid. Please check the phone number format.';
        } else if (errorCode === 131031) {
          errorMsg = 'Message template not found or not approved.';
        } else if (errorCode === 131051) {
          errorMsg = 'Message sending failed due to recipient settings or restrictions.';
        }
        
        console.error(`💡 Error Code ${errorCode}${errorSubCode ? ` (subcode: ${errorSubCode})` : ''}: ${errorMsg}`);
      } else {
        console.error(`💡 Error Code ${statusCode}: ${errorMsg}`);
      }
      
      return {
        success: false,
        message: errorMsg,
        statusCode: statusCode,
        errorCode: responseData.error?.code,
        responseData: error.response.data,
      };
    } else if (error.request) {
      console.error('❌ No response received:', error.request);
      return {
        success: false,
        message: 'No response from WhatsApp API server. Please check your internet connection.',
      };
    } else {
      console.error('❌ Request setup error:', error.message);
      return {
        success: false,
        message: error.message || 'Failed to send WhatsApp message',
      };
    }
  }
}

/**
 * Send WhatsApp message to multiple phone numbers
 */
async function sendWhatsAppToMultiple(phoneNumbers, message) {
  // Handle comma-separated phone numbers
  const numbers = phoneNumbers.split(',').map(n => n.trim()).filter(n => n.length > 0);
  const results = [];

  for (const number of numbers) {
    const result = await sendWhatsAppMessage(number, message);
    results.push({
      phoneNumber: number,
      ...result,
    });
    // Delay between messages to avoid rate limiting (1 second delay)
    if (numbers.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

module.exports = {
  sendWhatsAppMessage,
  sendWhatsAppToMultiple,
  generateRepairNotificationMessage,
  formatPhoneNumber,
};
