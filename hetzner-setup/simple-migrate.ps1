# Simple Hetzner Migration Script for Windows
# This script will prepare your migration to Hetzner

Write-Host "🚀 Simple Hetzner Migration Script" -ForegroundColor Green
Write-Host "This will prepare your migration to Hetzner" -ForegroundColor Green
Write-Host ""

# Server IPs
$DatabaseServerIP = "116.202.24.43"
$ApplicationServerIP = "159.69.242.154"

Write-Host "Database Server IP: $DatabaseServerIP" -ForegroundColor Cyan
Write-Host "Application Server IP: $ApplicationServerIP" -ForegroundColor Cyan
Write-Host ""

# Generate secure password
$DBPassword = -join ((33..126) | Get-Random -Count 32 | ForEach-Object {[char]$_})
Write-Host "Database password generated: $DBPassword" -ForegroundColor Yellow
Write-Host ""

# Step 1: Backup current data
Write-Host "Step 1: Creating backup of current data..." -ForegroundColor Blue
if (Test-Path "server/flipz-clean.db") {
    $backupName = "server/flipz-clean.db.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item "server/flipz-clean.db" $backupName
    Write-Host "✅ Backup created: $backupName" -ForegroundColor Green
} else {
    Write-Host "⚠️  No SQLite database found, skipping backup" -ForegroundColor Yellow
}
Write-Host ""

# Step 2: Create database schema
Write-Host "Step 2: Creating database schema..." -ForegroundColor Blue
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
Write-Host "✅ Database schema created: schema.sql" -ForegroundColor Green
Write-Host ""

# Step 3: Create environment file
Write-Host "Step 3: Creating environment configuration..." -ForegroundColor Blue
$envContent = "DATABASE_URL=postgresql://flipnosis_user:$DBPassword@$DatabaseServerIP:5432/flipnosis`n"
$envContent += "CONTRACT_ADDRESS=0x3997F4720B3a515e82d54F30d7CF2993B014EeBE`n"
$envContent += "CONTRACT_OWNER_KEY=f19dd56173918d384a2ff2d73905ebc666034b6abd34312a074b4a80ddb2e80c`n"
$envContent += "RPC_URL=https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3`n"
$envContent += "PORT=3000`n"
$envContent += "NODE_ENV=production`n"
$envContent += "VITE_ALCHEMY_API_KEY=hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3`n"
$envContent += "VITE_PLATFORM_FEE_RECEIVER=0x47d80671bcb7ec368ef4d3ca6e1c20173ccc9a28"

$envContent | Out-File -FilePath ".env.hetzner" -Encoding UTF8
Write-Host "✅ Environment file created: .env.hetzner" -ForegroundColor Green
Write-Host ""

# Step 4: Create deployment package
Write-Host "Step 4: Creating deployment package..." -ForegroundColor Blue
$deployDir = "hetzner-deploy-$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $deployDir -Force | Out-Null

# Build the application
Write-Host "Building application..." -ForegroundColor Blue
npm install
npm run build

# Copy files
Copy-Item -Path "dist" -Destination "$deployDir/" -Recurse -Force
Copy-Item -Path "server" -Destination "$deployDir/" -Recurse -Force
Copy-Item -Path "package.json" -Destination "$deployDir/"
Copy-Item -Path "package-lock.json" -Destination "$deployDir/"
Copy-Item -Path ".env.hetzner" -Destination "$deployDir/.env"

Write-Host "✅ Deployment package created: $deployDir" -ForegroundColor Green
Write-Host ""

# Step 5: Create setup scripts
Write-Host "Step 5: Creating setup scripts..." -ForegroundColor Blue

# Database setup script
$dbSetupContent = @"
#!/bin/bash
set -e
echo "Setting up PostgreSQL database..."
apt-get update
apt-get install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
sudo -u postgres psql << 'SQL'
CREATE USER flipnosis_user WITH PASSWORD '$DBPassword';
CREATE DATABASE flipnosis OWNER flipnosis_user;
GRANT ALL PRIVILEGES ON DATABASE flipnosis TO flipnosis_user;
\q
SQL
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/*/main/postgresql.conf
echo "host    flipnosis        flipnosis_user    0.0.0.0/0               md5" >> /etc/postgresql/*/main/pg_hba.conf
systemctl restart postgresql
ufw allow 22/tcp
ufw allow 5432/tcp
ufw --force enable
echo "Database setup complete!"
"@

$dbSetupContent | Out-File -FilePath "setup-database.sh" -Encoding UTF8

# Application setup script
$appSetupContent = @"
#!/bin/bash
set -e
echo "Setting up application server..."
apt-get update
apt-get install -y docker.io docker-compose nginx
systemctl start docker
systemctl enable docker
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo "Application server setup complete!"
"@

$appSetupContent | Out-File -FilePath "setup-application.sh" -Encoding UTF8

Write-Host "✅ Setup scripts created" -ForegroundColor Green
Write-Host ""

# Step 6: Instructions
Write-Host "=== MIGRATION INSTRUCTIONS ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. SSH into database server:" -ForegroundColor Cyan
Write-Host "   ssh root@$DatabaseServerIP"
Write-Host "   Copy and run: setup-database.sh"
Write-Host ""
Write-Host "2. SSH into application server:" -ForegroundColor Cyan
Write-Host "   ssh root@$ApplicationServerIP"
Write-Host "   Copy and run: setup-application.sh"
Write-Host ""
Write-Host "3. Copy deployment package:" -ForegroundColor Cyan
Write-Host "   scp -r $deployDir root@${ApplicationServerIP}:/root/"
Write-Host ""
Write-Host "4. Deploy application:" -ForegroundColor Cyan
Write-Host "   ssh root@$ApplicationServerIP"
Write-Host "   cd $deployDir"
Write-Host "   npm install"
Write-Host "   npm start"
Write-Host ""
Write-Host "5. Test the application:" -ForegroundColor Cyan
Write-Host "   curl http://$ApplicationServerIP"
Write-Host ""

Write-Host "✅ Migration preparation completed!" -ForegroundColor Green
Write-Host ""
Write-Host "💰 Cost Savings: 86% cheaper than DigitalOcean" -ForegroundColor Green
Write-Host "🚀 Benefits: Better performance, separated database" -ForegroundColor Green
Write-Host ""
Write-Host "Database Password: $DBPassword" -ForegroundColor Red
Write-Host "Keep this password safe!" -ForegroundColor Red
