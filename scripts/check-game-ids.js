const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// Database path
const DATABASE_PATH = path.join(__dirname, '..', 'server', 'flipz.db')

async function checkGameIds() {
  console.log('🔍 Checking Game IDs...\n')
  
  const db = new sqlite3.Database(DATABASE_PATH)
  
  try {
    // Get recent games with their blockchain_game_id
    const games = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, blockchain_game_id, created_at, status, nft_contract, nft_token_id
        FROM games 
        WHERE blockchain_game_id IS NOT NULL AND blockchain_game_id != ''
        ORDER BY created_at DESC
        LIMIT 10
      `, (err, rows) => {
        if (err) reject(err)
        else resolve(rows || [])
      })
    })
    
    console.log(`📊 Recent Games with blockchain_game_id:`)
    games.forEach(game => {
      console.log(`\n   Game ID: ${game.id}`)
      console.log(`   Blockchain Game ID: ${game.blockchain_game_id}`)
      console.log(`   Created: ${game.created_at}`)
      console.log(`   Status: ${game.status}`)
      console.log(`   NFT Contract: ${game.nft_contract}`)
      console.log(`   NFT Token ID: ${game.nft_token_id}`)
      
      // Check if blockchain_game_id looks like a transaction hash
      if (game.blockchain_game_id.startsWith('0x') && game.blockchain_game_id.length === 66) {
        console.log(`   Type: Transaction Hash`)
      } else if (game.blockchain_game_id.startsWith('0x') && game.blockchain_game_id.length === 42) {
        console.log(`   Type: Contract Address`)
      } else if (/^[0-9]+$/.test(game.blockchain_game_id)) {
        console.log(`   Type: Numeric Game ID`)
      } else {
        console.log(`   Type: Unknown Format`)
      }
    })
    
  } catch (error) {
    console.error('❌ Error checking games:', error.message)
  } finally {
    db.close()
  }
}

checkGameIds().catch(console.error)
