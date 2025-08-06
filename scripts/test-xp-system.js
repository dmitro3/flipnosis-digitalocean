const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '../server/flipz-clean.db');

console.log('🧪 XP System Test Script');
console.log('========================');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

async function testProfileXP() {
  return new Promise((resolve, reject) => {
    console.log('\n📊 Testing Profile XP System...');
    
    const testAddress = '0x1234567890123456789012345678901234567890';
    
    // First, check if profile exists
    db.get('SELECT * FROM profiles WHERE address = ?', [testAddress], (err, profile) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (profile) {
        console.log(`✅ Profile exists for ${testAddress}`);
        console.log(`   Current XP: ${profile.xp}`);
        console.log(`   Name earned: ${profile.xp_name_earned}`);
        console.log(`   Avatar earned: ${profile.xp_avatar_earned}`);
        console.log(`   Twitter earned: ${profile.xp_twitter_earned}`);
        console.log(`   Telegram earned: ${profile.xp_telegram_earned}`);
        console.log(`   Heads earned: ${profile.xp_heads_earned}`);
        console.log(`   Tails earned: ${profile.xp_tails_earned}`);
      } else {
        console.log(`❌ No profile found for ${testAddress}`);
      }
      
      resolve();
    });
  });
}

async function testGameShares() {
  return new Promise((resolve, reject) => {
    console.log('\n📊 Testing Game Shares...');
    
    db.all('SELECT * FROM game_shares', [], (err, shares) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log(`Found ${shares.length} game shares`);
      
      if (shares.length > 0) {
        shares.forEach((share, index) => {
          console.log(`  Share ${index + 1}:`);
          console.log(`    Game ID: ${share.game_id}`);
          console.log(`    Player: ${share.player_address}`);
          console.log(`    Platform: ${share.share_platform}`);
          console.log(`    XP Awarded: ${share.xp_awarded}`);
          console.log(`    Shared at: ${share.shared_at}`);
        });
      }
      
      resolve();
    });
  });
}

async function testDatabaseSchema() {
  return new Promise((resolve, reject) => {
    console.log('\n📊 Testing Database Schema...');
    
    // Check profiles table structure
    db.all("PRAGMA table_info(profiles)", [], (err, columns) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log('Profiles table columns:');
      columns.forEach(col => {
        console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
      });
      
      // Check game_shares table structure
      db.all("PRAGMA table_info(game_shares)", [], (err2, shareColumns) => {
        if (err2) {
          reject(err2);
          return;
        }
        
        console.log('\nGame shares table columns:');
        shareColumns.forEach(col => {
          console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
        });
        
        resolve();
      });
    });
  });
}

async function main() {
  try {
    await testDatabaseSchema();
    await testProfileXP();
    await testGameShares();
    
    console.log('\n✅ XP system test completed!');
  } catch (error) {
    console.error('❌ Error during XP system test:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err);
      } else {
        console.log('✅ Database connection closed');
      }
      process.exit(0);
    });
  }
}

main(); 