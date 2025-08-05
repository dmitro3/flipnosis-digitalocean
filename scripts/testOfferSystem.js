#!/usr/bin/env node

/**
 * Test Offer System
 * 
 * This script tests the offer system to ensure it's working correctly.
 * 
 * Usage: node scripts/testOfferSystem.js
 */

const sqlite3 = require('sqlite3').verbose();
const WebSocket = require('ws');

const DB_PATH = './server/games.db';
const WS_URL = 'ws://localhost:3001'; // Adjust port as needed

async function testOfferSystem() {
  console.log('🧪 Testing Offer System...\n');
  
  const db = new sqlite3.Database(DB_PATH);
  
  // Test 1: Check if offers table exists and has data
  console.log('📋 Test 1: Checking offers table...');
  
  db.all('SELECT * FROM offers ORDER BY created_at DESC LIMIT 5', (err, offers) => {
    if (err) {
      console.error('❌ Error fetching offers:', err);
    } else {
      console.log(`✅ Found ${offers.length} recent offers`);
      offers.forEach((offer, index) => {
        console.log(`  ${index + 1}. ID: ${offer.id}`);
        console.log(`     Listing: ${offer.listing_id}`);
        console.log(`     Offerer: ${offer.offerer_address}`);
        console.log(`     Price: $${offer.offer_price}`);
        console.log(`     Status: ${offer.status}`);
        console.log('');
      });
    }
  });
  
  // Test 2: Check if games table exists and has data
  console.log('🎮 Test 2: Checking games table...');
  
  db.all('SELECT * FROM games ORDER BY created_at DESC LIMIT 5', (err, games) => {
    if (err) {
      console.error('❌ Error fetching games:', err);
    } else {
      console.log(`✅ Found ${games.length} recent games`);
      games.forEach((game, index) => {
        console.log(`  ${index + 1}. ID: ${game.id}`);
        console.log(`     Creator: ${game.creator}`);
        console.log(`     Challenger: ${game.challenger || 'None'}`);
        console.log(`     Status: ${game.status}`);
        console.log(`     Creator Deposited: ${game.creator_deposited}`);
        console.log(`     Challenger Deposited: ${game.challenger_deposited}`);
        console.log('');
      });
    }
  });
  
  // Test 3: Check WebSocket connection
  console.log('🔌 Test 3: Testing WebSocket connection...');
  
  try {
    const ws = new WebSocket(WS_URL);
    
    ws.on('open', () => {
      console.log('✅ WebSocket connected successfully');
      
      // Test joining a room
      const joinMessage = {
        type: 'join_room',
        roomId: 'test_room_123'
      };
      
      console.log('📤 Sending join room message:', joinMessage);
      ws.send(JSON.stringify(joinMessage));
      
      // Test sending a crypto offer
      setTimeout(() => {
        const offerMessage = {
          type: 'crypto_offer',
          gameId: 'test_game_123',
          offererAddress: '0x1234567890123456789012345678901234567890',
          cryptoAmount: 0.1,
          timestamp: new Date().toISOString()
        };
        
        console.log('📤 Sending crypto offer message:', offerMessage);
        ws.send(JSON.stringify(offerMessage));
      }, 1000);
      
      // Close connection after 3 seconds
      setTimeout(() => {
        console.log('🔌 Closing WebSocket connection');
        ws.close();
        db.close();
      }, 3000);
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('📨 Received WebSocket message:', message);
      } catch (error) {
        console.log('📨 Received raw WebSocket message:', data.toString());
      }
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      db.close();
    });
    
    ws.on('close', () => {
      console.log('🔌 WebSocket connection closed');
    });
    
  } catch (error) {
    console.error('❌ Error creating WebSocket connection:', error);
    db.close();
  }
}

// Run the test
testOfferSystem().catch(console.error); 