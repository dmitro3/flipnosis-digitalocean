const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '../server/flipz.db');

console.log('🔍 Checking Players Database...');
console.log('=====================================');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

async function checkPlayers() {
  try {
    // First, let's see what tables exist
    console.log('\n📋 Available Tables:');
    const tables = await new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
    tables.forEach(table => console.log(`  - ${table.name}`));

    // Check profiles table structure
    console.log('\n📊 Profiles Table Structure:');
    const profileSchema = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(profiles)", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
    profileSchema.forEach(col => {
      console.log(`  ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });

    // Query for players with high flip/XP values
    console.log('\n🎯 Players with High FLIP/XP Values:');
    console.log('=====================================');
    
    const highValuePlayers = await new Promise((resolve, reject) => {
      db.all(`
        SELECT address, name, xp, flip_balance, 
               COALESCE(flip_balance, 0) + COALESCE(xp, 0) as total_value
        FROM profiles 
        WHERE (COALESCE(flip_balance, 0) + COALESCE(xp, 0)) > 1000
        ORDER BY total_value DESC
        LIMIT 20
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    console.log(`Found ${highValuePlayers.length} players with high values:`);
    highValuePlayers.forEach((player, index) => {
      console.log(`\n${index + 1}. ${player.name || 'Unknown'} (${player.address})`);
      console.log(`   XP: ${player.xp || 0}`);
      console.log(`   FLIP Balance: ${player.flip_balance || 0}`);
      console.log(`   Total Value: ${player.total_value}`);
    });

    // Search for specific players mentioned
    console.log('\n🔍 Searching for Specific Players:');
    console.log('==================================');
    
    const specificPlayers = ['Koda', 'Lola', 'Moba', 'Banana'];
    
    for (const playerName of specificPlayers) {
      const player = await new Promise((resolve, reject) => {
        db.get(`
          SELECT address, name, xp, flip_balance, 
                 COALESCE(flip_balance, 0) + COALESCE(xp, 0) as total_value
          FROM profiles 
          WHERE LOWER(name) LIKE LOWER(?) OR LOWER(address) LIKE LOWER(?)
        `, [`%${playerName}%`, `%${playerName}%`], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      if (player) {
        console.log(`\n✅ Found ${playerName}:`);
        console.log(`   Name: ${player.name || 'Unknown'}`);
        console.log(`   Address: ${player.address}`);
        console.log(`   XP: ${player.xp || 0}`);
        console.log(`   FLIP Balance: ${player.flip_balance || 0}`);
        console.log(`   Total Value: ${player.total_value}`);
      } else {
        console.log(`\n❌ ${playerName} not found`);
      }
    }

    // Check games table
    console.log('\n🎮 Games Table Analysis:');
    console.log('========================');
    
    const gameCount = await new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as count FROM games", [], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    console.log(`Total games in database: ${gameCount}`);
    
    if (gameCount > 0) {
      const recentGames = await new Promise((resolve, reject) => {
        db.all(`
          SELECT id, creator, challenger, status, created_at, game_type
          FROM games 
          ORDER BY created_at DESC 
          LIMIT 5
        `, [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });
      
      console.log('\nRecent games:');
      recentGames.forEach((game, index) => {
        console.log(`\n${index + 1}. Game ID: ${game.id}`);
        console.log(`   Creator: ${game.creator}`);
        console.log(`   Challenger: ${game.challenger || 'None'}`);
        console.log(`   Status: ${game.status}`);
        console.log(`   Type: ${game.game_type || 'Unknown'}`);
        console.log(`   Created: ${game.created_at}`);
      });
    }

    // Check for any data inconsistencies
    console.log('\n🔧 Database Consistency Check:');
    console.log('==============================');
    
    const inconsistentProfiles = await new Promise((resolve, reject) => {
      db.all(`
        SELECT address, name, xp, flip_balance
        FROM profiles 
        WHERE (xp IS NULL AND flip_balance IS NULL) 
           OR (xp < 0 OR flip_balance < 0)
           OR (name IS NULL OR name = '')
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
    if (inconsistentProfiles.length > 0) {
      console.log(`Found ${inconsistentProfiles.length} profiles with potential issues:`);
      inconsistentProfiles.forEach((profile, index) => {
        console.log(`\n${index + 1}. ${profile.address}`);
        console.log(`   Name: ${profile.name || 'NULL'}`);
        console.log(`   XP: ${profile.xp || 'NULL'}`);
        console.log(`   FLIP Balance: ${profile.flip_balance || 'NULL'}`);
      });
    } else {
      console.log('✅ No obvious data inconsistencies found');
    }

  } catch (error) {
    console.error('❌ Error checking players:', error);
  } finally {
    db.close();
  }
}

// Run the check
checkPlayers().catch(console.error);
