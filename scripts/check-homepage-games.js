const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// Database path
const DATABASE_PATH = path.join(__dirname, '..', 'server', 'flipz.db')

async function checkHomepageGames() {
  console.log('🔍 Checking Homepage Games Display...\n')
  
  const db = new sqlite3.Database(DATABASE_PATH)
  
  try {
    // Get all games
    const allGames = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, status, nft_deposited, nft_deposit_verified, created_at, 
               creator_deposited, challenger_deposited
        FROM games 
        ORDER BY created_at DESC
      `, (err, rows) => {
        if (err) reject(err)
        else resolve(rows || [])
      })
    })
    
    console.log(`📊 Total games in database: ${allGames.length}`)
    
    // Check what should be shown on homepage (based on Home.jsx logic)
    const homepageGames = allGames.filter(g => 
      g.status !== 'cancelled' && 
      g.status !== 'waiting_deposits' && 
      g.status !== 'waiting_challenger_deposit' &&
      g.nft_deposited === 1  // Only show games with NFTs deposited
    )
    
    console.log(`📊 Games that should show on homepage: ${homepageGames.length}`)
    
    // Check NFT deposit status
    const gamesWithNFT = homepageGames.filter(g => g.nft_deposited === 1)
    const gamesWithoutNFT = homepageGames.filter(g => g.nft_deposited === 0)
    const gamesUnknownNFT = homepageGames.filter(g => g.nft_deposited === null)
    
    console.log(`📊 Homepage games breakdown:`)
    console.log(`   With NFT deposited: ${gamesWithNFT.length}`)
    console.log(`   Without NFT deposited: ${gamesWithoutNFT.length}`)
    console.log(`   Unknown NFT status: ${gamesUnknownNFT.length}`)
    
    // Show some examples
    console.log(`\n📋 Sample games without NFTs:`)
    gamesWithoutNFT.slice(0, 3).forEach(game => {
      console.log(`   ${game.id} - Status: ${game.status} - Created: ${game.created_at}`)
    })
    
    // Check if there are listings mixed in
    const listings = allGames.filter(g => g.id && g.id.startsWith('listing_'))
    console.log(`\n📊 Listings in database: ${listings.length}`)
    
    // Total items that should show (games + listings)
    const totalItems = homepageGames.length + listings.length
    console.log(`\n📊 Total items that should show on homepage: ${totalItems}`)
    
    // Check the actual API response
    console.log(`\n🔍 Checking API response...`)
    const apiGames = await new Promise((resolve, reject) => {
      db.all(`
        SELECT COUNT(*) as count
        FROM games 
        WHERE status NOT IN ('cancelled', 'waiting_deposits', 'waiting_challenger_deposit')
      `, (err, rows) => {
        if (err) reject(err)
        else resolve(rows || [])
      })
    })
    
    console.log(`📊 API games count: ${apiGames[0]?.count || 0}`)
    
  } catch (error) {
    console.error('❌ Error checking games:', error.message)
  } finally {
    db.close()
  }
}

checkHomepageGames().catch(console.error)
