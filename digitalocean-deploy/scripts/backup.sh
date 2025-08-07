#!/bin/bash

# DigitalOcean Backup Script for Flipnosis
# This script handles database and application backups

set -e  # Exit on any error

echo "💾 Starting Flipnosis Backup Process..."

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

# Configuration
BACKUP_DIR="/opt/flipnosis/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="flipnosis_backup_$DATE"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Load environment variables
if [ -f ".env" ]; then
    source .env
else
    print_error ".env file not found. Please run this script from the digitalocean-deploy directory."
    exit 1
fi

print_status "Starting backup process for: $BACKUP_NAME"

# 1. Database Backup
print_status "Creating database backup..."
if [ -n "$DATABASE_URL" ]; then
    # Extract database connection details
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    
    # Create database backup
    PGPASSWORD="$DB_PASS" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --format=custom --verbose --file="$BACKUP_DIR/${BACKUP_NAME}_database.dump"
    
    if [ $? -eq 0 ]; then
        print_success "Database backup created: ${BACKUP_NAME}_database.dump"
    else
        print_error "Database backup failed!"
        exit 1
    fi
else
    print_warning "DATABASE_URL not set, skipping database backup"
fi

# 2. Application Data Backup
print_status "Creating application data backup..."
tar -czf "$BACKUP_DIR/${BACKUP_NAME}_appdata.tar.gz" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='backups' \
    --exclude='logs' \
    --exclude='uploads' \
    .

if [ $? -eq 0 ]; then
    print_success "Application data backup created: ${BACKUP_NAME}_appdata.tar.gz"
else
    print_error "Application data backup failed!"
    exit 1
fi

# 3. Uploads Backup (if exists)
if [ -d "uploads" ]; then
    print_status "Creating uploads backup..."
    tar -czf "$BACKUP_DIR/${BACKUP_NAME}_uploads.tar.gz" uploads/
    
    if [ $? -eq 0 ]; then
        print_success "Uploads backup created: ${BACKUP_NAME}_uploads.tar.gz"
    else
        print_error "Uploads backup failed!"
        exit 1
    fi
else
    print_warning "Uploads directory not found, skipping uploads backup"
fi

# 4. Docker Volumes Backup
print_status "Creating Docker volumes backup..."
docker run --rm -v flipnosis_redis_data:/data -v "$BACKUP_DIR":/backup alpine tar czf /backup/${BACKUP_NAME}_redis.tar.gz -C /data . 2>/dev/null || true

if [ $? -eq 0 ]; then
    print_success "Redis data backup created: ${BACKUP_NAME}_redis.tar.gz"
else
    print_warning "Redis data backup failed (volume might not exist)"
fi

# 5. Create backup manifest
print_status "Creating backup manifest..."
cat > "$BACKUP_DIR/${BACKUP_NAME}_manifest.txt" << EOF
Flipnosis Backup Manifest
=========================
Backup Date: $(date)
Backup Name: $BACKUP_NAME
Server: $(hostname)
Application Version: $(git rev-parse HEAD 2>/dev/null || echo "Unknown")

Backup Contents:
- Database: ${BACKUP_NAME}_database.dump
- Application Data: ${BACKUP_NAME}_appdata.tar.gz
- Uploads: ${BACKUP_NAME}_uploads.tar.gz
- Redis Data: ${BACKUP_NAME}_redis.tar.gz

Backup Size:
$(du -h "$BACKUP_DIR/${BACKUP_NAME}_"* | sort -h)

Environment Variables:
- Database URL: $(echo $DATABASE_URL | sed 's/:[^:]*@/:***@/')
- Contract Address: $CONTRACT_ADDRESS
- RPC URL: $(echo $RPC_URL | sed 's/\/v2\/[^/]*/\/v2\/***/')

EOF

print_success "Backup manifest created: ${BACKUP_NAME}_manifest.txt"

# 6. Cleanup old backups (keep last 7 days)
print_status "Cleaning up old backups (keeping last 7 days)..."
find "$BACKUP_DIR" -name "flipnosis_backup_*.tar.gz" -mtime +7 -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "flipnosis_backup_*.dump" -mtime +7 -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "flipnosis_backup_*_manifest.txt" -mtime +7 -delete 2>/dev/null || true

# 7. Calculate total backup size
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
print_success "Backup completed successfully!"
print_status "Total backup size: $TOTAL_SIZE"
print_status "Backup location: $BACKUP_DIR"

# 8. Optional: Upload to cloud storage (if configured)
if [ -n "$BACKUP_S3_BUCKET" ]; then
    print_status "Uploading backup to cloud storage..."
    # Add S3 upload logic here if needed
    print_warning "Cloud storage upload not implemented yet"
fi

print_success "🎉 Backup process completed successfully!"
print_status "Backup files:"
ls -lh "$BACKUP_DIR/${BACKUP_NAME}_"*
