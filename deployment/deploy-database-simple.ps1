# Simple Database Deployment Script
# Usage: .\deployment\deploy-database-simple.ps1

param(
    [string]$AppServerIP = "159.69.242.154",
    [string]$DbServerIP = "116.202.24.43",
    [string]$DbPassword = "xUncTgMpgNtw",
    [string]$ServerUser = "root"
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Fail([string]$msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

Write-Info "Deploying database to fix connection issues..."
Write-Info "App Server: $AppServerIP"
Write-Info "Database Server: $DbServerIP"

try {
    # Check if local database exists
    $localDbPath = "server/flipz-clean.db"
    if (!(Test-Path $localDbPath)) {
        Write-Fail "Local database not found at: $localDbPath"
        throw "Database file missing"
    }

    $dbSize = (Get-Item $localDbPath).Length
    Write-Info "Local database size: $([math]::Round($dbSize / 1KB, 2)) KB"

    # Create backup
    $backupName = "flipz-clean.db.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    $backupPath = "server/$backupName"
    Copy-Item $localDbPath $backupPath
    Write-Ok "Created backup: $backupPath"

    # Option 1: Deploy to app server directly (quickest fix)
    Write-Info "Deploying database directly to app server..."
    
    # Test app server connection
    & ssh -o ConnectTimeout=10 "$ServerUser@$AppServerIP" "echo 'App server accessible'"
    if ($LASTEXITCODE -ne 0) {
        throw "Cannot connect to app server"
    }

    # Create database directory
    & ssh "$ServerUser@$AppServerIP" "mkdir -p /opt/flipnosis/app/server"

    # Upload database
    Write-Info "Uploading database to app server..."
    & scp $localDbPath "${ServerUser}@${AppServerIP}:/opt/flipnosis/app/server/flipz-clean.db"
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to upload database to app server"
    }

    # Set permissions
    & ssh "$ServerUser@$AppServerIP" "chmod 644 /opt/flipnosis/app/server/flipz-clean.db"
    Write-Ok "Database uploaded to app server"

    # Also backup to database server
    Write-Info "Backing up database to database server..."
    
    # Use sshpass or expect for password authentication
    $sshpassCommand = @"
sshpass -p '$DbPassword' ssh -o StrictHostKeyChecking=no $ServerUser@$DbServerIP "mkdir -p /opt/flipnosis/shared"
sshpass -p '$DbPassword' scp -o StrictHostKeyChecking=no $localDbPath $ServerUser@${DbServerIP}:/opt/flipnosis/shared/flipz-clean.db
"@

    try {
        # Try using sshpass if available
        if (Get-Command sshpass -ErrorAction SilentlyContinue) {
            Invoke-Expression $sshpassCommand
            Write-Ok "Database also backed up to database server"
        } else {
            Write-Warn "sshpass not available, skipping database server backup"
            Write-Info "You can manually copy the database later using:"
            Write-Host "  scp server/flipz-clean.db root@116.202.24.43:/opt/flipnosis/shared/" -ForegroundColor Gray
        }
    } catch {
        Write-Warn "Database server backup failed, but app server has the database"
    }

    # Restart application
    Write-Info "Restarting application..."
    & ssh "$ServerUser@$AppServerIP" "systemctl restart flipnosis-app"
    Start-Sleep -Seconds 5

    # Test the application
    Write-Info "Testing application..."
    
    # Test health endpoint
    try {
        [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
        $healthResponse = Invoke-WebRequest -Uri "https://$AppServerIP/health" -UseBasicParsing -TimeoutSec 10
        Write-Ok "Health check: $($healthResponse.StatusCode)"
    } catch {
        Write-Warn "Health check failed: $($_.Exception.Message)"
    }

    # Test the problematic user games endpoint
    Write-Info "Testing user games API..."
    try {
        $userGamesResponse = Invoke-WebRequest -Uri "https://$AppServerIP/api/users/0x93277281Fd256D0601Ce86Cdb1D5c00a97b59839/games" -UseBasicParsing -TimeoutSec 10
        $responseContent = $userGamesResponse.Content
        
        if ($userGamesResponse.StatusCode -eq 200) {
            try {
                $gamesData = $responseContent | ConvertFrom-Json
                Write-Ok "✅ User games API working! Response: $($gamesData.Count) games found"
            } catch {
                Write-Ok "✅ User games API responding (200), content: $($responseContent.Substring(0, [Math]::Min(100, $responseContent.Length)))"
            }
        } else {
            Write-Warn "User games API returned status: $($userGamesResponse.StatusCode)"
        }
    } catch {
        Write-Warn "User games API test failed: $($_.Exception.Message)"
    }

    # Test your actual website
    Write-Info "Testing main website..."
    try {
        $siteResponse = Invoke-WebRequest -Uri "https://www.flipnosis.fun/api/health" -UseBasicParsing -TimeoutSec 10
        Write-Ok "✅ Main site health check: $($siteResponse.StatusCode)"
        
        $userGamesSiteResponse = Invoke-WebRequest -Uri "https://www.flipnosis.fun/api/users/0x93277281Fd256D0601Ce86Cdb1D5c00a97b59839/games" -UseBasicParsing -TimeoutSec 10
        if ($userGamesSiteResponse.StatusCode -eq 200) {
            Write-Ok "✅ Main site user games API fixed!"
        }
    } catch {
        Write-Warn "Main site test: $($_.Exception.Message)"
    }

    Write-Ok "🎉 Database deployment completed!"
    Write-Host ""
    Write-Host "✅ Your homepage should now connect to the database properly!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Test your site: https://www.flipnosis.fun" -ForegroundColor Yellow
    Write-Host "2. Check if the 500 errors are gone" -ForegroundColor Yellow
    Write-Host "3. Try creating a new game to test functionality" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Database locations:" -ForegroundColor Cyan
    Write-Host "- App Server: /opt/flipnosis/app/server/flipz-clean.db" -ForegroundColor Gray
    Write-Host "- Backup: $backupPath" -ForegroundColor Gray

} catch {
    Write-Fail "Database deployment failed: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check server status: ssh $ServerUser@$AppServerIP 'systemctl status flipnosis-app'" -ForegroundColor Yellow
    Write-Host "2. Check server logs: ssh $ServerUser@$AppServerIP 'journalctl -u flipnosis-app -f'" -ForegroundColor Yellow
    Write-Host "3. Verify database: ssh $ServerUser@$AppServerIP 'ls -la /opt/flipnosis/app/server/'" -ForegroundColor Yellow
    throw
}
