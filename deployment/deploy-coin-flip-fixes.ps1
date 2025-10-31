# Quick Deploy - Coin Flip Critical Fixes
# Deploys ONLY the critical files to Hetzner 159

$DROPLET_IP = "159.69.242.154"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  DEPLOYING COIN FLIP CRITICAL FIXES" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Create temporary deployment package
$deployDir = "coin-flip-fixes"
if (Test-Path $deployDir) {
    Remove-Item $deployDir -Recurse -Force
}

Write-Host "[1/5] Creating deployment package..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "$deployDir/dist" | Out-Null
New-Item -ItemType Directory -Path "$deployDir/server" | Out-Null
New-Item -ItemType Directory -Path "$deployDir/server/handlers" | Out-Null

# Copy ONLY the critical fixed files
Write-Host "[2/5] Copying critical files..." -ForegroundColor Yellow
Copy-Item -Path "dist/test-tubes.html" -Destination "$deployDir/dist/test-tubes.html"
Copy-Item -Path "server/PhysicsGameManager.js" -Destination "$deployDir/server/PhysicsGameManager.js"

Write-Host "  âœ… test-tubes.html (client fixes)" -ForegroundColor Green
Write-Host "  âœ… PhysicsGameManager.js (server race condition fix)" -ForegroundColor Green

# Create tar.gz
Write-Host "[3/5] Creating package..." -ForegroundColor Yellow
tar -czf "$deployDir.tar.gz" $deployDir

# Upload to server
Write-Host "[4/5] Uploading to Hetzner 159..." -ForegroundColor Yellow
scp "$deployDir.tar.gz" "root@${DROPLET_IP}:/root/"

# Deploy on server
Write-Host "[5/5] Deploying on server..." -ForegroundColor Yellow
$deployCommand = @"
cd /root && 
tar -xzf coin-flip-fixes.tar.gz && 
cd /root/flipnosis-digitalocean && 
echo 'Stopping server...' && 
pkill -f 'node.*server.js' && 
sleep 2 && 
echo 'Copying files...' && 
cp /root/coin-flip-fixes/dist/test-tubes.html dist/test-tubes.html && 
cp /root/coin-flip-fixes/server/PhysicsGameManager.js server/PhysicsGameManager.js && 
echo 'Starting server...' && 
nohup node server/server.js > server.log 2>&1 & && 
sleep 2 && 
echo 'Cleaning up...' && 
rm -rf /root/coin-flip-fixes && 
rm /root/coin-flip-fixes.tar.gz && 
echo '✅ Deployment completed successfully!'
"@

ssh root@$DROPLET_IP $deployCommand

# Cleanup local files
Write-Host ""
Write-Host "Cleaning up local files..." -ForegroundColor Yellow
Remove-Item $deployDir -Recurse -Force
Remove-Item "$deployDir.tar.gz" -Force

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  ✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Critical fixes deployed:" -ForegroundColor White
Write-Host "  ✅ Smooth coin landing (no snapback)" -ForegroundColor Green
Write-Host "  ✅ Asset preloading (no pause)" -ForegroundColor Green
Write-Host "  ✅ Simultaneous flip protection" -ForegroundColor Green
Write-Host ""
Write-Host "Test at: https://www.flipnosis.fun" -ForegroundColor Cyan
Write-Host "Note: Hard refresh (Ctrl+Shift+R) to clear cache!" -ForegroundColor Yellow
Write-Host ""

