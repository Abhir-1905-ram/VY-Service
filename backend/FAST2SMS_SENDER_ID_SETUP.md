# Fast2SMS Sender ID Setup Guide

## Overview
To display your business name (e.g., "VYSRVI" for "Vyshnavi Computers") instead of a random number when sending SMS, you need to set up a Sender ID through Fast2SMS and DLT registration.

## Steps to Set Up Custom Sender ID

### Step 1: Register on DLT Platform
1. Register your business on a DLT (Distributed Ledger Technology) platform
2. This is mandatory as per TRAI (Telecom Regulatory Authority of India) regulations
3. You'll get an Entity ID after registration

### Step 2: Choose Your Sender ID
- Must be exactly **6 alphabetical characters**
- Should represent your business name
- Examples:
  - "VYSRVI" for "Vyshnavi Computers"
  - "VYSCOM" for "Vyshnavi Computers"
  - "VYSRPC" for "Vyshnavi Repair & Computers"
- Cannot be personal names, celebrity names, or government agencies

### Step 3: Add DLT Details to Fast2SMS
1. Login to https://www.fast2sms.com
2. Go to **"DLT SMS"** section
3. Select **"Registered in DLT?"**
4. Provide your DLT Entity details:
   - Company name
   - Entity ID (from DLT platform)
5. Upload Principal Entity ID screenshot
6. Wait for approval (6-12 hours)

### Step 4: Add Sender ID to Fast2SMS
1. Once DLT entity is approved, go to **"Sender ID"** section
2. Click **"Add Sender ID"**
3. Enter your 6-character Sender ID (e.g., "VYSRVI")
4. Upload approval screenshot from DLT platform
5. Wait for approval (24-48 hours)

### Step 5: Configure in Your Application
1. Add the Sender ID to your environment variables:
   ```env
   FAST2SMS_SENDER_ID=VYSRVI
   ```

2. Or update it directly in `backend/services/fast2smsService.js`:
   ```javascript
   const FAST2SMS_SENDER_ID = 'VYSRVI';
   ```

## Current Configuration
- **Default Sender ID**: `VYSRVI` (for "Vyshnavi Computers")
- If you haven't registered on DLT yet, SMS will be sent without sender_id (shows random number)
- Once approved and configured, all SMS will show your business name

## Important Notes
- ⚠️ Sender ID must be exactly 6 alphabetical characters
- ⚠️ Approval process can take 24-48 hours
- ⚠️ Without DLT registration and approval, you cannot use custom sender ID
- ✅ You can still send SMS without sender ID (will show random number)

## Testing
After setting up your Sender ID:
1. Make sure it's approved in Fast2SMS dashboard
2. Add it to your environment variables or code
3. Send a test SMS
4. Check if the message shows your business name instead of random number

## Support
- Fast2SMS Help: https://www.fast2sms.com/help/
- DLT Registration: Contact Fast2SMS support for guidance

