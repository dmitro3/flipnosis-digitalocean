const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Fix the NOT NULL constraint on price_usd column
async function fixPriceUsdConstraint() {
  const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'server', 'flipz-clean.db');
  
  console.log('🔧 Fixing price_usd column constraint...');
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
      // First check the current schema
      console.log('🔍 Checking current games table schema...');
      db.all("PRAGMA table_info(games)", (err, columns) => {
        if (err) {
          console.error('❌ Error checking table schema:', err);
          db.close();
          return reject(err);
        }

        console.log('📋 Current columns with constraints:');
        columns.forEach(col => {
          const constraints = [];
          if (col.notnull) constraints.push('NOT NULL');
          if (col.pk) constraints.push('PRIMARY KEY');
          if (col.dflt_value !== null) constraints.push(`DEFAULT ${col.dflt_value}`);
          console.log(`  - ${col.name} (${col.type}) ${constraints.join(' ')}`);
        });

        // The issue is that SQLite doesn't allow removing NOT NULL constraints easily
        // We need to either:
        // 1. Make price_usd nullable by recreating the table, OR  
        // 2. Update all existing records to have a default value for price_usd
        
        console.log('\n🔧 Updating existing games to have price_usd from final_price...');
        
        // Set price_usd = final_price for all existing games where price_usd is null
        db.run(`UPDATE games SET price_usd = final_price WHERE price_usd IS NULL AND final_price IS NOT NULL`, (err) => {
          if (err) {
            console.error('❌ Error updating price_usd from final_price:', err);
            db.close();
            return reject(err);
          }
          
          console.log('✅ Updated price_usd from final_price');
          
          // Also set a default value for any remaining null price_usd
          db.run(`UPDATE games SET price_usd = 0.0 WHERE price_usd IS NULL`, (err) => {
            if (err) {
              console.error('❌ Error setting default price_usd:', err);
              db.close();
              return reject(err);
            }
            
            console.log('✅ Set default price_usd for remaining null values');
            
            // Close database
            db.close((err) => {
              if (err) {
                console.error('❌ Error closing database:', err);
                return reject(err);
              }
              console.log('\n🎉 price_usd constraint fix completed!');
              resolve();
            });
          });
        });
      });
    });
  });
}

// Run the fix
if (require.main === module) {
  fixPriceUsdConstraint()
    .then(() => {
      console.log('✨ price_usd column is now properly handled!');
      process.exit(0);
    })
    .catch(err => {
      console.error('💥 Fix failed:', err);
      process.exit(1);
    });
}

module.exports = fixPriceUsdConstraint;
