const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, '../server/games-v2.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking profiles table columns in detail...');

db.all('PRAGMA table_info(profiles)', (err, columns) => {
  if (err) {
    console.error('Error checking profiles table structure:', err);
  } else {
    console.log('All profiles table columns:');
    columns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.name} (${col.type})`);
    });
    
    // Check for specific XP columns
    const xpColumns = columns.filter(col => col.name.includes('xp_'));
    console.log('\nXP-related columns:');
    xpColumns.forEach(col => {
      console.log(`  ${col.name} (${col.type})`);
    });
  }
  db.close();
}); 