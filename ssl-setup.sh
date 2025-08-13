#!/bin/bash

# SSL Setup Script for flipnosis.fun
# This script sets up Let's Encrypt SSL certificates

echo "🔒 Setting up SSL certificates for flipnosis.fun"

# Update system
sudo apt update

# Install certbot and nginx plugin
sudo apt install -y certbot python3-certbot-nginx

# Stop nginx temporarily
sudo systemctl stop nginx

# Get SSL certificate from Let's Encrypt
# Use --standalone if nginx is not configured yet
sudo certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --email admin@flipnosis.fun \
    -d flipnosis.fun \
    -d www.flipnosis.fun

# Check if successful
if [ $? -eq 0 ]; then
    echo "✅ SSL certificates obtained successfully"
    
    # Copy nginx configuration
    sudo cp /etc/nginx/sites-available/flipnosis /etc/nginx/sites-available/flipnosis.backup
    
    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/flipnosis /etc/nginx/sites-enabled/
    
    # Remove default nginx site if exists
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    sudo nginx -t
    
    if [ $? -eq 0 ]; then
        # Restart nginx
        sudo systemctl start nginx
        sudo systemctl reload nginx
        echo "✅ Nginx restarted with SSL configuration"
    else
        echo "❌ Nginx configuration error, please check"
        sudo systemctl start nginx
    fi
    
    # Setup auto-renewal
    echo "0 0,12 * * * root python3 -c 'import random; import time; time.sleep(random.random() * 3600)' && certbot renew -q" | sudo tee -a /etc/crontab > /dev/null
    echo "✅ Auto-renewal configured"
    
else
    echo "❌ Failed to obtain SSL certificates"
    echo "Falling back to self-signed certificates..."
    
    # Create self-signed certificate as fallback
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/ssl/private/selfsigned.key \
        -out /etc/ssl/certs/selfsigned.crt \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=flipnosis.fun"
    
    echo "⚠️ Self-signed certificate created (temporary solution)"
    
    # Start nginx
    sudo systemctl start nginx
fi

echo "📝 SSL setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure your domain points to IP: 116.202.24.43"
echo "2. Restart your Node.js server: pm2 restart all"
echo "3. Check WebSocket connection in browser console"
