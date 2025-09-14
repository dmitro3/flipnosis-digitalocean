# Deposit Flow Fixes Deployment Script
# Deploys the deposit UI, countdown timer, and CORS fixes to Hetzner production server

param(
    [string]$CommitMessage = "Deposit flow fixes: UI for both players, synchronized countdown, CORS fixes $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
)

$HETZNER_IP = "159.69.242.154"

Write-Host "🚀 Deploying Deposit Flow Fixes to Hetzner" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Server: $HETZNER_IP" -ForegroundColor Yellow
Write-Host "Commit: $CommitMessage" -ForegroundColor Yellow

$confirm = Read-Host "Deploy deposit flow fixes to production? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Deployment cancelled." -ForegroundColor Red
    exit 0
}

# Step 1: Git backup
Write-Host "📦 Creating git backup..." -ForegroundColor Blue
git add .
git commit -m $CommitMessage
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git push failed!" -ForegroundColor Red
    exit 1
}

# Step 2: Build locally
Write-Host "🔨 Building application..." -ForegroundColor Blue
npm install
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completed successfully" -ForegroundColor Green

# Step 3: Create deployment package
$deployDir = "hetzner-deposit-fixes-deploy"
if (Test-Path $deployDir) {
    Remove-Item $deployDir -Recurse -Force
}

Write-Host "📦 Creating deployment package..." -ForegroundColor Blue
New-Item -ItemType Directory -Path $deployDir -Force

# Copy built files
Copy-Item -Path "dist" -Destination "$deployDir/" -Recurse -Force
Copy-Item -Path "server" -Destination "$deployDir/" -Recurse -Force
Copy-Item -Path "package.json" -Destination "$deployDir/" -Force
Copy-Item -Path "package-lock.json" -Destination "$deployDir/" -Force

# Create deployment script for server
$deployScript = @"
#!/bin/bash
set -e

echo "🚀 Deploying deposit flow fixes to Hetzner server..."

# Stop the current server
echo "⏹️ Stopping current server..."
pm2 stop flipnosis || true
pm2 delete flipnosis || true

# Backup current deployment
echo "💾 Creating backup..."
if [ -d "/var/www/flipnosis-backup" ]; then
    rm -rf /var/www/flipnosis-backup
fi
if [ -d "/var/www/flipnosis" ]; then
    mv /var/www/flipnosis /var/www/flipnosis-backup
fi

# Create new deployment directory
mkdir -p /var/www/flipnosis
cd /var/www/flipnosis

# Extract deployment package
echo "📦 Extracting deployment package..."
tar -xzf /tmp/deposit-fixes-deploy.tar.gz

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install --production
cd ..

# Set proper permissions
echo "🔐 Setting permissions..."
chown -R www-data:www-data /var/www/flipnosis
chmod -R 755 /var/www/flipnosis

# Start the server
echo "🚀 Starting server..."
cd /var/www/flipnosis
pm2 start server/server.js --name flipnosis --env production
pm2 save
pm2 startup

# Restart nginx
echo "🔄 Restarting nginx..."
systemctl restart nginx

echo "✅ Deposit flow fixes deployed successfully!"
echo "🎮 Server should now have:"
echo "   - Fixed CORS for deposit-confirmed API"
echo "   - Synchronized countdown timer for both players"
echo "   - Proper deposit UI for both players"
echo "   - Game suite navigation after deposit"
"@

$deployScript | Out-File -FilePath "$deployDir/deploy.sh" -Encoding UTF8

# Create tar.gz package
Write-Host "📦 Creating deployment archive..." -ForegroundColor Blue
Set-Location $deployDir
tar -czf "../deposit-fixes-deploy.tar.gz" *
Set-Location ..

# Upload to server
Write-Host "📤 Uploading to Hetzner server..." -ForegroundColor Blue
scp -o StrictHostKeyChecking=no deposit-fixes-deploy.tar.gz root@$HETZNER_IP:/tmp/

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Upload failed!" -ForegroundColor Red
    exit 1
}

# Execute deployment on server
Write-Host "🚀 Executing deployment on server..." -ForegroundColor Blue
ssh -o StrictHostKeyChecking=no root@$HETZNER_IP "chmod +x /tmp/deposit-fixes-deploy.tar.gz && tar -xzf /tmp/deposit-fixes-deploy.tar.gz -C /tmp/ && chmod +x /tmp/deploy.sh && /tmp/deploy.sh"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment execution failed!" -ForegroundColor Red
    exit 1
}

# Cleanup
Write-Host "🧹 Cleaning up..." -ForegroundColor Blue
Remove-Item -Path $deployDir -Recurse -Force
Remove-Item -Path "deposit-fixes-deploy.tar.gz" -Force

Write-Host "✅ Deposit flow fixes deployed successfully!" -ForegroundColor Green
Write-Host "🎮 The following fixes are now live:" -ForegroundColor Yellow
Write-Host "   - Fixed CORS for deposit-confirmed API endpoint" -ForegroundColor White
Write-Host "   - Synchronized 2-minute countdown timer for both players" -ForegroundColor White
Write-Host "   - Deposit UI now shows for both Player 1 and Player 2" -ForegroundColor White
Write-Host "   - Proper game suite navigation after successful deposit" -ForegroundColor White
Write-Host "   - WebSocket connection stability improvements" -ForegroundColor White

Write-Host "🌐 Test the fixes at: https://flipnosis.fun" -ForegroundColor Cyan
