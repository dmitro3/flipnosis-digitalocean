const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// Connect to the database
const dbPath = path.join(__dirname, '../server/games.db')
const db = new sqlite3.Database(dbPath)

console.log('🧹 Cleaning up invalid games from database...')

// Find games with null or invalid IDs
db.all('SELECT * FROM games WHERE id IS NULL OR id = "null" OR id = ""', (err, invalidGames) => {
  if (err) {
    console.error('❌ Error finding invalid games:', err)
    return
  }
  
  console.log(`📊 Found ${invalidGames.length} games with invalid IDs:`)
  invalidGames.forEach(game => {
    console.log(`  - ID: "${game.id}"`)
    console.log(`    Status: ${game.status}`)
    console.log(`    Creator: ${game.creator}`)
    console.log(`    NFT: ${game.nft_name}`)
    console.log('')
  })
  
  if (invalidGames.length === 0) {
    console.log('✅ No invalid games found!')
    db.close()
    return
  }
  
  // Delete games with null or invalid IDs
  db.run('DELETE FROM games WHERE id IS NULL OR id = "null" OR id = ""', (err) => {
    if (err) {
      console.error('❌ Error deleting invalid games:', err)
      return
    }
    
    console.log(`✅ Deleted ${invalidGames.length} invalid games from database`)
    
    // Also check for any related offers that might be orphaned
    db.all('SELECT * FROM offers WHERE listing_id IS NULL OR listing_id = "null" OR listing_id = ""', (err, invalidOffers) => {
      if (err) {
        console.error('❌ Error finding invalid offers:', err)
      } else if (invalidOffers.length > 0) {
        console.log(`📊 Found ${invalidOffers.length} offers with invalid listing IDs`)
        invalidOffers.forEach(offer => {
          console.log(`  - Offer ID: ${offer.id}`)
          console.log(`    Listing ID: "${offer.listing_id}"`)
          console.log(`    Status: ${offer.status}`)
        })
        
        // Delete invalid offers
        db.run('DELETE FROM offers WHERE listing_id IS NULL OR listing_id = "null" OR listing_id = ""', (err) => {
          if (err) {
            console.error('❌ Error deleting invalid offers:', err)
          } else {
            console.log(`✅ Deleted ${invalidOffers.length} invalid offers from database`)
          }
          db.close()
        })
      } else {
        console.log('✅ No invalid offers found')
        db.close()
      }
    })
  })
}) 