const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '../server/flipz-clean.db');

console.log('🔍 Checking offers table...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    return;
  }
  console.log('✅ Connected to database');
});

// Check if offers table exists
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='offers'", (err, row) => {
  if (err) {
    console.error('❌ Error checking offers table:', err.message);
    return;
  }
  
  if (!row) {
    console.log('❌ Offers table does not exist');
    return;
  }
  
  console.log('✅ Offers table exists');
  
  // Get table schema
  db.all("PRAGMA table_info(offers)", (err, columns) => {
    if (err) {
      console.error('❌ Error getting table schema:', err.message);
      return;
    }
    
    console.log('📋 Offers table schema:');
    columns.forEach(col => {
      console.log(`  ${col.name}: ${col.type}`);
    });
    
    // Get all offers
    db.all("SELECT * FROM offers ORDER BY created_at DESC LIMIT 10", (err, offers) => {
      if (err) {
        console.error('❌ Error getting offers:', err.message);
        return;
      }
      
      console.log(`\n💰 Found ${offers.length} offers:`);
      offers.forEach((offer, index) => {
        console.log(`\n${index + 1}. Offer ID: ${offer.id}`);
        console.log(`   Listing ID: ${offer.listing_id}`);
        console.log(`   Offerer: ${offer.offerer_address}`);
        console.log(`   Price: $${offer.offer_price}`);
        console.log(`   Status: ${offer.status}`);
        console.log(`   Created: ${offer.created_at}`);
        if (offer.message) {
          console.log(`   Message: ${offer.message}`);
        }
      });
      
      db.close();
    });
  });
});
