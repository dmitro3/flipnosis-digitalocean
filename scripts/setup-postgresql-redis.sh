#!/bin/bash

# PostgreSQL + Redis Setup Script for Server 116
# This script installs and configures PostgreSQL and Redis for the Flipnosis platform

set -e  # Exit on any error

echo "🚀 Starting PostgreSQL + Redis setup on server 116..."

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

# Check if running as root (allow for migration)
if [[ $EUID -eq 0 ]]; then
   print_warning "Running as root - this is allowed for migration purposes"
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

# Remote connections for Flipnosis
host    flipnosis       flipnosis_user    159.69.242.154/32        md5
host    flipnosis       flipnosis_user    127.0.0.1/32             md5
host    flipnosis       flipnosis_user    ::1/128                  md5
EOF

# Restart PostgreSQL
print_status "Restarting PostgreSQL..."
sudo systemctl restart postgresql

# Test PostgreSQL connection
print_status "Testing PostgreSQL connection..."
if sudo -u postgres psql -d flipnosis -c "SELECT version();" > /dev/null 2>&1; then
    print_success "PostgreSQL setup completed successfully"
else
    print_error "PostgreSQL setup failed"
    exit 1
fi

# ===== REDIS SETUP =====
print_status "Installing Redis..."
sudo apt install -y redis-server

# Configure Redis
print_status "Configuring Redis..."
sudo cp /etc/redis/redis.conf /etc/redis/redis.conf.backup

# Generate a secure Redis password
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Update Redis configuration
sudo tee /etc/redis/redis.conf > /dev/null << EOF
# Redis configuration for Flipnosis
bind 0.0.0.0
port 6379
requirepass $REDIS_PASSWORD
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
lua-time-limit 5000
slowlog-log-slower-than 10000
slowlog-max-len 128
notify-keyspace-events ""
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
list-compress-depth 0
set-max-intset-entries 512
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
activerehashing yes
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit slave 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60
hz 10
aof-rewrite-incremental-fsync yes
EOF

# Start and enable Redis
print_status "Starting Redis service..."
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test Redis connection
print_status "Testing Redis connection..."
if redis-cli -a "$REDIS_PASSWORD" ping | grep -q "PONG"; then
    print_success "Redis setup completed successfully"
else
    print_error "Redis setup failed"
    exit 1
fi

# ===== FIREWALL CONFIGURATION =====
print_status "Configuring firewall for PostgreSQL and Redis..."
sudo ufw allow 5432/tcp comment "PostgreSQL"
sudo ufw allow 6379/tcp comment "Redis"

# ===== CREATE CONFIGURATION FILE =====
print_status "Creating configuration file..."
sudo mkdir -p /opt/flipnosis/config

sudo tee /opt/flipnosis/config/database.conf > /dev/null << EOF
# Database Configuration for Flipnosis
# Generated on $(date)

# PostgreSQL Configuration
POSTGRES_HOST=116.202.24.43
POSTGRES_PORT=5432
POSTGRES_DATABASE=flipnosis
POSTGRES_USER=flipnosis_user
POSTGRES_PASSWORD=xUncTgMpgNtw

# Redis Configuration
REDIS_HOST=116.202.24.43
REDIS_PORT=6379
REDIS_PASSWORD=$REDIS_PASSWORD

# Connection Settings
POSTGRES_MAX_CONNECTIONS=20
POSTGRES_IDLE_TIMEOUT=30000
POSTGRES_CONNECTION_TIMEOUT=2000
EOF

# Set proper permissions
sudo chown -R $USER:$USER /opt/flipnosis/config
sudo chmod 600 /opt/flipnosis/config/database.conf

# ===== INSTALL NODE.JS DEPENDENCIES =====
print_status "Installing Node.js dependencies for database migration..."
cd /opt/flipnosis/app

# Install PostgreSQL and Redis clients
npm install pg redis

# ===== FINAL VERIFICATION =====
print_status "Performing final verification..."

# Test PostgreSQL connection from Node.js
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: '116.202.24.43',
  port: 5432,
  database: 'flipnosis',
  user: 'flipnosis_user',
  password: 'xUncTgMpgNtw'
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('PostgreSQL test failed:', err.message);
    process.exit(1);
  } else {
    console.log('PostgreSQL test successful:', res.rows[0]);
  }
  pool.end();
});
"

# Test Redis connection from Node.js
node -e "
const Redis = require('redis');
const redis = Redis.createClient({
  host: '116.202.24.43',
  port: 6379,
  password: '$REDIS_PASSWORD'
});

redis.connect().then(() => {
  return redis.ping();
}).then((result) => {
  console.log('Redis test successful:', result);
  redis.quit();
}).catch((err) => {
  console.error('Redis test failed:', err.message);
  process.exit(1);
});
"

# ===== SUMMARY =====
print_success "PostgreSQL + Redis setup completed successfully!"
echo ""
echo "📋 Configuration Summary:"
echo "=========================="
echo "PostgreSQL:"
echo "  Host: 116.202.24.43"
echo "  Port: 5432"
echo "  Database: flipnosis"
echo "  User: flipnosis_user"
echo "  Password: xUncTgMpgNtw"
echo ""
echo "Redis:"
echo "  Host: 116.202.24.43"
echo "  Port: 6379"
echo "  Password: $REDIS_PASSWORD"
echo ""
echo "Configuration file: /opt/flipnosis/config/database.conf"
echo ""
echo "🔧 Next steps:"
echo "1. Run the migration script: node scripts/migrate-to-postgresql.js"
echo "2. Update your application code to use PostgreSQL + Redis"
echo "3. Test the new database connections"
echo "4. Deploy the updated application"
echo ""
echo "⚠️  Important: Save the Redis password: $REDIS_PASSWORD"
echo ""
