# Script to fix CONTRACT_ADDRESS on Hetzner server
# This updates PM2 configuration and restarts the service

$SERVER_IP = "159.69.242.154"
$SERVER_USER = "root"
$CORRECT_CONTRACT_ADDRESS = "0xa90abBDE769BC2901A8E68E6C9758B1Cd6699A5F"

Write-Host "🔧 Fixing CONTRACT_ADDRESS on Hetzner server..." -ForegroundColor Cyan
Write-Host "   Current (wrong): 0xB2FC2180e003D818621F4722FFfd7878A218581D" -ForegroundColor Yellow
Write-Host "   Setting (correct): $CORRECT_CONTRACT_ADDRESS" -ForegroundColor Green
Write-Host ""

# Find app directory
Write-Host "📍 Finding application directory..." -ForegroundColor Yellow
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
    Write-Host "❌ Could not find application directory" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found app directory: $appDir" -ForegroundColor Green
Write-Host ""

# Step 1: Update ecosystem.config.js if it exists
Write-Host "Step 1: Checking ecosystem.config.js..." -ForegroundColor Cyan
$updateEcosystemScript = 'cd ' + $appDir + '; if [ -f "ecosystem.config.js" ]; then if grep -q "0xB2FC2180" ecosystem.config.js; then sed -i "s/0xB2FC2180e003D818621F4722FFfd7878A218581D/' + $CORRECT_CONTRACT_ADDRESS + '/g" ecosystem.config.js; echo "Updated ecosystem.config.js"; else echo "ecosystem.config.js already has correct address"; fi; else echo "ecosystem.config.js not found, skipping"; fi'

ssh ${SERVER_USER}@${SERVER_IP} $updateEcosystemScript

# Step 2: Update .env file if it exists
Write-Host "Step 2: Checking .env file..." -ForegroundColor Cyan
$updateEnvScript = 'cd ' + $appDir + '; if [ -f ".env" ]; then if grep -q "CONTRACT_ADDRESS" .env; then sed -i "s|^CONTRACT_ADDRESS=.*|CONTRACT_ADDRESS=' + $CORRECT_CONTRACT_ADDRESS + '|g" .env; echo "Updated CONTRACT_ADDRESS in .env"; else echo "CONTRACT_ADDRESS=' + $CORRECT_CONTRACT_ADDRESS + '" >> .env; echo "Added CONTRACT_ADDRESS to .env"; fi; grep CONTRACT_ADDRESS .env || echo "CONTRACT_ADDRESS not found after update"; else echo "CONTRACT_ADDRESS=' + $CORRECT_CONTRACT_ADDRESS + '" > .env; echo "Created .env with CONTRACT_ADDRESS"; fi'

ssh ${SERVER_USER}@${SERVER_IP} $updateEnvScript

# Step 3: Restart PM2 with updated config
Write-Host ""
Write-Host "Step 3: Restarting PM2 with updated configuration..." -ForegroundColor Cyan
$restartPm2Script = 'cd ' + $appDir + '; if [ -f ".env" ]; then export $(cat .env | grep -v "^#" | xargs); fi; export CONTRACT_ADDRESS=' + $CORRECT_CONTRACT_ADDRESS + '; pm2 restart all --update-env; sleep 2; pm2 status; echo ""; echo "Current CONTRACT_ADDRESS in environment:"; echo "CONTRACT_ADDRESS=$CONTRACT_ADDRESS"'

$result = ssh ${SERVER_USER}@${SERVER_IP} $restartPm2Script
Write-Host $result

# Step 4: Verify the fix
Write-Host ""
Write-Host "Step 4: Verifying the fix..." -ForegroundColor Cyan
$verifyScript = 'cd ' + $appDir + '; sleep 3; echo "Checking recent PM2 logs:"; pm2 logs --lines 50 --nostream 2>&1 | grep -i "CONTRACT_ADDRESS" | tail -5 || echo "Not found in logs"; echo ""; echo "PM2 Environment Variables:"; pm2 env flipnosis-app 2>/dev/null | grep CONTRACT_ADDRESS || echo "Not found in PM2 env"'

$verifyResult = ssh ${SERVER_USER}@${SERVER_IP} $verifyScript
Write-Host $verifyResult

Write-Host ""
Write-Host "Fix applied! The server should now use the correct contract address." -ForegroundColor Green
Write-Host ""
Write-Host "Test it:" -ForegroundColor Cyan
Write-Host "   1. Wait 10-15 seconds for server to fully restart" -ForegroundColor White
Write-Host "   2. Try clicking 'Complete On-Chain' button again" -ForegroundColor White
Write-Host "   3. It should now find the game on-chain!" -ForegroundColor White
Write-Host ""

