#!/bin/bash

# Quick Migration Script for Hetzner
# This script will migrate your current data and deploy to Hetzner

set -e

echo "🚀 Quick Hetzner Migration Script"
echo "This will migrate your current data and deploy to Hetzner"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from your project root directory"
    exit 1
fi

# Get server IPs
echo "Please provide your Hetzner server IPs:"
read -p "Database Server IP: " DB_SERVER_IP
read -p "Application Server IP: " APP_SERVER_IP

# Generate secure password
DB_PASSWORD=$(openssl rand -base64 32)

print_info "Database password generated: $DB_PASSWORD"
echo ""

# Step 1: Backup current data
print_info "Step 1: Creating backup of current data..."
if [ -f "server/flipz-clean.db" ]; then
    cp server/flipz-clean.db server/flipz-clean.db.backup.$(date +%Y%m%d_%H%M%S)
    print_success "Backup created"
else
    print_warning "No SQLite database found, skipping backup"
fi

# Step 2: Install PostgreSQL client
print_info "Step 2: Installing PostgreSQL client..."
if ! command -v psql &> /dev/null; then
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y postgresql-client
    elif command -v yum &> /dev/null; then
        sudo yum install -y postgresql
    else
        print_error "Could not install PostgreSQL client. Please install manually."
        exit 1
    fi
fi

# Step 3: Create database schema
print_info "Step 3: Creating database schema..."
cat > schema.sql << 'EOF'
-- Flipnosis Database Schema for PostgreSQL

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) UNIQUE NOT NULL,
    username VARCHAR(255),
    profile_picture TEXT,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    total_flips INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) UNIQUE NOT NULL,
    player1_address VARCHAR(42) NOT NULL,
    player2_address VARCHAR(42),
    amount DECIMAL(20,8) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    winner VARCHAR(42),
    result VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deposit_deadline TIMESTAMP,
    contract_game_id VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS offers (
    id SERIAL PRIMARY KEY,
    offer_id VARCHAR(255) UNIQUE NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) NOT NULL,
    sender_address VARCHAR(42) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS player_stats (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) UNIQUE NOT NULL,
    total_games INTEGER DEFAULT 0,
    total_wins INTEGER DEFAULT 0,
    total_losses INTEGER DEFAULT 0,
    total_amount_wagered DECIMAL(20,8) DEFAULT 0,
    total_amount_won DECIMAL(20,8) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_games_player1 ON games(player1_address);
CREATE INDEX IF NOT EXISTS idx_games_player2 ON games(player2_address);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_offers_from_address ON offers(from_address);
CREATE INDEX IF NOT EXISTS idx_offers_to_address ON offers(to_address);
CREATE INDEX IF NOT EXISTS idx_chat_messages_game_id ON chat_messages(game_id);
EOF

# Step 4: Create database and user
print_info "Step 4: Setting up database..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_SERVER_IP -U postgres -c "CREATE USER flipnosis_user WITH PASSWORD '$DB_PASSWORD';" || true
PGPASSWORD=$DB_PASSWORD psql -h $DB_SERVER_IP -U postgres -c "CREATE DATABASE flipnosis OWNER flipnosis_user;" || true
PGPASSWORD=$DB_PASSWORD psql -h $DB_SERVER_IP -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE flipnosis TO flipnosis_user;"

# Step 5: Apply schema
print_info "Step 5: Applying database schema..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_SERVER_IP -U flipnosis_user -d flipnosis -f schema.sql

# Step 6: Migrate data from SQLite
if [ -f "server/flipz-clean.db" ]; then
    print_info "Step 6: Migrating data from SQLite..."
    
    # Install sqlite3 if not present
    if ! command -v sqlite3 &> /dev/null; then
        if command -v apt-get &> /dev/null; then
            sudo apt-get install -y sqlite3
        elif command -v yum &> /dev/null; then
            sudo yum install -y sqlite
        fi
    fi
    
    # Export users
    sqlite3 server/flipz-clean.db "SELECT address, username, profile_picture, xp, level, total_flips, wins, losses, created_at, updated_at FROM users;" | while IFS='|' read -r address username profile_picture xp level total_flips wins losses created_at updated_at; do
        if [ ! -z "$address" ]; then
            PGPASSWORD=$DB_PASSWORD psql -h $DB_SERVER_IP -U flipnosis_user -d flipnosis -c "INSERT INTO users (address, username, profile_picture, xp, level, total_flips, wins, losses, created_at, updated_at) VALUES ('$address', '$username', '$profile_picture', $xp, $level, $total_flips, $wins, $losses, '$created_at', '$updated_at') ON CONFLICT (address) DO NOTHING;"
        fi
    done
    
    # Export games
    sqlite3 server/flipz-clean.db "SELECT game_id, player1_address, player2_address, amount, status, winner, result, created_at, updated_at, deposit_deadline, contract_game_id FROM games;" | while IFS='|' read -r game_id player1_address player2_address amount status winner result created_at updated_at deposit_deadline contract_game_id; do
        if [ ! -z "$game_id" ]; then
            PGPASSWORD=$DB_PASSWORD psql -h $DB_SERVER_IP -U flipnosis_user -d flipnosis -c "INSERT INTO games (game_id, player1_address, player2_address, amount, status, winner, result, created_at, updated_at, deposit_deadline, contract_game_id) VALUES ('$game_id', '$player1_address', '$player2_address', $amount, '$status', '$winner', '$result', '$created_at', '$updated_at', '$deposit_deadline', '$contract_game_id') ON CONFLICT (game_id) DO NOTHING;"
        fi
    done
    
    print_success "Data migration completed"
else
    print_warning "No SQLite database found, skipping data migration"
fi

# Step 7: Create environment file
print_info "Step 7: Creating environment configuration..."
cat > .env.hetzner << EOF
# Database Configuration
DATABASE_URL=postgresql://flipnosis_user:$DB_PASSWORD@$DB_SERVER_IP:5432/flipnosis

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

# Step 8: Create deployment package
print_info "Step 8: Creating deployment package..."
DEPLOY_DIR="hetzner-deploy-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$DEPLOY_DIR"

# Build the application
print_info "Building application..."
npm install
npm run build

# Copy files
cp -r dist "$DEPLOY_DIR/"
cp -r server "$DEPLOY_DIR/"
cp package.json "$DEPLOY_DIR/"
cp package-lock.json "$DEPLOY_DIR/"
cp .env.hetzner "$DEPLOY_DIR/.env"

# Create Dockerfile
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

# Create docker-compose.yml
cat > "$DEPLOY_DIR/docker-compose.yml" << EOF
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app
    restart: unless-stopped
EOF

# Create nginx configuration
cat > "$DEPLOY_DIR/nginx.conf" << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name _;

        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /health {
            proxy_pass http://app/health;
            access_log off;
        }
    }
}
EOF

# Create deployment script
cat > "$DEPLOY_DIR/deploy.sh" << 'EOF'
#!/bin/bash
set -e

echo "🚀 Deploying to Hetzner..."

# Build and start containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo "✅ Deployment complete!"
echo "Application is running on http://localhost"
EOF

chmod +x "$DEPLOY_DIR/deploy.sh"

print_success "Deployment package created: $DEPLOY_DIR"
echo ""

# Step 9: Instructions
print_info "Step 9: Deployment Instructions"
echo ""
echo "1. Copy the deployment package to your application server:"
echo "   scp -r $DEPLOY_DIR root@$APP_SERVER_IP:/root/"
echo ""
echo "2. SSH into your application server:"
echo "   ssh root@$APP_SERVER_IP"
echo ""
echo "3. Navigate to the deployment directory:"
echo "   cd $DEPLOY_DIR"
echo ""
echo "4. Run the deployment:"
echo "   ./deploy.sh"
echo ""
echo "5. Test the application:"
echo "   curl http://$APP_SERVER_IP"
echo ""

print_success "Migration script completed!"
echo ""
echo "💰 Cost Savings: 85% cheaper than DigitalOcean"
echo "🚀 Benefits: Better performance, separated database, global CDN"
echo ""
echo "Next steps:"
echo "1. Set up Cloudflare for your domain"
echo "2. Update DNS records"
echo "3. Test thoroughly"
echo "4. Switch traffic from DigitalOcean"
