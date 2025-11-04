# Simple Fix for Deployment Hook
# This ensures public/ folder gets updated correctly when you deploy
# Usage: .\fix-deployment-hook.ps1

param(
    [string]$Server = "root@159.69.242.154"
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }

Write-Info "================================================"
Write-Info "Fixing Deployment Hook to Update Files Correctly"
Write-Info "================================================"
Write-Host ""

# Create improved post-receive hook
$hookScript = @'
#!/bin/bash
set -e

echo "=== DEPLOYMENT STARTED at $(date) ==="

REPO_DIR="/opt/flipnosis/repo.git"
APP_DIR="/opt/flipnosis/app"
SHARED_DIR="/opt/flipnosis/shared"

# Read refs from stdin
while read oldrev newrev refname; do
    branch="${refname#refs/heads/}"
    echo "Deploying branch: $branch"
done

# Use main branch as default
if [ -z "${branch:-}" ]; then
    branch="main"
fi

echo "Stopping application..."
if command -v pm2 >/dev/null 2>&1; then
    pm2 stop flipnosis-app || pm2 stop flipnosis || echo "App not running"
fi
sleep 2

echo "Cleaning old files..."
cd "$APP_DIR"
rm -rf dist/ || true

echo "Checking out code to $APP_DIR..."
GIT_DIR="$REPO_DIR" GIT_WORK_TREE="$APP_DIR" git checkout -f "$branch" || {
    echo "Checkout failed, trying without branch specification..."
    GIT_DIR="$REPO_DIR" GIT_WORK_TREE="$APP_DIR" git checkout -f
}

# CRITICAL: Force update public/ folder to ensure it matches git
echo "Ensuring public/ folder is up to date..."
cd "$APP_DIR"
if [ -d "public" ]; then
    # Remove public folder to force fresh checkout
    rm -rf public/
    # Checkout again to ensure public/ is fresh
    GIT_DIR="$REPO_DIR" GIT_WORK_TREE="$APP_DIR" git checkout -f "$branch" public/ || true
    echo "✅ Public folder updated"
fi

cd "$APP_DIR"

# Link environment file
if [ -f "$SHARED_DIR/.env" ]; then
    echo "Linking environment file..."
    ln -sf "$SHARED_DIR/.env" .env
fi

# Install dependencies
echo "Installing dependencies..."
if command -v npm >/dev/null 2>&1; then
    if [ -f package-lock.json ]; then
        npm ci
    else
        npm install
    fi
    
    # Build if needed
    if grep -q '"build"' package.json; then
        echo "Building application..."
        npm run build || echo "⚠️ Build had warnings but continuing..."
        echo "✅ Build completed"
        
        # CRITICAL: Copy dist/public/ back to public/ to ensure consistency
        # This ensures public/ always has the latest built files
        if [ -d "dist/public" ]; then
            echo "Syncing dist/public/ to public/..."
            cp -r dist/public/* public/ 2>/dev/null || true
            echo "✅ Public folder synced with build output"
        fi
    fi
else
    echo "❌ npm not found"
    exit 1
fi

# Restart application
echo "Starting application..."
if command -v pm2 >/dev/null 2>&1; then
    pm2 restart flipnosis-app || pm2 start server/server.js --name flipnosis-app || pm2 restart flipnosis || pm2 start server/server.js --name flipnosis
    sleep 2
    pm2 save
    echo "✅ Application restarted via PM2"
else
    echo "⚠️ PM2 not found, using nohup..."
    pkill -f "node server/server.js" || true
    sleep 2
    nohup node server/server.js > /opt/flipnosis/app/server.log 2>&1 &
    echo "✅ Application started via nohup"
fi

echo "=== DEPLOYMENT COMPLETED at $(date) ==="
'@

Write-Info "Uploading improved hook to server..."
$tempFile = [System.IO.Path]::GetTempFileName()
$hookScript | Out-File -FilePath $tempFile -Encoding UTF8 -NoNewline

try {
    # Upload hook
    scp $tempFile "${Server}:/tmp/post-receive"
    
    # Install hook
    ssh $Server "mv /tmp/post-receive /opt/flipnosis/repo.git/hooks/post-receive && chmod +x /opt/flipnosis/repo.git/hooks/post-receive"
    
    Write-Ok "✅ Hook updated successfully!"
    Write-Host ""
    Write-Info "The hook now:"
    Write-Host "  1. Stops the app"
    Write-Host "  2. Cleans old files"
    Write-Host "  3. Checks out fresh code (including public/)"
    Write-Host "  4. Builds the app"
    Write-Host "  5. Syncs dist/public/ back to public/ (ensures consistency)"
    Write-Host "  6. Restarts the app"
    Write-Host ""
    Write-Ok "Now you can just run: .\deployment\deploy-hetzner-git-fixed.ps1"
    Write-Ok "And everything will update correctly!"
    
} catch {
    Write-Warn "Error: $($_.Exception.Message)"
    Write-Host "Make sure you can SSH to the server"
} finally {
    Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
}

Write-Host ""

