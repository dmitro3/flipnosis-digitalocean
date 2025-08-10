# PowerShell Deployment Script for DigitalOcean
Write-Host "🚀 Deploying to DigitalOcean..." -ForegroundColor Green

# Configuration
$SERVER_IP = "143.198.166.196"
$SERVER_USER = "root"
$SSH_KEY = "$env:USERPROFILE\.ssh\digitalocean_key"

Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow
git add .
git commit -m "Auto-deploy: $(Get-Date)"
git push origin main

Write-Host "✅ Code pushed to GitHub successfully!" -ForegroundColor Green

Write-Host "🔧 Deploying to DigitalOcean..." -ForegroundColor Yellow

# Create a deployment script with proper line endings
$deployScript = @"
#!/bin/bash
cd /root/flipnosis-digitalocean
echo '📥 Pulling latest code...'
git pull origin main
echo '🐳 Rebuilding containers...'
cd digitalocean-deploy
docker-compose down
docker-compose build --no-cache
docker-compose up -d
echo '🔧 Running database migration...'
docker-compose exec app node scripts/migrate-database-schema.js || true
echo '✅ Checking deployment status...'
docker-compose ps
echo '🎉 Deployment completed!'
"@

# Write the script to a temporary file
$deployScript | Out-File -FilePath "temp_deploy.sh" -Encoding ASCII

# Copy the script to the server and execute it using SSH key
Write-Host "📡 Uploading deployment script..." -ForegroundColor Yellow
scp -i $SSH_KEY temp_deploy.sh ${SERVER_USER}@${SERVER_IP}:/tmp/deploy.sh

Write-Host "🔧 Executing deployment..." -ForegroundColor Yellow
ssh -i $SSH_KEY ${SERVER_USER}@${SERVER_IP} "chmod +x /tmp/deploy.sh && /tmp/deploy.sh"

# Clean up
Remove-Item "temp_deploy.sh" -ErrorAction SilentlyContinue
ssh -i $SSH_KEY ${SERVER_USER}@${SERVER_IP} "rm /tmp/deploy.sh" -ErrorAction SilentlyContinue

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "🌐 Your app is available at: http://$SERVER_IP" -ForegroundColor Yellow
