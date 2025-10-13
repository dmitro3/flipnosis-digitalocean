# Debug Hetzner server deployment issues
param(
  [string]$ServerIP = ""
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Fail([string]$msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

Write-Info "Debugging Hetzner server deployment..."

# Get server IP from git remote if not provided
if (!$ServerIP) {
    try {
        $remoteUrl = & git remote get-url hetzner
        $ServerIP = (($remoteUrl -split '@')[1] -split ':')[0]
        Write-Info "Detected server IP from git remote: $ServerIP"
    } catch {
        Write-Fail "Could not detect server IP. Please provide it:"
        Write-Host ".\deployment\debug-hetzner-server.ps1 -ServerIP YOUR_SERVER_IP" -ForegroundColor Yellow
        return
    }
}

Write-Info "Testing server connectivity to $ServerIP..."

# Test basic connectivity
try {
    $pingResult = Test-Connection -ComputerName $ServerIP -Count 1 -Quiet
    if ($pingResult) {
        Write-Ok "Server is reachable"
    } else {
        Write-Fail "Server is not reachable"
        return
    }
} catch {
    Write-Fail "Cannot ping server: $($_.Exception.Message)"
    return
}

# Test SSH connectivity
Write-Info "Testing SSH connectivity..."
try {
    $sshTest = ssh -o ConnectTimeout=10 -o BatchMode=yes root@$ServerIP "echo 'SSH connection successful'" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "SSH connection successful"
    } else {
        Write-Fail "SSH connection failed: $sshTest"
        Write-Host "Make sure your SSH key is set up correctly" -ForegroundColor Yellow
        return
    }
} catch {
    Write-Fail "SSH test failed: $($_.Exception.Message)"
    return
}

# Check server status
Write-Info "Checking server status..."
try {
    $serverStatus = ssh root@$ServerIP "systemctl status flipnosis || systemctl status node || systemctl status pm2 || echo 'No service found'"
    Write-Host "Server status:" -ForegroundColor Yellow
    Write-Host $serverStatus -ForegroundColor Gray
} catch {
    Write-Fail "Could not check server status: $($_.Exception.Message)"
}

# Check if the app is running
Write-Info "Checking if application is running..."
try {
    $appStatus = ssh root@$ServerIP "ps aux | grep -E '(node|npm|flipnosis)' | grep -v grep || echo 'No Node.js processes found'"
    Write-Host "Application processes:" -ForegroundColor Yellow
    Write-Host $appStatus -ForegroundColor Gray
} catch {
    Write-Fail "Could not check application status: $($_.Exception.Message)"
}

# Check nginx status
Write-Info "Checking nginx status..."
try {
    $nginxStatus = ssh root@$ServerIP "systemctl status nginx"
    Write-Host "Nginx status:" -ForegroundColor Yellow
    Write-Host $nginxStatus -ForegroundColor Gray
} catch {
    Write-Fail "Could not check nginx status: $($_.Exception.Message)"
}

# Check nginx error logs
Write-Info "Checking nginx error logs..."
try {
    $nginxErrors = ssh root@$ServerIP "tail -20 /var/log/nginx/error.log"
    Write-Host "Recent nginx errors:" -ForegroundColor Yellow
    Write-Host $nginxErrors -ForegroundColor Gray
} catch {
    Write-Fail "Could not check nginx error logs: $($_.Exception.Message)"
}

# Check application logs
Write-Info "Checking application logs..."
try {
    $appLogs = ssh root@$ServerIP "find /var/log -name '*flipnosis*' -o -name '*node*' | head -5 | xargs -I {} tail -20 {} 2>/dev/null || echo 'No application logs found'"
    Write-Host "Recent application logs:" -ForegroundColor Yellow
    Write-Host $appLogs -ForegroundColor Gray
} catch {
    Write-Fail "Could not check application logs: $($_.Exception.Message)"
}

# Check if the deployment directory exists
Write-Info "Checking deployment directory..."
try {
    $deployDir = ssh root@$ServerIP "ls -la /var/www/ || ls -la /home/ || ls -la /opt/ || echo 'No deployment directories found'"
    Write-Host "Deployment directories:" -ForegroundColor Yellow
    Write-Host $deployDir -ForegroundColor Gray
} catch {
    Write-Fail "Could not check deployment directories: $($_.Exception.Message)"
}

Write-Info "Debug complete. Check the output above for issues."
Write-Host ""
Write-Host "Common issues and solutions:" -ForegroundColor Cyan
Write-Host "1. If no Node.js processes: The app isn't starting" -ForegroundColor White
Write-Host "2. If nginx errors: Check proxy configuration" -ForegroundColor White
Write-Host "3. If SSH fails: Check your SSH key setup" -ForegroundColor White
Write-Host "4. If service not found: Check how the app is deployed" -ForegroundColor White
