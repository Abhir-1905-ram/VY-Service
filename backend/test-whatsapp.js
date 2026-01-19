// Test script for WhatsApp Business API
require('dotenv').config();
const { sendWhatsAppMessage, generateRepairNotificationMessage } = require('./services/whatsappService');

async function testWhatsApp() {
  try {
    // Test phone number (replace with your test number)
    const TEST_PHONE_NUMBER = process.env.TEST_PHONE_NUMBER || '8309224337';
    
    console.log('🧪 Testing WhatsApp Business API...\n');
    console.log('═══════════════════════════════════════════════════════');
    
    // Generate test message
    const message = generateRepairNotificationMessage(
      'Test Customer',
      'Laptop',
      'Dell'
    );
    
    console.log('📱 Test Phone Number:', TEST_PHONE_NUMBER);
    console.log('💬 Test Message:', message);
    console.log('\n📤 Sending WhatsApp message...\n');
    
    const result = await sendWhatsAppMessage(TEST_PHONE_NUMBER, message);
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 TEST RESULTS:');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Success:', result.success);
    console.log('Message:', result.message);
    
    if (result.success) {
      console.log('✅ WhatsApp message sent successfully!');
      if (result.messageId) {
        console.log('Message ID:', result.messageId);
      }
    } else {
      console.log('❌ Failed to send WhatsApp message');
      if (result.statusCode) {
        console.log('Status Code:', result.statusCode);
      }
      if (result.errorCode) {
        console.log('Error Code:', result.errorCode);
      }
      if (result.responseData) {
        console.log('Response Data:', JSON.stringify(result.responseData, null, 2));
      }
    }
    console.log('═══════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testWhatsApp();
