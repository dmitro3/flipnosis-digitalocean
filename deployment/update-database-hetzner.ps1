# Update Database Schema on Hetzner Server
# This script adds all missing fields to match the master database

Write-Host "🔧 Updating database schema on Hetzner server..." -ForegroundColor Green

# Set the server details
$SERVER_IP = "159.69.118.159"
$SERVER_USER = "root"
$PROJECT_PATH = "/root/Flipnosis-Final-Coin-Hybrid"

Write-Host "📡 Connecting to server: $SERVER_IP" -ForegroundColor Yellow

# Create deployment script
$deployScript = @"
#!/bin/bash
set -e

echo "🔧 Updating database schema..."

# Navigate to project directory
cd $PROJECT_PATH

# Stop the server
echo "⏹️ Stopping server..."
pm2 stop all || true

# Backup the current database
echo "💾 Creating database backup..."
cp server/database.sqlite server/database.sqlite.backup.$(date +%Y%m%d_%H%M%S)

# Apply the schema updates
echo "📝 Applying database schema updates..."
sqlite3 server/database.sqlite < update-database-schema.sql

if [ `$? -eq 0 ]; then
    echo "✅ Database schema updated successfully"
    
    # Start the server
    echo "🚀 Starting server..."
    pm2 start all
    
    echo "✅ Server restarted successfully"
    echo "🎉 Database update complete! All missing fields have been added."
else
    echo "❌ Database update failed"
    echo "🔄 Restoring from backup..."
    cp server/database.sqlite.backup.* server/database.sqlite
    pm2 start all
    exit 1
fi
"@

# Write the script to a temporary file
$tempScript = [System.IO.Path]::GetTempFileName() + ".sh"
$deployScript | Out-File -FilePath $tempScript -Encoding UTF8

try {
    Write-Host "📤 Uploading and executing database update..." -ForegroundColor Yellow
    
    # Note: You'll need to replace this with your actual SSH key path
    $sshKeyPath = "~/.ssh/digitalocean_key"
    
    # Copy both the SQL file and the script to server
    scp -i $sshKeyPath update-database-schema.sql "${SERVER_USER}@${SERVER_IP}:${PROJECT_PATH}/"
    scp -i $sshKeyPath $tempScript "${SERVER_USER}@${SERVER_IP}:/tmp/update_database.sh"
    
    # Make it executable and run it
    ssh -i $sshKeyPath "${SERVER_USER}@${SERVER_IP}" "chmod +x /tmp/update_database.sh; /tmp/update_database.sh"
    
    Write-Host "✅ Database schema update completed successfully!" -ForegroundColor Green
    Write-Host "🎮 Your game creation should now work without any column errors." -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error updating database: $_" -ForegroundColor Red
    Write-Host "💡 Manual update steps:" -ForegroundColor Yellow
    Write-Host "   1. SSH into your server: ssh root@159.69.118.159" -ForegroundColor Yellow
    Write-Host "   2. Navigate to: cd /root/Flipnosis-Final-Coin-Hybrid" -ForegroundColor Yellow
    Write-Host "   3. Stop server: pm2 stop all" -ForegroundColor Yellow
    Write-Host "   4. Backup database: cp server/database.sqlite server/database.sqlite.backup" -ForegroundColor Yellow
    Write-Host "   5. Apply updates: sqlite3 server/database.sqlite < update-database-schema.sql" -ForegroundColor Yellow
    Write-Host "   6. Start server: pm2 start all" -ForegroundColor Yellow
} finally {
    # Clean up temporary file
    if (Test-Path $tempScript) {
        Remove-Item $tempScript
    }
}
