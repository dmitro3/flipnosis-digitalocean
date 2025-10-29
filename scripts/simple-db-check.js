const { DatabaseService } = require('../server/services/database');
const path = require('path');

async function checkDatabase() {
  console.log('🔍 Checking database structure...\n');
  
  // Try different database paths
  const possiblePaths = [
    path.join(__dirname, '../server/database.sqlite'),
    '/opt/flipnosis/app/server/database.sqlite',
    '/opt/flipnosis/app/server/flipz.db',
    path.join(__dirname, '../server/flipz.db'),
    path.join(__dirname, '../server/games.db')
  ];

  let dbService = null;
  let dbPath = null;

  for (const dbPathAttempt of possiblePaths) {
    try {
      console.log(`Trying: ${dbPathAttempt}`);
      dbService = new DatabaseService(dbPathAttempt);
      await dbService.initialize();
      dbPath = dbPathAttempt;
      console.log(`✅ Connected to: ${dbPathAttempt}\n`);
      break;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
  }

  if (!dbService) {
    console.error('❌ Could not connect to any database');
    return;
  }

  try {
    // Check profiles table
    console.log('👤 PROFILES TABLE:');
    console.log('==================');
    
    const profiles = await dbService.db.all("PRAGMA table_info(profiles)");
    console.log('Schema:');
    profiles.forEach(col => {
      console.log(`  ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });

    const profileCount = await dbService.db.get("SELECT COUNT(*) as count FROM profiles");
    console.log(`\nRecords: ${profileCount.count}`);

    if (profileCount.count > 0) {
      const sampleProfile = await dbService.db.get("SELECT * FROM profiles LIMIT 1");
      console.log('\nSample profile:');
      Object.keys(sampleProfile).forEach(key => {
        console.log(`  ${key}: ${sampleProfile[key]}`);
      });
    }

    // Check other relevant tables
    console.log('\n📊 OTHER TABLES:');
    console.log('================');
    
    const tables = ['player_stats', 'user_presence', 'admin_actions', 'games'];
    
    for (const tableName of tables) {
      try {
        const count = await dbService.db.get(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`${tableName}: ${count.count} records`);
      } catch (error) {
        console.log(`${tableName}: Table does not exist`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (dbService && dbService.db) {
      dbService.db.close();
    }
  }
}

checkDatabase().catch(console.error);
