# Deploy Coin Picker Fix to Hetzner Server
# This script deploys the updated game-main.js and test-tubes.html files

param(
    [string]$Server = "root@159.69.242.154",
    [string]$RemotePath = "/opt/flipnosis/app"
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Error([string]$msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }

Write-Info "================================================"
Write-Info "Deploying Coin Picker Fix to Hetzner Server"
Write-Info "================================================"
Write-Info "Server: $Server"
Write-Info "Remote Path: $RemotePath"
Write-Host ""

# Step 1: Verify local files exist and don't have the old code
Write-Info "Step 1: Verifying local files..."
$gameMainPath = "public/js/game-main.js"
$testTubesPath = "public/test-tubes.html"

if (-not (Test-Path $gameMainPath)) {
    Write-Error "File not found: $gameMainPath"
    exit 1
}

if (-not (Test-Path $testTubesPath)) {
    Write-Error "File not found: $testTubesPath"
    exit 1
}

# Check if old code still exists
$gameMainContent = Get-Content $gameMainPath -Raw
if ($gameMainContent -match "change-coin-box" -and $gameMainContent -match "global-change-coin-btn") {
    Write-Error "❌ Old code still found in game-main.js! The file needs to be updated first."
    exit 1
}

Write-Ok "✓ Local files verified - old code removed"

# Step 2: Check what the server is currently serving
Write-Host ""
Write-Info "Step 2: Checking server configuration..."
Write-Info "Checking if server serves from 'public' or 'dist'..."

$serverCheck = ssh $Server "cd $RemotePath && echo 'Checking server.js...' && grep -r 'public\|dist' server/server.js 2>/dev/null | head -3 || echo 'server.js not found'"
Write-Host $serverCheck -ForegroundColor Gray

$distPath = "$RemotePath/dist/public"
$publicPath = "$RemotePath/public"

Write-Info "Checking if dist/public exists..."
$distExists = ssh $Server "test -d $distPath && echo 'EXISTS' || echo 'NOT_EXISTS'"
Write-Host "  dist/public: $distExists" -ForegroundColor Gray

Write-Info "Checking if public exists..."
$publicExists = ssh $Server "test -d $publicPath && echo 'EXISTS' || echo 'NOT_EXISTS'"
Write-Host "  public: $publicExists" -ForegroundColor Gray

# Step 3: Create backup
Write-Host ""
Write-Info "Step 3: Creating backup on remote server..."
$backupCmd = "cd $RemotePath && mkdir -p backups && cp -r public backups/public.backup.`$(date +%Y%m%d_%H%M%S) 2>/dev/null || true"
ssh $Server $backupCmd
Write-Ok "✓ Backup created"

# Step 4: Deploy to public folder
Write-Host ""
Write-Info "Step 4: Deploying files to public folder..."
scp $testTubesPath "${Server}:${RemotePath}/public/test-tubes.html"
Write-Ok "✓ test-tubes.html deployed"

scp $gameMainPath "${Server}:${RemotePath}/public/js/game-main.js"
Write-Ok "✓ game-main.js deployed"

# Step 5: If dist/public exists, copy there too
Write-Host ""
Write-Info "Step 5: Checking if dist/public needs updating..."
$distPublicExists = ssh $Server "test -d $distPath && echo 'EXISTS' || echo 'NOT_EXISTS'"
if ($distPublicExists -eq "EXISTS") {
    Write-Warn "dist/public folder exists - copying files there too..."
    ssh $Server "mkdir -p $distPath && cp ${RemotePath}/public/test-tubes.html $distPath/ && cp ${RemotePath}/public/js/game-main.js $distPath/js/ 2>/dev/null || true"
    Write-Ok "✓ Files copied to dist/public"
} else {
    Write-Info "  dist/public does not exist - skipping"
}

# Step 6: Verify deployment
Write-Host ""
Write-Info "Step 6: Verifying deployment..."
Write-Info "Checking if change-coin-box code exists on server..."

$serverCheck = ssh $Server "grep -c 'change-coin-box' $RemotePath/public/js/game-main.js 2>/dev/null || echo '0'"
if ($serverCheck -eq "0") {
    Write-Ok "✓ Server files updated - change-coin-box removed"
} else {
    Write-Error "❌ Server still has old code! Deployment may have failed."
    exit 1
}

# Step 7: Set permissions
Write-Host ""
Write-Info "Step 7: Setting proper permissions..."
ssh $Server "cd $RemotePath/public && chmod 644 test-tubes.html && chmod 644 js/game-main.js"
Write-Ok "✓ Permissions set"

# Step 8: Clear any caches
Write-Host ""
Write-Info "Step 8: Clearing caches..."
Write-Warn "You may need to hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)"
Write-Warn "Or clear browser cache to see changes"

# Step 9: Restart server (optional)
Write-Host ""
Write-Info "Step 9: Server restart options..."
Write-Host "  To restart PM2: ssh $Server 'pm2 restart flipnosis-app'"
Write-Host "  Or restart nginx: ssh $Server 'systemctl restart nginx'"
Write-Host ""

Write-Ok "================================================"
Write-Ok "Deployment Complete!"
Write-Ok "================================================"
Write-Host ""
Write-Info "Next steps:"
Write-Host "  1. Hard refresh your browser (Ctrl+Shift+R)"
Write-Host "  2. Check browser console for any errors"
Write-Host "  3. Verify the change coin button is gone"
Write-Host "  4. Test that coin picker works from top-left button"
Write-Host ""
Write-Info "If changes still don't appear:"
Write-Host "  - Check if server is serving from a different location"
Write-Host "  - Check nginx configuration"
Write-Host "  - Verify files were actually copied (check timestamps)"
Write-Host ""
Write-Info "To check server file timestamps:"
Write-Host "  ssh $Server 'ls -lah $RemotePath/public/js/game-main.js'"
Write-Host ""

