# Fix Hetzner Server 521 Error
# This script addresses the 521 error by ensuring proper service startup and configuration

param(
    [string]$ServerIP = "159.69.242.154",
    [string]$ServerUser = "root"
)

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Fail([string]$msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

Write-Info "Starting Hetzner server 521 error fix..."

# Step 1: Check current status
Write-Info "Step 1: Checking current server status..."
try {
    $nginxStatus = ssh "$ServerUser@$ServerIP" "systemctl is-active nginx"
    $appStatus = ssh "$ServerUser@$ServerIP" "systemctl is-active flipnosis-app"
    Write-Info "Nginx status: $nginxStatus"
    Write-Info "App status: $appStatus"
} catch {
    Write-Warn "Could not check service status: $($_.Exception.Message)"
}

# Step 2: Stop all services to clean up
Write-Info "Step 2: Stopping all services..."
try {
    ssh "$ServerUser@$ServerIP" "systemctl stop flipnosis-app"
    ssh "$ServerUser@$ServerIP" "systemctl stop nginx"
    Write-Ok "Services stopped"
} catch {
    Write-Warn "Service stop failed: $($_.Exception.Message)"
}

# Step 3: Kill any hanging processes
Write-Info "Step 3: Killing any hanging processes..."
try {
    # Kill Node.js processes
    ssh "$ServerUser@$ServerIP" "pkill -f 'node.*server.js' || true"
    ssh "$ServerUser@$ServerIP" "pkill -f 'pm2' || true"
    
    # Kill processes on ports 80, 443, 3000
    ssh "$ServerUser@$ServerIP" "lsof -ti:80 | xargs -r kill -9 || true"
    ssh "$ServerUser@$ServerIP" "lsof -ti:443 | xargs -r kill -9 || true"
    ssh "$ServerUser@$ServerIP" "lsof -ti:3000 | xargs -r kill -9 || true"
    
    Write-Ok "Processes killed"
} catch {
    Write-Warn "Process cleanup failed: $($_.Exception.Message)"
}

# Step 4: Wait for cleanup
Write-Info "Step 4: Waiting for cleanup..."
Start-Sleep -Seconds 5

# Step 5: Check if the application directory exists and is properly set up
Write-Info "Step 5: Checking application directory..."
try {
    $appDir = ssh "$ServerUser@$ServerIP" "ls -la /root/flipnosis-digitalocean/ | head -10"
    Write-Info "App directory contents:"
    Write-Host $appDir -ForegroundColor Gray
    
    # Check if server.js exists
    $serverExists = ssh "$ServerUser@$ServerIP" "test -f /root/flipnosis-digitalocean/server/server.js && echo 'EXISTS' || echo 'MISSING'"
    if ($serverExists -eq "MISSING") {
        Write-Fail "Server.js is missing! The application may not be properly deployed."
        Write-Info "You may need to run a fresh deployment first."
        exit 1
    }
    Write-Ok "Application files found"
} catch {
    Write-Fail "Could not check application directory: $($_.Exception.Message)"
    exit 1
}

# Step 6: Install/update PM2 if needed
Write-Info "Step 6: Ensuring PM2 is installed..."
try {
    ssh "$ServerUser@$ServerIP" "npm install -g pm2 || true"
    Write-Ok "PM2 installation checked"
} catch {
    Write-Warn "PM2 installation check failed: $($_.Exception.Message)"
}

# Step 7: Navigate to app directory and install dependencies
Write-Info "Step 7: Installing dependencies..."
try {
    ssh "$ServerUser@$ServerIP" "cd /root/flipnosis-digitalocean && npm install --production"
    Write-Ok "Dependencies installed"
} catch {
    Write-Warn "Dependency installation failed: $($_.Exception.Message)"
}

# Step 8: Start the application with PM2
Write-Info "Step 8: Starting application with PM2..."
try {
    # Kill any existing PM2 processes
    ssh "$ServerUser@$ServerIP" "pm2 delete all || true"
    
    # Start the application
    ssh "$ServerUser@$ServerIP" "cd /root/flipnosis-digitalocean && pm2 start ecosystem.config.js"
    
    # Save PM2 configuration
    ssh "$ServerUser@$ServerIP" "pm2 save"
    
    Write-Ok "Application started with PM2"
} catch {
    Write-Fail "Failed to start application: $($_.Exception.Message)"
    exit 1
}

# Step 9: Wait for application to start
Write-Info "Step 9: Waiting for application to start..."
Start-Sleep -Seconds 10

# Step 10: Check if application is responding
Write-Info "Step 10: Testing application health..."
try {
    $healthResponse = ssh "$ServerUser@$ServerIP" "curl -s http://localhost:3000/health"
    Write-Info "Health response: $healthResponse"
    
    if ($healthResponse -like "*healthy*") {
        Write-Ok "Application is healthy"
    } else {
        Write-Warn "Application health check failed"
    }
} catch {
    Write-Warn "Health check failed: $($_.Exception.Message)"
}

# Step 11: Start nginx
Write-Info "Step 11: Starting nginx..."
try {
    ssh "$ServerUser@$ServerIP" "systemctl start nginx"
    Write-Ok "Nginx started"
} catch {
    Write-Fail "Failed to start nginx: $($_.Exception.Message)"
    exit 1
}

# Step 12: Enable services to start on boot
Write-Info "Step 12: Enabling services for auto-start..."
try {
    ssh "$ServerUser@$ServerIP" "systemctl enable nginx"
    ssh "$ServerUser@$ServerIP" "pm2 startup systemd -u root --hp /root"
    Write-Ok "Services enabled for auto-start"
} catch {
    Write-Warn "Service enablement failed: $($_.Exception.Message)"
}

# Step 13: Final status check
Write-Info "Step 13: Final status check..."
try {
    $nginxStatus = ssh "$ServerUser@$ServerIP" "systemctl is-active nginx"
    $pm2Status = ssh "$ServerUser@$ServerIP" "pm2 status | grep flipnosis-app"
    
    Write-Info "Nginx status: $nginxStatus"
    Write-Info "PM2 status: $pm2Status"
    
    if ($nginxStatus -eq "active") {
        Write-Ok "Nginx is running"
    } else {
        Write-Fail "Nginx is not running"
    }
} catch {
    Write-Warn "Final status check failed: $($_.Exception.Message)"
}

# Step 14: Test external connectivity
Write-Info "Step 14: Testing external connectivity..."
try {
    Start-Sleep -Seconds 5
    $response = Invoke-WebRequest -Uri "https://www.flipnosis.fun/health" -UseBasicParsing -TimeoutSec 15
    if ($response.StatusCode -eq 200) {
        Write-Ok "External health check passed: $($response.StatusCode)"
    } else {
        Write-Warn "External health check returned: $($response.StatusCode)"
    }
} catch {
    Write-Warn "External connectivity test failed: $($_.Exception.Message)"
}

Write-Ok "Hetzner server 521 error fix completed!"
Write-Info "Server should now be accessible at https://www.flipnosis.fun"
Write-Host ""
Write-Host "If you still see issues, check the logs with:" -ForegroundColor Yellow
Write-Host "ssh $ServerUser@$ServerIP 'pm2 logs flipnosis-app'" -ForegroundColor Yellow
Write-Host "ssh $ServerUser@$ServerIP 'tail -f /var/log/nginx/error.log'" -ForegroundColor Yellow


