#!/bin/bash

# Quick SSL Fix Script
# Run this directly on the server to fix the SSL certificate domain issue

set -e

echo "🔧 Quick SSL Domain Fix for Flipnosis"
echo "====================================="

# Configuration
DOMAIN="flipnosis.fun"
WWW_DOMAIN="www.flipnosis.fun"
EMAIL="strik9games@gmail.com"

# Navigate to the correct directory
cd /root/flipnosis-digitalocean/digitalocean-deploy

# Stop nginx
echo "🛑 Stopping nginx..."
docker-compose stop nginx

# Remove existing certificate
echo "🗑️ Removing existing certificate..."
certbot delete --cert-name "$WWW_DOMAIN" --non-interactive || true

# Get new certificate with both domains
echo "🔐 Obtaining new SSL certificate for both domains..."
certbot certonly --standalone \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "$WWW_DOMAIN" \
    --non-interactive

# Copy certificates
echo "📋 Copying certificates..."
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /etc/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /etc/nginx/ssl/key.pem

# Set permissions
chmod 644 /etc/nginx/ssl/cert.pem
chmod 600 /etc/nginx/ssl/key.pem

# Start nginx
echo "🚀 Starting nginx..."
docker-compose up -d nginx

# Test configuration
echo "🧪 Testing nginx configuration..."
docker-compose exec nginx nginx -t

echo "✅ SSL fix completed!"
echo "🌐 Your site should now work on both:"
echo "   - https://flipnosis.fun"
echo "   - https://www.flipnosis.fun"
