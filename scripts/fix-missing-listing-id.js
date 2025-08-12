const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Add missing listing_id column to games table on Hetzner server
async function fixMissingListingId() {
  const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'server', 'flipz-clean.db');
  
  console.log('🔧 Fixing missing listing_id column in games table...');
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
      // First, check if the column already exists
      db.all("PRAGMA table_info(games)", (err, columns) => {
        if (err) {
          console.error('❌ Error checking table schema:', err);
          db.close();
          return reject(err);
        }

        const hasListingId = columns.some(col => col.name === 'listing_id');
        
        if (hasListingId) {
          console.log('✅ listing_id column already exists');
          db.close();
          return resolve();
        }

        console.log('🔧 Adding listing_id column to games table...');
        
        // Add the missing column
        db.run(`ALTER TABLE games ADD COLUMN listing_id TEXT`, (err) => {
          if (err) {
            console.error('❌ Error adding listing_id column:', err);
            db.close();
            return reject(err);
          }
          
          console.log('✅ listing_id column added successfully');
          
          // Close database
          db.close((err) => {
            if (err) {
              console.error('❌ Error closing database:', err);
              return reject(err);
            }
            console.log('✅ Database schema fix completed');
            resolve();
          });
        });
      });
    });
  });
}

// Run the fix
if (require.main === module) {
  fixMissingListingId()
    .then(() => {
      console.log('🎉 Schema fix completed successfully');
      process.exit(0);
    })
    .catch(err => {
      console.error('💥 Schema fix failed:', err);
      process.exit(1);
    });
}

module.exports = fixMissingListingId;
