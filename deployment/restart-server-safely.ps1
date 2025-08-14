# Safe server restart script that handles port conflicts
# Usage: .\deployment\restart-server-safely.ps1

param(
    [string]$ServerIP = "159.69.242.154",
    [string]$ServerUser = "root"
)

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Fail([string]$msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

Write-Info "Starting safe server restart..."

# Step 1: Stop the service
Write-Info "Step 1: Stopping flipnosis-app service..."
try {
    ssh "$ServerUser@$ServerIP" "systemctl stop flipnosis-app"
    Write-Ok "Service stopped"
} catch {
    Write-Warn "Service stop failed (might not be running): $($_.Exception.Message)"
}

# Step 2: Kill any processes using ports 80 and 443
Write-Info "Step 2: Checking for processes using ports 80 and 443..."

# Kill processes on port 80
try {
    $port80Processes = ssh "$ServerUser@$ServerIP" "lsof -ti:80"
    if ($port80Processes) {
        Write-Warn "Found processes using port 80: $port80Processes"
        ssh "$ServerUser@$ServerIP" "kill -9 $port80Processes"
        Write-Ok "Killed processes on port 80"
    } else {
        Write-Ok "No processes using port 80"
    }
} catch {
    Write-Warn "No processes found on port 80"
}

# Kill processes on port 443
try {
    $port443Processes = ssh "$ServerUser@$ServerIP" "lsof -ti:443"
    if ($port443Processes) {
        Write-Warn "Found processes using port 443: $port443Processes"
        ssh "$ServerUser@$ServerIP" "kill -9 $port443Processes"
        Write-Ok "Killed processes on port 443"
    } else {
        Write-Ok "No processes using port 443"
    }
} catch {
    Write-Warn "No processes found on port 443"
}

# Step 3: Wait a moment for processes to fully terminate
Write-Info "Step 3: Waiting for processes to terminate..."
Start-Sleep -Seconds 3

# Step 4: Verify ports are free
Write-Info "Step 4: Verifying ports are free..."
try {
    $port80Check = ssh "$ServerUser@$ServerIP" "netstat -tlnp | grep :80 || echo 'Port 80 is free'"
    $port443Check = ssh "$ServerUser@$ServerIP" "netstat -tlnp | grep :443 || echo 'Port 443 is free'"
    
    Write-Ok "Port 80: $port80Check"
    Write-Ok "Port 443: $port443Check"
} catch {
    Write-Warn "Could not verify ports: $($_.Exception.Message)"
}

# Step 5: Start the service
Write-Info "Step 5: Starting flipnosis-app service..."
try {
    ssh "$ServerUser@$ServerIP" "systemctl start flipnosis-app"
    Write-Ok "Service started"
} catch {
    Write-Fail "Failed to start service: $($_.Exception.Message)"
    exit 1
}

# Step 6: Wait for service to stabilize
Write-Info "Step 6: Waiting for service to stabilize..."
Start-Sleep -Seconds 5

# Step 7: Check service status
Write-Info "Step 7: Checking service status..."
try {
    $status = ssh "$ServerUser@$ServerIP" "systemctl is-active flipnosis-app"
    if ($status -eq "active") {
        Write-Ok "Service is running successfully!"
    } else {
        Write-Fail "Service is not active: $status"
        exit 1
    }
} catch {
    Write-Fail "Could not check service status: $($_.Exception.Message)"
    exit 1
}

# Step 8: Test health endpoint
Write-Info "Step 8: Testing health endpoint..."
try {
    $response = Invoke-WebRequest -Uri "http://$ServerIP/health" -Method GET -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Ok "Health check passed: $($response.Content)"
    } else {
        Write-Warn "Health check returned status: $($response.StatusCode)"
    }
} catch {
    Write-Warn "Health check failed: $($_.Exception.Message)"
}

Write-Ok "Safe server restart completed!"
Write-Info "Server should now be running properly on $ServerIP"
