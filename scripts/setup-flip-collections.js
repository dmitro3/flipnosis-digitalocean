const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function setupFlipCollections() {
  console.log('🔧 Setting up FLIP collections database...\n');
  
  const dbPath = path.join(__dirname, '..', 'server', 'database.sqlite');
  
  // Connect to the database
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ Error opening database:', err);
      process.exit(1);
    }
    console.log('✅ Connected to database:', dbPath);
  });

  try {
    // Create flip_collections table
    console.log('📋 Creating flip_collections table...');
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS flip_collections (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          game_id TEXT NOT NULL,
          player_address TEXT NOT NULL,
          total_flip_earned INTEGER NOT NULL DEFAULT 0,
          flip_collected INTEGER NOT NULL DEFAULT 0,
          collection_status TEXT DEFAULT 'pending',
          game_result TEXT,
          nft_claimed BOOLEAN DEFAULT FALSE,
          created_at TEXT NOT NULL,
          collected_at TEXT,
          expires_at TEXT
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ flip_collections table created');

    // Create flip_earnings table
    console.log('📋 Creating flip_earnings table...');
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS flip_earnings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          game_id TEXT NOT NULL,
          player_address TEXT NOT NULL,
          flip_amount INTEGER NOT NULL,
          reason TEXT NOT NULL,
          collection_id INTEGER,
          earned_at TEXT NOT NULL,
          FOREIGN KEY (collection_id) REFERENCES flip_collections(id)
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ flip_earnings table created');

    // Add XP column to profiles table if it doesn't exist
    console.log('📋 Checking for XP column in profiles table...');
    const profileSchema = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(profiles)", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    const hasXPColumn = profileSchema.some(col => col.name === 'xp');
    if (!hasXPColumn) {
      console.log('📋 Adding XP column to profiles table...');
      await new Promise((resolve, reject) => {
        db.run("ALTER TABLE profiles ADD COLUMN xp INTEGER DEFAULT 0", (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log('✅ XP column added to profiles table');
    } else {
      console.log('✅ XP column already exists in profiles table');
    }

    // Create indexes
    console.log('📋 Creating indexes...');
    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_flip_collections_game_id ON flip_collections(game_id)",
      "CREATE INDEX IF NOT EXISTS idx_flip_collections_player_address ON flip_collections(player_address)",
      "CREATE INDEX IF NOT EXISTS idx_flip_collections_status ON flip_collections(collection_status)",
      "CREATE INDEX IF NOT EXISTS idx_flip_earnings_game_id ON flip_earnings(game_id)",
      "CREATE INDEX IF NOT EXISTS idx_flip_earnings_player_address ON flip_earnings(player_address)",
      "CREATE INDEX IF NOT EXISTS idx_flip_earnings_collection_id ON flip_earnings(collection_id)"
    ];

    for (const indexQuery of indexes) {
      await new Promise((resolve, reject) => {
        db.run(indexQuery, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    console.log('✅ Indexes created');

    // Show final schema
    console.log('\n📋 Final profiles table schema:');
    const finalSchema = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(profiles)", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    finalSchema.forEach(col => {
      console.log(`  ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });

    console.log('\n✅ FLIP collections database setup completed!');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
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
setupFlipCollections().catch(console.error);
