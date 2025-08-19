const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '../server/flipz-clean.db');

console.log('🔍 Checking games and their listing IDs...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    return;
  }
  console.log('✅ Connected to database');
});

// Check recent games and their listing IDs
db.all("SELECT id, listing_id, creator, status, created_at FROM games ORDER BY created_at DESC LIMIT 10", (err, games) => {
  if (err) {
    console.error('❌ Error getting games:', err.message);
    return;
  }
  
  console.log(`\n🎮 Found ${games.length} recent games:`);
  games.forEach((game, index) => {
    console.log(`\n${index + 1}. Game ID: ${game.id}`);
    console.log(`   Listing ID: ${game.listing_id}`);
    console.log(`   Creator: ${game.creator}`);
    console.log(`   Status: ${game.status}`);
    console.log(`   Created: ${game.created_at}`);
  });
  
  // Check if the specific game ID from console exists
  const gameId = 'game_1755622348054_dd45ba7e57f10cf6';
  db.get("SELECT * FROM games WHERE id = ?", [gameId], (err, game) => {
    if (err) {
      console.error('❌ Error checking specific game:', err.message);
      return;
    }
    
    if (!game) {
      console.log(`\n❌ Game not found: ${gameId}`);
    } else {
      console.log(`\n✅ Game found: ${gameId}`);
      console.log(`   Listing ID: ${game.listing_id}`);
      console.log(`   Creator: ${game.creator}`);
      console.log(`   Status: ${game.status}`);
    }
    
    db.close();
  });
});
