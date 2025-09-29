# Socket.io Migration Deployment Script
# This script deploys the Socket.io migration to the production server

param(
    [string]$CommitMessage = "Socket.io migration deployment $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
)

$PRODUCTION_IP = "159.69.242.154"

Write-Host "🚀 Deploying Socket.io Migration to Production" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host "Server: $PRODUCTION_IP" -ForegroundColor Yellow
Write-Host "Commit: $CommitMessage" -ForegroundColor Yellow

$confirm = Read-Host "Continue with deployment? (y/N)"
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
$deployDir = "socketio-deploy-package"
if (Test-Path $deployDir) {
    Remove-Item $deployDir -Recurse -Force
}

Write-Host "📦 Creating deployment package..." -ForegroundColor Blue
New-Item -ItemType Directory -Path $deployDir -Force

# Copy necessary files
Copy-Item -Path "dist" -Destination "$deployDir/dist" -Recurse -Force
Copy-Item -Path "server" -Destination "$deployDir/server" -Recurse -Force
Copy-Item -Path "package.json" -Destination "$deployDir/" -Force
Copy-Item -Path "package-lock.json" -Destination "$deployDir/" -Force

# Create tar.gz
Write-Host "🗜️ Creating deployment archive..." -ForegroundColor Blue
tar -czf "$deployDir.tar.gz" $deployDir

# Step 4: Deploy to production server
Write-Host "🚀 Deploying to production server..." -ForegroundColor Blue
Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  - Stop the current server" -ForegroundColor Yellow
Write-Host "  - Install new Socket.io dependencies" -ForegroundColor Yellow
Write-Host "  - Deploy new server code with Socket.io" -ForegroundColor Yellow
Write-Host "  - Restart the server" -ForegroundColor Yellow

# Upload deployment package
scp "$deployDir.tar.gz" "root@${PRODUCTION_IP}:/root/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload deployment package!" -ForegroundColor Red
    exit 1
}

# Deploy and restart server
Write-Host "🔄 Deploying and restarting server..." -ForegroundColor Blue
ssh root@$PRODUCTION_IP @"
set -e
echo "🚀 Starting Socket.io deployment..."

# Extract deployment package
cd /root
tar -xzf socketio-deploy-package.tar.gz
cd socketio-deploy-package

# Install new dependencies (including Socket.io)
echo "📦 Installing Socket.io dependencies..."
npm install --production

# Stop current server
echo "🛑 Stopping current server..."
pkill -f 'node.*server.js' || true
sleep 3

# Backup current deployment
echo "💾 Backing up current deployment..."
cd /var/www/flipnosis
cp -r dist dist.backup.$(date +%Y%m%d_%H%M%S) || true
cp -r server server.backup.$(date +%Y%m%d_%H%M%S) || true

# Deploy new files
echo "📁 Deploying new files..."
cp -r /root/socketio-deploy-package/dist/* .
cp -r /root/socketio-deploy-package/server .
cp /root/socketio-deploy-package/package.json .
cp /root/socketio-deploy-package/package-lock.json .

# Install dependencies in production directory
echo "📦 Installing production dependencies..."
npm install --production

# Start new server with Socket.io
echo "🚀 Starting server with Socket.io..."
nohup node server/server.js > server.log 2>&1 &

# Wait for server to start
sleep 5

# Check if server is running
if pgrep -f 'node.*server.js' > /dev/null; then
    echo "✅ Server started successfully with Socket.io!"
    echo "📊 Server status:"
    ps aux | grep 'node.*server.js' | grep -v grep
else
    echo "❌ Server failed to start!"
    echo "📋 Server logs:"
    tail -20 server.log
    exit 1
fi

# Restart nginx
echo "🔄 Restarting nginx..."
systemctl restart nginx

# Cleanup
echo "🧹 Cleaning up..."
rm -rf /root/socketio-deploy-package
rm /root/socketio-deploy-package.tar.gz

echo "🎉 Socket.io deployment completed successfully!"
echo "🔗 Server should now be running with Socket.io at https://flipnosis.fun"
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

# Cleanup local files
Write-Host "🧹 Cleaning up local files..." -ForegroundColor Blue
Remove-Item $deployDir -Recurse -Force
Remove-Item "$deployDir.tar.gz" -Force

Write-Host "🎉 Socket.io deployment completed successfully!" -ForegroundColor Green
Write-Host "🔗 Production server should now be running with Socket.io" -ForegroundColor Green
Write-Host "🧪 Test the connection at https://flipnosis.fun" -ForegroundColor Yellow
