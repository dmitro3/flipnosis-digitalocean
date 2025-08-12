# Check service, logs, and health on Hetzner server
# Usage: .\deployment\check-hetzner-status-fixed.ps1 -ServerIP 159.69.242.154 -ServerUser root

param(
  [Parameter(Mandatory = $true)][string]$ServerIP,
  [string]$ServerUser = "root"
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Fail([string]$msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

Write-Info "Checking status on $ServerUser@$ServerIP"

# Check systemd service status
Write-Info "=== Systemd Service Status ==="
try {
    $serviceStatus = & ssh "$ServerUser@$ServerIP" "systemctl status flipnosis-app --no-pager -l" 2>&1
    Write-Host $serviceStatus
} catch {
    Write-Warn "Failed to get systemd status: $($_.Exception.Message)"
}

Write-Host ""

# Check recent logs
Write-Info "=== Recent Application Logs ==="
try {
    $logs = & ssh "$ServerUser@$ServerIP" "journalctl -u flipnosis-app -n 50 --no-pager" 2>&1
    Write-Host $logs
} catch {
    Write-Warn "Failed to get service logs: $($_.Exception.Message)"
}

Write-Host ""

# Check running processes
Write-Info "=== Node.js Processes ==="
try {
    $processes = & ssh "$ServerUser@$ServerIP" "ps aux | grep node | grep -v grep" 2>&1
    if ($processes) {
        Write-Host $processes
    } else {
        Write-Warn "No Node.js processes found"
    }
} catch {
    Write-Warn "Failed to check processes: $($_.Exception.Message)"
}

Write-Host ""

# Check nginx status
Write-Info "=== Nginx Status ==="
try {
    $nginxStatus = & ssh "$ServerUser@$ServerIP" "systemctl status nginx --no-pager -l | head -20" 2>&1
    Write-Host $nginxStatus
} catch {
    Write-Warn "Failed to get nginx status: $($_.Exception.Message)"
}

Write-Host ""

# Check disk space
Write-Info "=== Disk Space ==="
try {
    $diskSpace = & ssh "$ServerUser@$ServerIP" "df -h /opt/flipnosis" 2>&1
    Write-Host $diskSpace
} catch {
    Write-Warn "Failed to check disk space: $($_.Exception.Message)"
}

Write-Host ""

# Check environment file exists
Write-Info "=== Environment Configuration ==="
try {
    $envCheck = & ssh "$ServerUser@$ServerIP" "ls -la /opt/flipnosis/shared/.env 2>/dev/null && echo 'Environment file exists' || echo 'Environment file missing'"
    Write-Host $envCheck
} catch {
    Write-Warn "Failed to check environment file: $($_.Exception.Message)"
}

Write-Host ""

# Health checks
Write-Info "=== Health Checks ==="

# HTTP health check
try {
    $httpResponse = Invoke-WebRequest -Uri "http://$ServerIP/health" -UseBasicParsing -TimeoutSec 10
    Write-Ok "HTTP /health: $($httpResponse.StatusCode) - $($httpResponse.Content)"
} catch {
    Write-Warn "HTTP health check failed: $($_.Exception.Message)"
}

# HTTPS health check
try {
    # Skip certificate validation for self-signed certificates
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
    $httpsResponse = Invoke-WebRequest -Uri "https://$ServerIP/health" -UseBasicParsing -TimeoutSec 10
    Write-Ok "HTTPS /health: $($httpsResponse.StatusCode) - $($httpsResponse.Content)"
} catch {
    Write-Warn "HTTPS health check failed: $($_.Exception.Message)"
}

# Main page check
try {
    $mainResponse = Invoke-WebRequest -Uri "https://$ServerIP/" -UseBasicParsing -TimeoutSec 10
    Write-Ok "HTTPS main page: $($mainResponse.StatusCode)"
} catch {
    Write-Warn "Main page check failed: $($_.Exception.Message)"
}

Write-Host ""
Write-Ok "Status check complete"

# Show quick summary
Write-Host ""
Write-Host "=== Quick Summary ===" -ForegroundColor Yellow
Write-Host "Server: $ServerUser@$ServerIP" -ForegroundColor Yellow
Write-Host "Application directory: /opt/flipnosis/app" -ForegroundColor Yellow
Write-Host "Git repository: /opt/flipnosis/repo.git" -ForegroundColor Yellow
Write-Host "Environment file: /opt/flipnosis/shared/.env" -ForegroundColor Yellow
Write-Host ""
Write-Host "To deploy: .\deployment\deploy-hetzner-git-fixed.ps1 'commit message'" -ForegroundColor Yellow
Write-Host "To view logs: ssh $ServerUser@$ServerIP 'journalctl -u flipnosis-app -f'" -ForegroundColor Yellow
