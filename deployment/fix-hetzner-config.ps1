# Fix Hetzner configuration issues
param(
  [string]$ServerIP = ""
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Fail([string]$msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

Write-Info "Fixing Hetzner configuration issues..."

# Get server IP from git remote if not provided
if (!$ServerIP) {
    try {
        $remoteUrl = & git remote get-url hetzner
        $ServerIP = (($remoteUrl -split '@')[1] -split ':')[0]
        Write-Info "Detected server IP from git remote: $ServerIP"
    } catch {
        Write-Fail "Could not detect server IP. Please provide it:"
        Write-Host ".\deployment\fix-hetzner-config.ps1 -ServerIP YOUR_SERVER_IP" -ForegroundColor Yellow
        return
    }
}

Write-Info "Connecting to server $ServerIP to fix configuration..."

# Step 1: Stop the current Node.js process
Write-Info "Stopping current Node.js process..."
try {
    ssh root@$ServerIP "pkill -f 'node.*server.js'"
    Write-Ok "Stopped Node.js process"
} catch {
    Write-Fail "Could not stop Node.js process: $($_.Exception.Message)"
}

# Step 2: Fix nginx configuration
Write-Info "Fixing nginx configuration..."
try {
    ssh root@$ServerIP "cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    server_name flipnosis.fun www.flipnosis.fun;
    
    # Serve static files directly
    root /opt/flipnosis/app/dist;
    index index.html;
    
    # Handle SPA routing
    location / {
        try_files \$uri \$uri/ @fallback;
    }
    
    # Fallback for SPA
    location @fallback {
        try_files /index.html =404;
    }
    
    # Proxy API requests to Node.js
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Proxy Socket.io
    location /socket.io {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF"
    
    # Test nginx configuration
    ssh root@$ServerIP "nginx -t"
    Write-Ok "Nginx configuration is valid"
    
    # Reload nginx
    ssh root@$ServerIP "systemctl reload nginx"
    Write-Ok "Nginx configuration applied"
    
} catch {
    Write-Fail "Could not fix nginx configuration: $($_.Exception.Message)"
    return
}

# Step 3: Check if the app directory exists and has the right files
Write-Info "Checking application directory..."
try {
    $appCheck = ssh root@$ServerIP "ls -la /opt/flipnosis/app/"
    Write-Host "Application directory contents:" -ForegroundColor Yellow
    Write-Host $appCheck -ForegroundColor Gray
    
    $serverCheck = ssh root@$ServerIP "ls -la /opt/flipnosis/app/server/"
    Write-Host "Server directory contents:" -ForegroundColor Yellow
    Write-Host $serverCheck -ForegroundColor Gray
    
    $distCheck = ssh root@$ServerIP "ls -la /opt/flipnosis/app/dist/ 2>/dev/null || echo 'No dist directory'"
    Write-Host "Dist directory contents:" -ForegroundColor Yellow
    Write-Host $distCheck -ForegroundColor Gray
    
} catch {
    Write-Fail "Could not check application directory: $($_.Exception.Message)"
}

# Step 4: Install dependencies and start the app
Write-Info "Installing dependencies and starting application..."
try {
    # Install dependencies
    ssh root@$ServerIP "cd /opt/flipnosis/app && npm install --production"
    Write-Ok "Dependencies installed"
    
    # Start the app in the background
    ssh root@$ServerIP "cd /opt/flipnosis/app && nohup node server/server.js > /var/log/flipnosis.log 2>&1 &"
    Write-Ok "Application started"
    
    # Wait for startup
    Start-Sleep -Seconds 5
    
    # Check if it's running and listening on port 3000
    $portCheck = ssh root@$ServerIP "netstat -tlnp | grep :3000"
    if ($portCheck) {
        Write-Ok "Application is listening on port 3000"
        Write-Host "Port status: $portCheck" -ForegroundColor Gray
    } else {
        Write-Fail "Application is not listening on port 3000"
    }
    
} catch {
    Write-Fail "Could not start application: $($_.Exception.Message)"
}

# Step 5: Test the endpoints
Write-Info "Testing endpoints..."

# Test health endpoint
try {
    $healthTest = Invoke-WebRequest -Uri "http://$ServerIP/health" -UseBasicParsing -TimeoutSec 10
    if ($healthTest.StatusCode -eq 200) {
        Write-Ok "Health endpoint working: $($healthTest.Content)"
    } else {
        Write-Fail "Health endpoint failed: $($healthTest.StatusCode)"
    }
} catch {
    Write-Fail "Health endpoint test failed: $($_.Exception.Message)"
}

# Test main page
try {
    $mainTest = Invoke-WebRequest -Uri "http://$ServerIP/" -UseBasicParsing -TimeoutSec 10
    if ($mainTest.StatusCode -eq 200) {
        Write-Ok "Main page working"
    } else {
        Write-Fail "Main page failed: $($mainTest.StatusCode)"
    }
} catch {
    Write-Fail "Main page test failed: $($_.Exception.Message)"
}

# Show application logs
Write-Info "Recent application logs:"
try {
    $logs = ssh root@$ServerIP "tail -20 /var/log/flipnosis.log"
    Write-Host $logs -ForegroundColor Gray
} catch {
    Write-Fail "Could not get application logs: $($_.Exception.Message)"
}

Write-Info "Configuration fix complete!"
Write-Host ""
Write-Host "Test your site now: https://flipnosis.fun/" -ForegroundColor Green
Write-Host "If still having issues, check logs: ssh root@$ServerIP 'tail -f /var/log/flipnosis.log'" -ForegroundColor Yellow
