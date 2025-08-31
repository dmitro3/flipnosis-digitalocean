const sqlite3 = require('sqlite3').verbose()
const { ethers } = require('ethers')
const path = require('path')

// Database path
const DATABASE_PATH = path.join(__dirname, '..', 'server', 'flipz.db')

// Contract configuration - LATEST CONTRACT ADDRESS ONLY
const RPC_URL = 'https://mainnet.base.org'
const LATEST_CONTRACT_ADDRESS = '0x415BBd5933EaDc0570403c65114B7c5a1c7FADb7'

async function fixNFTDepositStatus() {
  console.log('🔧 Fixing NFT Deposit Status with Latest Contract...\n')
  console.log(`📍 Using Latest Contract: ${LATEST_CONTRACT_ADDRESS}\n`)
  
  const db = new sqlite3.Database(DATABASE_PATH)
  const provider = new ethers.JsonRpcProvider(RPC_URL)
  
  try {
    // Get all games that need verification (not already verified as deposited)
    const games = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, nft_contract, nft_token_id, creator, status, nft_deposited, nft_deposit_verified, created_at
        FROM games 
        WHERE (nft_deposited = 0 OR nft_deposited IS NULL OR nft_deposit_verified = 0 OR nft_deposit_verified IS NULL)
        ORDER BY created_at DESC
      `, (err, rows) => {
        if (err) reject(err)
        else resolve(rows || [])
      })
    })
    
    console.log(`📋 Found ${games.length} games to verify`)
    
    // Check the latest contract for NFT deposits
    const latestContract = new ethers.Contract(
      LATEST_CONTRACT_ADDRESS,
      [
        'function getGameNFT(uint256 gameId) view returns (address nftContract, uint256 tokenId, address owner)',
        'function getGame(uint256 gameId) view returns (tuple(address creator, address challenger, uint256 creatorDeposit, uint256 challengerDeposit, bool creatorDeposited, bool challengerDeposited, uint256 gameStartTime, uint256 gameEndTime, bool gameEnded, address winner))',
        'function nextGameId() view returns (uint256)'
      ],
      provider
    )
    
    // Since nextGameId() is failing, let's check a reasonable range
    // You mentioned there are 3 NFTs in the latest contract, so let's check up to 10 games
    const totalGamesInContract = 10
    console.log(`📊 Checking first ${totalGamesInContract} games in latest contract`)
    
    let verifiedCount = 0
    let correctedCount = 0
    let skippedCount = 0
    
    // Check each game's NFT against the latest contract
    for (const game of games) {
      try {
        // Check if game was created in the last 5 minutes (grace period)
        const gameCreatedAt = new Date(game.created_at)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
        
        if (gameCreatedAt > fiveMinutesAgo) {
          console.log(`⏰ Game ${game.id}: Created ${Math.round((Date.now() - gameCreatedAt.getTime()) / 60000)} minutes ago - skipping (grace period)`)
          skippedCount++
          continue
        }
        
        // Check if this NFT exists in the latest contract
        let nftFound = false
        
        // Search through all games in the contract to find this NFT
        for (let gameId = 1; gameId <= totalGamesInContract; gameId++) {
          try {
            const gameData = await latestContract.getGame(gameId)
            const nftData = await latestContract.getGameNFT(gameId)
            
            // Check if this game has the same NFT
            if (nftData.nftContract.toLowerCase() === game.nft_contract.toLowerCase() && 
                nftData.tokenId.toString() === game.nft_token_id &&
                gameData.creatorDeposited) {
              
              nftFound = true
              console.log(`✅ Game ${game.id}: NFT found in latest contract (Game ID: ${gameId})`)
              break
            }
          } catch (e) {
            // Continue to next game if this one fails
            continue
          }
        }
        
        if (nftFound) {
          await updateGameStatus(db, game.id, true, true)
          verifiedCount++
        } else {
          await updateGameStatus(db, game.id, false, false)
          correctedCount++
          console.log(`❌ Game ${game.id}: NFT NOT found in latest contract`)
        }
        
      } catch (error) {
        console.error(`❌ Error checking game ${game.id}:`, error.message)
        // Mark as not verified
        await updateGameStatus(db, game.id, false, false)
        correctedCount++
      }
    }
    
    console.log(`\n📊 Verification Complete:`)
    console.log(`   ✅ Verified as deposited: ${verifiedCount}`)
    console.log(`   ❌ Marked as not deposited: ${correctedCount}`)
    console.log(`   ⏰ Skipped (grace period): ${skippedCount}`)
    
    // Show final statistics
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
    
    console.log('\n📊 Final Database Statistics:')
    console.log(`   Total games: ${stats.total_games}`)
    console.log(`   Games with NFT deposited: ${stats.games_with_nft}`)
    console.log(`   Games without NFT deposited: ${stats.games_without_nft}`)
    console.log(`   Verified games: ${stats.verified_games}`)
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message)
    process.exit(1)
  } finally {
    db.close()
  }
}

async function updateGameStatus(db, gameId, nftDeposited, verified) {
  return new Promise((resolve, reject) => {
    db.run(`
      UPDATE games 
      SET nft_deposited = ?,
          nft_deposit_verified = ?,
          last_nft_check_time = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [nftDeposited ? 1 : 0, verified ? 1 : 0, gameId], (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

// Run the fix
fixNFTDepositStatus().catch(console.error)
