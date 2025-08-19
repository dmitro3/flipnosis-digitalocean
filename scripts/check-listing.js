const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '../server/flipz-clean.db');

console.log('🔍 Checking listing...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    return;
  }
  console.log('✅ Connected to database');
});

const listingId = 'listing_1755622345767_2309eb50f48e54fe';

// Check if listing exists
db.get("SELECT * FROM listings WHERE id = ?", [listingId], (err, listing) => {
  if (err) {
    console.error('❌ Error checking listing:', err.message);
    return;
  }
  
  if (!listing) {
    console.log('❌ Listing not found:', listingId);
    
    // Check what listings exist
    db.all("SELECT id, creator, nft_name, status, created_at FROM listings ORDER BY created_at DESC LIMIT 5", (err, listings) => {
      if (err) {
        console.error('❌ Error getting listings:', err.message);
        return;
      }
      
      console.log('\n📋 Available listings:');
      listings.forEach((list, index) => {
        console.log(`${index + 1}. ${list.id}`);
        console.log(`   Creator: ${list.creator}`);
        console.log(`   NFT: ${list.nft_name}`);
        console.log(`   Status: ${list.status}`);
        console.log(`   Created: ${list.created_at}`);
      });
      
      db.close();
    });
    return;
  }
  
  console.log('✅ Listing found:');
  console.log('   ID:', listing.id);
  console.log('   Creator:', listing.creator);
  console.log('   NFT:', listing.nft_name);
  console.log('   Status:', listing.status);
  console.log('   Price:', listing.asking_price);
  console.log('   Created:', listing.created_at);
  
  // Check if there are any offers for this listing
  db.all("SELECT * FROM offers WHERE listing_id = ?", [listingId], (err, offers) => {
    if (err) {
      console.error('❌ Error getting offers:', err.message);
      return;
    }
    
    console.log(`\n💰 Found ${offers.length} offers for this listing:`);
    offers.forEach((offer, index) => {
      console.log(`\n${index + 1}. Offer ID: ${offer.id}`);
      console.log(`   Offerer: ${offer.offerer_address}`);
      console.log(`   Price: $${offer.offer_price}`);
      console.log(`   Status: ${offer.status}`);
      console.log(`   Created: ${offer.created_at}`);
    });
    
    db.close();
  });
});
