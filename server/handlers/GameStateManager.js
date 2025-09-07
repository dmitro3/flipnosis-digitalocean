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
      creatorDeposited: false, // Will be set to true when NFT deposit is confirmed
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
    game.depositStartTime = Date.now() // Use timestamp instead of ISO string
    game.depositTimeRemaining = 120
    game.updatedAt = new Date().toISOString()
    
    console.log(`⏱️ Starting deposit stage for game ${gameId}`)
    
    // Broadcast initial deposit stage to ALL users in the room
    const initialMessage = {
      type: 'deposit_stage_started',
      gameId: gameId,
      phase: game.phase,
      creator: game.creator,
      challenger: game.challenger,
      timeRemaining: game.depositTimeRemaining,
      depositStartTime: game.depositStartTime, // Include server timestamp
      creatorDeposited: game.creatorDeposited,
      challengerDeposited: false
    }
    
    // Broadcast to room
    broadcastFn(`game_${gameId}`, initialMessage)
    
    // Start countdown timer
    const timer = setInterval(() => {
      game.depositTimeRemaining--
      
      // Broadcast countdown update to ALL users
      const countdownMessage = {
        type: 'deposit_countdown',
        gameId: gameId,
        timeRemaining: game.depositTimeRemaining,
        creatorDeposited: game.creatorDeposited,
        challengerDeposited: game.challengerDeposited
      }
      
      broadcastFn(`game_${gameId}`, countdownMessage)
      
      // Check if time expired
      if (game.depositTimeRemaining <= 0) {
        clearInterval(timer)
        console.log(`⏰ Deposit time expired for game ${gameId}`)
        this.handleDepositTimeout(gameId, broadcastFn)
      }
      
      // Check if both deposited
      if (game.creatorDeposited && game.challengerDeposited) {
        clearInterval(timer)
        console.log(`✅ Both players deposited for game ${gameId}`)
        this.startGameActive(gameId, broadcastFn)
      }
    }, 1000) // Update every second
    
    this.timers.set(gameId, timer)
    return true
  }

  // Handle deposit confirmation
  confirmDeposit(gameId, player, assetType, transactionHash, broadcastFn) {
    const game = this.games.get(gameId)
    if (!game) {
      console.error(`❌ Game not found: ${gameId}`)
      return false
    }
    
    // Handle creator NFT deposits
    if (assetType === 'nft') {
      const isCreator = player.toLowerCase() === game.creator.toLowerCase()
      if (!isCreator) {
        console.error(`❌ Only creator can deposit NFT`)
        return false
      }
      
      game.creatorDeposited = true
      game.creatorDepositTx = transactionHash
      console.log(`✅ Creator deposited NFT for game ${gameId}`)
      
      game.updatedAt = new Date().toISOString()
      
      // Broadcast NFT deposit update
      broadcastFn(`game_${gameId}`, {
        type: 'nft_deposit_confirmed',
        gameId: gameId,
        player: player,
        assetType: 'nft',
        transactionHash: transactionHash,
        creatorDeposited: true,
        challengerDeposited: game.challengerDeposited
      })
      
      return true
    }
    
    // Handle challenger crypto deposits
    if (assetType === 'crypto') {
      if (game.phase !== this.PHASES.DEPOSIT_STAGE) {
        console.error(`❌ Cannot confirm crypto deposit - game ${gameId} not in deposit stage`)
        return false
      }
      
      const isChallenger = player.toLowerCase() === game.challenger.toLowerCase()
      if (!isChallenger) {
        console.error(`❌ Only challenger can deposit crypto`)
        return false
      }
      
      game.challengerDeposited = true
      game.challengerDepositTx = transactionHash
      console.log(`✅ Challenger deposited crypto for game ${gameId}`)
      
      game.updatedAt = new Date().toISOString()
      
      // Broadcast crypto deposit update
      broadcastFn(`game_${gameId}`, {
        type: 'deposit_confirmed',
        gameId: gameId,
        player: player,
        assetType: 'crypto',
        transactionHash: transactionHash,
        creatorDeposited: game.creatorDeposited,
        challengerDeposited: true,
        timeRemaining: game.depositTimeRemaining,
        bothDeposited: game.creatorDeposited && true
      })
      
      // Check if both deposited to start game
      if (game.creatorDeposited && game.challengerDeposited) {
        console.log(`🎮 Both deposited - starting game ${gameId}`)
        setTimeout(() => {
          this.startGameActive(gameId, broadcastFn)
        }, 1000)
      }
      
      return true
    }
    
    console.error(`❌ Unknown asset type: ${assetType}`)
    return false
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
      creatorDeposited: game.creatorDeposited, // Use actual deposit status
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
    game.currentPlayer = game.creator // Creator goes first in round 1
    game.roundPhase = 'player1_choice'
    game.player1Choice = null
    game.player2Choice = null
    game.player1Power = 0
    game.player2Power = 0
    game.updatedAt = new Date().toISOString()
    
    broadcastFn(`game_${gameId}`, {
      type: 'game_started',
      gameId: gameId,
      phase: game.phase,
      currentRound: game.currentRound,
      currentPlayer: game.currentPlayer,
      roundPhase: game.roundPhase,
      maxRounds: game.maxRounds,
      scores: game.scores,
      creator: game.creator,
      challenger: game.challenger,
      message: 'Game is now active! Player 1 choose heads or tails.'
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

  // Add handler for flip execution:
  executeFlip(gameId, player, power, roundPhase, broadcastFn) {
    const game = this.games.get(gameId)
    if (!game) return
    
    // Store power level
    if (roundPhase === 'player1_flip') {
      game.player1Power = power
    } else {
      game.player2Power = power
    }
    
    // Generate flip result
    const flipResult = Math.random() < 0.5 ? 'heads' : 'tails'
    
    broadcastFn(`game_${gameId}`, {
      type: 'flip_executed',
      gameId: gameId,
      player: player,
      power: power,
      flipResult: flipResult,
      roundPhase: roundPhase
    })
    
    // If this was player 2's flip, determine round winner
    if (roundPhase === 'player2_flip') {
      this.determineRoundWinner(gameId, flipResult, broadcastFn)
    }
  }

  // Determine round winner
  determineRoundWinner(gameId, flipResult, broadcastFn) {
    const game = this.games.get(gameId)
    if (!game) return
    
    // Determine winner based on choices and result
    let roundWinner = null
    if (flipResult === game.player1Choice) {
      roundWinner = game.creator
      game.scores.creator++
    } else if (flipResult === game.player2Choice) {
      roundWinner = game.challenger
      game.scores.challenger++
    }
    
    // Broadcast result
    broadcastFn(`game_${gameId}`, {
      type: 'round_result',
      gameId: gameId,
      currentRound: game.currentRound,
      flipResult: flipResult,
      player1Choice: game.player1Choice,
      player2Choice: game.player2Choice,
      roundWinner: roundWinner,
      scores: game.scores
    })
    
    // Check if game is over
    if (game.scores.creator >= 3 || game.scores.challenger >= 3 || game.currentRound >= game.maxRounds) {
      this.endGame(gameId, broadcastFn)
    } else {
      // Next round
      game.currentRound++
      game.currentPlayer = game.currentPlayer === game.creator ? game.challenger : game.creator
      game.roundPhase = 'player1_choice'
      game.player1Choice = null
      game.player2Choice = null
      game.player1Power = 0
      game.player2Power = 0
      
      setTimeout(() => {
        broadcastFn(`game_${gameId}`, {
          type: 'next_round',
          gameId: gameId,
          currentRound: game.currentRound,
          currentPlayer: game.currentPlayer,
          roundPhase: game.roundPhase,
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
