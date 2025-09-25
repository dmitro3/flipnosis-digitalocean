#!/bin/bash
echo "=== FORCE DEPLOYMENT STARTING ==="

# Stop everything
echo "Stopping current server..."
pkill -f 'node.*server.js'
sleep 3

# Clean everything
echo "Cleaning old files..."
cd /root/flipnosis-digitalocean
rm -rf dist/*
rm -rf node_modules
rm package-lock.json

# Extract new files
echo "Extracting new deployment..."
cd /root
tar -xzf force-deploy-package.tar.gz

# Copy new files
echo "Copying new files..."
cp -r force-deploy-package/dist/* /root/flipnosis-digitalocean/
cp -r force-deploy-package/server /root/flipnosis-digitalocean/
cp force-deploy-package/package.json /root/flipnosis-digitalocean/
cp force-deploy-package/package-lock.json /root/flipnosis-digitalocean/

# Install dependencies
echo "Installing dependencies..."
cd /root/flipnosis-digitalocean
npm install --production

# Start server
echo "Starting server..."
nohup node server/server.js > server.log 2>&1 &
sleep 2

# Restart nginx
echo "Restarting nginx..."
systemctl restart nginx

# Cleanup
echo "Cleaning up..."
rm -rf /root/force-deploy-package
rm /root/force-deploy-package.tar.gz

# Show status
echo "=== DEPLOYMENT STATUS ==="
ps aux | grep node | grep -v grep
echo "Server log (last 5 lines):"
tail -n 5 /root/flipnosis-digitalocean/server.log
echo "=== FORCE DEPLOYMENT COMPLETE ==="
