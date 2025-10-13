# Fix Socket.io Connection Issues
# This script updates nginx configuration to properly handle Socket.io connections

Write-Host "Fixing Socket.io Connection Issues..." -ForegroundColor Yellow

# Test server connectivity first
Write-Host "Testing server connectivity..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "https://flipnosis.fun/health" -UseBasicParsing -TimeoutSec 10
    Write-Host "Server is accessible: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Server not accessible: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Create the new nginx configuration
$nginxConfig = @"
server {
    listen 80;
    server_name flipnosis.fun www.flipnosis.fun;
    
    # Redirect HTTP to HTTPS
    return 301 https://`$server_name`$request_uri;
}

server {
    listen 443 ssl http2;
    server_name flipnosis.fun www.flipnosis.fun;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/flipnosis.fun/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/flipnosis.fun/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Proxy to Node.js app on port 3000
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_cache_bypass `$http_upgrade;
    }
    
    # Socket.io WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_set_header X-Forwarded-Host `$server_name;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        proxy_connect_timeout 60;
        proxy_cache_bypass `$http_upgrade;
        proxy_no_cache `$http_upgrade;
    }
    
    # Legacy WebSocket support (keep for compatibility)
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
    }
}
"@

Write-Host "Writing nginx configuration..." -ForegroundColor Cyan
$nginxConfig | Out-File -FilePath "nginx-socketio-fixed.conf" -Encoding UTF8

Write-Host "Deploying nginx configuration to server..." -ForegroundColor Yellow

# Upload and apply the configuration
Write-Host "Uploading nginx configuration..." -ForegroundColor Gray
scp nginx-socketio-fixed.conf root@159.69.242.154:/tmp/nginx-socketio-fixed.conf

Write-Host "Applying nginx configuration..." -ForegroundColor Gray
ssh root@159.69.242.154 'sudo cp /tmp/nginx-socketio-fixed.conf /etc/nginx/sites-available/flipnosis.fun'

Write-Host "Testing nginx configuration..." -ForegroundColor Gray
ssh root@159.69.242.154 'sudo nginx -t'

Write-Host "Reloading nginx..." -ForegroundColor Gray
ssh root@159.69.242.154 'sudo systemctl reload nginx'

Write-Host "Checking nginx status..." -ForegroundColor Gray
ssh root@159.69.242.154 'sudo systemctl status nginx --no-pager -l'

Write-Host "Cleaning up..." -ForegroundColor Gray
ssh root@159.69.242.154 'rm -f /tmp/nginx-socketio-fixed.conf'

Write-Host "Testing Socket.io connection..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

try {
    # Test if socket.io endpoint is accessible
    $socketTest = Invoke-WebRequest -Uri "https://flipnosis.fun/socket.io/" -UseBasicParsing -TimeoutSec 10
    Write-Host "Socket.io endpoint accessible: $($socketTest.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Socket.io endpoint test failed (this might be normal): $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "Socket.io connection fix deployment complete!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Test your site: https://flipnosis.fun" -ForegroundColor White
Write-Host "  2. Try loading a game and check browser console for connection status" -ForegroundColor White
Write-Host "  3. Socket.io should now connect to: wss://flipnosis.fun/socket.io/" -ForegroundColor White
Write-Host "  4. If issues persist, check server logs: ssh root@159.69.242.154 pm2 logs" -ForegroundColor White

# Clean up local file
Remove-Item -Path "nginx-socketio-fixed.conf" -Force -ErrorAction SilentlyContinue
