const WebSocket = require('ws')

// Test configuration
const SERVER_URL = 'ws://143.198.166.196:3001'
const TEST_GAME_ID = 'test-game-' + Date.now()
const PLAYER1_ADDRESS = '0x1234567890123456789012345678901234567890'
const PLAYER2_ADDRESS = '0x0987654321098765432109876543210987654321'

console.log('🧪 Testing Server-Side Game Engine')
console.log('====================================')
console.log(`Server: ${SERVER_URL}`)
console.log(`Game ID: ${TEST_GAME_ID}`)
console.log(`Player 1: ${PLAYER1_ADDRESS}`)
console.log(`Player 2: ${PLAYER2_ADDRESS}`)
console.log('')

// Test functions
async function testGameEngine() {
  console.log('🔌 Connecting to WebSocket server...')
  
  const ws = new WebSocket(SERVER_URL)
  
  ws.on('open', () => {
    console.log('✅ Connected to WebSocket server')
    
    // Test 1: Join room
    console.log('\n📋 Test 1: Joining game room')
    ws.send(JSON.stringify({
      type: 'join_room',
      roomId: TEST_GAME_ID
    }))
    
    // Test 2: Register players
    setTimeout(() => {
      console.log('\n📋 Test 2: Registering players')
      ws.send(JSON.stringify({
        type: 'register_user',
        address: PLAYER1_ADDRESS
      }))
    }, 1000)
    
    // Test 3: Player 1 makes choice
    setTimeout(() => {
      console.log('\n📋 Test 3: Player 1 choosing heads')
      ws.send(JSON.stringify({
        type: 'GAME_ACTION',
        gameId: TEST_GAME_ID,
        action: 'MAKE_CHOICE',
        choice: 'heads',
        player: PLAYER1_ADDRESS
      }))
    }, 2000)
    
    // Test 4: Player 2 makes choice
    setTimeout(() => {
      console.log('\n📋 Test 4: Player 2 choosing tails')
      ws.send(JSON.stringify({
        type: 'GAME_ACTION',
        gameId: TEST_GAME_ID,
        action: 'MAKE_CHOICE',
        choice: 'tails',
        player: PLAYER2_ADDRESS
      }))
    }, 3000)
    
    // Test 5: Player 1 starts power charge
    setTimeout(() => {
      console.log('\n📋 Test 5: Player 1 starting power charge')
      ws.send(JSON.stringify({
        type: 'GAME_ACTION',
        gameId: TEST_GAME_ID,
        action: 'POWER_CHARGE_START',
        player: PLAYER1_ADDRESS
      }))
    }, 4000)
    
    // Test 6: Player 1 completes power charge
    setTimeout(() => {
      console.log('\n📋 Test 6: Player 1 completing power charge (level 7)')
      ws.send(JSON.stringify({
        type: 'GAME_ACTION',
        gameId: TEST_GAME_ID,
        action: 'POWER_CHARGED',
        player: PLAYER1_ADDRESS,
        powerLevel: 7
      }))
    }, 5000)
    
    // Test 7: Player 2 starts power charge
    setTimeout(() => {
      console.log('\n📋 Test 7: Player 2 starting power charge')
      ws.send(JSON.stringify({
        type: 'GAME_ACTION',
        gameId: TEST_GAME_ID,
        action: 'POWER_CHARGE_START',
        player: PLAYER2_ADDRESS
      }))
    }, 6000)
    
    // Test 8: Player 2 completes power charge
    setTimeout(() => {
      console.log('\n📋 Test 8: Player 2 completing power charge (level 5)')
      ws.send(JSON.stringify({
        type: 'GAME_ACTION',
        gameId: TEST_GAME_ID,
        action: 'POWER_CHARGED',
        player: PLAYER2_ADDRESS,
        powerLevel: 5
      }))
    }, 7000)
    
    // Test 9: Wait for flip result
    setTimeout(() => {
      console.log('\n📋 Test 9: Waiting for flip result...')
    }, 8000)
    
    // Test 10: Cleanup
    setTimeout(() => {
      console.log('\n📋 Test 10: Test completed, closing connection')
      ws.close()
      process.exit(0)
    }, 15000)
  })
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString())
      console.log(`📨 Received: ${message.type}`)
      
      // Log specific message details
      switch (message.type) {
        case 'room_joined':
          console.log(`   ✅ Joined room ${message.roomId} with ${message.members} members`)
          break
          
        case 'player_choice_made':
          console.log(`   🎯 ${message.player.slice(0, 6)}... chose ${message.choice}`)
          break
          
        case 'power_phase_started':
          console.log(`   ⚡ Power phase started, current turn: ${message.currentTurn.slice(0, 6)}...`)
          break
          
        case 'power_charge_started':
          console.log(`   ⚡ ${message.player.slice(0, 6)}... started charging`)
          break
          
        case 'power_charged':
          console.log(`   ⚡ ${message.player.slice(0, 6)}... charged to level ${message.powerLevel}`)
          break
          
        case 'turn_switched':
          console.log(`   🔄 Turn switched to ${message.currentTurn.slice(0, 6)}...`)
          break
          
        case 'FLIP_STARTED':
          console.log(`   🎲 Flip started! Result: ${message.result}`)
          break
          
        case 'FLIP_RESULT':
          console.log(`   🎲 Flip completed! Winner: ${message.roundWinner.slice(0, 6)}...`)
          console.log(`   📊 Round ${message.roundNumber}: ${message.creatorWins}-${message.challengerWins}`)
          break
          
        case 'new_round_started':
          console.log(`   🔄 New round ${message.roundNumber} started`)
          break
          
        case 'GAME_COMPLETED':
          console.log(`   🏁 Game completed! Final winner: ${message.winner.slice(0, 6)}...`)
          console.log(`   📊 Final score: ${message.creatorWins}-${message.challengerWins}`)
          break
          
        default:
          console.log(`   📝 ${JSON.stringify(message)}`)
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error)
    }
  })
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error)
  })
  
  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed')
  })
}

// Run the test
testGameEngine().catch(console.error)
