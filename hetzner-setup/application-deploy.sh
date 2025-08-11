#!/bin/bash

# Application Deployment Script for Hetzner
# Deploys the Node.js application to Hetzner

set -e

echo "🚀 Starting Application Deployment to Hetzner..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
APP_SERVER_IP="YOUR_APP_SERVER_IP"
DB_HOST="YOUR_DB_SERVER_IP"
DB_NAME="flipnosis"
DB_USER="flipnosis_user"
DB_PASSWORD="YOUR_SECURE_PASSWORD"

# Create deployment package
print_status "Creating deployment package..."
DEPLOY_DIR="hetzner-deploy-$(date +%Y%m%d_%H%M%S)"

# Build the application
print_status "Building application..."
npm install
npm run build

# Create deployment directory
mkdir -p "$DEPLOY_DIR"
cp -r dist "$DEPLOY_DIR/"
cp -r server "$DEPLOY_DIR/"
cp package.json "$DEPLOY_DIR/"
cp package-lock.json "$DEPLOY_DIR/"

# Create environment file for Hetzner
cat > "$DEPLOY_DIR/.env" << EOF
# Database Configuration
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:5432/${DB_NAME}

# Blockchain Configuration
CONTRACT_ADDRESS=0x3997F4720B3a515e82d54F30d7CF2993B014EeBE
CONTRACT_OWNER_KEY=f19dd56173918d384a2ff2d73905ebc666034b6abd34312a074b4a80ddb2e80c
RPC_URL=https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3

# Application Configuration
PORT=3000
NODE_ENV=production

# Frontend Environment Variables
VITE_ALCHEMY_API_KEY=hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3
VITE_PLATFORM_FEE_RECEIVER=0x47d80671bcb7ec368ef4d3ca6e1c20173ccc9a28
EOF

# Create Dockerfile for Hetzner
cat > "$DEPLOY_DIR/Dockerfile" << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
EOF

# Create docker-compose file
cat > "$DEPLOY_DIR/docker-compose.yml" << EOF
version: '3.8'

services:
  app:
    build: .
    container_name: flipnosis-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:5432/${DB_NAME}
      - CONTRACT_ADDRESS=0x3997F4720B3a515e82d54F30d7CF2993B014EeBE
      - CONTRACT_OWNER_KEY=f19dd56173918d384a2ff2d73905ebc666034b6abd34312a074b4a80ddb2e80c
      - RPC_URL=https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3
      - PORT=3000
    volumes:
      - ./logs:/app/logs
    networks:
      - flipnosis-network

  nginx:
    image: nginx:alpine
    container_name: flipnosis-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - app
    networks:
      - flipnosis-network

networks:
  flipnosis-network:
    driver: bridge
EOF

# Create nginx configuration
cat > "$DEPLOY_DIR/nginx.conf" << 'EOF'
events {
    worker_connections 1024;
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
        server_name www.flipnosis.fun flipnosis.fun;
        
        # Redirect all HTTP traffic to HTTPS
        return 301 https://$host$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name www.flipnosis.fun flipnosis.fun;

        # SSL Configuration (will be set up by Cloudflare)
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        
        # SSL Security Settings
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # API routes with rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # WebSocket routes
        location /ws {
            limit_req zone=websocket burst=50 nodelay;
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            proxy_pass http://app;
            access_log off;
        }

        # Static files
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
            
            # Cache static assets
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
            }
        }
    }
}
EOF

# Create deployment script
cat > "$DEPLOY_DIR/deploy.sh" << 'EOF'
#!/bin/bash

set -e

echo "🚀 Deploying Flipnosis to Hetzner..."

# Stop existing containers
docker-compose down --remove-orphans || true

# Remove old images
docker system prune -f || true

# Build and start containers
docker-compose up -d --build

# Wait for containers to be healthy
echo "Waiting for containers to be healthy..."
sleep 30

# Check container health
if docker-compose ps | grep -q "Up"; then
    echo "✅ All containers are running!"
else
    echo "❌ Some containers failed to start. Check logs with: docker-compose logs"
    exit 1
fi

# Test application health
echo "Testing application health..."
for i in {1..10}; do
    if curl -f http://localhost/health > /dev/null 2>&1; then
        echo "✅ Application is healthy and responding!"
        break
    else
        echo "⏳ Application not ready yet, retrying in 10 seconds... (attempt $i/10)"
        sleep 10
    fi
done

if [ $i -eq 10 ]; then
    echo "❌ Application failed to become healthy. Check logs with: docker-compose logs app"
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo "Your Flipnosis application is now running on Hetzner!"
echo "Application URL: https://www.flipnosis.fun"
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"
EOF

chmod +x "$DEPLOY_DIR/deploy.sh"

# Create tar.gz package
tar -czf "${DEPLOY_DIR}.tar.gz" "$DEPLOY_DIR"

print_success "Deployment package created: ${DEPLOY_DIR}.tar.gz"

# Deploy to Hetzner
print_status "Deploying to Hetzner server..."
scp "${DEPLOY_DIR}.tar.gz" "root@${APP_SERVER_IP}:/root/"
scp "$DEPLOY_DIR/deploy.sh" "root@${APP_SERVER_IP}:/root/"

# Execute deployment on server
ssh root@$APP_SERVER_IP << 'EOF'
cd /root
tar -xzf hetzner-deploy-*.tar.gz
cd hetzner-deploy-*
chmod +x deploy.sh
./deploy.sh
EOF

# Cleanup
rm -rf "$DEPLOY_DIR"
rm -f "${DEPLOY_DIR}.tar.gz"

print_success "🚀 Application deployment completed!"
print_status "Your application is now running on Hetzner!"
print_status "URL: https://www.flipnosis.fun"
print_status "Next steps:"
print_status "1. Configure Cloudflare CDN"
print_status "2. Set up SSL certificates"
print_status "3. Test the application thoroughly"
print_status "4. Update DNS records"
