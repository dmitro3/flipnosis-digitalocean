const { exec } = require('child_process')
const util = require('util')
const execAsync = util.promisify(exec)

async function checkGameStatus() {
  console.log('🔍 Checking game status on server...')
  
  try {
    // Check the specific game via SSH
    const gameId = 'game_1755691461460_bf63bb05e094458c'
    
    // Create a temporary SQL file on the server
    const sqlCommands = `
SELECT id, status, creator, challenger, payment_amount, deposit_deadline, created_at FROM games WHERE id = '${gameId}';
SELECT message_type, message, message_data, created_at FROM chat_messages WHERE room_id = '${gameId}' ORDER BY created_at DESC;
SELECT * FROM offers WHERE listing_id = 'listing_1755691461538_1109733bb9400a25' ORDER BY created_at DESC;
`
    
    const { stdout: allData } = await execAsync(`ssh root@159.69.242.154 "cd /opt/flipnosis/app && echo '${sqlCommands}' > /tmp/check_game.sql && sqlite3 server/flipz.db < /tmp/check_game.sql && rm /tmp/check_game.sql"`)
    
    console.log('\n🎮 Server Database Data:')
    console.log(allData)
    
  } catch (error) {
    console.error('❌ Error checking game status:', error.message)
  }
}

// Run the check
checkGameStatus().catch(console.error)
