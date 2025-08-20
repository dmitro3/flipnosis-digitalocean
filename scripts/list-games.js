const sqlite3 = require('sqlite3').verbose()
const path = require('path')

async function listGames() {
  console.log('📋 Listing all games in database...')
  
  const dbPath = '/opt/flipnosis/app/server/flipz.db'
  const db = new sqlite3.Database(dbPath)
  
  try {
    const games = await new Promise((resolve, reject) => {
      db.all('SELECT id, status, creator, challenger, payment_amount, created_at FROM games ORDER BY created_at DESC LIMIT 20', [], (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
    
    console.log(`\n🎮 Found ${games.length} games:`)
    
    for (const game of games) {
      console.log(`\n   ID: ${game.id}`)
      console.log(`   Status: ${game.status}`)
      console.log(`   Creator: ${game.creator}`)
      console.log(`   Challenger: ${game.challenger || 'None'}`)
      console.log(`   Payment: ${game.payment_amount || 'None'}`)
      console.log(`   Created: ${game.created_at}`)
    }
    
    // Also check listings
    const listings = await new Promise((resolve, reject) => {
      db.all('SELECT id, creator, status, created_at FROM listings ORDER BY created_at DESC LIMIT 10', [], (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
    
    console.log(`\n📋 Found ${listings.length} listings:`)
    
    for (const listing of listings) {
      console.log(`\n   ID: ${listing.id}`)
      console.log(`   Creator: ${listing.creator}`)
      console.log(`   Status: ${listing.status}`)
      console.log(`   Created: ${listing.created_at}`)
    }
    
  } catch (error) {
    console.error('❌ Error listing games:', error)
  } finally {
    db.close()
  }
}

// Run the list
listGames().catch(console.error)
