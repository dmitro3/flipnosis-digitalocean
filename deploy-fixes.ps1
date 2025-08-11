# Deploy Fixes Script for Flipnosis
# This script deploys the fixes for the crashing issues

Write-Host "🔧 Deploying Fixes to Digital Ocean Server" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

$DROPLET_IP = "143.198.166.196"

Write-Host "This script will deploy the fixes for the crashing issues." -ForegroundColor Yellow
Write-Host "The fixes include:" -ForegroundColor Yellow
Write-Host "- Fixed API configuration to use correct ports and domain" -ForegroundColor Cyan
Write-Host "- Fixed infinite loops in CoinSelector component" -ForegroundColor Cyan
Write-Host "- Reduced debug logging to prevent performance issues" -ForegroundColor Cyan
Write-Host "- Updated nginx configuration to proxy to correct port" -ForegroundColor Cyan

$confirm = Read-Host "Continue? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Deployment cancelled." -ForegroundColor Red
    exit 0
}

# Build the application
Write-Host "Building application..." -ForegroundColor Blue
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completed successfully" -ForegroundColor Green

# Create deployment package
$deploymentDir = "deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $deploymentDir -Force

Write-Host "Creating deployment package..." -ForegroundColor Blue

# Copy necessary files
Copy-Item -Path "dist" -Destination "$deploymentDir/" -Recurse -Force
Copy-Item -Path "server" -Destination "$deploymentDir/" -Recurse -Force
Copy-Item -Path "package.json" -Destination "$deploymentDir/" -Force
Copy-Item -Path "package-lock.json" -Destination "$deploymentDir/" -Force

# Create deployment script
$deployScript = @"
#!/bin/bash
set -e

echo "Deploying Flipnosis fixes..."

# Stop the current service
systemctl stop flipnosis-app

# Backup current deployment
if [ -d "/opt/flipnosis/current-deployment" ]; then
    mv /opt/flipnosis/current-deployment /opt/flipnosis/backup-\$(date +%Y%m%d-%H%M%S)
fi

# Create new deployment directory
mkdir -p /opt/flipnosis/current-deployment

# Copy new files
cp -r dist/* /opt/flipnosis/current-deployment/
cp -r server /opt/flipnosis/current-deployment/
cp package.json /opt/flipnosis/current-deployment/
cp package-lock.json /opt/flipnosis/current-deployment/

# Install dependencies
cd /opt/flipnosis/current-deployment
npm ci --only=production

# Update nginx configuration to use port 3001
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
        proxy_pass http://localhost:3001;
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
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_read_timeout 86400;
    }
}
EOF

# Update systemd service to use port 3001
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
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and restart services
systemctl daemon-reload
systemctl restart nginx
systemctl start flipnosis-app

# Test the deployment
sleep 5
if systemctl is-active --quiet flipnosis-app; then
    echo "✅ Deployment successful!"
    echo "🌐 Application is running on https://www.flipnosis.fun"
else
    echo "❌ Deployment failed!"
    systemctl status flipnosis-app
    exit 1
fi
"@

# Save deployment script
$deployScript | Out-File -FilePath "$deploymentDir/deploy.sh" -Encoding ASCII -NoNewline

# Create tar.gz package
$tarFile = "$deploymentDir.tar.gz"
tar -czf $tarFile $deploymentDir

Write-Host "Uploading deployment package to server..." -ForegroundColor Blue
scp $tarFile root@${DROPLET_IP}:/tmp/

Write-Host "Extracting and deploying on server..." -ForegroundColor Blue
ssh root@$DROPLET_IP "cd /tmp && tar -xzf $tarFile && cd $deploymentDir && chmod +x deploy.sh && ./deploy.sh"

# Clean up
Remove-Item $deploymentDir -Recurse -Force
Remove-Item $tarFile -Force

Write-Host "`n✅ Deployment completed!" -ForegroundColor Green
Write-Host "Your application should now be running without crashes." -ForegroundColor Yellow
Write-Host "Test it at: https://www.flipnosis.fun" -ForegroundColor Cyan
