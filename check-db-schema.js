const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Try different database paths
const dbPaths = [
  './database.sqlite',
  './server/database.sqlite',
  './server/flipz.db'
];

async function checkDatabase() {
  for (const dbPath of dbPaths) {
    console.log(`\n🔍 Checking database: ${dbPath}`);
    
    try {
      const db = new sqlite3.Database(dbPath);
      
      // Check if profiles table exists and get its schema
      const profilesSchema = await new Promise((resolve, reject) => {
        db.all("PRAGMA table_info(profiles)", [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });
      
      if (profilesSchema.length > 0) {
        console.log('✅ Profiles table found!');
        console.log('📋 Columns:');
        profilesSchema.forEach(col => {
          console.log(`  - ${col.name} (${col.type})`);
        });
        
        // Check specifically for flip_balance
        const hasFlipBalance = profilesSchema.some(col => col.name === 'flip_balance');
        if (hasFlipBalance) {
          console.log('✅ flip_balance column exists!');
        } else {
          console.log('❌ flip_balance column missing!');
        }
        
        // Test a simple query
        try {
          const testQuery = await new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as count FROM profiles", [], (err, row) => {
              if (err) reject(err);
              else resolve(row);
            });
          });
          console.log(`📊 Profile count: ${testQuery.count}`);
        } catch (err) {
          console.log('❌ Error querying profiles:', err.message);
        }
        
      } else {
        console.log('❌ No profiles table found');
      }
      
      db.close();
      
    } catch (err) {
      console.log(`❌ Error accessing ${dbPath}:`, err.message);
    }
  }
}

checkDatabase().catch(console.error);
