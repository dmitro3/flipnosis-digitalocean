// Safe script to add missing columns to battle_royale_games on remote server
// This ONLY adds columns, does NOT modify or delete any existing data
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path - adjust if needed
const dbPath = process.argv[2] || '/opt/flipnosis/app/server/database.sqlite';

console.log('🔧 Adding missing columns to battle_royale_games table...');
console.log('📁 Database path:', dbPath);
console.log('⚠️  This script ONLY adds columns - it does NOT modify existing data');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
    console.error('💡 Make sure you run this on the server with the correct database path');
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

// Columns to add (if they don't exist)
const columnsToAdd = [
  { name: 'winner_address', sql: 'ALTER TABLE battle_royale_games ADD COLUMN winner_address TEXT' },
  { name: 'winner', sql: 'ALTER TABLE battle_royale_games ADD COLUMN winner TEXT' },
  { name: 'creator_paid', sql: 'ALTER TABLE battle_royale_games ADD COLUMN creator_paid BOOLEAN DEFAULT 0' },
  { name: 'nft_claimed', sql: 'ALTER TABLE battle_royale_games ADD COLUMN nft_claimed BOOLEAN DEFAULT 0' },
  { name: 'nft_collection', sql: 'ALTER TABLE battle_royale_games ADD COLUMN nft_collection TEXT' }
];

// First check what columns exist
db.all("PRAGMA table_info(battle_royale_games)", [], (err, existingColumns) => {
  if (err) {
    console.error('❌ Error checking schema:', err);
    db.close();
    process.exit(1);
  }
  
  const existingColumnNames = existingColumns.map(c => c.name.toLowerCase());
  console.log(`\n📊 Found ${existingColumns.length} existing columns`);
  
  // Filter out columns that already exist
  const missingColumns = columnsToAdd.filter(col => 
    !existingColumnNames.includes(col.name.toLowerCase())
  );
  
  if (missingColumns.length === 0) {
    console.log('✅ All required columns already exist!');
  } else {
    console.log(`\n⚠️  Found ${missingColumns.length} missing columns to add:`);
    missingColumns.forEach(col => console.log(`  - ${col.name}`));
  }
  
  // Add missing columns one by one
  let added = 0;
  let skipped = 0;
  let index = 0;
  
  if (missingColumns.length === 0) {
    // No columns to add, but check for games that need winner_address fixed
    fixExistingGames();
    return;
  }
  
  missingColumns.forEach((col) => {
    db.run(col.sql, [], function(alterErr) {
      if (alterErr) {
        if (alterErr.message.includes('duplicate column') || alterErr.message.includes('already exists')) {
          console.log(`⚠️  Column ${col.name} already exists (skipping)`);
          skipped++;
        } else {
          console.error(`❌ Error adding ${col.name}:`, alterErr.message);
          skipped++;
        }
      } else {
        console.log(`✅ Added column: ${col.name}`);
        added++;
      }
      
      index++;
      if (index === missingColumns.length) {
        console.log(`\n📊 Results: ${added} added, ${skipped} skipped`);
        
        // Now fix existing games
        fixExistingGames();
      }
    });
  });
});

function fixExistingGames() {
  console.log('\n🔍 Checking for completed games that need winner_address fixed...');
  
  db.all(`
    SELECT id, winner, winner_address, status
    FROM battle_royale_games
    WHERE status = 'completed' 
      AND (winner_address IS NULL OR winner_address = '') 
      AND winner IS NOT NULL 
      AND winner != ''
    LIMIT 50
  `, [], (err, games) => {
    if (err) {
      console.error('❌ Error checking games:', err);
      db.close();
      process.exit(1);
    }
    
    if (games.length === 0) {
      console.log('✅ No games need fixing');
      db.close();
      console.log('\n✅ All done! Columns added and data fixed.');
      process.exit(0);
    }
    
    console.log(`\n⚠️  Found ${games.length} completed games with winner but no winner_address`);
    console.log('🔧 Fixing these games...');
    
    let fixed = 0;
    let errors = 0;
    let fixIndex = 0;
    
    games.forEach((game) => {
      db.run(
        `UPDATE battle_royale_games 
         SET winner_address = ? 
         WHERE id = ? 
           AND (winner_address IS NULL OR winner_address = '')`,
        [game.winner, game.id],
        function(updateErr) {
          if (updateErr) {
            console.error(`❌ Error fixing game ${game.id}:`, updateErr.message);
            errors++;
          } else {
            console.log(`✅ Fixed game ${game.id}: set winner_address = ${game.winner}`);
            fixed++;
          }
          
          fixIndex++;
          if (fixIndex === games.length) {
            console.log(`\n📊 Fixed ${fixed} games, ${errors} errors`);
            db.close((closeErr) => {
              if (closeErr) {
                console.error('Error closing database:', closeErr);
                process.exit(1);
              }
              console.log('\n✅ All done! Columns added and data fixed.');
              process.exit(0);
            });
          }
        }
      );
    });
  });
}

