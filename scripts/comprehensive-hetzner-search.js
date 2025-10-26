const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

console.log('🔍 COMPREHENSIVE Hetzner Database Search...');
console.log('==========================================');

async function comprehensiveSearch() {
  try {
    console.log('📡 Searching ALL possible database locations on Hetzner server...');
    
    // Search in ALL possible locations
    const searchPaths = [
      '/root',
      '/opt',
      '/var',
      '/home',
      '/usr/local',
      '/tmp'
    ];
    
    let allDatabases = [];
    
    for (const basePath of searchPaths) {
      console.log(`\n🔎 Searching in ${basePath}...`);
      
      try {
        const { stdout: findDbs } = await execAsync(`ssh root@159.69.242.154 "find ${basePath} -name '*.db' -o -name '*.sqlite' -o -name '*.sqlite3' 2>/dev/null | head -20"`);
        
        const dbs = findDbs.trim().split('\n').filter(file => file.trim());
        if (dbs.length > 0) {
          console.log(`Found ${dbs.length} databases in ${basePath}:`);
          dbs.forEach((file, index) => {
            console.log(`  ${index + 1}. ${file}`);
          });
          allDatabases.push(...dbs);
        }
      } catch (error) {
        console.log(`   Error searching ${basePath}: ${error.message}`);
      }
    }
    
    // Remove duplicates
    allDatabases = [...new Set(allDatabases)];
    
    console.log(`\n📊 TOTAL DATABASES FOUND: ${allDatabases.length}`);
    console.log('=====================================');
    
    // Now check each database for size, games, and players
    for (const dbFile of allDatabases) {
      if (!dbFile.trim()) continue;
      
      console.log(`\n📁 Analyzing ${dbFile}...`);
      console.log('='.repeat(60));
      
      try {
        // Get file size
        const { stdout: fileSize } = await execAsync(`ssh root@159.69.242.154 "ls -lh '${dbFile}' 2>/dev/null || echo 'File not found'"`);
        console.log(`File size: ${fileSize.trim()}`);
        
        // Check if it's a valid SQLite database
        const { stdout: tableCheck } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' '.tables' 2>/dev/null || echo 'Not a valid SQLite database'"`);
        
        if (tableCheck.includes('Not a valid SQLite database')) {
          console.log('❌ Not a valid SQLite database');
          continue;
        }
        
        console.log(`Tables: ${tableCheck.trim()}`);
        
        // Check for profiles table
        const { stdout: profileCount } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT COUNT(*) FROM profiles;' 2>/dev/null || echo '0'"`);
        const profilesCount = parseInt(profileCount.trim()) || 0;
        console.log(`Profiles: ${profilesCount}`);
        
        // Check for games table
        const { stdout: gameCount } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT COUNT(*) FROM games;' 2>/dev/null || echo '0'"`);
        const gamesCount = parseInt(gameCount.trim()) || 0;
        console.log(`Games: ${gamesCount}`);
        
        // If it has profiles, search for target players
        if (profilesCount > 0) {
          console.log('\n🔍 Searching for target players...');
          const targetPlayers = ['Koda', 'Lola', 'Moba', 'Banana'];
          
          for (const playerName of targetPlayers) {
            const { stdout: playerSearch } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT address, name, username, xp, flip_balance FROM profiles WHERE LOWER(name) LIKE LOWER(\\"%${playerName}%\\") OR LOWER(username) LIKE LOWER(\\"%${playerName}%\\") OR LOWER(address) LIKE LOWER(\\"%${playerName}%\\");' 2>/dev/null || echo 'No results'"`);
            
            if (playerSearch.trim() && !playerSearch.includes('No results')) {
              console.log(`✅ Found ${playerName}:`);
              console.log(playerSearch);
            }
          }
          
          // Get high-value players
          const { stdout: highValue } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT address, name, username, xp, flip_balance, COALESCE(flip_balance, 0) + COALESCE(xp, 0) as total_value FROM profiles WHERE (COALESCE(flip_balance, 0) + COALESCE(xp, 0)) > 1000 ORDER BY total_value DESC LIMIT 10;' 2>/dev/null || echo 'No high value players'"`);
          
          if (highValue.trim() && !highValue.includes('No high value players')) {
            console.log('\n💰 High-Value Players:');
            console.log(highValue);
          }
        }
        
        // If it has games, show recent ones
        if (gamesCount > 0) {
          console.log('\n🎮 Recent Games:');
          const { stdout: recentGames } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT id, creator, challenger, status, created_at FROM games ORDER BY created_at DESC LIMIT 5;' 2>/dev/null || echo 'No games'"`);
          console.log(recentGames);
        }
        
      } catch (error) {
        console.log(`   ❌ Error analyzing ${dbFile}: ${error.message}`);
      }
    }
    
    console.log('\n📋 FINAL SUMMARY');
    console.log('=================');
    console.log(`Total databases found: ${allDatabases.length}`);
    console.log('Check the analysis above for the databases with the most games and players');
    
  } catch (error) {
    console.error('❌ Error in comprehensive search:', error.message);
  }
}

// Run the comprehensive search
comprehensiveSearch().catch(console.error);
