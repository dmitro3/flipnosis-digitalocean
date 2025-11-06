#!/bin/bash

echo "Searching all databases for battle_royale_games..."
echo ""

for db in $(find /root /opt -name '*.sqlite' -o -name '*.db' 2>/dev/null); do
    count=$(sqlite3 "$db" "SELECT COUNT(*) FROM battle_royale_games;" 2>/dev/null)
    if [ $? -eq 0 ] && [ -n "$count" ]; then
        size=$(ls -lh "$db" | awk '{print $5}')
        echo "=== $db ==="
        echo "Size: $size"
        echo "Games: $count"
        
        # Check for required columns
        has_room_type=$(sqlite3 "$db" "PRAGMA table_info(battle_royale_games);" 2>/dev/null | grep -c "room_type" || echo "0")
        has_creator=$(sqlite3 "$db" "PRAGMA table_info(battle_royale_games);" 2>/dev/null | grep -c "creator_participates" || echo "0")
        has_game_data=$(sqlite3 "$db" "PRAGMA table_info(battle_royale_games);" 2>/dev/null | grep -c "game_data" || echo "0")
        
        echo "Has room_type: $([ "$has_room_type" -gt 0 ] && echo 'YES' || echo 'NO')"
        echo "Has creator_participates: $([ "$has_creator" -gt 0 ] && echo 'YES' || echo 'NO')"
        echo "Has game_data: $([ "$has_game_data" -gt 0 ] && echo 'YES' || echo 'NO')"
        echo ""
    fi
done

