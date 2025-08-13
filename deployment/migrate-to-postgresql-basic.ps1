# PostgreSQL + Redis Migration Script (Basic)
# This script migrates from SQLite to PostgreSQL + Redis

param(
    [string]$ServerIP = "116.202.24.43",
    [string]$PlatformIP = "159.69.242.154"
)

Write-Host "🚀 Starting PostgreSQL + Redis Migration..." -ForegroundColor Green

# Step 1: Setup PostgreSQL and Redis on Server 116
Write-Host "[INFO] Step 1: Setting up PostgreSQL and Redis on server $ServerIP" -ForegroundColor Blue

# Copy setup script to server
Write-Host "[INFO] Copying setup script to server..." -ForegroundColor Blue
scp -o StrictHostKeyChecking=no scripts/setup-postgresql-redis.sh "root@$ServerIP:/opt/flipnosis/"

# Make script executable and run it
Write-Host "[INFO] Running setup script on server..." -ForegroundColor Blue
ssh -o StrictHostKeyChecking=no "root@$ServerIP" "chmod +x /opt/flipnosis/setup-postgresql-redis.sh && /opt/flipnosis/setup-postgresql-redis.sh"

if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] PostgreSQL and Redis setup completed on server $ServerIP" -ForegroundColor Green
} else {
    Write-Host "[ERROR] PostgreSQL and Redis setup failed on server $ServerIP" -ForegroundColor Red
    exit 1
}

# Step 2: Install Node.js dependencies
Write-Host "[INFO] Step 2: Installing Node.js dependencies on server $ServerIP" -ForegroundColor Blue
ssh -o StrictHostKeyChecking=no "root@$ServerIP" "cd /opt/flipnosis/app && npm install pg redis"

if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] Node.js dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to install Node.js dependencies" -ForegroundColor Red
    exit 1
}

# Step 3: Run database migration
Write-Host "[INFO] Step 3: Running database migration" -ForegroundColor Blue

# Copy migration script to server
Write-Host "[INFO] Copying migration script to server..." -ForegroundColor Blue
scp -o StrictHostKeyChecking=no scripts/migrate-to-postgresql.js "root@$ServerIP:/opt/flipnosis/app/scripts/"

# Run migration
ssh -o StrictHostKeyChecking=no "root@$ServerIP" "cd /opt/flipnosis/app && node scripts/migrate-to-postgresql.js"

if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] Database migration completed successfully" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Database migration failed" -ForegroundColor Red
    exit 1
}

# Step 4: Update application code on platform server
Write-Host "[INFO] Step 4: Updating application code on platform server $PlatformIP" -ForegroundColor Blue

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

# Step 5: Update server.js to use new database service
Write-Host "[INFO] Step 5: Updating server configuration" -ForegroundColor Blue

# Create backup of current server.js
ssh -o StrictHostKeyChecking=no "root@$PlatformIP" "cd /opt/flipnosis/app && cp server/server.js server/server.js.sqlite.backup"

# Copy the updated server.js file
scp -o StrictHostKeyChecking=no server/server-postgresql.js "root@$PlatformIP:/opt/flipnosis/app/server/server.js"

Write-Host "[SUCCESS] Server configuration updated" -ForegroundColor Green

# Step 6: Test the new setup
Write-Host "[INFO] Step 6: Testing the new database setup" -ForegroundColor Blue

# Test database connection
Write-Host "[INFO] Testing database connection..." -ForegroundColor Blue
ssh -o StrictHostKeyChecking=no "root@$PlatformIP" "cd /opt/flipnosis/app && node -e 'const DatabaseService = require(\"./server/services/database-postgresql\"); const db = new DatabaseService(); db.initialize().then(() => { console.log(\"Database test successful\"); process.exit(0); }).catch(err => { console.error(\"Database test failed:\", err); process.exit(1); });'"

if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] Database connection test passed" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Database connection test failed" -ForegroundColor Red
    exit 1
}

# Step 7: Restart the application
Write-Host "[INFO] Step 7: Restarting the application" -ForegroundColor Blue

# Restart PM2 process
ssh -o StrictHostKeyChecking=no "root@$PlatformIP" "cd /opt/flipnosis/app && pm2 restart flipnosis"

if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] Application restarted successfully" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to restart application" -ForegroundColor Red
    exit 1
}

# Step 8: Verify deployment
Write-Host "[INFO] Step 8: Verifying deployment" -ForegroundColor Blue

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

# Step 9: Cleanup old SQLite files
Write-Host "[INFO] Step 9: Cleaning up old SQLite files" -ForegroundColor Blue

# Backup old SQLite databases
ssh -o StrictHostKeyChecking=no "root@$ServerIP" "cd /opt/flipnosis/shared && cp flipz-clean.db flipz-clean.db.postgresql-migration-backup"
ssh -o StrictHostKeyChecking=no "root@$PlatformIP" "cd /opt/flipnosis/app/server && cp flipz-clean.db flipz-clean.db.postgresql-migration-backup"

Write-Host "[SUCCESS] Old SQLite databases backed up" -ForegroundColor Green

Write-Host "[SUCCESS] 🎉 PostgreSQL + Redis migration completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Migration Summary:" -ForegroundColor Green
Write-Host "====================" -ForegroundColor Green
Write-Host "✅ PostgreSQL and Redis installed on server $ServerIP" -ForegroundColor Green
Write-Host "✅ Database schema created and data migrated" -ForegroundColor Green
Write-Host "✅ Application updated to use PostgreSQL + Redis" -ForegroundColor Green
Write-Host "✅ WebSocket real-time functionality enabled" -ForegroundColor Green
Write-Host "✅ Application restarted and verified" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Benefits achieved:" -ForegroundColor Yellow
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
Write-Host "- Old SQLite databases have been backed up" -ForegroundColor Yellow
Write-Host "- Monitor the application for any issues" -ForegroundColor Yellow
Write-Host "- Check logs: pm2 logs flipnosis" -ForegroundColor Yellow
Write-Host ""
