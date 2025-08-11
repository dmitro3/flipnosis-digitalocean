# Simple Deploy and Git Backup Script
# Usage: .\deploy-and-backup.ps1 "Your commit message"

param(
    [string]$CommitMessage = "Auto backup $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
)

$DROPLET_IP = "143.198.166.196"
$DOMAIN = "flipnosis.fun"
$Email = "strik9games@gmail.com"

Write-Host "Starting deployment and backup process..." -ForegroundColor Green

# Step 1: Git backup
Write-Host "Creating git backup..." -ForegroundColor Yellow
git add .
git commit -m $CommitMessage
git push origin main

# Step 2: Build locally
Write-Host "Building application..." -ForegroundColor Yellow
npm install
npm run build

# Step 3: Create deployment package
$deployDir = "deploy-package"
if (Test-Path $deployDir) {
    Remove-Item $deployDir -Recurse -Force
}

Write-Host "Creating deployment package..." -ForegroundColor Yellow
Copy-Item -Path "dist" -Destination "$deployDir/dist" -Recurse
Copy-Item -Path "server" -Destination "$deployDir/server" -Recurse
Copy-Item -Path "package.json" -Destination "$deployDir/"
Copy-Item -Path "digitalocean-deploy" -Destination "$deployDir/" -Recurse
Copy-Item -Path "env-template.txt" -Destination "$deployDir/"

# Create tar.gz
tar -czf "$deployDir.tar.gz" $deployDir

# Step 4: Deploy to server
Write-Host "Deploying to server..." -ForegroundColor Yellow
scp "$deployDir.tar.gz" "root@${DROPLET_IP}:/root/flipnosis-digitalocean/"

# Create a simple deployment script on the server
$deployScript = @"
#!/bin/bash
set -e
cd /root/flipnosis-digitalocean
tar -xzf deploy-package.tar.gz
cd deploy-package
cp env-template.txt .env
npm install --production
chmod +x digitalocean-deploy/scripts/setup-ssl.sh
./digitalocean-deploy/scripts/setup-ssl.sh $DOMAIN $Email
systemctl restart nginx
systemctl restart flipnosis-app
rm deploy-package.tar.gz
echo "Deployment completed!"
"@

# Write the script to a file with proper line endings
$deployScript | Out-File -FilePath "deploy-server.sh" -Encoding ASCII -NoNewline
scp "deploy-server.sh" "root@${DROPLET_IP}:/root/flipnosis-digitalocean/"
ssh root@$DROPLET_IP "cd /root/flipnosis-digitalocean && chmod +x deploy-server.sh && ./deploy-server.sh && rm deploy-server.sh"

# Cleanup
Remove-Item "deploy-server.sh" -Force
Write-Host "Cleaning up..." -ForegroundColor Yellow
Remove-Item $deployDir -Recurse -Force
Remove-Item "$deployDir.tar.gz" -Force

Write-Host "Deployment and backup completed!" -ForegroundColor Green
Write-Host "Your site: https://$DOMAIN" -ForegroundColor Cyan
