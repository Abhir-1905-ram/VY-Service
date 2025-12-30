#!/bin/bash
# AWS Lightsail Deployment Script
# Run this script on your Lightsail instance after initial setup

echo "🚀 Starting VY Service Backend Deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo -e "${GREEN}✅ Node.js version: $(node --version)${NC}"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

echo -e "${GREEN}✅ PM2 installed${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo "Creating .env file from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}Please edit .env file with your MongoDB connection string${NC}"
        nano .env
    else
        echo -e "${RED}❌ .env.example not found. Please create .env file manually${NC}"
        exit 1
    fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Stop existing PM2 process if running
pm2 delete vy-service-api 2>/dev/null || true

# Start application with PM2
echo "🚀 Starting application with PM2..."
pm2 start server.js --name vy-service-api

# Save PM2 configuration
pm2 save

echo -e "${GREEN}✅ Application started${NC}"
echo ""
echo "📊 Application Status:"
pm2 status

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📝 Useful commands:"
echo "  - View logs: pm2 logs vy-service-api"
echo "  - Restart: pm2 restart vy-service-api"
echo "  - Stop: pm2 stop vy-service-api"
echo "  - Monitor: pm2 monit"
echo ""
echo "🌐 Make sure port 3000 is open in Lightsail Networking settings"

