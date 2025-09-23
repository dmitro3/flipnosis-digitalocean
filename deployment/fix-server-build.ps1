# Fix server build process to use correct build command
# Usage: .\deployment\fix-server-build.ps1 -ServerIP 159.69.242.154

param(
  [Parameter(Mandatory = $true)][string]$ServerIP,
  [string]$ServerUser = "root"
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Fail([string]$msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

Write-Info "Fixing server build process on $ServerUser@$ServerIP"

# Create updated post-receive hook
$postReceiveScript = @"
#!/usr/bin/env bash
set -euo pipefail

echo "Post-receive hook triggered at `$(date)"

REPO_DIR="/opt/flipnosis/repo.git"
APP_DIR="/opt/flipnosis/app"
SHARED_DIR="/opt/flipnosis/shared"

# Read refs from stdin
while read oldrev newrev refname; do
    branch="`${refname#refs/heads/}"
    echo "Deploying branch: `$branch"
done

# Use main branch as default
if [ -z "`${branch:-}" ]; then
    branch="main"
fi

echo "Checking out code to `$APP_DIR..."
GIT_DIR="`$REPO_DIR" GIT_WORK_TREE="`$APP_DIR" git checkout -f "`$branch" || {
    echo "Checkout failed, trying without branch specification..."
    GIT_DIR="`$REPO_DIR" GIT_WORK_TREE="`$APP_DIR" git checkout -f
}

cd "`$APP_DIR"

# Link environment file
if [ -f "`$SHARED_DIR/.env" ]; then
    echo "Linking environment file..."
    ln -sf "`$SHARED_DIR/.env" .env
fi

# Install dependencies and build
echo "Installing dependencies..."
if command -v npm >/dev/null 2>&1; then
    if [ -f package-lock.json ]; then
        npm ci
    else
        npm install
    fi
    
    # Use build:production instead of just build
    if grep -q '"build:production"' package.json; then
        echo "Building application with production build..."
        npm run build:production || echo "Production build failed, trying regular build..." && npm run build
    elif grep -q '"build"' package.json; then
        echo "Building application..."
        npm run build || echo "Build failed, continuing..."
    fi
fi

# Restart application
echo "Restarting application..."
if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl restart flipnosis-app || echo "Failed to restart via systemctl"
    sudo systemctl status flipnosis-app --no-pager -l | head -20
else
    echo "Systemctl not available, trying PM2..."
    if command -v pm2 >/dev/null 2>&1; then
        pm2 restart flipnosis || pm2 start server/server.js --name flipnosis
    else
        echo "Using nohup fallback..."
        pkill -f "node server/server.js" || true
        sleep 2
        nohup node server/server.js > /opt/flipnosis/app/server.log 2>&1 &
    fi
fi

echo "Post-receive hook completed at `$(date)"
"@

# Upload updated post-receive hook
$tempHook = [System.IO.Path]::GetTempFileName()
$postReceiveScript | Out-File -FilePath $tempHook -Encoding UTF8

try {
    $hookTarget = "${ServerUser}@${ServerIP}:/tmp/post-receive"
    & scp $tempHook $hookTarget
    & ssh "${ServerUser}@${ServerIP}" "mv /tmp/post-receive /opt/flipnosis/repo.git/hooks/post-receive && chmod +x /opt/flipnosis/repo.git/hooks/post-receive"
    Write-Ok "Updated post-receive hook installed"
} finally {
    Remove-Item $tempHook -Force
}

Write-Ok "Server build process fixed!"
Write-Host ""
Write-Host "Now redeploy with: .\deployment\deploy-hetzner-git-fixed.ps1 `"Fixed build process`"" -ForegroundColor Yellow
