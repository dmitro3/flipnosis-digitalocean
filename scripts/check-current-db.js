const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path - try different possible locations
const possiblePaths = [
  path.join(__dirname, '../server/flipz.db'),
  path.join(__dirname, '../server/flipz-clean.db'),
  path.join(__dirname, '../server/games.db')
];

let db = null;
let dbPath = null;

// Try to connect to database
for (const dbPathAttempt of possiblePaths) {
  try {
    console.log(`Trying to connect to: ${dbPathAttempt}`);
    db = new sqlite3.Database(dbPathAttempt, (err) => {
      if (err) {
        console.log(`Failed to connect to ${dbPathAttempt}:`, err.message);
        return;
      }
      console.log(`✅ Connected to database: ${dbPathAttempt}`);
      dbPath = dbPathAttempt;
    });
    
    if (dbPath) break;
  } catch (error) {
    console.log(`Error with ${dbPathAttempt}:`, error.message);
  }
}

if (!db || !dbPath) {
  console.error('❌ Could not connect to any database');
  process.exit(1);
}

async function checkCurrentDatabase() {
  try {
    console.log('\n🔍 CHECKING CURRENT DATABASE STRUCTURE');
    console.log('=====================================\n');

    // Get all tables
    const tables = await new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    console.log(`📋 Found ${tables.length} tables:`);
    tables.forEach(table => console.log(`  - ${table.name}`));

    // Check profiles table specifically
    console.log('\n👤 PROFILES TABLE ANALYSIS');
    console.log('==========================\n');

    const profilesSchema = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(profiles)", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    console.log('📋 Profiles table schema:');
    profilesSchema.forEach(col => {
      console.log(`  ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });

    // Check profiles data
    const profilesData = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM profiles LIMIT 5", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    console.log(`\n📊 Found ${profilesData.length} profile records (showing first 5):`);
    profilesData.forEach((profile, index) => {
      console.log(`\nProfile ${index + 1}:`);
      Object.keys(profile).forEach(key => {
        console.log(`  ${key}: ${profile[key]}`);
      });
    });

    // Check if other relevant tables exist
    const relevantTables = ['player_stats', 'user_presence', 'admin_actions'];
    
    for (const tableName of relevantTables) {
      const tableExists = await new Promise((resolve, reject) => {
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [tableName], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (tableExists) {
        const count = await new Promise((resolve, reject) => {
          db.get(`SELECT COUNT(*) as count FROM ${tableName}`, [], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
        console.log(`\n📊 ${tableName}: ${count.count} records`);
      } else {
        console.log(`\n❌ ${tableName}: Table does not exist`);
      }
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('\n✅ Database connection closed');
      }
    });
  }
}

// Run the script
checkCurrentDatabase().catch(console.error);
