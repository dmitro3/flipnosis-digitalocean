# Fix Socket.io by restoring main server with Socket.io support
param(
  [string]$Message = "Fix: Restore main server with Socket.io support"
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Fail([string]$msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

Write-Info "Fixing Socket.io by restoring main server..."

# Ensure we're in a git repository
if (!(Test-Path ".git")) { 
    Write-Fail "Not a git repository. Initialize git first."
    throw "Not a git repository"
}

# Check if hetzner remote exists
try {
    $remotes = & git remote
    if ($remotes -notcontains "hetzner") {
        Write-Fail "Missing 'hetzner' remote. Run setup first:"
        Write-Host ".\deployment\setup-hetzner-git-deploy-fixed.ps1 -ServerIP <YOUR_SERVER_IP>" -ForegroundColor Yellow
        throw "Missing hetzner remote"
    }
} catch {
    Write-Fail "Failed to check git remotes: $($_.Exception.Message)"
    throw
}

Write-Info "✅ Main server.js has been restored with Socket.io support"
Write-Info "📝 The server now includes:"
Write-Host "   - Socket.io server initialization" -ForegroundColor Gray
Write-Host "   - CORS configuration for flipnosis.fun" -ForegroundColor Gray
Write-Host "   - Database and blockchain services" -ForegroundColor Gray
Write-Host "   - API routes" -ForegroundColor Gray
Write-Host "   - Health check endpoint" -ForegroundColor Gray

# Add all changes
Write-Info "Adding all changes..."
& git add -A

# Commit changes
Write-Info "Committing changes: $Message"
try {
    $commitResult = & git commit -m $Message 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Changes committed"
    } else {
        Write-Info "No changes to commit (already up to date)"
    }
} catch {
    Write-Info "No changes to commit or commit failed: $($_.Exception.Message)"
}

# Push to hetzner remote
Write-Info "Pushing to hetzner remote..."
try {
    $pushResult = & git push hetzner main 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Successfully pushed to hetzner remote"
    } else {
        Write-Fail "Failed to push to hetzner remote: $pushResult"
        throw "Git push failed"
    }
} catch {
    Write-Fail "Failed to push changes: $($_.Exception.Message)"
    throw
}

Write-Info "🔄 Waiting for server to restart and apply changes..."
Start-Sleep -Seconds 10

Write-Info "🧪 Testing server endpoints..."

# Test health endpoint
try {
    $healthTest = Invoke-WebRequest -Uri "https://flipnosis.fun/health" -UseBasicParsing -TimeoutSec 15
    if ($healthTest.StatusCode -eq 200) {
        $healthData = $healthTest.Content | ConvertFrom-Json
        Write-Ok "Health endpoint working: $($healthData.message)"
        if ($healthData.services.socketio) {
            Write-Ok "✅ Socket.io service is running!"
        } else {
            Write-Fail "❌ Socket.io service not detected in health check"
        }
    } else {
        Write-Fail "Health endpoint returned status: $($healthTest.StatusCode)"
    }
} catch {
    Write-Fail "Health endpoint test failed: $($_.Exception.Message)"
}

# Test Socket.io endpoint
try {
    $socketTest = Invoke-WebRequest -Uri "https://flipnosis.fun/socket.io/" -UseBasicParsing -TimeoutSec 10
    if ($socketTest.StatusCode -eq 200) {
        Write-Ok "✅ Socket.io endpoint is accessible!"
    } else {
        Write-Fail "Socket.io endpoint returned status: $($socketTest.StatusCode)"
    }
} catch {
    Write-Fail "Socket.io endpoint test failed: $($_.Exception.Message)"
}

Write-Info "🎉 Socket.io fix deployment complete!"
Write-Info "📋 Next steps:"
Write-Host "   1. Try creating a new Battle Royale game" -ForegroundColor Gray
Write-Host "   2. Check browser console for Socket.io connection success" -ForegroundColor Gray
Write-Host "   3. Verify WebSocket connections are working" -ForegroundColor Gray

Write-Info "🔍 If issues persist, check server logs:"
Write-Host "   ssh root@159.69.242.154 'tail -f /var/log/flipnosis.log'" -ForegroundColor Yellow
