const sqlite3 = require('sqlite3').verbose()
const { ethers } = require('ethers')

async function checkGame() {
  // NFT details from the transaction
  const nftTokenId = '5601'
  const creatorAddress = '0x6ba07382cf43e41abfc80dc43ffc96730194a3c1'
  
  // On-chain gameId from event
  const onChainGameIdBytes32 = '0x64b166c77afec24d2c8d510ede2aa5e7d75ac45a3f4ae198497b54c7df61d98c'
  
  const dbPath = '/root/flipnosis-digitalocean/database.sqlite'
  const db = new sqlite3.Database(dbPath)
  
  console.log('🔍 Searching for games with token ID:', nftTokenId)
  console.log('🔍 Creator address:', creatorAddress)
  console.log('🔍 On-chain gameId (bytes32):', onChainGameIdBytes32)
  console.log('')
  
  // Get all games with this token ID
  const query = `SELECT * FROM battle_royale_games WHERE nft_token_id = ? ORDER BY created_at DESC LIMIT 10`
  
  db.all(query, [nftTokenId], async (err, games) => {
    if (err) {
      console.error('❌ Database error:', err)
      db.close()
      process.exit(1)
    }
    
    if (!games || games.length === 0) {
      console.log('❌ No games found with token ID:', nftTokenId)
      db.close()
      process.exit(1)
    }
    
    console.log(`✅ Found ${games.length} game(s) with token ID ${nftTokenId}:`)
    console.log('')
    
    for (const game of games) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`📋 Game ID: ${game.id}`)
      console.log(`👤 Creator: ${game.creator}`)
      console.log(`🎨 NFT Name: ${game.nft_name || 'N/A'}`)
      console.log(`🆔 Token ID: ${game.nft_token_id}`)
      console.log(`💰 Entry Fee: ${game.entry_fee} ETH`)
      console.log(`📅 Created: ${game.created_at}`)
      console.log(`🔗 NFT Deposited: ${game.nft_deposited ? 'YES ✅' : 'NO ❌'}`)
      console.log(`📝 NFT Deposit Hash: ${game.nft_deposit_hash || 'N/A'}`)
      console.log('')
      
      // Hash the database gameId to compare with on-chain
      const dbGameIdHash = ethers.id(game.id)
      console.log(`🔐 Database gameId hash: ${dbGameIdHash}`)
      console.log(`🔐 On-chain gameId:       ${onChainGameIdBytes32}`)
      
      if (dbGameIdHash.toLowerCase() === onChainGameIdBytes32.toLowerCase()) {
        console.log('✅ MATCH! Database gameId hashes to the on-chain gameId')
        console.log('   This means withdrawals should work correctly!')
      } else {
        console.log('❌ MISMATCH! Database gameId does NOT match on-chain gameId')
        console.log('   This means withdrawals will fail because the gameIds don\'t match')
        console.log('   Need to check how the gameId is being generated/hashed')
      }
      console.log('')
    }
    
    db.close()
    process.exit(0)
  })
}

checkGame().catch(console.error)
