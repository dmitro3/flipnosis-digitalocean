const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

console.log('🔍 Getting Actual Player Data from Hetzner Databases...');
console.log('======================================================');

async function getActualPlayerData() {
  try {
    // Focus on the 4 main databases found
    const mainDatabases = [
      '/opt/flipnosis/app/flipz.db',
      '/opt/flipnosis/app/database.db', 
      '/opt/flipnosis/app/server/flipz.db',
      '/opt/flipnosis/shared/flipz-clean.db'
    ];
    
    for (const dbFile of mainDatabases) {
      console.log(`\n📁 Checking ${dbFile}...`);
      console.log('='.repeat(60));
      
      try {
        // Get all profiles with their actual data
        console.log('\n👥 All Players in Database:');
        const { stdout: allProfiles } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT * FROM profiles;' 2>/dev/null || echo 'No profiles table'"`);
        
        if (allProfiles.trim() && !allProfiles.includes('No profiles table')) {
          const lines = allProfiles.trim().split('\n');
          console.log(`Found ${lines.length} players:`);
          
          lines.forEach((line, index) => {
            if (line.trim()) {
              console.log(`\nPlayer ${index + 1}:`);
              const parts = line.split('|');
              parts.forEach((part, partIndex) => {
                console.log(`  Column ${partIndex}: ${part}`);
              });
            }
          });
        } else {
          console.log('No profiles table or no data found');
        }
        
        // Get table schema to understand structure
        console.log('\n📊 Table Schema:');
        const { stdout: schema } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' '.schema profiles' 2>/dev/null || echo 'No profiles table'"`);
        console.log(schema);
        
        // Check for high-value players using different column combinations
        console.log('\n💰 High-Value Players Search:');
        
        // Try different column combinations for XP and FLIP
        const columnCombinations = [
          'xp, flip_balance',
          'xp, flip',
          'experience, balance', 
          'points, tokens',
          'total_xp, total_flip'
        ];
        
        for (const cols of columnCombinations) {
          try {
            const { stdout: highValue } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT address, name, username, ${cols} FROM profiles WHERE (${cols.replace(',', '+')}) > 1000;' 2>/dev/null || echo 'No high value players'"`);
            
            if (highValue.trim() && !highValue.includes('No high value players')) {
              console.log(`\nHigh-value players (${cols}):`);
              console.log(highValue);
            }
          } catch (error) {
            // Column combination doesn't exist, continue
          }
        }
        
        // Search for specific players in all text columns
        console.log('\n🔍 Searching for Target Players:');
        const targetPlayers = ['Koda', 'Lola', 'Moba', 'Banana'];
        
        for (const playerName of targetPlayers) {
          const { stdout: playerSearch } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT * FROM profiles WHERE LOWER(address) LIKE LOWER(\\"%${playerName}%\\") OR LOWER(name) LIKE LOWER(\\"%${playerName}%\\") OR LOWER(username) LIKE LOWER(\\"%${playerName}%\\");' 2>/dev/null || echo 'No results'"`);
          
          if (playerSearch.trim() && !playerSearch.includes('No results')) {
            console.log(`\n✅ Found ${playerName}:`);
            console.log(playerSearch);
          } else {
            console.log(`❌ ${playerName} not found in this database`);
          }
        }
        
        // Get games count and sample
        console.log('\n🎮 Games Information:');
        const { stdout: gameCount } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT COUNT(*) FROM games;' 2>/dev/null || echo '0'"`);
        const gamesCount = parseInt(gameCount.trim()) || 0;
        console.log(`Total games: ${gamesCount}`);
        
        if (gamesCount > 0) {
          const { stdout: sampleGames } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT id, creator, challenger, status, created_at FROM games ORDER BY created_at DESC LIMIT 3;' 2>/dev/null || echo 'No games'"`);
          
          if (sampleGames.trim() && !sampleGames.includes('No games')) {
            console.log('Recent games:');
            console.log(sampleGames);
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Error checking ${dbFile}: ${error.message}`);
      }
    }
    
    console.log('\n📋 FINAL SUMMARY');
    console.log('=================');
    console.log('✅ Checked 4 main databases on Hetzner server');
    console.log('✅ Look for the actual player data above');
    console.log('✅ Check if any databases contain the players you mentioned');
    
  } catch (error) {
    console.error('❌ Error getting player data:', error.message);
  }
}

// Run the search
getActualPlayerData().catch(console.error);
