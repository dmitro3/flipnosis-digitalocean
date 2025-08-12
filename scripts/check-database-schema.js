const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Check the actual database schema on the server
async function checkDatabaseSchema() {
  const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'server', 'flipz-clean.db');
  
  console.log('🔍 Checking database schema...');
  console.log(`📁 Database path: ${dbPath}`);
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err);
        return reject(err);
      }
      console.log('✅ Database opened successfully');
    });

    db.serialize(() => {
      // Check games table schema
      console.log('\n🎮 GAMES TABLE SCHEMA:');
      db.all("PRAGMA table_info(games)", (err, columns) => {
        if (err) {
          console.error('❌ Error checking games table schema:', err);
          db.close();
          return reject(err);
        }

        console.log('📋 Current columns in games table:');
        columns.forEach(col => {
          console.log(`  - ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
        });

        // Check what columns are missing from expected schema
        const expectedColumns = [
          'id', 'listing_id', 'offer_id', 'blockchain_game_id', 'creator', 'challenger',
          'nft_contract', 'nft_token_id', 'nft_name', 'nft_image', 'nft_collection',
          'final_price', 'coin_data', 'status', 'creator_deposited', 'challenger_deposited',
          'deposit_deadline', 'winner', 'game_data', 'created_at', 'updated_at'
        ];

        const actualColumns = columns.map(col => col.name);
        const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
        
        console.log('\n❌ MISSING COLUMNS:');
        if (missingColumns.length === 0) {
          console.log('  ✅ No missing columns!');
        } else {
          missingColumns.forEach(col => {
            console.log(`  - ${col}`);
          });
        }

        // Check other tables too
        console.log('\n📋 ALL TABLES IN DATABASE:');
        db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
          if (err) {
            console.error('❌ Error listing tables:', err);
          } else {
            tables.forEach(table => {
              console.log(`  - ${table.name}`);
            });
          }
          
          // Close database
          db.close((err) => {
            if (err) {
              console.error('❌ Error closing database:', err);
              return reject(err);
            }
            console.log('\n✅ Database schema check completed');
            resolve(missingColumns);
          });
        });
      });
    });
  });
}

// Run the check
if (require.main === module) {
  checkDatabaseSchema()
    .then((missingColumns) => {
      if (missingColumns.length > 0) {
        console.log(`\n🔧 Found ${missingColumns.length} missing columns that need to be added`);
        process.exit(1);
      } else {
        console.log('\n🎉 Database schema is complete!');
        process.exit(0);
      }
    })
    .catch(err => {
      console.error('💥 Schema check failed:', err);
      process.exit(1);
    });
}

module.exports = checkDatabaseSchema;
