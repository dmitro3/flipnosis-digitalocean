const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '../server/flipz-clean.db');

console.log('🎨 Adding theme field to profiles table...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

// Add theme column to profiles table
db.run('ALTER TABLE profiles ADD COLUMN theme TEXT DEFAULT "purple"', (err) => {
  if (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('ℹ️ Theme column already exists');
    } else {
      console.error('❌ Error adding theme column:', err);
    }
  } else {
    console.log('✅ Theme column added successfully');
  }
  
  // Close database
  db.close((err) => {
    if (err) {
      console.error('❌ Error closing database:', err);
    } else {
      console.log('✅ Database closed');
      console.log('🎨 Theme field migration completed!');
    }
  });
}); 