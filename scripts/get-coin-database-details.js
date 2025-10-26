const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

console.log('💰 DETAILED COIN DATABASE ANALYSIS');
console.log('==================================');

async function analyzeCoinDatabases() {
  try {
    // The 3 databases that have flip_balance column
    const coinDatabases = [
      '/root/deploy-package/server/flipz.db',
      '/opt/flipnosis/app/server/flipz.db', 
      '/tmp/flipz_backup.db'
    ];
    
    for (const dbFile of coinDatabases) {
      console.log(`\n📁 ANALYZING: ${dbFile}`);
      console.log('='.repeat(60));
      
      try {
        // Get file size
        const { stdout: fileSize } = await execAsync(`ssh root@159.69.242.154 "ls -lah '${dbFile}'"`);
        console.log(`File Info: ${fileSize.trim()}`);
        
        // Get profile schema
        const { stdout: profileSchema } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' '.schema profiles'"`);
        console.log('\nProfile Schema:');
        console.log(profileSchema);
        
        // Get profile count
        const { stdout: profileCount } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT COUNT(*) FROM profiles;'"`);
        console.log(`\nTotal Profiles: ${profileCount.trim()}`);
        
        // Get all profiles - try different column combinations
        console.log('\n👥 ALL PROFILES:');
        try {
          const { stdout: allProfiles } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT address, name, username, xp, flip_balance FROM profiles;'"`);
          console.log(allProfiles);
        } catch (error) {
          console.log('Error with basic query, trying alternative...');
          try {
            const { stdout: altProfiles } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT * FROM profiles;'"`);
            console.log(altProfiles);
          } catch (altError) {
            console.log('Error with alternative query:', altError.message);
          }
        }
        
        // Search for target players
        console.log('\n🎯 TARGET PLAYER SEARCH:');
        const targetPlayers = ['Koda', 'Lola', 'Moba', 'Banana'];
        for (const playerName of targetPlayers) {
          try {
            const { stdout: playerSearch } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT address, name, username, xp, flip_balance FROM profiles WHERE LOWER(name) LIKE LOWER(\\"%${playerName}%\\") OR LOWER(username) LIKE LOWER(\\"%${playerName}%\\") OR LOWER(address) LIKE LOWER(\\"%${playerName}%\\");'"`);
            
            if (playerSearch.trim()) {
              console.log(`✅ Found ${playerName}:`);
              console.log(playerSearch);
            } else {
              console.log(`❌ ${playerName}: Not found`);
            }
          } catch (error) {
            console.log(`❌ Error searching for ${playerName}: ${error.message}`);
          }
        }
        
        // Check for high-value players
        console.log('\n💰 HIGH-VALUE PLAYERS:');
        try {
          const { stdout: highValue } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT address, name, username, xp, flip_balance, (COALESCE(flip_balance, 0) + COALESCE(xp, 0)) as total_value FROM profiles WHERE (COALESCE(flip_balance, 0) + COALESCE(xp, 0)) > 1000 ORDER BY total_value DESC;'"`);
          
          if (highValue.trim()) {
            console.log('Players with >1000 total value:');
            console.log(highValue);
          } else {
            console.log('No players with >1000 total value found');
          }
        } catch (error) {
          console.log('Error querying high-value players:', error.message);
        }
        
        // Check for players with high flip_balance specifically
        console.log('\n🪙 HIGH FLIP BALANCE PLAYERS:');
        try {
          const { stdout: highFlip } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT address, name, username, xp, flip_balance FROM profiles WHERE flip_balance > 1000 ORDER BY flip_balance DESC;'"`);
          
          if (highFlip.trim()) {
            console.log('Players with >1000 flip_balance:');
            console.log(highFlip);
          } else {
            console.log('No players with >1000 flip_balance found');
          }
        } catch (error) {
          console.log('Error querying high flip balance players:', error.message);
        }
        
        // Check for players with high XP
        console.log('\n⭐ HIGH XP PLAYERS:');
        try {
          const { stdout: highXP } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT address, name, username, xp, flip_balance FROM profiles WHERE xp > 1000 ORDER BY xp DESC;'"`);
          
          if (highXP.trim()) {
            console.log('Players with >1000 XP:');
            console.log(highXP);
          } else {
            console.log('No players with >1000 XP found');
          }
        } catch (error) {
          console.log('Error querying high XP players:', error.message);
        }
        
      } catch (error) {
        console.log(`❌ Error analyzing ${dbFile}: ${error.message}`);
      }
    }
    
    console.log('\n🔍 SEARCHING FOR MORE DATABASES...');
    console.log('===================================');
    
    // Let's also check if there are any other databases we missed
    try {
      const { stdout: moreDbs } = await execAsync(`ssh root@159.69.242.154 "find / -name '*.db' -o -name '*.sqlite' -o -name '*.sqlite3' 2>/dev/null | grep -v '/var/cache/man/' | grep -v '/var/lib/docker/' | grep -v '/var/lib/containerd/' | head -20"`);
      
      const additionalDbs = moreDbs.trim().split('\n').filter(file => file.trim());
      console.log(`Found ${additionalDbs.length} additional databases:`);
      additionalDbs.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file}`);
      });
      
      // Check a few of these for flip_balance
      for (const dbFile of additionalDbs.slice(0, 5)) {
        if (!dbFile.trim()) continue;
        
        try {
          const { stdout: hasFlipBalance } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' '.schema profiles' 2>/dev/null | grep flip_balance || echo 'No flip_balance'"`);
          
          if (hasFlipBalance.includes('flip_balance')) {
            console.log(`\n✅ FOUND ADDITIONAL COIN DATABASE: ${dbFile}`);
            
            const { stdout: profileCount } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT COUNT(*) FROM profiles;' 2>/dev/null || echo '0'"`);
            console.log(`Profiles: ${profileCount.trim()}`);
            
            const { stdout: profiles } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT address, name, username, xp, flip_balance FROM profiles;' 2>/dev/null || echo 'Error'"`);
            console.log('Profiles:');
            console.log(profiles);
          }
        } catch (error) {
          // Skip this database
        }
      }
      
    } catch (error) {
      console.log('Error searching for additional databases:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error in coin database analysis:', error.message);
  }
}

// Run the analysis
analyzeCoinDatabases().catch(console.error);
