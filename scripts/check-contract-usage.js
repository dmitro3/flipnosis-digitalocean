const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// Database path
const DATABASE_PATH = path.join(__dirname, '..', 'server', 'flipz.db')

async function checkContractUsage() {
  console.log('🔍 Checking Contract Usage in Database...\n')
  
  const db = new sqlite3.Database(DATABASE_PATH)
  
  try {
    // Check what game contracts are being used
    const gameContracts = await new Promise((resolve, reject) => {
      db.all(`
        SELECT DISTINCT blockchain_game_id, COUNT(*) as game_count
        FROM games 
        WHERE blockchain_game_id IS NOT NULL AND blockchain_game_id != ''
        GROUP BY blockchain_game_id
        ORDER BY game_count DESC
      `, (err, rows) => {
        if (err) reject(err)
        else resolve(rows || [])
      })
    })
    
    console.log(`📊 Game Contracts Found:`)
    gameContracts.forEach(contract => {
      console.log(`   ${contract.blockchain_game_id}: ${contract.game_count} games`)
    })
    
    // Check NFT contracts being used
    const nftContracts = await new Promise((resolve, reject) => {
      db.all(`
        SELECT DISTINCT nft_contract, COUNT(*) as nft_count
        FROM games 
        WHERE nft_contract IS NOT NULL AND nft_contract != ''
        GROUP BY nft_contract
        ORDER BY nft_count DESC
      `, (err, rows) => {
        if (err) reject(err)
        else resolve(rows || [])
      })
    })
    
    console.log(`\n📊 NFT Contracts Found:`)
    nftContracts.forEach(contract => {
      console.log(`   ${contract.nft_contract}: ${contract.nft_count} NFTs`)
    })
    
    // Check if there are any games with different blockchain_game_id patterns
    const gameIdPatterns = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          CASE 
            WHEN blockchain_game_id LIKE '0x%' THEN 'Hex Game ID'
            WHEN blockchain_game_id REGEXP '^[0-9]+$' THEN 'Numeric Game ID'
            ELSE 'Other Format'
          END as id_type,
          COUNT(*) as count
        FROM games 
        WHERE blockchain_game_id IS NOT NULL AND blockchain_game_id != ''
        GROUP BY id_type
      `, (err, rows) => {
        if (err) reject(err)
        else resolve(rows || [])
      })
    })
    
    console.log(`\n📊 Game ID Patterns:`)
    gameIdPatterns.forEach(pattern => {
      console.log(`   ${pattern.id_type}: ${pattern.count} games`)
    })
    
    // Check recent games to see what contract they're using
    const recentGames = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, blockchain_game_id, nft_contract, created_at, status
        FROM games 
        WHERE blockchain_game_id IS NOT NULL AND blockchain_game_id != ''
        ORDER BY created_at DESC
        LIMIT 10
      `, (err, rows) => {
        if (err) reject(err)
        else resolve(rows || [])
      })
    })
    
    console.log(`\n📊 Recent Games Contract Usage:`)
    recentGames.forEach(game => {
      console.log(`   ${game.id}: Game Contract: ${game.blockchain_game_id}, NFT Contract: ${game.nft_contract}, Status: ${game.status}`)
    })
    
  } catch (error) {
    console.error('❌ Error checking contracts:', error.message)
  } finally {
    db.close()
  }
}

checkContractUsage().catch(console.error)
