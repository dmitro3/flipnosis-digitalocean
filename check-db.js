const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./server/games.db');

console.log('🔍 Checking database contents...');

db.all('SELECT COUNT(*) as count FROM games', (err, rows) => {
  if (err) {
    console.error('❌ Error:', err);
  } else {
    console.log('📊 Total games:', rows[0].count);
  }
  
  if (rows[0].count > 0) {
    db.all('SELECT id, nft_name, nft_image, nft_collection FROM games LIMIT 5', (err, games) => {
      if (err) {
        console.error('❌ Error fetching games:', err);
      } else {
        console.log('📋 Sample games:');
        games.forEach(game => {
          console.log(`  - ID: ${game.id}`);
          console.log(`    Name: ${game.nft_name || 'NULL'}`);
          console.log(`    Image: ${game.nft_image || 'NULL'}`);
          console.log(`    Collection: ${game.nft_collection || 'NULL'}`);
          console.log('');
        });
      }
      db.close();
    });
  } else {
    console.log('📭 No games found in database');
    db.close();
  }
}); 