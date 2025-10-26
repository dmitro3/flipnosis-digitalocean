const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

console.log('🔍 DETAILED Analysis of /root/flipnosis-digitalocean/server/flipz.db');
console.log('================================================================');

async function analyzeDigitalOceanDB() {
  try {
    const dbPath = '/root/flipnosis-digitalocean/server/flipz.db';
    
    console.log(`📁 Database: ${dbPath}`);
    console.log('='.repeat(60));
    
    // Get detailed file info
    const { stdout: fileInfo } = await execAsync(`ssh root@159.69.242.154 "ls -lah '${dbPath}'"`);
    console.log(`File Info: ${fileInfo.trim()}`);
    
    // Get all tables
    const { stdout: tables } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbPath}' '.tables'"`);
    console.log(`\nTables: ${tables.trim()}`);
    
    // Check profiles table structure and data
    console.log('\n👥 PROFILES ANALYSIS');
    console.log('='.repeat(30));
    
    const { stdout: profileSchema } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbPath}' '.schema profiles'"`);
    console.log('Profile Schema:');
    console.log(profileSchema);
    
    const { stdout: profileCount } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbPath}' 'SELECT COUNT(*) FROM profiles;'"`);
    console.log(`Total Profiles: ${profileCount.trim()}`);
    
    const { stdout: allProfiles } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbPath}' 'SELECT address, name, username, xp, flip_balance, COALESCE(flip_balance, 0) + COALESCE(xp, 0) as total_value FROM profiles ORDER BY total_value DESC;'"`);
    console.log('\nAll Profiles:');
    console.log(allProfiles);
    
    // Search for target players
    console.log('\n🎯 TARGET PLAYER SEARCH');
    console.log('='.repeat(30));
    
    const targetPlayers = ['Koda', 'Lola', 'Moba', 'Banana'];
    for (const playerName of targetPlayers) {
      const { stdout: playerSearch } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbPath}' 'SELECT address, name, username, xp, flip_balance, COALESCE(flip_balance, 0) + COALESCE(xp, 0) as total_value FROM profiles WHERE LOWER(name) LIKE LOWER(\\"%${playerName}%\\") OR LOWER(username) LIKE LOWER(\\"%${playerName}%\\") OR LOWER(address) LIKE LOWER(\\"%${playerName}%\\");'"`);
      
      if (playerSearch.trim()) {
        console.log(`✅ Found ${playerName}:`);
        console.log(playerSearch);
      } else {
        console.log(`❌ ${playerName}: Not found`);
      }
    }
    
    // Check games table
    console.log('\n🎮 GAMES ANALYSIS');
    console.log('='.repeat(30));
    
    const { stdout: gameSchema } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbPath}' '.schema games'"`);
    console.log('Games Schema:');
    console.log(gameSchema);
    
    const { stdout: gameCount } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbPath}' 'SELECT COUNT(*) FROM games;'"`);
    console.log(`Total Games: ${gameCount.trim()}`);
    
    if (parseInt(gameCount.trim()) > 0) {
      const { stdout: recentGames } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbPath}' 'SELECT id, creator, challenger, status, created_at FROM games ORDER BY created_at DESC LIMIT 10;'"`);
      console.log('\nRecent Games:');
      console.log(recentGames);
      
      // Check for different game statuses
      const { stdout: gameStatuses } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbPath}' 'SELECT status, COUNT(*) as count FROM games GROUP BY status ORDER BY count DESC;'"`);
      console.log('\nGame Status Distribution:');
      console.log(gameStatuses);
    }
    
    // Check other tables that might contain game data
    console.log('\n🔍 OTHER GAME-RELATED TABLES');
    console.log('='.repeat(40));
    
    const gameTables = ['battle_royale_games', 'game_rounds', 'game_events', 'game_listings'];
    
    for (const tableName of gameTables) {
      try {
        const { stdout: tableCount } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbPath}' 'SELECT COUNT(*) FROM ${tableName};'"`);
        const count = parseInt(tableCount.trim());
        if (count > 0) {
          console.log(`\n📊 ${tableName}: ${count} records`);
          
          // Show sample data
          const { stdout: sampleData } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbPath}' 'SELECT * FROM ${tableName} LIMIT 3;'"`);
          console.log('Sample data:');
          console.log(sampleData);
        }
      } catch (error) {
        // Table doesn't exist or error, skip
      }
    }
    
    // Check for high-value players across all tables
    console.log('\n💰 HIGH-VALUE PLAYERS SEARCH');
    console.log('='.repeat(40));
    
    const { stdout: highValuePlayers } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbPath}' 'SELECT address, name, username, xp, flip_balance, COALESCE(flip_balance, 0) + COALESCE(xp, 0) as total_value FROM profiles WHERE (COALESCE(flip_balance, 0) + COALESCE(xp, 0)) > 1000 ORDER BY total_value DESC;'"`);
    
    if (highValuePlayers.trim()) {
      console.log('High-Value Players (>1000 total):');
      console.log(highValuePlayers);
    } else {
      console.log('No high-value players found in profiles table');
    }
    
    console.log('\n📋 SUMMARY');
    console.log('==========');
    console.log(`Database: ${dbPath}`);
    console.log(`File Size: 1.3MB`);
    console.log(`Profiles: ${profileCount.trim()}`);
    console.log(`Games: ${gameCount.trim()}`);
    
  } catch (error) {
    console.error('❌ Error analyzing DigitalOcean database:', error.message);
  }
}

// Run the analysis
analyzeDigitalOceanDB().catch(console.error);
