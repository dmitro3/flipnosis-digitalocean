# Simple Deploy and Git Backup Script
# Usage: .\deploy-and-backup.ps1 "Your commit message"

param(
    [string]$CommitMessage = "Auto backup $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
)

$DROPLET_IP = "143.198.166.196"
$DOMAIN = "flipnosis.fun"
$Email = "strik9games@gmail.com"  # Your email

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
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

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

$deployCommands = @"
cd /root/flipnosis-digitalocean
tar -xzf $deployDir.tar.gz
cd deploy-package
cp env-template.txt .env
npm install --production
chmod +x digitalocean-deploy/scripts/setup-ssl.sh
./digitalocean-deploy/scripts/setup-ssl.sh $DOMAIN $Email
systemctl restart nginx
systemctl restart flipnosis-app
rm $deployDir.tar.gz
echo "Deployment completed!"
"@

# Write commands to a temporary file to avoid line ending issues
$tempScript = "deploy-temp.sh"
$deployCommands | Out-File -FilePath $tempScript -Encoding ASCII -NoNewline
scp $tempScript "root@${DROPLET_IP}:/root/flipnosis-digitalocean/"
ssh root@$DROPLET_IP "cd /root/flipnosis-digitalocean && chmod +x deploy-temp.sh && ./deploy-temp.sh && rm deploy-temp.sh"

# Cleanup
Remove-Item $tempScript -Force
Write-Host "Cleaning up..." -ForegroundColor Yellow
Remove-Item $deployDir -Recurse -Force
Remove-Item "$deployDir.tar.gz" -Force

Write-Host "Deployment and backup completed!" -ForegroundColor Green
Write-Host "Your site: https://$DOMAIN" -ForegroundColor Cyan
