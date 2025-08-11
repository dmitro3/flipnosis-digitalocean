# Force Complete Deployment Script
# This script will completely rebuild and redeploy everything

param(
    [string]$CommitMessage = "Force deployment $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
)

$DROPLET_IP = "143.198.166.196"

Write-Host "🚀 FORCE DEPLOYMENT - Complete Rebuild" -ForegroundColor Red
Write-Host "=====================================" -ForegroundColor Red
Write-Host "This will completely rebuild and redeploy everything" -ForegroundColor Yellow

$confirm = Read-Host "Are you sure? This will stop the server and rebuild everything (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Deployment cancelled." -ForegroundColor Red
    exit 0
}

Write-Host "`nStep 1: Git backup..." -ForegroundColor Green
git add .
git commit -m $CommitMessage
git push origin main

Write-Host "`nStep 2: Build locally..." -ForegroundColor Green
npm install
npm run build

Write-Host "`nStep 3: Create fresh deployment package..." -ForegroundColor Green
$deployDir = "force-deploy-package"
if (Test-Path $deployDir) {
    Remove-Item $deployDir -Recurse -Force
}

Copy-Item -Path "dist" -Destination "$deployDir/dist" -Recurse
Copy-Item -Path "server" -Destination "$deployDir/server" -Recurse
Copy-Item -Path "package.json" -Destination "$deployDir/"
Copy-Item -Path "package-lock.json" -Destination "$deployDir/"

tar -czf "$deployDir.tar.gz" $deployDir

Write-Host "`nStep 4: STOP current server and deploy..." -ForegroundColor Green
scp "$deployDir.tar.gz" "root@${DROPLET_IP}:/root/"

# Force deployment script
$forceDeployScript = @"
#!/bin/bash
echo "=== FORCE DEPLOYMENT STARTING ==="

# Stop everything
echo "Stopping current server..."
pkill -f 'node.*server.js'
sleep 3

# Clean everything
echo "Cleaning old files..."
cd /root/flipnosis-digitalocean
rm -rf dist/*
rm -rf node_modules
rm package-lock.json

# Extract new files
echo "Extracting new deployment..."
cd /root
tar -xzf force-deploy-package.tar.gz

# Copy new files
echo "Copying new files..."
cp -r force-deploy-package/dist/* /root/flipnosis-digitalocean/
cp -r force-deploy-package/server /root/flipnosis-digitalocean/
cp force-deploy-package/package.json /root/flipnosis-digitalocean/
cp force-deploy-package/package-lock.json /root/flipnosis-digitalocean/

# Install dependencies
echo "Installing dependencies..."
cd /root/flipnosis-digitalocean
npm install --production

# Start server
echo "Starting server..."
nohup node server/server.js > server.log 2>&1 &
sleep 2

# Restart nginx
echo "Restarting nginx..."
systemctl restart nginx

# Cleanup
echo "Cleaning up..."
rm -rf /root/force-deploy-package
rm /root/force-deploy-package.tar.gz

# Show status
echo "=== DEPLOYMENT STATUS ==="
ps aux | grep node | grep -v grep
echo "Server log (last 5 lines):"
tail -n 5 /root/flipnosis-digitalocean/server.log
echo "=== FORCE DEPLOYMENT COMPLETE ==="
"@

# Save and execute the script
$forceDeployScript | Out-File -FilePath "force-deploy.sh" -Encoding ASCII
scp "force-deploy.sh" "root@${DROPLET_IP}:/root/"
ssh root@$DROPLET_IP "chmod +x /root/force-deploy.sh && /root/force-deploy.sh"

Write-Host "`nStep 5: Cleanup..." -ForegroundColor Green
Remove-Item $deployDir -Recurse -Force
Remove-Item "$deployDir.tar.gz" -Force
Remove-Item "force-deploy.sh" -Force

Write-Host "`n✅ FORCE DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "Your site: https://www.flipnosis.fun" -ForegroundColor Cyan
Write-Host "Check the server output above for any errors." -ForegroundColor Yellow
