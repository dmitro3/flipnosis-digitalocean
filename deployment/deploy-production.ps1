# Production Deployment Script for Flipnosis
# This script ensures proper production build and deployment

Write-Host "🔧 Production Deployment for Flipnosis" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

$DROPLET_IP = "143.198.166.196"

Write-Host "This script will build and deploy the application in production mode." -ForegroundColor Yellow
Write-Host "This should fix the localhost:3001 API calls issue." -ForegroundColor Yellow

$confirm = Read-Host "Continue? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Deployment cancelled." -ForegroundColor Red
    exit 0
}

# Set production environment
$env:NODE_ENV = "production"
$env:VITE_NODE_ENV = "production"

Write-Host "Building application in production mode..." -ForegroundColor Blue
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Production build completed successfully" -ForegroundColor Green

# Create deployment package
$deploymentDir = "production-deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
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

echo "Deploying Flipnosis production build..."

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

# Set production environment
export NODE_ENV=production

# Start the service
systemctl start flipnosis-app

# Test the deployment
sleep 5
if systemctl is-active --quiet flipnosis-app; then
    echo "✅ Production deployment successful!"
    echo "🌐 Application is running on https://www.flipnosis.fun"
    echo "🔧 API should now use https://www.flipnosis.fun instead of localhost"
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

Write-Host "Uploading production deployment package to server..." -ForegroundColor Blue
scp $tarFile root@${DROPLET_IP}:/tmp/

Write-Host "Extracting and deploying on server..." -ForegroundColor Blue
ssh root@$DROPLET_IP "cd /tmp && tar -xzf $tarFile && cd $deploymentDir && chmod +x deploy.sh && ./deploy.sh"

# Clean up
Remove-Item $deploymentDir -Recurse -Force
Remove-Item $tarFile -Force

Write-Host "`n✅ Production deployment completed!" -ForegroundColor Green
Write-Host "Your application should now use the correct API URLs." -ForegroundColor Yellow
Write-Host "Test it at: https://www.flipnosis.fun" -ForegroundColor Cyan
Write-Host "The CORS errors should be resolved now." -ForegroundColor Cyan
