# Final Deployment Script
# Usage: .\deploy-final.ps1 "Your commit message"

param(
    [string]$CommitMessage = "Auto backup $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
)

$DROPLET_IP = "143.198.166.196"

Write-Host "Starting final deployment..." -ForegroundColor Green

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
scp "deploy.sh" "root@${DROPLET_IP}:/root/"

# Execute deployment script
ssh root@$DROPLET_IP "chmod +x /root/deploy.sh && /root/deploy.sh"

# Cleanup
Write-Host "Cleaning up..." -ForegroundColor Yellow
Remove-Item $deployDir -Recurse -Force
Remove-Item "$deployDir.tar.gz" -Force

Write-Host "Deployment completed!" -ForegroundColor Green
Write-Host "Your site: https://www.flipnosis.fun" -ForegroundColor Cyan
Write-Host "Note: You may need to hard refresh (Ctrl+F5) to see changes due to browser caching" -ForegroundColor Yellow
