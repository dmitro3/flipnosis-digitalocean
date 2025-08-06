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

async function checkSchema() {
  try {
    // Check games table schema
    const gamesSchema = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(games)", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    console.log('📋 Games table schema:');
    gamesSchema.forEach(col => {
      console.log(`  ${col.name} (${col.type})`);
    });

    // Check if there are any completed games
    const completedGames = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM games WHERE status = 'completed' LIMIT 5", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    console.log(`\n📊 Found ${completedGames.length} completed games (showing first 5):`);
    completedGames.forEach((game, index) => {
      console.log(`\nGame ${index + 1}:`);
      Object.keys(game).forEach(key => {
        console.log(`  ${key}: ${game[key]}`);
      });
    });

  } catch (error) {
    console.error('❌ Error checking schema:', error);
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
checkSchema().catch(console.error); 