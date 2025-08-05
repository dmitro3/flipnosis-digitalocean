const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, '../server/games-v2.db');
const db = new sqlite3.Database(dbPath);

console.log('Running XP tracking migration...');

const migrationQueries = [
  'ALTER TABLE profiles ADD COLUMN xp_name_earned BOOLEAN DEFAULT FALSE',
  'ALTER TABLE profiles ADD COLUMN xp_avatar_earned BOOLEAN DEFAULT FALSE',
  'ALTER TABLE profiles ADD COLUMN xp_twitter_earned BOOLEAN DEFAULT FALSE',
  'ALTER TABLE profiles ADD COLUMN xp_telegram_earned BOOLEAN DEFAULT FALSE',
  'ALTER TABLE profiles ADD COLUMN xp_heads_earned BOOLEAN DEFAULT FALSE',
  'ALTER TABLE profiles ADD COLUMN xp_tails_earned BOOLEAN DEFAULT FALSE'
];

async function runMigration() {
  for (const query of migrationQueries) {
    try {
      await new Promise((resolve, reject) => {
        db.run(query, function(err) {
          if (err) {
            // If column already exists, that's fine
            if (err.message.includes('duplicate column name')) {
              console.log(`Column already exists, skipping: ${query}`);
              resolve();
            } else {
              reject(err);
            }
          } else {
            console.log(`Successfully executed: ${query}`);
            resolve();
          }
        });
      });
    } catch (error) {
      console.error(`Error executing query: ${query}`, error);
    }
  }
  
  console.log('XP tracking migration completed!');
  db.close();
}

runMigration().catch(console.error); 