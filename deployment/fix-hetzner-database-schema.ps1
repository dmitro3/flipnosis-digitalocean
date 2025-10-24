# Fix Hetzner Database Schema - Add flip_balance column
# This adds the missing flip_balance field to the production database

$SERVER = "root@159.69.242.154"
$REMOTE_DIR = "/root/flipnosis"

Write-Host "🔧 Fixing Hetzner Database Schema..." -ForegroundColor Cyan
Write-Host ""

# Create the fix script
$fixScript = @'
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Find all database files
const possibleDbs = [
  'server/flipz.db',
  'database.sqlite',
  'dist/server/flipz.db'
];

async function fixDatabase(dbPath) {
  if (!fs.existsSync(dbPath)) {
    console.log(`⏭️  Skipping ${dbPath} - file not found`);
    return;
  }

  return new Promise((resolve) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.log(`❌ ${dbPath}: ${err.message}`);
        resolve();
        return;
      }

      console.log(`\n📁 Checking ${dbPath}...`);
      
      db.all("PRAGMA table_info(profiles)", (err, cols) => {
        if (err || !cols || cols.length === 0) {
          console.log('   ⏭️  No profiles table');
          db.close();
          resolve();
          return;
        }

        const columnNames = cols.map(c => c.name);
        const hasFlipBalance = columnNames.includes('flip_balance');
        
        if (hasFlipBalance) {
          console.log('   ✅ Already has flip_balance');
          db.close();
          resolve();
          return;
        }

        console.log('   🔧 Adding flip_balance column...');
        
        db.run("ALTER TABLE profiles ADD COLUMN flip_balance INTEGER DEFAULT 0", (err) => {
          if (err) {
            console.log(`   ❌ Error: ${err.message}`);
            db.close();
            resolve();
            return;
          }
          
          db.run("UPDATE profiles SET flip_balance = xp WHERE xp > 0", function(err) {
            if (err) {
              console.log(`   ❌ Sync error: ${err.message}`);
            } else {
              console.log(`   ✅ Added flip_balance and synced ${this.changes} rows`);
            }
            
            // Also add custom coin fields
            db.run("ALTER TABLE profiles ADD COLUMN custom_coin_heads TEXT", () => {
              db.run("ALTER TABLE profiles ADD COLUMN custom_coin_tails TEXT", () => {
                console.log('   ✅ Added custom coin fields');
                db.close();
                resolve();
              });
            });
          });
        });
      });
    });
  });
}

async function main() {
  console.log('🔧 Fixing Production Database Schema\n');
  
  for (const dbPath of possibleDbs) {
    await fixDatabase(dbPath);
  }
  
  console.log('\n✅ Database schema fix complete!');
  console.log('🔄 Restart the server with: pm2 restart flipnosis');
}

main().catch(console.error);
'@

Write-Host "1️⃣ Creating fix script..." -ForegroundColor Yellow
$fixScript | Out-File -FilePath "fix-db-schema.js" -Encoding UTF8 -NoNewline

Write-Host "2️⃣ Uploading to Hetzner..." -ForegroundColor Yellow
scp fix-db-schema.js "${SERVER}:${REMOTE_DIR}/"

Write-Host "3️⃣ Running fix on server..." -ForegroundColor Yellow
ssh $SERVER "cd $REMOTE_DIR && node fix-db-schema.js"

Write-Host "4️⃣ Cleaning up..." -ForegroundColor Yellow
ssh $SERVER "cd $REMOTE_DIR && rm fix-db-schema.js"
Remove-Item "fix-db-schema.js" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✅ Database schema fixed on Hetzner!" -ForegroundColor Green
Write-Host ""
Write-Host "🔄 Restarting server..." -ForegroundColor Yellow
ssh $SERVER "pm2 restart flipnosis"

Write-Host ""
Write-Host "✅ COMPLETE! Try unlocking a coin now." -ForegroundColor Green
Write-Host ""

