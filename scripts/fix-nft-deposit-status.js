const sqlite3 = require('sqlite3').verbose()
const { ethers } = require('ethers')
const path = require('path')

// Database path
const DATABASE_PATH = path.join(__dirname, '..', 'server', 'flipz.db')

// Contract configuration
const RPC_URL = 'https://mainnet.base.org'
const GAME_CONTRACT_ADDRESS = '0x47d80671Bcb7Ec368ef4d3ca6E1C20173CCc9a28'

async function fixNFTDepositStatus() {
  console.log('🔧 Fixing NFT Deposit Status...\n')
  
  const db = new sqlite3.Database(DATABASE_PATH)
  const provider = new ethers.JsonRpcProvider(RPC_URL)
  
  try {
    // Get all games that claim to have NFTs deposited
    const games = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, nft_contract, nft_token_id, creator, status, nft_deposited, nft_deposit_verified
        FROM games 
        WHERE nft_deposited = 1 OR nft_deposited IS NULL
        ORDER BY created_at DESC
      `, (err, rows) => {
        if (err) reject(err)
        else resolve(rows || [])
      })
    })
    
    console.log(`📋 Found ${games.length} games to verify`)
    
    let verifiedCount = 0
    let correctedCount = 0
    
    for (const game of games) {
      try {
        // Check if this NFT is actually in the game contract
        const gameContract = new ethers.Contract(
          GAME_CONTRACT_ADDRESS,
          [
            'function getGameNFT(uint256 gameId) view returns (address nftContract, uint256 tokenId, address owner)',
            'function getGame(uint256 gameId) view returns (tuple(address creator, address challenger, uint256 creatorDeposit, uint256 challengerDeposit, bool creatorDeposited, bool challengerDeposited, uint256 gameStartTime, uint256 gameEndTime, bool gameEnded, address winner))'
          ],
          provider
        )
        
        // Try to get the game data from the contract
        let gameData
        try {
          gameData = await gameContract.getGame(game.blockchain_game_id || '0')
        } catch (e) {
          // If game doesn't exist in contract, mark as not deposited
          await updateGameStatus(db, game.id, false, false)
          correctedCount++
          console.log(`❌ Game ${game.id}: Not found in contract - marked as not deposited`)
          continue
        }
        
        // Check if creator actually deposited
        const creatorDeposited = gameData.creatorDeposited
        
        if (creatorDeposited) {
          // Verify the NFT is actually in the contract
          try {
            const nftData = await gameContract.getGameNFT(game.blockchain_game_id || '0')
            const nftContract = nftData.nftContract
            const tokenId = nftData.tokenId
            
            if (nftContract.toLowerCase() === game.nft_contract.toLowerCase() && 
                tokenId.toString() === game.nft_token_id) {
              await updateGameStatus(db, game.id, true, true)
              verifiedCount++
              console.log(`✅ Game ${game.id}: NFT verified in contract`)
            } else {
              await updateGameStatus(db, game.id, false, false)
              correctedCount++
              console.log(`❌ Game ${game.id}: NFT mismatch - marked as not deposited`)
            }
          } catch (e) {
            await updateGameStatus(db, game.id, false, false)
            correctedCount++
            console.log(`❌ Game ${game.id}: NFT verification failed - marked as not deposited`)
          }
        } else {
          await updateGameStatus(db, game.id, false, false)
          correctedCount++
          console.log(`❌ Game ${game.id}: Creator not deposited - marked as not deposited`)
        }
        
      } catch (error) {
        console.error(`❌ Error checking game ${game.id}:`, error.message)
        // Mark as not verified
        await updateGameStatus(db, game.id, false, false)
        correctedCount++
      }
    }
    
    console.log(`\n📊 Verification Complete:`)
    console.log(`   Verified as deposited: ${verifiedCount}`)
    console.log(`   Corrected as not deposited: ${correctedCount}`)
    
    // Show final statistics
    const stats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_games,
          SUM(CASE WHEN nft_deposited = true THEN 1 ELSE 0 END) as games_with_nft,
          SUM(CASE WHEN nft_deposited = false THEN 1 ELSE 0 END) as games_without_nft,
          SUM(CASE WHEN nft_deposit_verified = true THEN 1 ELSE 0 END) as verified_games
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
