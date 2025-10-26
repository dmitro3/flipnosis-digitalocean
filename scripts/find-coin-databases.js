const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

console.log('💰 SEARCHING FOR COIN/FLIP DATABASES');
console.log('====================================');

async function findCoinDatabases() {
  try {
    console.log('🔍 Looking for databases with flip_balance column...');
    
    // Get all database files we found earlier
    const allDatabases = [
      '/root/deploy-package/server/flipz.db',
      '/root/flipnosis-digitalocean/server/games.db',
      '/root/flipnosis-digitalocean/server/flipz.db',
      '/root/flipnosis-digitalocean/server/games-v2.db',
      '/root/flipnosis-digitalocean/server/local-dev.db',
      '/opt/flipnosis/app/flipz.db',
      '/opt/flipnosis/app/database.db',
      '/opt/flipnosis/app/server/flipz.db',
      '/opt/flipnosis/shared/flipz-clean.db',
      '/tmp/flipz_backup.db'
    ];
    
    console.log(`Checking ${allDatabases.length} databases for flip_balance column...\n`);
    
    for (const dbFile of allDatabases) {
      console.log(`📁 Checking ${dbFile}...`);
      
      try {
        // Check if profiles table has flip_balance column
        const { stdout: profileSchema } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' '.schema profiles' 2>/dev/null || echo 'No profiles table'"`);
        
        if (profileSchema.includes('flip_balance')) {
          console.log(`✅ FOUND COIN DATABASE: ${dbFile}`);
          console.log('Profile schema includes flip_balance column!');
          
          // Get profile count
          const { stdout: profileCount } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT COUNT(*) FROM profiles;' 2>/dev/null || echo '0'"`);
          console.log(`Profiles: ${profileCount.trim()}`);
          
          // Get all profiles with flip_balance
          const { stdout: allProfiles } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT address, name, username, xp, flip_balance, COALESCE(flip_balance, 0) + COALESCE(xp, 0) as total_value FROM profiles ORDER BY total_value DESC;' 2>/dev/null || echo 'Error querying profiles'"`);
          console.log('\nAll Profiles:');
          console.log(allProfiles);
          
          // Search for target players
          console.log('\n🎯 Searching for target players...');
          const targetPlayers = ['Koda', 'Lola', 'Moba', 'Banana'];
          for (const playerName of targetPlayers) {
            const { stdout: playerSearch } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT address, name, username, xp, flip_balance, COALESCE(flip_balance, 0) + COALESCE(xp, 0) as total_value FROM profiles WHERE LOWER(name) LIKE LOWER(\\"%${playerName}%\\") OR LOWER(username) LIKE LOWER(\\"%${playerName}%\\") OR LOWER(address) LIKE LOWER(\\"%${playerName}%\\");' 2>/dev/null || echo 'No results'"`);
            
            if (playerSearch.trim() && !playerSearch.includes('No results')) {
              console.log(`✅ Found ${playerName}:`);
              console.log(playerSearch);
            }
          }
          
          // Check for high-value players
          const { stdout: highValue } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT address, name, username, xp, flip_balance, COALESCE(flip_balance, 0) + COALESCE(xp, 0) as total_value FROM profiles WHERE (COALESCE(flip_balance, 0) + COALESCE(xp, 0)) > 1000 ORDER BY total_value DESC;' 2>/dev/null || echo 'No high value players'"`);
          
          if (highValue.trim() && !highValue.includes('No high value players')) {
            console.log('\n💰 High-Value Players (>1000 total):');
            console.log(highValue);
          }
          
          console.log('\n' + '='.repeat(80) + '\n');
          
        } else if (profileSchema.includes('No profiles table')) {
          console.log(`❌ No profiles table in ${dbFile}`);
        } else {
          console.log(`❌ No flip_balance column in ${dbFile}`);
        }
        
      } catch (error) {
        console.log(`❌ Error checking ${dbFile}: ${error.message}`);
      }
    }
    
    console.log('\n🔍 SEARCHING FOR OTHER POSSIBLE DATABASE LOCATIONS...');
    console.log('====================================================');
    
    // Search for other possible locations
    const searchPaths = [
      '/root',
      '/opt',
      '/var',
      '/home',
      '/usr/local'
    ];
    
    for (const basePath of searchPaths) {
      console.log(`\n🔎 Searching in ${basePath} for .db files...`);
      
      try {
        const { stdout: findDbs } = await execAsync(`ssh root@159.69.242.154 "find ${basePath} -name '*.db' -o -name '*.sqlite' -o -name '*.sqlite3' 2>/dev/null | grep -v '/var/cache/man/' | head -10"`);
        
        const dbs = findDbs.trim().split('\n').filter(file => file.trim());
        if (dbs.length > 0) {
          console.log(`Found ${dbs.length} databases in ${basePath}:`);
          dbs.forEach((file, index) => {
            console.log(`  ${index + 1}. ${file}`);
          });
        }
      } catch (error) {
        console.log(`   Error searching ${basePath}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in coin database search:', error.message);
  }
}

// Run the search
findCoinDatabases().catch(console.error);
