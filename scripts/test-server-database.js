// Test script to verify database is working on the server
// Run this on Hetzner: node scripts/test-server-database.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('\n🔍 DATABASE TEST SCRIPT');
console.log('═══════════════════════════════════════\n');

// Try multiple possible database paths
const possiblePaths = [
  './server/database.sqlite',
  './database.sqlite',
  path.join(__dirname, '../server/database.sqlite'),
  path.join(__dirname, '../database.sqlite'),
  '/root/Flipnosis-Battle-Royale-current/server/database.sqlite',
  '/root/Flipnosis-Battle-Royale-current/database.sqlite'
];

console.log('📂 Checking possible database paths:');
possiblePaths.forEach((p, i) => {
  const fs = require('fs');
  const exists = fs.existsSync(p);
  console.log(`${i + 1}. ${p} - ${exists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
});

console.log('\n');

// Use the first existing database
const fs = require('fs');
const dbPath = possiblePaths.find(p => fs.existsSync(p)) || './server/database.sqlite';

console.log(`📍 Using database: ${dbPath}`);
console.log(`   Exists: ${fs.existsSync(dbPath) ? 'Yes' : 'No'}`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  }
  console.log('✅ Database opened successfully\n');
});

// Test 1: List tables
db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", [], (err, tables) => {
  if (err) {
    console.error('❌ Error listing tables:', err.message);
  } else {
    console.log('📋 Tables in database:');
    tables.forEach((table, i) => {
      console.log(`   ${i + 1}. ${table.name}`);
    });
    console.log('');
  }

  // Test 2: Count battle royale games
  db.get('SELECT COUNT(*) as count FROM battle_royale_games', [], (err, result) => {
    if (err) {
      console.error('❌ Error counting games:', err.message);
      console.log('   (Table might not exist)\n');
    } else {
      console.log(`📊 Total Battle Royale games: ${result.count}`);
      
      if (result.count > 0) {
        // Show recent games
        db.all(`
          SELECT id, creator, winner_address, status, nft_deposited, created_at
          FROM battle_royale_games 
          ORDER BY created_at DESC 
          LIMIT 5
        `, [], (err, games) => {
          if (!err && games) {
            console.log('\n📋 Recent games:');
            games.forEach((g, i) => {
              console.log(`\n${i + 1}. ${g.id}`);
              console.log(`   Status: ${g.status}`);
              console.log(`   Creator: ${g.creator}`);
              console.log(`   Winner: ${g.winner_address || 'Not set'}`);
              console.log(`   NFT Deposited: ${g.nft_deposited ? 'Yes' : 'No'}`);
              console.log(`   Created: ${g.created_at}`);
            });
          }
          console.log('\n');
          db.close();
        });
      } else {
        console.log('   No games in database yet\n');
        db.close();
      }
    }
  });
});

