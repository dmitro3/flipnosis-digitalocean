// Quick script to check database schema
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = 'database backups/flipnosis-db-backup-2025-11-08T11-57-29-387Z.sqlite';

console.log('Checking database schema...\n');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  
  console.log('✅ Database opened successfully\n');
  
  // Check battle_royale_games table
  db.all("PRAGMA table_info('battle_royale_games')", (err, columns) => {
    if (err) {
      console.error('Error checking battle_royale_games:', err);
    } else {
      console.log('='.repeat(60));
      console.log('TABLE: battle_royale_games');
      console.log('='.repeat(60));
      if (columns.length === 0) {
        console.log('❌ TABLE DOES NOT EXIST!');
      } else {
        columns.forEach(col => {
          console.log(`  ${col.name.padEnd(25)} ${col.type}`);
        });
        console.log(`\nTotal columns: ${columns.length}`);
      }
      console.log('');
    }
    
    // Check battle_royale_participants table
    db.all("PRAGMA table_info('battle_royale_participants')", (err, columns) => {
      if (err) {
        console.error('Error checking battle_royale_participants:', err);
      } else {
        console.log('='.repeat(60));
        console.log('TABLE: battle_royale_participants');
        console.log('='.repeat(60));
        if (columns.length === 0) {
          console.log('❌ TABLE DOES NOT EXIST!');
        } else {
          columns.forEach(col => {
            console.log(`  ${col.name.padEnd(25)} ${col.type}`);
          });
          console.log(`\nTotal columns: ${columns.length}`);
        }
        console.log('');
      }
      
      // Check what tables exist
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
          console.error('Error listing tables:', err);
        } else {
          console.log('='.repeat(60));
          console.log('ALL TABLES IN DATABASE:');
          console.log('='.repeat(60));
          tables.forEach(table => {
            console.log(`  - ${table.name}`);
          });
          console.log(`\nTotal tables: ${tables.length}`);
        }
        
        db.close();
      });
    });
  });
});

