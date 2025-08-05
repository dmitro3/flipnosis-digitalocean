const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, '../server/games-v2.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking database tables...');

db.all('SELECT name FROM sqlite_master WHERE type="table"', (err, tables) => {
  if (err) {
    console.error('Error checking tables:', err);
  } else {
    console.log('Tables found:', tables.map(t => t.name));
    
    // Check if offers table exists
    const offersTable = tables.find(t => t.name === 'offers');
    if (offersTable) {
      console.log('✅ Offers table exists');
      
      // Check offers table structure
      db.all('PRAGMA table_info(offers)', (err, columns) => {
        if (err) {
          console.error('Error checking offers table structure:', err);
        } else {
          console.log('Offers table columns:', columns.map(c => c.name));
        }
        db.close();
      });
    } else {
      console.log('❌ Offers table does not exist');
      db.close();
    }
  }
}); 