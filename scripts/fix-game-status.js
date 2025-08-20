const sqlite3 = require('sqlite3').verbose()
const path = require('path')

async function fixGameStatus() {
  console.log('🔧 Fixing game status for stuck games...')
  
  const dbPath = '/opt/flipnosis/app/server/flipz.db'
  const db = new sqlite3.Database(dbPath)
  
  try {
    // Find games that are stuck in awaiting_challenger status but have accepted offers
    const stuckGames = await new Promise((resolve, reject) => {
      db.all(`
        SELECT g.*, cm.message_data 
        FROM games g
        LEFT JOIN chat_messages cm ON g.id = cm.room_id AND cm.message_type = 'offer_accepted'
        WHERE g.status = 'awaiting_challenger' 
        AND cm.message_data IS NOT NULL
        ORDER BY g.created_at DESC
        LIMIT 10
      `, [], (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
    
    console.log(`📊 Found ${stuckGames.length} stuck games:`)
    
    for (const game of stuckGames) {
      console.log(`\n🎮 Game: ${game.id}`)
      console.log(`   Status: ${game.status}`)
      console.log(`   Creator: ${game.creator}`)
      console.log(`   Challenger: ${game.challenger || 'None'}`)
      console.log(`   Created: ${game.created_at}`)
      
      if (game.message_data) {
        try {
          const messageData = JSON.parse(game.message_data)
          console.log(`   Offer accepted: ${messageData.acceptedOffer?.cryptoAmount || 'Unknown amount'}`)
          
          // Update the game status to waiting_challenger_deposit
          const depositDeadline = new Date(Date.now() + 2 * 60 * 1000) // 2 minutes from now
          
          await new Promise((resolve, reject) => {
            db.run(`
              UPDATE games 
              SET status = ?, 
                  deposit_deadline = ?, 
                  challenger = ?, 
                  payment_amount = ?
              WHERE id = ?
            `, [
              'waiting_challenger_deposit',
              depositDeadline.toISOString(),
              messageData.acceptedOffer?.address || game.challenger,
              messageData.acceptedOffer?.cryptoAmount || game.payment_amount,
              game.id
            ], function(err) {
              if (err) reject(err)
              else {
                console.log(`   ✅ Updated game ${game.id} to waiting_challenger_deposit`)
                console.log(`   📅 Deposit deadline: ${depositDeadline.toISOString()}`)
                console.log(`   💰 Payment amount: ${messageData.acceptedOffer?.cryptoAmount || game.payment_amount}`)
                resolve()
              }
            })
          })
          
        } catch (parseErr) {
          console.log(`   ❌ Error parsing message data: ${parseErr.message}`)
        }
      }
    }
    
    console.log('\n✅ Game status fix completed!')
    
  } catch (error) {
    console.error('❌ Error fixing game status:', error)
  } finally {
    db.close()
  }
}

// Run the fix
fixGameStatus().catch(console.error)
