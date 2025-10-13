# Fix Socket.io WebSocket Connection Issues
# This script fixes the nginx configuration to properly support Socket.io WebSocket connections

Write-Host "🔧 Fixing Socket.io WebSocket Connection..." -ForegroundColor Cyan

# SSH connection details
$sshHost = "root@159.69.242.154"

# Create the correct nginx configuration
$nginxConfig = @'
# Nginx configuration for Socket.io WebSocket support
server {
    listen 80;
    server_name flipnosis.fun www.flipnosis.fun;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
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
    
    # Increased buffer sizes for WebSocket
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;
    
    # Socket.io WebSocket support - MUST come BEFORE main location block
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket upgrade headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        
        # Timeouts for long-lived connections
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        proxy_connect_timeout 60;
        
        # Disable caching for WebSocket
        proxy_cache_bypass $http_upgrade;
        proxy_no_cache $http_upgrade;
        
        # Disable buffering for real-time data
        proxy_buffering off;
    }
    
    # Main application proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
'@

Write-Host "📝 Creating nginx configuration..." -ForegroundColor Yellow
$nginxConfig | Out-File -FilePath "nginx-socketio-fixed.conf" -Encoding UTF8

Write-Host "📤 Uploading nginx configuration to server..." -ForegroundColor Yellow
scp nginx-socketio-fixed.conf ${sshHost}:/etc/nginx/sites-available/flipnosis.fun

Write-Host "🔗 Creating symbolic link..." -ForegroundColor Yellow
ssh $sshHost "ln -sf /etc/nginx/sites-available/flipnosis.fun /etc/nginx/sites-enabled/flipnosis.fun"

Write-Host "✅ Testing nginx configuration..." -ForegroundColor Yellow
$testResult = ssh $sshHost "nginx -t 2>&1"
Write-Host $testResult

if ($testResult -match "successful") {
    Write-Host "✅ Nginx configuration is valid!" -ForegroundColor Green
    
    Write-Host "🔄 Reloading nginx..." -ForegroundColor Yellow
    ssh $sshHost "systemctl reload nginx"
    
    Write-Host "📊 Checking nginx status..." -ForegroundColor Yellow
    $nginxStatus = ssh $sshHost "systemctl status nginx | head -n 10"
    Write-Host $nginxStatus
    
    Write-Host "🔍 Checking if Node.js server is running..." -ForegroundColor Yellow
    $nodeStatus = ssh $sshHost "pm2 list"
    Write-Host $nodeStatus
    
    Write-Host "🔄 Restarting Node.js server to ensure Socket.io is properly initialized..." -ForegroundColor Yellow
    ssh $sshHost "pm2 restart flipnosis"
    
    Start-Sleep -Seconds 3
    
    Write-Host "📊 Checking server logs..." -ForegroundColor Yellow
    $serverLogs = ssh $sshHost "pm2 logs flipnosis --nostream --lines 20"
    Write-Host $serverLogs
    
    Write-Host ""
    Write-Host "✅ Fix applied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🧪 Test the connection by:" -ForegroundColor Cyan
    Write-Host "   1. Opening: https://flipnosis.fun" -ForegroundColor White
    Write-Host "   2. Opening browser console (F12)" -ForegroundColor White
    Write-Host "   3. Look for: '✅ Socket.io connected'" -ForegroundColor White
    Write-Host ""
    Write-Host "🔍 If still having issues, check:" -ForegroundColor Yellow
    Write-Host "   - Browser console for specific errors" -ForegroundColor White
    Write-Host "   - Server logs: ssh $sshHost 'pm2 logs flipnosis'" -ForegroundColor White
    Write-Host "   - Nginx logs: ssh $sshHost 'tail -f /var/log/nginx/error.log'" -ForegroundColor White
    
} else {
    Write-Host "❌ Nginx configuration has errors!" -ForegroundColor Red
    Write-Host "Please check the configuration and try again." -ForegroundColor Red
}

# Cleanup
Remove-Item nginx-socketio-fixed.conf -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "🎯 Next steps if WebSocket still fails:" -ForegroundColor Cyan
Write-Host "   1. Check if port 3000 is listening: ssh $sshHost 'netstat -tulpn | grep 3000'" -ForegroundColor White
Write-Host "   2. Test Socket.io directly: curl -v 'https://flipnosis.fun/socket.io/?EIO=4&transport=polling'" -ForegroundColor White
Write-Host "   3. Check firewall: ssh $sshHost 'ufw status'" -ForegroundColor White

