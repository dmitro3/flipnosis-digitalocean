# Setup Database Sync between App Server and Database Server
# Usage: .\deployment\setup-database-sync.ps1 -AppServerIP 159.69.242.154 -DbServerIP 116.202.24.43

param(
    [string]$AppServerIP = "159.69.242.154",
    [string]$DbServerIP = "116.202.24.43",
    [string]$ServerUser = "root"
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Fail([string]$msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

Write-Info "Setting up database sync between servers..."
Write-Info "App Server: $AppServerIP"
Write-Info "Database Server: $DbServerIP"

try {
    # Test connections
    Write-Info "Testing connections..."
    
    & ssh -o ConnectTimeout=10 "$ServerUser@$AppServerIP" "echo 'App server OK'"
    if ($LASTEXITCODE -ne 0) {
        throw "Cannot connect to app server at $AppServerIP"
    }
    
    & ssh -o ConnectTimeout=10 "$ServerUser@$DbServerIP" "echo 'Database server OK'"
    if ($LASTEXITCODE -ne 0) {
        throw "Cannot connect to database server at $DbServerIP"
    }
    
    Write-Ok "Both servers accessible"
    
    # Create database sync script on app server
    Write-Info "Creating database sync script..."
    
    $syncScript = @"
#!/bin/bash
# Database sync script for Flipnosis
# Syncs database from database server to app server

DB_SERVER="$DbServerIP"
REMOTE_DB="/opt/flipnosis/shared/flipz-clean.db"
LOCAL_DB="/opt/flipnosis/app/server/flipz-clean.db"
BACKUP_DIR="/opt/flipnosis/app/backups"

# Create directories
mkdir -p /opt/flipnosis/app/server
mkdir -p `$BACKUP_DIR

# Create backup of current database if it exists
if [ -f `$LOCAL_DB ]; then
    echo "Creating backup of current database..."
    cp `$LOCAL_DB `$BACKUP_DIR/flipz-clean.db.backup.`$(date +%Y%m%d_%H%M%S)
fi

# Copy database from database server
echo "Syncing database from `$DB_SERVER..."
scp -o ConnectTimeout=30 root@`$DB_SERVER:`$REMOTE_DB `$LOCAL_DB

if [ `$? -eq 0 ]; then
    echo "Database sync completed successfully"
    chmod 644 `$LOCAL_DB
    
    # Restart application if it's running
    if systemctl is-active --quiet flipnosis-app; then
        echo "Restarting application..."
        systemctl restart flipnosis-app
    fi
else
    echo "Database sync failed"
    exit 1
fi
"@

    # Upload sync script to app server
    $tempScript = [System.IO.Path]::GetTempFileName()
    $syncScript | Out-File -FilePath $tempScript -Encoding UTF8
    
    & scp $tempScript "${ServerUser}@${AppServerIP}:/opt/flipnosis/app/scripts/db-sync.sh"
    & ssh "${ServerUser}@${AppServerIP}" "chmod +x /opt/flipnosis/app/scripts/db-sync.sh"
    
    Remove-Item $tempScript -Force
    
    Write-Ok "Database sync script created"
    
    # Create systemd service for automatic sync
    Write-Info "Creating systemd service for automatic sync..."
    
    $serviceScript = @"
[Unit]
Description=Flipnosis Database Sync
After=network.target

[Service]
Type=oneshot
ExecStart=/opt/flipnosis/app/scripts/db-sync.sh
User=root
WorkingDirectory=/opt/flipnosis/app

[Install]
WantedBy=multi-user.target
"@

    $timerScript = @"
[Unit]
Description=Flipnosis Database Sync Timer
Requires=flipnosis-db-sync.service

[Timer]
OnBootSec=30sec
OnUnitActiveSec=5min

[Install]
WantedBy=timers.target
"@

    # Upload service files
    $tempService = [System.IO.Path]::GetTempFileName()
    $serviceScript | Out-File -FilePath $tempService -Encoding UTF8
    
    $tempTimer = [System.IO.Path]::GetTempFileName()
    $timerScript | Out-File -FilePath $tempTimer -Encoding UTF8
    
    & scp $tempService "${ServerUser}@${AppServerIP}:/etc/systemd/system/flipnosis-db-sync.service"
    & scp $tempTimer "${ServerUser}@${AppServerIP}:/etc/systemd/system/flipnosis-db-sync.timer"
    
    Remove-Item $tempService -Force
    Remove-Item $tempTimer -Force
    
    # Enable and start the sync service
    & ssh "${ServerUser}@${AppServerIP}" "systemctl daemon-reload"
    & ssh "${ServerUser}@${AppServerIP}" "systemctl enable flipnosis-db-sync.timer"
    & ssh "${ServerUser}@${AppServerIP}" "systemctl start flipnosis-db-sync.timer"
    
    Write-Ok "Systemd sync service configured"
    
    # Run initial sync
    Write-Info "Running initial database sync..."
    & ssh "${ServerUser}@${AppServerIP}" "/opt/flipnosis/app/scripts/db-sync.sh"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Initial database sync completed"
    } else {
        Write-Warn "Initial sync had issues, but continuing..."
    }
    
    # Test the application
    Write-Info "Testing application..."
    Start-Sleep -Seconds 10
    
    try {
        [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
        $response = Invoke-WebRequest -Uri "https://$AppServerIP/health" -UseBasicParsing -TimeoutSec 10
        Write-Ok "Application health check passed"
    } catch {
        Write-Warn "Health check failed: $($_.Exception.Message)"
        Write-Info "This may be normal if the application is still starting"
    }
    
    Write-Ok "Database sync setup completed!"
    Write-Host ""
    Write-Host "Configuration Summary:" -ForegroundColor Yellow
    Write-Host "- App Server: $AppServerIP" -ForegroundColor Gray
    Write-Host "- Database Server: $DbServerIP" -ForegroundColor Gray
    Write-Host "- Sync Frequency: Every 5 minutes" -ForegroundColor Gray
    Write-Host "- Local Database: /opt/flipnosis/app/server/flipz-clean.db" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To monitor sync status:" -ForegroundColor Yellow
    Write-Host "ssh $ServerUser@$AppServerIP 'systemctl status flipnosis-db-sync.timer'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To force manual sync:" -ForegroundColor Yellow
    Write-Host "ssh $ServerUser@$AppServerIP '/opt/flipnosis/app/scripts/db-sync.sh'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To view sync logs:" -ForegroundColor Yellow
    Write-Host "ssh $ServerUser@$AppServerIP 'journalctl -u flipnosis-db-sync -f'" -ForegroundColor Gray

} catch {
    Write-Fail "Setup failed: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Ensure SSH access to both servers" -ForegroundColor Gray
    Write-Host "2. Check if database exists on database server" -ForegroundColor Gray
    Write-Host "3. Verify network connectivity between servers" -ForegroundColor Gray
    throw
}
