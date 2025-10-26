const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

console.log('🔍 Finding All Databases on Hetzner Server...');
console.log('==============================================');

async function findHetznerDatabases() {
  try {
    console.log('📡 Connecting to Hetzner server (159.69.242.154)...');
    
    // First, let's find all database files using the working path structure
    console.log('\n🔎 Searching for database files in /opt/flipnosis/app...');
    
    const { stdout: findDbs } = await execAsync(`ssh root@159.69.242.154 "find /opt/flipnosis/app -name '*.db' -o -name '*.sqlite' -o -name '*.sqlite3' 2>/dev/null"`);
    
    const dbFiles = findDbs.trim().split('\n').filter(file => file.trim());
    console.log(`Found ${dbFiles.length} database files:`);
    dbFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file}`);
    });

    // Also check other common locations
    console.log('\n🔎 Checking other common database locations...');
    
    const commonPaths = [
      '/root/flipnosis',
      '/opt/flipnosis',
      '/var/www/flipnosis',
      '/home/flipnosis'
    ];
    
    for (const basePath of commonPaths) {
      try {
        const { stdout: moreDbs } = await execAsync(`ssh root@159.69.242.154 "find ${basePath} -name '*.db' -o -name '*.sqlite' -o -name '*.sqlite3' 2>/dev/null"`);
        const additionalDbs = moreDbs.trim().split('\n').filter(file => file.trim());
        if (additionalDbs.length > 0) {
          console.log(`\nFound in ${basePath}:`);
          additionalDbs.forEach((file, index) => {
            console.log(`  ${index + 1}. ${file}`);
          });
          dbFiles.push(...additionalDbs);
        }
      } catch (error) {
        // Path doesn't exist, continue
      }
    }

    // Now let's check each database for profiles and games
    const allResults = [];
    
    for (const dbFile of dbFiles) {
      if (!dbFile.trim()) continue;
      
      console.log(`\n📁 Checking ${dbFile}...`);
      console.log('='.repeat(60));
      
      try {
        // Check if profiles table exists and get count
        const { stdout: profileCount } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT COUNT(*) FROM profiles;' 2>/dev/null || echo '0'"`);
        const profilesCount = parseInt(profileCount.trim()) || 0;
        
        // Check if games table exists and get count
        const { stdout: gameCount } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT COUNT(*) FROM games;' 2>/dev/null || echo '0'"`);
        const gamesCount = parseInt(gameCount.trim()) || 0;
        
        console.log(`   📊 Profiles: ${profilesCount}, Games: ${gamesCount}`);
        
        const dbResult = {
          file: dbFile,
          profiles: profilesCount,
          games: gamesCount,
          highValuePlayers: [],
          targetPlayers: [],
          recentGames: []
        };
        
        if (profilesCount > 0) {
          // Get profiles with high values (>1000)
          const { stdout: highValueProfiles } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT address, name, username, xp, flip_balance, COALESCE(flip_balance, 0) + COALESCE(xp, 0) as total_value FROM profiles WHERE (COALESCE(flip_balance, 0) + COALESCE(xp, 0)) > 1000 ORDER BY total_value DESC LIMIT 20;' 2>/dev/null || echo 'No high value profiles'"`);
          
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
                  
                  dbResult.highValuePlayers.push({
                    name, address, xp: parseInt(xp), flip: parseInt(flip), total: parseInt(total)
                  });
                }
              }
            });
          }
          
          // Search for specific players
          const targetPlayers = ['Koda', 'Lola', 'Moba', 'Banana'];
          for (const playerName of targetPlayers) {
            const { stdout: playerSearch } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT address, name, username, xp, flip_balance FROM profiles WHERE LOWER(name) LIKE LOWER(\\"%${playerName}%\\") OR LOWER(username) LIKE LOWER(\\"%${playerName}%\\") OR LOWER(address) LIKE LOWER(\\"%${playerName}%\\");' 2>/dev/null || echo 'No results'"`);
            
            if (playerSearch.trim() && !playerSearch.includes('No results')) {
              console.log(`   ✅ Found ${playerName}:`);
              const lines = playerSearch.trim().split('\n');
              lines.forEach(line => {
                if (line.trim()) {
                  const parts = line.split('|');
                  if (parts.length >= 5) {
                    const name = parts[1] || parts[2] || 'Unknown';
                    const address = parts[0];
                    const xp = parts[3] || '0';
                    const flip = parts[4] || '0';
                    console.log(`      ${name} (${address}) - XP: ${xp}, FLIP: ${flip}`);
                    
                    dbResult.targetPlayers.push({
                      name, address, xp: parseInt(xp), flip: parseInt(flip)
                    });
                  }
                }
              });
            }
          }
        }
        
        if (gamesCount > 0) {
          console.log(`   🎮 Found ${gamesCount} games`);
          
          // Get recent games
          const { stdout: recentGames } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbFile}' 'SELECT id, creator, challenger, status, created_at FROM games ORDER BY created_at DESC LIMIT 5;' 2>/dev/null || echo 'No games'"`);
          
          if (recentGames.trim() && !recentGames.includes('No games')) {
            console.log('   📅 Recent Games:');
            const lines = recentGames.trim().split('\n');
            lines.forEach((line, index) => {
              if (line.trim()) {
                const parts = line.split('|');
                if (parts.length >= 5) {
                  console.log(`      ${index + 1}. ${parts[0]} - ${parts[3]} (${parts[4]})`);
                  dbResult.recentGames.push({
                    id: parts[0],
                    creator: parts[1],
                    challenger: parts[2],
                    status: parts[3],
                    created_at: parts[4]
                  });
                }
              }
            });
          }
        }
        
        allResults.push(dbResult);
        
      } catch (error) {
        console.log(`   ❌ Error checking ${dbFile}: ${error.message}`);
      }
    }
    
    // Summary
    console.log('\n📋 SUMMARY REPORT');
    console.log('==================');
    console.log(`Total database files found: ${dbFiles.length}`);
    
    const totalProfiles = allResults.reduce((sum, db) => sum + db.profiles, 0);
    const totalGames = allResults.reduce((sum, db) => sum + db.games, 0);
    console.log(`Total profiles across all databases: ${totalProfiles}`);
    console.log(`Total games across all databases: ${totalGames}`);
    
    // Find databases with high-value players
    const dbsWithHighValues = allResults.filter(db => db.highValuePlayers.length > 0);
    if (dbsWithHighValues.length > 0) {
      console.log('\n🏆 Databases with High-Value Players:');
      dbsWithHighValues.forEach(db => {
        console.log(`\n${db.file}:`);
        db.highValuePlayers.forEach(player => {
          console.log(`  ${player.name} - Total: ${player.total} (XP: ${player.xp}, FLIP: ${player.flip})`);
        });
      });
    }
    
    // Find databases with target players
    const dbsWithTargets = allResults.filter(db => db.targetPlayers.length > 0);
    if (dbsWithTargets.length > 0) {
      console.log('\n🎯 Databases with Target Players (Koda, Lola, Moba, Banana):');
      dbsWithTargets.forEach(db => {
        console.log(`\n${db.file}:`);
        db.targetPlayers.forEach(player => {
          console.log(`  ${player.name} - XP: ${player.xp}, FLIP: ${player.flip}`);
        });
      });
    }
    
    // Find databases with many games
    const dbsWithGames = allResults.filter(db => db.games > 0);
    if (dbsWithGames.length > 0) {
      console.log('\n🎮 Databases with Games:');
      dbsWithGames.forEach(db => {
        console.log(`  ${db.file}: ${db.games} games`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error searching Hetzner databases:', error.message);
  }
}

// Run the search
findHetznerDatabases().catch(console.error);
