const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');
const fs = require('fs');

// Initialize WhatsApp client
let whatsappClient = null;
let isReady = false;
let qrCodeData = null;

/**
 * Initialize WhatsApp client
 * @returns {Promise<void>}
 */
function initializeWhatsApp() {
  return new Promise((resolve, reject) => {
    // Create .wwebjs_auth directory if it doesn't exist
    const authDir = path.join(__dirname, '..', '.wwebjs_auth');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    try {
      // Try to find Chrome executable on Windows
      let executablePath = null;
      if (process.platform === 'win32') {
        const possiblePaths = [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          process.env.CHROME_PATH || process.env.CHROME_BIN || null,
        ];
        
        for (const chromePath of possiblePaths) {
          if (chromePath && fs.existsSync(chromePath)) {
            executablePath = chromePath;
            console.log('Found Chrome at:', executablePath);
            break;
          }
        }
      }

      const puppeteerConfig = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-extensions',
          '--disable-background-networking',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-breakpad',
          '--disable-client-side-phishing-detection',
          '--disable-component-extensions-with-background-pages',
          '--disable-default-apps',
          '--disable-features=TranslateUI',
          '--disable-hang-monitor',
          '--disable-ipc-flooding-protection',
          '--disable-notifications',
          '--disable-popup-blocking',
          '--disable-prompt-on-repost',
          '--disable-renderer-backgrounding',
          '--disable-sync',
          '--metrics-recording-only',
          '--mute-audio',
          '--no-default-browser-check',
          '--no-pings',
          '--use-fake-ui-for-media-stream',
          '--use-fake-device-for-media-stream',
        ],
        timeout: 60000,
        protocolTimeout: 60000,
      };

      // Set executable path if Chrome was found
      if (executablePath) {
        puppeteerConfig.executablePath = executablePath;
      }

      whatsappClient = new Client({
        authStrategy: new LocalAuth({
          dataPath: authDir,
        }),
        puppeteer: puppeteerConfig,
      });

      // QR Code event - display in terminal
      whatsappClient.on('qr', (qr) => {
        console.log('\n=== WhatsApp QR Code ===');
        console.log('Scan this QR code with your WhatsApp to connect:');
        qrcode.generate(qr, { small: true });
        console.log('========================\n');
        qrCodeData = qr;
      });

      // Ready event - client is ready to send messages
      whatsappClient.on('ready', () => {
        console.log('✅ WhatsApp client is ready!');
        isReady = true;
        qrCodeData = null;
        resolve();
      });

      // Authentication event
      whatsappClient.on('authenticated', () => {
        console.log('✅ WhatsApp authenticated successfully!');
      });

      // Authentication failure event
      whatsappClient.on('auth_failure', (msg) => {
        console.error('❌ WhatsApp authentication failed:', msg);
        isReady = false;
        reject(new Error('WhatsApp authentication failed'));
      });

      // Disconnected event
      whatsappClient.on('disconnected', (reason) => {
        console.log('⚠️ WhatsApp client disconnected:', reason);
        isReady = false;
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          console.log('🔄 Attempting to reconnect WhatsApp...');
          initializeWhatsApp().catch(err => {
            console.error('Failed to reconnect WhatsApp:', err);
          });
        }, 5000);
      });

      // Start the client
      whatsappClient.initialize().catch(err => {
        console.error('Failed to initialize WhatsApp:', err);
        reject(err);
      });
    } catch (error) {
      console.error('Error creating WhatsApp client:', error);
      reject(error);
    }
  });
}

/**
 * Format phone number for WhatsApp (with country code)
 * @param {string} phoneNumber - Phone number (10 digits or with country code)
 * @returns {string} Formatted phone number with country code
 */
function formatPhoneNumber(phoneNumber) {
  // Remove all non-digit characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // If already has country code (starts with 91), return as is
  if (cleanNumber.length === 12 && cleanNumber.startsWith('91')) {
    return `${cleanNumber}@c.us`;
  }
  
  // If 10 digits, add India country code (91)
  if (cleanNumber.length === 10) {
    return `91${cleanNumber}@c.us`;
  }
  
  // If already in @c.us format, return as is
  if (cleanNumber.includes('@c.us')) {
    return cleanNumber;
  }
  
  // Add country code and format
  return `91${cleanNumber}@c.us`;
}

/**
 * Generate repair notification message
 * @param {string} deviceType - Type of device (e.g., "Laptop", "Mobile")
 * @param {string} deviceBrand - Brand name (e.g., "Dell", "Samsung")
 * @returns {string} Formatted message
 */
function generateRepairNotificationMessage(deviceType, deviceBrand) {
  return `Vyshnavi Computers
Your repair work on your ${deviceType} (${deviceBrand}) has started.
Thank you`;
}

/**
 * Send WhatsApp message using WhatsApp Web
 * @param {string} phoneNumber - Phone number (10 digits or with country code)
 * @param {string} message - Message to send
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function sendWhatsApp(phoneNumber, message) {
  try {
    console.log(`\n📤 Attempting to send WhatsApp to: ${phoneNumber}`);
    
    // Check if client is ready
    if (!whatsappClient) {
      console.error('❌ WhatsApp client not initialized');
      return {
        success: false,
        message: 'WhatsApp client not initialized. Please restart the server and scan QR code.',
      };
    }

    if (!isReady) {
      console.error('❌ WhatsApp client not ready. isReady:', isReady);
      if (qrCodeData) {
        return {
          success: false,
          message: 'WhatsApp not connected. Please scan the QR code displayed in the server console.',
        };
      }
      return {
        success: false,
        message: 'WhatsApp client is not ready. Please wait...',
      };
    }

    // Validate phone number
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    console.log(`📱 Clean phone number: ${cleanNumber}`);
    
    if (cleanNumber.length < 10) {
      console.error(`❌ Invalid phone number length: ${cleanNumber.length}`);
      return {
        success: false,
        message: `Invalid phone number: ${phoneNumber}. Expected at least 10 digits.`,
      };
    }

    const formattedNumber = formatPhoneNumber(phoneNumber);
    console.log(`📞 Formatted number for WhatsApp: ${formattedNumber}`);
    console.log(`💬 Message length: ${message.length} characters`);

    // Send message
    console.log('⏳ Sending message via WhatsApp...');
    const result = await whatsappClient.sendMessage(formattedNumber, message);

    console.log(`✅ WhatsApp message sent successfully to ${phoneNumber}`);
    console.log(`📨 Message ID: ${result.id._serialized}`);
    return {
      success: true,
      message: 'WhatsApp message sent successfully',
      messageId: result.id._serialized,
    };
  } catch (error) {
    console.error(`❌ Error sending WhatsApp message to ${phoneNumber}:`);
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
    
    // Handle specific errors
    if (error.message.includes('not registered') || error.message.includes('not a valid')) {
      return {
        success: false,
        message: `Phone number ${phoneNumber} is not registered on WhatsApp.`,
      };
    }
    
    if (error.message.includes('group') || error.message.includes('Group')) {
      return {
        success: false,
        message: `Cannot send message to group. Phone number: ${phoneNumber}`,
      };
    }
    
    return {
      success: false,
      message: error.message || 'Failed to send WhatsApp message',
    };
  }
}

/**
 * Send WhatsApp to multiple phone numbers
 * @param {string} phoneNumbers - Comma-separated phone numbers
 * @param {string} message - Message to send
 * @returns {Promise<Array>} Array of results for each number
 */
async function sendWhatsAppToMultiple(phoneNumbers, message) {
  const numbers = phoneNumbers.split(',').map(n => n.trim()).filter(n => n.length > 0);
  const results = [];

  for (const number of numbers) {
    const result = await sendWhatsApp(number, message);
    results.push({
      phoneNumber: number,
      ...result,
    });
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return results;
}

/**
 * Get QR code for scanning (if not authenticated)
 * @returns {string|null} QR code data or null if already authenticated
 */
function getQRCode() {
  return qrCodeData;
}

/**
 * Check if WhatsApp is ready
 * @returns {boolean}
 */
function isWhatsAppReady() {
  return isReady;
}

// Initialize WhatsApp when module is loaded (non-blocking)
// Don't fail server startup if WhatsApp fails
setTimeout(() => {
  initializeWhatsApp().catch(err => {
    console.error('Failed to initialize WhatsApp on startup:', err.message);
    console.error('⚠️  WhatsApp notifications will not be available until this is fixed.');
    console.error('The server will continue running without WhatsApp functionality.');
    console.error('\n💡 Try these solutions:');
    console.error('1. Make sure Chrome is installed on your system');
    console.error('2. Run: npm install puppeteer --save');
    console.error('3. If using Windows, try: npm install puppeteer-core --save');
    console.error('4. Restart your server\n');
  });
}, 2000); // Delay initialization by 2 seconds to let server start first

module.exports = {
  sendWhatsApp,
  sendWhatsAppToMultiple,
  generateRepairNotificationMessage,
  formatPhoneNumber,
  getQRCode,
  isWhatsAppReady,
  initializeWhatsApp,
};

