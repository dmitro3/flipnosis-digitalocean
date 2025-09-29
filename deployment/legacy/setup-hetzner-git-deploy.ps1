# Setup Git-based, passwordless deploy to Hetzner (one-time setup)
# Usage:
#   .\deployment\setup-hetzner-git-deploy.ps1 -ServerIP 159.69.242.154 -ServerUser root

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
if (!(Test-Path $sshDir)) { New-Item -ItemType Directory -Force -Path $sshDir | Out-Null }

$keyPath = Join-Path $sshDir "id_ed25519"
if (!(Test-Path $keyPath)) {
  Write-Info "Generating SSH key (ed25519) for passwordless auth..."
  try {
    Start-Process -FilePath "ssh-keygen" -ArgumentList @('-t','ed25519','-C','flipnosis-deploy','-f',"$keyPath",'-q','-N','') -Wait -NoNewWindow
  } catch {
    Write-Warn "ssh-keygen reported an error, will verify files and recover if needed..."
  }
  if (!(Test-Path $keyPath)) { Write-Fail "Private key not created at $keyPath"; throw }
  if (!(Test-Path "$keyPath.pub")) {
    Write-Info "Public key missing; generating from private key..."
    ( & ssh-keygen -y -f "$keyPath" ) | Out-File -FilePath "$keyPath.pub" -Encoding ascii -NoNewline
  }
  Write-Ok "SSH key generated: $keyPath"
} else {
  # Ensure .pub exists
  if (!(Test-Path "$keyPath.pub")) {
    Write-Info "Existing private key found; generating missing public key..."
    ( & ssh-keygen -y -f "$keyPath" ) | Out-File -FilePath "$keyPath.pub" -Encoding ascii -NoNewline
  }
  Write-Ok "SSH key found: $keyPath"
}

# 2) Pre-accept server host key to avoid interactive prompt
Write-Info "Adding server host key to known_hosts to avoid prompts..."
try {
  $knownHosts = Join-Path $sshDir "known_hosts"
  $keyscan = ssh-keyscan -H $ServerIP 2>$null
  if ($keyscan) { Add-Content -Path $knownHosts -Value $keyscan }
  Write-Ok "Server host key added"
} catch {}

# 3) Install public key on server (one-time; may prompt for the server password once)
Write-Info "Installing public key on server (may prompt for server password once)..."
$pubKey = Get-Content ("$keyPath.pub") -Raw
try {
  $escapedPub = $pubKey.Replace('"','\"')
  ssh "$ServerUser@$ServerIP" "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo \"$escapedPub\" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
  Write-Ok ("Public key installed to {0}@{1}:~/.ssh/authorized_keys" -f $ServerUser, $ServerIP)
} catch {
  Write-Fail "Failed to install SSH key. Ensure SSH is reachable and credentials are correct. Error: $($_.Exception.Message)"
  throw
}

# 4) Create directories, bare repo, shared env, and systemd service if missing
Write-Info "Creating directories and bare repo on server..."
$remoteSetup = @'
set -e
sudo mkdir -p /opt/flipnosis/repo.git /opt/flipnosis/app /opt/flipnosis/shared
sudo chown -R $USER:$USER /opt/flipnosis

# Ensure core packages
if ! command -v git >/dev/null 2>&1; then
  sudo apt-get update -y
  sudo apt-get install -y git curl ca-certificates
fi

# Ensure Node.js 20
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# Ensure nginx present
if ! command -v nginx >/dev/null 2>&1; then
  sudo apt-get install -y nginx
  sudo systemctl enable nginx
fi

if [ ! -d "/opt/flipnosis/repo.git/refs" ]; then
  git init --bare /opt/flipnosis/repo.git
  GIT_DIR=/opt/flipnosis/repo.git git symbolic-ref HEAD refs/heads/main || true
fi

# Create a default .env location if not present (fill with real secrets on server only)
if [ ! -f "/opt/flipnosis/shared/.env" ]; then
  cat > /opt/flipnosis/shared/.env << EOF
NODE_ENV=production
PORT=3001
# Fill the following with real values on SERVER ONLY (do not commit secrets)
DATABASE_URL=
CONTRACT_ADDRESS=
CONTRACT_OWNER_KEY=
RPC_URL=
VITE_ALCHEMY_API_KEY=
VITE_PLATFORM_FEE_RECEIVER=
EOF
fi

# Create systemd service if missing
if [ ! -f "/etc/systemd/system/flipnosis-app.service" ]; then
  sudo bash -lc 'cat > /etc/systemd/system/flipnosis-app.service << SERVICE
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
SERVICE'
  sudo systemctl daemon-reload
  sudo systemctl enable flipnosis-app
fi

# Generate self-signed cert for Node server path if missing
if [ ! -f "/etc/ssl/private/selfsigned.key" ] || [ ! -f "/etc/ssl/certs/selfsigned.crt" ]; then
  sudo mkdir -p /etc/ssl/private /etc/ssl/certs
  sudo openssl req -x509 -nodes -days 825 -newkey rsa:2048 \
    -keyout /etc/ssl/private/selfsigned.key \
    -out /etc/ssl/certs/selfsigned.crt \
    -subj "/C=US/ST=NA/L=NA/O=Flipnosis/OU=App/CN=flipnosis.local"
  sudo chmod 600 /etc/ssl/private/selfsigned.key
fi

# Configure nginx to proxy 80->443 and 443-> https upstream (node on 3001)
sudo bash -lc 'cat > /etc/nginx/sites-available/flipnosis << '\''NGINX'\''
server {
  listen 80;
  server_name _;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name _;

  ssl_certificate /etc/ssl/certs/selfsigned.crt;
  ssl_certificate_key /etc/ssl/private/selfsigned.key;

  location / {
    proxy_pass https://localhost:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }

  location /ws {
    proxy_pass https://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 86400;
  }
}
'
NGINX'

sudo ln -sf /etc/nginx/sites-available/flipnosis /etc/nginx/sites-enabled/flipnosis
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx || true
'@

ssh "$ServerUser@$ServerIP" "$remoteSetup"
Write-Ok "Directories, bare repo, and service prepared"

# 5) Install post-receive hook to auto-deploy on git push
Write-Info "Installing post-receive hook..."
$postReceive = @'
#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/opt/flipnosis/repo.git"
APP_DIR="/opt/flipnosis/app"
SHARED_DIR="/opt/flipnosis/shared"

# Read refs from stdin and capture the last pushed branch
read -r oldrev newrev refname || true
branch="${refname#refs/heads/}"
if [ -z "${branch:-}" ]; then
  branch="main"
fi

# Checkout latest code into working tree
GIT_DIR="$REPO_DIR" GIT_WORK_TREE="$APP_DIR" git checkout -f "$branch" || GIT_DIR="$REPO_DIR" GIT_WORK_TREE="$APP_DIR" git checkout -f

cd "$APP_DIR"

# Link server-managed env file
if [ -f "$SHARED_DIR/.env" ]; then
  ln -sf "$SHARED_DIR/.env" .env
fi

# Install deps and build
if command -v npm >/dev/null 2>&1; then
  if [ -f package-lock.json ]; then
    npm ci
  else
    npm install
  fi
  if grep -q "\"build\"" package.json; then
    npm run build || true
  fi
fi

# Restart application via systemd if available; fallback to pm2
if command -v systemctl >/dev/null 2>&1; then
  systemctl restart flipnosis-app || true
else
  if command -v pm2 >/dev/null 2>&1; then
    pm2 restart flipnosis || pm2 start server/server.js --name flipnosis
  else
    # Very last resort: nohup
    pkill -f "node server/server.js" || true
    nohup node server/server.js > /opt/flipnosis/app/server.log 2>&1 &
  fi
fi

echo "[post-receive] Deploy done at $(date)"
'@

# Upload hook and set permissions
ssh "$ServerUser@$ServerIP" "cat > /opt/flipnosis/repo.git/hooks/post-receive << 'HOOK'
$postReceive
HOOK
chmod +x /opt/flipnosis/repo.git/hooks/post-receive"
Write-Ok "post-receive hook installed"

# 6) Configure local git remote "hetzner" pointing to the bare repo
Write-Info "Configuring local git remote 'hetzner'..."
$remoteUrl = "${ServerUser}@${ServerIP}:/opt/flipnosis/repo.git"
$remotes = git remote | Out-String
if ($remotes -notmatch "(^|\n)hetzner(\n|$)") {
  git remote add hetzner $remoteUrl
  Write-Ok "Added git remote 'hetzner' => $remoteUrl"
} else {
  git remote set-url hetzner $remoteUrl
  Write-Ok "Updated git remote 'hetzner' => $remoteUrl"
}

Write-Host "\nAll set. Next steps:" -ForegroundColor Yellow
Write-Host "- Put real secrets into /opt/flipnosis/shared/.env on the server ($ServerUser@$ServerIP)" -ForegroundColor Yellow
Write-Host "- Then deploy with: .\\deployment\\deploy-hetzner-git.ps1 \"Your message\"" -ForegroundColor Yellow

Write-Ok "Git-based deploy setup complete"


