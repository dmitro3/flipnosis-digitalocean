# Apply nginx fix for Socket.io WebSocket support
# Run this script from your local machine

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerIP,
    
    [Parameter(Mandatory=$false)]
    [string]$Username = "root"
)

Write-Host "🔧 Applying nginx fix for Socket.io WebSocket support..." -ForegroundColor Yellow
Write-Host "📡 Connecting to server: $ServerIP" -ForegroundColor Blue

# Upload the fixed nginx config to the server
Write-Host "📤 Uploading fixed nginx configuration..." -ForegroundColor Blue
scp nginx_fixed.conf ${Username}@${ServerIP}:/tmp/nginx_fixed.conf

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload nginx config" -ForegroundColor Red
    exit 1
}

# Apply the fix on the server
Write-Host "🔧 Applying nginx configuration on server..." -ForegroundColor Blue
ssh ${Username}@${ServerIP} @"
# Backup current config
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S)

# Apply the fix
sudo cp /tmp/nginx_fixed.conf /etc/nginx/sites-available/default

# Test nginx configuration
sudo nginx -t

if [ \$? -eq 0 ]; then
    echo "✅ Nginx configuration test passed!"
    
    # Reload nginx
    echo "🔄 Reloading nginx..."
    sudo systemctl reload nginx
    
    if [ \$? -eq 0 ]; then
        echo "✅ Nginx reloaded successfully!"
        echo "🎉 Socket.io WebSocket support should now work!"
    else
        echo "❌ Failed to reload nginx"
        exit 1
    fi
else
    echo "❌ Nginx configuration test failed!"
    echo "🔄 Restoring backup..."
    sudo cp /etc/nginx/sites-available/default.backup.* /etc/nginx/sites-available/default
    exit 1
fi

# Check nginx status
echo "📊 Checking nginx status..."
sudo systemctl status nginx --no-pager

# Test Socket.io endpoint
echo "🔍 Testing Socket.io endpoint..."
curl -I https://flipnosis.fun/socket.io/

echo "✅ Nginx Socket.io fix completed!"
echo "🌐 Your lobby should now load properly at https://flipnosis.fun"
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Nginx fix applied successfully!" -ForegroundColor Green
    Write-Host "🌐 Test your lobby at https://flipnosis.fun" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to apply nginx fix" -ForegroundColor Red
}
