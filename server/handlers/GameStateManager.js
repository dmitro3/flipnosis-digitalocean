// GameStateManager.js - Server-side game state machine
class GameStateManager {
  constructor() {
    this.games = new Map() // gameId -> GameState
    this.timers = new Map() // gameId -> interval timers
  }

  // Game phases
  PHASES = {
    OFFER_STAGE: 'offer_stage',
    DEPOSIT_STAGE: 'deposit_stage', 
    GAME_ACTIVE: 'game_active',
    GAME_COMPLETE: 'game_complete',
    CANCELLED: 'cancelled'
  }

  // Create new game
  createGame(gameId, creator, nftData, askingPrice) {
    const gameState = {
      id: gameId,
      phase: this.PHASES.OFFER_STAGE,
      creator: creator,
      challenger: null,
      nftData: nftData,
      askingPrice: askingPrice,
      
      // Deposit tracking
      depositStartTime: null,
      depositTimeRemaining: 120, // 2 minutes in seconds
      creatorDeposited: true, // Creator's NFT already deposited at game creation
      challengerDeposited: false,
      creatorDepositTx: null,
      challengerDepositTx: null,
      
      // Game data
      currentRound: 0,
      maxRounds: 5,
      scores: { creator: 0, challenger: 0 },
      currentTurn: null,
      roundChoices: {},
      powerLevels: {},
      
      // Metadata
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      spectators: new Set()
    }
    
    this.games.set(gameId, gameState)
    console.log(`🎮 Game created: ${gameId}`)
    return gameState
  }

  // Get game state
  getGame(gameId) {
    return this.games.get(gameId)
  }

  // Start deposit stage with countdown
  startDepositStage(gameId, challenger, broadcastFn) {
    const game = this.games.get(gameId)
    if (!game) {
      console.error(`❌ Game not found: ${gameId}`)
      return false
    }
    
    // Update game state
    game.phase = this.PHASES.DEPOSIT_STAGE
    game.challenger = challenger
    game.depositStartTime = new Date().toISOString()
    game.depositTimeRemaining = 120
    game.updatedAt = new Date().toISOString()
    
    console.log(`⏱️ Starting deposit stage for game ${gameId}`)
    
    // Broadcast initial deposit stage
    broadcastFn(`game_${gameId}`, {
      type: 'deposit_stage_started',
      gameId: gameId,
      phase: game.phase,
      creator: game.creator,
      challenger: game.challenger,
      timeRemaining: game.depositTimeRemaining,
      creatorDeposited: true, // Always true - NFT already deposited
      challengerDeposited: false
    })
    
    // Start countdown timer
    const timer = setInterval(() => {
      game.depositTimeRemaining--
      
      // Broadcast countdown update
      broadcastFn(`game_${gameId}`, {
        type: 'deposit_countdown',
        gameId: gameId,
        timeRemaining: game.depositTimeRemaining,
        creatorDeposited: true, // Always true
        challengerDeposited: game.challengerDeposited
      })
      
      // Check if time expired
      if (game.depositTimeRemaining <= 0) {
        console.log(`⏰ Deposit time expired for game ${gameId}`)
        this.handleDepositTimeout(gameId, broadcastFn)
      }
      
      // Check if challenger deposited
      if (game.challengerDeposited) {
        console.log(`✅ Challenger deposited for game ${gameId}`)
        this.startGameActive(gameId, broadcastFn)
      }
    }, 1000) // Update every second
    
    this.timers.set(gameId, timer)
    return true
  }

  // Handle deposit confirmation
  confirmDeposit(gameId, player, assetType, transactionHash, broadcastFn) {
    const game = this.games.get(gameId)
    if (!game || game.phase !== this.PHASES.DEPOSIT_STAGE) {
      console.error(`❌ Cannot confirm deposit - game ${gameId} not in deposit stage`)
      return false
    }
    
    // Only challenger needs to deposit (creator already deposited NFT at game creation)
    const isChallenger = player.toLowerCase() === game.challenger.toLowerCase()
    if (!isChallenger) {
      console.log(`⚠️ Creator deposit ignored - NFT already deposited at game creation`)
      return false
    }
    
    game.challengerDeposited = true
    game.challengerDepositTx = transactionHash
    console.log(`✅ Challenger deposited crypto for game ${gameId}`)
    
    game.updatedAt = new Date().toISOString()
    
    // Broadcast deposit update
    broadcastFn(`game_${gameId}`, {
      type: 'deposit_confirmed',
      gameId: gameId,
      player: player,
      assetType: 'crypto',
      transactionHash: transactionHash,
      creatorDeposited: true, // Always true
      challengerDeposited: true,
      timeRemaining: game.depositTimeRemaining,
      bothDeposited: true // Both are now deposited
    })
    
    // Challenger deposited - start game
    console.log(`🎮 Challenger deposited - starting game ${gameId}`)
    setTimeout(() => {
      this.startGameActive(gameId, broadcastFn)
    }, 1000)
    
    return true
  }

  // Handle deposit timeout
  handleDepositTimeout(gameId, broadcastFn) {
    const game = this.games.get(gameId)
    if (!game) return
    
    // Clear timer
    const timer = this.timers.get(gameId)
    if (timer) {
      clearInterval(timer)
      this.timers.delete(gameId)
    }
    
    // Only challenger can timeout since creator already deposited
    let refundTo = game.creator // Creator gets NFT back
    let penaltyTo = game.challenger // Challenger loses opportunity
    
    // Update game state
    game.phase = this.PHASES.CANCELLED
    game.updatedAt = new Date().toISOString()
    
    // Broadcast timeout
    broadcastFn(`game_${gameId}`, {
      type: 'deposit_timeout',
      gameId: gameId,
      refundTo: refundTo,
      penaltyTo: penaltyTo,
      creatorDeposited: true, // Always true
      challengerDeposited: game.challengerDeposited,
      message: 'Challenger failed to deposit crypto in time. Creator\'s NFT will be refunded.'
    })
  }

  // Start active game
  startGameActive(gameId, broadcastFn) {
    const game = this.games.get(gameId)
    if (!game) return
    
    // Clear deposit timer
    const timer = this.timers.get(gameId)
    if (timer) {
      clearInterval(timer)
      this.timers.delete(gameId)
    }
    
    // Update game state
    game.phase = this.PHASES.GAME_ACTIVE
    game.currentRound = 1
    game.currentTurn = game.creator // Creator goes first
    game.updatedAt = new Date().toISOString()
    
    // Broadcast game start
    broadcastFn(`game_${gameId}`, {
      type: 'game_started',
      gameId: gameId,
      phase: game.phase,
      currentRound: game.currentRound,
      currentTurn: game.currentTurn,
      maxRounds: game.maxRounds,
      scores: game.scores,
      message: 'Game is now active! Round 1 begins.'
    })
  }

  // Handle game moves (for future implementation)
  makeChoice(gameId, player, choice, broadcastFn) {
    const game = this.games.get(gameId)
    if (!game || game.phase !== this.PHASES.GAME_ACTIVE) {
      return false
    }
    
    const roundKey = `round_${game.currentRound}`
    if (!game.roundChoices[roundKey]) {
      game.roundChoices[roundKey] = {}
    }
    
    const role = player === game.creator ? 'creator' : 'challenger'
    game.roundChoices[roundKey][role] = choice
    
    // Broadcast choice made (without revealing the choice)
    broadcastFn(`game_${gameId}`, {
      type: 'choice_made',
      gameId: gameId,
      player: player,
      currentRound: game.currentRound,
      choicesMade: Object.keys(game.roundChoices[roundKey]).length,
      allChoicesMade: Object.keys(game.roundChoices[roundKey]).length === 2
    })
    
    // If both players have chosen, execute flip
    if (Object.keys(game.roundChoices[roundKey]).length === 2) {
      this.executeFlip(gameId, broadcastFn)
    }
    
    return true
  }

  // Execute coin flip
  executeFlip(gameId, broadcastFn) {
    const game = this.games.get(gameId)
    if (!game) return
    
    const roundKey = `round_${game.currentRound}`
    const choices = game.roundChoices[roundKey]
    
    // Simple flip result
    const flipResult = Math.random() < 0.5 ? 'heads' : 'tails'
    
    // Determine winner
    let roundWinner = null
    if (choices.creator === flipResult) {
      roundWinner = game.creator
      game.scores.creator++
    } else if (choices.challenger === flipResult) {
      roundWinner = game.challenger
      game.scores.challenger++
    }
    
    // Broadcast result
    broadcastFn(`game_${gameId}`, {
      type: 'round_result',
      gameId: gameId,
      currentRound: game.currentRound,
      flipResult: flipResult,
      choices: choices,
      roundWinner: roundWinner,
      scores: game.scores
    })
    
    // Check if game is over
    if (game.scores.creator >= 3 || game.scores.challenger >= 3 || game.currentRound >= game.maxRounds) {
      this.endGame(gameId, broadcastFn)
    } else {
      // Next round
      game.currentRound++
      game.currentTurn = game.currentTurn === game.creator ? game.challenger : game.creator
      
      setTimeout(() => {
        broadcastFn(`game_${gameId}`, {
          type: 'next_round',
          gameId: gameId,
          currentRound: game.currentRound,
          currentTurn: game.currentTurn,
          scores: game.scores
        })
      }, 3000)
    }
  }

  // End game
  endGame(gameId, broadcastFn) {
    const game = this.games.get(gameId)
    if (!game) return
    
    game.phase = this.PHASES.GAME_COMPLETE
    const winner = game.scores.creator > game.scores.challenger ? game.creator : game.challenger
    
    broadcastFn(`game_${gameId}`, {
      type: 'game_ended',
      gameId: gameId,
      winner: winner,
      finalScores: game.scores,
      message: `Game Over! Winner: ${winner}`
    })
    
    // Clean up after 5 minutes
    setTimeout(() => {
      this.cleanup(gameId)
    }, 5 * 60 * 1000)
  }

  // Add spectator
  addSpectator(gameId, address) {
    const game = this.games.get(gameId)
    if (game) {
      game.spectators.add(address)
      console.log(`👁️ Spectator ${address} joined game ${gameId}`)
    }
  }

  // Cleanup game
  cleanup(gameId) {
    const timer = this.timers.get(gameId)
    if (timer) {
      clearInterval(timer)
      this.timers.delete(gameId)
    }
    this.games.delete(gameId)
    console.log(`🧹 Game ${gameId} cleaned up`)
  }
}

module.exports = GameStateManager
