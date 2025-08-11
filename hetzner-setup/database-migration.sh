#!/bin/bash

# Database Migration Script for Hetzner
# Migrates from SQLite to PostgreSQL

set -e

echo "🗄️  Starting Database Migration to Hetzner PostgreSQL..."

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
DB_HOST="YOUR_DB_SERVER_IP"
DB_NAME="flipnosis"
DB_USER="flipnosis_user"
DB_PASSWORD="YOUR_SECURE_PASSWORD"
SQLITE_DB="server/flipz-clean.db"

# Check if SQLite database exists
if [ ! -f "$SQLITE_DB" ]; then
    print_error "SQLite database not found at $SQLITE_DB"
    exit 1
fi

print_status "Creating backup of current SQLite database..."
cp "$SQLITE_DB" "${SQLITE_DB}.backup.$(date +%Y%m%d_%H%M%S)"

# Install PostgreSQL client if not present
if ! command -v psql &> /dev/null; then
    print_status "Installing PostgreSQL client..."
    sudo apt-get update
    sudo apt-get install -y postgresql-client
fi

# Create database schema
print_status "Creating PostgreSQL database schema..."
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

CREATE TABLE IF NOT EXISTS leaderboard (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) UNIQUE NOT NULL,
    username VARCHAR(255),
    xp INTEGER DEFAULT 0,
    total_flips INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_games_player1 ON games(player1_address);
CREATE INDEX IF NOT EXISTS idx_games_player2 ON games(player2_address);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_offers_from ON offers(from_address);
CREATE INDEX IF NOT EXISTS idx_offers_to ON offers(to_address);
CREATE INDEX IF NOT EXISTS idx_chat_game_id ON chat_messages(game_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_xp ON leaderboard(xp DESC);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EOF

# Apply schema to PostgreSQL
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f schema.sql

print_success "Database schema created successfully!"

# Export SQLite data to CSV
print_status "Exporting SQLite data to CSV format..."
sqlite3 "$SQLITE_DB" << 'EOF'
.mode csv
.headers on
.output users_export.csv
SELECT * FROM users;

.output games_export.csv
SELECT * FROM games;

.output offers_export.csv
SELECT * FROM offers;

.output chat_messages_export.csv
SELECT * FROM chat_messages;

.output leaderboard_export.csv
SELECT * FROM leaderboard;
EOF

print_success "Data exported to CSV files!"

# Import data to PostgreSQL
print_status "Importing data to PostgreSQL..."

# Import users
if [ -f "users_export.csv" ]; then
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "\COPY users FROM 'users_export.csv' WITH CSV HEADER;"
    print_success "Users imported successfully!"
fi

# Import games
if [ -f "games_export.csv" ]; then
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "\COPY games FROM 'games_export.csv' WITH CSV HEADER;"
    print_success "Games imported successfully!"
fi

# Import offers
if [ -f "offers_export.csv" ]; then
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "\COPY offers FROM 'offers_export.csv' WITH CSV HEADER;"
    print_success "Offers imported successfully!"
fi

# Import chat messages
if [ -f "chat_messages_export.csv" ]; then
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "\COPY chat_messages FROM 'chat_messages_export.csv' WITH CSV HEADER;"
    print_success "Chat messages imported successfully!"
fi

# Import leaderboard
if [ -f "leaderboard_export.csv" ]; then
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "\COPY leaderboard FROM 'leaderboard_export.csv' WITH CSV HEADER;"
    print_success "Leaderboard imported successfully!"
fi

# Verify migration
print_status "Verifying migration..."
USER_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;")
GAME_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM games;")

print_success "Migration completed successfully!"
print_status "Users migrated: $USER_COUNT"
print_status "Games migrated: $GAME_COUNT"

# Cleanup
rm -f *.csv

print_success "🗄️  Database migration completed!"
print_status "Next steps:"
print_status "1. Update your application's DATABASE_URL"
print_status "2. Test database connectivity"
print_status "3. Deploy your application to Hetzner"
