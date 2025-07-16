#!/usr/bin/env node

/**
 * Fix Missing Contract Game ID
 * 
 * This script identifies games that are missing contract_game_id and provides
 * options to fix them. This is the root cause of the "invalid game configuration"
 * error when Player 2 tries to load crypto.
 * 
 * Usage: node scripts/fixMissingContractGameId.js
 */

const sqlite3 = require('sqlite3').verbose();

const DB_PATH = './server/games.db';

async function fixMissingContractGameId() {
  console.log('🔧 Fixing Missing Contract Game ID...\n');
  
  const db = new sqlite3.Database(DB_PATH);
  
  // Find all games missing contract_game_id
  db.all('SELECT * FROM games WHERE contract_game_id IS NULL ORDER BY created_at DESC', (err, games) => {
    if (err) {
      console.error('❌ Error fetching games:', err);
      db.close();
      return;
    }
    
    if (games.length === 0) {
      console.log('✅ No games found missing contract_game_id\n');
      db.close();
      return;
    }
    
    console.log(`🚨 Found ${games.length} games missing contract_game_id:\n`);
    
    games.forEach((game, index) => {
      console.log(`Game ${index + 1}:`);
      console.log(`  ID: ${game.id}`);
      console.log(`  Creator: ${game.creator}`);
      console.log(`  Joiner: ${game.joiner || 'None'}`);
      console.log(`  NFT: ${game.nft_name} (${game.nft_contract}:${game.nft_token_id})`);
      console.log(`  Price: $${game.price_usd}`);
      console.log(`  Status: ${game.status}`);
      console.log(`  Created: ${game.created_at}`);
      console.log(`  Contract Game ID: ${game.contract_game_id || 'NULL'}`);
      console.log('');
    });
    
    console.log('🔧 ANALYSIS:');
    console.log('===========');
    console.log('These games were created when offers were accepted on listings.');
    console.log('However, the blockchain game was never created, so contract_game_id is null.');
    console.log('This causes Player 2 to get "invalid game configuration" when trying to load crypto.\n');
    
    console.log('🔧 POSSIBLE SOLUTIONS:');
    console.log('=====================');
    console.log('1. DELETE these games - if they are recent and no one has deposited assets');
    console.log('2. MANUALLY create blockchain games for each one');
    console.log('3. FIX the offer acceptance flow to create blockchain games immediately');
    console.log('4. MARK as cancelled - if they are old and abandoned\n');
    
    console.log('🔧 RECOMMENDED ACTIONS:');
    console.log('=======================');
    console.log('1. Check if any of these games have assets deposited');
    console.log('2. For recent games (< 1 hour): Delete them and let users recreate');
    console.log('3. For old games: Mark as cancelled');
    console.log('4. Fix the offer acceptance flow to create blockchain games immediately\n');
    
    // Check if any games have recent activity
    const recentGames = games.filter(game => {
      const created = new Date(game.created_at);
      const now = new Date();
      const hoursDiff = (now - created) / (1000 * 60 * 60);
      return hoursDiff < 1; // Less than 1 hour old
    });
    
    if (recentGames.length > 0) {
      console.log(`📊 RECENT GAMES (< 1 hour): ${recentGames.length}`);
      recentGames.forEach(game => {
        console.log(`  - ${game.id} (${game.creator} vs ${game.joiner})`);
      });
      console.log('');
    }
    
    // Provide SQL commands for cleanup
    console.log('🔧 SQL COMMANDS FOR CLEANUP:');
    console.log('============================');
    console.log('-- Delete recent games (less than 1 hour old):');
    console.log("DELETE FROM games WHERE contract_game_id IS NULL AND created_at > datetime('now', '-1 hour');");
    console.log('');
    console.log('-- Mark old games as cancelled:');
    console.log("UPDATE games SET status = 'cancelled' WHERE contract_game_id IS NULL AND created_at <= datetime('now', '-1 hour');");
    console.log('');
    console.log('-- View all games missing contract_game_id:');
    console.log('SELECT id, creator, joiner, price_usd, status, created_at FROM games WHERE contract_game_id IS NULL;');
    console.log('');
    
    db.close();
  });
}

// Run the fix
fixMissingContractGameId().catch(console.error); 