# Fix price_usd Column Issue - Deploy to Hetzner
# This script fixes the database column mismatch issue

Write-Host "🔧 Fixing price_usd column issue on Hetzner server..." -ForegroundColor Green

# Set the server details
$SERVER_IP = "159.69.118.159"
$SERVER_USER = "root"
$PROJECT_PATH = "/root/Flipnosis-Final-Coin-Hybrid"

Write-Host "📡 Deploying fixes to server: $SERVER_IP" -ForegroundColor Yellow

# Create deployment script
$deployScript = @"
#!/bin/bash
set -e

echo "🔧 Deploying price_usd column fixes..."

# Navigate to project directory
cd $PROJECT_PATH

# Stop the server
echo "⏹️ Stopping server..."
pm2 stop all || true

# Pull latest changes (if using git)
echo "📥 Pulling latest changes..."
git pull origin main || echo "⚠️ Git pull failed, continuing with local changes..."

# Install any new dependencies
echo "📦 Installing dependencies..."
npm install --production

# Start the server
echo "🚀 Starting server..."
pm2 start all

echo "✅ Deployment complete!"
echo "🎮 The price_usd column issue should now be fixed."
"@

# Write the script to a temporary file
$tempScript = [System.IO.Path]::GetTempFileName() + ".sh"
$deployScript | Out-File -FilePath $tempScript -Encoding UTF8

try {
    Write-Host "📤 Uploading and executing deployment script..." -ForegroundColor Yellow
    
    # Note: You'll need to replace this with your actual SSH key path
    $sshKeyPath = "~/.ssh/digitalocean_key"
    
    # Copy script to server
    scp -i $sshKeyPath $tempScript "${SERVER_USER}@${SERVER_IP}:/tmp/deploy_fix.sh"
    
    # Make it executable and run it
    ssh -i $sshKeyPath "${SERVER_USER}@${SERVER_IP}" "chmod +x /tmp/deploy_fix.sh && /tmp/deploy_fix.sh"
    
    Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
    Write-Host "🎮 Your game creation should now work without the price_usd error." -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error deploying fixes: $_" -ForegroundColor Red
    Write-Host "💡 Manual deployment steps:" -ForegroundColor Yellow
    Write-Host "   1. SSH into your server: ssh root@159.69.118.159" -ForegroundColor Yellow
    Write-Host "   2. Navigate to: cd /root/Flipnosis-Final-Coin-Hybrid" -ForegroundColor Yellow
    Write-Host "   3. Stop server: pm2 stop all" -ForegroundColor Yellow
    Write-Host "   4. Copy the fixed files from your local machine" -ForegroundColor Yellow
    Write-Host "   5. Start server: pm2 start all" -ForegroundColor Yellow
} finally {
    # Clean up temporary file
    if (Test-Path $tempScript) {
        Remove-Item $tempScript
    }
}
