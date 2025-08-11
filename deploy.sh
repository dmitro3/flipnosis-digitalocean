#!/bin/bash

# Deploy script for Flipnosis
echo "Starting deployment..."

# Extract package
cd /root
tar -xzf deploy-package.tar.gz

# Install dependencies
cd deploy-package
npm install --production

# Stop current server
cd /root/flipnosis-digitalocean
pkill -f 'node.*server.js'
sleep 2

# Copy new files
cp -r /root/deploy-package/dist/* .
cp -r /root/deploy-package/server .
cp /root/deploy-package/package.json .
cp /root/deploy-package/package-lock.json .

# Install server dependencies
npm install --production

# Start server
nohup node server/server.js > server.log 2>&1 &

# Restart nginx
systemctl restart nginx

# Cleanup
rm -rf /root/deploy-package
rm /root/deploy-package.tar.gz

echo "Deployment completed successfully!"
