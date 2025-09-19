# Simple Database Update Script
Write-Host "🔧 Updating database schema..." -ForegroundColor Green

# Set the server details
$SERVER_IP = "159.69.118.159"
$SERVER_USER = "root"
$PROJECT_PATH = "/root/Flipnosis-Final-Coin-Hybrid"

Write-Host "📡 Connecting to server: $SERVER_IP" -ForegroundColor Yellow

try {
    # Copy the SQL file to server
    Write-Host "📤 Uploading SQL file..." -ForegroundColor Yellow
    scp -i ~/.ssh/digitalocean_key update-database-schema.sql "${SERVER_USER}@${SERVER_IP}:${PROJECT_PATH}/"
    
    # Run the database update commands
    Write-Host "🔧 Running database update..." -ForegroundColor Yellow
    ssh -i ~/.ssh/digitalocean_key "${SERVER_USER}@${SERVER_IP}" "cd $PROJECT_PATH && pm2 stop all && cp server/flipz.db server/flipz.db.backup && sqlite3 server/flipz.db < update-database-schema.sql && pm2 start all"
    
    Write-Host "✅ Database schema update completed successfully!" -ForegroundColor Green
    Write-Host "🎮 Your game creation should now work!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error updating database: $_" -ForegroundColor Red
    Write-Host "💡 Try running manually:" -ForegroundColor Yellow
    Write-Host "ssh root@159.69.118.159" -ForegroundColor Yellow
    Write-Host "cd /root/Flipnosis-Final-Coin-Hybrid" -ForegroundColor Yellow
    Write-Host "pm2 stop all" -ForegroundColor Yellow
    Write-Host "sqlite3 server/flipz.db < update-database-schema.sql" -ForegroundColor Yellow
    Write-Host "pm2 start all" -ForegroundColor Yellow
}
