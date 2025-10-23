# Safe Database Migration - Add Withdrawal Tracking Columns
# This script ONLY ADDS columns, never deletes data
# Usage: .\deployment\migrate-withdrawal-tracking.ps1

param(
    [string]$ServerIP = "159.69.242.154",
    [string]$ServerUser = "root"
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Error([string]$msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }

Write-Info "Starting SAFE withdrawal tracking migration on $ServerIP..."
Write-Warn "This will ADD columns to battle_royale_games table without deleting any data"

try {
    # Create SAFE migration script
    $migrationScript = @"
#!/bin/bash
set -e

cd /opt/flipnosis/app/server

echo "====== SAFE DATABASE MIGRATION: WITHDRAWAL TRACKING ======"
echo "This script ONLY ADDS columns. It never deletes data."
echo ""

# Count games BEFORE migration
GAME_COUNT_BEFORE=`sqlite3 flipz.db "SELECT COUNT(*) FROM battle_royale_games" 2>/dev/null || echo "0"`
echo "✓ Current Battle Royale games count: `$GAME_COUNT_BEFORE"

# Create backup FIRST
BACKUP_NAME="flipz_backup_withdrawal_`date +%Y%m%d_%H%M%S`.db"
echo "Creating backup: `$BACKUP_NAME..."
cp flipz.db "`$BACKUP_NAME"
echo "✓ Backup created: `$BACKUP_NAME"
echo ""

# Run safe migration using Node.js
echo "Running safe column additions..."
node -e "
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./flipz.db');

db.serialize(() => {
  console.log('Connected to database');

  // Check if battle_royale_games table exists
  db.get('SELECT name FROM sqlite_master WHERE type=\"table\" AND name=\"battle_royale_games\"', (err, result) => {
    if (err || !result) {
      console.error('❌ battle_royale_games table does not exist!');
      process.exit(1);
    }

    console.log('✓ battle_royale_games table found');

    // Get current columns
    db.all('PRAGMA table_info(battle_royale_games)', (err, columns) => {
      if (err) {
        console.error('❌ Error reading table schema:', err);
        process.exit(1);
      }

      console.log('Current columns:', columns.map(c => c.name).join(', '));

      const existingColumns = columns.map(c => c.name);
      const columnsToAdd = [
        { name: 'nft_withdrawn', type: 'BOOLEAN DEFAULT FALSE' },
        { name: 'creator_funds_withdrawn', type: 'BOOLEAN DEFAULT FALSE' },
        { name: 'nft_withdrawn_at', type: 'TIMESTAMP' },
        { name: 'creator_funds_withdrawn_at', type: 'TIMESTAMP' },
        { name: 'nft_withdrawn_tx_hash', type: 'TEXT' },
        { name: 'creator_funds_withdrawn_tx_hash', type: 'TEXT' }
      ];

      let addedCount = 0;
      let skippedCount = 0;

      function addColumn(index) {
        if (index >= columnsToAdd.length) {
          console.log('');
          console.log(\`✅ Migration complete! Added: \${addedCount}, Skipped (already exist): \${skippedCount}\`);
          db.close();
          return;
        }

        const col = columnsToAdd[index];
        if (existingColumns.includes(col.name)) {
          console.log(\`  ⊙ Column '\${col.name}' already exists - skipping\`);
          skippedCount++;
          addColumn(index + 1);
        } else {
          const sql = \`ALTER TABLE battle_royale_games ADD COLUMN \${col.name} \${col.type}\`;
          db.run(sql, (err) => {
            if (err) {
              console.error(\`❌ Error adding column '\${col.name}':\`, err);
              process.exit(1);
            }
            console.log(\`  ✓ Added column: \${col.name}\`);
            addedCount++;
            addColumn(index + 1);
          });
        }
      }

      addColumn(0);
    });
  });
});
"

echo ""
echo "Verifying data integrity..."

# Count games AFTER migration
GAME_COUNT_AFTER=`sqlite3 flipz.db "SELECT COUNT(*) FROM battle_royale_games"`
echo "✓ Battle Royale games count after migration: `$GAME_COUNT_AFTER"

# Verify counts match
if [ "`$GAME_COUNT_BEFORE" != "`$GAME_COUNT_AFTER" ]; then
    echo "❌ ERROR: Game count mismatch! Before: `$GAME_COUNT_BEFORE, After: `$GAME_COUNT_AFTER"
    echo "❌ Restoring from backup..."
    cp "`$BACKUP_NAME" flipz.db
    echo "✓ Database restored from backup"
    exit 1
fi

echo ""
echo "====== MIGRATION SUCCESSFUL ======"
echo "✓ All `$GAME_COUNT_AFTER games preserved"
echo "✓ New withdrawal tracking columns added"
echo "✓ Backup saved as: `$BACKUP_NAME"
echo ""
"@

    # Upload and execute migration script
    Write-Info "Uploading migration script to server..."
    $tempScript = [System.IO.Path]::GetTempFileName()
    $migrationScript | Out-File -FilePath $tempScript -Encoding UTF8 -NoNewline
    
    & scp $tempScript "${ServerUser}@${ServerIP}:/tmp/migrate-withdrawal.sh"
    if ($LASTEXITCODE -ne 0) { throw "Failed to upload migration script" }
    
    Write-Ok "Migration script uploaded"
    
    # Execute migration
    Write-Info "Executing migration (this is SAFE - only adds columns, never deletes)..."
    & ssh "${ServerUser}@${ServerIP}" "chmod +x /tmp/migrate-withdrawal.sh && /tmp/migrate-withdrawal.sh"
    
    if ($LASTEXITCODE -ne 0) { 
        throw "Migration failed! Check the output above. Database backup was created automatically." 
    }
    
    # Clean up temp script on server
    & ssh "${ServerUser}@${ServerIP}" "rm /tmp/migrate-withdrawal.sh"
    Remove-Item $tempScript -Force
    
    Write-Ok "Migration executed successfully!"
    
    # Verify the new columns were added
    Write-Info "Verifying new columns..."
    & ssh "${ServerUser}@${ServerIP}" "cd /opt/flipnosis/app/server && sqlite3 flipz.db \"PRAGMA table_info(battle_royale_games)\" | grep -E 'nft_withdrawn|creator_funds_withdrawn'"
    
    Write-Ok "All withdrawal tracking columns are present!"
    
    Write-Host ""
    Write-Host "====== MIGRATION COMPLETE ======" -ForegroundColor Green
    Write-Host "✓ Database backed up automatically" -ForegroundColor Green
    Write-Host "✓ New withdrawal tracking columns added" -ForegroundColor Green
    Write-Host "✓ All existing game data preserved" -ForegroundColor Green
    Write-Host "✓ No restart required - changes are immediate" -ForegroundColor Green
    Write-Host ""
    Write-Info "You can now use the withdrawal features in the profile page!"

} catch {
    Write-Error "Migration failed: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "IMPORTANT: A database backup was created on the server" -ForegroundColor Yellow
    Write-Host "If anything went wrong, the backup can be restored" -ForegroundColor Yellow
    Write-Host "Location: /opt/flipnosis/app/server/flipz_backup_withdrawal_*.db" -ForegroundColor Yellow
    throw
}

