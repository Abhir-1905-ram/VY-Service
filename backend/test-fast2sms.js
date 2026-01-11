// Test script for Fast2SMS API
const axios = require('axios');
require('dotenv').config();

const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || 'Jl4UqidSMpLTZ5QFbNXoxEesk0YfWHtPRw8Ozvuy2AIDhcVjCgGsRJHpi3tga4lcLv5PxnZqEVKX1bMU';
const FAST2SMS_URL = 'https://www.fast2sms.com/dev/bulkV2';

async function testFast2SMS() {
  // Replace with your test phone number (10 digits)
  const testNumber = '9876543210'; // Change this to a valid 10-digit number for testing
  const testMessage = 'Test message from VY Service app.';

  console.log('🧪 Testing Fast2SMS API...\n');
  console.log(`📞 Test Number: ${testNumber}`);
  console.log(`💬 Test Message: ${testMessage}`);
  console.log(`🔑 API Key (first 20 chars): ${FAST2SMS_API_KEY.substring(0, 20)}...\n`);

  try {
    const requestBody = {
      route: 'q',
      message: testMessage,
      language: 'english',
      flash: 0,
      numbers: testNumber
    };

    console.log('📤 Request Body:', JSON.stringify(requestBody, null, 2));
    console.log('\n⏳ Sending request...\n');

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

    console.log('✅ Response received!');
    console.log('📊 Status Code:', response.status);
    console.log('📥 Response Data:', JSON.stringify(response.data, null, 2));

    if (response.data && response.data.return === true) {
      console.log('\n✅ SUCCESS: SMS sent successfully!');
      console.log('📋 Request ID:', response.data.request_id);
    } else {
      console.log('\n❌ FAILED: SMS not sent');
      console.log('❌ Message:', response.data?.message || 'Unknown error');
    }
  } catch (error) {
    console.error('\n❌ ERROR OCCURRED:');
    console.error('Error Message:', error.message);
    
    if (error.response) {
      console.error('Status Code:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      
      // Common Fast2SMS error codes
      const errorCodes = {
        401: 'Invalid Authentication - Check your API key',
        411: 'Invalid Phone Number format',
        416: 'Insufficient wallet balance',
        417: 'Temporary blocked',
        418: 'Daily limit exceeded'
      };
      
      if (errorCodes[error.response.status]) {
        console.error(`\n💡 Hint: ${errorCodes[error.response.status]}`);
      }
    } else if (error.request) {
      console.error('No response received from server');
    }
  }
}

// Run the test
testFast2SMS();

