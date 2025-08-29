// Simple WebSocket test for client-side
const WebSocket = require('ws')

async function testClientWebSocket() {
  const wsUrl = 'wss://cryptoflipz2-production.up.railway.app'
  console.log('🔌 Testing client WebSocket connection to:', wsUrl)
  
  const ws = new WebSocket(wsUrl)
  
  ws.on('open', () => {
    console.log('✅ WebSocket connected successfully')
    
    // Test joining a game room
    const joinMessage = {
      type: 'join_room',
      roomId: 'game_1754297289484_9a67344dea0dc111'
    }
    
    console.log('📤 Sending join room message:', joinMessage)
    ws.send(JSON.stringify(joinMessage))
    
    // Test registering a user
    const registerMessage = {
      type: 'register_user',
      address: '0xDd6377919ef1Ad4baBBEAd667eFE3F6607558628'
    }
    
    console.log('📤 Sending register user message:', registerMessage)
    ws.send(JSON.stringify(registerMessage))
    
    // Test game action
    const gameActionMessage = {
      type: 'GAME_ACTION',
      gameId: 'game_1754297289484_9a67344dea0dc111',
      action: 'MAKE_CHOICE',
      choice: 'heads',
      player: '0xDd6377919ef1Ad4baBBEAd667eFE3F6607558628'
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
testClientWebSocket().catch(console.error) 