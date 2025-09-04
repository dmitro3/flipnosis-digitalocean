# Hetzner Socket.io Fixed Deployment Script
# Deploys Socket.io fixes directly to Hetzner production server

param(
    [string]$CommitMessage = "Socket.io fixes deployment $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
)

$HETZNER_IP = "159.69.242.154"

Write-Host "🚀 Deploying Socket.io Fixes to Hetzner" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Server: $HETZNER_IP" -ForegroundColor Yellow
Write-Host "Commit: $CommitMessage" -ForegroundColor Yellow

$confirm = Read-Host "Deploy Socket.io fixes to production? (y/N)"
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
$deployDir = "hetzner-socketio-fixed-deploy"
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
Copy-Item -Path "nginx.conf" -Destination "$deployDir/" -Force

# Create tar.gz
Write-Host "🗜️ Creating deployment archive..." -ForegroundColor Blue
tar -czf "$deployDir.tar.gz" $deployDir

# Step 4: Deploy to Hetzner
Write-Host "🚀 Deploying to Hetzner server..." -ForegroundColor Blue
Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  - Stop the current server" -ForegroundColor Yellow
Write-Host "  - Update nginx configuration for SPA routing" -ForegroundColor Yellow
Write-Host "  - Deploy new Socket.io server code" -ForegroundColor Yellow
Write-Host "  - Start the new server" -ForegroundColor Yellow

# Upload deployment package
scp "$deployDir.tar.gz" "root@${HETZNER_IP}:/root/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload to Hetzner!" -ForegroundColor Red
    exit 1
}

# Deploy and restart server on Hetzner
Write-Host "🔄 Deploying Socket.io fixes to Hetzner..." -ForegroundColor Blue
$deployScript = @"
set -e
echo "🚀 Starting Socket.io fixes deployment on Hetzner..."

# Extract deployment package
cd /root
tar -xzf hetzner-socketio-fixed-deploy.tar.gz
cd hetzner-socketio-fixed-deploy

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Stop current server
echo "🛑 Stopping current server..."
pkill -f 'node.*server.js' || true
sleep 3

# Backup current deployment
echo "💾 Backing up current deployment..."
cd /var/www/flipnosis
cp -r dist dist.backup.`$(date +%Y%m%d_%H%M%S) || true
cp -r server server.backup.`$(date +%Y%m%d_%H%M%S) || true
cp nginx.conf nginx.conf.backup.`$(date +%Y%m%d_%H%M%S) || true

# Deploy new files
echo "📁 Deploying Socket.io fixes..."
cp -r /root/hetzner-socketio-fixed-deploy/dist/* .
cp -r /root/hetzner-socketio-fixed-deploy/server .
cp /root/hetzner-socketio-fixed-deploy/package.json .
cp /root/hetzner-socketio-fixed-deploy/package-lock.json .

# Update nginx configuration
echo "🔧 Updating nginx configuration..."
cp /root/hetzner-socketio-fixed-deploy/nginx.conf /etc/nginx/sites-available/flipnosis.fun

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
nginx -t

if [ `$? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration test failed!"
    exit 1
fi

# Install dependencies in production directory
echo "📦 Installing production dependencies..."
npm install --production

# Start new server
echo "🚀 Starting Socket.io server..."
nohup node server/server.js > server.log 2>&1 "&"

# Wait for server to start
sleep 5

# Check if server is running
if pgrep -f 'node.*server.js' > /dev/null; then
    echo "✅ Socket.io server started successfully!"
    echo "📊 Server status:"
    ps aux | grep 'node.*server.js' | grep -v grep
    echo "📋 Recent server logs:"
    tail -10 server.log
else
    echo "❌ Server failed to start!"
    echo "📋 Server logs:"
    tail -20 server.log
    exit 1
fi

# Restart nginx
echo "🔄 Restarting nginx..."
systemctl restart nginx

# Check nginx status
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx restarted successfully!"
else
    echo "❌ Nginx restart failed!"
    systemctl status nginx
    exit 1
fi

# Cleanup
echo "🧹 Cleaning up..."
rm -rf /root/hetzner-socketio-fixed-deploy
rm /root/hetzner-socketio-fixed-deploy.tar.gz

echo "🎉 Socket.io fixes deployment to Hetzner completed!"
echo "🔗 Server should now be running with Socket.io fixes at https://flipnosis.fun"
echo "📊 Check server logs with: tail -f /var/www/flipnosis/server.log"
"@

ssh root@$HETZNER_IP $deployScript

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Hetzner deployment failed!" -ForegroundColor Red
    exit 1
}

# Cleanup local files
Write-Host "🧹 Cleaning up local files..." -ForegroundColor Blue
Remove-Item $deployDir -Recurse -Force
Remove-Item "$deployDir.tar.gz" -Force

Write-Host "🎉 Socket.io fixes deployment to Hetzner completed!" -ForegroundColor Green
Write-Host "🔗 Production server should now be running with Socket.io fixes" -ForegroundColor Green
Write-Host "🧪 Test the connection at https://flipnosis.fun" -ForegroundColor Yellow
Write-Host "📊 Check server logs with: ssh root@$HETZNER_IP 'tail -f /var/www/flipnosis/server.log'" -ForegroundColor Cyan
