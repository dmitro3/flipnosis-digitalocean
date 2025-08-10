#!/bin/bash

# SSL Setup Script for Flipnosis
# This script sets up SSL certificates using Let's Encrypt

set -e

# Configuration
DOMAIN=${1:-"www.flipnosis.fun"}  # Your domain
EMAIL=${2:-"admin@flipnosis.fun"}  # Your email

echo "🚀 Setting up SSL certificates for $DOMAIN"

# Check if domain is provided
if [ "$DOMAIN" = "www.flipnosis.fun" ] && [ "$1" = "" ]; then
    echo "✅ Using default domain: $DOMAIN"
fi

# Create SSL directory
mkdir -p /etc/nginx/ssl

# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing certbot..."
    apt-get update
    apt-get install -y certbot
fi

# Stop nginx temporarily to free up port 80
echo "🛑 Stopping nginx temporarily..."
docker-compose stop nginx

# Get SSL certificate
echo "🔐 Obtaining SSL certificate from Let's Encrypt..."
certbot certonly --standalone \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    --non-interactive

# Copy certificates to nginx ssl directory
echo "📋 Copying certificates to nginx directory..."
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /etc/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /etc/nginx/ssl/key.pem

# Set proper permissions
chmod 644 /etc/nginx/ssl/cert.pem
chmod 600 /etc/nginx/ssl/key.pem

# Update nginx configuration with domain name
echo "⚙️ Updating nginx configuration..."
sed -i "s/server_name _;/server_name $DOMAIN;/g" /etc/nginx/nginx.conf

# Start nginx
echo "🚀 Starting nginx with SSL..."
docker-compose up -d nginx

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
docker-compose exec nginx nginx -t

# Set up automatic renewal
echo "🔄 Setting up automatic certificate renewal..."
cat > /etc/cron.d/ssl-renewal << EOF
0 12 * * * /usr/bin/certbot renew --quiet --deploy-hook "docker-compose -f /root/flipnosis-digitalocean/digitalocean-deploy/docker-compose.yml exec nginx nginx -s reload"
EOF

echo "✅ SSL setup completed successfully!"
echo "🌐 Your site should now be accessible at: https://$DOMAIN"
echo "📅 Certificates will auto-renew every 60 days"
