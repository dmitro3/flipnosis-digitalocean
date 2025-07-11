const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./server/games.db');

console.log('🔍 Checking database schema...');

db.all("PRAGMA table_info(games)", (err, columns) => {
  if (err) {
    console.error('❌ Error checking schema:', err);
  } else {
    console.log('📋 Games table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });
  }
  db.close();
}); 