# Fix Battle Royale database schema
Write-Host "Fixing Battle Royale database schema..."

# Connect to the server and run the migration
$serverCommand = @"
cd /opt/flipnosis/app
sqlite3 server/flipz.db "ALTER TABLE battle_royale_games ADD COLUMN creator_participates BOOLEAN DEFAULT 0;"
sqlite3 server/flipz.db "UPDATE battle_royale_games SET max_players = 6 WHERE max_players = 8;"
sqlite3 server/flipz.db "SELECT sql FROM sqlite_master WHERE type='table' AND name='battle_royale_games';"
"@

Write-Host "Running database migration on server..."
Write-Host "Command: $serverCommand"

# Note: This would need to be run on the actual server
Write-Host "Please run the following commands on the server:"
Write-Host "ssh root@159.69.242.154"
Write-Host "cd /opt/flipnosis/app"
Write-Host "sqlite3 server/flipz.db \"ALTER TABLE battle_royale_games ADD COLUMN creator_participates BOOLEAN DEFAULT 0;\""
Write-Host "sqlite3 server/flipz.db \"UPDATE battle_royale_games SET max_players = 6 WHERE max_players = 8;\""
