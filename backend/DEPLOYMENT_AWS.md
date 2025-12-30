# Quick AWS Lightsail Deployment Guide

## Prerequisites
- AWS Account (free tier available)
- MongoDB Atlas account (free tier available)
- Git installed locally

## Quick Start (5 Steps)

### Step 1: Setup MongoDB Atlas (5 minutes)
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create free account
3. Create free cluster (M0 - FREE forever)
4. Security → Network Access → Add IP: `0.0.0.0/0`
5. Security → Database Access → Create user (remember password!)
6. Click "Connect" → "Connect your application"
7. Copy connection string: `mongodb+srv://username:password@cluster.mongodb.net/vy-service`
8. Replace `<password>` with your actual password (URL encode @ as %40)

### Step 2: Create AWS Lightsail Instance (2 minutes)
1. Go to https://lightsail.aws.amazon.com/
2. Click "Create instance"
3. Choose:
   - **Platform**: Linux/Unix
   - **Blueprint**: OS Only → Ubuntu 22.04 LTS
   - **Instance plan**: $5/month (1GB RAM) - recommended
   - **Name**: `vy-service-backend`
4. Click "Create instance"
5. Wait 2-3 minutes for instance to start

### Step 3: Connect & Setup Server (10 minutes)

**Option A: Use Browser SSH (Easiest)**
1. Click on your instance
2. Click "Connect using SSH" button
3. Browser terminal opens

**Option B: Use SSH Client**
- Download SSH key from Lightsail
- Use PuTTY (Windows) or Terminal (Mac/Linux)

**Run these commands:**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js
node --version  # Should show v18.x.x
npm --version

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Git
sudo apt install git -y
```

### Step 4: Deploy Your Code (5 minutes)

```bash
# Create app directory
sudo mkdir -p /opt/vy-service
sudo chown $USER:$USER /opt/vy-service
cd /opt/vy-service

# Clone your repository (replace with your repo URL)
# Option A: If public repository
git clone https://github.com/YOUR_USERNAME/VY-Service.git .

# Option B: If private, upload files manually using SFTP
# Use FileZilla: Connect to your Lightsail IP with SSH key
# Upload backend/ folder to /opt/vy-service/

cd backend

# Install dependencies
npm install --production

# Create .env file
nano .env
```

**Paste this in .env file (press Ctrl+X, then Y, then Enter to save):**
```env
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/vy-service
MONGODB_DB_NAME=vy-service
```

```bash
# Start application with PM2
pm2 start server.js --name vy-service-api

# Save PM2 configuration
pm2 save

# Setup auto-start on reboot
pm2 startup
# Copy and run the command it outputs (starts with sudo)

# Check if running
pm2 status
pm2 logs vy-service-api
```

### Step 5: Configure Network & Get URL (2 minutes)

1. Go back to Lightsail dashboard
2. Click on your instance → "Networking" tab
3. Click "Add rule":
   - Application: Custom
   - Protocol: TCP
   - Port: 3000
   - Click "Save"
4. Copy your instance's **Public IP** (shown at top)

### Step 6: Test & Update Mobile App

**Test API:**
Open browser: `http://YOUR_PUBLIC_IP:3000/api/health`
Should show: `{"status":"OK","message":"Server is running"}`

**Update Mobile App:**
Edit `services/api.js` line 13:
```javascript
const PRODUCTION_API_URL = 'http://YOUR_PUBLIC_IP:3000/api';
```

## Updating Your Code Later

```bash
# SSH into server
cd /opt/vy-service
git pull  # If using Git
# OR upload new files via SFTP

cd backend
npm install --production
pm2 restart vy-service-api
pm2 logs vy-service-api  # Check logs
```

## Troubleshooting

**Can't access API?**
- Check firewall: Lightsail → Networking → Rules (port 3000 should be open)
- Check if server running: `pm2 status`
- Check logs: `pm2 logs vy-service-api`

**Database connection error?**
- Check MongoDB Atlas Network Access (should allow 0.0.0.0/0)
- Verify .env file has correct MONGODB_URI
- Check password encoding (@ should be %40)

**App crashes?**
- Check logs: `pm2 logs vy-service-api`
- Check Node.js version: `node --version` (should be 18+)
- Verify all dependencies: `npm install`

## Cost Breakdown
- AWS Lightsail: $5/month
- MongoDB Atlas: FREE (M0 cluster)
- **Total: $5/month**

## Next Steps (Optional)
- Add custom domain (point DNS to Lightsail static IP)
- Enable HTTPS (use Cloudflare free SSL or AWS Certificate Manager)
- Setup automated backups
- Monitor with PM2 monitoring: `pm2 monit`

