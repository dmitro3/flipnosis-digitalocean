#!/bin/bash

echo "📁 Database Organization Script"
echo "================================"
echo ""
echo "🔄 This will organize your databases into legacy and backup folders."
echo ""

# Create organization directories
LEGACY_DIR="/root/database-legacy"
BACKUP_DIR="/opt/flipnosis/app/database-backups"
mkdir -p "$LEGACY_DIR"
mkdir -p "$BACKUP_DIR"

echo "✅ Created directories:"
echo "   - $LEGACY_DIR"
echo "   - $BACKUP_DIR"
echo ""

# Move legacy databases to legacy folder
echo "🔄 Moving legacy databases..."
echo ""

if [ -f "/root/deploy-package/server/flipz.db" ]; then
    mv /root/deploy-package/server/flipz.db "$LEGACY_DIR/deploy-package-flipz.db"
    echo "   ✓ Moved /root/deploy-package/server/flipz.db"
fi

if [ -d "/root/flipnosis-digitalocean/server" ]; then
    echo "   Moving flipnosis-digitalocean databases..."
    if [ -f "/root/flipnosis-digitalocean/server/games.db" ]; then
        mv /root/flipnosis-digitalocean/server/games.db "$LEGACY_DIR/digitalocean-games.db"
        echo "      ✓ Moved games.db"
    fi
    if [ -f "/root/flipnosis-digitalocean/server/flipz.db" ]; then
        mv /root/flipnosis-digitalocean/server/flipz.db "$LEGACY_DIR/digitalocean-flipz.db"
        echo "      ✓ Moved flipz.db (1.3 MB - largest with game data)"
    fi
    if [ -f "/root/flipnosis-digitalocean/server/games-v2.db" ]; then
        mv /root/flipnosis-digitalocean/server/games-v2.db "$LEGACY_DIR/digitalocean-games-v2.db"
        echo "      ✓ Moved games-v2.db"
    fi
    if [ -f "/root/flipnosis-digitalocean/server/local-dev.db" ]; then
        mv /root/flipnosis-digitalocean/server/local-dev.db "$LEGACY_DIR/digitalocean-local-dev.db"
        echo "      ✓ Moved local-dev.db"
    fi
fi

if [ -f "/opt/flipnosis/app/flipz.db" ]; then
    mv /opt/flipnosis/app/flipz.db "$LEGACY_DIR/app-flipz.db"
    echo "   ✓ Moved /opt/flipnosis/app/flipz.db (21 tables - users/coins)"
fi

if [ -f "/opt/flipnosis/app/database.db" ]; then
    mv /opt/flipnosis/app/database.db "$LEGACY_DIR/app-database.db"
    echo "   ✓ Moved /opt/flipnosis/app/database.db"
fi

if [ -f "/opt/flipnosis/shared/flipz-clean.db" ]; then
    mv /opt/flipnosis/shared/flipz-clean.db "$LEGACY_DIR/shared-flipz-clean.db"
    echo "   ✓ Moved /opt/flipnosis/shared/flipz-clean.db"
fi

# Move backup files to backup folder
echo ""
echo "🔄 Moving backup files..."
if [ -d "/opt/flipnosis/app/backups" ]; then
    mv /opt/flipnosis/app/backups/*.db "$BACKUP_DIR/" 2>/dev/null
    echo "   ✓ Moved all backup files to $BACKUP_DIR"
fi

echo ""
echo "✅ Organization complete!"
echo ""
echo "📊 Summary:"
echo "   Active database: /opt/flipnosis/app/server/flipz.db"
echo "   Legacy databases: $LEGACY_DIR (8 files)"
echo "   Backup databases: $BACKUP_DIR (7 files)"
echo ""
echo "📁 Legacy databases include:"
echo "   - digitalocean-flipz.db (1.3 MB - old game data)"
echo "   - app-flipz.db (21 tables - old users/coins data)"
echo ""
echo "💡 You can manually review/merge data from legacy databases if needed."
echo "   Or delete the $LEGACY_DIR folder when you're sure you don't need them."
