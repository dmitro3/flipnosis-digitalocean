const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// Connect to the database
const dbPath = path.join(__dirname, '../server/games.db')
const db = new sqlite3.Database(dbPath)

console.log('🔍 Debugging offers in database...')

// Check all offers
db.all('SELECT * FROM offers ORDER BY created_at DESC LIMIT 10', (err, offers) => {
  if (err) {
    console.error('❌ Error fetching offers:', err)
    return
  }
  
  console.log('📦 All offers (last 10):')
  offers.forEach(offer => {
    console.log(`  - ID: ${offer.id}`)
    console.log(`    Listing: ${offer.listing_id}`)
    console.log(`    Status: ${offer.status}`)
    console.log(`    Offerer: ${offer.offerer_address}`)
    console.log(`    Price: $${offer.offer_price}`)
    console.log(`    Created: ${offer.created_at}`)
    console.log('')
  })
  
  // Check specific listing
  const listingId = 'listing_1752421763608_fipzqu9f0'
  console.log(`🔍 Checking offers for listing: ${listingId}`)
  
  db.all('SELECT * FROM offers WHERE listing_id = ?', [listingId], (err, listingOffers) => {
    if (err) {
      console.error('❌ Error fetching listing offers:', err)
      return
    }
    
    console.log(`📦 Offers for listing ${listingId}:`)
    listingOffers.forEach(offer => {
      console.log(`  - ID: ${offer.id}`)
      console.log(`    Status: ${offer.status}`)
      console.log(`    Offerer: ${offer.offerer_address}`)
      console.log(`    Price: $${offer.offer_price}`)
      console.log(`    Created: ${offer.created_at}`)
      console.log('')
    })
    
    // Check specific offer
    const offerId = 'offer_1752421803456_ja9hwvs48'
    console.log(`🔍 Checking specific offer: ${offerId}`)
    
    db.get('SELECT * FROM offers WHERE id = ?', [offerId], (err, offer) => {
      if (err) {
        console.error('❌ Error fetching specific offer:', err)
        return
      }
      
      if (offer) {
        console.log('✅ Offer found:')
        console.log(`  - ID: ${offer.id}`)
        console.log(`  - Listing: ${offer.listing_id}`)
        console.log(`  - Status: ${offer.status}`)
        console.log(`  - Offerer: ${offer.offerer_address}`)
        console.log(`  - Price: $${offer.offer_price}`)
        console.log(`  - Created: ${offer.created_at}`)
        console.log(`  - Updated: ${offer.updated_at}`)
      } else {
        console.log('❌ Offer not found in database')
      }
      
      db.close()
    })
  })
}) 