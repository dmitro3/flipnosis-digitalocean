#!/bin/bash

echo "🚀 Deploying to DigitalOcean..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="143.198.166.196"
SERVER_USER="root"
SERVER_PATH="/root/flipnosis-digitalocean"

echo -e "${YELLOW}📤 Pushing to GitHub...${NC}"
git add .
git commit -m "Auto-deploy: $(date)"
git push origin main

echo -e "${YELLOW}🔧 Deploying to DigitalOcean...${NC}"
ssh $SERVER_USER@$SERVER_IP << 'EOF'
    cd /root/flipnosis-digitalocean
    echo "📥 Pulling latest code..."
    git pull origin main
    
    echo "🐳 Rebuilding containers..."
    cd digitalocean-deploy
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    
    echo "🔧 Running database migration..."
    docker-compose exec app node scripts/migrate-database-schema.js || true
    
    echo "✅ Checking deployment status..."
    docker-compose ps
    
    echo "🎉 Deployment completed!"
EOF

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${YELLOW}🌐 Your app is available at: http://$SERVER_IP${NC}"
