# Hetzner Deployment Script for Flipnosis
# This script automates the complete deployment process

param(
    [string]$ServerIP = "159.69.242.154",
    [string]$ServerUser = "root"
)

# Colors for output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

function Write-Status {
    param([string]$Message)
    Write-Host "$Blue[INFO]$Reset $Message"
}

function Write-Success {
    param([string]$Message)
    Write-Host "$Green[SUCCESS]$Reset $Message"
}

function Write-Warning {
    param([string]$Message)
    Write-Host "$Yellow[WARNING]$Reset $Message"
}

function Write-Error {
    param([string]$Message)
    Write-Host "$Red[ERROR]$Reset $Message"
}

Write-Host "🚀 Starting Hetzner Deployment for Flipnosis..." -ForegroundColor Cyan

# Step 1: Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Error "package.json not found. Please run this script from your project root directory."
    exit 1
}

Write-Status "Step 1: Building application..."

# Clean install and build
try {
    Write-Status "Installing dependencies..."
    npm install
    
    Write-Status "Building application..."
    npm run build
    
    Write-Success "Build completed successfully!"
} catch {
    Write-Error "Build failed: $($_.Exception.Message)"
    exit 1
}

# Step 2: Create deployment package
Write-Status "Step 2: Creating deployment package..."

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$deployDir = "hetzner-deploy-$timestamp"

try {
    # Create deployment directory
    New-Item -ItemType Directory -Name $deployDir -Force | Out-Null
    
    # Copy necessary files
    Write-Status "Copying build files..."
    Copy-Item -Path "dist" -Destination "$deployDir\" -Recurse -Force
    Copy-Item -Path "server" -Destination "$deployDir\" -Recurse -Force
    Copy-Item -Path "package.json" -Destination "$deployDir\" -Force
    Copy-Item -Path "package-lock.json" -Destination "$deployDir\" -Force
    
    # Create .env file for Hetzner
    Write-Status "Creating environment file..."
    @"
DATABASE_URL=postgresql://flipnosis_user:FlipnosisDB2024Secure@116.202.24.43:5432/flipnosis
CONTRACT_ADDRESS=0x3997F4720B3a515e82d54F30d7CF2993B014EeBE
CONTRACT_OWNER_KEY=f19dd56173918d384a2ff2d73905ebc666034b6abd34312a074b4a80ddb2e80c
RPC_URL=https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3
PORT=3001
NODE_ENV=production
VITE_ALCHEMY_API_KEY=hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3
VITE_PLATFORM_FEE_RECEIVER=0x47d80671bcb7ec368ef4d3ca6e1c201
"@ | Out-File -FilePath "$deployDir\.env" -Encoding UTF8
    
    Write-Success "Deployment package created: $deployDir"
} catch {
    Write-Error "Failed to create deployment package: $($_.Exception.Message)"
    exit 1
}

# Step 3: Upload to Hetzner server
Write-Status "Step 3: Uploading to Hetzner server..."

try {
    Write-Status "Uploading $deployDir to $ServerUser@$ServerIP..."
    scp -r $deployDir ${ServerUser}@${ServerIP}:/root/
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Upload completed successfully!"
    } else {
        Write-Error "Upload failed!"
        exit 1
    }
} catch {
    Write-Error "Upload failed: $($_.Exception.Message)"
    exit 1
}

# Step 4: Deploy on server
Write-Status "Step 4: Deploying on Hetzner server..."

$deployCommands = @"
# Stop current application
pkill -f "node server/server.js" || true

# Navigate to new deployment
cd /root/$deployDir

# Install dependencies
npm install

# Start the application
nohup node server/server.js > app.log 2>&1 &

# Wait for startup
sleep 5

# Check status
echo "=== Application Status ==="
ps aux | grep node | grep -v grep
echo "=== Application Logs ==="
cat app.log
echo "=== Testing Application ==="
curl -s http://127.0.0.1:3001 | head -20
"@

Write-Status "Executing deployment commands on server..."
Write-Host "`n$Yellow[SSH Commands to run:]$Reset" -ForegroundColor Yellow
Write-Host $deployCommands -ForegroundColor Gray

Write-Host "`n$Green[Deployment package ready!]$Reset" -ForegroundColor Green
Write-Host "Package: $deployDir" -ForegroundColor Cyan
Write-Host "Server: $ServerUser@$ServerIP" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. SSH to server: ssh $ServerUser@$ServerIP" -ForegroundColor White
Write-Host "2. Run the deployment commands above" -ForegroundColor White
Write-Host "3. Test: curl http://$ServerIP" -ForegroundColor White

Write-Success "Deployment script completed! 🚀"
