# Setup Git-based, passwordless deploy to Hetzner (one-time setup)
# Usage: .\deployment\setup-hetzner-git-deploy-fixed.ps1 -ServerIP 159.69.242.154 -ServerUser root

param(
  [Parameter(Mandatory = $true)][string]$ServerIP,
  [string]$ServerUser = "root"
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Fail([string]$msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

Write-Info "Configuring Git-based deploy on $ServerUser@$ServerIP"

# 1) Ensure SSH key exists locally
$sshDir = Join-Path $HOME ".ssh"
if (!(Test-Path $sshDir)) { 
    New-Item -ItemType Directory -Force -Path $sshDir | Out-Null 
}

$keyPath = Join-Path $sshDir "id_ed25519"
if (!(Test-Path $keyPath)) {
    Write-Info "Generating SSH key (ed25519) for passwordless auth..."
    try {
        # Use cmd to avoid PowerShell argument parsing issues
        cmd /c "ssh-keygen -t ed25519 -C flipnosis-deploy -f `"$keyPath`" -q -N `"`""
    } catch {
        Write-Warn "ssh-keygen command failed, trying alternative approach..."
        # Try with PowerShell Start-Process
        $args = @("-t", "ed25519", "-C", "flipnosis-deploy", "-f", $keyPath, "-q", "-N", "")
        Start-Process -FilePath "ssh-keygen" -ArgumentList $args -Wait -NoNewWindow -PassThru
    }
    
    if (!(Test-Path $keyPath)) { 
        Write-Fail "Private key not created at $keyPath"
        throw "SSH key generation failed"
    }
    
    # Generate public key if missing
    if (!(Test-Path "$keyPath.pub")) {
        Write-Info "Generating public key from private key..."
        $pubKeyContent = & ssh-keygen -y -f $keyPath
        $pubKeyContent | Out-File -FilePath "$keyPath.pub" -Encoding ASCII -NoNewline
    }
    Write-Ok "SSH key generated: $keyPath"
} else {
    # Ensure .pub exists
    if (!(Test-Path "$keyPath.pub")) {
        Write-Info "Generating missing public key from existing private key..."
        $pubKeyContent = & ssh-keygen -y -f $keyPath
        $pubKeyContent | Out-File -FilePath "$keyPath.pub" -Encoding ASCII -NoNewline
    }
    Write-Ok "SSH key found: $keyPath"
}

# 2) Add server to known_hosts
Write-Info "Adding server to known_hosts..."
try {
    $knownHosts = Join-Path $sshDir "known_hosts"
    $keyscan = & ssh-keyscan -H $ServerIP 2>$null
    if ($keyscan) { 
        Add-Content -Path $knownHosts -Value $keyscan -Encoding ASCII
    }
    Write-Ok "Server host key added"
} catch {
    Write-Warn "Could not add host key automatically"
}

# 3) Install public key on server
Write-Info "Installing public key on server (may prompt for password once)..."
$pubKey = Get-Content "$keyPath.pub" -Raw
$pubKey = $pubKey.Trim()

# Escape the public key properly for SSH command
$escapedPubKey = $pubKey.Replace('"', '\"')

try {
    $sshCommand = "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo `"$escapedPubKey`" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo 'SSH key installed successfully'"
    $result = & ssh "$ServerUser@$ServerIP" $sshCommand
    Write-Ok "Public key installed successfully"
} catch {
    Write-Fail "Failed to install SSH key. Error: $($_.Exception.Message)"
    throw
}

# 4) Create server setup script and upload it
Write-Info "Creating server setup..."

# Create a temporary setup script
$setupScript = @"
#!/bin/bash
set -e

echo "Starting server setup..."

# Create directories
sudo mkdir -p /opt/flipnosis/repo.git /opt/flipnosis/app /opt/flipnosis/shared
sudo chown -R `$USER:`$USER /opt/flipnosis

# Install git if missing
if ! command -v git >/dev/null 2>&1; then
    echo "Installing git..."
    sudo apt-get update -y
    sudo apt-get install -y git curl ca-certificates
fi

# Install Node.js 20 if missing
if ! command -v node >/dev/null 2>&1; then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install nginx if missing
if ! command -v nginx >/dev/null 2>&1; then
    echo "Installing nginx..."
    sudo apt-get install -y nginx
    sudo systemctl enable nginx
fi

# Create bare git repository
if [ ! -d "/opt/flipnosis/repo.git/refs" ]; then
    echo "Creating bare git repository..."
    git init --bare /opt/flipnosis/repo.git
    cd /opt/flipnosis/repo.git
    git symbolic-ref HEAD refs/heads/main || true
fi

# Create default .env file
if [ ! -f "/opt/flipnosis/shared/.env" ]; then
    echo "Creating default .env file..."
    cat > /opt/flipnosis/shared/.env << 'EOF'
NODE_ENV=production
PORT=3001
# Fill the following with real values on SERVER ONLY
DATABASE_URL=
CONTRACT_ADDRESS=
CONTRACT_OWNER_KEY=
RPC_URL=
VITE_ALCHEMY_API_KEY=
VITE_PLATFORM_FEE_RECEIVER=
EOF
fi

# Create systemd service
echo "Creating systemd service..."
sudo cat > /etc/systemd/system/flipnosis-app.service << 'EOF'
[Unit]
Description=Flipnosis Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/flipnosis/app
ExecStart=/usr/bin/node server/server.js
Restart=always
RestartSec=8
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable flipnosis-app

# Generate self-signed certificates
if [ ! -f "/etc/ssl/private/selfsigned.key" ] || [ ! -f "/etc/ssl/certs/selfsigned.crt" ]; then
    echo "Generating self-signed certificates..."
    sudo mkdir -p /etc/ssl/private /etc/ssl/certs
    sudo openssl req -x509 -nodes -days 825 -newkey rsa:2048 \
        -keyout /etc/ssl/private/selfsigned.key \
        -out /etc/ssl/certs/selfsigned.crt \
        -subj "/C=US/ST=NA/L=NA/O=Flipnosis/OU=App/CN=flipnosis.local"
    sudo chmod 600 /etc/ssl/private/selfsigned.key
fi

# Configure nginx
echo "Configuring nginx..."
sudo cat > /etc/nginx/sites-available/flipnosis << 'EOF'
server {
    listen 80;
    server_name _;
    return 301 https://`$host`$request_uri;
}

server {
    listen 443 ssl http2;
    server_name _;

    ssl_certificate /etc/ssl/certs/selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/selfsigned.key;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host `$host;
        proxy_read_timeout 86400;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/flipnosis /etc/nginx/sites-enabled/flipnosis
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

echo "Server setup complete!"
"@

# Write script to temp file and upload
$tempScript = [System.IO.Path]::GetTempFileName()
$setupScript | Out-File -FilePath $tempScript -Encoding UTF8

try {
    # Upload and execute setup script
    $sshTarget = "${ServerUser}@${ServerIP}:/tmp/setup.sh"
    & scp $tempScript $sshTarget
    & ssh "${ServerUser}@${ServerIP}" "chmod +x /tmp/setup.sh && /tmp/setup.sh && rm /tmp/setup.sh"
    Write-Ok "Server setup completed"
} finally {
    Remove-Item $tempScript -Force
}

# 5) Create and upload post-receive hook
Write-Info "Installing post-receive hook..."

$postReceiveScript = @"
#!/usr/bin/env bash
set -euo pipefail

echo "Post-receive hook triggered at `$(date)"

REPO_DIR="/opt/flipnosis/repo.git"
APP_DIR="/opt/flipnosis/app"
SHARED_DIR="/opt/flipnosis/shared"

# Read refs from stdin
while read oldrev newrev refname; do
    branch="`${refname#refs/heads/}"
    echo "Deploying branch: `$branch"
done

# Use main branch as default
if [ -z "`${branch:-}" ]; then
    branch="main"
fi

echo "Checking out code to `$APP_DIR..."
GIT_DIR="`$REPO_DIR" GIT_WORK_TREE="`$APP_DIR" git checkout -f "`$branch" || {
    echo "Checkout failed, trying without branch specification..."
    GIT_DIR="`$REPO_DIR" GIT_WORK_TREE="`$APP_DIR" git checkout -f
}

cd "`$APP_DIR"

# Link environment file
if [ -f "`$SHARED_DIR/.env" ]; then
    echo "Linking environment file..."
    ln -sf "`$SHARED_DIR/.env" .env
fi

# Install dependencies and build
echo "Installing dependencies..."
if command -v npm >/dev/null 2>&1; then
    if [ -f package-lock.json ]; then
        npm ci
    else
        npm install
    fi
    
    if grep -q '"build"' package.json; then
        echo "Building application..."
        npm run build || echo "Build failed, continuing..."
    fi
fi

# Restart application
echo "Restarting application..."
if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl restart flipnosis-app || echo "Failed to restart via systemctl"
    sudo systemctl status flipnosis-app --no-pager -l | head -20
else
    echo "Systemctl not available, trying PM2..."
    if command -v pm2 >/dev/null 2>&1; then
        pm2 restart flipnosis || pm2 start server/server.js --name flipnosis
    else
        echo "Using nohup fallback..."
        pkill -f "node server/server.js" || true
        sleep 2
        nohup node server/server.js > /opt/flipnosis/app/server.log 2>&1 &
    fi
fi

echo "Post-receive hook completed at `$(date)"
"@

# Upload post-receive hook
$tempHook = [System.IO.Path]::GetTempFileName()
$postReceiveScript | Out-File -FilePath $tempHook -Encoding UTF8

try {
    $hookTarget = "${ServerUser}@${ServerIP}:/tmp/post-receive"
    & scp $tempHook $hookTarget
    & ssh "${ServerUser}@${ServerIP}" "mv /tmp/post-receive /opt/flipnosis/repo.git/hooks/post-receive && chmod +x /opt/flipnosis/repo.git/hooks/post-receive"
    Write-Ok "Post-receive hook installed"
} finally {
    Remove-Item $tempHook -Force
}

# 6) Configure local git remote
Write-Info "Configuring local git remote 'hetzner'..."
$remoteUrl = "${ServerUser}@${ServerIP}:/opt/flipnosis/repo.git"

try {
    $existingRemotes = & git remote
    if ($existingRemotes -contains "hetzner") {
        & git remote set-url hetzner $remoteUrl
        Write-Ok "Updated git remote 'hetzner' -> $remoteUrl"
    } else {
        & git remote add hetzner $remoteUrl
        Write-Ok "Added git remote 'hetzner' -> $remoteUrl"
    }
} catch {
    Write-Fail "Failed to configure git remote: $($_.Exception.Message)"
    throw
}

Write-Host ""
Write-Host "Setup complete! Next steps:" -ForegroundColor Yellow
Write-Host "1. Edit /opt/flipnosis/shared/.env on the server with your real secrets" -ForegroundColor Yellow
Write-Host "2. Deploy with: .\deployment\deploy-hetzner-git-fixed.ps1 `"Your commit message`"" -ForegroundColor Yellow
Write-Host "3. Check status with: .\deployment\check-hetzner-status.ps1 -ServerIP $ServerIP" -ForegroundColor Yellow

Write-Ok "Git-based deploy setup complete!"
