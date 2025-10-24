const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const possibleDbs = ['server/flipz.db', 'database.sqlite', 'dist/server/flipz.db'];

async function fixDatabase(dbPath) {
  if (!fs.existsSync(dbPath)) {
    console.log(`⏭️  Skipping ${dbPath} - not found`);
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

        console.log('   🔧 ADDING flip_balance column...');
        
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
}

main().catch(console.error);

