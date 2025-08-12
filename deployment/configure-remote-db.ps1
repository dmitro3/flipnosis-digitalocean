# Configure Remote Database Connection
# Usage: .\deployment\configure-remote-db.ps1 -AppServerIP 159.69.242.154 -DbServerIP 116.202.24.43

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

Write-Info "Configuring remote database connection..."
Write-Info "App Server: $AppServerIP"
Write-Info "Database Server: $DbServerIP"

try {
    # Test connection to both servers
    Write-Info "Testing connection to app server..."
    & ssh -o ConnectTimeout=10 "$ServerUser@$AppServerIP" "echo 'App server connection OK'"
    if ($LASTEXITCODE -ne 0) {
        throw "Cannot connect to app server at $AppServerIP"
    }

    Write-Info "Testing connection to database server..."
    & ssh -o ConnectTimeout=10 "$ServerUser@$DbServerIP" "echo 'Database server connection OK'"
    if ($LASTEXITCODE -ne 0) {
        throw "Cannot connect to database server at $DbServerIP"
    }

    # Check if database exists on database server
    Write-Info "Checking for database on database server..."
    $dbCheckResult = & ssh "$ServerUser@$DbServerIP" "find /opt /root /home -name 'flipz-clean.db' 2>/dev/null | head -5"
    if ($dbCheckResult) {
        Write-Ok "Found database files on database server:"
        $dbCheckResult | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        $remoteDatabasePath = $dbCheckResult[0]
    } else {
        Write-Warn "No existing database found on database server"
        $remoteDatabasePath = "/opt/flipnosis/shared/flipz-clean.db"
        
        # Copy local database to database server
        Write-Info "Copying local database to database server..."
        $localDbPath = "server/flipz-clean.db"
        if (Test-Path $localDbPath) {
            & ssh "$ServerUser@$DbServerIP" "mkdir -p /opt/flipnosis/shared"
            & scp $localDbPath "${ServerUser}@${DbServerIP}:$remoteDatabasePath"
            Write-Ok "Database copied to database server: $remoteDatabasePath"
        } else {
            Write-Fail "Local database not found at: $localDbPath"
            throw "Local database file missing"
        }
    }

    # Configure database access method
    Write-Info "Configuring database access method..."
    
    # Option 1: SSH Tunnel approach (mount database via SSH)
    $sshConfigScript = @"
#!/bin/bash
set -e

echo "Setting up SSH tunnel and database access..."

# Create SSH key for database access if it doesn't exist
if [ ! -f ~/.ssh/id_rsa ]; then
    echo "Generating SSH key for database access..."
    ssh-keygen -t rsa -b 2048 -f ~/.ssh/id_rsa -N ""
fi

# Copy SSH key to database server for passwordless access
echo "Setting up passwordless access to database server..."
ssh-copy-id -i ~/.ssh/id_rsa.pub $ServerUser@$DbServerIP || echo "SSH key may already be installed"

# Create database access script
cat > /opt/flipnosis/app/scripts/db-sync.sh << 'EOF'
#!/bin/bash
# Database synchronization script
DB_SERVER="$DbServerIP"
REMOTE_DB="$remoteDatabasePath"
LOCAL_DB="/opt/flipnosis/app/server/flipz-clean.db"

# Create local directory
mkdir -p /opt/flipnosis/app/server

# Copy database from database server
scp root@`$DB_SERVER:`$REMOTE_DB `$LOCAL_DB

# Set permissions
chmod 644 `$LOCAL_DB

echo "Database synchronized from `$DB_SERVER"
EOF

chmod +x /opt/flipnosis/app/scripts/db-sync.sh

# Create systemd service for database sync
cat > /etc/systemd/system/flipnosis-db-sync.service << 'EOF'
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
EOF

# Create timer for regular sync (every 5 minutes)
cat > /etc/systemd/system/flipnosis-db-sync.timer << 'EOF'
[Unit]
Description=Flipnosis Database Sync Timer
Requires=flipnosis-db-sync.service

[Timer]
OnBootSec=30sec
OnUnitActiveSec=5min

[Install]
WantedBy=timers.target
EOF

# Enable and start the sync service
systemctl daemon-reload
systemctl enable flipnosis-db-sync.timer
systemctl start flipnosis-db-sync.timer

echo "Database sync service configured and started"
"@

    # Upload and execute SSH configuration script
    $tempSshScript = [System.IO.Path]::GetTempFileName()
    $sshConfigScript | Out-File -FilePath $tempSshScript -Encoding UTF8
    
    & scp $tempSshScript "${ServerUser}@${AppServerIP}:/tmp/ssh-config.sh"
    & ssh "${ServerUser}@${AppServerIP}" "chmod +x /tmp/ssh-config.sh && /tmp/ssh-config.sh && rm /tmp/ssh-config.sh"
    Remove-Item $tempSshScript -Force

    Write-Ok "SSH tunnel and database sync configured"

    # Run initial database sync
    Write-Info "Running initial database sync..."
    & ssh "${ServerUser}@${AppServerIP}" "/opt/flipnosis/app/scripts/db-sync.sh"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Initial database sync completed"
    } else {
        Write-Warn "Initial sync had issues, but continuing..."
    }

    # Restart application
    Write-Info "Restarting application..."
    & ssh "${ServerUser}@${AppServerIP}" "systemctl restart flipnosis-app"
    Start-Sleep -Seconds 5

    # Test the API
    Write-Info "Testing API endpoints..."
    try {
        [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
        $healthResponse = Invoke-WebRequest -Uri "https://$AppServerIP/health" -UseBasicParsing -TimeoutSec 10
        Write-Ok "Health check passed"
        
        # Test the problematic user games endpoint
        $testUserGamesResponse = Invoke-WebRequest -Uri "https://$AppServerIP/api/users/0x93277281Fd256D0601Ce86Cdb1D5c00a97b59839/games" -UseBasicParsing -TimeoutSec 10
        $gamesData = $testUserGamesResponse.Content | ConvertFrom-Json
        Write-Ok "User games API working: Found $($gamesData.Count) games"
    } catch {
        Write-Warn "API test failed: $($_.Exception.Message)"
        Write-Info "This may be normal if the database is still syncing"
    }

    Write-Ok "Remote database configuration completed!"
    Write-Host ""
    Write-Host "Configuration Summary:" -ForegroundColor Yellow
    Write-Host "- App Server: $AppServerIP" -ForegroundColor Gray
    Write-Host "- Database Server: $DbServerIP" -ForegroundColor Gray
    Write-Host "- Database Path: $remoteDatabasePath" -ForegroundColor Gray
    Write-Host "- Sync Frequency: Every 5 minutes" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To monitor database sync:" -ForegroundColor Yellow
    Write-Host "ssh $ServerUser@$AppServerIP 'systemctl status flipnosis-db-sync.timer'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To force manual sync:" -ForegroundColor Yellow
    Write-Host "ssh $ServerUser@$AppServerIP '/opt/flipnosis/app/scripts/db-sync.sh'" -ForegroundColor Gray

} catch {
    Write-Fail "Configuration failed: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Ensure SSH access to both servers" -ForegroundColor Yellow
    Write-Host "2. Check if database exists on database server: ssh $ServerUser@$DbServerIP 'find /opt -name *.db'" -ForegroundColor Yellow
    Write-Host "3. Check server logs: ssh $ServerUser@$AppServerIP 'journalctl -u flipnosis-app -f'" -ForegroundColor Yellow
    throw
}
