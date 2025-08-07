#!/bin/bash

# Database Migration Script: Railway to DigitalOcean
# This script helps you migrate your database from Railway to DigitalOcean PostgreSQL

echo "🗄️ Database Migration: Railway to DigitalOcean"
echo "=============================================="

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

# Check if pg_dump is available
if ! command -v pg_dump &> /dev/null; then
    print_error "pg_dump not found. Please install PostgreSQL client tools."
    print_status "On Ubuntu/Debian: sudo apt-get install postgresql-client"
    print_status "On macOS: brew install postgresql"
    print_status "On Windows: Download from https://www.postgresql.org/download/windows/"
    exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    print_error "psql not found. Please install PostgreSQL client tools."
    exit 1
fi

print_status "Step 1: Exporting data from Railway PostgreSQL..."

# Get Railway database URL
read -p "Enter your Railway PostgreSQL DATABASE_URL: " RAILWAY_DB_URL

if [ -z "$RAILWAY_DB_URL" ]; then
    print_error "Railway database URL is required."
    exit 1
fi

# Create backup directory
mkdir -p database-backups
BACKUP_FILE="database-backups/railway-backup-$(date +%Y%m%d-%H%M%S).sql"

# Export data from Railway
print_status "Exporting data to $BACKUP_FILE..."
if pg_dump "$RAILWAY_DB_URL" > "$BACKUP_FILE"; then
    print_success "Database exported successfully!"
    print_status "Backup file: $BACKUP_FILE"
else
    print_error "Failed to export database from Railway."
    exit 1
fi

print_status "Step 2: Importing data to DigitalOcean PostgreSQL..."

# Get DigitalOcean database URL
read -p "Enter your DigitalOcean PostgreSQL DATABASE_URL: " DIGITALOCEAN_DB_URL

if [ -z "$DIGITALOCEAN_DB_URL" ]; then
    print_error "DigitalOcean database URL is required."
    exit 1
fi

# Test connection to DigitalOcean database
print_status "Testing connection to DigitalOcean database..."
if psql "$DIGITALOCEAN_DB_URL" -c "SELECT version();" > /dev/null 2>&1; then
    print_success "Connection to DigitalOcean database successful!"
else
    print_error "Failed to connect to DigitalOcean database."
    print_status "Please check your DATABASE_URL and ensure the database is accessible."
    exit 1
fi

# Import data to DigitalOcean
print_status "Importing data to DigitalOcean..."
if psql "$DIGITALOCEAN_DB_URL" < "$BACKUP_FILE"; then
    print_success "Database imported successfully!"
else
    print_error "Failed to import database to DigitalOcean."
    exit 1
fi

# Verify data
print_status "Step 3: Verifying data migration..."

# Get table count from Railway
RAILWAY_TABLES=$(psql "$RAILWAY_DB_URL" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')

# Get table count from DigitalOcean
DIGITALOCEAN_TABLES=$(psql "$DIGITALOCEAN_DB_URL" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')

print_status "Railway tables: $RAILWAY_TABLES"
print_status "DigitalOcean tables: $DIGITALOCEAN_TABLES"

if [ "$RAILWAY_TABLES" = "$DIGITALOCEAN_TABLES" ]; then
    print_success "✅ Database migration completed successfully!"
    print_status "All tables migrated correctly."
else
    print_warning "⚠️ Table count mismatch. Please verify the migration manually."
fi

print_status "Step 4: Update your application configuration..."

echo ""
print_success "🎉 Database migration completed!"
print_status "Next steps:"
print_status "1. Update your .env file with the new DigitalOcean DATABASE_URL"
print_status "2. Test your application with the new database"
print_status "3. Keep the backup file for safety: $BACKUP_FILE"
print_status ""
print_status "To test the connection, run:"
print_status "psql \"$DIGITALOCEAN_DB_URL\" -c \"SELECT count(*) FROM games;\""
