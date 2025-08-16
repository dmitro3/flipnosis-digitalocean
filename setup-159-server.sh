#!/bin/bash
# Setup script for moving everything to 159 server

echo "🚀 Setting up CryptoFlipz on single server (159)"

# Create app directory
mkdir -p /opt/flipnosis/app
cd /opt/flipnosis/app

# Database will be created fresh on this server
echo "📦 Starting with fresh SQLite database on this server"
echo "✅ Database will be created at: /opt/flipnosis/app/server/flipz.db"

# Install dependencies if needed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Create backup directory
mkdir -p /opt/flipnosis/app/backups
echo "✅ Backup directory created"

# Setup PM2 to start on boot
pm2 startup systemd -u root --hp /root
pm2 save

# Install nginx if not present
if ! command -v nginx &> /dev/null; then
    echo "Installing nginx..."
    apt update
    apt install -y nginx
fi

# Create nginx configuration
echo "📝 Creating nginx configuration..."
cat > /etc/nginx/sites-available/flipnosis << 'EOF'
server {
    listen 80;
    server_name 159.65.231.188 flipnosis.fun www.flipnosis.fun;

    # Increase timeouts for WebSocket
    proxy_connect_timeout 7d;
    proxy_send_timeout 7d;
    proxy_read_timeout 7d;

    # WebSocket location
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }

    # API routes
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }

    # Everything else
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/flipnosis /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
nginx -t && systemctl reload nginx
echo "✅ Nginx configured"

# Create environment file
cat > /opt/flipnosis/app/.env << 'EOF'
PORT=3001
NODE_ENV=production
DATABASE_PATH=/opt/flipnosis/app/flipz.db
CONTRACT_ADDRESS=0x89Be2510F8180DC319888Ca44E2FDcBA24274c4E
RPC_URL=https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3
EOF

echo "✅ Environment configured"

# Start the application
echo "🚀 Starting application..."
cd /opt/flipnosis/app
npm install
npm run build

# Start with PM2
pm2 delete flipnosis 2>/dev/null || true
pm2 start server/server.js --name flipnosis --env production
pm2 save

echo "✅ Application started"

# Setup daily backup cron job
cat > /etc/cron.daily/flipnosis-backup << 'EOF'
#!/bin/bash
# Daily backup of flipnosis database
BACKUP_DIR="/opt/flipnosis/app/backups"
DB_PATH="/opt/flipnosis/app/flipz.db"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
cp $DB_PATH $BACKUP_DIR/flipz_backup_$DATE.db

# Keep only last 7 days of backups
find $BACKUP_DIR -name "flipz_backup_*.db" -mtime +7 -delete

echo "Backup completed: flipz_backup_$DATE.db"
EOF

chmod +x /etc/cron.daily/flipnosis-backup
echo "✅ Daily backup configured"

# Final status check
echo ""
echo "========================================="
echo "✅ Setup Complete!"
echo "========================================="
echo ""
echo "📊 Database: /opt/flipnosis/app/flipz.db"
echo "💾 Backups: /opt/flipnosis/app/backups/"
echo "🌐 Server: http://159.65.231.188:3001"
echo "📝 Nginx: http://159.65.231.188"
echo ""
echo "Useful commands:"
echo "  pm2 status        - Check app status"
echo "  pm2 logs          - View logs"
echo "  pm2 restart all   - Restart app"
echo "  pm2 monit         - Monitor app"
echo ""
echo "Database backup:"
echo "  Manual: /etc/cron.daily/flipnosis-backup"
echo "  Auto: Every day at midnight"
echo ""
echo "Test WebSocket:"
echo "  curl http://localhost:3001/health"
echo ""
