#!/bin/bash

# Fresh PostgreSQL + Redis Setup Script
# This script sets up a new PostgreSQL + Redis environment from scratch

set -e  # Exit on any error

echo "🚀 Starting fresh PostgreSQL + Redis setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if running as root (allow for setup)
if [[ $EUID -eq 0 ]]; then
   print_warning "Running as root - this is allowed for setup purposes"
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# ===== POSTGRESQL SETUP =====
print_status "Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
print_status "Starting PostgreSQL service..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
print_status "Setting up PostgreSQL database and user..."
sudo -u postgres psql << EOF
CREATE DATABASE flipnosis;
CREATE USER flipnosis_user WITH ENCRYPTED PASSWORD 'xUncTgMpgNtw';
GRANT ALL PRIVILEGES ON DATABASE flipnosis TO flipnosis_user;
ALTER USER flipnosis_user CREATEDB;
\q
EOF

# Configure PostgreSQL for remote connections
print_status "Configuring PostgreSQL for remote connections..."

# Find PostgreSQL version and config directory
PG_VERSION=$(sudo -u postgres psql -t -c "SHOW server_version;" | xargs)
PG_CONFIG_DIR="/etc/postgresql/$PG_VERSION/main"

print_status "PostgreSQL version: $PG_VERSION"
print_status "Config directory: $PG_CONFIG_DIR"

# Backup original config files
sudo cp $PG_CONFIG_DIR/postgresql.conf $PG_CONFIG_DIR/postgresql.conf.backup
sudo cp $PG_CONFIG_DIR/pg_hba.conf $PG_CONFIG_DIR/pg_hba.conf.backup

# Configure postgresql.conf for remote connections
sudo tee -a $PG_CONFIG_DIR/postgresql.conf > /dev/null << EOF

# Remote connection settings
listen_addresses = '*'
max_connections = 100
shared_buffers = 128MB
effective_cache_size = 256MB
work_mem = 4MB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 4MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
min_wal_size = 1GB
max_wal_size = 4GB
max_worker_processes = 8
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
max_parallel_maintenance_workers = 4
EOF

# Configure pg_hba.conf for authentication
sudo tee -a $PG_CONFIG_DIR/pg_hba.conf > /dev/null << EOF

# Allow remote connections from platform server
host    flipnosis         flipnosis_user     159.69.242.154/32        md5
host    all               all                0.0.0.0/0                md5
EOF

# Restart PostgreSQL to apply changes
print_status "Restarting PostgreSQL to apply configuration..."
sudo systemctl restart postgresql

# ===== REDIS SETUP =====
print_status "Installing Redis..."
sudo apt install -y redis-server

# Configure Redis
print_status "Configuring Redis..."
sudo cp /etc/redis/redis.conf /etc/redis/redis.conf.backup

# Generate Redis password
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Update Redis configuration
sudo sed -i 's/# requirepass foobared/requirepass '"$REDIS_PASSWORD"'/' /etc/redis/redis.conf
sudo sed -i 's/bind 127.0.0.1/bind 0.0.0.0/' /etc/redis/redis.conf
sudo sed -i 's/# maxmemory <bytes>/maxmemory 256mb/' /etc/redis/redis.conf
sudo sed -i 's/# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf

# Start and enable Redis
print_status "Starting Redis service..."
sudo systemctl start redis-server
sudo systemctl enable redis-server

# ===== FIREWALL SETUP =====
print_status "Configuring firewall..."
sudo ufw allow 5432/tcp comment "PostgreSQL"
sudo ufw allow 6379/tcp comment "Redis"

# ===== CREATE DATABASE SCHEMA =====
print_status "Creating database schema..."

# Create the database schema based on the existing SQLite structure
sudo -u postgres psql -d flipnosis << EOF
-- Games table
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) UNIQUE NOT NULL,
    contract_address VARCHAR(255),
    player1_address VARCHAR(255),
    player2_address VARCHAR(255),
    player1_choice VARCHAR(50),
    player2_choice VARCHAR(50),
    player1_deposit DECIMAL(20,8),
    player2_deposit DECIMAL(20,8),
    total_pot DECIMAL(20,8),
    winner_address VARCHAR(255),
    status VARCHAR(50) DEFAULT 'waiting',
    chain VARCHAR(50) DEFAULT 'base',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deposit_deadline TIMESTAMP,
    game_start_time TIMESTAMP,
    game_end_time TIMESTAMP,
    platform_fee DECIMAL(20,8) DEFAULT 0,
    winner_amount DECIMAL(20,8),
    loser_amount DECIMAL(20,8),
    transaction_hash VARCHAR(255),
    block_number INTEGER,
    gas_used INTEGER,
    gas_price DECIMAL(20,8),
    eth_amount DECIMAL(20,8)
);

-- Profiles table
CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    address VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    total_games INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    total_winnings DECIMAL(20,8) DEFAULT 0,
    total_deposits DECIMAL(20,8) DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    xp_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP,
    theme VARCHAR(50) DEFAULT 'default',
    notifications_enabled BOOLEAN DEFAULT true,
    email VARCHAR(255),
    discord_id VARCHAR(255),
    twitter_handle VARCHAR(255)
);

-- Chat messages table
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(255) NOT NULL,
    sender_address VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'chat',
    message_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User presence table
CREATE TABLE user_presence (
    id SERIAL PRIMARY KEY,
    address VARCHAR(255) NOT NULL,
    room_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'online',
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    socket_id VARCHAR(255)
);

-- Offers table
CREATE TABLE offers (
    id SERIAL PRIMARY KEY,
    listing_id VARCHAR(255) NOT NULL,
    offerer_address VARCHAR(255) NOT NULL,
    offer_amount DECIMAL(20,8) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    rejected_at TIMESTAMP
);

-- Listings table
CREATE TABLE listings (
    id SERIAL PRIMARY KEY,
    listing_id VARCHAR(255) UNIQUE NOT NULL,
    seller_address VARCHAR(255) NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    item_data JSONB,
    price DECIMAL(20,8) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sold_at TIMESTAMP
);

-- Transactions table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    transaction_hash VARCHAR(255) UNIQUE NOT NULL,
    from_address VARCHAR(255) NOT NULL,
    to_address VARCHAR(255),
    amount DECIMAL(20,8) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    block_number INTEGER,
    gas_used INTEGER,
    gas_price DECIMAL(20,8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    game_id VARCHAR(255),
    contract_address VARCHAR(255)
);

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    address VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    read BOOLEAN DEFAULT false,
    data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_games_game_id ON games(game_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_chain ON games(chain);
CREATE INDEX idx_games_player1 ON games(player1_address);
CREATE INDEX idx_games_player2 ON games(player2_address);
CREATE INDEX idx_profiles_address ON profiles(address);
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_user_presence_address ON user_presence(address);
CREATE INDEX idx_user_presence_room_id ON user_presence(room_id);
CREATE INDEX idx_offers_listing_id ON offers(listing_id);
CREATE INDEX idx_offers_offerer ON offers(offerer_address);
CREATE INDEX idx_listings_seller ON listings(seller_address);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_transactions_hash ON transactions(transaction_hash);
CREATE INDEX idx_transactions_from ON transactions(from_address);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_notifications_address ON notifications(address);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Grant permissions to flipnosis_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO flipnosis_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO flipnosis_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO flipnosis_user;

\q
EOF

# ===== CREATE CONFIGURATION FILE =====
print_status "Creating configuration file..."
sudo mkdir -p /opt/flipnosis/config

sudo tee /opt/flipnosis/config/database.conf > /dev/null << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=flipnosis
DB_USER=flipnosis_user
DB_PASSWORD=xUncTgMpgNtw

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=$REDIS_PASSWORD
REDIS_DB=0

# Connection URLs
DATABASE_URL=postgresql://flipnosis_user:xUncTgMpgNtw@localhost:5432/flipnosis
REDIS_URL=redis://:$REDIS_PASSWORD@localhost:6379/0
EOF

# Set proper permissions
sudo chmod 644 /opt/flipnosis/config/database.conf

print_success "Database schema created successfully!"

# ===== VERIFY SETUP =====
print_status "Verifying setup..."

# Test PostgreSQL connection
if sudo -u postgres psql -d flipnosis -c "SELECT COUNT(*) FROM games;" > /dev/null 2>&1; then
    print_success "PostgreSQL connection verified"
else
    print_error "PostgreSQL connection failed"
    exit 1
fi

# Test Redis connection
if redis-cli -a "$REDIS_PASSWORD" ping > /dev/null 2>&1; then
    print_success "Redis connection verified"
else
    print_error "Redis connection failed"
    exit 1
fi

# ===== FINAL SUMMARY =====
print_success "🎉 Fresh PostgreSQL + Redis setup completed successfully!"
echo ""
echo "📋 Setup Summary:"
echo "================="
echo "✅ PostgreSQL installed and configured"
echo "✅ Redis installed and configured"
echo "✅ Database schema created"
echo "✅ Firewall rules configured"
echo "✅ Configuration file created"
echo ""
echo "🔧 Database Details:"
echo "- Host: localhost"
echo "- Port: 5432"
echo "- Database: flipnosis"
echo "- User: flipnosis_user"
echo "- Password: xUncTgMpgNtw"
echo ""
echo "🔧 Redis Details:"
echo "- Host: localhost"
echo "- Port: 6379"
echo "- Password: $REDIS_PASSWORD"
echo ""
echo "📁 Configuration file: /opt/flipnosis/config/database.conf"
echo ""
echo "⚠️  Next steps:"
echo "1. Update your application to use the new database configuration"
echo "2. Install pg and redis npm packages"
echo "3. Update your database service to connect to PostgreSQL + Redis"
echo ""
