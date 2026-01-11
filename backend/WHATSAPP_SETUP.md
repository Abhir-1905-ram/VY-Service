# WhatsApp Notification Setup Guide

This guide will help you set up WhatsApp notifications for repair entries using **WhatsApp Web automation** (no Business WhatsApp or third-party services needed).

## How It Works

This solution uses WhatsApp Web directly (just like using WhatsApp on your computer). It's completely free and doesn't require:
- ❌ Business WhatsApp account
- ❌ Third-party services (ChatAPI, MSG91, Twilio, etc.)
- ❌ API keys or subscriptions
- ❌ Payment methods

## Setup Instructions

### Step 1: Install Dependencies

Dependencies are already installed. If you need to reinstall:

```bash
cd backend
npm install whatsapp-web.js qrcode-terminal
```

### Step 2: Start Your Backend Server

```bash
cd backend
npm start
```

or for development:

```bash
npm run dev
```

### Step 3: Scan QR Code

When you start the server, you'll see a QR code in the terminal/console:

```
=== WhatsApp QR Code ===
Scan this QR code with your WhatsApp to connect:
[QR CODE WILL APPEAR HERE]
========================
```

1. Open WhatsApp on your phone
2. Go to **Settings** → **Linked Devices**
3. Tap **Link a Device**
4. Scan the QR code displayed in your server console
5. Wait for "✅ WhatsApp client is ready!" message

### Step 4: Test It

1. Create a new repair entry in your app
2. The WhatsApp message will be sent automatically to the phone number(s) in the repair entry

**That's it!** No configuration files or API keys needed.

## Message Format

When a repair is saved, the following message is sent:

```
Vyshnavi Computers
Your repair work on your {deviceType} ({deviceBrand}) has started.
Thank you
```

**Example:**
```
Vyshnavi Computers
Your repair work on your Laptop (Dell) has started.
Thank you
```

## Important Notes

### ✅ Advantages

- **100% Free** - No costs or subscriptions
- **No API Keys** - No configuration needed
- **Works with Personal WhatsApp** - Uses your existing WhatsApp number
- **Direct Integration** - Uses WhatsApp Web protocol directly
- **Reliable** - Works as long as your phone is connected

### ⚠️ Limitations

- **Requires Phone Connection** - Your phone must be online and WhatsApp must be running
- **Single Session** - Uses one WhatsApp account (the one you scanned with)
- **Rate Limits** - WhatsApp may rate limit if sending too many messages too quickly
- **Session Management** - If you log out of WhatsApp Web, you'll need to scan QR code again

### 🔄 Reconnection

If the connection is lost:
1. The system will automatically attempt to reconnect
2. If reconnection fails, restart your server
3. Scan the QR code again if prompted

## Troubleshooting

### QR Code Not Appearing

- Make sure all dependencies are installed: `npm install`
- Check server console for errors
- Try restarting the server

### Messages Not Sending

1. **Check WhatsApp Status**: Make sure your phone has internet and WhatsApp is running
2. **Check Connection**: Look for "✅ WhatsApp client is ready!" in console
3. **Check Phone Number Format**: Ensure numbers are 10 digits (Indian format)
4. **Check Server Logs**: Look for error messages in the console

### Phone Number Not Registered on WhatsApp

- The number must be registered on WhatsApp to receive messages
- Check if the number has WhatsApp installed and active

### Session Expired

- If you log out of WhatsApp Web on your phone, you'll need to scan QR code again
- Restart the server to get a new QR code

## Multiple Phone Numbers

The system automatically sends WhatsApp to all phone numbers in the repair entry (comma-separated). Each number receives a separate message with a 2-second delay between messages to avoid rate limiting.

## Server Requirements

- Node.js 16+ required (for Puppeteer used by whatsapp-web.js)
- The server creates a `.wwebjs_auth` folder to store session data
- This folder should be in `.gitignore` (already added)

## Security Notes

- The session data is stored locally on your server
- Only messages can be sent from the connected WhatsApp account
- Keep your server secure to protect your WhatsApp session

## Need Help?

1. Check server console for error messages
2. Ensure WhatsApp Web is not logged in on multiple devices (can cause conflicts)
3. Try logging out and logging back into WhatsApp Web on your phone
4. Restart the server and scan QR code again

---

**Note**: If WhatsApp service fails, the repair entry will still be saved successfully. Errors are logged in the console for debugging.

