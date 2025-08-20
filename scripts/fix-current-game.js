const { exec } = require('child_process')
const util = require('util')
const execAsync = util.promisify(exec)

async function fixCurrentGame() {
  console.log('🔧 Fixing current game status...')
  
  try {
    const gameId = 'game_1755691461460_bf63bb05e094458c'
    const challengerAddress = '0x97c19b270Ec30C1C1009B50c45dF82e766CF975d'
    const paymentAmount = 0.15
    const depositDeadline = new Date(Date.now() + 2 * 60 * 1000).toISOString() // 2 minutes from now
    
    console.log('📊 Updating game with:')
    console.log(`   Game ID: ${gameId}`)
    console.log(`   Challenger: ${challengerAddress}`)
    console.log(`   Payment Amount: ${paymentAmount}`)
    console.log(`   Deposit Deadline: ${depositDeadline}`)
    
    // Create a script file on the server
    const scriptContent = `#!/bin/bash
cd /opt/flipnosis/app
sqlite3 server/flipz.db << 'EOF'
UPDATE games 
SET status = 'waiting_challenger_deposit',
    challenger = '${challengerAddress}',
    payment_amount = ${paymentAmount},
    deposit_deadline = '${depositDeadline}'
WHERE id = '${gameId}';
SELECT id, status, challenger, payment_amount, deposit_deadline FROM games WHERE id = '${gameId}';
EOF
`
    
    // Write script to server and execute it
    const { stdout: result } = await execAsync(`ssh root@159.69.242.154 "echo '${scriptContent}' > /tmp/fix_game.sh && chmod +x /tmp/fix_game.sh && /tmp/fix_game.sh && rm /tmp/fix_game.sh"`)
    
    console.log('✅ Game status updated!')
    console.log('\n🔍 Result:')
    console.log(result)
    
  } catch (error) {
    console.error('❌ Error fixing game status:', error.message)
  }
}

// Run the fix
fixCurrentGame().catch(console.error)
