#!/usr/bin/env node

/**
 * Offer Flow Debugger
 * 
 * This script helps debug the offer acceptance flow to ensure contract_game_id
 * is being properly handled when offers are accepted.
 * 
 * Usage: node scripts/debugOfferFlow.js
 */

const sqlite3 = require('sqlite3').verbose();

const DB_PATH = './server/games.db';

async function debugOfferFlow() {
  console.log('🔍 Debugging Offer Flow...\n');
  
  const db = new sqlite3.Database(DB_PATH);
  
  // Check offers table
  db.all('SELECT * FROM offers ORDER BY created_at DESC LIMIT 10', (err, offers) => {
    if (err) {
      console.error('❌ Error fetching offers:', err);
      db.close();
      return;
    }
    
    console.log(`📋 Found ${offers.length} recent offers:\n`);
    
    offers.forEach((offer, index) => {
      console.log(`Offer ${index + 1}:`);
      console.log(`  ID: ${offer.id}`);
      console.log(`  Listing ID: ${offer.listing_id}`);
      console.log(`  Offerer: ${offer.offerer_address}`);
      console.log(`  Price: $${offer.offer_price}`);
      console.log(`  Status: ${offer.status}`);
      console.log(`  Created: ${offer.created_at}`);
      console.log('');
    });
    
    // Check games created from offers
    db.all('SELECT * FROM games WHERE joiner IS NOT NULL ORDER BY created_at DESC LIMIT 10', (err, games) => {
      if (err) {
        console.error('❌ Error fetching games:', err);
        db.close();
        return;
      }
      
      console.log(`🎮 Found ${games.length} games with joiners:\n`);
      
      games.forEach((game, index) => {
        console.log(`Game ${index + 1}:`);
        console.log(`  ID: ${game.id}`);
        console.log(`  Contract Game ID: ${game.contract_game_id || 'NULL'}`);
        console.log(`  Creator: ${game.creator}`);
        console.log(`  Joiner: ${game.joiner}`);
        console.log(`  Price: $${game.price_usd}`);
        console.log(`  Status: ${game.status}`);
        console.log(`  Created: ${game.created_at}`);
        
        if (!game.contract_game_id) {
          console.log(`  ❌ MISSING CONTRACT_GAME_ID!`);
        } else {
          console.log(`  ✅ Has contract_game_id`);
        }
        console.log('');
      });
      
      // Check for games that should have contract_game_id but don't
      db.all('SELECT * FROM games WHERE joiner IS NOT NULL AND contract_game_id IS NULL', (err, missingGames) => {
        if (err) {
          console.error('❌ Error fetching games missing contract_game_id:', err);
          db.close();
          return;
        }
        
        if (missingGames.length > 0) {
          console.log(`🚨 PROBLEM: Found ${missingGames.length} games with joiners but missing contract_game_id:\n`);
          
          missingGames.forEach((game, index) => {
            console.log(`Problem Game ${index + 1}:`);
            console.log(`  ID: ${game.id}`);
            console.log(`  Creator: ${game.creator}`);
            console.log(`  Joiner: ${game.joiner}`);
            console.log(`  Price: $${game.price_usd}`);
            console.log(`  Status: ${game.status}`);
            console.log(`  Created: ${game.created_at}`);
            console.log('');
          });
          
          console.log('🔧 RECOMMENDATIONS:');
          console.log('==================');
          console.log('1. These games were created when offers were accepted');
          console.log('2. But the contract_game_id was not set');
          console.log('3. This means the on-chain game was never created');
          console.log('4. Check the offer acceptance flow in server.js');
          console.log('5. Verify that joinExistingGameWithPrice is being called');
          console.log('6. Ensure the returned gameId is being saved to the database\n');
        } else {
          console.log('✅ All games with joiners have contract_game_id set\n');
        }
        
        // Check listings table
        db.all('SELECT * FROM game_listings ORDER BY created_at DESC LIMIT 5', (err, listings) => {
          if (err) {
            console.error('❌ Error fetching listings:', err);
            db.close();
            return;
          }
          
          console.log(`📋 Found ${listings.length} recent listings:\n`);
          
          listings.forEach((listing, index) => {
            console.log(`Listing ${index + 1}:`);
            console.log(`  ID: ${listing.id}`);
            console.log(`  Creator: ${listing.creator}`);
            console.log(`  NFT: ${listing.nft_name} (${listing.nft_contract}:${listing.nft_token_id})`);
            console.log(`  Asking Price: $${listing.asking_price}`);
            console.log(`  Accepts Offers: ${listing.accepts_offers ? 'Yes' : 'No'}`);
            console.log(`  Status: ${listing.status}`);
            console.log(`  Created: ${listing.created_at}`);
            console.log('');
          });
          
          db.close();
        });
      });
    });
  });
}

// Run the debug
debugOfferFlow().catch(console.error); 