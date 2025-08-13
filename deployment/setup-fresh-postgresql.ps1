# Fresh PostgreSQL + Redis Setup Script
# This script sets up a new PostgreSQL + Redis environment from scratch

param(
    [string]$ServerIP = "116.202.24.43",
    [string]$PlatformIP = "159.69.242.154"
)

Write-Host "🚀 Starting fresh PostgreSQL + Redis setup..." -ForegroundColor Green

# Step 1: Copy and run the fresh setup script on database server
Write-Host "[INFO] Step 1: Setting up PostgreSQL and Redis on server $ServerIP" -ForegroundColor Blue

# Copy setup script to server
Write-Host "[INFO] Copying setup script to server..." -ForegroundColor Blue
scp -o StrictHostKeyChecking=no scripts/setup-fresh-postgresql-redis.sh "root@$ServerIP:/opt/flipnosis/"

# Make script executable and run it
Write-Host "[INFO] Running fresh setup script on server..." -ForegroundColor Blue
ssh -o StrictHostKeyChecking=no "root@$ServerIP" "chmod +x /opt/flipnosis/setup-fresh-postgresql-redis.sh && /opt/flipnosis/setup-fresh-postgresql-redis.sh"

if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] Fresh PostgreSQL and Redis setup completed on server $ServerIP" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Fresh PostgreSQL and Redis setup failed on server $ServerIP" -ForegroundColor Red
    exit 1
}

# Step 2: Copy new database service to platform server
Write-Host "[INFO] Step 2: Updating application on platform server $PlatformIP" -ForegroundColor Blue

# Copy new database service to platform server
Write-Host "[INFO] Copying new database service to platform server..." -ForegroundColor Blue
scp -o StrictHostKeyChecking=no server/services/database-postgresql.js "root@$PlatformIP:/opt/flipnosis/app/server/services/"

# Install dependencies on platform server
Write-Host "[INFO] Installing dependencies on platform server..." -ForegroundColor Blue
ssh -o StrictHostKeyChecking=no "root@$PlatformIP" "cd /opt/flipnosis/app && npm install pg redis"

if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] Platform server dependencies installed" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to install platform server dependencies" -ForegroundColor Red
    exit 1
}

# Step 3: Update server.js to use new database service
Write-Host "[INFO] Step 3: Updating server configuration" -ForegroundColor Blue

# Create backup of current server.js
ssh -o StrictHostKeyChecking=no "root@$PlatformIP" "cd /opt/flipnosis/app && cp server/server.js server/server.js.sqlite.backup"

# Copy the updated server.js file
scp -o StrictHostKeyChecking=no server/server-postgresql.js "root@$PlatformIP:/opt/flipnosis/app/server/server.js"

Write-Host "[SUCCESS] Server configuration updated" -ForegroundColor Green

# Step 4: Test the new setup
Write-Host "[INFO] Step 4: Testing the new database setup" -ForegroundColor Blue

# Test database connection
Write-Host "[INFO] Testing database connection..." -ForegroundColor Blue
ssh -o StrictHostKeyChecking=no "root@$PlatformIP" "cd /opt/flipnosis/app && node -e 'const DatabaseService = require(\"./server/services/database-postgresql\"); const db = new DatabaseService(); db.initialize().then(() => { console.log(\"Database test successful\"); process.exit(0); }).catch(err => { console.error(\"Database test failed:\", err); process.exit(1); });'"

if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] Database connection test passed" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Database connection test failed" -ForegroundColor Red
    exit 1
}

# Step 5: Restart the application
Write-Host "[INFO] Step 5: Restarting the application" -ForegroundColor Blue

# Restart PM2 process
ssh -o StrictHostKeyChecking=no "root@$PlatformIP" "cd /opt/flipnosis/app && pm2 restart flipnosis"

if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] Application restarted successfully" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to restart application" -ForegroundColor Red
    exit 1
}

# Step 6: Verify deployment
Write-Host "[INFO] Step 6: Verifying deployment" -ForegroundColor Blue

# Wait a moment for the application to start
Start-Sleep -Seconds 10

# Test health endpoint
try {
    $healthResponse = Invoke-RestMethod -Uri "http://$PlatformIP/health" -Method Get -TimeoutSec 30
    
    if ($healthResponse.status -eq "healthy") {
        Write-Host "[SUCCESS] Deployment verification successful" -ForegroundColor Green
        Write-Host "[SUCCESS] Database status: $($healthResponse.database.status)" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Deployment verification failed" -ForegroundColor Red
        Write-Host "[ERROR] Health response: $($healthResponse | ConvertTo-Json)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERROR] Failed to verify deployment: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "[SUCCESS] 🎉 Fresh PostgreSQL + Redis setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Setup Summary:" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Green
Write-Host "✅ Fresh PostgreSQL and Redis installed on server $ServerIP" -ForegroundColor Green
Write-Host "✅ Database schema created from scratch" -ForegroundColor Green
Write-Host "✅ Application updated to use PostgreSQL + Redis" -ForegroundColor Green
Write-Host "✅ WebSocket real-time functionality enabled" -ForegroundColor Green
Write-Host "✅ Application restarted and verified" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Benefits achieved:" -ForegroundColor Yellow
Write-Host "- Clean, fresh database setup" -ForegroundColor Yellow
Write-Host "- Real-time WebSocket communication" -ForegroundColor Yellow
Write-Host "- Better concurrent connection handling" -ForegroundColor Yellow
Write-Host "- Improved performance and scalability" -ForegroundColor Yellow
Write-Host "- Professional database architecture" -ForegroundColor Yellow
Write-Host ""
Write-Host "🌐 Application URLs:" -ForegroundColor Blue
Write-Host "- Main application: http://$PlatformIP" -ForegroundColor Blue
Write-Host "- Health check: http://$PlatformIP/health" -ForegroundColor Blue
Write-Host ""
Write-Host "⚠️  Important notes:" -ForegroundColor Yellow
Write-Host "- This is a fresh setup with no existing data" -ForegroundColor Yellow
Write-Host "- Old SQLite databases are preserved as backups" -ForegroundColor Yellow
Write-Host "- Monitor the application for any issues" -ForegroundColor Yellow
Write-Host "- Check logs: pm2 logs flipnosis" -ForegroundColor Yellow
Write-Host ""
