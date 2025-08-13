# Setup script for single server deployment (159.69.242.154)
# This script sets up the simplified single-server architecture

param(
    [string]$ServerIP = "159.69.242.154",
    [string]$ServerUser = "root"
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Fail([string]$msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

Write-Info "Setting up single server deployment for $ServerIP..."

# Test SSH connection
Write-Info "Testing SSH connection..."
try {
    $sshTest = ssh -o ConnectTimeout=10 -o BatchMode=yes ${ServerUser}@${ServerIP} "echo 'SSH connection successful'" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "SSH connection successful"
    } else {
        Write-Fail "SSH connection failed. Please ensure:"
        Write-Host "  1. SSH key is configured for $ServerUser@$ServerIP" -ForegroundColor Yellow
        Write-Host "  2. Server is accessible" -ForegroundColor Yellow
        throw "SSH connection failed"
    }
} catch {
    Write-Fail "SSH test failed: $($_.Exception.Message)"
    throw
}

# Setup server environment
Write-Info "Setting up server environment..."
$setupCommands = @"
# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Install nginx for reverse proxy
apt install -y nginx

# Create application directory
mkdir -p /var/www/flipnosis
chown -R $ServerUser:$ServerUser /var/www/flipnosis

# Setup nginx configuration
echo "server {
    listen 80;
    server_name $ServerIP;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}" > /etc/nginx/sites-available/flipnosis

# Enable site
ln -sf /etc/nginx/sites-available/flipnosis /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t

# Restart nginx
systemctl restart nginx
systemctl enable nginx

# Setup PM2 startup script
pm2 startup
"@

try {
    $setupResult = ssh ${ServerUser}@${ServerIP} $setupCommands 2>&1
    Write-Ok "Server environment setup completed"
} catch {
    Write-Fail "Server setup failed: $($_.Exception.Message)"
    throw
}

# Setup Git deployment
Write-Info "Setting up Git deployment..."

# Create post-receive hook
$postReceiveHook = @"
#!/bin/bash
cd /var/www/flipnosis || exit 1

# Pull latest changes
git --work-tree=/var/www/flipnosis --git-dir=/var/www/flipnosis/.git checkout -f HEAD

# Install dependencies
npm install

# Build frontend
npm run build

# Restart PM2 process
pm2 restart flipnosis || pm2 start server/server.js --name flipnosis

echo "Deployment completed successfully"
"@

try {
    # Create git repository on server
    ssh ${ServerUser}@${ServerIP} "cd /var/www/flipnosis && git init --bare && chmod +x hooks/post-receive"
    
    # Upload post-receive hook
    $postReceiveHook | ssh ${ServerUser}@${ServerIP} "cat > /var/www/flipnosis/hooks/post-receive"
    ssh ${ServerUser}@${ServerIP} "chmod +x /var/www/flipnosis/hooks/post-receive"
    
    Write-Ok "Git deployment setup completed"
} catch {
    Write-Fail "Git deployment setup failed: $($_.Exception.Message)"
    throw
}

# Setup local git remote
Write-Info "Setting up local git remote..."
try {
    # Remove existing hetzner remote if it exists
    git remote remove hetzner 2>$null
    
    # Add new remote
    git remote add hetzner ${ServerUser}@${ServerIP}:/var/www/flipnosis
    Write-Ok "Git remote 'hetzner' configured"
} catch {
    Write-Fail "Failed to setup git remote: $($_.Exception.Message)"
    throw
}

Write-Ok "Single server setup completed successfully!"
Write-Info ""
Write-Info "Next steps:"
Write-Host "  1. Deploy your application:" -ForegroundColor Yellow
Write-Host "     .\deployment\deploy-hetzner-git-fixed.ps1 'Initial deployment'" -ForegroundColor White
Write-Host "  2. Check deployment status:" -ForegroundColor Yellow
Write-Host "     .\deployment\check-hetzner-status-fixed.ps1 -ServerIP $ServerIP" -ForegroundColor White
Write-Host "  3. Monitor logs:" -ForegroundColor Yellow
Write-Host "     ssh $ServerUser@$ServerIP 'pm2 logs flipnosis'" -ForegroundColor White
Write-Info ""
Write-Info "Your application will be available at: http://$ServerIP"
