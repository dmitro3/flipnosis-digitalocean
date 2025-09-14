// GameStateManager.js - Complete Server-side Game State Machine
// Single source of truth for all game state management

class GameStateManager {
  constructor() {
    this.games = new Map() // gameId -> GameState
    this.timers = new Map() // gameId -> interval timers
    this.powerTimers = new Map() // gameId -> power charging timers
    this.stateUpdateIntervals = new Map() // gameId -> state broadcast intervals
  }

  // ===== GAME PHASES =====
  PHASES = {
    OFFER_STAGE: 'offer_stage',
    DEPOSIT_STAGE: 'deposit_stage', 
    GAME_ACTIVE: 'game_active',
    GAME_COMPLETE: 'game_complete',
    CANCELLED: 'cancelled'
  }

  // ===== GAME SUB-PHASES =====
  GAME_PHASES = {
    WAITING_CHOICE: 'waiting_choice',
    CHARGING_POWER: 'charging_power',
    EXECUTING_FLIP: 'executing_flip',
    SHOWING_RESULT: 'showing_result',
    ROUND_TRANSITION: 'round_transition'
  }

  // ===== GAME CREATION =====
  createGame(gameId, gameState) {
    // Validate required fields
    if (!gameId || !gameState) {
      console.error('❌ Invalid game creation parameters')
      return null
    }

    // Ensure game state has ALL required fields for server-authoritative gameplay
    const cleanGameState = {
      // Core identifiers
      gameId,
      phase: gameState.phase || this.PHASES.GAME_ACTIVE,
      gamePhase: this.GAME_PHASES.WAITING_CHOICE,
      status: gameState.status || 'active',
      
      // Round management
      currentRound: gameState.currentRound || 1,
      totalRounds: gameState.totalRounds || 5,
      creatorScore: gameState.creatorScore || 0,
      challengerScore: gameState.challengerScore || 0,
      
      // Players
      creator: gameState.creator,
      challenger: gameState.challenger,
      currentTurn: gameState.currentTurn || gameState.creator,
      
      // Player choices and power
      creatorChoice: null,
      challengerChoice: null,
      creatorPowerProgress: 0,
      challengerPowerProgress: 0,
      creatorFinalPower: 0,
      challengerFinalPower: 0,
      creatorCharging: false,
      challengerCharging: false,
      
      // Coin state for synchronized animation
      coinState: {
        rotation: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        isFlipping: false,
        flipStartTime: null,
        flipDuration: 3000,
        flipResult: null,
        totalRotations: 0,
        finalRotation: 0
      },
      
      // Timing
      actionDeadline: null,
      roundStartTime: Date.now(),
      turnStartTime: Date.now(),
      
      // Results
      flipResult: null,
      roundWinner: null,
      gameWinner: null,
      
      // Spectators
      spectators: [],
      
      // Metadata
      createdAt: gameState.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      // Coin customization (from lobby)
      coinData: gameState.coinData || null
    }

    this.games.set(gameId, cleanGameState)
    console.log(`🎮 Game created with full state: ${gameId}`)
    return cleanGameState
  }

  // ===== PLAYER ACTIONS =====
  setPlayerChoice(gameId, playerAddress, choice) {
    const game = this.games.get(gameId)
    if (!game) return false

    const isCreator = playerAddress.toLowerCase() === game.creator.toLowerCase()
    
    if (isCreator) {
      game.creatorChoice = choice
    } else {
      game.challengerChoice = choice
    }
    
    game.gamePhase = this.GAME_PHASES.CHARGING_POWER
    game.updatedAt = new Date().toISOString()
    
    console.log(`🎯 ${isCreator ? 'Creator' : 'Challenger'} chose ${choice}`)
    return true
  }

  startPowerCharging(gameId, playerAddress) {
    const game = this.games.get(gameId)
    if (!game) return false

    const isCreator = playerAddress.toLowerCase() === game.creator.toLowerCase()
    const startTime = Date.now()
    
    if (isCreator) {
      game.creatorCharging = true
      game.creatorPowerProgress = 0
      
      // Create power charging timer
      const powerTimer = setInterval(() => {
        if (!game.creatorCharging) {
          clearInterval(powerTimer)
          return
        }
        
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / 4500, 1) // 4.5 seconds to max
        game.creatorPowerProgress = progress * 100
        game.creatorFinalPower = Math.min(10, Math.max(1, 1 + (progress * 9)))
      }, 50)
      
      this.powerTimers.set(`${gameId}_creator`, powerTimer)
    } else {
      game.challengerCharging = true
      game.challengerPowerProgress = 0
      
      const powerTimer = setInterval(() => {
        if (!game.challengerCharging) {
          clearInterval(powerTimer)
          return
        }
        
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / 4500, 1)
        game.challengerPowerProgress = progress * 100
        game.challengerFinalPower = Math.min(10, Math.max(1, 1 + (progress * 9)))
      }, 50)
      
      this.powerTimers.set(`${gameId}_challenger`, powerTimer)
    }
    
    game.updatedAt = new Date().toISOString()
    console.log(`⚡ ${isCreator ? 'Creator' : 'Challenger'} started charging power`)
    return true
  }

  stopPowerCharging(gameId, playerAddress) {
    const game = this.games.get(gameId)
    if (!game) return false

    const isCreator = playerAddress.toLowerCase() === game.creator.toLowerCase()
    
    if (isCreator) {
      game.creatorCharging = false
      const timerKey = `${gameId}_creator`
      if (this.powerTimers.has(timerKey)) {
        clearInterval(this.powerTimers.get(timerKey))
        this.powerTimers.delete(timerKey)
      }
      console.log(`⚡ Creator stopped charging at power: ${game.creatorFinalPower}`)
    } else {
      game.challengerCharging = false
      const timerKey = `${gameId}_challenger`
      if (this.powerTimers.has(timerKey)) {
        clearInterval(this.powerTimers.get(timerKey))
        this.powerTimers.delete(timerKey)
      }
      console.log(`⚡ Challenger stopped charging at power: ${game.challengerFinalPower}`)
    }
    
    game.updatedAt = new Date().toISOString()
    return true
  }

  // ===== FLIP EXECUTION =====
  executeFlip(gameId) {
    const game = this.games.get(gameId)
    if (!game) return null

    console.log(`🎲 Executing flip for game ${gameId}`)
    
    // Set final choices if not set
    if (!game.creatorChoice) game.creatorChoice = 'heads'
    if (!game.challengerChoice) game.challengerChoice = game.creatorChoice === 'heads' ? 'tails' : 'heads'
    
    // Generate flip result
    const flipResult = Math.random() < 0.5 ? 'heads' : 'tails'
    
    // Calculate flip animation parameters
    const baseRotations = 3 + Math.floor(Math.random() * 3) // 3-5 rotations
    const totalRotations = baseRotations * 2 * Math.PI
    const finalRotation = flipResult === 'heads' ? 0 : Math.PI
    
    // Update coin state for animation
    game.coinState = {
      rotation: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: totalRotations / 3, z: 0 }, // Velocity for 3 second animation
      isFlipping: true,
      flipStartTime: Date.now(),
      flipDuration: 3000,
      flipResult: flipResult,
      totalRotations: totalRotations,
      finalRotation: finalRotation
    }
    
    game.gamePhase = this.GAME_PHASES.EXECUTING_FLIP
    game.flipResult = flipResult
    
    // Determine winner
    const creatorWon = game.creatorChoice === flipResult
    const challengerWon = game.challengerChoice === flipResult
    
    if (creatorWon) {
      game.creatorScore++
      game.roundWinner = game.creator
    } else if (challengerWon) {
      game.challengerScore++
      game.roundWinner = game.challenger
    } else {
      game.roundWinner = null // Tie (shouldn't happen)
    }
    
    console.log(`🎯 Flip result: ${flipResult}, Winner: ${game.roundWinner}`)
    
    // Schedule result phase
    setTimeout(() => {
      this.showResult(gameId)
    }, 3000)
    
    game.updatedAt = new Date().toISOString()
    return game
  }

  showResult(gameId) {
    const game = this.games.get(gameId)
    if (!game) return

    game.gamePhase = this.GAME_PHASES.SHOWING_RESULT
    game.coinState.isFlipping = false
    
    // Check for game completion
    if (game.creatorScore >= 3 || game.challengerScore >= 3 || game.currentRound >= game.totalRounds) {
      game.phase = this.PHASES.GAME_COMPLETE
      game.gameWinner = game.creatorScore > game.challengerScore ? game.creator : game.challenger
      console.log(`🏆 Game complete! Winner: ${game.gameWinner}`)
    } else {
      // Schedule next round
      setTimeout(() => {
        this.startNextRound(gameId)
      }, 3000)
    }
    
    game.updatedAt = new Date().toISOString()
  }

  startNextRound(gameId) {
    const game = this.games.get(gameId)
    if (!game) return

    game.currentRound++
    game.gamePhase = this.GAME_PHASES.WAITING_CHOICE
    
    // Reset round state
    game.creatorChoice = null
    game.challengerChoice = null
    game.creatorPowerProgress = 0
    game.challengerPowerProgress = 0
    game.creatorFinalPower = 0
    game.challengerFinalPower = 0
    game.creatorCharging = false
    game.challengerCharging = false
    game.flipResult = null
    game.roundWinner = null
    
    // Reset coin state
    game.coinState = {
      rotation: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      isFlipping: false,
      flipStartTime: null,
      flipDuration: 3000,
      flipResult: null,
      totalRotations: 0,
      finalRotation: 0
    }
    
    // Switch turns
    game.currentTurn = game.currentTurn === game.creator ? game.challenger : game.creator
    game.turnStartTime = Date.now()
    game.roundStartTime = Date.now()
    
    console.log(`🔄 Starting round ${game.currentRound}, ${game.currentTurn}'s turn`)
    game.updatedAt = new Date().toISOString()
  }

  // ===== STATE BROADCASTING =====
  startStateBroadcasting(gameId, broadcastFn) {
    // Clear any existing interval
    this.stopStateBroadcasting(gameId)
    
    // Broadcast state every 50ms for smooth animations
    const interval = setInterval(() => {
      const game = this.games.get(gameId)
      if (!game) {
        this.stopStateBroadcasting(gameId)
        return
      }
      
      // Only broadcast during active game phases
      if (game.phase === this.PHASES.GAME_ACTIVE) {
        const state = this.getFullGameState(gameId)
        if (state) {
          broadcastFn(`game_${gameId}`, {
            type: 'game_state_update',
            ...state
          })
        }
      }
    }, 50)
    
    this.stateUpdateIntervals.set(gameId, interval)
    console.log(`📡 Started state broadcasting for game ${gameId}`)
  }

  stopStateBroadcasting(gameId) {
    if (this.stateUpdateIntervals.has(gameId)) {
      clearInterval(this.stateUpdateIntervals.get(gameId))
      this.stateUpdateIntervals.delete(gameId)
      console.log(`📡 Stopped state broadcasting for game ${gameId}`)
    }
  }

  // ===== STATE QUERIES =====
  getFullGameState(gameId) {
    const game = this.games.get(gameId)
    if (!game) return null

    // Return complete state for client rendering
    return {
      // Core game info
      gameId: game.gameId,
      phase: game.phase,
      gamePhase: game.gamePhase,
      status: game.status,
      
      // Players
      creator: game.creator,
      challenger: game.challenger,
      currentTurn: game.currentTurn,
      
      // Round info
      currentRound: game.currentRound,
      totalRounds: game.totalRounds,
      creatorScore: game.creatorScore,
      challengerScore: game.challengerScore,
      
      // Current choices and power
      creatorChoice: game.creatorChoice,
      challengerChoice: game.challengerChoice,
      creatorPowerProgress: game.creatorPowerProgress,
      challengerPowerProgress: game.challengerPowerProgress,
      creatorFinalPower: game.creatorFinalPower,
      challengerFinalPower: game.challengerFinalPower,
      creatorCharging: game.creatorCharging,
      challengerCharging: game.challengerCharging,
      
      // Coin state
      coinState: game.coinState,
      
      // Results
      flipResult: game.flipResult,
      roundWinner: game.roundWinner,
      gameWinner: game.gameWinner,
      
      // Timing
      turnStartTime: game.turnStartTime,
      roundStartTime: game.roundStartTime,
      
      // Spectators
      spectators: game.spectators,
      
      // Coin customization
      coinData: game.coinData,
      
      // Metadata
      updatedAt: game.updatedAt
    }
  }

  addSpectator(gameId, address) {
    const game = this.games.get(gameId)
    if (!game) return false
    
    if (!game.spectators.includes(address)) {
      game.spectators.push(address)
      console.log(`👁️ Spectator joined: ${address}`)
    }
    return true
  }

  removeSpectator(gameId, address) {
    const game = this.games.get(gameId)
    if (!game) return false
    
    game.spectators = game.spectators.filter(s => s !== address)
    console.log(`👁️ Spectator left: ${address}`)
    return true
  }

  // ===== GAME STATE MANAGEMENT =====
  getGame(gameId) {
    return this.games.get(gameId)
  }

  updateGame(gameId, updates) {
    const game = this.games.get(gameId)
    if (!game) return false
    
    Object.assign(game, updates, { updatedAt: new Date().toISOString() })
    return true
  }

  deleteGame(gameId) {
    // Clear any timers
    if (this.timers.has(gameId)) {
      clearInterval(this.timers.get(gameId))
      this.timers.delete(gameId)
    }
    
    // Clear power timers
    this.powerTimers.forEach((timer, key) => {
      if (key.startsWith(gameId)) {
        clearInterval(timer)
        this.powerTimers.delete(key)
      }
    })
    
    // Clear broadcast interval
    this.stopStateBroadcasting(gameId)

    // Remove game state
    const deleted = this.games.delete(gameId)
    if (deleted) {
      console.log(`🗑️ Game deleted: ${gameId}`)
    }
    return deleted
  }

  // ===== DEPOSIT STAGE MANAGEMENT =====
  startDepositStage(gameId, challenger, broadcastFn, cryptoAmount = null) {
    const game = this.games.get(gameId)
    if (!game) {
      console.error(`❌ Game not found: ${gameId}`)
      return false
    }
    
    // Update game state
    game.phase = this.PHASES.DEPOSIT_STAGE
    game.challenger = challenger
    game.depositStartTime = Date.now()
    game.depositTimeRemaining = 120
    game.cryptoAmount = cryptoAmount
    game.updatedAt = new Date().toISOString()
    
    console.log(`⏱️ Starting deposit stage for game ${gameId}`)
    
    // Broadcast initial deposit stage
    const initialMessage = {
      type: 'deposit_stage_started',
      gameId: gameId,
      phase: game.phase,
      creator: game.creator,
      challenger: game.challenger,
      timeRemaining: game.depositTimeRemaining,
      depositStartTime: game.depositStartTime,
      creatorDeposited: game.creatorDeposited || false,
      challengerDeposited: false,
      cryptoAmount: game.cryptoAmount
    }
    
    // Broadcast to room
    broadcastFn(`game_${gameId}`, initialMessage)
    
    // Start countdown timer
    const timer = setInterval(() => {
      game.depositTimeRemaining--
      
      // Broadcast countdown update
      const countdownMessage = {
        type: 'deposit_countdown',
        gameId: gameId,
        timeRemaining: game.depositTimeRemaining,
        creatorDeposited: game.creatorDeposited || false,
        challengerDeposited: game.challengerDeposited || false,
        cryptoAmount: game.cryptoAmount
      }
      
      broadcastFn(`game_${gameId}`, countdownMessage)
      
      // Handle timeout
      if (game.depositTimeRemaining <= 0) {
        this.handleDepositTimeout(gameId, broadcastFn)
      }
    }, 1000)
    
    this.timers.set(gameId, timer)
    return true
  }

  handleDepositTimeout(gameId, broadcastFn) {
    const game = this.games.get(gameId)
    if (!game) return

    console.log(`⏰ Deposit timeout for game ${gameId}`)
    
    // Clear timer
    if (this.timers.has(gameId)) {
      clearInterval(this.timers.get(gameId))
      this.timers.delete(gameId)
    }
    
    // Update game state
    game.phase = this.PHASES.CANCELLED
    game.updatedAt = new Date().toISOString()
    
    // Broadcast timeout
    const timeoutMessage = {
      type: 'deposit_timeout',
      gameId: gameId,
      phase: game.phase,
      message: 'Deposit time expired. Game cancelled.'
    }
    
    broadcastFn(`game_${gameId}`, timeoutMessage)
  }

  // ===== GAME STATE QUERIES =====
  getAllGames() {
    return Array.from(this.games.values())
  }

  getGamesByStatus(status) {
    return this.getAllGames().filter(game => game.status === status)
  }

  getGamesByPhase(phase) {
    return this.getAllGames().filter(game => game.phase === phase)
  }

  getActiveGames() {
    return this.getGamesByStatus('active')
  }

  // ===== UTILITY FUNCTIONS =====
  isGameActive(gameId) {
    const game = this.games.get(gameId)
    return game && game.status === 'active'
  }

  isGameComplete(gameId) {
    const game = this.games.get(gameId)
    return game && game.phase === this.PHASES.GAME_COMPLETE
  }

  getGamePhase(gameId) {
    const game = this.games.get(gameId)
    return game ? game.phase : null
  }

  getCurrentTurn(gameId) {
    const game = this.games.get(gameId)
    return game ? game.currentTurn : null
  }

  // ===== CLEANUP =====
  cleanup() {
    console.log('🧹 Cleaning up GameStateManager...')
    
    // Clear all timers
    this.timers.forEach((timer, gameId) => {
      clearInterval(timer)
      console.log(`⏰ Cleared timer for game ${gameId}`)
    })
    this.timers.clear()
    
    // Clear power timers
    this.powerTimers.forEach((timer, key) => {
      clearInterval(timer)
      console.log(`⚡ Cleared power timer: ${key}`)
    })
    this.powerTimers.clear()
    
    // Clear broadcast intervals
    this.stateUpdateIntervals.forEach((interval, gameId) => {
      clearInterval(interval)
      console.log(`📡 Cleared broadcast interval for game ${gameId}`)
    })
    this.stateUpdateIntervals.clear()
    
    // Clear all games
    const gameCount = this.games.size
    this.games.clear()
    
    console.log(`✅ Cleanup complete. Removed ${gameCount} games.`)
  }

  // ===== DEBUGGING =====
  getDebugInfo() {
    return {
      totalGames: this.games.size,
      totalTimers: this.timers.size,
      totalPowerTimers: this.powerTimers.size,
      totalBroadcastIntervals: this.stateUpdateIntervals.size,
      games: Array.from(this.games.entries()).map(([id, game]) => ({
        id,
        phase: game.phase,
        gamePhase: game.gamePhase,
        status: game.status,
        currentRound: game.currentRound,
        currentTurn: game.currentTurn,
        creatorScore: game.creatorScore,
        challengerScore: game.challengerScore
      }))
    }
  }
}

module.exports = GameStateManager