# Flipnosis Deployment Guide - Database Sync Setup

## Overview

This guide covers deploying Flipnosis with a separate database server setup:
- **Application Server**: `159.69.242.154` (runs the Node.js app)
- **Database Server**: `116.202.24.43` (stores the SQLite database)

## Prerequisites

1. SSH access to both servers
2. Both servers running Ubuntu/Debian
3. Database server has the database file at `/opt/flipnosis/shared/flipz-clean.db`

## Quick Deployment

### Step 1: Set up Database Sync

Run the database sync setup script:

```powershell
.\deployment\setup-database-sync.ps1 -AppServerIP 159.69.242.154 -DbServerIP 116.202.24.43
```

This script will:
- Create a sync script on the app server
- Set up a systemd timer to sync every 5 minutes
- Run an initial sync
- Test the application

### Step 2: Deploy Application

Use the existing deployment script:

```powershell
.\deployment\deploy-hetzner-git-fixed.ps1 "Database sync setup complete"
```

### Step 3: Verify Deployment

Check the deployment status:

```powershell
.\deployment\check-hetzner-status-fixed.ps1 -ServerIP 159.69.242.154
```

## Manual Setup (if automated script fails)

### 1. Create Database Sync Script

SSH into the app server and create the sync script:

```bash
ssh root@159.69.242.154

# Create directories
mkdir -p /opt/flipnosis/app/scripts
mkdir -p /opt/flipnosis/app/server
mkdir -p /opt/flipnosis/app/backups

# Create sync script
cat > /opt/flipnosis/app/scripts/db-sync.sh << 'EOF'
#!/bin/bash
DB_SERVER="116.202.24.43"
REMOTE_DB="/opt/flipnosis/shared/flipz-clean.db"
LOCAL_DB="/opt/flipnosis/app/server/flipz-clean.db"
BACKUP_DIR="/opt/flipnosis/app/backups"

# Create backup
if [ -f $LOCAL_DB ]; then
    cp $LOCAL_DB $BACKUP_DIR/flipz-clean.db.backup.$(date +%Y%m%d_%H%M%S)
fi

# Sync database
scp -o ConnectTimeout=30 root@$DB_SERVER:$REMOTE_DB $LOCAL_DB

if [ $? -eq 0 ]; then
    chmod 644 $LOCAL_DB
    systemctl restart flipnosis-app
    echo "Database sync completed"
else
    echo "Database sync failed"
    exit 1
fi
EOF

chmod +x /opt/flipnosis/app/scripts/db-sync.sh
```

### 2. Set up Systemd Service

Create the systemd service files:

```bash
# Service file
cat > /etc/systemd/system/flipnosis-db-sync.service << 'EOF'
[Unit]
Description=Flipnosis Database Sync
After=network.target

[Service]
Type=oneshot
ExecStart=/opt/flipnosis/app/scripts/db-sync.sh
User=root
WorkingDirectory=/opt/flipnosis/app

[Install]
WantedBy=multi-user.target
EOF

# Timer file
cat > /etc/systemd/system/flipnosis-db-sync.timer << 'EOF'
[Unit]
Description=Flipnosis Database Sync Timer
Requires=flipnosis-db-sync.service

[Timer]
OnBootSec=30sec
OnUnitActiveSec=5min

[Install]
WantedBy=timers.target
EOF

# Enable and start
systemctl daemon-reload
systemctl enable flipnosis-db-sync.timer
systemctl start flipnosis-db-sync.timer
```

### 3. Run Initial Sync

```bash
/opt/flipnosis/app/scripts/db-sync.sh
```

## Configuration Files

### Environment Variables

The application now uses these environment variables:

```bash
# Database path (local copy on app server)
DATABASE_PATH=/opt/flipnosis/app/server/flipz-clean.db

# Contract configuration
CONTRACT_ADDRESS=0x3997F4720B3a515e82d54F30d7CF2993B014eeBE
RPC_URL=https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3

# Server configuration
PORT=3001
NODE_ENV=production
```

### Database Schema

The application now connects to an existing database with the complete schema from `database-master.txt`. The database service no longer creates tables but verifies they exist.

## Monitoring and Maintenance

### Check Sync Status

```bash
# Check timer status
systemctl status flipnosis-db-sync.timer

# Check service logs
journalctl -u flipnosis-db-sync -f

# Check application logs
journalctl -u flipnosis-app -f
```

### Manual Sync

```bash
# Force manual sync
/opt/flipnosis/app/scripts/db-sync.sh

# Check sync result
ls -la /opt/flipnosis/app/server/flipz-clean.db
```

### Database Backups

Backups are automatically created in `/opt/flipnosis/app/backups/` before each sync.

## Troubleshooting

### Common Issues

1. **Sync fails with "Connection refused"**
   - Check SSH connectivity between servers
   - Verify database server is running
   - Check if database file exists on database server

2. **Application can't connect to database**
   - Verify database file exists: `ls -la /opt/flipnosis/app/server/flipz-clean.db`
   - Check file permissions: `chmod 644 /opt/flipnosis/app/server/flipz-clean.db`
   - Restart application: `systemctl restart flipnosis-app`

3. **Missing database fields**
   - The application now uses the complete schema from database-master.txt
   - All required fields are included in INSERT statements
   - Check application logs for specific field errors

### Debug Commands

```bash
# Test database connection
sqlite3 /opt/flipnosis/app/server/flipz-clean.db ".tables"

# Check database schema
sqlite3 /opt/flipnosis/app/server/flipz-clean.db ".schema games"

# Test SSH connection to database server
ssh root@116.202.24.43 "ls -la /opt/flipnosis/shared/flipz-clean.db"

# Check application status
systemctl status flipnosis-app
```

## Security Notes

1. The database server (`116.202.24.43`) is separate from the application server for security
2. Database sync uses SSH with key-based authentication
3. Local database file has restricted permissions (644)
4. Backups are created before each sync

## Performance Considerations

1. Database sync happens every 5 minutes
2. Application restarts after each sync (takes ~10-15 seconds)
3. Consider adjusting sync frequency based on usage patterns
4. Monitor disk space for backup files

## Rollback Procedure

If issues occur, you can rollback:

```bash
# Stop sync service
systemctl stop flipnosis-db-sync.timer

# Restore from backup
cp /opt/flipnosis/app/backups/flipz-clean.db.backup.YYYYMMDD_HHMMSS /opt/flipnosis/app/server/flipz-clean.db

# Restart application
systemctl restart flipnosis-app
```
