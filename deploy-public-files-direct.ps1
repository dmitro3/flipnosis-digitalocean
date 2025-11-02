# Direct deployment of public files to Hetzner server
# This bypasses the build process and copies files directly
# Usage: .\deploy-public-files-direct.ps1

param(
    [string]$Server = "root@159.69.242.154",
    [string]$RemotePath = "/opt/flipnosis/app"
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }

Write-Info "Deploying public files directly to Hetzner server..."
Write-Info "Server: $Server"
Write-Info "Remote Path: $RemotePath"
Write-Host ""

# Check if files exist locally
$filesToDeploy = @(
    "public/test-tubes.html",
    "public/js/core/socket-manager.js",
    "public/js/game-main.js",
    "public/js/core/update-client-state.js",
    "public/js/init.js"
)

foreach ($file in $filesToDeploy) {
    if (-not (Test-Path $file)) {
        Write-Warn "File not found: $file"
        throw "Missing file: $file"
    }
}

Write-Info "Creating backup on remote server..."
ssh $Server "cd $RemotePath && mkdir -p backups && cp -r public backups/public.backup.`$(date +%Y%m%d_%H%M%S) 2>/dev/null || true"

Write-Info "Uploading files..."
Write-Host ""

# Upload test-tubes.html
scp public/test-tubes.html "${Server}:${RemotePath}/public/"
Write-Ok "✓ test-tubes.html"

# Upload JavaScript files
scp public/js/core/socket-manager.js "${Server}:${RemotePath}/public/js/core/"
Write-Ok "✓ socket-manager.js"

scp public/js/game-main.js "${Server}:${RemotePath}/public/js/"
Write-Ok "✓ game-main.js"

scp public/js/core/update-client-state.js "${Server}:${RemotePath}/public/js/core/"
Write-Ok "✓ update-client-state.js"

# Also upload init.js if it exists
if (Test-Path "public/js/init.js") {
    scp public/js/init.js "${Server}:${RemotePath}/public/js/"
    Write-Ok "✓ init.js"
}

Write-Host ""
Write-Info "Setting proper permissions..."
ssh $Server "cd $RemotePath/public && chmod -R 644 *.html && chmod -R 644 js/**/*.js 2>/dev/null || true"

Write-Host ""
Write-Info "Checking if server serves from 'public' or 'dist'..."
$serverConfig = ssh $Server "cd $RemotePath && grep -r 'public\|dist' server/server.js 2>/dev/null | head -5"
Write-Host $serverConfig -ForegroundColor Gray

Write-Host ""
Write-Ok "Files deployed successfully!"
Write-Host ""
Write-Warn "IMPORTANT: Your server might be serving from 'dist' folder."
Write-Warn "If files still don't appear, you may need to:"
Write-Host "  1. Run: npm run build (on server or locally and copy dist)"
Write-Host "  2. OR: Update server.js to serve from 'public' folder"
Write-Host ""
Write-Info "To check what the server is serving, run:"
Write-Host "  ssh $Server 'ls -la $RemotePath/dist/public/js/ 2>/dev/null || ls -la $RemotePath/public/js/'" -ForegroundColor Yellow
Write-Host ""
Write-Info "After deployment, restart your server:"
Write-Host "  ssh $Server 'pm2 restart flipnosis-app'" -ForegroundColor Yellow

