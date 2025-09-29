# Simple Chrome Compatibility Fix Deployment
Write-Host "🔧 Deploying Chrome Compatibility Fixes..." -ForegroundColor Green

$DROPLET_IP = "143.198.166.196"

# Create deployment directory
$deploymentDir = "chrome-fix-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $deploymentDir -Force

# Copy files
Copy-Item -Path "dist" -Destination "$deploymentDir/" -Recurse -Force
Copy-Item -Path "server" -Destination "$deploymentDir/" -Recurse -Force
Copy-Item -Path "package.json" -Destination "$deploymentDir/" -Force

# Create tar file
$tarFile = "$deploymentDir.tar.gz"
tar -czf $tarFile $deploymentDir

# Upload and deploy
Write-Host "Uploading to server..." -ForegroundColor Blue
scp $tarFile root@${DROPLET_IP}:/tmp/

Write-Host "Deploying on server..." -ForegroundColor Blue
ssh root@$DROPLET_IP "cd /tmp; tar -xzf $tarFile; systemctl stop flipnosis-app; rm -rf /opt/flipnosis/current-deployment; mkdir -p /opt/flipnosis/current-deployment; cp -r $deploymentDir/* /opt/flipnosis/current-deployment/; cd /opt/flipnosis/current-deployment; npm ci --only=production --omit=dev; systemctl start flipnosis-app; sleep 3; systemctl status flipnosis-app"

# Cleanup
Remove-Item $deploymentDir -Recurse -Force
Remove-Item $tarFile -Force

Write-Host "✅ Chrome compatibility fixes deployed!" -ForegroundColor Green
Write-Host "Test at: https://www.flipnosis.fun" -ForegroundColor Cyan
