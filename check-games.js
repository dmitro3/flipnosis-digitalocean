const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Check the main database
const dbPath = path.join(__dirname, 'server', 'flipz.db');
console.log('Checking database:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('✅ Connected to database');
});

// Check game count
db.get("SELECT COUNT(*) as count FROM games", (err, row) => {
  if (err) {
    console.error('Error counting games:', err.message);
  } else {
    console.log(`🎮 Total games in database: ${row.count}`);
  }
});

// Check recent games
db.all("SELECT id, created_at, status FROM games ORDER BY created_at DESC LIMIT 10", (err, rows) => {
  if (err) {
    console.error('Error getting recent games:', err.message);
  } else {
    console.log('\n📅 Most recent games:');
    rows.forEach(game => {
      console.log(`  Game ${game.id}: ${game.status} (${game.created_at})`);
    });
  }
  
  db.close();
});
