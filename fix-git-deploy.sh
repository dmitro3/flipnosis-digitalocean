#!/bin/bash
set -e

REPO_DIR="/opt/flipnosis/repo.git"
APP_DIR="/opt/flipnosis/app"
SHARED_DIR="/opt/flipnosis/shared"

echo "=== Fixing Git Deployment ==="

# Create repo if it doesn't exist
if [ ! -d "$REPO_DIR" ]; then
    echo "Creating bare git repository..."
    mkdir -p "$REPO_DIR"
    git init --bare "$REPO_DIR"
    cd "$REPO_DIR"
    git symbolic-ref HEAD refs/heads/main || true
fi

# Create post-receive hook
echo "Creating post-receive hook..."
cat > "$REPO_DIR/hooks/post-receive" << 'HOOKEOF'
#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo "Post-receive hook triggered at $(date)"
echo "=========================================="

REPO_DIR="/opt/flipnosis/repo.git"
APP_DIR="/opt/flipnosis/app"
SHARED_DIR="/opt/flipnosis/shared"

# Read refs from stdin
branch="main"
while read oldrev newrev refname; do
    branch="${refname#refs/heads/}"
    echo "Deploying branch: $branch"
done

echo "Checking out code to $APP_DIR..."
GIT_DIR="$REPO_DIR" GIT_WORK_TREE="$APP_DIR" git checkout -f "$branch" || {
    echo "Checkout failed, trying without branch specification..."
    GIT_DIR="$REPO_DIR" GIT_WORK_TREE="$APP_DIR" git checkout -f
}

cd "$APP_DIR"

# Link environment file
if [ -f "$SHARED_DIR/.env" ]; then
    echo "Linking environment file..."
    ln -sf "$SHARED_DIR/.env" .env
fi

# Install dependencies and build
echo "Installing dependencies..."
if command -v npm >/dev/null 2>&1; then
    if [ -f package-lock.json ]; then
        npm ci --production=false
    else
        npm install
    fi
    
    if grep -q '"build"' package.json; then
        echo "Building application..."
        npm run build || echo "Build failed, continuing..."
    fi
fi

# Restart application using PM2
echo "Restarting application with PM2..."
if command -v pm2 >/dev/null 2>&1; then
    pm2 restart flipnosis-app || pm2 start ecosystem.config.js || pm2 start server/server.js --name flipnosis-app
    pm2 save
    echo "PM2 status:"
    pm2 list | grep flipnosis-app || echo "App not found in PM2"
else
    echo "PM2 not available, trying systemctl..."
    if command -v systemctl >/dev/null 2>&1; then
        systemctl restart flipnosis-app || echo "Failed to restart via systemctl"
    fi
fi

echo "=========================================="
echo "Post-receive hook completed at $(date)"
echo "=========================================="
HOOKEOF

chmod +x "$REPO_DIR/hooks/post-receive"
echo "✅ Post-receive hook installed and made executable"

echo "=== Git deployment fixed ==="

