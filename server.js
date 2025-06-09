class GameSession {
  constructor(gameId) {
    console.log('🎮 Creating new GameSession:', gameId)
    this.gameId = gameId
    this.creator = null
    this.joiner = null
    this.phase = 'waiting'
    this.currentRound = 1
    this.maxRounds = 5
    this.creatorWins = 0
    this.joinerWins = 0
    this.winner = null
    
    // Existing power system
    this.creatorPower = 0
    this.joinerPower = 0
    this.chargingPlayer = null
    this.currentPlayer = null
    
    // Existing player choices
    this.creatorChoice = null
    this.joinerChoice = null
    
    // NEW: NFT vs NFT properties
    this.gameType = 'nft-vs-crypto' // Default
    this.offeredNFTs = [] // Array of NFT offers
    this.acceptedOffer = null // The accepted NFT offer
    this.challengerPaid = false // Whether challenger paid their fee
    
    // Existing control flags
    this.isFlipInProgress = false
    this.gameData = null
    this.clients = new Set()
    this.lastActionTime = Date.now()
    this.roundCompleted = false
    this.syncedFlip = null
    
    console.log('✅ GameSession created with NFT support')
  }

  // Add new method to handle player choices
  setPlayerChoice(address, choice) {
    if (this.phase !== 'choosing' || address !== this.currentPlayer) {
      console.log('❌ Cannot set choice:', { phase: this.phase, currentPlayer: this.currentPlayer, address })
      return false
    }
    
    if (address === this.creator) {
      this.creatorChoice = choice
      console.log('✅ Creator chose:', choice)
    } else if (address === this.joiner) {
      this.joinerChoice = choice
      console.log('✅ Joiner chose:', choice)
    } else {
      return false
    }
    
    // Move to power charging phase after choice is made
    this.phase = 'round_active'
    this.broadcastGameState()
    return true
  }

  // Update the startGame method to begin with choosing phase
  async startGame() {
    console.log('🎮 startGame called:', { currentPhase: this.phase })
    
    if (this.phase !== 'ready') {
      console.log('❌ Cannot start game - wrong phase:', this.phase)
      return
    }
    
    this.phase = 'choosing'  // Changed from 'round_active' to 'choosing'
    this.currentPlayer = this.creator  // Player 1 chooses first
    this.currentRound = 1
    this.resetPowers()
    this.resetChoices()
    
    console.log('✅ Game started:', {
      newPhase: this.phase,
      currentPlayer: this.currentPlayer,
      currentRound: this.currentRound,
      creatorChoice: this.creatorChoice,
      joinerChoice: this.joinerChoice
    })
    
    try {
      await dbHelpers.updateGame(this.gameId, { 
        status: 'active',
        started_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error updating game start:', error)
    }
    
    console.log('🎯 Game started - Player 1 should choose heads or tails')
    this.broadcastGameState()
  }

  // Add method to reset choices
  resetChoices() {
    this.creatorChoice = null
    this.joinerChoice = null
  }

  // Update prepareNextRound to include choice reset
  prepareNextRound() {
    try {
      if (this.phase === 'game_complete') {
        console.log('⚠️ Game already complete, not preparing next round')
        return
      }
      
      console.log('🔄 Preparing next round...', {
        currentRound: this.currentRound,
        maxRounds: this.maxRounds,
        currentPlayer: this.currentPlayer
      })
      
      // Increment round
      this.currentRound++
      
      // Switch players
      this.currentPlayer = this.currentPlayer === this.creator ? this.joiner : this.creator
      
      // Reset round state
      this.phase = 'choosing' // Start new round with choosing
      this.isFlipInProgress = false
      this.roundCompleted = false
      this.resetPowers()
      this.resetChoices() // Reset choices for new round
      
      console.log('✅ Next round ready:', {
        newRound: this.currentRound,
        newCurrentPlayer: this.currentPlayer,
        phase: this.phase
      })
      
      // Broadcast the new round state
      this.broadcastGameState()
      
    } catch (error) {
      console.error('❌ Error in prepareNextRound:', error)
      // Fallback: just broadcast current state
      this.broadcastGameState()
    }
  }

  // Update broadcastGameState to include choices
  broadcastGameState() {
    const state = {
      type: 'game_state',
      gameId: this.gameId,
      creator: this.creator,
      joiner: this.joiner,
      phase: this.phase,
      currentRound: this.currentRound,
      maxRounds: this.maxRounds,
      creatorWins: this.creatorWins,
      joinerWins: this.joinerWins,
      winner: this.winner,
      creatorPower: this.creatorPower,
      joinerPower: this.joinerPower,
      chargingPlayer: this.chargingPlayer,
      currentPlayer: this.currentPlayer,
      isFlipInProgress: this.isFlipInProgress,
      spectators: this.clients.size,
      // NEW: Include player choices
      creatorChoice: this.creatorChoice,
      joinerChoice: this.joinerChoice,
      // NEW: NFT game data
      gameType: this.gameType,
      offeredNFTs: this.offeredNFTs,
      acceptedOffer: this.acceptedOffer,
      challengerPaid: this.challengerPaid
    }

    // Safely broadcast to all clients
    const deadClients = new Set()
    
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify(state))
        } catch (error) {
          console.error('❌ Error sending to client, marking for removal:', error)
          deadClients.add(client)
        }
      } else {
        deadClients.add(client)
      }
    })
    
    // Clean up dead clients
    deadClients.forEach(client => {
      this.clients.delete(client)
    })
  }

  async setJoiner(address, entryFeeHash) {
    console.log('🎮 setJoiner called:', { address, currentPhase: this.phase })
    
    // Only set if not already set
    if (this.joiner) {
      console.log('⚠️ Joiner already set:', this.joiner)
      this.broadcastGameState()
      return
    }
    
    this.joiner = address
    this.phase = 'ready'
    
    console.log('✅ Player 2 joined via WebSocket:', address)
    console.log('🔄 Game state after join:', { 
      phase: this.phase,
      creator: this.creator,
      joiner: this.joiner,
      currentPlayer: this.currentPlayer
    })
    
    this.broadcastGameState()
    
    // Auto-start the choosing phase after 2 seconds
    console.log('⏰ Setting up auto-start timer...')
    setTimeout(() => {
      console.log('⏰ Auto-start timer fired:', {
        currentPhase: this.phase,
        hasCreator: !!this.creator,
        hasJoiner: !!this.joiner
      })
      if (this.phase === 'ready' && this.creator && this.joiner) {
        console.log('🚀 AUTO-STARTING game - entering choosing phase')
        this.startGame()
      } else {
        console.log('⚠️ Auto-start conditions not met:', {
          phase: this.phase,
          creator: this.creator,
          joiner: this.joiner
        })
      }
    }, 2000)
  }

  // NEW: Handle NFT offer submission
  handleNFTOffer(offerData) {
    console.log('🎯 Handling NFT offer:', offerData)
    
    // Validate offer
    if (this.gameType !== 'nft-vs-nft') {
      console.log('❌ Not an NFT vs NFT game')
      return false
    }
    
    if (this.phase !== 'waiting') {
      console.log('❌ Game not in waiting phase')
      return false
    }
    
    if (offerData.offererAddress === this.creator) {
      console.log('❌ Creator cannot offer to their own game')
      return false
    }
    
    // Check if player already has an offer
    const existingOfferIndex = this.offeredNFTs.findIndex(
      offer => offer.offererAddress === offerData.offererAddress
    )
    
    if (existingOfferIndex >= 0) {
      // Update existing offer
      this.offeredNFTs[existingOfferIndex] = offerData
      console.log('✅ Updated existing NFT offer')
    } else {
      // Add new offer
      this.offeredNFTs.push(offerData)
      console.log('✅ Added new NFT offer')
    }
    
    // Broadcast to all clients
    this.broadcastToAll({
      type: 'nft_offer_received',
      gameId: this.gameId,
      offer: offerData,
      totalOffers: this.offeredNFTs.length
    })
    
    return true
  }

  // NEW: Handle NFT offer acceptance
  async handleNFTOfferAcceptance(creatorAddress, acceptedOffer) {
    console.log('✅ Handling NFT offer acceptance:', acceptedOffer)
    
    if (creatorAddress !== this.creator) {
      console.log('❌ Only creator can accept offers')
      return false
    }
    
    if (this.phase !== 'waiting') {
      console.log('❌ Game not in waiting phase')
      return false
    }
    
    this.acceptedOffer = acceptedOffer
    this.joiner = acceptedOffer.offererAddress
    
    // Broadcast acceptance to all clients
    this.broadcastToAll({
      type: 'nft_offer_accepted',
      gameId: this.gameId,
      acceptedOffer: acceptedOffer,
      creatorAddress: creatorAddress
    })
    
    console.log('✅ NFT offer accepted, waiting for challenger payment')
    return true
  }

  // NEW: Handle challenger payment completion
  async handleChallengerPayment(challengerAddress, paymentTxHash) {
    console.log('💰 Handling challenger payment:', challengerAddress)
    
    if (!this.acceptedOffer) {
      console.log('❌ No accepted offer found')
      return false
    }
    
    if (challengerAddress !== this.acceptedOffer.offererAddress) {
      console.log('❌ Payment from wrong address')
      return false
    }
    
    this.challengerPaid = true
    this.phase = 'ready'
    
    // Update database
    try {
      await dbHelpers.updateGame(this.gameId, {
        joiner: challengerAddress,
        status: 'joined',
        entry_fee_hash: paymentTxHash,
        accepted_nft_offer: JSON.stringify(this.acceptedOffer)
      })
    } catch (error) {
      console.error('❌ Database update error:', error)
    }
    
    // Broadcast game ready
    this.broadcastToAll({
      type: 'nft_game_ready',
      gameId: this.gameId,
      challengerAddress: challengerAddress,
      paymentTxHash: paymentTxHash
    })
    
    // Auto-start after 2 seconds
    setTimeout(() => {
      if (this.phase === 'ready') {
        this.startGame()
      }
    }, 2000)
    
    console.log('✅ Challenger payment processed, game ready')
    return true
  }

  // NEW: Broadcast to all clients helper
  broadcastToAll(message) {
    const deadClients = new Set()
    
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify(message))
        } catch (error) {
          console.error('❌ Error sending to client:', error)
          deadClients.add(client)
        }
      } else {
        deadClients.add(client)
      }
    })
    
    // Clean up dead clients
    deadClients.forEach(client => {
      this.clients.delete(client)
    })
  }

  // UPDATE existing setGameData to handle game type
  async setGameData(data) {
    this.gameData = data
    this.creator = data.creator
    this.maxRounds = data.rounds
    this.gameType = data.gameType || 'nft-vs-crypto' // NEW
    
    try {
      await dbHelpers.createGame(data)
    } catch (error) {
      console.error('Error saving game:', error)
    }
    this.broadcastGameState()
  }
} 