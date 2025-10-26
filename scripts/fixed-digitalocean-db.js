const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

console.log('🔍 FIXED Analysis of /root/flipnosis-digitalocean/server/flipz.db');
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
    
    // Get all profiles with available columns
    const { stdout: allProfiles } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbPath}' 'SELECT address, name, username, xp, total_flips, wins, losses, level FROM profiles ORDER BY xp DESC;'"`);
    console.log('\nAll Profiles:');
    console.log(allProfiles);
    
    // Search for target players
    console.log('\n🎯 TARGET PLAYER SEARCH');
    console.log('='.repeat(30));
    
    const targetPlayers = ['Koda', 'Lola', 'Moba', 'Banana'];
    for (const playerName of targetPlayers) {
      const { stdout: playerSearch } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbPath}' 'SELECT address, name, username, xp, total_flips, wins, losses FROM profiles WHERE LOWER(name) LIKE LOWER(\\"%${playerName}%\\") OR LOWER(username) LIKE LOWER(\\"%${playerName}%\\") OR LOWER(address) LIKE LOWER(\\"%${playerName}%\\");'"`);
      
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
    
    // Check battle_royale_games table (this might have the 236+ games!)
    console.log('\n🏆 BATTLE ROYALE GAMES ANALYSIS');
    console.log('='.repeat(40));
    
    try {
      const { stdout: brGameCount } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbPath}' 'SELECT COUNT(*) FROM battle_royale_games;'"`);
      const brCount = parseInt(brGameCount.trim());
      console.log(`Battle Royale Games: ${brCount}`);
      
      if (brCount > 0) {
        const { stdout: brGameSchema } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbPath}' '.schema battle_royale_games'"`);
        console.log('\nBattle Royale Games Schema:');
        console.log(brGameSchema);
        
        const { stdout: recentBRGames } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbPath}' 'SELECT id, creator, status, created_at FROM battle_royale_games ORDER BY created_at DESC LIMIT 10;'"`);
        console.log('\nRecent Battle Royale Games:');
        console.log(recentBRGames);
        
        // Check BR game statuses
        const { stdout: brGameStatuses } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbPath}' 'SELECT status, COUNT(*) as count FROM battle_royale_games GROUP BY status ORDER BY count DESC;'"`);
        console.log('\nBattle Royale Game Status Distribution:');
        console.log(brGameStatuses);
      }
    } catch (error) {
      console.log('No battle_royale_games table or error:', error.message);
    }
    
    // Check other game-related tables
    console.log('\n🔍 OTHER GAME-RELATED TABLES');
    console.log('='.repeat(40));
    
    const gameTables = ['game_rounds', 'game_events', 'game_listings', 'game_shares'];
    
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
    
    // Check for high-value players (using XP since no flip_balance)
    console.log('\n💰 HIGH-VALUE PLAYERS SEARCH');
    console.log('='.repeat(40));
    
    const { stdout: highValuePlayers } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbPath}' 'SELECT address, name, username, xp, total_flips, wins, losses FROM profiles WHERE xp > 1000 ORDER BY xp DESC;'"`);
    
    if (highValuePlayers.trim()) {
      console.log('High-Value Players (>1000 XP):');
      console.log(highValuePlayers);
    } else {
      console.log('No high-value players found (XP > 1000)');
    }
    
    // Check for players with high total_flips
    const { stdout: highFlipPlayers } = await execAsync(`ssh root@159.69.242.154 "sqlite3 '${dbPath}' 'SELECT address, name, username, xp, total_flips, wins, losses FROM profiles WHERE total_flips > 1000 ORDER BY total_flips DESC;'"`);
    
    if (highFlipPlayers.trim()) {
      console.log('\nHigh-Flip Players (>1000 total_flips):');
      console.log(highFlipPlayers);
    } else {
      console.log('\nNo high-flip players found (total_flips > 1000)');
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
