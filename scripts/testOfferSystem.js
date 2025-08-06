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

// Test WebSocket connection and offer system
async function testOfferSystem() {
  console.log('🧪 Testing WebSocket offer system...')
  
  const wsUrl = 'wss://cryptoflipz2-production.up.railway.app'
  const gameId = 'game_1754483423647_89ddb40e590678a8' // Use the game ID from the console logs
  const testAddress = '0x93277281Fd256D0601Ce86Cdb1D5c00a97b59839'
  
  console.log('🔌 Connecting to WebSocket:', wsUrl)
  console.log('🎮 Game ID:', gameId)
  console.log('👤 Test Address:', testAddress)
  
  const ws = new WebSocket(wsUrl)
  
  ws.on('open', () => {
    console.log('✅ WebSocket connected')
    
    // Join the game room
    const joinMessage = {
      type: 'join_room',
      roomId: gameId
    }
    console.log('🏠 Joining room:', joinMessage)
    ws.send(JSON.stringify(joinMessage))
    
    // Register user
    const registerMessage = {
      type: 'register_user',
      address: testAddress
    }
    console.log('👤 Registering user:', registerMessage)
    ws.send(JSON.stringify(registerMessage))
    
    // Wait a bit then send a test offer
    setTimeout(() => {
      const offerMessage = {
        type: 'crypto_offer',
        gameId: gameId,
        offererAddress: testAddress,
        cryptoAmount: 10.5,
        timestamp: new Date().toISOString()
      }
      console.log('💰 Sending test offer:', offerMessage)
      ws.send(JSON.stringify(offerMessage))
    }, 2000)
  })
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString())
      console.log('📨 Received message:', message)
      
      if (message.type === 'room_joined') {
        console.log('✅ Successfully joined room')
      } else if (message.type === 'crypto_offer') {
        console.log('✅ Received crypto offer broadcast')
      } else if (message.type === 'chat_history') {
        console.log('📚 Received chat history')
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error)
    }
  })
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error)
  })
  
  ws.on('close', (code, reason) => {
    console.log('🔌 WebSocket closed:', { code, reason })
  })
  
  // Close after 10 seconds
  setTimeout(() => {
    console.log('🔌 Closing test connection')
    ws.close()
    process.exit(0)
  }, 10000)
}

testOfferSystem().catch(console.error) 