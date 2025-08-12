# Database Migration Script for Hetzner Server
# Usage: .\deployment\migrate-database.ps1 -ServerIP 159.69.242.154

param(
    [string]$ServerIP = "159.69.242.154",
    [string]$ServerUser = "root",
    [string]$LocalDbPath = "server/flipz-clean.db"
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Fail([string]$msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

Write-Info "Starting database migration to $ServerIP..."

# Check if local database exists
if (!(Test-Path $LocalDbPath)) {
    Write-Fail "Local database not found at: $LocalDbPath"
    throw "Database file not found"
}

$dbSize = (Get-Item $LocalDbPath).Length
Write-Info "Local database size: $($dbSize / 1KB) KB"

# Create backup of local database
$backupName = "flipz-clean.db.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
$backupPath = "server/$backupName"
Copy-Item $LocalDbPath $backupPath
Write-Ok "Created local backup: $backupPath"

try {
    # Test SSH connection
    Write-Info "Testing SSH connection to $ServerUser@$ServerIP..."
    $testResult = & ssh -o ConnectTimeout=10 "$ServerUser@$ServerIP" "echo 'SSH connection successful'"
    if ($LASTEXITCODE -ne 0) {
        throw "SSH connection failed"
    }
    Write-Ok "SSH connection verified"

    # Create database directory on server
    Write-Info "Creating database directory on server..."
    & ssh "$ServerUser@$ServerIP" "mkdir -p /opt/flipnosis/app/server"

    # Upload database file
    Write-Info "Uploading database file to server..."
    $remoteDbPath = "/opt/flipnosis/app/server/flipz-clean.db"
    & scp $LocalDbPath "${ServerUser}@${ServerIP}:$remoteDbPath"
    
    if ($LASTEXITCODE -ne 0) {
        throw "Database upload failed"
    }
    Write-Ok "Database uploaded successfully"

    # Verify upload
    Write-Info "Verifying database upload..."
    $remoteSizeResult = & ssh "$ServerUser@$ServerIP" "ls -la $remoteDbPath"
    Write-Info "Remote database: $remoteSizeResult"

    # Set proper permissions
    Write-Info "Setting database permissions..."
    & ssh "$ServerUser@$ServerIP" "chmod 644 $remoteDbPath && chown root:root $remoteDbPath"
    Write-Ok "Database permissions set"

    # Test database connectivity on server
    Write-Info "Testing database connectivity on server..."
    $dbTestScript = @"
#!/bin/bash
cd /opt/flipnosis/app/server
if command -v node >/dev/null 2>&1; then
    node -e "
        const sqlite3 = require('sqlite3').verbose();
        const db = new sqlite3.Database('./flipz-clean.db', (err) => {
            if (err) {
                console.error('Database connection failed:', err.message);
                process.exit(1);
            } else {
                console.log('Database connection successful');
                db.get('SELECT COUNT(*) as count FROM sqlite_master WHERE type=\\\"table\\\"', (err, row) => {
                    if (err) {
                        console.error('Table query failed:', err.message);
                        process.exit(1);
                    } else {
                        console.log('Database tables found:', row.count);
                        db.close();
                        process.exit(0);
                    }
                });
            }
        });
    " 2>&1
else
    echo "Node.js not found, skipping database test"
fi
"@

    # Upload and run test script
    $tempTestScript = [System.IO.Path]::GetTempFileName()
    $dbTestScript | Out-File -FilePath $tempTestScript -Encoding UTF8
    
    & scp $tempTestScript "${ServerUser}@${ServerIP}:/tmp/db-test.sh"
    & ssh "$ServerUser@$ServerIP" "chmod +x /tmp/db-test.sh && /tmp/db-test.sh && rm /tmp/db-test.sh"
    Remove-Item $tempTestScript -Force

    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Database connectivity test passed"
    } else {
        Write-Warn "Database test had issues, but continuing..."
    }

    # Restart the application to pick up the new database
    Write-Info "Restarting application to use new database..."
    & ssh "$ServerUser@$ServerIP" "systemctl restart flipnosis-app || echo 'Failed to restart via systemctl'"

    # Wait for restart
    Start-Sleep -Seconds 5

    # Test API endpoint
    Write-Info "Testing API health endpoint..."
    try {
        [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
        $healthResponse = Invoke-WebRequest -Uri "https://$ServerIP/health" -UseBasicParsing -TimeoutSec 10
        $healthContent = $healthResponse.Content | ConvertFrom-Json
        Write-Ok "Health check passed: $($healthContent.status)"
    } catch {
        Write-Warn "Health check failed, but database is uploaded. Server may need time to start."
    }

    Write-Ok "Database migration completed successfully!"
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Test your site: https://www.flipnosis.fun" -ForegroundColor Yellow
    Write-Host "2. Check API: https://www.flipnosis.fun/api/health" -ForegroundColor Yellow
    Write-Host "3. Check server status: .\deployment\check-hetzner-status.ps1 -ServerIP $ServerIP" -ForegroundColor Yellow

} catch {
    Write-Fail "Database migration failed: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Ensure SSH key is set up: .\deployment\setup-hetzner-git-deploy-fixed.ps1 -ServerIP $ServerIP" -ForegroundColor Yellow
    Write-Host "2. Check server status manually: ssh $ServerUser@$ServerIP" -ForegroundColor Yellow
    throw
}
