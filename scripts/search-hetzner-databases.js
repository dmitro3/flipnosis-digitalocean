const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

console.log('🔍 Searching Hetzner Server for All Database Files...');
console.log('====================================================');

async function searchHetznerDatabases() {
  try {
    console.log('📡 Connecting to Hetzner server (159.69.242.154)...');
    
    // First, let's find all database files on the server
    console.log('\n🔎 Searching for all database files...');
    const { stdout: findDbs } = await execAsync(`ssh root@159.69.242.154 'find /opt/flipnosis -name "*.db" -o -name "*.sqlite" -o -name "*.sqlite3" 2>/dev/null'`);
    
    const dbFiles = stdout.trim().split('\n').filter(file => file.trim());
    console.log(`Found ${dbFiles.length} database files:`);
    dbFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file}`);
    });

    // Now let's check each database for profiles and games
    for (const dbFile of dbFiles) {
      if (!dbFile.trim()) continue;
      
      console.log(`\n📁 Checking ${dbFile}...`);
      console.log('='.repeat(50));
      
      try {
        // Check if profiles table exists and get count
        const { stdout: profileCount } = await execAsync(`ssh root@159.69.242.154 'sqlite3 "${dbFile}" "SELECT COUNT(*) FROM profiles;" 2>/dev/null || echo "0"'`);
        const profilesCount = parseInt(profileCount.trim()) || 0;
        
        // Check if games table exists and get count
        const { stdout: gameCount } = await execAsync(`ssh root@159.69.242.154 'sqlite3 "${dbFile}" "SELECT COUNT(*) FROM games;" 2>/dev/null || echo "0"'`);
        const gamesCount = parseInt(gameCount.trim()) || 0;
        
        console.log(`   📊 Profiles: ${profilesCount}, Games: ${gamesCount}`);
        
        if (profilesCount > 0) {
          // Get profiles with high values
          const { stdout: highValueProfiles } = await execAsync(`ssh root@159.69.242.154 'sqlite3 "${dbFile}" "SELECT address, name, username, xp, flip_balance, COALESCE(flip_balance, 0) + COALESCE(xp, 0) as total_value FROM profiles WHERE (COALESCE(flip_balance, 0) + COALESCE(xp, 0)) > 1000 ORDER BY total_value DESC LIMIT 10;" 2>/dev/null || echo "No high value profiles"'`);
          
          if (highValueProfiles.trim() && !highValueProfiles.includes('No high value profiles')) {
            console.log('   🎯 High Value Players:');
            const lines = highValueProfiles.trim().split('\n');
            lines.forEach(line => {
              if (line.trim()) {
                const parts = line.split('|');
                if (parts.length >= 6) {
                  const address = parts[0];
                  const name = parts[1] || parts[2] || 'Unknown';
                  const xp = parts[3] || '0';
                  const flip = parts[4] || '0';
                  const total = parts[5] || '0';
                  console.log(`      ${name} (${address}) - Total: ${total} (XP: ${xp}, FLIP: ${flip})`);
                }
              }
            });
          }
          
          // Search for specific players
          const targetPlayers = ['Koda', 'Lola', 'Moba', 'Banana'];
          for (const playerName of targetPlayers) {
            const { stdout: playerSearch } = await execAsync(`ssh root@159.69.242.154 'sqlite3 "${dbFile}" "SELECT address, name, username, xp, flip_balance FROM profiles WHERE LOWER(name) LIKE LOWER(\\"%${playerName}%\\") OR LOWER(username) LIKE LOWER(\\"%${playerName}%\\") OR LOWER(address) LIKE LOWER(\\"%${playerName}%\\");" 2>/dev/null || echo "No results"'`);
            
            if (playerSearch.trim() && !playerSearch.includes('No results')) {
              console.log(`   ✅ Found ${playerName}:`);
              const lines = playerSearch.trim().split('\n');
              lines.forEach(line => {
                if (line.trim()) {
                  const parts = line.split('|');
                  if (parts.length >= 5) {
                    console.log(`      ${parts[1] || parts[2] || 'Unknown'} (${parts[0]}) - XP: ${parts[3] || '0'}, FLIP: ${parts[4] || '0'}`);
                  }
                }
              });
            }
          }
        }
        
        if (gamesCount > 0) {
          console.log(`   🎮 Found ${gamesCount} games`);
          
          // Get recent games
          const { stdout: recentGames } = await execAsync(`ssh root@159.69.242.154 'sqlite3 "${dbFile}" "SELECT id, creator, challenger, status, created_at FROM games ORDER BY created_at DESC LIMIT 3;" 2>/dev/null || echo "No games"'`);
          
          if (recentGames.trim() && !recentGames.includes('No games')) {
            console.log('   📅 Recent Games:');
            const lines = recentGames.trim().split('\n');
            lines.forEach((line, index) => {
              if (line.trim()) {
                const parts = line.split('|');
                if (parts.length >= 5) {
                  console.log(`      ${index + 1}. ${parts[0]} - ${parts[3]} (${parts[4]})`);
                }
              }
            });
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Error checking ${dbFile}: ${error.message}`);
      }
    }
    
    console.log('\n📋 Summary:');
    console.log('============');
    console.log(`Found ${dbFiles.length} database files on Hetzner server`);
    console.log('Check the output above for players with high values and specific player names');
    
  } catch (error) {
    console.error('❌ Error searching Hetzner databases:', error.message);
  }
}

// Run the search
searchHetznerDatabases().catch(console.error);
