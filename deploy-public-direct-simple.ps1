# Simple Direct Upload - Upload entire public folder to server
# This bypasses git and builds - just uploads files directly
# Usage: .\deploy-public-direct-simple.ps1

param(
    [string]$Server = "root@159.69.242.154",
    [string]$RemotePath = "/opt/flipnosis/app"
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Fail([string]$msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

Write-Info "================================================"
Write-Info "Direct Public Folder Upload to Hetzner"
Write-Info "================================================"
Write-Host "Server: $Server" -ForegroundColor Yellow
Write-Host "Remote: $RemotePath/public" -ForegroundColor Yellow
Write-Host ""

# Check if public folder exists
if (-not (Test-Path "public")) {
    Write-Fail "public folder not found in current directory"
    throw "public folder missing"
}

# Create backup on server
Write-Info "Creating backup on server..."
ssh $Server "cd $RemotePath && mkdir -p backups && cp -r public backups/public.backup.`$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo 'No existing public folder to backup'" | Out-Null
Write-Ok "Backup created"

# Upload entire public folder
Write-Info "Uploading public folder (this may take a moment)..."
Write-Host ""

# Use rsync if available, otherwise use scp
$useRsync = $false
try {
    $rsyncCheck = & rsync --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $useRsync = $true
        Write-Info "Using rsync for faster upload..."
        rsync -avz --delete --exclude='.git' public/ "${Server}:${RemotePath}/public/"
        if ($LASTEXITCODE -eq 0) {
            Write-Ok "Upload complete via rsync"
        } else {
            Write-Warn "rsync failed, trying scp..."
            $useRsync = $false
        }
    }
} catch {
    Write-Info "rsync not available, using scp..."
}

if (-not $useRsync) {
    # Use scp to upload entire folder
    scp -r public/* "${Server}:${RemotePath}/public/"
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Upload complete via scp"
    } else {
        Write-Fail "Upload failed"
        throw "Upload failed with exit code: $LASTEXITCODE"
    }
}

# Set proper permissions
Write-Info "Setting file permissions..."
ssh $Server "cd $RemotePath/public && find . -type f -exec chmod 644 {} \; && find . -type d -exec chmod 755 {} \;" | Out-Null
Write-Ok "Permissions set"

# Verify upload
Write-Info "Verifying upload..."
$fileCount = ssh $Server "find $RemotePath/public -type f | wc -l"
Write-Ok "Uploaded $fileCount files"

Write-Host ""
Write-Ok "================================================"
Write-Ok "Upload Complete!"
Write-Ok "================================================"
Write-Host ""
Write-Info "Files are now on the server at: $RemotePath/public"
Write-Host ""
Write-Warn "NOTE: If you're still seeing old files, it might be browser cache."
Write-Warn "Try: Ctrl+Shift+R (hard refresh) or clear browser cache"
Write-Host ""
Write-Info "To restart the server (if needed):"
Write-Host "  ssh $Server 'pm2 restart flipnosis-app'" -ForegroundColor Yellow
Write-Host ""

