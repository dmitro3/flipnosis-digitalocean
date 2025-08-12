const crypto = require('crypto')
const CoinStreamService = require('./coinStream')

class GameEngine {
  constructor(dbService, wsHandlers) {
    this.dbService = dbService
    this.wsHandlers = wsHandlers
    this.coinStreamService = new CoinStreamService()
    
    // Game state tracking
    this.activeGames = new Map() // gameId -> gameState
    this.gameTimers = new Map() // gameId -> timers
    this.powerCharges = new Map() // gameId -> { creator: power, challenger: power }
    this.playerChoices = new Map() // gameId -> { creator: choice, challenger: choice }
    this.gameRounds = new Map() // gameId -> current round data
    
    // Game configuration
    this.config = {
      roundTimeout: 30000, // 30 seconds per round
      powerChargeTimeout: 15000, // 15 seconds to charge power
      maxPowerLevel: 10,
      minPowerLevel: 1,
      flipDuration: 3000, // 3 seconds for flip animation
      maxRounds: 5
    }
  }

  // Initialize a new game
  async initializeGame(gameId, gameData) {
    console.log('🎮 Initializing game engine for game:', gameId)
    
    const gameState = {
      id: gameId,
      status: 'active',
      currentRound: 1,
      creator: gameData.creator,
      challenger: gameData.challenger,
      creatorWins: 0,
      challengerWins: 0,
      phase: 'waiting_for_choices', // waiting_for_choices, power_charging, flipping, round_complete
      currentTurn: null,
      roundStartTime: Date.now(),
      lastActivity: Date.now()
    }
    
    this.activeGames.set(gameId, gameState)
    this.powerCharges.set(gameId, { creator: 0, challenger: 0 })
    this.playerChoices.set(gameId, { creator: null, challenger: null })
    this.gameRounds.set(gameId, {
      roundNumber: 1,
      creatorChoice: null,
      challengerChoice: null,
      flipResult: null,
      winner: null
    })
    
    // Initialize coin scene
    let coinData = {}
    try {
      if (gameData.coin_data) {
        coinData = JSON.parse(gameData.coin_data)
      }
    } catch (e) {
      console.warn('⚠️ Could not parse coin data, using defaults')
    }
    
    this.coinStreamService.initializeGameScene(gameId, coinData)
    
    // Start round timer
    this.startRoundTimer(gameId)
    
    console.log('✅ Game engine initialized for game:', gameId)
    return gameState
  }

  // Handle player choice (heads/tails)
  async handlePlayerChoice(gameId, player, choice) {
    console.log('🎯 Player choice received:', { gameId, player, choice })
    
    const gameState = this.activeGames.get(gameId)
    if (!gameState) {
      console.error('❌ Game not found:', gameId)
      return false
    }
    
    if (gameState.phase !== 'waiting_for_choices') {
      console.warn('⚠️ Game not in choice phase:', gameState.phase)
      return false
    }
    
    // Validate choice
    if (!['heads', 'tails'].includes(choice)) {
      console.error('❌ Invalid choice:', choice)
      return false
    }
    
    // Set player choice
    const choices = this.playerChoices.get(gameId)
    const isCreator = player === gameState.creator
    
    if (isCreator) {
      choices.creator = choice
    } else {
      choices.challenger = choice
    }
    
    // Broadcast choice to room
    this.wsHandlers.broadcastToRoom(gameId, {
      type: 'player_choice_made',
      gameId,
      player,
      choice,
      timestamp: Date.now()
    })
    
    // Check if both players have chosen
    if (choices.creator && choices.challenger) {
      console.log('✅ Both players have chosen, starting power phase')
      await this.startPowerPhase(gameId)
    }
    
    return true
  }

  // Start power charging phase
  async startPowerPhase(gameId) {
    console.log('⚡ Starting power phase for game:', gameId)
    
    const gameState = this.activeGames.get(gameId)
    if (!gameState) return
    
    gameState.phase = 'power_charging'
    gameState.currentTurn = gameState.creator // Creator goes first
    gameState.powerStartTime = Date.now()
    
    // Reset power charges
    this.powerCharges.set(gameId, { creator: 0, challenger: 0 })
    
    // Broadcast power phase start
    this.wsHandlers.broadcastToRoom(gameId, {
      type: 'power_phase_started',
      gameId,
      currentTurn: gameState.currentTurn,
      timestamp: Date.now()
    })
    
    // Start power charge timer
    this.startPowerTimer(gameId)
  }

  // Handle power charge start
  async handlePowerChargeStart(gameId, player) {
    console.log('⚡ Power charge started:', { gameId, player })
    
    const gameState = this.activeGames.get(gameId)
    if (!gameState || gameState.phase !== 'power_charging') {
      return false
    }
    
    if (gameState.currentTurn !== player) {
      console.warn('⚠️ Not player\'s turn:', { currentTurn: gameState.currentTurn, player })
      return false
    }
    
    // Broadcast power charge start
    this.wsHandlers.broadcastToRoom(gameId, {
      type: 'power_charge_started',
      gameId,
      player,
      timestamp: Date.now()
    })
    
    return true
  }

  // Handle power charge completion
  async handlePowerChargeComplete(gameId, player, powerLevel) {
    console.log('⚡ Power charge completed:', { gameId, player, powerLevel })
    
    const gameState = this.activeGames.get(gameId)
    if (!gameState || gameState.phase !== 'power_charging') {
      return false
    }
    
    if (gameState.currentTurn !== player) {
      console.warn('⚠️ Not player\'s turn for power charge')
      return false
    }
    
    // Validate power level
    const validatedPower = Math.max(
      this.config.minPowerLevel,
      Math.min(this.config.maxPowerLevel, powerLevel)
    )
    
    // Set power charge
    const powerCharges = this.powerCharges.get(gameId)
    const isCreator = player === gameState.creator
    
    if (isCreator) {
      powerCharges.creator = validatedPower
    } else {
      powerCharges.challenger = validatedPower
    }
    
    // Broadcast power charge
    this.wsHandlers.broadcastToRoom(gameId, {
      type: 'power_charged',
      gameId,
      player,
      powerLevel: validatedPower,
      timestamp: Date.now()
    })
    
    // Switch turns or trigger flip
    if (gameState.currentTurn === gameState.creator) {
      // Creator charged, now challenger's turn
      gameState.currentTurn = gameState.challenger
      
      this.wsHandlers.broadcastToRoom(gameId, {
        type: 'turn_switched',
        gameId,
        currentTurn: gameState.currentTurn,
        timestamp: Date.now()
      })
      
      // Reset power timer for challenger
      this.startPowerTimer(gameId)
    } else {
      // Challenger charged, both players have charged - trigger flip
      await this.triggerFlip(gameId)
    }
    
    return true
  }

  // Trigger the coin flip
  async triggerFlip(gameId) {
    console.log('🎲 Triggering flip for game:', gameId)
    
    const gameState = this.activeGames.get(gameId)
    const choices = this.playerChoices.get(gameId)
    const powerCharges = this.powerCharges.get(gameId)
    const roundData = this.gameRounds.get(gameId)
    
    if (!gameState || !choices || !powerCharges) {
      console.error('❌ Missing game data for flip')
      return
    }
    
    // Generate flip result
    const result = Math.random() < 0.5 ? 'heads' : 'tails'
    const creatorWins = choices.creator === result
    const winner = creatorWins ? gameState.creator : gameState.challenger
    
    // Update round data
    roundData.creatorChoice = choices.creator
    roundData.challengerChoice = choices.challenger
    roundData.flipResult = result
    roundData.winner = winner
    
    // Update game state
    if (creatorWins) {
      gameState.creatorWins++
    } else {
      gameState.challengerWins++
    }
    
    gameState.phase = 'flipping'
    
    console.log('🎲 Flip result:', {
      result,
      creatorChoice: choices.creator,
      challengerChoice: choices.challenger,
      winner,
      creatorPower: powerCharges.creator,
      challengerPower: powerCharges.challenger
    })
    
    // Broadcast flip start
    this.wsHandlers.broadcastToRoom(gameId, {
      type: 'FLIP_STARTED',
      gameId,
      result,
      duration: this.config.flipDuration,
      timestamp: Date.now()
    })
    
    // Start server-side flip animation
    const animationStarted = this.coinStreamService.startFlipAnimation(
      gameId,
      result,
      powerCharges.creator,
      powerCharges.challenger,
      this.config.flipDuration
    )
    
    if (animationStarted) {
      // Start streaming animation frames
      setTimeout(() => {
        this.coinStreamService.streamAnimation(
          gameId,
          { broadcastToRoom: (roomId, message) => this.wsHandlers.broadcastToRoom(roomId, message) },
          gameId
        )
      }, 100)
      
      // Complete flip after animation
      setTimeout(() => {
        this.completeFlip(gameId)
      }, this.config.flipDuration)
    } else {
      console.error('❌ Failed to start flip animation')
      // Fallback: complete immediately
      this.completeFlip(gameId)
    }
  }

  // Complete the flip and handle round result
  async completeFlip(gameId) {
    console.log('✅ Completing flip for game:', gameId)
    
    const gameState = this.activeGames.get(gameId)
    const roundData = this.gameRounds.get(gameId)
    
    if (!gameState || !roundData) return
    
    // Save round to database
    await this.saveRoundToDatabase(gameId, roundData)
    
    // Broadcast flip result
    this.wsHandlers.broadcastToRoom(gameId, {
      type: 'FLIP_RESULT',
      gameId,
      result: roundData.flipResult,
      roundWinner: roundData.winner,
      roundNumber: roundData.roundNumber,
      creatorChoice: roundData.creatorChoice,
      challengerChoice: roundData.challengerChoice,
      creatorWins: gameState.creatorWins,
      challengerWins: gameState.challengerWins
    })
    
    // Check if game is complete
    if (gameState.creatorWins >= 3 || gameState.challengerWins >= 3 || gameState.currentRound >= this.config.maxRounds) {
      await this.completeGame(gameId)
    } else {
      // Start next round
      await this.startNextRound(gameId)
    }
  }

  // Start next round
  async startNextRound(gameId) {
    console.log('🔄 Starting next round for game:', gameId)
    
    const gameState = this.activeGames.get(gameId)
    if (!gameState) return
    
    gameState.currentRound++
    gameState.phase = 'waiting_for_choices'
    gameState.currentTurn = null
    gameState.roundStartTime = Date.now()
    
    // Reset round data
    this.gameRounds.set(gameId, {
      roundNumber: gameState.currentRound,
      creatorChoice: null,
      challengerChoice: null,
      flipResult: null,
      winner: null
    })
    
    // Reset choices and power charges
    this.playerChoices.set(gameId, { creator: null, challenger: null })
    this.powerCharges.set(gameId, { creator: 0, challenger: 0 })
    
    // Broadcast new round
    this.wsHandlers.broadcastToRoom(gameId, {
      type: 'new_round_started',
      gameId,
      roundNumber: gameState.currentRound,
      creatorWins: gameState.creatorWins,
      challengerWins: gameState.challengerWins,
      timestamp: Date.now()
    })
    
    // Start round timer
    this.startRoundTimer(gameId)
  }

  // Complete the game
  async completeGame(gameId) {
    console.log('🏁 Completing game:', gameId)
    
    const gameState = this.activeGames.get(gameId)
    if (!gameState) return
    
    gameState.phase = 'completed'
    gameState.completedAt = Date.now()
    
    // Determine final winner
    const finalWinner = gameState.creatorWins > gameState.challengerWins 
      ? gameState.creator 
      : gameState.challenger
    
    // Update database
    await this.updateGameInDatabase(gameId, {
      status: 'completed',
      winner: finalWinner,
      creator_wins: gameState.creatorWins,
      challenger_wins: gameState.challengerWins,
      completed_at: new Date().toISOString()
    })
    
    // Broadcast game completion
    this.wsHandlers.broadcastToRoom(gameId, {
      type: 'GAME_COMPLETED',
      gameId,
      winner: finalWinner,
      creatorWins: gameState.creatorWins,
      challengerWins: gameState.challengerWins,
      timestamp: Date.now()
    })
    
    // Cleanup
    this.cleanupGame(gameId)
  }

  // Timer management
  startRoundTimer(gameId) {
    this.clearGameTimers(gameId)
    
    const timer = setTimeout(() => {
      console.log('⏰ Round timeout for game:', gameId)
      this.handleRoundTimeout(gameId)
    }, this.config.roundTimeout)
    
    this.gameTimers.set(gameId, { roundTimer: timer })
  }

  startPowerTimer(gameId) {
    const timers = this.gameTimers.get(gameId) || {}
    
    if (timers.powerTimer) {
      clearTimeout(timers.powerTimer)
    }
    
    const timer = setTimeout(() => {
      console.log('⏰ Power charge timeout for game:', gameId)
      this.handlePowerTimeout(gameId)
    }, this.config.powerChargeTimeout)
    
    timers.powerTimer = timer
    this.gameTimers.set(gameId, timers)
  }

  clearGameTimers(gameId) {
    const timers = this.gameTimers.get(gameId)
    if (timers) {
      if (timers.roundTimer) clearTimeout(timers.roundTimer)
      if (timers.powerTimer) clearTimeout(timers.powerTimer)
    }
    this.gameTimers.delete(gameId)
  }

  // Timeout handlers
  handleRoundTimeout(gameId) {
    console.log('⏰ Round timeout - auto-flipping for game:', gameId)
    
    const gameState = this.activeGames.get(gameId)
    const choices = this.playerChoices.get(gameId)
    
    if (!gameState || gameState.phase !== 'waiting_for_choices') return
    
    // Auto-assign random choices for players who haven't chosen
    if (!choices.creator) {
      choices.creator = Math.random() < 0.5 ? 'heads' : 'tails'
    }
    if (!choices.challenger) {
      choices.challenger = Math.random() < 0.5 ? 'heads' : 'tails'
    }
    
    // Start power phase with auto-assigned choices
    this.startPowerPhase(gameId)
  }

  handlePowerTimeout(gameId) {
    console.log('⏰ Power timeout - auto-charging for game:', gameId)
    
    const gameState = this.activeGames.get(gameId)
    if (!gameState || gameState.phase !== 'power_charging') return
    
    // Auto-assign random power level
    const autoPower = Math.floor(Math.random() * (this.config.maxPowerLevel - this.config.minPowerLevel + 1)) + this.config.minPowerLevel
    
    this.handlePowerChargeComplete(gameId, gameState.currentTurn, autoPower)
  }

  // Database operations
  async saveRoundToDatabase(gameId, roundData) {
    const db = this.dbService.getDatabase()
    
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO game_rounds (
          game_id, round_number, creator_choice, challenger_choice, 
          flip_result, round_winner, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          gameId,
          roundData.roundNumber,
          roundData.creatorChoice,
          roundData.challengerChoice,
          roundData.flipResult,
          roundData.winner,
          new Date().toISOString()
        ],
        function(err) {
          if (err) {
            console.error('❌ Error saving round:', err)
            reject(err)
          } else {
            console.log('✅ Round saved to database:', this.lastID)
            resolve(this.lastID)
          }
        }
      )
    })
  }

  async updateGameInDatabase(gameId, updates) {
    const db = this.dbService.getDatabase()
    
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ')
    const values = Object.values(updates)
    values.push(gameId)
    
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE games SET ${fields} WHERE id = ?`,
        values,
        function(err) {
          if (err) {
            console.error('❌ Error updating game:', err)
            reject(err)
          } else {
            console.log('✅ Game updated in database')
            resolve()
          }
        }
      )
    })
  }

  // Cleanup
  cleanupGame(gameId) {
    console.log('🧹 Cleaning up game:', gameId)
    
    this.clearGameTimers(gameId)
    this.activeGames.delete(gameId)
    this.powerCharges.delete(gameId)
    this.playerChoices.delete(gameId)
    this.gameRounds.delete(gameId)
    this.coinStreamService.cleanupGame(gameId)
  }

  // Get game state
  getGameState(gameId) {
    return this.activeGames.get(gameId)
  }

  // Get all active games
  getActiveGames() {
    return Array.from(this.activeGames.keys())
  }
}

module.exports = GameEngine
