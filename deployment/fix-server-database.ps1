# Fix Battle Royale Database on Hetzner Server
# This script adds missing columns to the database

$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Fail([string]$msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

$ServerIP = "159.69.204.247"

Write-Info "Connecting to server $ServerIP..."

# Create a temporary script on the server
$fixScript = @'
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
'@

Write-Info "Uploading fix script..."
$fixScript | Out-File -FilePath "temp-fix-db.sh" -Encoding UTF8

try {
    # Upload the script
    scp temp-fix-db.sh "root@${ServerIP}:/tmp/fix-db.sh"
    
    # Execute it
    Write-Info "Running database fix on server..."
    ssh "root@$ServerIP" "chmod +x /tmp/fix-db.sh && /tmp/fix-db.sh"
    
    Write-Ok "Database fixed successfully!"
    
    # Clean up
    Remove-Item temp-fix-db.sh -ErrorAction SilentlyContinue
    ssh "root@$ServerIP" "rm /tmp/fix-db.sh" -ErrorAction SilentlyContinue
    
    Write-Ok "All done! Try creating a battle royale now."
    
} catch {
    Write-Fail "Error: $($_.Exception.Message)"
    Remove-Item temp-fix-db.sh -ErrorAction SilentlyContinue
    throw
}

