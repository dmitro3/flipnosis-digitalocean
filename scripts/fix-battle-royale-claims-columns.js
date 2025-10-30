// Safe migration script to add missing columns to battle_royale_games table
// This script will NOT overwrite existing data, only add missing columns

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Allow database path to be passed as argument
const dbPath = process.argv[2] || path.join(__dirname, '..', 'server', 'database.sqlite');

console.log('🔧 Fixing battle_royale_games table columns...');
console.log('📁 Database path:', dbPath);

if (!fs.existsSync(dbPath)) {
  console.error('❌ Database file not found!');
  console.log('💡 Usage: node scripts/fix-battle-royale-claims-columns.js [path/to/database.sqlite]');
  process.exit(1);
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

// Required columns for claims to work
const requiredColumns = [
  { name: 'winner_address', type: 'TEXT', after: 'round_deadline' },
  { name: 'winner', type: 'TEXT', after: 'winner_address' },
  { name: 'creator_paid', type: 'BOOLEAN DEFAULT 0', after: 'creator_participates' },
  { name: 'nft_claimed', type: 'BOOLEAN DEFAULT 0', after: 'creator_paid' },
  { name: 'nft_collection', type: 'TEXT', after: 'nft_name' }
];

// SQLite doesn't support ALTER TABLE ADD COLUMN with AFTER, but that's fine
// We just need to add missing columns
console.log('\n📋 Checking existing columns...');
db.all("PRAGMA table_info(battle_royale_games)", [], (err, existingColumns) => {
  if (err) {
    console.error('❌ Error getting schema:', err);
    db.close();
    process.exit(1);
  }
  
  const existingColumnNames = existingColumns.map(c => c.name.toLowerCase());
  const missingColumns = requiredColumns.filter(col => 
    !existingColumnNames.includes(col.name.toLowerCase())
  );
  
  if (missingColumns.length === 0) {
    console.log('✅ All required columns exist!');
    
    // Still check if there are games with missing winner_address
    db.all(`
      SELECT id, winner, winner_address, status
      FROM battle_royale_games
      WHERE status = 'completed' AND (winner_address IS NULL OR winner_address = '') AND winner IS NOT NULL
      LIMIT 10
    `, [], (err, games) => {
      if (err) {
        console.error('❌ Error checking games:', err);
        db.close();
        process.exit(1);
      }
      
      if (games.length > 0) {
        console.log(`\n⚠️  Found ${games.length} completed games with winner but no winner_address`);
        console.log('🔧 Fixing these games...');
        
        let fixed = 0;
        let errors = 0;
        
        games.forEach((game, idx) => {
          db.run(
            `UPDATE battle_royale_games 
             SET winner_address = ? 
             WHERE id = ? AND (winner_address IS NULL OR winner_address = '')`,
            [game.winner, game.id],
            function(updateErr) {
              if (updateErr) {
                console.error(`❌ Error fixing game ${game.id}:`, updateErr);
                errors++;
              } else {
                console.log(`✅ Fixed game ${game.id}: set winner_address = ${game.winner}`);
                fixed++;
              }
              
              if (idx === games.length - 1) {
                console.log(`\n📊 Fixed ${fixed} games, ${errors} errors`);
                db.close((closeErr) => {
                  if (closeErr) {
                    console.error('Error closing database:', closeErr);
                    process.exit(1);
                  }
                  console.log('✅ Migration complete');
                  process.exit(0);
                });
              }
            }
          );
        });
      } else {
        console.log('✅ No games need fixing');
        db.close();
        console.log('✅ Migration complete');
        process.exit(0);
      }
    });
    return;
  }
  
  console.log(`\n⚠️  Found ${missingColumns.length} missing columns:`);
  missingColumns.forEach(col => {
    console.log(`  - ${col.name} (${col.type})`);
  });
  
  console.log('\n🔧 Adding missing columns...');
  
  // SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
  // So we'll try to add each one and catch errors
  let added = 0;
  let skipped = 0;
  let index = 0;
  
  missingColumns.forEach((col) => {
    // Build the ALTER TABLE statement
    // Remove the 'after' directive since SQLite doesn't support it
    const typeDef = col.type;
    const sql = `ALTER TABLE battle_royale_games ADD COLUMN ${col.name} ${typeDef}`;
    
    db.run(sql, [], function(alterErr) {
      if (alterErr) {
        // Column might already exist with different casing or type
        console.warn(`⚠️  Could not add ${col.name}:`, alterErr.message);
        skipped++;
      } else {
        console.log(`✅ Added column: ${col.name}`);
        added++;
      }
      
      index++;
      if (index === missingColumns.length) {
        console.log(`\n📊 Results: ${added} added, ${skipped} skipped`);
        
        // Now check for games with missing winner_address
        db.all(`
          SELECT id, winner, winner_address, status
          FROM battle_royale_games
          WHERE status = 'completed' AND (winner_address IS NULL OR winner_address = '') AND winner IS NOT NULL
          LIMIT 10
        `, [], (err, games) => {
          if (err) {
            console.error('❌ Error checking games:', err);
            db.close();
            process.exit(1);
          }
          
          if (games.length > 0) {
            console.log(`\n⚠️  Found ${games.length} completed games with winner but no winner_address`);
            console.log('🔧 Fixing these games...');
            
            let fixed = 0;
            let fixErrors = 0;
            let fixIndex = 0;
            
            games.forEach((game) => {
              db.run(
                `UPDATE battle_royale_games 
                 SET winner_address = ? 
                 WHERE id = ? AND (winner_address IS NULL OR winner_address = '')`,
                [game.winner, game.id],
                function(updateErr) {
                  if (updateErr) {
                    console.error(`❌ Error fixing game ${game.id}:`, updateErr);
                    fixErrors++;
                  } else {
                    console.log(`✅ Fixed game ${game.id}: set winner_address = ${game.winner}`);
                    fixed++;
                  }
                  
                  fixIndex++;
                  if (fixIndex === games.length) {
                    console.log(`\n📊 Fixed ${fixed} games, ${fixErrors} errors`);
                    db.close((closeErr) => {
                      if (closeErr) {
                        console.error('Error closing database:', closeErr);
                        process.exit(1);
                      }
                      console.log('✅ Migration complete');
                      process.exit(0);
                    });
                  }
                }
              );
            });
          } else {
            db.close((closeErr) => {
              if (closeErr) {
                console.error('Error closing database:', closeErr);
                process.exit(1);
              }
              console.log('✅ No games need fixing');
              console.log('✅ Migration complete');
              process.exit(0);
            });
          }
        });
      }
    });
  });
});

