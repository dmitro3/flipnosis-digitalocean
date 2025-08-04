const WebSocket = require('ws')

// Test WebSocket connection
async function testWebSocket() {
  const wsUrl = 'wss://cryptoflipz2-production.up.railway.app'
  console.log('🔌 Testing WebSocket connection to:', wsUrl)
  
  const ws = new WebSocket(wsUrl)
  
  ws.on('open', () => {
    console.log('✅ WebSocket connected successfully')
    
    // Test joining a room
    const joinMessage = {
      type: 'join_room',
      roomId: 'test_room_123'
    }
    
    console.log('📤 Sending join room message:', joinMessage)
    ws.send(JSON.stringify(joinMessage))
    
    // Test registering a user
    const registerMessage = {
      type: 'register_user',
      address: '0x1234567890123456789012345678901234567890'
    }
    
    console.log('📤 Sending register user message:', registerMessage)
    ws.send(JSON.stringify(registerMessage))
    
    // Test game action
    const gameActionMessage = {
      type: 'GAME_ACTION',
      gameId: 'test_game_123',
      action: 'MAKE_CHOICE',
      choice: 'heads',
      player: '0x1234567890123456789012345678901234567890'
    }
    
    console.log('📤 Sending game action message:', gameActionMessage)
    ws.send(JSON.stringify(gameActionMessage))
  })
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString())
      console.log('📨 Received message:', message)
    } catch (error) {
      console.log('📨 Received raw message:', data.toString())
    }
  })
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error)
  })
  
  ws.on('close', (event) => {
    console.log('🔌 WebSocket closed:', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean
    })
  })
  
  // Close after 10 seconds
  setTimeout(() => {
    console.log('⏰ Closing WebSocket connection...')
    ws.close()
  }, 10000)
}

// Run the test
testWebSocket().catch(console.error) 