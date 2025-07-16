const sqlite3 = require('sqlite3').verbose()
const path = require('path')

class GameChecker {
  constructor() {
    this.db = null
  }

  async initialize() {
    console.log('🔍 Starting detailed game check...')
    console.log('📅', new Date().toISOString())
    
    const dbPath = path.join(__dirname, '..', 'server', 'games.db')
    this.db = new sqlite3.Database(dbPath)
    
    console.log('✅ Database opened successfully')
  }

  async checkGames() {
    console.log('\n🎮 Checking all games in detail...')
    
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          id, 
          creator, 
          joiner, 
          nft_contract, 
          nft_token_id, 
          nft_name,
          nft_image,
          price_usd,
          status,
          game_type,
          coin,
          nft_chain,
          contract_game_id,
          listing_id,
          created_at,
          updated_at
        FROM games 
        ORDER BY created_at DESC
      `, [], (err, games) => {
        if (err) {
          console.error('❌ Error fetching games:', err)
          reject(err)
          return
        }

        console.log(`📊 Found ${games.length} games`)

        games.forEach((game, index) => {
          console.log(`\n${index + 1}. Game: ${game.id}`)
          console.log(`   Creator: ${game.creator}`)
          console.log(`   Joiner: ${game.joiner || 'NONE'}`)
          console.log(`   NFT: ${game.nft_contract} #${game.nft_token_id}`)
          console.log(`   NFT Name: ${game.nft_name}`)
          console.log(`   Price: $${game.price_usd}`)
          console.log(`   Status: ${game.status}`)
          console.log(`   Game Type: ${game.game_type}`)
          console.log(`   Contract Game ID: ${game.contract_game_id || 'NOT SET'}`)
          console.log(`   Listing ID: ${game.listing_id || 'NONE'}`)
          console.log(`   Created: ${game.created_at}`)
          console.log(`   Updated: ${game.updated_at}`)
        })

        resolve()
      })
    })
  }

  async checkListings() {
    console.log('\n📋 Checking all listings in detail...')
    
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          id, 
          creator, 
          nft_contract, 
          nft_token_id, 
          nft_name,
          nft_image,
          asking_price,
          status,
          contract_game_id,
          transaction_hash,
          created_at,
          updated_at
        FROM game_listings 
        ORDER BY created_at DESC
      `, [], (err, listings) => {
        if (err) {
          console.error('❌ Error fetching listings:', err)
          reject(err)
          return
        }

        console.log(`📊 Found ${listings.length} listings`)

        listings.forEach((listing, index) => {
          console.log(`\n${index + 1}. Listing: ${listing.id}`)
          console.log(`   Creator: ${listing.creator}`)
          console.log(`   NFT: ${listing.nft_contract} #${listing.nft_token_id}`)
          console.log(`   NFT Name: ${listing.nft_name}`)
          console.log(`   Asking Price: $${listing.asking_price}`)
          console.log(`   Status: ${listing.status}`)
          console.log(`   Contract Game ID: ${listing.contract_game_id || 'NOT SET'}`)
          console.log(`   Transaction Hash: ${listing.transaction_hash || 'NOT SET'}`)
          console.log(`   Created: ${listing.created_at}`)
          console.log(`   Updated: ${listing.updated_at}`)
        })

        resolve()
      })
    })
  }

  async checkOffers() {
    console.log('\n💰 Checking all offers...')
    
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          id, 
          listing_id, 
          offerer_address, 
          offerer_name,
          offer_price,
          message,
          status,
          created_at,
          updated_at
        FROM offers 
        ORDER BY created_at DESC
      `, [], (err, offers) => {
        if (err) {
          console.error('❌ Error fetching offers:', err)
          reject(err)
          return
        }

        console.log(`📊 Found ${offers.length} offers`)

        offers.forEach((offer, index) => {
          console.log(`\n${index + 1}. Offer: ${offer.id}`)
          console.log(`   Listing ID: ${offer.listing_id}`)
          console.log(`   Offerer: ${offer.offerer_address}`)
          console.log(`   Offerer Name: ${offer.offerer_name || 'NONE'}`)
          console.log(`   Price: $${offer.offer_price}`)
          console.log(`   Message: ${offer.message || 'NONE'}`)
          console.log(`   Status: ${offer.status}`)
          console.log(`   Created: ${offer.created_at}`)
          console.log(`   Updated: ${offer.updated_at}`)
        })

        resolve()
      })
    })
  }

  async run() {
    try {
      await this.initialize()
      await this.checkListings()
      await this.checkGames()
      await this.checkOffers()
    } catch (error) {
      console.error('❌ Detailed check failed:', error)
    } finally {
      if (this.db) {
        this.db.close()
      }
    }
  }
}

async function main() {
  const checker = new GameChecker()
  await checker.run()
}

main().catch(console.error) 