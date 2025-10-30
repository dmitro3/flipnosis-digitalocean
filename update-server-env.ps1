# Script to update .env file on Hetzner server
# This will SSH to the server and update the .env file with the new configuration

$SERVER_IP = "159.69.242.154"
$SERVER_USER = "root"

# Read sensitive values from environment variables (do NOT hardcode secrets)
$PRIVATE_KEY               = $env:PRIVATE_KEY
$CONTRACT_OWNER_KEY        = $env:CONTRACT_OWNER_KEY
$RPC_URL                   = $env:RPC_URL
$CONTRACT_ADDRESS          = $env:CONTRACT_ADDRESS
$PLATFORM_FEE_RECEIVER     = $env:PLATFORM_FEE_RECEIVER
$VITE_API_URL              = $env:VITE_API_URL
$VITE_WS_URL               = $env:VITE_WS_URL
$VITE_ALCHEMY_API_KEY      = $env:VITE_ALCHEMY_API_KEY
$VITE_BASE_RPC_URL         = $env:VITE_BASE_RPC_URL
$VITE_ETHEREUM_RPC_URL     = $env:VITE_ETHEREUM_RPC_URL
$VITE_SEPOLIA_RPC_URL      = $env:VITE_SEPOLIA_RPC_URL
$VITE_BASESCAN_API_KEY     = $env:VITE_BASESCAN_API_KEY
$VITE_ETHERSCAN_API_KEY    = $env:VITE_ETHERSCAN_API_KEY
$VITE_BSCSCAN_API_KEY      = $env:VITE_BSCSCAN_API_KEY
$VITE_AVALANCHE_API_KEY    = $env:VITE_AVALANCHE_API_KEY
$VITE_POLYGONSCAN_API_KEY  = $env:VITE_POLYGONSCAN_API_KEY

# Fail fast if critical secrets are missing
if (-not $PRIVATE_KEY -or -not $CONTRACT_OWNER_KEY -or -not $RPC_URL -or -not $CONTRACT_ADDRESS -or -not $PLATFORM_FEE_RECEIVER) {
  Write-Host "❌ Required environment variables are missing. Please set: PRIVATE_KEY, CONTRACT_OWNER_KEY, RPC_URL, CONTRACT_ADDRESS, PLATFORM_FEE_RECEIVER" -ForegroundColor Red
  exit 1
}

$ENV_CONTENT = @"
# SERVER VARIABLES (for blockchain functionality)
# ========================================

# Private Key (for blockchain transactions)
PRIVATE_KEY=$PRIVATE_KEY

# Contract Owner Key (server looks for this first)
CONTRACT_OWNER_KEY=$CONTRACT_OWNER_KEY

# RPC URL (server needs this exact name)
RPC_URL=$RPC_URL

# Contract Address
CONTRACT_ADDRESS=$CONTRACT_ADDRESS

# Database path
DATABASE_PATH=./server/flipz.db

# Platform Fee Receiver (REQUIRED - Admin wallet for fees)
PLATFORM_FEE_RECEIVER=$PLATFORM_FEE_RECEIVER

# ========================================
# FRONTEND VARIABLES (exposed to frontend)
# ========================================

# API URLs (REQUIRED - connects to backend)
VITE_API_URL=$VITE_API_URL
VITE_WS_URL=$VITE_WS_URL

# Alchemy API Key for Base Mainnet
VITE_ALCHEMY_API_KEY=$VITE_ALCHEMY_API_KEY

# Base RPC URL (Alchemy)
VITE_BASE_RPC_URL=$VITE_BASE_RPC_URL

# Platform Fee Receiver (for frontend display)
VITE_PLATFORM_FEE_RECEIVER=$PLATFORM_FEE_RECEIVER

# Environment
NODE_ENV=production

# RPC URLs (Optional - for better performance)
VITE_ETHEREUM_RPC_URL=$VITE_ETHEREUM_RPC_URL
VITE_SEPOLIA_RPC_URL=$VITE_SEPOLIA_RPC_URL

# API Keys for Contract Verification (Optional)
VITE_BASESCAN_API_KEY=$VITE_BASESCAN_API_KEY
VITE_ETHERSCAN_API_KEY=$VITE_ETHERSCAN_API_KEY
VITE_BSCSCAN_API_KEY=$VITE_BSCSCAN_API_KEY
VITE_AVALANCHE_API_KEY=$VITE_AVALANCHE_API_KEY
VITE_POLYGONSCAN_API_KEY=$VITE_POLYGONSCAN_API_KEY

# Gas Reporting (Optional)
VITE_REPORT_GAS=true
"@

Write-Host "🔧 Updating .env file on server $SERVER_IP..." -ForegroundColor Cyan

# First, try to find where the app is located
Write-Host "📍 Finding application directory on server..." -ForegroundColor Yellow
$findAppDir = @"
cd /root
if [ -d "Flipnosis-Battle-Royale-current" ]; then
  echo "/root/Flipnosis-Battle-Royale-current"
elif [ -d "/opt/flipnosis/app" ]; then
  echo "/opt/flipnosis/app"
elif [ -d "/var/www/flipnosis" ]; then
  echo "/var/www/flipnosis"
else
  echo "NOT_FOUND"
fi
"@

$appDir = ssh ${SERVER_USER}@${SERVER_IP} $findAppDir

if ($appDir -eq "NOT_FOUND") {
    Write-Host "❌ Could not find application directory on server" -ForegroundColor Red
    Write-Host "Please manually SSH and find the directory, then run this script again" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found app directory: $appDir" -ForegroundColor Green

# Create a temporary file with the env content
$tempEnvFile = [System.IO.Path]::GetTempFileName()
$ENV_CONTENT | Out-File -FilePath $tempEnvFile -Encoding UTF8

Write-Host "📝 Copying .env file to server..." -ForegroundColor Yellow

# Copy .env file to server
scp $tempEnvFile ${SERVER_USER}@${SERVER_IP}:$appDir/.env

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ .env file uploaded successfully!" -ForegroundColor Green
    
    # Set proper permissions
    Write-Host "🔒 Setting file permissions..." -ForegroundColor Yellow
    ssh ${SERVER_USER}@${SERVER_IP} "chmod 600 $appDir/.env"
    
    # Also update DATABASE_PATH to match .env
    Write-Host "📝 Updating DATABASE_PATH..." -ForegroundColor Yellow
    ssh ${SERVER_USER}@${SERVER_IP} "cd $appDir && echo 'DATABASE_PATH=./server/flipz.db' >> .env || true"
    
    # Make sure PM2 uses the .env file - source it and restart
    Write-Host "🔄 Restarting PM2 to load new environment..." -ForegroundColor Yellow
    ssh ${SERVER_USER}@${SERVER_IP} @"
cd $appDir
export \$(cat .env | grep -v '^#' | xargs)
pm2 restart all --update-env
"@
    
    Write-Host ""
    Write-Host "✅ Done! Environment variables have been updated and PM2 has been restarted." -ForegroundColor Green
    Write-Host ""
    Write-Host "🔍 Verifying configuration..." -ForegroundColor Cyan
    
    # Check if the service is running and showing the key
    $checkResult = ssh ${SERVER_USER}@${SERVER_IP} "cd $appDir && pm2 logs --lines 20 --nostream 2>&1 | tail -5"
    Write-Host $checkResult
    
    # Also check if HAS_PRIVATE_KEY is true in logs
    Write-Host ""
    Write-Host "🔑 Checking for private key in server logs..." -ForegroundColor Cyan
    ssh ${SERVER_USER}@${SERVER_IP} "cd $appDir && pm2 logs --lines 50 --nostream 2>&1 | grep -i 'HAS_PRIVATE_KEY\|CONTRACT_OWNER_KEY' | tail -3 || echo 'Not found in recent logs - check server startup logs'"
    
} else {
    Write-Host "❌ Failed to upload .env file" -ForegroundColor Red
    Write-Host "You may need to manually SSH and update the file" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Manual steps:" -ForegroundColor Yellow
    Write-Host "1. SSH to server: ssh root@$SERVER_IP" -ForegroundColor White
    Write-Host "2. Navigate to app directory (likely /root/Flipnosis-Battle-Royale-current)" -ForegroundColor White
    Write-Host "3. Create/edit .env file with the content above" -ForegroundColor White
    Write-Host "4. Run: pm2 restart all --update-env" -ForegroundColor White
    exit 1
}

# Clean up temp file
Remove-Item $tempEnvFile

Write-Host ""
Write-Host "✨ All done! The server should now have the updated .env file." -ForegroundColor Green
Write-Host ""
Write-Host "🧪 Test it:" -ForegroundColor Cyan
Write-Host "   Try clicking 'Complete On-Chain' button again - it should work now!" -ForegroundColor White
