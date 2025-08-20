# Fix Database Schema - Add Missing Columns
# Usage: .\deployment\fix-database-schema.ps1

param(
    [string]$ServerIP = "159.69.242.154",
    [string]$ServerUser = "root"
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }

Write-Info "Fixing database schema on $ServerIP..."

try {
    # Create database migration script
    $migrationScript = @"
#!/bin/bash
set -e

cd /opt/flipnosis/app/server

echo "Checking current database schema..."

# Use Node.js to run schema migration
node -e "
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./flipz.db');

console.log('Connected to database');

// Check if games table exists and what columns it has
db.all('PRAGMA table_info(games)', (err, columns) => {
  if (err) {
    console.log('Games table does not exist, creating it...');
    
    // Create games table with proper schema
    const createGamesTable = \`
      CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY,
        listing_id TEXT,
        offer_id TEXT,
        blockchain_game_id TEXT UNIQUE,
        creator TEXT NOT NULL,
        challenger TEXT,
        nft_contract TEXT NOT NULL,
        nft_token_id TEXT NOT NULL,
        nft_name TEXT,
        nft_image TEXT,
        nft_collection TEXT,
        final_price REAL NOT NULL,
        coin_data TEXT,
        status TEXT DEFAULT 'waiting_deposits',
        creator_deposited BOOLEAN DEFAULT false,
        challenger_deposited BOOLEAN DEFAULT false,
        deposit_deadline TIMESTAMP,
        winner TEXT,
        game_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    \`;
    
    db.run(createGamesTable, (err) => {
      if (err) {
        console.error('Error creating games table:', err);
        process.exit(1);
      }
      console.log('✅ Games table created successfully');
      db.close();
    });
  } else {
    console.log('Current games table columns:', columns.map(c => c.name));
    
    // Check if listing_id column exists
    const hasListingId = columns.some(col => col.name === 'listing_id');
    
    if (!hasListingId) {
      console.log('Adding missing listing_id column...');
      db.run('ALTER TABLE games ADD COLUMN listing_id TEXT', (err) => {
        if (err) {
          console.error('Error adding listing_id column:', err);
          process.exit(1);
        }
        console.log('✅ Added listing_id column');
        
        // Check for other missing columns
        const hasOfferId = columns.some(col => col.name === 'offer_id');
        if (!hasOfferId) {
          console.log('Adding missing offer_id column...');
          db.run('ALTER TABLE games ADD COLUMN offer_id TEXT', (err) => {
            if (err) {
              console.error('Error adding offer_id column:', err);
              process.exit(1);
            }
            console.log('✅ Added offer_id column');
            db.close();
          });
        } else {
          db.close();
        }
      });
    } else {
      console.log('✅ Database schema is up to date');
      db.close();
    }
  }
});
"

echo "Database schema migration completed"
"@

    # Upload and execute migration script
    $tempScript = [System.IO.Path]::GetTempFileName()
    $migrationScript | Out-File -FilePath $tempScript -Encoding UTF8
    
    & scp $tempScript "${ServerUser}@${ServerIP}:/tmp/migrate-schema.sh"
    & ssh "${ServerUser}@${ServerIP}" "chmod +x /tmp/migrate-schema.sh && /tmp/migrate-schema.sh && rm /tmp/migrate-schema.sh"
    Remove-Item $tempScript -Force

    Write-Ok "Database schema migration completed"

    # Restart application to pick up schema changes
    Write-Info "Restarting application..."
    & ssh "${ServerUser}@${ServerIP}" "systemctl restart flipnosis-app"
    Start-Sleep -Seconds 3

    # Test the fixed endpoint
    Write-Info "Testing fixed endpoint..."
    try {
        [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
        $testResponse = Invoke-WebRequest -Uri "http://$ServerIP/api/health" -UseBasicParsing -TimeoutSec 10
        Write-Ok "Application restarted successfully: $($testResponse.StatusCode)"
    } catch {
        Write-Warn "Application may still be starting up: $($_.Exception.Message)"
    }

    Write-Ok "Database schema fix completed!"
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Try creating a flip again - the database error should be fixed" -ForegroundColor Yellow
    Write-Host "2. The games table now has the proper listing_id column" -ForegroundColor Yellow
    Write-Host "3. Game creation should complete successfully" -ForegroundColor Yellow

} catch {
    Write-Host "Schema migration failed: $($_.Exception.Message)" -ForegroundColor Red
    throw
}
