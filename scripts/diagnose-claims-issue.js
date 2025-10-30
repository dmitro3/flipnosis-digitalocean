// Diagnostic script to check battle_royale_games table for claims issue
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'server', 'database.sqlite');

console.log('🔍 Diagnosing claims issue...');
console.log('📁 Database path:', dbPath);
console.log('📁 Database exists:', fs.existsSync(dbPath));

if (!fs.existsSync(dbPath)) {
  console.error('❌ Database file not found!');
  process.exit(1);
}

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

// Check table schema
console.log('\n📋 Checking table schema...');
db.all("PRAGMA table_info(battle_royale_games)", [], (err, columns) => {
  if (err) {
    console.error('❌ Error getting schema:', err);
    db.close();
    process.exit(1);
  }
  
  console.log('\n📊 Column information:');
  const columnNames = columns.map(c => c.name);
  columns.forEach(col => {
    console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
  });
  
  // Check for critical columns
  const requiredColumns = [
    'winner_address',
    'winner',
    'status',
    'creator_paid',
    'nft_claimed',
    'nft_collection',
    'creator',
    'entry_fee',
    'service_fee',
    'max_players',
    'nft_name',
    'nft_image',
    'nft_contract',
    'nft_token_id'
  ];
  
  console.log('\n🔍 Checking for required columns:');
  const missingColumns = [];
  requiredColumns.forEach(col => {
    const exists = columnNames.includes(col);
    console.log(`  ${exists ? '✅' : '❌'} ${col}: ${exists ? 'EXISTS' : 'MISSING'}`);
    if (!exists) {
      missingColumns.push(col);
    }
  });
  
  // Check completed games
  console.log('\n🎮 Checking completed games...');
  db.all(`
    SELECT id, creator, winner, winner_address, status, creator_paid, nft_claimed, 
           nft_name, nft_collection, completed_at
    FROM battle_royale_games 
    WHERE status = 'completed'
    ORDER BY completed_at DESC
    LIMIT 10
  `, [], (err, games) => {
    if (err) {
      console.error('❌ Error querying games:', err);
    } else {
      console.log(`\n📈 Found ${games.length} completed games:`);
      games.forEach((game, idx) => {
        console.log(`\n  Game ${idx + 1}:`);
        console.log(`    ID: ${game.id}`);
        console.log(`    Creator: ${game.creator}`);
        console.log(`    Winner: ${game.winner || 'NULL'}`);
        console.log(`    Winner Address: ${game.winner_address || 'NULL'}`);
        console.log(`    Status: ${game.status}`);
        console.log(`    Creator Paid: ${game.creator_paid}`);
        console.log(`    NFT Claimed: ${game.nft_claimed}`);
        console.log(`    NFT Name: ${game.nft_name || 'NULL'}`);
        console.log(`    NFT Collection: ${game.nft_collection || 'NULL'}`);
        console.log(`    Completed At: ${game.completed_at || 'NULL'}`);
      });
    }
    
    // Test the actual query from the API
    console.log('\n🔍 Testing claimables query for winner (using a sample address)...');
    db.all(`
      SELECT br.id as gameId, br.nft_contract, br.nft_token_id, br.nft_name, br.nft_image
      FROM battle_royale_games br
      WHERE br.winner_address = ? AND br.status = 'completed' AND (br.nft_claimed IS NULL OR br.nft_claimed = 0)
    `, [games.length > 0 ? games[0].winner_address : 'test'], (err, winnerClaims) => {
      if (err) {
        console.error('❌ Error testing winner claims query:', err);
      } else {
        console.log(`  Found ${winnerClaims.length} winner claims`);
        if (winnerClaims.length > 0) {
          console.log('  Sample winner claim:', winnerClaims[0]);
        }
      }
      
      // Test creator query
      console.log('\n🔍 Testing claimables query for creator...');
      if (games.length > 0) {
        db.all(`
          SELECT br.id as gameId, br.creator, br.entry_fee, br.service_fee, br.max_players, 
                 br.nft_name, br.nft_image, br.nft_collection, br.nft_contract, br.nft_token_id
          FROM battle_royale_games br
          WHERE br.creator = ? AND br.status = 'completed' AND (br.creator_paid IS NULL OR br.creator_paid = 0)
        `, [games[0].creator?.toLowerCase() || 'test'], (err, creatorClaims) => {
          if (err) {
            console.error('❌ Error testing creator claims query:', err);
          } else {
            console.log(`  Found ${creatorClaims.length} creator claims`);
            if (creatorClaims.length > 0) {
              console.log('  Sample creator claim:', creatorClaims[0]);
            }
          }
          
          // Summary
          console.log('\n📋 SUMMARY:');
          if (missingColumns.length > 0) {
            console.log(`❌ Missing columns: ${missingColumns.join(', ')}`);
          } else {
            console.log('✅ All required columns exist');
          }
          
          if (games.length === 0) {
            console.log('⚠️  No completed games found');
          } else {
            const gamesWithWinner = games.filter(g => g.winner_address);
            console.log(`📊 Games with winner_address: ${gamesWithWinner.length}/${games.length}`);
            const gamesWithoutWinner = games.filter(g => !g.winner_address && g.winner);
            if (gamesWithoutWinner.length > 0) {
              console.log(`⚠️  ${gamesWithoutWinner.length} games have 'winner' but no 'winner_address'`);
            }
          }
          
          db.close((err) => {
            if (err) {
              console.error('Error closing database:', err);
            } else {
              console.log('\n✅ Diagnosis complete');
            }
            process.exit(missingColumns.length > 0 ? 1 : 0);
          });
        });
      } else {
        db.close();
        console.log('\n✅ Diagnosis complete (no completed games to test)');
        process.exit(0);
      }
    });
  });
});
