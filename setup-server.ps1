# Server Setup Script for Flipnosis
# This script sets up the server with systemd services (no Docker)

Write-Host "🔧 Setting up Digital Ocean Server" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

$DROPLET_IP = "143.198.166.196"

Write-Host "This script will set up your server with systemd services instead of Docker." -ForegroundColor Yellow
Write-Host "This approach is more reliable and easier to manage." -ForegroundColor Yellow

$confirm = Read-Host "Continue? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Setup cancelled." -ForegroundColor Red
    exit 0
}

# Create server setup script
$setupScript = @"
#!/bin/bash
set -e

echo "Setting up Flipnosis server..."

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install nginx
apt install -y nginx

# Install PM2 for process management
npm install -g pm2

# Create application directory
mkdir -p /opt/flipnosis
cd /opt/flipnosis

# Create systemd service for the app
cat > /etc/systemd/system/flipnosis-app.service << 'EOF'
[Unit]
Description=Flipnosis Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/flipnosis/current-deployment
ExecStart=/usr/bin/node server/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# Create nginx configuration
cat > /etc/nginx/sites-available/flipnosis << 'EOF'
server {
    listen 80;
    server_name www.flipnosis.fun flipnosis.fun;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.flipnosis.fun flipnosis.fun;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_read_timeout 86400;
    }
}
EOF

# Enable nginx site
ln -sf /etc/nginx/sites-available/flipnosis /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Create SSL directory
mkdir -p /etc/nginx/ssl

# Reload systemd and enable services
systemctl daemon-reload
systemctl enable flipnosis-app
systemctl enable nginx

echo "Server setup completed!"
echo "Next steps:"
echo "1. Deploy your application using the deploy.ps1 script"
echo "2. SSL certificates will be set up automatically during deployment"
EOF

# Save setup script
$setupScript | Out-File -FilePath "server-setup.sh" -Encoding ASCII -NoNewline

# Upload and execute on server
Write-Host "Uploading setup script to server..." -ForegroundColor Blue
scp "server-setup.sh" root@${DROPLET_IP}:/tmp/

Write-Host "Executing server setup..." -ForegroundColor Blue
ssh root@$DROPLET_IP "chmod +x /tmp/server-setup.sh && /tmp/server-setup.sh"

# Clean up
Remove-Item "server-setup.sh" -Force

Write-Host "`n✅ Server setup completed!" -ForegroundColor Green
Write-Host "Your server is now ready for deployment." -ForegroundColor Yellow
Write-Host "Run the deploy.ps1 script to deploy your application." -ForegroundColor Cyan
