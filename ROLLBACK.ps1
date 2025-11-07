# Emergency Rollback Script
# Restores previous deployment if something breaks

param(
    [int]$BackupNumber = 1  # Which backup to restore (1=most recent, 2=second most recent, etc)
)

$ErrorActionPreference = "Stop"

Write-Host "`n============================================" -ForegroundColor Red
Write-Host "  EMERGENCY ROLLBACK SYSTEM" -ForegroundColor Red
Write-Host "============================================`n" -ForegroundColor Red

Write-Warning "This will restore a previous deployment!"
Write-Host ""
$confirm = Read-Host "Are you sure? Type 'YES' to continue"

if ($confirm -ne "YES") {
    Write-Host "Rollback cancelled." -ForegroundColor Gray
    exit 0
}

Write-Host "`nListing available backups..." -ForegroundColor Cyan
ssh root@159.69.242.154 "ls -lth /opt/flipnosis/ | grep 'app.backup' | head -10"

Write-Host "`nRestoring backup #$BackupNumber..." -ForegroundColor Yellow

$rollbackScript = @"
cd /opt/flipnosis

# Find the backup to restore
BACKUP_DIR=`$(ls -dt app.backup.* 2>/dev/null | sed -n '${BackupNumber}p')

if [ -z "`$BACKUP_DIR" ]; then
    echo "ERROR: Backup #$BackupNumber not found!"
    exit 1
fi

echo "Found backup: `$BACKUP_DIR"
echo "Stopping PM2..."
pm2 stop all > /dev/null 2>&1

echo "Creating safety backup of current state..."
cp -r app app.before_rollback.`$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

echo "Restoring from `$BACKUP_DIR..."
rm -rf app
cp -r "`$BACKUP_DIR" app

echo "Restarting PM2..."
cd app
pm2 restart all > /dev/null 2>&1 || pm2 start ecosystem.config.js > /dev/null 2>&1
pm2 save > /dev/null 2>&1

echo "ROLLBACK_COMPLETE"
pm2 status | grep flipnosis
"@

try {
    $output = ssh root@159.69.242.154 $rollbackScript
    
    if ($output -match "ROLLBACK_COMPLETE") {
        Write-Host "`n============================================" -ForegroundColor Green
        Write-Host "  ROLLBACK SUCCESSFUL!" -ForegroundColor Green
        Write-Host "============================================" -ForegroundColor Green
        Write-Host "`nServer restored to previous version." -ForegroundColor Green
        Write-Host "Test it: http://159.69.242.154/" -ForegroundColor Yellow
    } else {
        Write-Error "Rollback may have failed. Check server manually."
    }
} catch {
    Write-Error "Rollback failed: $_"
    Write-Host "`nYou may need to SSH in manually:" -ForegroundColor Yellow
    Write-Host "  ssh root@159.69.242.154" -ForegroundColor White
    exit 1
}


