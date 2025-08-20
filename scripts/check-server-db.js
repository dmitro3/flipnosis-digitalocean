const { exec } = require('child_process')
const util = require('util')
const execAsync = util.promisify(exec)

async function checkServerDatabase() {
  console.log('🔍 Checking server database...')
  
  try {
    // Check the specific game
    const gameId = 'game_1755691461460_bf63bb05e094458c'
    
    const { stdout: gameData } = await execAsync(`ssh root@159.69.242.154 'cd /opt/flipnosis/app && sqlite3 server/flipz.db "SELECT * FROM games WHERE id = \\"${gameId}\\";"'`)
    
    console.log('\n🎮 Game Data:')
    console.log(gameData)
    
    // Check chat messages
    const { stdout: messages } = await execAsync(`ssh root@159.69.242.154 'cd /opt/flipnosis/app && sqlite3 server/flipz.db "SELECT message_type, message, message_data, created_at FROM chat_messages WHERE room_id = \\"${gameId}\\" ORDER BY created_at DESC;"'`)
    
    console.log('\n📨 Chat Messages:')
    console.log(messages)
    
    // Check offers for the listing
    const { stdout: offers } = await execAsync(`ssh root@159.69.242.154 'cd /opt/flipnosis/app && sqlite3 server/flipz.db "SELECT * FROM offers WHERE listing_id = \\"listing_1755691461538_1109733bb9400a25\\" ORDER BY created_at DESC;"'`)
    
    console.log('\n💰 Offers:')
    console.log(offers)
    
  } catch (error) {
    console.error('❌ Error checking server database:', error.message)
  }
}

// Run the check
checkServerDatabase().catch(console.error)
