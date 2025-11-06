#!/bin/bash

echo "Checking database schema..."
echo ""
echo "Columns in battle_royale_games table:"
sqlite3 /opt/flipnosis/app/server/database.sqlite "PRAGMA table_info(battle_royale_games);"

echo ""
echo ""
echo "Expected columns from code:"
echo "id, creator, nft_contract, nft_token_id, nft_name, nft_image, nft_collection, nft_chain, entry_fee, service_fee, max_players, status, creator_participates, game_data, room_type, created_at"

echo ""
echo ""
echo "Testing INSERT with sample data..."
sqlite3 /opt/flipnosis/app/server/database.sqlite << 'EOF'
INSERT INTO battle_royale_games (
  id, creator, nft_contract, nft_token_id, nft_name, nft_image, nft_collection, nft_chain,
  entry_fee, service_fee, max_players, status, creator_participates, game_data, room_type, created_at
) VALUES (
  'test_123', '0xtest', '0xcontract', '1', 'Test NFT', 'http://test.com', 'Test Collection', 'base',
  0.025, 0.50, 8, 'filling', 0, NULL, 'potion', datetime('now')
);
SELECT 'Insert successful!' as result;
DELETE FROM battle_royale_games WHERE id = 'test_123';
EOF

