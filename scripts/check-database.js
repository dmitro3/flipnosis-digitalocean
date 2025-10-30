const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./server/database.sqlite');

console.log('\n📊 Recent Battle Royale Games:');
console.log('════════════════════════════════════════════════════════════════\n');

db.all(`
  SELECT id, creator, winner_address, status, nft_deposited, nft_claimed, 
         created_at, nft_deposit_hash
  FROM battle_royale_games 
  ORDER BY created_at DESC 
  LIMIT 10
`, [], (err, rows) => {
  if (err) {
    console.error('Error:', err.message);
    db.close();
    return;
  }

  if (rows.length === 0) {
    console.log('No games found in database.\n');
    db.close();
    return;
  }

  rows.forEach((row, index) => {
    console.log(`${index + 1}. Game ID: ${row.id}`);
    console.log(`   Creator: ${row.creator}`);
    console.log(`   Winner: ${row.winner_address || 'Not set'}`);
    console.log(`   Status: ${row.status}`);
    console.log(`   NFT Deposited: ${row.nft_deposited ? 'Yes' : 'No'}`);
    console.log(`   NFT Claimed: ${row.nft_claimed ? 'Yes' : 'No'}`);
    console.log(`   Deposit Hash: ${row.nft_deposit_hash || 'None'}`);
    console.log(`   Created: ${row.created_at}\n`);
  });

  console.log('\n🔍 Looking for game with "1761831327138" timestamp...\n');
  
  db.all(`
    SELECT id, creator, winner_address, status, nft_deposited 
    FROM battle_royale_games 
    WHERE id LIKE '%1761831327138%'
  `, [], (err, matches) => {
    if (err) {
      console.error('Error:', err.message);
    } else if (matches.length > 0) {
      console.log(`✅ Found ${matches.length} matching game(s):`);
      matches.forEach(match => {
        console.log(`   ${match.id} - Status: ${match.status}, NFT Deposited: ${match.nft_deposited}`);
      });
    } else {
      console.log('❌ No games found with that timestamp');
      console.log('   The game may have been deleted or never created in the database');
    }
    
    db.close();
  });
});
