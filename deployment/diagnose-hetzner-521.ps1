# Diagnose Hetzner Server 521 Error
# This script helps identify the root cause of 521 errors

param(
    [string]$ServerIP = "159.69.242.154",
    [string]$ServerUser = "root"
)

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Fail([string]$msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

Write-Info "Diagnosing Hetzner server 521 error..."

# Check 1: Service status
Write-Info "1. Checking service status..."
try {
    $nginxStatus = ssh "$ServerUser@$ServerIP" "systemctl is-active nginx"
    $appStatus = ssh "$ServerUser@$ServerIP" "systemctl is-active flipnosis-app"
    Write-Info "Nginx: $nginxStatus"
    Write-Info "App service: $appStatus"
} catch {
    Write-Fail "Could not check service status: $($_.Exception.Message)"
}

# Check 2: Process status
Write-Info "2. Checking running processes..."
try {
    $nodeProcesses = ssh "$ServerUser@$ServerIP" "ps aux | grep node | grep -v grep"
    $nginxProcesses = ssh "$ServerUser@$ServerIP" "ps aux | grep nginx | grep -v grep"
    Write-Info "Node processes:"
    Write-Host $nodeProcesses -ForegroundColor Gray
    Write-Info "Nginx processes:"
    Write-Host $nginxProcesses -ForegroundColor Gray
} catch {
    Write-Fail "Could not check processes: $($_.Exception.Message)"
}

# Check 3: Port usage
Write-Info "3. Checking port usage..."
try {
    $port80 = ssh "$ServerUser@$ServerIP" "netstat -tlnp | grep :80 || echo 'Port 80 is free'"
    $port443 = ssh "$ServerUser@$ServerIP" "netstat -tlnp | grep :443 || echo 'Port 443 is free'"
    $port3000 = ssh "$ServerUser@$ServerIP" "netstat -tlnp | grep :3000 || echo 'Port 3000 is free'"
    Write-Info "Port 80: $port80"
    Write-Info "Port 443: $port443"
    Write-Info "Port 3000: $port3000"
} catch {
    Write-Fail "Could not check ports: $($_.Exception.Message)"
}

# Check 4: PM2 status
Write-Info "4. Checking PM2 status..."
try {
    $pm2Status = ssh "$ServerUser@$ServerIP" "pm2 status"
    Write-Info "PM2 status:"
    Write-Host $pm2Status -ForegroundColor Gray
} catch {
    Write-Warn "PM2 status check failed: $($_.Exception.Message)"
}

# Check 5: Application directory
Write-Info "5. Checking application directory..."
try {
    $appDir = ssh "$ServerUser@$ServerIP" "ls -la /root/flipnosis-digitalocean/ | head -5"
    Write-Info "App directory:"
    Write-Host $appDir -ForegroundColor Gray
    
    $serverExists = ssh "$ServerUser@$ServerIP" "test -f /root/flipnosis-digitalocean/server/server.js && echo 'EXISTS' || echo 'MISSING'"
    Write-Info "Server.js: $serverExists"
} catch {
    Write-Fail "Could not check app directory: $($_.Exception.Message)"
}

# Check 6: Local application test
Write-Info "6. Testing local application..."
try {
    $localTest = ssh "$ServerUser@$ServerIP" "curl -s http://localhost:3000/health || echo 'FAILED'"
    Write-Info "Local health check: $localTest"
} catch {
    Write-Fail "Local application test failed: $($_.Exception.Message)"
}

# Check 7: Nginx configuration
Write-Info "7. Checking nginx configuration..."
try {
    $nginxConfig = ssh "$ServerUser@$ServerIP" "nginx -t"
    Write-Info "Nginx config test: $nginxConfig"
} catch {
    Write-Warn "Nginx config test failed: $($_.Exception.Message)"
}

# Check 8: Recent logs
Write-Info "8. Checking recent logs..."
try {
    Write-Info "Nginx error log (last 5 lines):"
    $nginxErrors = ssh "$ServerUser@$ServerIP" "tail -n 5 /var/log/nginx/error.log"
    Write-Host $nginxErrors -ForegroundColor Gray
    
    Write-Info "PM2 logs (last 5 lines):"
    $pm2Logs = ssh "$ServerUser@$ServerIP" "pm2 logs flipnosis-app --lines 5 --nostream"
    Write-Host $pm2Logs -ForegroundColor Gray
} catch {
    Write-Warn "Log check failed: $($_.Exception.Message)"
}

# Check 9: External connectivity test
Write-Info "9. Testing external connectivity..."
try {
    $externalTest = Invoke-WebRequest -Uri "https://www.flipnosis.fun/health" -UseBasicParsing -TimeoutSec 10
    Write-Ok "External test passed: $($externalTest.StatusCode)"
} catch {
    Write-Fail "External test failed: $($_.Exception.Message)"
}

Write-Info "Diagnosis complete!"
Write-Host ""
Write-Host "Common 521 error causes and solutions:" -ForegroundColor Yellow
Write-Host "1. Application not running on port 3000 - Check PM2 status" -ForegroundColor Yellow
Write-Host "2. Nginx not running - Check nginx service status" -ForegroundColor Yellow
Write-Host "3. Port conflicts - Check port usage above" -ForegroundColor Yellow
Write-Host "4. Application crashed - Check PM2 logs" -ForegroundColor Yellow
Write-Host "5. Missing dependencies - Run npm install" -ForegroundColor Yellow


