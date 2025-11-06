#!/bin/bash

echo "=== Checking /opt/flipnosis/app/server/database.sqlite ==="
sqlite3 /opt/flipnosis/app/server/database.sqlite "PRAGMA table_info(battle_royale_games);" 2>/dev/null | grep -E "room_type|creator_participates|game_data" || echo "Columns NOT found or table doesn't exist"

echo ""
echo "=== Checking /root/flipnosis/server/database.sqlite ==="
sqlite3 /root/flipnosis/server/database.sqlite "PRAGMA table_info(battle_royale_games);" 2>/dev/null | grep -E "room_type|creator_participates|game_data" || echo "Columns NOT found or table doesn't exist"

echo ""
echo "=== Checking /root/database.sqlite ==="
sqlite3 /root/database.sqlite "PRAGMA table_info(battle_royale_games);" 2>/dev/null | grep -E "room_type|creator_participates|game_data" || echo "Columns NOT found or table doesn't exist"

echo ""
echo "=== Checking /root/flipz.db ==="
sqlite3 /root/flipz.db "PRAGMA table_info(battle_royale_games);" 2>/dev/null | grep -E "room_type|creator_participates|game_data" || echo "Columns NOT found or table doesn't exist"

