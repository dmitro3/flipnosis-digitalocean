const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// Database path
const DATABASE_PATH = path.join(__dirname, '..', 'server', 'flipz.db')

async function resetNFTDepositStatus() {
  console.log('🔄 Resetting NFT Deposit Status...\n')
  
  const db = new sqlite3.Database(DATABASE_PATH)
  
  try {
    // Reset all NFT deposit statuses
    const result = await new Promise((resolve, reject) => {
      db.run(`
        UPDATE games 
        SET nft_deposited = 0,
            nft_deposit_verified = 0,
            last_nft_check_time = NULL
        WHERE nft_deposited = 1 OR nft_deposit_verified = 1
      `, function(err) {
        if (err) reject(err)
        else resolve(this)
      })
    })
    
    console.log(`✅ Reset ${result.changes} games' NFT deposit status`)
    
    // Show current statistics
    const stats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_games,
          SUM(CASE WHEN nft_deposited = 1 THEN 1 ELSE 0 END) as games_with_nft,
          SUM(CASE WHEN nft_deposited = 0 THEN 1 ELSE 0 END) as games_without_nft,
          SUM(CASE WHEN nft_deposit_verified = 1 THEN 1 ELSE 0 END) as verified_games
        FROM games
      `, (err, row) => {
        if (err) reject(err)
        else resolve(row || {})
      })
    })
    
    console.log('\n📊 Current Database Statistics:')
    console.log(`   Total games: ${stats.total_games}`)
    console.log(`   Games with NFT deposited: ${stats.games_with_nft}`)
    console.log(`   Games without NFT deposited: ${stats.games_without_nft}`)
    console.log(`   Verified games: ${stats.verified_games}`)
    
    console.log('\n🔄 All games are now ready for re-verification against the latest contract!')
    
  } catch (error) {
    console.error('❌ Reset failed:', error.message)
    process.exit(1)
  } finally {
    db.close()
  }
}

// Run the reset
resetNFTDepositStatus().catch(console.error)
