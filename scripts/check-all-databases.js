const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('🔍 Checking All Database Files...');
console.log('==================================');

// List of possible database files to check
const possibleDbs = [
  'database.sqlite',
  'server/flipz.db',
  'server/games.db',
  'dist/server/flipz.db'
];

async function checkDatabase(dbPath) {
  if (!fs.existsSync(dbPath)) {
    console.log(`⏭️  Skipping ${dbPath} - file not found`);
    return null;
  }

  return new Promise((resolve) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.log(`❌ ${dbPath}: ${err.message}`);
        resolve(null);
        return;
      }

      console.log(`\n📁 Checking ${dbPath}...`);
      
      // Check if profiles table exists
      db.all("PRAGMA table_info(profiles)", (err, cols) => {
        if (err || !cols || cols.length === 0) {
          console.log('   ⏭️  No profiles table');
          db.close();
          resolve(null);
          return;
        }

        console.log('   ✅ Profiles table found');
        
        // Get all profiles with names
        db.all(`
          SELECT address, name, xp, flip_balance, 
                 COALESCE(flip_balance, 0) + COALESCE(xp, 0) as total_value
          FROM profiles 
          WHERE name IS NOT NULL AND name != ''
          ORDER BY total_value DESC
        `, [], (err, profiles) => {
          if (err) {
            console.log(`   ❌ Error querying profiles: ${err.message}`);
            db.close();
            resolve(null);
            return;
          }

          console.log(`   📊 Found ${profiles.length} profiles with names`);
          
          // Look for specific players
          const targetPlayers = ['Koda', 'Lola', 'Moba', 'Banana'];
          const foundPlayers = [];
          
          profiles.forEach(profile => {
            if (targetPlayers.some(target => 
              profile.name.toLowerCase().includes(target.toLowerCase())
            )) {
              foundPlayers.push(profile);
            }
          });

          if (foundPlayers.length > 0) {
            console.log('   🎯 Found target players:');
            foundPlayers.forEach(player => {
              console.log(`      ${player.name} (${player.address})`);
              console.log(`         XP: ${player.xp || 0}, FLIP: ${player.flip_balance || 0}, Total: ${player.total_value}`);
            });
          }

          // Show top 5 players by value
          console.log('   🏆 Top 5 players by total value:');
          profiles.slice(0, 5).forEach((player, index) => {
            console.log(`      ${index + 1}. ${player.name} - Total: ${player.total_value} (XP: ${player.xp || 0}, FLIP: ${player.flip_balance || 0})`);
          });

          // Check games count
          db.get("SELECT COUNT(*) as count FROM games", [], (err, gameRow) => {
            if (!err && gameRow) {
              console.log(`   🎮 Games count: ${gameRow.count}`);
            }
            db.close();
            resolve({ path: dbPath, profiles: profiles.length, games: gameRow?.count || 0 });
          });
        });
      });
    });
  });
}

async function checkAllDatabases() {
  const results = [];
  
  for (const dbPath of possibleDbs) {
    const result = await checkDatabase(dbPath);
    if (result) {
      results.push(result);
    }
  }

  console.log('\n📋 Summary:');
  console.log('============');
  
  if (results.length === 0) {
    console.log('❌ No accessible databases found');
  } else {
    results.forEach(result => {
      console.log(`✅ ${result.path}: ${result.profiles} profiles, ${result.games} games`);
    });
  }
}

// Run the check
checkAllDatabases().catch(console.error);
