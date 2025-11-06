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

echo "Stopping application..."
if command -v pm2 >/dev/null 2>&1; then
    pm2 stop flipnosis-app || echo "App not running"
fi
sleep 2

echo "Force checking out code to $APP_DIR..."
cd "$REPO_DIR"

# Use git archive to ensure clean checkout
git archive "$branch" | tar -x -C "$APP_DIR" || {
    echo "Archive method failed, trying checkout..."
    cd "$APP_DIR"
    GIT_DIR="$REPO_DIR" git --work-tree=. checkout -f "$branch" -- .
}

cd "$APP_DIR"

# Link environment file
if [ -f "$SHARED_DIR/.env" ]; then
    echo "Linking environment file..."
    ln -sf "$SHARED_DIR/.env" .env
fi

# Install dependencies
echo "Installing dependencies..."
if command -v npm >/dev/null 2>&1; then
    npm install --production=false
    
    # Build if needed
    if grep -q '"build"' package.json; then
        echo "Building application..."
        npm run build || echo "Build had warnings but continuing..."
        echo "Build completed"
    fi
else
    echo "npm not found"
    exit 1
fi

# Restart application
echo "Starting application..."
if command -v pm2 >/dev/null 2>&1; then
    pm2 restart flipnosis-app || pm2 start ecosystem.config.js || pm2 start server/server.js --name flipnosis-app
    sleep 2
    pm2 save
    echo "Application restarted via PM2"
else
    echo "PM2 not found"
    exit 1
fi

echo "=========================================="
echo "Post-receive hook completed at $(date)"
echo "=========================================="

