const sqlite3 = require('sqlite3').verbose()
const { ethers } = require('ethers')
const path = require('path')

// Database path
const DATABASE_PATH = '/opt/flipnosis/app/server/flipz.db'

// Contract configuration - LATEST CONTRACT ADDRESS ONLY
const RPC_URL = 'https://mainnet.base.org'
const LATEST_CONTRACT_ADDRESS = '0xDE5B1D7Aa9913089710184da2Ba6980D661FDedb'

async function verifyNFTDeposits() {
  console.log('🔧 Verifying NFT Deposits with Correct Contract Structure...\n')
  console.log(`📍 Using Latest Contract: ${LATEST_CONTRACT_ADDRESS}\n`)
  
  const db = new sqlite3.Database(DATABASE_PATH)
  const provider = new ethers.JsonRpcProvider(RPC_URL)
  
  try {
    // Get all games that need verification
    const games = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, blockchain_game_id, nft_contract, nft_token_id, creator, status, nft_deposited, nft_deposit_verified, created_at
        FROM games 
        WHERE blockchain_game_id IS NOT NULL AND blockchain_game_id != ''
        ORDER BY created_at DESC
      `, (err, rows) => {
        if (err) reject(err)
        else resolve(rows || [])
      })
    })
    
    console.log(`📋 Found ${games.length} games to verify`)
    
    // Create contract instance with correct ABI
    const contract = new ethers.Contract(
      LATEST_CONTRACT_ADDRESS,
      [
        'function nftDeposits(bytes32) view returns (address depositor, address nftContract, uint256 tokenId, bool claimed, uint256 depositTime)',
        'function isGameReady(bytes32) view returns (bool)',
        'function getGameParticipants(bytes32) view returns (address nftPlayer, address cryptoPlayer)'
      ],
      provider
    )
    
    let verifiedCount = 0
    let correctedCount = 0
    let skippedCount = 0
    
    // Check each game's NFT deposit
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
        
        // Convert blockchain_game_id to bytes32
        const gameId = game.blockchain_game_id
        
        // Check NFT deposit using the contract's nftDeposits mapping
        const nftDeposit = await contract.nftDeposits(gameId)
        
        // Check if NFT is actually deposited (depositor != address(0))
        const isDeposited = nftDeposit.depositor !== ethers.ZeroAddress
        
        if (isDeposited) {
          // Verify the NFT contract and token ID match
          if (nftDeposit.nftContract.toLowerCase() === game.nft_contract.toLowerCase() && 
              nftDeposit.tokenId.toString() === game.nft_token_id) {
            
            await updateGameStatus(db, game.id, true, true)
            verifiedCount++
            console.log(`✅ Game ${game.id}: NFT verified in contract (depositor: ${nftDeposit.depositor})`)
          } else {
            await updateGameStatus(db, game.id, false, false)
            correctedCount++
            console.log(`❌ Game ${game.id}: NFT contract/token mismatch - marked as not deposited`)
          }
        } else {
          await updateGameStatus(db, game.id, false, false)
          correctedCount++
          console.log(`❌ Game ${game.id}: No NFT deposited in contract`)
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
    console.error('❌ Verification failed:', error.message)
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

// Run the verification
verifyNFTDeposits().catch(console.error)
