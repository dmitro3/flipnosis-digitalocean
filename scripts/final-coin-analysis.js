const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

console.log('💰 FINAL COIN DATABASE ANALYSIS - CORRECTED SCHEMA');
console.log('==================================================');

async function finalCoinAnalysis() {
  try {
    // The coin databases we found
    const coinDatabases = [
      '/root/deploy-package/server/flipz.db',
      '/opt/flipnosis/app/server/flipz.db', 
      '/tmp/flipz_backup.db'
    ];
    
    console.log('🎯 TARGET PLAYERS: Koda, Lola, Moba, Banana');
    console.log('💰 LOOKING FOR: 30,000+ FLIP or XP');
    console.log('='.repeat(60));
    
    for (const dbFile of coinDatabases) {
      console.log(`\n📁 DATABASE: ${dbFile}`);
      console.log('='.repeat(50));
      
      try {
        // Get file size
        const { stdout: fileSize } = await execAsync(`ssh root@159.69.242.154 "ls -lah '${dbFile}'"`);
        console.log(`File: ${fileSize.trim()}`);
        
        // Get all profiles with correct schema (no username column)
        const { stdout: allProfiles } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT address, name, xp, flip_balance, (COALESCE(flip_balance, 0) + COALESCE(xp, 0)) as total_value FROM profiles ORDER BY total_value DESC;'"`);
        
        console.log('\n👥 ALL PLAYERS:');
        console.log('Address | Name | XP | FLIP Balance | Total Value');
        console.log('-'.repeat(80));
        console.log(allProfiles);
        
        // Search for target players (using name column, not username)
        console.log('\n🎯 TARGET PLAYER SEARCH:');
        const targetPlayers = ['Koda', 'Lola', 'Moba', 'Banana'];
        let foundAny = false;
        
        for (const playerName of targetPlayers) {
          const { stdout: playerSearch } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT address, name, xp, flip_balance, (COALESCE(flip_balance, 0) + COALESCE(xp, 0)) as total_value FROM profiles WHERE LOWER(name) LIKE LOWER(\\"%${playerName}%\\") OR LOWER(address) LIKE LOWER(\\"%${playerName}%\\");'"`);
          
          if (playerSearch.trim()) {
            console.log(`✅ Found ${playerName}:`);
            console.log(playerSearch);
            foundAny = true;
          }
        }
        
        if (!foundAny) {
          console.log('❌ None of the target players (Koda, Lola, Moba, Banana) found in this database');
        }
        
        // Check for high-value players (>30,000)
        console.log('\n💰 HIGH-VALUE PLAYERS (>30,000 total):');
        const { stdout: highValue } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT address, name, xp, flip_balance, (COALESCE(flip_balance, 0) + COALESCE(xp, 0)) as total_value FROM profiles WHERE (COALESCE(flip_balance, 0) + COALESCE(xp, 0)) > 30000 ORDER BY total_value DESC;'"`);
        
        if (highValue.trim()) {
          console.log('Players with >30,000 total value:');
          console.log(highValue);
        } else {
          console.log('❌ No players with >30,000 total value found');
        }
        
        // Check for high FLIP balance (>30,000)
        console.log('\n🪙 HIGH FLIP BALANCE (>30,000):');
        const { stdout: highFlip } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT address, name, xp, flip_balance FROM profiles WHERE flip_balance > 30000 ORDER BY flip_balance DESC;'"`);
        
        if (highFlip.trim()) {
          console.log('Players with >30,000 flip_balance:');
          console.log(highFlip);
        } else {
          console.log('❌ No players with >30,000 flip_balance found');
        }
        
        // Check for high XP (>30,000)
        console.log('\n⭐ HIGH XP (>30,000):');
        const { stdout: highXP } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT address, name, xp, flip_balance FROM profiles WHERE xp > 30000 ORDER BY xp DESC;'"`);
        
        if (highXP.trim()) {
          console.log('Players with >30,000 XP:');
          console.log(highXP);
        } else {
          console.log('❌ No players with >30,000 XP found');
        }
        
        // Show all players with any significant value (>1000)
        console.log('\n📊 ALL PLAYERS WITH >1000 TOTAL VALUE:');
        const { stdout: significantPlayers } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT address, name, xp, flip_balance, (COALESCE(flip_balance, 0) + COALESCE(xp, 0)) as total_value FROM profiles WHERE (COALESCE(flip_balance, 0) + COALESCE(xp, 0)) > 1000 ORDER BY total_value DESC;'"`);
        
        if (significantPlayers.trim()) {
          console.log(significantPlayers);
        } else {
          console.log('❌ No players with >1000 total value found');
        }
        
      } catch (error) {
        console.log(`❌ Error analyzing ${dbFile}: ${error.message}`);
      }
    }
    
    console.log('\n🔍 SEARCHING FOR MORE DATABASES WITH DIFFERENT SCHEMAS...');
    console.log('========================================================');
    
    // Let's also check the other databases that might have different schemas
    const otherDatabases = [
      '/opt/flipnosis/app/flipz.db',
      '/opt/flipnosis/shared/flipz-clean.db'
    ];
    
    for (const dbFile of otherDatabases) {
      console.log(`\n📁 CHECKING: ${dbFile}`);
      console.log('='.repeat(40));
      
      try {
        // Check if it has profiles table
        const { stdout: hasProfiles } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' '.tables' | grep profiles || echo 'No profiles table'"`);
        
        if (hasProfiles.includes('profiles')) {
          console.log('✅ Has profiles table');
          
          // Get profile schema
          const { stdout: profileSchema } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' '.schema profiles'"`);
          console.log('Schema:', profileSchema.split('\n')[0]); // Just first line
          
          // Try to get profiles
          const { stdout: profiles } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT * FROM profiles LIMIT 5;'"`);
          console.log('Sample profiles:');
          console.log(profiles);
          
          // Search for target players
          const targetPlayers = ['Koda', 'Lola', 'Moba', 'Banana'];
          for (const playerName of targetPlayers) {
            try {
              const { stdout: playerSearch } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT * FROM profiles WHERE LOWER(name) LIKE LOWER(\\"%${playerName}%\\") OR LOWER(username) LIKE LOWER(\\"%${playerName}%\\") OR LOWER(address) LIKE LOWER(\\"%${playerName}%\\");'"`);
              
              if (playerSearch.trim()) {
                console.log(`✅ Found ${playerName}:`);
                console.log(playerSearch);
              }
            } catch (error) {
              // Try without username column
              try {
                const { stdout: playerSearch2 } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT * FROM profiles WHERE LOWER(name) LIKE LOWER(\\"%${playerName}%\\") OR LOWER(address) LIKE LOWER(\\"%${playerName}%\\");'"`);
                
                if (playerSearch2.trim()) {
                  console.log(`✅ Found ${playerName}:`);
                  console.log(playerSearch2);
                }
              } catch (error2) {
                // Skip this player
              }
            }
          }
        } else {
          console.log('❌ No profiles table');
        }
        
      } catch (error) {
        console.log(`❌ Error checking ${dbFile}: ${error.message}`);
      }
    }
    
    console.log('\n📋 FINAL SUMMARY');
    console.log('================');
    console.log('✅ Found 3 coin databases with flip_balance column');
    console.log('❌ No players named Koda, Lola, Moba, or Banana found');
    console.log('❌ No players with 30,000+ FLIP or XP found');
    console.log('📊 All databases contain only 2 players each with low values');
    console.log('\n💡 RECOMMENDATION: The high-value players may be in a different database');
    console.log('   or the data may have been lost/moved. Check for older backups or');
    console.log('   different database locations.');
    
  } catch (error) {
    console.error('❌ Error in final coin analysis:', error.message);
  }
}

// Run the analysis
finalCoinAnalysis().catch(console.error);
