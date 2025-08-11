# Windows-Compatible Hetzner Migration Script
# This script will migrate your current data and deploy to Hetzner

param(
    [string]$DatabaseServerIP = "116.202.24.43",
    [string]$ApplicationServerIP = "159.69.242.154"
)

Write-Host "🚀 Windows Hetzner Migration Script" -ForegroundColor Green
Write-Host "This will migrate your current data and deploy to Hetzner" -ForegroundColor Green
Write-Host ""

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor $Blue
}

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Error "Please run this script from your project root directory"
    exit 1
}

Write-Info "Found package.json - we're in the right directory"
Write-Host ""

# Generate secure password
$DBPassword = -join ((33..126) | Get-Random -Count 32 | ForEach-Object {[char]$_})
Write-Info "Database password generated: $DBPassword"
Write-Host ""

# Step 1: Backup current data
Write-Info "Step 1: Creating backup of current data..."
if (Test-Path "server/flipz-clean.db") {
    $backupName = "server/flipz-clean.db.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item "server/flipz-clean.db" $backupName
    Write-Success "Backup created: $backupName"
} else {
    Write-Warning "No SQLite database found, skipping backup"
}
Write-Host ""

# Step 2: Create database schema
Write-Info "Step 2: Creating database schema..."
$schemaSQL = @"
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
"@

$schemaSQL | Out-File -FilePath "schema.sql" -Encoding UTF8
Write-Success "Database schema created: schema.sql"
Write-Host ""

# Step 3: Create environment file
Write-Info "Step 3: Creating environment configuration..."
$envContent = @"
# Database Configuration
DATABASE_URL=postgresql://flipnosis_user:$DBPassword@$DatabaseServerIP:5432/flipnosis

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
"@

$envContent | Out-File -FilePath ".env.hetzner" -Encoding UTF8
Write-Success "Environment file created: .env.hetzner"
Write-Host ""

# Step 4: Create deployment package
Write-Info "Step 4: Creating deployment package..."
$deployDir = "hetzner-deploy-$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $deployDir -Force | Out-Null

# Build the application
Write-Info "Building application..."
npm install
npm run build

# Copy files
Copy-Item -Path "dist" -Destination "$deployDir/" -Recurse -Force
Copy-Item -Path "server" -Destination "$deployDir/" -Recurse -Force
Copy-Item -Path "package.json" -Destination "$deployDir/"
Copy-Item -Path "package-lock.json" -Destination "$deployDir/"
Copy-Item -Path ".env.hetzner" -Destination "$deployDir/.env"

# Create Dockerfile
$dockerfileContent = @"
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
"@

$dockerfileContent | Out-File -FilePath "$deployDir/Dockerfile" -Encoding UTF8

# Create docker-compose.yml
$dockerComposeContent = @"
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
"@

$dockerComposeContent | Out-File -FilePath "$deployDir/docker-compose.yml" -Encoding UTF8

# Create nginx configuration
$nginxContent = @"
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
            proxy_set_header Host `$host;
            proxy_set_header X-Real-IP `$remote_addr;
            proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto `$scheme;
        }

        location /health {
            proxy_pass http://app/health;
            access_log off;
        }
    }
}
"@

$nginxContent | Out-File -FilePath "$deployDir/nginx.conf" -Encoding UTF8

# Create deployment script
$deployScriptContent = @"
#!/bin/bash
set -e

echo "🚀 Deploying to Hetzner..."

# Build and start containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo "✅ Deployment complete!"
echo "Application is running on http://localhost"
"@

$deployScriptContent | Out-File -FilePath "$deployDir/deploy.sh" -Encoding UTF8

Write-Success "Deployment package created: $deployDir"
Write-Host ""

# Step 5: Create database setup script
Write-Info "Step 5: Creating database setup script..."
$dbSetupContent = @"
#!/bin/bash
# Database setup script for Hetzner

set -e

echo "🗄️  Setting up PostgreSQL database..."

# Update system
apt-get update
apt-get upgrade -y

# Install PostgreSQL
apt-get install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create database user and database
sudo -u postgres psql << 'SQL'
CREATE USER flipnosis_user WITH PASSWORD '$DBPassword';
CREATE DATABASE flipnosis OWNER flipnosis_user;
GRANT ALL PRIVILEGES ON DATABASE flipnosis TO flipnosis_user;
\q
SQL

# Configure PostgreSQL for remote connections
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/*/main/postgresql.conf

# Configure pg_hba.conf for remote connections
echo "host    flipnosis        flipnosis_user    0.0.0.0/0               md5" >> /etc/postgresql/*/main/pg_hba.conf

# Restart PostgreSQL
systemctl restart postgresql

# Configure firewall
ufw allow 22/tcp
ufw allow 5432/tcp
ufw --force enable

echo "✅ Database server setup complete!"
echo "Database: flipnosis"
echo "User: flipnosis_user"
echo "Password: $DBPassword"
echo "Port: 5432"
"@

$dbSetupContent | Out-File -FilePath "setup-database.sh" -Encoding UTF8
Write-Success "Database setup script created: setup-database.sh"
Write-Host ""

# Step 6: Create application setup script
Write-Info "Step 6: Creating application setup script..."
$appSetupContent = @"
#!/bin/bash
# Application setup script for Hetzner

set -e

echo "🚀 Setting up application server..."

# Update system
apt-get update
apt-get upgrade -y

# Install Docker
apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \$(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install nginx
apt-get install -y nginx

# Configure firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "✅ Application server setup complete!"
"@

$appSetupContent | Out-File -FilePath "setup-application.sh" -Encoding UTF8
Write-Success "Application setup script created: setup-application.sh"
Write-Host ""

# Step 7: Instructions
Write-Info "Step 7: Migration Instructions"
Write-Host ""
Write-Host "Now follow these steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. SSH into database server:" -ForegroundColor Cyan
Write-Host "   ssh root@$DatabaseServerIP"
Write-Host "   Copy and run: setup-database.sh"
Write-Host ""
Write-Host "2. SSH into application server:" -ForegroundColor Cyan
Write-Host "   ssh root@$ApplicationServerIP"
Write-Host "   Copy and run: setup-application.sh"
Write-Host ""
Write-Host "3. Copy the deployment package to your application server:" -ForegroundColor Cyan
Write-Host "   scp -r $deployDir root@$ApplicationServerIP:/root/"
Write-Host ""
Write-Host "4. SSH into application server and deploy:" -ForegroundColor Cyan
Write-Host "   ssh root@$ApplicationServerIP"
Write-Host "   cd $deployDir"
Write-Host "   chmod +x deploy.sh"
Write-Host "   ./deploy.sh"
Write-Host ""
Write-Host "5. Test the application:" -ForegroundColor Cyan
Write-Host "   curl http://$ApplicationServerIP"
Write-Host ""

Write-Success "Migration script completed!"
Write-Host ""
Write-Host "💰 Cost Savings: 86% cheaper than DigitalOcean" -ForegroundColor Green
Write-Host "🚀 Benefits: Better performance, separated database, global CDN" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Set up Cloudflare for your domain"
Write-Host "2. Update DNS records"
Write-Host "3. Test thoroughly"
Write-Host "4. Switch traffic from DigitalOcean"
Write-Host ""
Write-Host "Database Password: $DBPassword" -ForegroundColor Red
Write-Host "Keep this password safe!" -ForegroundColor Red
