import { getApiUrl } from '../config/api'

class GameService {
  // Fetch a game by ID (tries both game and listing)
  async fetchGameOrListing(id) {
    try {
      // First try as a game
      let response = await fetch(getApiUrl(`/games/${id}`))
      
      if (response.ok) {
        const game = await response.json()
        return {
          type: 'game',
          data: this.normalizeGameData(game)
        }
      }
      
      // If not found as game, try as listing
      response = await fetch(getApiUrl(`/listings/${id}`))
      if (!response.ok) {
        throw new Error('Game/Listing not found')
      }
      
      const listing = await response.json()
      return {
        type: 'listing',
        data: this.normalizeListingData(listing)
      }
    } catch (error) {
      console.error('Error fetching game/listing:', error)
      throw error
    }
  }

  // Normalize game data to consistent format
  normalizeGameData(game) {
    return {
      id: game.id,
      type: 'game',
      blockchainId: game.blockchain_id,
      listingId: game.listing_id,
      creator: game.creator,
      joiner: game.joiner,
      nft: {
        contract: game.nft_contract,
        tokenId: game.nft_token_id,
        name: game.nft_name || 'Unknown NFT',
        image: game.nft_image || '/placeholder-nft.svg',
        collection: game.nft_collection || 'Unknown Collection',
        chain: game.nft_chain || 'base'
      },
      price: game.final_price || 0,
      priceUSD: game.final_price || 0,
      status: game.status,
      winner: game.winner,
      gameData: this.parseJsonField(game.game_data),
      coinData: this.parseCoinData(game.coin_data),
      createdAt: game.created_at,
      updatedAt: game.updated_at
    }
  }

  // Normalize listing data to consistent format
  normalizeListingData(listing) {
    return {
      id: listing.id,
      type: 'listing',
      blockchainId: listing.blockchain_game_id,
      creator: listing.creator,
      joiner: null,
      nft: {
        contract: listing.nft_contract,
        tokenId: listing.nft_token_id,
        name: listing.nft_name || 'Unknown NFT',
        image: listing.nft_image || '/placeholder-nft.svg',
        collection: listing.nft_collection || 'Unknown Collection',
        chain: listing.nft_chain || 'base'
      },
      price: listing.asking_price || 0,
      priceUSD: listing.asking_price || 0,
      minOfferPrice: listing.min_offer_price,
      status: listing.status,
      coinData: this.parseCoinData(listing.coin_data),
      createdAt: listing.created_at,
      updatedAt: listing.updated_at
    }
  }

  // Parse JSON fields safely
  parseJsonField(field) {
    if (!field) return {}
    if (typeof field === 'object') return field
    try {
      return JSON.parse(field)
    } catch (error) {
      console.error('Error parsing JSON field:', error)
      return {}
    }
  }

  // Parse coin data consistently
  parseCoinData(coinData) {
    if (!coinData) {
      return {
        type: 'default',
        headsImage: '/coins/plainh.png',
        tailsImage: '/coins/plaint.png',
        isCustom: false
      }
    }

    const parsed = this.parseJsonField(coinData)
    
    return {
      type: parsed.type || 'default',
      headsImage: parsed.headsImage || '/coins/plainh.png',
      tailsImage: parsed.tailsImage || '/coins/plaint.png',
      isCustom: parsed.isCustom || false
    }
  }

  // Fetch all games
  async fetchGames() {
    const response = await fetch(getApiUrl('/games'))
    if (!response.ok) throw new Error('Failed to fetch games')
    const games = await response.json()
    return games.map(game => this.normalizeGameData(game))
  }

  // Fetch all listings
  async fetchListings() {
    const response = await fetch(getApiUrl('/listings'))
    if (!response.ok) throw new Error('Failed to fetch listings')
    const listings = await response.json()
    return listings.map(listing => this.normalizeListingData(listing))
  }

  // Create a listing
  async createListing(listingData) {
    const response = await fetch(getApiUrl('/listings'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listingData)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create listing')
    }
    
    return response.json()
  }

  // Update listing with blockchain game
  async updateListingWithBlockchainGame(listingId, contractGameId, transactionHash) {
    const response = await fetch(getApiUrl(`/listings/${listingId}/contract-game`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractGameId, transactionHash })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update listing')
    }
    
    return response.json()
  }

  // Confirm payment
  async confirmPayment(gameId, joinerAddress, transactionHash) {
    const response = await fetch(getApiUrl(`/games/${gameId}/payment-confirmed`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        joiner_address: joinerAddress,
        payment_transaction_hash: transactionHash
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to confirm payment')
    }
    
    return response.json()
  }

  // Fetch offers for a listing
  async fetchOffers(listingId) {
    const response = await fetch(getApiUrl(`/listings/${listingId}/offers`))
    if (!response.ok) return []
    return response.json()
  }

  // Create an offer
  async createOffer(listingId, offerData) {
    const response = await fetch(getApiUrl(`/listings/${listingId}/offers`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offerData)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create offer')
    }
    
    return response.json()
  }

  // Accept an offer
  async acceptOffer(offerId, finalPrice) {
    const response = await fetch(getApiUrl(`/offers/${offerId}/accept`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ final_price: finalPrice })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to accept offer')
    }
    
    return response.json()
  }

  // Reject an offer
  async rejectOffer(offerId) {
    const response = await fetch(getApiUrl(`/offers/${offerId}/reject`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to reject offer')
    }
    
    return response.json()
  }
}

export default new GameService() 