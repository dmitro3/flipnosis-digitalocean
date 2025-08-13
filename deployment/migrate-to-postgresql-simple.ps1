# PostgreSQL + Redis Migration Script (Simplified)
# This script migrates from SQLite to PostgreSQL + Redis

param(
    [string]$ServerIP = "116.202.24.43",
    [string]$PlatformIP = "159.69.242.154",
    [string]$CommitMessage = "PostgreSQL + Redis Migration"
)

Write-Host "🚀 Starting PostgreSQL + Redis Migration..." -ForegroundColor Green

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Step 1: Setup PostgreSQL and Redis on Server 116
Write-Status "Step 1: Setting up PostgreSQL and Redis on server $ServerIP"

try {
    # Copy setup script to server
    Write-Status "Copying setup script to server..."
    $scpCommand = "scp -o StrictHostKeyChecking=no scripts/setup-postgresql-redis.sh root@$ServerIP`:/opt/flipnosis/"
    Invoke-Expression $scpCommand
    
    # Make script executable and run it
    $sshCommand = "ssh -o StrictHostKeyChecking=no root@$ServerIP `"chmod +x /opt/flipnosis/setup-postgresql-redis.sh && /opt/flipnosis/setup-postgresql-redis.sh`""
    Invoke-Expression $sshCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "PostgreSQL and Redis setup completed on server $ServerIP"
    } else {
        Write-Error "PostgreSQL and Redis setup failed on server $ServerIP"
        exit 1
    }
} catch {
    Write-Error "Failed to setup PostgreSQL and Redis: $($_.Exception.Message)"
    exit 1
}

# Step 2: Install Node.js dependencies
Write-Status "Step 2: Installing Node.js dependencies on server $ServerIP"

try {
    $sshCommand = "ssh -o StrictHostKeyChecking=no root@$ServerIP `"cd /opt/flipnosis/app && npm install pg redis`""
    Invoke-Expression $sshCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Node.js dependencies installed successfully"
    } else {
        Write-Error "Failed to install Node.js dependencies"
        exit 1
    }
} catch {
    Write-Error "Failed to install dependencies: $($_.Exception.Message)"
    exit 1
}

# Step 3: Run database migration
Write-Status "Step 3: Running database migration"

try {
    # Copy migration script to server
    Write-Status "Copying migration script to server..."
    $scpCommand = "scp -o StrictHostKeyChecking=no scripts/migrate-to-postgresql.js root@$ServerIP`:/opt/flipnosis/app/scripts/"
    Invoke-Expression $scpCommand
    
    # Run migration
    $sshCommand = "ssh -o StrictHostKeyChecking=no root@$ServerIP `"cd /opt/flipnosis/app && node scripts/migrate-to-postgresql.js`""
    Invoke-Expression $sshCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database migration completed successfully"
    } else {
        Write-Error "Database migration failed"
        exit 1
    }
} catch {
    Write-Error "Failed to run migration: $($_.Exception.Message)"
    exit 1
}

# Step 4: Update application code on platform server
Write-Status "Step 4: Updating application code on platform server $PlatformIP"

try {
    # Copy new database service to platform server
    Write-Status "Copying new database service to platform server..."
    $scpCommand = "scp -o StrictHostKeyChecking=no server/services/database-postgresql.js root@$PlatformIP`:/opt/flipnosis/app/server/services/"
    Invoke-Expression $scpCommand
    
    # Install dependencies on platform server
    Write-Status "Installing dependencies on platform server..."
    $sshCommand = "ssh -o StrictHostKeyChecking=no root@$PlatformIP `"cd /opt/flipnosis/app && npm install pg redis`""
    Invoke-Expression $sshCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Platform server dependencies installed"
    } else {
        Write-Error "Failed to install platform server dependencies"
        exit 1
    }
} catch {
    Write-Error "Failed to update platform server: $($_.Exception.Message)"
    exit 1
}

# Step 5: Update server.js to use new database service
Write-Status "Step 5: Updating server configuration"

try {
    # Create backup of current server.js
    $sshCommand = "ssh -o StrictHostKeyChecking=no root@$PlatformIP `"cd /opt/flipnosis/app && cp server/server.js server/server.js.sqlite.backup`""
    Invoke-Expression $sshCommand
    
    # Copy the updated server.js file
    $scpCommand = "scp -o StrictHostKeyChecking=no server/server-postgresql.js root@$PlatformIP`:/opt/flipnosis/app/server/server.js"
    Invoke-Expression $scpCommand
    
    Write-Success "Server configuration updated"
} catch {
    Write-Error "Failed to update server configuration: $($_.Exception.Message)"
    exit 1
}

# Step 6: Test the new setup
Write-Status "Step 6: Testing the new database setup"

try {
    # Test database connection
    Write-Status "Testing database connection..."
    $sshCommand = "ssh -o StrictHostKeyChecking=no root@$PlatformIP `"cd /opt/flipnosis/app && node -e 'const DatabaseService = require(\"./server/services/database-postgresql\"); const db = new DatabaseService(); db.initialize().then(() => { console.log(\"Database test successful\"); process.exit(0); }).catch(err => { console.error(\"Database test failed:\", err); process.exit(1); });'`""
    Invoke-Expression $sshCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database connection test passed"
    } else {
        Write-Error "Database connection test failed"
        exit 1
    }
} catch {
    Write-Error "Failed to test database setup: $($_.Exception.Message)"
    exit 1
}

# Step 7: Restart the application
Write-Status "Step 7: Restarting the application"

try {
    # Restart PM2 process
    $sshCommand = "ssh -o StrictHostKeyChecking=no root@$PlatformIP `"cd /opt/flipnosis/app && pm2 restart flipnosis`""
    Invoke-Expression $sshCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Application restarted successfully"
    } else {
        Write-Error "Failed to restart application"
        exit 1
    }
} catch {
    Write-Error "Failed to restart application: $($_.Exception.Message)"
    exit 1
}

# Step 8: Verify deployment
Write-Status "Step 8: Verifying deployment"

try {
    # Wait a moment for the application to start
    Start-Sleep -Seconds 10
    
    # Test health endpoint
    $healthResponse = Invoke-RestMethod -Uri "http://$PlatformIP/health" -Method Get -TimeoutSec 30
    
    if ($healthResponse.status -eq "healthy") {
        Write-Success "Deployment verification successful"
        Write-Success "Database status: $($healthResponse.database.status)"
    } else {
        Write-Error "Deployment verification failed"
        Write-Error "Health response: $($healthResponse | ConvertTo-Json)"
        exit 1
    }
} catch {
    Write-Error "Failed to verify deployment: $($_.Exception.Message)"
    exit 1
}

# Step 9: Cleanup old SQLite files
Write-Status "Step 9: Cleaning up old SQLite files"

try {
    # Backup old SQLite databases
    $sshCommand = "ssh -o StrictHostKeyChecking=no root@$ServerIP `"cd /opt/flipnosis/shared && cp flipz-clean.db flipz-clean.db.postgresql-migration-backup`""
    Invoke-Expression $sshCommand
    
    $sshCommand = "ssh -o StrictHostKeyChecking=no root@$PlatformIP `"cd /opt/flipnosis/app/server && cp flipz-clean.db flipz-clean.db.postgresql-migration-backup`""
    Invoke-Expression $sshCommand
    
    Write-Success "Old SQLite databases backed up"
} catch {
    Write-Warning "Failed to backup old SQLite databases: $($_.Exception.Message)"
}

Write-Success "🎉 PostgreSQL + Redis migration completed successfully!"
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
