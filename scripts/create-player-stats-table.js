const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '../server/games.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log('Connected to database');
});

async function createPlayerStatsTable() {
  console.log('🔄 Creating player_stats table...');

  try {
    // Drop the table if it exists to recreate it with correct schema
    await new Promise((resolve, reject) => {
      db.run('DROP TABLE IF EXISTS player_stats', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Create the player_stats table with correct schema
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE player_stats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_address TEXT NOT NULL,
          chain TEXT DEFAULT 'base',
          total_games INTEGER DEFAULT 0,
          games_won INTEGER DEFAULT 0,
          games_lost INTEGER DEFAULT 0,
          total_volume DECIMAL(20, 8) DEFAULT 0,
          total_fees_paid DECIMAL(20, 8) DEFAULT 0,
          total_rewards_earned DECIMAL(20, 8) DEFAULT 0,
          nfts_in_contract INTEGER DEFAULT 0,
          unclaimed_eth DECIMAL(20, 8) DEFAULT 0,
          unclaimed_usdc DECIMAL(20, 8) DEFAULT 0,
          unclaimed_nfts TEXT,
          last_activity TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_address, chain)
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('✅ Player stats table created successfully');

    // Verify the table was created
    const tableInfo = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(player_stats)", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    console.log('\n📋 Player stats table schema:');
    tableInfo.forEach(col => {
      console.log(`  ${col.name} (${col.type})`);
    });

  } catch (error) {
    console.error('❌ Error creating player_stats table:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('✅ Database connection closed');
      }
    });
  }
}

// Run the script
createPlayerStatsTable().catch(console.error); 