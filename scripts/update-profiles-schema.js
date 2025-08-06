const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function updateProfilesSchema() {
  const dbPath = path.join(__dirname, '../server/flipz-clean.db');
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err);
        reject(err);
        return;
      }
      
      console.log('✅ Connected to database for schema update');
      
      db.serialize(() => {
        // Add missing columns to profiles table
        const columnsToAdd = [
          'twitter TEXT',
          'telegram TEXT', 
          'xp INTEGER DEFAULT 0',
          'heads_image TEXT',
          'tails_image TEXT',
          'xp_name_earned BOOLEAN DEFAULT FALSE',
          'xp_avatar_earned BOOLEAN DEFAULT FALSE',
          'xp_twitter_earned BOOLEAN DEFAULT FALSE',
          'xp_telegram_earned BOOLEAN DEFAULT FALSE',
          'xp_heads_earned BOOLEAN DEFAULT FALSE',
          'xp_tails_earned BOOLEAN DEFAULT FALSE',
          'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
          'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
        ];
        
        columnsToAdd.forEach((columnDef) => {
          const columnName = columnDef.split(' ')[0];
          
          db.run(`ALTER TABLE profiles ADD COLUMN ${columnDef}`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
              console.error(`❌ Error adding column ${columnName}:`, err.message);
            } else if (err && err.message.includes('duplicate column name')) {
              console.log(`ℹ️ Column ${columnName} already exists`);
            } else {
              console.log(`✅ Added column ${columnName}`);
            }
          });
        });
        
        // Create game_shares table
        db.run(`
          CREATE TABLE IF NOT EXISTS game_shares (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            game_id TEXT NOT NULL,
            player_address TEXT NOT NULL,
            share_platform TEXT NOT NULL,
            xp_awarded BOOLEAN DEFAULT FALSE,
            shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(game_id, player_address, share_platform)
          )
        `, (err) => {
          if (err) {
            console.error('❌ Error creating game_shares table:', err);
          } else {
            console.log('✅ Game shares table ready');
          }
        });
        
        // Close database after all operations
        db.close((err) => {
          if (err) {
            console.error('❌ Error closing database:', err);
            reject(err);
          } else {
            console.log('✅ Database schema update completed successfully');
            resolve();
          }
        });
      });
    });
  });
}

// Run the migration if called directly
if (require.main === module) {
  updateProfilesSchema()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { updateProfilesSchema }; 