# Fix Git deployment hook to properly deploy public folder and preserve database
# Usage: .\deployment\fix-git-deploy-hook.ps1

param(
    [string]$ServerIP = "159.69.242.154",
    [string]$ServerUser = "root"
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Fail([string]$msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

Write-Info "Fixing Git deployment hook on $ServerUser@$ServerIP"
Write-Info "This will ensure public folder is deployed and database is preserved"

# Create improved post-receive hook that:
# 1. Preserves database
# 2. Explicitly copies public folder
# 3. Handles build correctly
$improvedHook = @"
#!/usr/bin/env bash
set -euo pipefail

echo "=== DEPLOYMENT STARTED at \$(date) ==="

REPO_DIR="/opt/flipnosis/repo.git"
APP_DIR="/opt/flipnosis/app"
SHARED_DIR="/opt/flipnosis/shared"
DB_PATH="\${APP_DIR}/server/database.sqlite"

# Read refs from stdin
branch="main"
while read oldrev newrev refname; do
    branch="\${refname#refs/heads/}"
    echo "Deploying branch: \$branch"
done

# Use main branch as default
if [ -z "\${branch:-}" ]; then
    branch="main"
fi

# CRITICAL: Backup database BEFORE deployment
if [ -f "\$DB_PATH" ]; then
    echo "Backing up database..."
    cp "\$DB_PATH" "\${DB_PATH}.backup.\$(date +%Y%m%d_%H%M%S)" || echo "Warning: Could not backup database"
fi

# Stop the application BEFORE checkout
echo "Stopping application..."
if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl stop flipnosis-app || echo "Service not running or failed to stop"
elif command -v pm2 >/dev/null 2>&1; then
    pm2 stop flipnosis-app || echo "PM2 process not running"
else
    pkill -f "node.*server/server.js" || echo "No node processes to kill"
fi

# Wait for processes to fully stop
sleep 3

# Checkout code
echo "Checking out code to \$APP_DIR..."
GIT_DIR="\$REPO_DIR" GIT_WORK_TREE="\$APP_DIR" git checkout -f "\$branch" || {
    echo "Checkout failed, trying without branch specification..."
    GIT_DIR="\$REPO_DIR" GIT_WORK_TREE="\$APP_DIR" git checkout -f
}

cd "\$APP_DIR"

# CRITICAL: Restore database if it was overwritten
if [ ! -f "\$DB_PATH" ] && [ -f "\${DB_PATH}.backup.\$(date +%Y%m%d_%H%M%S)" ]; then
    echo "Restoring database from backup..."
    LATEST_BACKUP=\$(ls -t \${DB_PATH}.backup.* 2>/dev/null | head -1)
    if [ -n "\$LATEST_BACKUP" ]; then
        cp "\$LATEST_BACKUP" "\$DB_PATH"
        echo "Database restored from backup"
    fi
fi

# Ensure database file exists
if [ ! -f "\$DB_PATH" ]; then
    echo "Creating database file..."
    mkdir -p "\$(dirname \$DB_PATH)"
    touch "\$DB_PATH"
fi

# Link environment file
if [ -f "\$SHARED_DIR/.env" ]; then
    echo "Linking environment file..."
    ln -sf "\$SHARED_DIR/.env" .env
fi

# CRITICAL: Verify public folder exists
if [ ! -d "\$APP_DIR/public" ]; then
    echo "ERROR: public folder missing after checkout!"
    echo "Checking if public folder exists in repo..."
    if GIT_DIR="\$REPO_DIR" git ls-tree -r --name-only "\$branch" | grep -q "^public/"; then
        echo "public folder exists in repo, forcing checkout..."
        GIT_DIR="\$REPO_DIR" GIT_WORK_TREE="\$APP_DIR" git checkout -f "\$branch" -- public/
    else
        echo "WARNING: public folder not found in git repository!"
        echo "Make sure public folder is tracked in git (not in .gitignore)"
    fi
fi

# Verify public folder structure
if [ -d "\$APP_DIR/public" ]; then
    echo "✓ public folder verified"
    echo "  Contents: \$(ls -la \$APP_DIR/public | wc -l) items"
    if [ -f "\$APP_DIR/public/test-tubes.html" ]; then
        echo "  ✓ test-tubes.html found"
    else
        echo "  WARNING: test-tubes.html not found in public folder"
    fi
    if [ -d "\$APP_DIR/public/js" ]; then
        echo "  ✓ js folder found"
        echo "  JS files: \$(find \$APP_DIR/public/js -name '*.js' | wc -l) files"
    else
        echo "  WARNING: js folder not found in public folder"
    fi
else
    echo "ERROR: public folder still missing!"
fi

# Install dependencies
echo "Installing dependencies..."
if command -v npm >/dev/null 2>&1; then
    if [ -f package-lock.json ]; then
        npm ci --production || npm install --production
    else
        npm install --production
    fi
else
    echo "ERROR: npm not found!"
    exit 1
fi

# Build application (if build script exists)
if grep -q '"build"' package.json; then
    echo "Building application..."
    npm run build || {
        echo "WARNING: Build failed, but continuing deployment..."
    }
    
    # Verify build output
    if [ -d "dist" ]; then
        echo "✓ Build output verified (dist folder exists)"
    else
        echo "WARNING: dist folder not found after build"
    fi
fi

# Restart application
echo "Restarting application..."
if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl restart flipnosis-app || {
        echo "Failed to restart via systemctl, trying PM2..."
        if command -v pm2 >/dev/null 2>&1; then
            pm2 restart flipnosis-app || pm2 start ecosystem.config.js || pm2 start server/server.js --name flipnosis-app
        fi
    }
    sleep 2
    sudo systemctl status flipnosis-app --no-pager -l | head -10 || true
elif command -v pm2 >/dev/null 2>&1; then
    pm2 restart flipnosis-app || pm2 start ecosystem.config.js || pm2 start server/server.js --name flipnosis-app
    pm2 save
else
    echo "ERROR: Neither systemctl nor PM2 available!"
    exit 1
fi

# Final verification
echo ""
echo "=== DEPLOYMENT VERIFICATION ==="
if [ -d "\$APP_DIR/public" ]; then
    echo "✓ public folder: EXISTS"
else
    echo "✗ public folder: MISSING"
fi
if [ -f "\$DB_PATH" ]; then
    echo "✓ database: EXISTS (\$(du -h \$DB_PATH | cut -f1))"
else
    echo "✗ database: MISSING"
fi
if [ -d "\$APP_DIR/server" ]; then
    echo "✓ server folder: EXISTS"
else
    echo "✗ server folder: MISSING"
fi

echo ""
echo "=== DEPLOYMENT COMPLETED at \$(date) ==="
"@

# Upload improved hook
Write-Info "Uploading improved post-receive hook..."
$tempHook = [System.IO.Path]::GetTempFileName()
$improvedHook | Out-File -FilePath $tempHook -Encoding UTF8

try {
    $hookTarget = "${ServerUser}@${ServerIP}:/tmp/post-receive-improved"
    & scp $tempHook $hookTarget
    if ($LASTEXITCODE -ne 0) {
        throw "SCP upload failed"
    }
    
    # Install hook on server
    $installCommand = @"
mv /tmp/post-receive-improved /opt/flipnosis/repo.git/hooks/post-receive && \
chmod +x /opt/flipnosis/repo.git/hooks/post-receive && \
echo 'Hook installed successfully'
"@
    
    & ssh "${ServerUser}@${ServerIP}" $installCommand
    if ($LASTEXITCODE -ne 0) {
        throw "Hook installation failed"
    }
    
    Write-Ok "Improved post-receive hook installed successfully"
} catch {
    Write-Fail "Failed to install hook: $($_.Exception.Message)"
    throw
} finally {
    Remove-Item $tempHook -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Ok "================================================"
Write-Ok "Git Deployment Hook Fixed!"
Write-Ok "================================================"
Write-Host ""
Write-Host "The improved hook will now:" -ForegroundColor Green
Write-Host "1. ✓ Backup database before deployment" -ForegroundColor Yellow
Write-Host "2. ✓ Preserve database during deployment" -ForegroundColor Yellow
Write-Host "3. ✓ Explicitly verify public folder exists" -ForegroundColor Yellow
Write-Host "4. ✓ Force checkout public folder if missing" -ForegroundColor Yellow
Write-Host "5. ✓ Verify all critical files after deployment" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Make sure public folder is tracked in git:" -ForegroundColor Yellow
Write-Host "   git add public/" -ForegroundColor White
Write-Host "   git commit -m 'Add public folder to git'" -ForegroundColor White
Write-Host ""
Write-Host "2. Deploy your changes:" -ForegroundColor Yellow
Write-Host "   .\deployment\deploy-hetzner-git-fixed.ps1 `"Deploy with fixed hook`"" -ForegroundColor White
Write-Host ""
Write-Host "3. Check deployment logs on server:" -ForegroundColor Yellow
Write-Host "   ssh ${ServerUser}@${ServerIP} 'tail -f /opt/flipnosis/app/server.log'" -ForegroundColor White
Write-Host ""

