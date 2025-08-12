# Hetzner Server Deployment Script
# Deploys the Chrome extension fix to the Hetzner server

$HETZNER_IP = "159.69.242.154"

Write-Host "Deploying Chrome Extension Fix to Hetzner Server..." -ForegroundColor Green
Write-Host "Server IP: $HETZNER_IP" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build the application
Write-Host "Step 1: Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Build completed successfully" -ForegroundColor Green

# Step 2: Create deployment package
Write-Host "Step 2: Creating deployment package..." -ForegroundColor Yellow
$deployDir = "hetzner-deploy-$(Get-Date -Format 'yyyyMMdd_HHmmss')"
if (Test-Path $deployDir) {
    Remove-Item $deployDir -Recurse -Force
}

Copy-Item -Path "dist" -Destination "$deployDir/dist" -Recurse
Copy-Item -Path "server" -Destination "$deployDir/server" -Recurse
Copy-Item -Path "package.json" -Destination "$deployDir/"
Copy-Item -Path "package-lock.json" -Destination "$deployDir/"

# Create tar.gz
tar -czf "$deployDir.tar.gz" $deployDir

# Step 3: Deploy to Hetzner server
Write-Host "Step 3: Deploying to Hetzner server..." -ForegroundColor Yellow
Write-Host "Uploading files to $HETZNER_IP..." -ForegroundColor Cyan

scp "$deployDir.tar.gz" "root@${HETZNER_IP}:/root/"

# Step 4: Execute deployment on server
Write-Host "Step 4: Executing deployment on server..." -ForegroundColor Yellow
ssh root@$HETZNER_IP @"
cd /root
tar -xzf $deployDir.tar.gz
cd $deployDir
npm install --production
pm2 restart all || pm2 start server/server.js --name flipnosis
"@

# Step 5: Cleanup
Write-Host "Step 5: Cleaning up..." -ForegroundColor Yellow
Remove-Item $deployDir -Recurse -Force
Remove-Item "$deployDir.tar.gz" -Force

Write-Host ""
Write-Host "Chrome Extension Fix Deployment Completed!" -ForegroundColor Green
Write-Host "Your site: http://$HETZNER_IP" -ForegroundColor Cyan
Write-Host "Domain: https://www.flipnosis.fun" -ForegroundColor Cyan
Write-Host ""
Write-Host "Changes deployed:" -ForegroundColor Yellow
Write-Host "  - Enhanced error handling for Chrome extension conflicts" -ForegroundColor White
Write-Host "  - Added null property checks for wallet client" -ForegroundColor White
Write-Host "  - Global error handlers for unhandled promise rejections" -ForegroundColor White
Write-Host "  - Chrome extension detection and conflict prevention" -ForegroundColor White
Write-Host ""
Write-Host "Test the site in Chrome to verify the fix works!" -ForegroundColor Green
