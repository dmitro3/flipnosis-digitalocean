#!/bin/bash
cd /root/flipnosis

echo "Backing up database..."
cp database.sqlite database.sqlite.backup.$(date +%Y%m%d_%H%M%S)

echo "Adding missing columns..."
sqlite3 database.sqlite << 'EOF'
ALTER TABLE battle_royale_games ADD COLUMN room_type TEXT DEFAULT 'potion';
ALTER TABLE battle_royale_games ADD COLUMN creator_participates BOOLEAN DEFAULT 0;
ALTER TABLE battle_royale_games ADD COLUMN game_data TEXT;
UPDATE battle_royale_games SET room_type = 'potion' WHERE room_type IS NULL;
UPDATE battle_royale_games SET creator_participates = 0 WHERE creator_participates IS NULL;
EOF

echo "Checking schema..."
sqlite3 database.sqlite "PRAGMA table_info(battle_royale_games);" | grep -E "(room_type|creator_participates|game_data)"

echo "Restarting server..."
pm2 restart flipnosis-server

echo "Done! Showing recent logs..."
pm2 logs --lines 20 --nostream
