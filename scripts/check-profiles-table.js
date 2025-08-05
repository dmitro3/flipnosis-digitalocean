const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, '../server/games-v2.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking profiles table structure...');

db.all('PRAGMA table_info(profiles)', (err, columns) => {
  if (err) {
    console.error('Error checking profiles table structure:', err);
  } else {
    console.log('Profiles table columns:');
    columns.forEach(col => {
      console.log(`  ${col.name} (${col.type})`);
    });
    
    // Check for XP tracking columns
    const xpColumns = [
      'xp_name_earned',
      'xp_avatar_earned', 
      'xp_twitter_earned',
      'xp_telegram_earned',
      'xp_heads_earned',
      'xp_tails_earned'
    ];
    
    console.log('\nChecking XP tracking columns:');
    xpColumns.forEach(colName => {
      const exists = columns.find(c => c.name === colName);
      console.log(`  ${colName}: ${exists ? '✅' : '❌'}`);
    });
  }
  db.close();
}); 