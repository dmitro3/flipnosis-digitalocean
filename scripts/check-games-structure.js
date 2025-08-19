const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '../server/flipz-clean.db');

console.log('🔍 Checking games table structure...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    return;
  }
  console.log('✅ Connected to database');
});

// Get games table schema
db.all("PRAGMA table_info(games)", (err, columns) => {
  if (err) {
    console.error('❌ Error getting table schema:', err.message);
    return;
  }
  
  console.log('📋 Games table schema:');
  columns.forEach(col => {
    console.log(`  ${col.name}: ${col.type}`);
  });
  
  // Get recent games
  db.all("SELECT * FROM games ORDER BY created_at DESC LIMIT 3", (err, games) => {
    if (err) {
      console.error('❌ Error getting games:', err.message);
      return;
    }
    
    console.log(`\n🎮 Found ${games.length} recent games:`);
    games.forEach((game, index) => {
      console.log(`\n${index + 1}. Game ID: ${game.id}`);
      console.log(`   Creator: ${game.creator}`);
      console.log(`   Status: ${game.status}`);
      console.log(`   Created: ${game.created_at}`);
      // Log all columns to see what's available
      Object.keys(game).forEach(key => {
        if (key !== 'id' && key !== 'creator' && key !== 'status' && key !== 'created_at') {
          console.log(`   ${key}: ${game[key]}`);
        }
      });
    });
    
    db.close();
  });
});
