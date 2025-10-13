#!/bin/bash
# Fix Socket.io WebSocket Connection Issues

echo "🔧 Fixing Socket.io WebSocket Connection..."
echo ""

SSH_HOST="root@159.69.242.154"

# Create the correct nginx configuration
cat > nginx-socketio-fixed.conf << 'EOF'
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
EOF

echo "📤 Uploading nginx configuration to server..."
scp nginx-socketio-fixed.conf ${SSH_HOST}:/etc/nginx/sites-available/flipnosis.fun

echo "🔗 Creating symbolic link..."
ssh $SSH_HOST "ln -sf /etc/nginx/sites-available/flipnosis.fun /etc/nginx/sites-enabled/flipnosis.fun"

echo "✅ Testing nginx configuration..."
if ssh $SSH_HOST "nginx -t"; then
    echo "✅ Nginx configuration is valid!"
    
    echo "🔄 Reloading nginx..."
    ssh $SSH_HOST "systemctl reload nginx"
    
    echo "📊 Checking nginx status..."
    ssh $SSH_HOST "systemctl status nginx | head -n 10"
    
    echo "🔄 Restarting Node.js server..."
    ssh $SSH_HOST "pm2 restart flipnosis"
    
    sleep 3
    
    echo "📊 Checking server logs..."
    ssh $SSH_HOST "pm2 logs flipnosis --nostream --lines 20"
    
    echo ""
    echo "✅ Fix applied successfully!"
    echo ""
    echo "🧪 Test the connection by:"
    echo "   1. Opening: https://flipnosis.fun"
    echo "   2. Opening browser console (F12)"
    echo "   3. Look for: '✅ Socket.io connected'"
else
    echo "❌ Nginx configuration has errors!"
fi

# Cleanup
rm -f nginx-socketio-fixed.conf

echo ""
echo "Done!"

