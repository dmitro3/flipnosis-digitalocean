const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const databases = [
  'server/flipz.db',
  'server/games.db', 
  'database.sqlite',
  'references/flipz.db'
];

async function checkDatabase(dbPath) {
  return new Promise((resolve) => {
    if (!fs.existsSync(dbPath)) {
      console.log(`❌ Database not found: ${dbPath}`);
      resolve({ path: dbPath, exists: false });
      return;
    }

    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.log(`❌ Error opening ${dbPath}:`, err.message);
        resolve({ path: dbPath, exists: true, error: err.message });
        return;
      }

      // Check if games table exists
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='games'", (err, row) => {
        if (err || !row) {
          console.log(`❌ No games table in ${dbPath}`);
          db.close();
          resolve({ path: dbPath, exists: true, hasGamesTable: false });
          return;
        }

        // Count games
        db.get("SELECT COUNT(*) as count FROM games", (err, gameRow) => {
          if (err) {
            console.log(`❌ Error counting games in ${dbPath}:`, err.message);
            db.close();
            resolve({ path: dbPath, exists: true, hasGamesTable: true, error: err.message });
            return;
          }

          const gameCount = gameRow.count;
          console.log(`✅ ${dbPath}: ${gameCount} games`);
          
          // Get file stats
          const stats = fs.statSync(dbPath);
          console.log(`   Size: ${stats.size} bytes, Modified: ${stats.mtime}`);
          
          db.close();
          resolve({ 
            path: dbPath, 
            exists: true, 
            hasGamesTable: true, 
            gameCount: gameCount,
            size: stats.size,
            modified: stats.mtime
          });
        });
      });
    });
  });
}

async function main() {
  console.log('🔍 Checking all database files...\n');
  
  const results = [];
  for (const dbPath of databases) {
    const result = await checkDatabase(dbPath);
    results.push(result);
  }
  
  console.log('\n📊 Summary:');
  const validDatabases = results.filter(r => r.exists && r.hasGamesTable && r.gameCount > 0);
  
  if (validDatabases.length === 0) {
    console.log('❌ No databases found with games!');
  } else {
    validDatabases.sort((a, b) => b.gameCount - a.gameCount);
    console.log('\n🎮 Databases with games (sorted by game count):');
    validDatabases.forEach(db => {
      console.log(`  ${db.path}: ${db.gameCount} games (${db.size} bytes, ${db.modified})`);
    });
  }
}

main().catch(console.error);
