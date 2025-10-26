const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Check the main database.sqlite file
const dbPath = path.join(__dirname, '../database.sqlite');

console.log('🔍 Checking Main Database (database.sqlite)...');
console.log('===============================================');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

async function checkMainDatabase() {
  try {
    // Check what tables exist
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

    // Get all profiles to see what data we have
    console.log('\n👥 All Profiles in Database:');
    console.log('============================');
    
    const allProfiles = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM profiles", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    console.log(`Found ${allProfiles.length} profiles:`);
    allProfiles.forEach((profile, index) => {
      console.log(`\n${index + 1}. Address: ${profile.address}`);
      Object.keys(profile).forEach(key => {
        if (key !== 'address') {
          console.log(`   ${key}: ${profile[key]}`);
        }
      });
    });

    // Check for high XP/FLIP values
    console.log('\n🎯 Players with High Values:');
    console.log('============================');
    
    const highValuePlayers = await new Promise((resolve, reject) => {
      db.all(`
        SELECT address, xp, flip_balance, 
               COALESCE(flip_balance, 0) + COALESCE(xp, 0) as total_value
        FROM profiles 
        WHERE (COALESCE(flip_balance, 0) + COALESCE(xp, 0)) > 1000
        ORDER BY total_value DESC
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    if (highValuePlayers.length > 0) {
      console.log(`Found ${highValuePlayers.length} players with high values:`);
      highValuePlayers.forEach((player, index) => {
        console.log(`\n${index + 1}. Address: ${player.address}`);
        console.log(`   XP: ${player.xp || 0}`);
        console.log(`   FLIP Balance: ${player.flip_balance || 0}`);
        console.log(`   Total Value: ${player.total_value}`);
      });
    } else {
      console.log('No players found with high values (>1000)');
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
          SELECT id, creator, challenger, status, created_at
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
        console.log(`   Created: ${game.created_at}`);
      });
    }

    // Search for addresses that might contain the player names
    console.log('\n🔍 Searching for Player Addresses:');
    console.log('==================================');
    
    const searchTerms = ['koda', 'lola', 'moba', 'banana'];
    
    for (const term of searchTerms) {
      const players = await new Promise((resolve, reject) => {
        db.all(`
          SELECT address, xp, flip_balance, 
                 COALESCE(flip_balance, 0) + COALESCE(xp, 0) as total_value
          FROM profiles 
          WHERE LOWER(address) LIKE LOWER(?)
        `, [`%${term}%`], (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });
      
      if (players.length > 0) {
        console.log(`\n✅ Found addresses containing "${term}":`);
        players.forEach(player => {
          console.log(`   ${player.address}`);
          console.log(`   XP: ${player.xp || 0}, FLIP: ${player.flip_balance || 0}, Total: ${player.total_value}`);
        });
      } else {
        console.log(`\n❌ No addresses found containing "${term}"`);
      }
    }

  } catch (error) {
    console.error('❌ Error checking main database:', error);
  } finally {
    db.close();
  }
}

// Run the check
checkMainDatabase().catch(console.error);
