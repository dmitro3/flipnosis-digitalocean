const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'flipz.db');
console.log('Checking database structure:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('✅ Connected to database');
});

// List all tables
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('Error getting tables:', err.message);
    return;
  }
  
  console.log('\n📋 All tables in database:');
  tables.forEach(table => {
    console.log(`  - ${table.name}`);
  });
  
  // Check each table for data
  let completed = 0;
  tables.forEach(table => {
    db.get(`SELECT COUNT(*) as count FROM ${table.name}`, (err, row) => {
      if (err) {
        console.log(`❌ Error counting ${table.name}:`, err.message);
      } else {
        console.log(`📊 ${table.name}: ${row.count} rows`);
      }
      
      completed++;
      if (completed === tables.length) {
        db.close();
      }
    });
  });
});
