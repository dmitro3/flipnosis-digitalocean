#!/bin/bash
# Simple script to fix CONTRACT_ADDRESS on Hetzner server
# Run this directly on the server: bash fix-contract-address-simple.sh

CORRECT_CONTRACT_ADDRESS="0xa90abBDE769BC2901A8E68E6C9758B1Cd6699A5F"

echo "🔧 Fixing CONTRACT_ADDRESS..."
echo "   Setting: $CORRECT_CONTRACT_ADDRESS"
echo ""

# Find app directory
APP_DIR=""
if [ -d "/root/Flipnosis-Battle-Royale-current" ]; then
  APP_DIR="/root/Flipnosis-Battle-Royale-current"
elif [ -d "/opt/flipnosis/app" ]; then
  APP_DIR="/opt/flipnosis/app"
elif [ -d "/var/www/flipnosis" ]; then
  APP_DIR="/var/www/flipnosis"
else
  echo "❌ Could not find application directory"
  exit 1
fi

echo "✅ Found app directory: $APP_DIR"
cd "$APP_DIR"

# Update .env file
echo ""
echo "📝 Updating .env file..."
if [ -f ".env" ]; then
  if grep -q "CONTRACT_ADDRESS" .env; then
    sed -i "s|^CONTRACT_ADDRESS=.*|CONTRACT_ADDRESS=$CORRECT_CONTRACT_ADDRESS|g" .env
    echo "✅ Updated CONTRACT_ADDRESS in .env"
  else
    echo "CONTRACT_ADDRESS=$CORRECT_CONTRACT_ADDRESS" >> .env
    echo "✅ Added CONTRACT_ADDRESS to .env"
  fi
  echo "Current value:"
  grep CONTRACT_ADDRESS .env
else
  echo "CONTRACT_ADDRESS=$CORRECT_CONTRACT_ADDRESS" > .env
  echo "✅ Created .env with CONTRACT_ADDRESS"
fi

# Update ecosystem.config.js if it exists
if [ -f "ecosystem.config.js" ]; then
  echo ""
  echo "📝 Updating ecosystem.config.js..."
  sed -i "s|0xB2FC2180e003D818621F4722FFfd7878A218581D|$CORRECT_CONTRACT_ADDRESS|g" ecosystem.config.js
  sed -i "s|0xB2fc2180e003D818621F4722FFfd7878A218581D|$CORRECT_CONTRACT_ADDRESS|g" ecosystem.config.js
  echo "✅ Updated ecosystem.config.js"
fi

# Restart PM2
echo ""
echo "🔄 Restarting PM2..."
export CONTRACT_ADDRESS="$CORRECT_CONTRACT_ADDRESS"
if [ -f ".env" ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

pm2 restart all --update-env

sleep 3

echo ""
echo "✅ Done! PM2 has been restarted with the correct contract address."
echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "🔍 Verifying CONTRACT_ADDRESS..."
pm2 env flipnosis-app 2>/dev/null | grep CONTRACT_ADDRESS || echo "Run: pm2 restart all --update-env manually"

