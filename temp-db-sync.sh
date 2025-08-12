#!/bin/bash
# Database synchronization script for Flipnosis
# Syncs database from database server to application server

DB_SERVER="116.202.24.43"
REMOTE_DB="/opt/flipnosis/shared/flipz-clean.db"
LOCAL_DB="/opt/flipnosis/shared/flipz-clean.db"

# Create local directory
mkdir -p /opt/flipnosis/shared

# Use sshpass to copy database from database server  
sshpass -p 'xUncTgMpgNtw' scp -o StrictHostKeyChecking=no root@$DB_SERVER:$REMOTE_DB $LOCAL_DB

# Set permissions
chmod 644 $LOCAL_DB

echo "Database synchronized from $DB_SERVER at $(date)"
