const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const DATABASE_PATH = path.join(__dirname, '..', 'server', 'flipz-clean.db')

const db = new sqlite3.Database(DATABASE_PATH)

console.log('🔍 Looking for recent games...')

// Check for games created in the last hour
db.all(`
  SELECT id, blockchain_game_id, nft_contract, nft_token_id, status, creator, created_at, nft_deposited, nft_deposit_verified
  FROM games 
  WHERE datetime(created_at) > datetime('now', '-1 hour')
  ORDER BY created_at DESC
`, (err, games) => {
  if (err) {
    console.error('❌ Error:', err.message)
  } else if (games.length === 0) {
    console.log('⏰ No games found in the last hour')
    
    // Check all games with blockchain_game_id
    console.log('\n🔍 Checking for any games with blockchain_game_id...')
    db.all(`
      SELECT id, blockchain_game_id, nft_contract, nft_token_id, status, creator, created_at
      FROM games 
      WHERE blockchain_game_id IS NOT NULL AND blockchain_game_id != ''
      ORDER BY created_at DESC
      LIMIT 10
    `, (err, blockchainGames) => {
      if (err) {
        console.error('❌ Error:', err.message)
      } else if (blockchainGames.length === 0) {
        console.log('❌ No games found with blockchain_game_id')
        console.log('\n💡 This suggests the game creation process hasn\'t completed database insertion yet')
        console.log('   or there might be an issue with the game creation flow.')
      } else {
        console.log(`✅ Found ${blockchainGames.length} games with blockchain IDs:`)
        blockchainGames.forEach(game => {
          console.log(`  ${game.id}: ${game.blockchain_game_id} - ${game.status} - ${game.created_at}`)
        })
      }
      db.close()
    })
  } else {
    console.log(`✅ Found ${games.length} recent games:`)
    games.forEach(game => {
      console.log(`  ${game.id}:`)
      console.log(`    Blockchain ID: ${game.blockchain_game_id || 'none'}`)
      console.log(`    NFT: ${game.nft_contract}/${game.nft_token_id}`)
      console.log(`    Status: ${game.status}`)
      console.log(`    Creator: ${game.creator}`)
      console.log(`    Created: ${game.created_at}`)
      console.log(`    NFT Deposited: ${game.nft_deposited}`)
      console.log(`    NFT Verified: ${game.nft_deposit_verified}`)
      console.log()
    })
    db.close()
  }
})
