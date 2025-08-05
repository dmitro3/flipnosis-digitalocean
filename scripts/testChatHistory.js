#!/usr/bin/env node

/**
 * Test Chat History System
 * 
 * This script tests the chat history system to ensure it's working correctly.
 * 
 * Usage: node scripts/testChatHistory.js
 */

const sqlite3 = require('sqlite3').verbose();
const WebSocket = require('ws');

const DB_PATH = './server/games.db';
const WS_URL = 'ws://localhost:3001'; // Adjust port as needed

async function testChatHistory() {
  console.log('🧪 Testing Chat History System...\n');
  
  const db = new sqlite3.Database(DB_PATH);
  
  // Test 1: Check if chat_messages table has the new columns
  console.log('📋 Test 1: Checking chat_messages table structure...');
  
  db.all("PRAGMA table_info(chat_messages)", (err, columns) => {
    if (err) {
      console.error('❌ Error checking table structure:', err);
    } else {
      console.log('✅ Chat messages table columns:');
      columns.forEach(col => {
        console.log(`  - ${col.name}: ${col.type} (${col.notnull ? 'NOT NULL' : 'NULL'})`);
      });
      console.log('');
    }
  });
  
  // Test 2: Check existing chat messages
  console.log('💬 Test 2: Checking existing chat messages...');
  
  db.all('SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 5', (err, messages) => {
    if (err) {
      console.error('❌ Error fetching chat messages:', err);
    } else {
      console.log(`✅ Found ${messages.length} recent chat messages`);
      messages.forEach((msg, index) => {
        console.log(`  ${index + 1}. Room: ${msg.room_id}`);
        console.log(`     Sender: ${msg.sender_address}`);
        console.log(`     Message: ${msg.message}`);
        console.log(`     Type: ${msg.message_type || 'chat'}`);
        console.log(`     Data: ${msg.message_data || 'None'}`);
        console.log(`     Created: ${msg.created_at}`);
        console.log('');
      });
    }
  });
  
  // Test 3: Test WebSocket chat history loading
  console.log('🔌 Test 3: Testing WebSocket chat history loading...');
  
  try {
    const ws = new WebSocket(WS_URL);
    
    ws.on('open', () => {
      console.log('✅ WebSocket connected successfully');
      
      // Test joining a room
      const joinMessage = {
        type: 'join_room',
        roomId: 'test_game_123'
      };
      
      console.log('📤 Sending join room message:', joinMessage);
      ws.send(JSON.stringify(joinMessage));
      
      // Send a test chat message
      setTimeout(() => {
        const chatMessage = {
          type: 'chat_message',
          roomId: 'test_game_123',
          message: 'Hello from test script!',
          from: '0x1234567890123456789012345678901234567890'
        };
        
        console.log('📤 Sending test chat message:', chatMessage);
        ws.send(JSON.stringify(chatMessage));
      }, 1000);
      
      // Send a test crypto offer
      setTimeout(() => {
        const offerMessage = {
          type: 'crypto_offer',
          gameId: 'test_game_123',
          offererAddress: '0x1234567890123456789012345678901234567890',
          cryptoAmount: 0.1,
          timestamp: new Date().toISOString()
        };
        
        console.log('📤 Sending test crypto offer:', offerMessage);
        ws.send(JSON.stringify(offerMessage));
      }, 2000);
      
      // Close connection after 5 seconds
      setTimeout(() => {
        console.log('🔌 Closing WebSocket connection');
        ws.close();
        db.close();
      }, 5000);
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('📨 Received WebSocket message:', message);
        
        // Check for chat history message
        if (message.type === 'chat_history') {
          console.log('📚 Chat history received!');
          console.log(`  - Room ID: ${message.roomId}`);
          console.log(`  - Messages count: ${message.messages?.length || 0}`);
          if (message.messages && message.messages.length > 0) {
            console.log('  - Sample message:', message.messages[0]);
          }
        }
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
testChatHistory().catch(console.error); 