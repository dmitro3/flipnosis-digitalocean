const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Comprehensive database schema migration to align with expected schema
async function runComprehensiveMigration() {
  const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'server', 'flipz-clean.db');
  
  console.log('🔧 Running comprehensive database schema migration...');
  console.log(`📁 Database path: ${dbPath}`);
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err);
        return reject(err);
      }
      console.log('✅ Database opened successfully');
    });

    db.serialize(() => {
      // Add missing columns to games table
      const missingColumns = [
        'listing_id TEXT',
        'offer_id TEXT', 
        'challenger TEXT',
        'final_price REAL',
        'coin_data TEXT',
        'creator_deposited BOOLEAN DEFAULT false',
        'challenger_deposited BOOLEAN DEFAULT false'
      ];

      let completedColumns = 0;
      let hasError = false;

      console.log('🔧 Adding missing columns to games table...');
      
      missingColumns.forEach((columnDef, index) => {
        const columnName = columnDef.split(' ')[0];
        
        db.run(`ALTER TABLE games ADD COLUMN ${columnDef}`, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error(`❌ Error adding ${columnName}:`, err.message);
            hasError = true;
          } else if (!err) {
            console.log(`✅ Added column: ${columnName}`);
          } else {
            console.log(`ℹ️  Column ${columnName} already exists`);
          }
          
          completedColumns++;
          
          // When all columns are processed
          if (completedColumns === missingColumns.length) {
            if (hasError) {
              db.close();
              return reject(new Error('Some columns failed to be added'));
            }
            
            console.log('\n🔄 Migrating existing data...');
            
            // Update challenger column with joiner data where challenger is null
            db.run(`UPDATE games SET challenger = joiner WHERE challenger IS NULL AND joiner IS NOT NULL`, (err) => {
              if (err) {
                console.error('❌ Error migrating joiner to challenger:', err);
                db.close();
                return reject(err);
              }
              console.log('✅ Migrated joiner data to challenger column');
              
              // Update final_price with price_usd data where final_price is null  
              db.run(`UPDATE games SET final_price = price_usd WHERE final_price IS NULL AND price_usd IS NOT NULL`, (err) => {
                if (err) {
                  console.error('❌ Error migrating price_usd to final_price:', err);
                  db.close();
                  return reject(err);
                }
                console.log('✅ Migrated price_usd data to final_price column');
                
                // Generate listing_id for existing games that don't have one
                db.run(`UPDATE games SET listing_id = 'listing_' || CAST((ABS(RANDOM()) % 9000000000000 + 1000000000000) AS TEXT) || '_legacy' WHERE listing_id IS NULL`, (err) => {
                  if (err) {
                    console.error('❌ Error generating listing_id:', err);
                    db.close();
                    return reject(err);
                  }
                  console.log('✅ Generated listing_id for existing games');
                  
                  // Close database
                  db.close((err) => {
                    if (err) {
                      console.error('❌ Error closing database:', err);
                      return reject(err);
                    }
                    console.log('\n🎉 Comprehensive schema migration completed successfully!');
                    resolve();
                  });
                });
              });
            });
          }
        });
      });
    });
  });
}

// Run the migration
if (require.main === module) {
  runComprehensiveMigration()
    .then(() => {
      console.log('✨ Database schema is now fully compatible!');
      process.exit(0);
    })
    .catch(err => {
      console.error('💥 Migration failed:', err);
      process.exit(1);
    });
}

module.exports = runComprehensiveMigration;
