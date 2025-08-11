#!/bin/bash

# SSL Domain Fix Script for Flipnosis
# This script fixes the SSL certificate to include both www and non-www domains

set -e

# Configuration
DOMAIN="flipnosis.fun"
WWW_DOMAIN="www.flipnosis.fun"
EMAIL="strik9games@gmail.com"

echo "🔧 Fixing SSL certificate domains for $DOMAIN"

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing certbot..."
    apt-get update
    apt-get install -y certbot
fi

# Stop nginx temporarily
echo "🛑 Stopping nginx temporarily..."
docker-compose stop nginx

# Remove existing certificate if it exists
if [ -d "/etc/letsencrypt/live/$WWW_DOMAIN" ]; then
    echo "🗑️ Removing existing certificate..."
    certbot delete --cert-name "$WWW_DOMAIN" --non-interactive || true
fi

# Get new SSL certificate with both domains
echo "🔐 Obtaining new SSL certificate for both domains..."
certbot certonly --standalone \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "$WWW_DOMAIN" \
    --non-interactive

# Copy certificates to nginx ssl directory
echo "📋 Copying certificates to nginx directory..."
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /etc/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /etc/nginx/ssl/key.pem

# Set proper permissions
chmod 644 /etc/nginx/ssl/cert.pem
chmod 600 /etc/nginx/ssl/key.pem

# Update nginx configuration to handle both domains
echo "⚙️ Updating nginx configuration..."
cat > /etc/nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 50M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=websocket:10m rate=30r/s;

    # Upstream for app
    upstream app {
        server app:3000;
        keepalive 32;
    }

    # HTTP server - redirect to HTTPS
    server {
        listen 80;
        server_name flipnosis.fun www.flipnosis.fun;
        
        # Redirect all HTTP traffic to HTTPS
        return 301 https://$host$request_uri;
    }

    # HTTPS server for both domains
    server {
        listen 443 ssl http2;
        server_name flipnosis.fun www.flipnosis.fun;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        
        # SSL Security Settings
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Static files caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp|mp4|webm)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket connections
        location /ws {
            limit_req zone=websocket burst=20 nodelay;
            
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket specific settings
            proxy_read_timeout 86400;
            proxy_send_timeout 86400;
            proxy_connect_timeout 60;
        }

        # API routes with rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # API specific settings
            proxy_read_timeout 30;
            proxy_send_timeout 30;
            proxy_connect_timeout 30;
        }

        # Health check
        location /health {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Main application
        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Handle client-side routing
            try_files $uri $uri/ /index.html;
        }
    }
}
EOF

# Start nginx
echo "🚀 Starting nginx with updated SSL configuration..."
docker-compose up -d nginx

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
docker-compose exec nginx nginx -t

# Set up automatic renewal
echo "🔄 Setting up automatic certificate renewal..."
cat > /etc/cron.d/ssl-renewal << EOF
0 12 * * * /usr/bin/certbot renew --quiet --deploy-hook "docker-compose -f /root/flipnosis-digitalocean/digitalocean-deploy/docker-compose.yml exec nginx nginx -s reload"
EOF

echo "✅ SSL domain fix completed successfully!"
echo "🌐 Your site should now work on both:"
echo "   - https://flipnosis.fun"
echo "   - https://www.flipnosis.fun"
echo "📅 Certificates will auto-renew every 60 days"
