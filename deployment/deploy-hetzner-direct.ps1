# Direct deployment to Hetzner server - bypasses git
# Usage: .\deployment\deploy-hetzner-direct.ps1 "Your commit message"

param(
  [string]$Message = "Direct deployment $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
)

$ErrorActionPreference = "Stop"

$ServerIP = "159.69.242.154"
$ServerUser = "root"
$RemoteAppDir = "/opt/flipnosis/app"
$RemoteServerDir = "$RemoteAppDir/server"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Fail([string]$msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }
function Write-Warn([string]$msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }

Write-Info "================================================"
Write-Info "Direct Deployment to Hetzner Server"
Write-Info "================================================"
Write-Host "Server: $ServerUser@$ServerIP" -ForegroundColor Yellow
Write-Host "Target: $RemoteAppDir" -ForegroundColor Yellow
Write-Host ""

# Step 1: Build locally
Write-Info "Step 1: Building application locally..."
if (!(Test-Path "package.json")) {
    Write-Fail "package.json not found. Are you in the project root?"
    throw "Not in project root"
}

try {
    Write-Info "Installing dependencies..."
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "npm install failed"
        throw "Build failed"
    }

    Write-Info "Building application..."
    & npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "npm run build failed"
        throw "Build failed"
    }
    Write-Ok "Build completed successfully"
} catch {
    Write-Fail "Build step failed: $($_.Exception.Message)"
    throw
}

# Step 2: Create deployment package
Write-Info "Step 2: Creating deployment package..."
$deployDir = "deploy-temp-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
if (Test-Path $deployDir) {
    Remove-Item $deployDir -Recurse -Force
}
New-Item -ItemType Directory -Path $deployDir -Force | Out-Null

Write-Info "Copying files to deployment package..."

# Copy dist folder
if (Test-Path "dist") {
    Copy-Item -Path "dist" -Destination "$deployDir/dist" -Recurse -Force
    Write-Ok "✓ Copied dist folder"
} else {
    Write-Fail "dist folder not found. Build must have failed."
    throw "dist folder missing"
}

# Copy server folder
if (Test-Path "server") {
    Copy-Item -Path "server" -Destination "$deployDir/server" -Recurse -Force
    Write-Ok "✓ Copied server folder"
} else {
    Write-Fail "server folder not found"
    throw "server folder missing"
}

# Copy public folder (important!)
if (Test-Path "public") {
    Copy-Item -Path "public" -Destination "$deployDir/public" -Recurse -Force
    Write-Ok "✓ Copied public folder"
} else {
    Write-Warn "public folder not found (may be in dist/public)"
}

# Copy package files
Copy-Item -Path "package.json" -Destination "$deployDir/" -Force
Copy-Item -Path "package-lock.json" -Destination "$deployDir/" -Force -ErrorAction SilentlyContinue
Copy-Item -Path "ecosystem.config.js" -Destination "$deployDir/" -Force -ErrorAction SilentlyContinue
Write-Ok "✓ Copied package files"

# Create tar.gz archive
Write-Info "Creating deployment archive..."
$archiveName = "$deployDir.tar.gz"
if (Test-Path $archiveName) {
    Remove-Item $archiveName -Force
}

# Use tar if available (Windows 10+), otherwise use 7zip or other
try {
    & tar -czf $archiveName -C $deployDir .
    if ($LASTEXITCODE -ne 0) {
        throw "tar failed"
    }
    Write-Ok "✓ Created deployment archive: $archiveName"
} catch {
    Write-Fail "Failed to create archive. Make sure tar is available (Windows 10+ includes tar)"
    Remove-Item $deployDir -Recurse -Force -ErrorAction SilentlyContinue
    throw
}

# Step 3: Upload to server
Write-Info "Step 3: Uploading to server..."
Write-Info "This may take a moment..."

try {
    scp $archiveName "${ServerUser}@${ServerIP}:/tmp/"
    if ($LASTEXITCODE -ne 0) {
        throw "SCP upload failed"
    }
    Write-Ok "✓ Uploaded to server"
} catch {
    Write-Fail "Failed to upload to server: $($_.Exception.Message)"
    Remove-Item $deployDir -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item $archiveName -Force -ErrorAction SilentlyContinue
    throw
}

# Step 4: Deploy on server
Write-Info "Step 4: Deploying on server..."
$deployScript = @"
set -e
echo "=== Starting deployment on server ==="

# Extract deployment package
cd /tmp
tar -xzf $archiveName -C $RemoteAppDir.tmp || {
    echo "Failed to extract archive"
    exit 1
}

# Stop the application
echo "Stopping application..."
pm2 stop flipnosis-app || echo "App not running or already stopped"
sleep 2

# Backup current deployment (except database)
echo "Creating backup..."
if [ -d "$RemoteAppDir" ]; then
    # Backup only non-critical files
    mkdir -p "$RemoteAppDir.backup.`$(date +%Y%m%d_%H%M%S)"
    cp -r "$RemoteAppDir/server" "$RemoteAppDir.backup.`$(date +%Y%m%d_%H%M%S)/" 2>/dev/null || true
    cp -r "$RemoteAppDir/dist" "$RemoteAppDir.backup.`$(date +%Y%m%d_%H%M%S)/" 2>/dev/null || true
fi

# Remove old files (but preserve database)
echo "Cleaning old files..."
cd "$RemoteAppDir"
if [ -d "dist" ]; then
    rm -rf dist
fi
if [ -d "public" ]; then
    rm -rf public
fi

# Copy new files
echo "Installing new files..."
cp -r "$RemoteAppDir.tmp/dist" "$RemoteAppDir/" || exit 1
cp -r "$RemoteAppDir.tmp/server" "$RemoteAppDir/" || exit 1
if [ -d "$RemoteAppDir.tmp/public" ]; then
    cp -r "$RemoteAppDir.tmp/public" "$RemoteAppDir/" || exit 1
fi
cp "$RemoteAppDir.tmp/package.json" "$RemoteAppDir/" || exit 1
if [ -f "$RemoteAppDir.tmp/package-lock.json" ]; then
    cp "$RemoteAppDir.tmp/package-lock.json" "$RemoteAppDir/" || exit 1
fi
if [ -f "$RemoteAppDir.tmp/ecosystem.config.js" ]; then
    cp "$RemoteAppDir.tmp/ecosystem.config.js" "$RemoteAppDir/" || exit 1
fi

# Clean up temp directory
rm -rf "$RemoteAppDir.tmp"

# Install dependencies
echo "Installing dependencies..."
cd "$RemoteAppDir"
npm install --production || {
    echo "npm install failed, trying with full install..."
    npm install || exit 1
}

# Ensure database directory exists
mkdir -p "$RemoteServerDir"
if [ ! -f "$RemoteServerDir/database.sqlite" ]; then
    echo "Creating database file if it doesn't exist..."
    touch "$RemoteServerDir/database.sqlite"
fi

# Link environment file if it exists
if [ -f "/opt/flipnosis/shared/.env" ]; then
    echo "Linking environment file..."
    ln -sf "/opt/flipnosis/shared/.env" "$RemoteAppDir/.env"
fi

# Start the application
echo "Starting application..."
cd "$RemoteAppDir"
pm2 restart flipnosis-app || pm2 start ecosystem.config.js || pm2 start server/server.js --name flipnosis-app
pm2 save

# Clean up uploaded archive
rm -f "/tmp/$archiveName"

echo "=== Deployment completed ==="
"@

try {
    $tempScript = [System.IO.Path]::GetTempFileName()
    $deployScript | Out-File -FilePath $tempScript -Encoding UTF8
    
    # Replace placeholder with actual archive name
    $deployScriptContent = Get-Content $tempScript -Raw
    $deployScriptContent = $deployScriptContent -replace '\$archiveName', $archiveName
    $deployScriptContent | Out-File -FilePath $tempScript -Encoding UTF8 -NoNewline
    
    scp $tempScript "${ServerUser}@${ServerIP}:/tmp/deploy-script.sh"
    ssh "${ServerUser}@${ServerIP}" "chmod +x /tmp/deploy-script.sh && /tmp/deploy-script.sh"
    
    if ($LASTEXITCODE -ne 0) {
        throw "Deployment script failed on server"
    }
    
    Write-Ok "✓ Deployment completed on server"
    Remove-Item $tempScript -Force -ErrorAction SilentlyContinue
} catch {
    Write-Fail "Failed to deploy on server: $($_.Exception.Message)"
    Write-Host "You may need to manually clean up: ssh ${ServerUser}@${ServerIP} 'rm -rf /tmp/$archiveName /tmp/deploy-script.sh $RemoteAppDir.tmp'" -ForegroundColor Yellow
    throw
}

# Step 5: Cleanup local files
Write-Info "Step 5: Cleaning up local files..."
Remove-Item $deployDir -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $archiveName -Force -ErrorAction SilentlyContinue
Write-Ok "✓ Cleanup completed"

# Step 6: Verify deployment
Write-Info "Step 6: Verifying deployment..."
Start-Sleep -Seconds 3

try {
    $pm2Status = ssh "${ServerUser}@${ServerIP}" "pm2 list | grep flipnosis-app"
    if ($pm2Status -match "online") {
        Write-Ok "✓ Application is running"
    } else {
        Write-Warn "Application status unclear: $pm2Status"
    }
} catch {
    Write-Warn "Could not verify PM2 status: $($_.Exception.Message)"
}

Write-Host ""
Write-Ok "================================================"
Write-Ok "Deployment Complete!"
Write-Ok "================================================"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check server logs: ssh ${ServerUser}@${ServerIP} 'pm2 logs flipnosis-app --lines 50'" -ForegroundColor Cyan
Write-Host "2. Restart if needed: ssh ${ServerUser}@${ServerIP} 'pm2 restart flipnosis-app'" -ForegroundColor Cyan
Write-Host "3. Check database path: ssh ${ServerUser}@${ServerIP} 'ls -la $RemoteServerDir/database.sqlite'" -ForegroundColor Cyan
Write-Host ""








