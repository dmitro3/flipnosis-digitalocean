const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '../server/games-v2.db');

// SQL migration content
const migrationSQL = `
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  address TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar TEXT,
  heads_image TEXT,
  tails_image TEXT,
  twitter TEXT,
  telegram TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Create index on address for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_address ON profiles(address);

-- Create offers table if it doesn't exist
CREATE TABLE IF NOT EXISTS offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  game_id TEXT,
  nft_contract TEXT,
  nft_token_id TEXT,
  nft_name TEXT,
  nft_image TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Create indexes for offers table
CREATE INDEX IF NOT EXISTS idx_offers_from_address ON offers(from_address);
CREATE INDEX IF NOT EXISTS idx_offers_to_address ON offers(to_address);
CREATE INDEX IF NOT EXISTS idx_offers_game_id ON offers(game_id);
`;

async function runMigration() {
  console.log('🔄 Starting profiles table migration...');
  
  // Check if database file exists
  if (!fs.existsSync(dbPath)) {
    console.error('❌ Database file not found:', dbPath);
    process.exit(1);
  }

  const db = new sqlite3.Database(dbPath);

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Split SQL into individual statements
      const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
      
      let completed = 0;
      let errors = [];

      statements.forEach((statement, index) => {
        if (statement.trim()) {
          db.run(statement, function(err) {
            completed++;
            
            if (err) {
              console.error(`❌ Error executing statement ${index + 1}:`, err.message);
              errors.push(err);
            } else {
              console.log(`✅ Executed statement ${index + 1}`);
            }

            // Check if all statements are completed
            if (completed === statements.length) {
              db.close((closeErr) => {
                if (closeErr) {
                  console.error('❌ Error closing database:', closeErr.message);
                }

                if (errors.length > 0) {
                  console.error(`❌ Migration completed with ${errors.length} errors`);
                  reject(errors);
                } else {
                  console.log('✅ Profiles table migration completed successfully!');
                  resolve();
                }
              });
            }
          });
        }
      });
    });
  });
}

// Run migration if this script is executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('🎉 Migration script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration }; 