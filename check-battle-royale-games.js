const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'flipz.db');
console.log('Checking battle royale games:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('✅ Connected to database');
});

// Check battle royale games
db.all("SELECT * FROM battle_royale_games ORDER BY created_at DESC", (err, games) => {
  if (err) {
    console.error('Error getting battle royale games:', err.message);
    return;
  }
  
  console.log(`\n🎮 Battle Royale Games (${games.length} total):`);
  games.forEach((game, index) => {
    console.log(`  ${index + 1}. Game ${game.id}: ${game.status} (${game.created_at})`);
    console.log(`     Entry Fee: ${game.entry_fee}, Max Players: ${game.max_players}`);
  });
  
  // Check participants
  db.all("SELECT * FROM battle_royale_participants", (err, participants) => {
    if (err) {
      console.error('Error getting participants:', err.message);
      return;
    }
    
    console.log(`\n👥 Battle Royale Participants (${participants.length} total):`);
    participants.forEach((participant, index) => {
      console.log(`  ${index + 1}. Game ${participant.game_id}: ${participant.player_address} (${participant.status})`);
    });
    
    db.close();
  });
});
