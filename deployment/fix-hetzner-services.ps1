# Fix Hetzner server services
param(
  [string]$ServerIP = ""
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Fail([string]$msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

Write-Info "Fixing Hetzner server services..."

# Get server IP from git remote if not provided
if (!$ServerIP) {
    try {
        $remoteUrl = & git remote get-url hetzner
        $ServerIP = (($remoteUrl -split '@')[1] -split ':')[0]
        Write-Info "Detected server IP from git remote: $ServerIP"
    } catch {
        Write-Fail "Could not detect server IP. Please provide it:"
        Write-Host ".\deployment\fix-hetzner-services.ps1 -ServerIP YOUR_SERVER_IP" -ForegroundColor Yellow
        return
    }
}

Write-Info "Connecting to server $ServerIP to fix services..."

# Kill any existing Node.js processes
Write-Info "Stopping existing Node.js processes..."
try {
    ssh root@$ServerIP "pkill -f node || echo 'No Node.js processes to kill'"
    Write-Ok "Stopped existing Node.js processes"
} catch {
    Write-Fail "Could not stop Node.js processes: $($_.Exception.Message)"
}

# Stop any existing services
Write-Info "Stopping existing services..."
try {
    ssh root@$ServerIP "systemctl stop flipnosis 2>/dev/null || echo 'flipnosis service not found'"
    ssh root@$ServerIP "systemctl stop pm2 2>/dev/null || echo 'pm2 service not found'"
    Write-Ok "Stopped existing services"
} catch {
    Write-Fail "Could not stop services: $($_.Exception.Message)"
}

# Check nginx configuration
Write-Info "Checking nginx configuration..."
try {
    $nginxConfig = ssh root@$ServerIP "nginx -t"
    Write-Ok "Nginx configuration is valid"
} catch {
    Write-Fail "Nginx configuration error: $($_.Exception.Message)"
    Write-Host "Fixing nginx configuration..." -ForegroundColor Yellow
    
    # Try to fix nginx config
    try {
        ssh root@$ServerIP "cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup"
        ssh root@$ServerIP "cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    root /var/www/html;
    index index.html index.htm index.nginx-debian.html;
    
    server_name _;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    location /health {
        proxy_pass http://localhost:3000/health;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
    
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF"
        ssh root@$ServerIP "nginx -t && systemctl reload nginx"
        Write-Ok "Nginx configuration fixed"
    } catch {
        Write-Fail "Could not fix nginx configuration: $($_.Exception.Message)"
    }
}

# Find and start the application
Write-Info "Looking for application files..."
try {
    $appPath = ssh root@$ServerIP "find /var/www -name 'package.json' -o -name 'server.js' | head -1 | xargs dirname"
    if ($appPath) {
        Write-Ok "Found application at: $appPath"
        
        # Install dependencies and start
        Write-Info "Installing dependencies and starting application..."
        ssh root@$ServerIP "cd $appPath && npm install --production && nohup node server.js > /var/log/flipnosis.log 2>&1 &"
        
        # Wait a moment for startup
        Start-Sleep -Seconds 5
        
        # Check if it's running
        $processCheck = ssh root@$ServerIP "ps aux | grep node | grep -v grep"
        if ($processCheck) {
            Write-Ok "Application started successfully"
        } else {
            Write-Fail "Application failed to start"
        }
    } else {
        Write-Fail "Could not find application files"
    }
} catch {
    Write-Fail "Could not start application: $($_.Exception.Message)"
}

# Test the application
Write-Info "Testing application..."
try {
    $healthCheck = Invoke-WebRequest -Uri "http://$ServerIP/health" -UseBasicParsing -TimeoutSec 10
    if ($healthCheck.StatusCode -eq 200) {
        Write-Ok "Application is responding on /health endpoint"
    } else {
        Write-Fail "Application health check failed: $($healthCheck.StatusCode)"
    }
} catch {
    Write-Fail "Application health check failed: $($_.Exception.Message)"
}

# Test main page
Write-Info "Testing main page..."
try {
    $mainPage = Invoke-WebRequest -Uri "http://$ServerIP/" -UseBasicParsing -TimeoutSec 10
    if ($mainPage.StatusCode -eq 200) {
        Write-Ok "Main page is responding"
    } else {
        Write-Fail "Main page failed: $($mainPage.StatusCode)"
    }
} catch {
    Write-Fail "Main page failed: $($_.Exception.Message)"
}

Write-Info "Service fix complete!"
Write-Host ""
Write-Host "If issues persist, check:" -ForegroundColor Cyan
Write-Host "1. Application logs: ssh root@$ServerIP 'tail -f /var/log/flipnosis.log'" -ForegroundColor White
Write-Host "2. Nginx logs: ssh root@$ServerIP 'tail -f /var/log/nginx/error.log'" -ForegroundColor White
Write-Host "3. Application status: ssh root@$ServerIP 'ps aux | grep node'" -ForegroundColor White
