const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '../server/flipz-clean.db');

console.log('🔍 Checking for game/listing data...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    return;
  }
  console.log('✅ Connected to database');
});

const gameId = 'game_1755622348054_dd45ba7e57f10cf6';
const listingId = 'listing_1755622345767_2309eb50f48e54fe';

// Check if game exists
db.get("SELECT * FROM games WHERE id = ?", [gameId], (err, game) => {
  if (err) {
    console.error('❌ Error checking game:', err.message);
    return;
  }
  
  if (game) {
    console.log('✅ Game found in database:');
    console.log('   ID:', game.id);
    console.log('   Listing ID:', game.listing_id);
    console.log('   Creator:', game.creator);
    console.log('   Status:', game.status);
    console.log('   Created:', game.created_at);
  } else {
    console.log('❌ Game not found in database:', gameId);
  }
  
  // Check if listing exists
  db.get("SELECT * FROM listings WHERE id = ? OR game_id = ?", [listingId, gameId], (err, listing) => {
    if (err) {
      console.error('❌ Error checking listing:', err.message);
      return;
    }
    
    if (listing) {
      console.log('\n✅ Listing found in database:');
      console.log('   ID:', listing.id);
      console.log('   Game ID:', listing.game_id);
      console.log('   Creator:', listing.creator);
      console.log('   Status:', listing.status);
      console.log('   NFT Name:', listing.nft_name);
      console.log('   Price:', listing.asking_price);
      console.log('   Created:', listing.created_at);
    } else {
      console.log('\n❌ Listing not found in database');
    }
    
    // Check all recent listings
    db.all("SELECT id, game_id, creator, nft_name, status, created_at FROM listings ORDER BY created_at DESC LIMIT 5", (err, listings) => {
      if (err) {
        console.error('❌ Error getting recent listings:', err.message);
        return;
      }
      
      console.log('\n📋 Recent listings:');
      listings.forEach((list, index) => {
        console.log(`${index + 1}. ${list.id}`);
        console.log(`   Game ID: ${list.game_id}`);
        console.log(`   Creator: ${list.creator}`);
        console.log(`   NFT: ${list.nft_name}`);
        console.log(`   Status: ${list.status}`);
        console.log(`   Created: ${list.created_at}`);
      });
      
      db.close();
    });
  });
});
