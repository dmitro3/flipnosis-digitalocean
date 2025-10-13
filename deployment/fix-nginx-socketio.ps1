#!/usr/bin/env pwsh
# Fix nginx configuration for Socket.io WebSocket support

Write-Host "🔧 Fixing nginx configuration for Socket.io..." -ForegroundColor Yellow

# Backup current nginx config
Write-Host "📦 Backing up current nginx configuration..." -ForegroundColor Blue
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(Get-Date -Format "yyyyMMdd_HHmmss")
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(Get-Date -Format "yyyyMMdd_HHmmss")

# Copy the fixed configuration
Write-Host "📝 Applying fixed nginx configuration..." -ForegroundColor Blue
sudo cp nginx_fixed.conf /etc/nginx/sites-available/default

# Test nginx configuration
Write-Host "🧪 Testing nginx configuration..." -ForegroundColor Blue
sudo nginx -t

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Nginx configuration test passed!" -ForegroundColor Green
    
    # Reload nginx
    Write-Host "🔄 Reloading nginx..." -ForegroundColor Blue
    sudo systemctl reload nginx
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Nginx reloaded successfully!" -ForegroundColor Green
        Write-Host "🎉 Socket.io WebSocket support should now work!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to reload nginx" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Nginx configuration test failed!" -ForegroundColor Red
    Write-Host "🔄 Restoring backup..." -ForegroundColor Yellow
    sudo cp /etc/nginx/sites-available/default.backup.* /etc/nginx/sites-available/default
    exit 1
}

# Check nginx status
Write-Host "📊 Checking nginx status..." -ForegroundColor Blue
sudo systemctl status nginx --no-pager

Write-Host "🔍 Testing Socket.io endpoint..." -ForegroundColor Blue
curl -I https://flipnosis.fun/socket.io/

Write-Host "✅ Nginx Socket.io fix completed!" -ForegroundColor Green
Write-Host "🌐 Your lobby should now load properly at https://flipnosis.fun" -ForegroundColor Green
