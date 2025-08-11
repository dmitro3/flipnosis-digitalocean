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
Copy-Item -Path "package-lock.json" -Destination "$deployDir/"

# Create tar.gz
tar -czf "$deployDir.tar.gz" $deployDir

# Step 4: Deploy to server
Write-Host "Deploying to server..." -ForegroundColor Yellow
scp "$deployDir.tar.gz" "root@${DROPLET_IP}:/root/"

# Deploy using direct SSH commands to the correct location
ssh root@$DROPLET_IP "cd /root && tar -xzf deploy-package.tar.gz && cd deploy-package && npm install --production && cd /root/flipnosis-digitalocean && systemctl stop flipnosis-app 2>/dev/null || true && cp -r /root/deploy-package/dist/* . && cp -r /root/deploy-package/server . && cp /root/deploy-package/package.json . && cp /root/deploy-package/package-lock.json . && npm install --production && systemctl start flipnosis-app && systemctl restart nginx && rm -rf /root/deploy-package && rm /root/deploy-package.tar.gz && echo 'Deployment completed!'"

# Cleanup
Write-Host "Cleaning up..." -ForegroundColor Yellow
Remove-Item $deployDir -Recurse -Force
Remove-Item "$deployDir.tar.gz" -Force

Write-Host "Deployment and backup completed!" -ForegroundColor Green
Write-Host "Your site: https://$DOMAIN" -ForegroundColor Cyan
