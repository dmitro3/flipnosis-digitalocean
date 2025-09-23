# Simple Fix for Deployment Issues
# This script creates a working post-receive hook

param(
  [Parameter(Mandatory = $true)][string]$ServerIP,
  [string]$ServerUser = "root"
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Fail([string]$msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

Write-Info "Fixing deployment issues on $ServerUser@$ServerIP"

# Create a simple, working post-receive hook
$simplePostReceiveScript = @'
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

echo "Checking out code to $APP_DIR..."
GIT_DIR="$REPO_DIR" GIT_WORK_TREE="$APP_DIR" git checkout -f "$branch" || {
    echo "Checkout failed, trying without branch specification..."
    GIT_DIR="$REPO_DIR" GIT_WORK_TREE="$APP_DIR" git checkout -f
}

cd "$APP_DIR"

# Link environment file
if [ -f "$SHARED_DIR/.env" ]; then
    echo "Linking environment file..."
    ln -sf "$SHARED_DIR/.env" .env
fi

# CRITICAL: Stop the application BEFORE building
echo "Stopping application before build..."
if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl stop flipnosis-app || echo "Service not running or failed to stop"
elif command -v pm2 >/dev/null 2>&1; then
    pm2 stop flipnosis || echo "PM2 process not running"
else
    pkill -f "node server/server.js" || echo "No node processes to kill"
fi

# Wait for processes to fully stop
sleep 3

# Clean previous build
echo "Cleaning previous build..."
rm -rf dist/ || echo "No dist directory to clean"

# Install dependencies
echo "Installing dependencies..."
if command -v npm >/dev/null 2>&1; then
    if [ -f package-lock.json ]; then
        npm ci --production
    else
        npm install --production
    fi
    
    # CRITICAL: Build MUST succeed or deployment fails
    if grep -q '"build"' package.json; then
        echo "Building application..."
        if ! npm run build; then
            echo "❌ BUILD FAILED - DEPLOYMENT ABORTED"
            exit 1
        fi
        echo "✅ Build completed successfully"
    fi
else
    echo "❌ npm not found - DEPLOYMENT ABORTED"
    exit 1
fi

# Verify build output exists
if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
    echo "❌ Build output missing or empty - DEPLOYMENT ABORTED"
    exit 1
fi

# Restart application
echo "Starting application..."
if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl start flipnosis-app
    sleep 2
    if sudo systemctl is-active --quiet flipnosis-app; then
        echo "✅ Application started via systemctl"
    else
        echo "❌ Failed to start via systemctl"
        sudo systemctl status flipnosis-app --no-pager -l
        exit 1
    fi
elif command -v pm2 >/dev/null 2>&1; then
    pm2 start server/server.js --name flipnosis
    sleep 2
    if pm2 list | grep -q "flipnosis.*online"; then
        echo "✅ Application started via PM2"
    else
        echo "❌ Failed to start via PM2"
        pm2 logs flipnosis --lines 20
        exit 1
    fi
else
    echo "Starting application via nohup..."
    nohup node server/server.js > /opt/flipnosis/app/server.log 2>&1 &
    sleep 3
    if pgrep -f "node server/server.js" > /dev/null; then
        echo "✅ Application started via nohup"
    else
        echo "❌ Failed to start via nohup"
        exit 1
    fi
fi

# Health check
echo "Performing health check..."
sleep 5
if curl -f -s http://localhost:3001/health > /dev/null; then
    echo "✅ Health check passed"
else
    echo "⚠️ Health check failed - application may not be responding"
fi

echo "=== DEPLOYMENT COMPLETED at $(date) ==="
'@

# Upload the hook directly via SSH
Write-Info "Installing improved post-receive hook..."
$sshCommand = @"
cat > /opt/flipnosis/repo.git/hooks/post-receive << 'HOOK_EOF'
$simplePostReceiveScript
HOOK_EOF
chmod +x /opt/flipnosis/repo.git/hooks/post-receive
echo "Post-receive hook installed successfully"
"@

try {
    & ssh "${ServerUser}@${ServerIP}" $sshCommand
    Write-Ok "Improved post-receive hook installed"
} catch {
    Write-Fail "Failed to install post-receive hook: $($_.Exception.Message)"
    throw
}

Write-Host ""
Write-Host "✅ Deployment fix applied! The improved hook will:" -ForegroundColor Green
Write-Host "1. Stop the application before building" -ForegroundColor Yellow
Write-Host "2. Clean previous build artifacts" -ForegroundColor Yellow
Write-Host "3. Fail deployment if build fails" -ForegroundColor Yellow
Write-Host "4. Verify build output exists" -ForegroundColor Yellow
Write-Host "5. Perform health checks" -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 Next deployment should work correctly!" -ForegroundColor Green
Write-Host ""
Write-Host "To test it, make a small change and run:" -ForegroundColor Cyan
Write-Host ".\deployment\deploy-hetzner-git-fixed.ps1 `"Test deployment fix`"" -ForegroundColor Cyan
