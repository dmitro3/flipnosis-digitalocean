const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '../server/flipz-clean.db');

console.log('🔧 Adding listing_id column to games table...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    return;
  }
  console.log('✅ Connected to database');
});

// Check if listing_id column already exists
db.all("PRAGMA table_info(games)", (err, columns) => {
  if (err) {
    console.error('❌ Error checking table schema:', err.message);
    return;
  }
  
  const hasListingId = columns.some(col => col.name === 'listing_id');
  
  if (hasListingId) {
    console.log('✅ listing_id column already exists');
    db.close();
    return;
  }
  
  console.log('📋 Adding listing_id column...');
  
  // Add the listing_id column
  db.run("ALTER TABLE games ADD COLUMN listing_id TEXT", (err) => {
    if (err) {
      console.error('❌ Error adding listing_id column:', err.message);
      return;
    }
    
    console.log('✅ Successfully added listing_id column to games table');
    
    // Update existing games to have a listing_id (use the game id as listing_id for now)
    db.run("UPDATE games SET listing_id = id WHERE listing_id IS NULL", (err) => {
      if (err) {
        console.error('❌ Error updating existing games:', err.message);
        return;
      }
      
      console.log('✅ Updated existing games with listing_id');
      
      // Verify the changes
      db.all("SELECT id, listing_id, creator, status FROM games LIMIT 5", (err, games) => {
        if (err) {
          console.error('❌ Error verifying changes:', err.message);
          return;
        }
        
        console.log('\n📋 Updated games:');
        games.forEach((game, index) => {
          console.log(`${index + 1}. Game ID: ${game.id}`);
          console.log(`   Listing ID: ${game.listing_id}`);
          console.log(`   Creator: ${game.creator}`);
          console.log(`   Status: ${game.status}`);
        });
        
        db.close();
      });
    });
  });
});
