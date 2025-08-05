const { ethers } = require('ethers')
require('dotenv').config()

// Test script to debug the deposit flow issue
async function testDepositFlow() {
  console.log('🧪 Testing deposit flow...')
  
  // Test game ID format
  const testGameId = `game_${Date.now()}_${Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join('')}`
  console.log('📝 Test game ID:', testGameId)
  
  // Test game ID conversion
  const gameIdBytes32 = ethers.id(testGameId)
  console.log('🔗 Game ID bytes32:', gameIdBytes32)
  
  // Test with a real game ID from the logs
  const realGameId = 'game_1703123456789_1234567890abcdef'
  const realGameIdBytes32 = ethers.id(realGameId)
  console.log('🔗 Real game ID bytes32:', realGameIdBytes32)
  
  console.log('✅ Test completed')
}

testDepositFlow().catch(console.error) 