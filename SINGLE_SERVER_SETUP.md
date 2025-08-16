# Single Server Setup Guide

This guide will help you set up the simplified single-server architecture for Flipnosis on your 159.69.242.154 server.

## What Changed

We've simplified the architecture by:
- ✅ Removed complex multi-server setup
- ✅ Removed PostgreSQL and Redis dependencies
- ✅ Removed SSL/HTTPS complexity
- ✅ Using local SQLite database
- ✅ Everything runs on one server (159.69.242.154)

## Files Removed/Simplified

- ❌ `nginx-fixed.conf` - Deleted
- ❌ `ssl-setup.sh` - Deleted
- ✅ `server/server.js` - Simplified to single-server setup
- ✅ `src/config/api.js` - Updated for local connections
- ✅ `env-template.txt` - Updated for single server

## Quick Setup

### 1. Setup Server Environment

SSH into your server and run:

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Install nginx for reverse proxy
apt install -y nginx

# Create application directory
mkdir -p /var/www/flipnosis
```

### 2. Setup Nginx

Create nginx configuration:

```bash
cat > /etc/nginx/sites-available/flipnosis << 'EOF'
server {
    listen 80;
    server_name 159.69.242.154;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/flipnosis /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart nginx
nginx -t
systemctl restart nginx
systemctl enable nginx
```

### 3. Setup Git Deployment

```bash
cd /var/www/flipnosis
git init --bare

# Create post-receive hook
cat > hooks/post-receive << 'EOF'
#!/bin/bash
cd /var/www/flipnosis || exit 1

# Pull latest changes
git --work-tree=/var/www/flipnosis --git-dir=/var/www/flipnosis/.git checkout -f HEAD

# Install dependencies
npm install

# Build frontend
npm run build

# Restart PM2 process
pm2 restart flipnosis || pm2 start server/server.js --name flipnosis

echo "Deployment completed successfully"
EOF

chmod +x hooks/post-receive
```

### 4. Setup Local Git Remote

On your local machine:

```bash
# Remove existing remote if it exists
git remote remove hetzner

# Add new remote
git remote add hetzner root@159.69.242.154:/var/www/flipnosis
```

### 5. Deploy

```bash
# Deploy your application
.\deployment\deploy-hetzner-git-fixed.ps1 "Initial single server deployment"

# Check status
.\deployment\check-hetzner-status-fixed.ps1 -ServerIP 159.69.242.154
```

## Environment Variables

Update your `.env` file:

```env
# Server Configuration (Single Server - 159.69.242.154)
PORT=3001
NODE_ENV=production

# Database Configuration (Local SQLite)
DATABASE_PATH=./server/flipz.db

# Blockchain Configuration
CONTRACT_ADDRESS=0x6527c1e6b12cd0F6d354B15CF7935Dc5516DEcaf
RPC_URL=https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3
PRIVATE_KEY=your_private_key_here
```

## Features

The simplified setup includes:

- ✅ **Local SQLite Database** - No external database dependencies
- ✅ **Automatic Backups** - Every 6 hours to `server/backups/`
- ✅ **WebSocket Support** - Real-time game updates
- ✅ **PM2 Process Management** - Automatic restarts
- ✅ **Nginx Reverse Proxy** - Clean URLs and WebSocket support
- ✅ **Git Deployment** - One-command deployments

## Monitoring

```bash
# View logs
ssh root@159.69.242.154 'pm2 logs flipnosis'

# Check status
ssh root@159.69.242.154 'pm2 status'

# Health check
curl http://159.69.242.154/health
```

## Backup/Restore

The system automatically creates backups every 6 hours. You can also manually:

```bash
# Create backup
curl http://159.69.242.154/api/backup

# Restore backup (via admin panel)
POST http://159.69.242.154/api/restore
```

## Troubleshooting

1. **Server won't start**: Check PM2 logs
2. **Database issues**: Check `server/flipz.db` permissions
3. **WebSocket issues**: Check nginx configuration
4. **Build fails**: Ensure Node.js 18+ is installed

Your application will be available at: **http://159.69.242.154**
