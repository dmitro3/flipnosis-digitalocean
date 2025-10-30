// Use the DatabaseService from the server to find the game
const path = require('path')

// Set up to use the DatabaseService
process.chdir('/root/flipnosis-digitalocean')

const { DatabaseService } = require('./server/services/database.js')
const { ethers } = require('ethers')

async function findGame() {
  const dbPath = process.env.DATABASE_PATH || '/root/flipnosis-digitalocean/database.sqlite'
  const dbService = new DatabaseService(dbPath)
  
  const nftTokenId = '5601'
  const onChainGameId = '0x64b166c77afec24d2c8d510ede2aa5e7d75ac45a3f4ae198497b54c7df61d98c'
  
  console.log('🔍 Searching for games with token ID:', nftTokenId)
  console.log('🔍 On-chain gameId:', onChainGameId)
  console.log('')
  
  // Get all games - we'll filter in code
  const games = await dbService.getBattleRoyaleGames(null, 100)
  
  console.log(`📊 Total games found: ${games.length}`)
  
  // Find games matching token ID
  const matchingGames = games.filter(g => 
    g.nft_token_id && 
    (g.nft_token_id.toString() === nftTokenId || 
     g.nft_token_id === nftTokenId)
  )
  
  console.log(`🎯 Games with token ID ${nftTokenId}: ${matchingGames.length}`)
  console.log('')
  
  for (const game of matchingGames) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📋 Game ID: ${game.id}`)
    console.log(`👤 Creator: ${game.creator}`)
    console.log(`🆔 Token ID: ${game.nft_token_id}`)
    console.log(`💰 Entry Fee: ${game.entry_fee}`)
    console.log(`📅 Created: ${game.created_at}`)
    console.log(`🔗 NFT Deposited: ${game.nft_deposited ? 'YES ✅' : 'NO ❌'}`)
    console.log(`📝 Deposit Hash: ${game.nft_deposit_hash || 'N/A'}`)
    console.log('')
    
    // Hash the database gameId
    const dbGameIdHash = ethers.id(game.id)
    console.log(`🔐 Database gameId:    ${game.id}`)
    console.log(`🔐 Database hash:      ${dbGameIdHash}`)
    console.log(`🔐 On-chain gameId:    ${onChainGameId}`)
    
    if (dbGameIdHash.toLowerCase() === onChainGameId.toLowerCase()) {
      console.log('')
      console.log('✅✅✅ MATCH! Database gameId matches on-chain gameId! ✅✅✅')
      console.log('   This game is correctly linked and withdrawals should work!')
    } else {
      console.log('')
      console.log('❌ MISMATCH - Database and on-chain gameIds do not match')
      console.log('   This game cannot be withdrawn from!')
    }
    console.log('')
  }
  
  process.exit(0)
}

findGame().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})

