# Simple Flipnosis Deployment Script
param(
    [string]$Email = ""
)

Write-Host "Flipnosis Simple Deployment" -ForegroundColor Green

# Configuration
$DROPLET_IP = "143.198.166.196"
$DOMAIN = "www.flipnosis.fun"

# Get email
if (-not $Email) {
    $Email = Read-Host "Enter your email for SSL certificates"
}

Write-Host "Using email: $Email" -ForegroundColor Yellow

# Step 1: Build locally
Write-Host "Building application..." -ForegroundColor Blue

# Clean and build
if (Test-Path "dist") {
    Remove-Item "dist" -Recurse -Force
}

npm install
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Build completed!" -ForegroundColor Green

# Step 2: Create deployment package
Write-Host "Creating deployment package..." -ForegroundColor Blue

$deployDir = "deploy-package"
if (Test-Path $deployDir) {
    Remove-Item $deployDir -Recurse -Force
}
New-Item -ItemType Directory -Path $deployDir -Force

# Copy files
Copy-Item "dist" -Destination "$deployDir/" -Recurse -Force
Copy-Item "server" -Destination "$deployDir/" -Recurse -Force
Copy-Item "contracts" -Destination "$deployDir/" -Recurse -Force
Copy-Item "public" -Destination "$deployDir/" -Recurse -Force
Copy-Item "scripts" -Destination "$deployDir/" -Recurse -Force
Copy-Item "package.json" -Destination "$deployDir/" -Force
Copy-Item "env-template.txt" -Destination "$deployDir/" -Force

# Create tar.gz
tar -czf "$deployDir.tar.gz" -C $deployDir .

# Step 3: Deploy to server
Write-Host "Deploying to server..." -ForegroundColor Blue

# Upload package
scp "$deployDir.tar.gz" "root@${DROPLET_IP}:/root/flipnosis-digitalocean/"

# Deploy on server
$deployCommands = @"
cd /root/flipnosis-digitalocean
tar -xzf $deployDir.tar.gz
cd deploy-package
cp env-template.txt .env
npm install --production
chmod +x scripts/setup-ssl.sh
./scripts/setup-ssl.sh $DOMAIN $Email
systemctl restart nginx
systemctl restart flipnosis-app
echo "Deployment completed!"
"@

ssh root@$DROPLET_IP $deployCommands

# Cleanup
Remove-Item $deployDir -Recurse -Force
Remove-Item "$deployDir.tar.gz" -Force

Write-Host "Deployment completed!" -ForegroundColor Green
Write-Host "Your site should be available at: https://$DOMAIN" -ForegroundColor Cyan
