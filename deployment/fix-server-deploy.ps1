# Fix Server Deployment - Handle line ending issues
$DROPLET_IP = "159.69.242.154"

Write-Host "Fixing server deployment..." -ForegroundColor Green

# Step 1: Build locally
Write-Host "Building application..." -ForegroundColor Yellow
npm install
npm run build

# Step 2: Create deployment package
$deployDir = "deploy-package"
if (Test-Path $deployDir) {
    Remove-Item $deployDir -Recurse -Force
}

Write-Host "Creating deployment package..." -ForegroundColor Yellow
Copy-Item -Path "dist" -Destination "$deployDir/dist" -Recurse
Copy-Item -Path "server" -Destination "$deployDir/server" -Recurse
Copy-Item -Path "package.json" -Destination "$deployDir/"
Copy-Item -Path "package-lock.json" -Destination "$deployDir/"

# Create tar.gz
tar -czf "$deployDir.tar.gz" $deployDir

# Step 3: Deploy to server
Write-Host "Deploying to server..." -ForegroundColor Yellow
scp "$deployDir.tar.gz" "root@${DROPLET_IP}:/root/"

# Step 4: Fix server with proper commands
$fixCommand = @"
cd /root && 
tar -xzf deploy-package.tar.gz && 
cd deploy-package && 
npm install --production && 
cd /root/flipnosis-digitalocean && 
pkill -f 'node.*server.js' || true && 
sleep 3 && 
cp -r /root/deploy-package/dist/* . && 
cp -r /root/deploy-package/server . && 
cp /root/deploy-package/package.json . && 
cp /root/deploy-package/package-lock.json . && 
npm install --production && 
cd server && 
nohup node server.js > ../server.log 2>&1 & && 
sleep 2 && 
systemctl restart nginx && 
rm -rf /root/deploy-package && 
rm /root/deploy-package.tar.gz && 
echo 'Deployment completed successfully!'
"@

ssh root@$DROPLET_IP $fixCommand

# Step 5: Verify deployment
Write-Host "Verifying deployment..." -ForegroundColor Yellow
$verifyCommand = @"
cd /root/flipnosis-digitalocean && 
ps aux | grep 'node.*server.js' | grep -v grep && 
echo '--- Server Log (last 10 lines) ---' && 
tail -10 server.log 2>/dev/null || echo 'No server log found'
"@

ssh root@$DROPLET_IP $verifyCommand

# Cleanup
Write-Host "Cleaning up..." -ForegroundColor Yellow
Remove-Item $deployDir -Recurse -Force
Remove-Item "$deployDir.tar.gz" -Force

Write-Host "Deployment completed!" -ForegroundColor Green
Write-Host "Your site: https://www.flipnosis.fun" -ForegroundColor Cyan
