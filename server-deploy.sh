#!/bin/bash

# Server-side deployment script for Flipnosis
# This script should be placed at /srv/flipnosis/deploy.sh on the server
# Usage: ssh deploy@116.202.24.43 'bash /srv/flipnosis/deploy.sh'

set -e

echo "====================================="
echo "Flipnosis Server Deployment"
echo "====================================="
echo ""

# Change to application directory
echo "→ Changing to application directory..."
cd /srv/flipnosis/app

# Pull latest code from git
echo "→ Pulling latest code from git..."
git pull

# Install/update dependencies
echo "→ Installing dependencies..."
npm install --production

# Build production assets
echo "→ Building production assets..."
npm run build:production

# Restart the service
echo "→ Restarting flipnosis service..."
sudo systemctl restart flipnosis.service

# Wait a moment for service to start
sleep 2

# Check service status
echo "→ Checking service status..."
sudo systemctl status flipnosis.service --no-pager

echo ""
echo "====================================="
echo "✓ Deployment completed successfully!"
echo "====================================="
