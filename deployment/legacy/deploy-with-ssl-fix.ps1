# Deploy with SSL Domain Fix Script
# This script deploys and fixes the SSL certificate to include both www and non-www domains

param(
    [string]$CommitMessage = "SSL domain fix deployment $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
)

$DROPLET_IP = "143.198.166.196"
$DOMAIN = "flipnosis.fun"
$Email = "strik9games@gmail.com"

Write-Host "Starting deployment with SSL domain fix..." -ForegroundColor Green

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

# Deploy and fix SSL domains
Write-Host "Deploying and fixing SSL domains..." -ForegroundColor Yellow
ssh root@$DROPLET_IP "cd /root/flipnosis-digitalocean && tar -xzf deploy-package.tar.gz && cd deploy-package && cp env-template.txt .env && npm install --production && chmod +x digitalocean-deploy/scripts/fix-ssl-domains.sh && ./digitalocean-deploy/scripts/fix-ssl-domains.sh && systemctl restart flipnosis-app && rm deploy-package.tar.gz && echo 'Deployment with SSL fix completed!'"

# Cleanup
Write-Host "Cleaning up..." -ForegroundColor Yellow
Remove-Item $deployDir -Recurse -Force
Remove-Item "$deployDir.tar.gz" -Force

Write-Host "Deployment with SSL fix completed!" -ForegroundColor Green
Write-Host "Your site should now work on both:" -ForegroundColor Cyan
Write-Host "  - https://$DOMAIN" -ForegroundColor Cyan
Write-Host "  - https://www.$DOMAIN" -ForegroundColor Cyan
Write-Host "The freezing issue should be resolved!" -ForegroundColor Green
