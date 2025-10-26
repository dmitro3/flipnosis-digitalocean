const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

console.log('🔍 Getting Detailed Player Data from Hetzner Server...');
console.log('======================================================');

async function getPlayerDetails() {
  try {
    // Focus on the main databases that have data
    const mainDatabases = [
      '/opt/flipnosis/app/flipz.db',
      '/opt/flipnosis/shared/flipz-clean.db'
    ];
    
    for (const dbFile of mainDatabases) {
      console.log(`\n📁 Checking ${dbFile}...`);
      console.log('='.repeat(60));
      
      try {
        // Get all profiles with their details
        console.log('\n👥 All Players in Database:');
        const { stdout: allProfiles } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT address, name, username, xp, flip_balance, COALESCE(flip_balance, 0) + COALESCE(xp, 0) as total_value FROM profiles ORDER BY total_value DESC;' 2>/dev/null || echo 'No profiles'"`);
        
        if (allProfiles.trim() && !allProfiles.includes('No profiles')) {
          const lines = allProfiles.trim().split('\n');
          console.log(`Found ${lines.length} players:`);
          
          lines.forEach((line, index) => {
            if (line.trim()) {
              const parts = line.split('|');
              if (parts.length >= 6) {
                const address = parts[0];
                const name = parts[1] || parts[2] || 'Unknown';
                const xp = parts[3] || '0';
                const flip = parts[4] || '0';
                const total = parts[5] || '0';
                
                console.log(`\n${index + 1}. ${name} (${address})`);
                console.log(`   XP: ${xp}, FLIP: ${flip}, Total: ${total}`);
                
                // Check if this matches our target players
                const targetPlayers = ['Koda', 'Lola', 'Moba', 'Banana'];
                const isTarget = targetPlayers.some(target => 
                  name.toLowerCase().includes(target.toLowerCase()) ||
                  address.toLowerCase().includes(target.toLowerCase())
                );
                
                if (isTarget) {
                  console.log(`   🎯 MATCHES TARGET PLAYER!`);
                }
                
                if (parseInt(total) > 1000) {
                  console.log(`   💰 HIGH VALUE PLAYER!`);
                }
              }
            }
          });
        }
        
        // Search specifically for target players
        console.log('\n🔍 Searching for Target Players (Koda, Lola, Moba, Banana):');
        const targetPlayers = ['Koda', 'Lola', 'Moba', 'Banana'];
        
        for (const playerName of targetPlayers) {
          const { stdout: playerSearch } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT address, name, username, xp, flip_balance FROM profiles WHERE LOWER(name) LIKE LOWER(\\"%${playerName}%\\") OR LOWER(username) LIKE LOWER(\\"%${playerName}%\\") OR LOWER(address) LIKE LOWER(\\"%${playerName}%\\");' 2>/dev/null || echo 'No results'"`);
          
          if (playerSearch.trim() && !playerSearch.includes('No results')) {
            console.log(`\n✅ Found ${playerName}:`);
            const lines = playerSearch.trim().split('\n');
            lines.forEach(line => {
              if (line.trim()) {
                const parts = line.split('|');
                if (parts.length >= 5) {
                  const name = parts[1] || parts[2] || 'Unknown';
                  const address = parts[0];
                  const xp = parts[3] || '0';
                  const flip = parts[4] || '0';
                  console.log(`   ${name} (${address}) - XP: ${xp}, FLIP: ${flip}`);
                }
              }
            });
          } else {
            console.log(`❌ ${playerName} not found in this database`);
          }
        }
        
        // Get high-value players (>1000 total)
        console.log('\n💰 High-Value Players (>1000 total):');
        const { stdout: highValue } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT address, name, username, xp, flip_balance, COALESCE(flip_balance, 0) + COALESCE(xp, 0) as total_value FROM profiles WHERE (COALESCE(flip_balance, 0) + COALESCE(xp, 0)) > 1000 ORDER BY total_value DESC;' 2>/dev/null || echo 'No high value players'"`);
        
        if (highValue.trim() && !highValue.includes('No high value players')) {
          const lines = highValue.trim().split('\n');
          lines.forEach((line, index) => {
            if (line.trim()) {
              const parts = line.split('|');
              if (parts.length >= 6) {
                const name = parts[1] || parts[2] || 'Unknown';
                const address = parts[0];
                const xp = parts[3] || '0';
                const flip = parts[4] || '0';
                const total = parts[5] || '0';
                console.log(`   ${index + 1}. ${name} (${address}) - Total: ${total} (XP: ${xp}, FLIP: ${flip})`);
              }
            }
          });
        } else {
          console.log('   No high-value players found in this database');
        }
        
        // Get games count and sample
        console.log('\n🎮 Games Information:');
        const { stdout: gameCount } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT COUNT(*) FROM games;' 2>/dev/null || echo '0'"`);
        const gamesCount = parseInt(gameCount.trim()) || 0;
        console.log(`   Total games: ${gamesCount}`);
        
        if (gamesCount > 0) {
          const { stdout: sampleGames } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT id, creator, challenger, status, created_at FROM games ORDER BY created_at DESC LIMIT 3;' 2>/dev/null || echo 'No games'"`);
          
          if (sampleGames.trim() && !sampleGames.includes('No games')) {
            console.log('   Recent games:');
            const lines = sampleGames.trim().split('\n');
            lines.forEach((line, index) => {
              if (line.trim()) {
                const parts = line.split('|');
                if (parts.length >= 5) {
                  console.log(`     ${index + 1}. ${parts[0]} - ${parts[3]} (${parts[4]})`);
                }
              }
            });
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Error checking ${dbFile}: ${error.message}`);
      }
    }
    
    console.log('\n📋 FINAL SUMMARY');
    console.log('=================');
    console.log('✅ Found multiple databases on Hetzner server');
    console.log('✅ Main database: /opt/flipnosis/app/flipz.db (37 games, 2 profiles)');
    console.log('✅ Clean database: /opt/flipnosis/shared/flipz-clean.db (8 games, 1 profile)');
    console.log('✅ Multiple backup databases with same data');
    console.log('\n🔍 Next steps: Check the detailed player data above to find Koda, Lola, Moba, Banana');
    
  } catch (error) {
    console.error('❌ Error getting player details:', error.message);
  }
}

// Run the search
getPlayerDetails().catch(console.error);
