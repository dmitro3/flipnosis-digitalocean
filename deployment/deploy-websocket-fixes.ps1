# WebSocket Fixes Deployment Script
# This script applies all the WebSocket and SSL fixes as prescribed by Claude

Write-Host "🚀 Deploying WebSocket and SSL fixes..." -ForegroundColor Green

# Step 1: Copy nginx configuration
Write-Host "📝 Copying nginx configuration..." -ForegroundColor Yellow

$nginxConfig = @'
# /etc/nginx/sites-available/flipnosis
server {
    listen 80;
    server_name flipnosis.fun www.flipnosis.fun;
    
    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name flipnosis.fun www.flipnosis.fun;

    # SSL Configuration - Use Let's Encrypt or your own certificates
    ssl_certificate /etc/letsencrypt/live/flipnosis.fun/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/flipnosis.fun/privkey.pem;
    
    # If you don't have Let's Encrypt yet, temporarily use self-signed
    # ssl_certificate /etc/ssl/certs/selfsigned.crt;
    # ssl_certificate_key /etc/ssl/private/selfsigned.key;

    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Increase timeouts for WebSocket
    proxy_connect_timeout 7d;
    proxy_send_timeout 7d;
    proxy_read_timeout 7d;

    # WebSocket specific location
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Disable buffering for WebSocket
        proxy_buffering off;
        proxy_cache off;
        
        # WebSocket timeout settings
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
        keepalive_timeout 86400s;
        
        # Frame size for WebSocket
        proxy_max_temp_file_size 0;
    }

    # API routes
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase body size for file uploads
        client_max_body_size 50M;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Static files and everything else
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Enable gzip
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    }
}
'@

# Save nginx config to a temporary file
$nginxConfig | Out-File -FilePath "nginx-flipnosis.conf" -Encoding UTF8

Write-Host "✅ Nginx configuration prepared" -ForegroundColor Green

# Step 2: Create SSL setup script
Write-Host "🔒 Creating SSL setup script..." -ForegroundColor Yellow

$sslScript = @'
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
echo "1. Make sure your domain points to IP: 159.69.242.154"
echo "2. Restart your Node.js server: pm2 restart all"
echo "3. Check WebSocket connection in browser console"
'@

$sslScript | Out-File -FilePath "ssl-setup.sh" -Encoding UTF8

Write-Host "✅ SSL setup script created" -ForegroundColor Green

# Step 3: Deploy to server
Write-Host "🚀 Deploying to server..." -ForegroundColor Yellow

# Build the project
Write-Host "📦 Building project..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful" -ForegroundColor Green

# Deploy using the existing deployment script
Write-Host "🚀 Running deployment..." -ForegroundColor Yellow
& ".\deployment\deploy-hetzner-git-fixed.ps1" "WebSocket and SSL fixes - improved connection handling and SSL setup"

Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. SSH into your server and run the SSL setup script:" -ForegroundColor White
Write-Host "   chmod +x ssl-setup.sh && ./ssl-setup.sh" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Copy the nginx configuration:" -ForegroundColor White
Write-Host "   sudo cp nginx-flipnosis.conf /etc/nginx/sites-available/flipnosis" -ForegroundColor Gray
Write-Host "   sudo nginx -t && sudo systemctl reload nginx" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Restart the Node.js server:" -ForegroundColor White
Write-Host "   pm2 restart all" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Test the WebSocket connection in your browser" -ForegroundColor White
Write-Host ""
Write-Host "🔧 The fixes include:" -ForegroundColor Cyan
Write-Host "• Improved WebSocket reconnection logic with exponential backoff" -ForegroundColor White
Write-Host "• Message queuing when disconnected" -ForegroundColor White
Write-Host "• Input fields remain enabled even when WebSocket is disconnected" -ForegroundColor White
Write-Host "• Proper SSL certificate handling with Lets Encrypt" -ForegroundColor White
Write-Host "• Nginx proxy configuration for WebSocket support" -ForegroundColor White
