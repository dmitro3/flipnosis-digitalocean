# Chrome Compatibility Fix Deployment Script for Flipnosis
# This script addresses Chrome-specific issues that cause crashes

Write-Host "🔧 Chrome Compatibility Fix Deployment" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

$DROPLET_IP = "143.198.166.196"

Write-Host "This script will deploy fixes for Chrome compatibility issues." -ForegroundColor Yellow
Write-Host "Fixes include:" -ForegroundColor Yellow
Write-Host "- Removed canvas dependency from production build" -ForegroundColor Cyan
Write-Host "- Improved WebSocket handling with heartbeat" -ForegroundColor Cyan
Write-Host "- Better memory management for Chrome" -ForegroundColor Cyan
Write-Host "- Enhanced error handling and timeouts" -ForegroundColor Cyan

$confirm = Read-Host "Continue? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Deployment cancelled." -ForegroundColor Red
    exit 0
}

# Set production environment
$env:NODE_ENV = "production"
$env:VITE_NODE_ENV = "production"

Write-Host "Building application with Chrome compatibility fixes..." -ForegroundColor Blue
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Chrome-compatible build completed successfully" -ForegroundColor Green

# Create deployment package
$deploymentDir = "chrome-fix-deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $deploymentDir -Force

Write-Host "Creating Chrome-compatible deployment package..." -ForegroundColor Blue

# Copy necessary files
Copy-Item -Path "dist" -Destination "$deploymentDir/" -Recurse -Force
Copy-Item -Path "server" -Destination "$deploymentDir/" -Recurse -Force
Copy-Item -Path "package.json" -Destination "$deploymentDir/" -Force
Copy-Item -Path "package-lock.json" -Destination "$deploymentDir/" -Force

# Create deployment script
$deployScript = @'
#!/bin/bash
set -e

echo "Deploying Chrome compatibility fixes..."

# Stop the current service
systemctl stop flipnosis-app

# Backup current deployment
if [ -d "/opt/flipnosis/current-deployment" ]; then
    mv /opt/flipnosis/current-deployment /opt/flipnosis/backup-chrome-fix-$(date +%Y%m%d-%H%M%S)
fi

# Create new deployment directory
mkdir -p /opt/flipnosis/current-deployment

# Copy new files
cp -r dist/* /opt/flipnosis/current-deployment/
cp -r server /opt/flipnosis/current-deployment/
cp package.json /opt/flipnosis/current-deployment/
cp package-lock.json /opt/flipnosis/current-deployment/

# Install dependencies (excluding canvas for production)
cd /opt/flipnosis/current-deployment
npm ci --only=production --omit=dev

# Set production environment
export NODE_ENV=production

# Start the service
systemctl start flipnosis-app

# Test the deployment
sleep 5
if systemctl is-active --quiet flipnosis-app; then
    echo "✅ Chrome compatibility fix deployment successful!"
    echo "🌐 Application is running on https://www.flipnosis.fun"
    echo "🔧 Chrome should now work without crashes"
    echo "📊 Check logs: journalctl -u flipnosis-app -f"
else
    echo "❌ Deployment failed!"
    systemctl status flipnosis-app
    exit 1
fi
'@

# Save deployment script
$deployScript | Out-File -FilePath "$deploymentDir/deploy.sh" -Encoding ASCII -NoNewline

# Create tar.gz package
$tarFile = "$deploymentDir.tar.gz"
tar -czf $tarFile $deploymentDir

Write-Host "Uploading Chrome compatibility fix package to server..." -ForegroundColor Blue
scp $tarFile root@${DROPLET_IP}:/tmp/

Write-Host "Extracting and deploying Chrome fixes on server..." -ForegroundColor Blue
ssh root@$DROPLET_IP "cd /tmp; tar -xzf $tarFile; cd $deploymentDir; chmod +x deploy.sh; ./deploy.sh"

# Clean up
Remove-Item $deploymentDir -Recurse -Force
Remove-Item $tarFile -Force

Write-Host "`n✅ Chrome compatibility fix deployment completed!" -ForegroundColor Green
Write-Host "Your application should now work properly in Chrome." -ForegroundColor Yellow
Write-Host "Test it at: https://www.flipnosis.fun" -ForegroundColor Cyan
Write-Host "The Chrome crashes should be resolved now." -ForegroundColor Cyan
