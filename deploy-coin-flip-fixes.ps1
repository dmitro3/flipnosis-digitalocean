# Deploy Coin Flip Fixes to Hetzner Server
# 
# This script uploads the critical fixes for:
# 1. Smooth coin landing (no snapback)
# 2. Simultaneous flip support
# 3. Asset preloading
#
# Target Server: Hetzner (hetzner159 or your configured server)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  COIN FLIP FIXES - DEPLOYMENT SCRIPT  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration - Update these values
$SERVER_USER = "root"  # or your SSH user
$SERVER_HOST = "hetzner159"  # or your server IP/hostname
$REMOTE_PATH = "/var/www/flipnosis"  # or your app path
$SSH_KEY = "$HOME\.ssh\id_rsa"  # your SSH key path

Write-Host "📋 Deployment Configuration:" -ForegroundColor Yellow
Write-Host "   Server: $SERVER_USER@$SERVER_HOST" -ForegroundColor Gray
Write-Host "   Path: $REMOTE_PATH" -ForegroundColor Gray
Write-Host ""

# Files to deploy
$FILES_TO_DEPLOY = @(
    "public/test-tubes.html",
    "server/PhysicsGameManager.js"
)

Write-Host "📦 Files to deploy:" -ForegroundColor Yellow
foreach ($file in $FILES_TO_DEPLOY) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file (NOT FOUND!)" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Confirm deployment
Write-Host "⚠️  This will update the live server!" -ForegroundColor Red
$confirm = Read-Host "Continue? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 Starting deployment..." -ForegroundColor Cyan
Write-Host ""

# Create backup directory on server
Write-Host "📁 Creating backup on server..." -ForegroundColor Yellow
$backupDir = "/tmp/flipnosis-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
ssh -i $SSH_KEY "$SERVER_USER@$SERVER_HOST" "mkdir -p $backupDir"

# Backup existing files
Write-Host "💾 Backing up existing files..." -ForegroundColor Yellow
foreach ($file in $FILES_TO_DEPLOY) {
    $remotePath = "$REMOTE_PATH/$file"
    $backupPath = "$backupDir/$file"
    
    ssh -i $SSH_KEY "$SERVER_USER@$SERVER_HOST" "mkdir -p `$(dirname $backupPath) && cp -f $remotePath $backupPath 2>/dev/null || echo 'File not found, skipping backup'"
}

Write-Host "✅ Backup created at: $backupDir" -ForegroundColor Green
Write-Host ""

# Upload new files
Write-Host "📤 Uploading updated files..." -ForegroundColor Yellow
foreach ($file in $FILES_TO_DEPLOY) {
    Write-Host "   Uploading $file..." -ForegroundColor Gray
    
    # Create directory if needed
    $remoteDir = Split-Path "$REMOTE_PATH/$file" -Parent
    ssh -i $SSH_KEY "$SERVER_USER@$SERVER_HOST" "mkdir -p $remoteDir"
    
    # Upload file
    scp -i $SSH_KEY $file "$SERVER_USER@${SERVER_HOST}:$REMOTE_PATH/$file"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ $file uploaded" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Failed to upload $file" -ForegroundColor Red
        Write-Host ""
        Write-Host "⚠️  Deployment failed! Restore from: $backupDir" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🔄 Restarting server..." -ForegroundColor Yellow

# Restart the Node.js server (adjust command for your setup)
ssh -i $SSH_KEY "$SERVER_USER@$SERVER_HOST" "cd $REMOTE_PATH && pm2 restart all || systemctl restart flipnosis || echo 'Manual restart required'"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Server restarted" -ForegroundColor Green
} else {
    Write-Host "⚠️  Could not restart automatically - please restart manually!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT COMPLETE!                  " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Test simultaneous coin flips" -ForegroundColor Gray
Write-Host "   2. Verify smooth coin landing (no snapback)" -ForegroundColor Gray
Write-Host "   3. Check first flip performance" -ForegroundColor Gray
Write-Host "   4. Monitor server logs for errors" -ForegroundColor Gray
Write-Host ""
Write-Host "🔧 If issues occur, restore from:" -ForegroundColor Yellow
Write-Host "   $backupDir" -ForegroundColor Gray
Write-Host ""

