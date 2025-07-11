const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./server/games.db');

console.log('🔧 Updating database schema...');

// Add missing columns
const addColumns = [
  'ALTER TABLE games ADD COLUMN nft_collection TEXT',
  'ALTER TABLE games ADD COLUMN price_usd REAL',
  'ALTER TABLE games ADD COLUMN status TEXT DEFAULT "waiting"',
  'ALTER TABLE games ADD COLUMN game_type TEXT DEFAULT "nft-vs-crypto"',
  'ALTER TABLE games ADD COLUMN nft_chain TEXT DEFAULT "base"',
  'ALTER TABLE games ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
  'ALTER TABLE games ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
  'ALTER TABLE games ADD COLUMN winner TEXT',
  'ALTER TABLE games ADD COLUMN creator_wins INTEGER DEFAULT 0',
  'ALTER TABLE games ADD COLUMN joiner_wins INTEGER DEFAULT 0',
  'ALTER TABLE games ADD COLUMN current_round INTEGER DEFAULT 0',
  'ALTER TABLE games ADD COLUMN coin TEXT',
  'ALTER TABLE games ADD COLUMN transaction_hash TEXT',
  'ALTER TABLE games ADD COLUMN listing_fee_usd REAL',
  'ALTER TABLE games ADD COLUMN contract_game_id TEXT',
  'ALTER TABLE games ADD COLUMN challenger_nft_name TEXT',
  'ALTER TABLE games ADD COLUMN challenger_nft_image TEXT',
  'ALTER TABLE games ADD COLUMN challenger_nft_collection TEXT',
  'ALTER TABLE games ADD COLUMN challenger_nft_contract TEXT',
  'ALTER TABLE games ADD COLUMN challenger_nft_token_id TEXT'
];

let columnsAdded = 0;

addColumns.forEach((sql, index) => {
  db.run(sql, function(err) {
    if (err) {
      // Column might already exist, that's okay
      console.log(`⚠️  Column ${index + 1} might already exist:`, err.message);
    } else {
      columnsAdded++;
      console.log(`✅ Added column ${index + 1}`);
    }
    
    if (index === addColumns.length - 1) {
      console.log(`\n🎉 Schema update complete! Added ${columnsAdded} columns.`);
      
      // Show final schema
      db.all("PRAGMA table_info(games)", (err, columns) => {
        if (err) {
          console.error('❌ Error checking final schema:', err);
        } else {
          console.log('\n📋 Final games table schema:');
          columns.forEach(col => {
            console.log(`  - ${col.name} (${col.type})`);
          });
        }
        db.close();
      });
    }
  });
}); 