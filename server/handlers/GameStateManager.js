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
      actionDeadline: gameState.phase === this.PHASES.GAME_ACTIVE ? Date.now() + 20000 : null, // 20 second timer for first choice
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
    
    // Start the first turn timer if game is active
    if (cleanGameState.phase === this.PHASES.GAME_ACTIVE && cleanGameState.gamePhase === this.GAME_PHASES.WAITING_CHOICE) {
      this.startTurnTimer(gameId, 20000, () => {
        // Auto-choose heads for the player if they don't respond
        this.autoMakeChoice(gameId, cleanGameState.currentTurn)
      })
    }
    
    return cleanGameState
  }

  // ===== PLAYER ACTIONS =====
  setPlayerChoice(gameId, playerAddress, choice) {
    const game = this.games.get(gameId)
    if (!game) return false

    // Verify it's actually this player's turn
    if (game.currentTurn?.toLowerCase() !== playerAddress.toLowerCase()) {
      console.log(`❌ Not ${playerAddress}'s turn (current turn: ${game.currentTurn})`)
      return false
    }

    const isCreator = playerAddress.toLowerCase() === game.creator.toLowerCase()
    
    // Set the active player's choice
    if (isCreator) {
      game.creatorChoice = choice
      // Auto-assign opposite to challenger
      game.challengerChoice = choice === 'heads' ? 'tails' : 'heads'
    } else {
      game.challengerChoice = choice
      // Auto-assign opposite to creator
      game.creatorChoice = choice === 'heads' ? 'tails' : 'heads'
    }
    
    // Clear any existing turn timer since player made their choice
    this.clearTurnTimer(gameId)
    
    game.gamePhase = this.GAME_PHASES.CHARGING_POWER
    game.actionDeadline = Date.now() + 20000 // 20 seconds to charge power
    game.updatedAt = new Date().toISOString()
    
    console.log(`🎯 ${isCreator ? 'Creator' : 'Challenger'} chose ${choice}`)
    console.log(`🎯 Auto-assigned ${isCreator ? game.challengerChoice : game.creatorChoice} to ${isCreator ? 'challenger' : 'creator'}`)
    
    // Start power charging timer
    this.startTurnTimer(gameId, 20000, () => {
      // Auto-complete power charging with minimal power if player doesn't act
      this.autoCompletePowerCharging(gameId, playerAddress)
    })
    
    return true
  }

  startPowerCharging(gameId, playerAddress) {
    const game = this.games.get(gameId)
    if (!game) return false

    // Only allow the current turn player to charge power
    if (game.currentTurn?.toLowerCase() !== playerAddress.toLowerCase()) {
      console.log(`❌ Not ${playerAddress}'s turn to charge power`)
      return false
    }

    const isCreator = playerAddress.toLowerCase() === game.creator.toLowerCase()
    const startTime = Date.now()
    
    if (isCreator) {
      game.creatorCharging = true
      game.creatorPowerProgress = 0
      
      // Create power charging timer - smooth 0.1 increments
      const powerTimer = setInterval(() => {
        if (!game.creatorCharging) {
          clearInterval(powerTimer)
          return
        }
        
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / 3000, 1) // 3 seconds to max
        game.creatorPowerProgress = progress * 100
        
        // Calculate power in 0.1 increments: 1.0, 1.1, 1.2, ..., 10.0
        const rawPower = 1 + (progress * 9) // 1.0 to 10.0
        game.creatorFinalPower = Math.round(rawPower * 10) / 10 // Round to 0.1 increments
        
        // Ensure bounds
        game.creatorFinalPower = Math.min(10.0, Math.max(1.0, game.creatorFinalPower))
      }, 16) // 60fps updates for smooth animation
      
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
        const progress = Math.min(elapsed / 3000, 1) // 3 seconds to max
        game.challengerPowerProgress = progress * 100
        
        // Calculate power in 0.1 increments: 1.0, 1.1, 1.2, ..., 10.0
        const rawPower = 1 + (progress * 9) // 1.0 to 10.0
        game.challengerFinalPower = Math.round(rawPower * 10) / 10 // Round to 0.1 increments
        
        // Ensure bounds
        game.challengerFinalPower = Math.min(10.0, Math.max(1.0, game.challengerFinalPower))
      }, 16) // 60fps updates for smooth animation
      
      this.powerTimers.set(`${gameId}_challenger`, powerTimer)
    }
    
    game.updatedAt = new Date().toISOString()
    console.log(`⚡ ${isCreator ? 'Creator' : 'Challenger'} started charging power`)
    return true
  }

  stopPowerCharging(gameId, playerAddress) {
    const game = this.games.get(gameId)
    if (!game) return false

    // Only allow the current turn player to stop charging
    if (game.currentTurn?.toLowerCase() !== playerAddress.toLowerCase()) {
      console.log(`❌ Not ${playerAddress}'s turn to stop charging`)
      return false
    }

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
    
    // Since this is turn-based, immediately execute the flip when current player finishes
    console.log(`🎲 Current player finished charging power - executing flip immediately`)
    
    // Clear any remaining turn timer
    this.clearTurnTimer(gameId)
    
    game.updatedAt = new Date().toISOString()
    
    // Return special flag to indicate flip should execute
    return { shouldFlip: true }
  }

  // ===== FLIP EXECUTION =====
  executeFlip(gameId) {
    const game = this.games.get(gameId)
    if (!game) return null

    console.log(`🎲 Executing flip for game ${gameId}`)
    
    // Set final choices if not set
    if (!game.creatorChoice) game.creatorChoice = 'heads'
    if (!game.challengerChoice) game.challengerChoice = game.creatorChoice === 'heads' ? 'tails' : 'heads'
    
    // Generate flip result - ALWAYS RANDOM regardless of power
    const flipResult = Math.random() < 0.5 ? 'heads' : 'tails'
    
    // Calculate flip duration based on current player's power level
    const isCreatorTurn = game.currentTurn?.toLowerCase() === game.creator?.toLowerCase()
    const playerPower = isCreatorTurn ? game.creatorFinalPower : game.challengerFinalPower
    
    // Power determines flip duration: 1.0 = 1 second, 10.0 = 10 seconds
    // This creates strategic depth - higher power = longer flip = more suspense
    const flipDuration = Math.max(1000, Math.min(10000, playerPower * 1000))
    
    // Calculate animation parameters based on duration
    // More power = more rotations for longer flip
    const rotationsPerSecond = 2 // Base rotation speed
    const totalRotations = (flipDuration / 1000) * rotationsPerSecond * 2 * Math.PI
    const finalRotation = flipResult === 'heads' ? 0 : Math.PI
    
    console.log(`⚡ Flip power: ${playerPower.toFixed(1)}, Duration: ${flipDuration}ms, Rotations: ${(totalRotations / (2 * Math.PI)).toFixed(1)}`)
    
    // Update coin state for animation
    game.coinState = {
      rotation: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: totalRotations / (flipDuration / 1000), z: 0 },
      isFlipping: true,
      flipStartTime: Date.now(),
      flipDuration: flipDuration,
      flipResult: flipResult,
      totalRotations: totalRotations,
      finalRotation: finalRotation,
      powerUsed: playerPower // Track power used for this flip
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
    
    console.log(`🎯 Flip result: ${flipResult}, Winner: ${game.roundWinner}, Power used: ${playerPower.toFixed(1)}`)
    
    // Schedule result phase based on actual flip duration
    setTimeout(() => {
      this.showResult(gameId)
    }, flipDuration)
    
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
    game.actionDeadline = Date.now() + 20000 // 20 seconds for next choice
    
    console.log(`🔄 Starting round ${game.currentRound}, ${game.currentTurn}'s turn`)
    
    // Start timer for the new round
    this.startTurnTimer(gameId, 20000, () => {
      this.autoMakeChoice(gameId, game.currentTurn)
    })
    
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
    // Clear any timers (including turn timers)
    this.timers.forEach((timer, key) => {
      if (key.startsWith(gameId)) {
        if (key.includes('_turn')) {
          clearTimeout(timer)
        } else {
          clearInterval(timer)
        }
        this.timers.delete(key)
      }
    })
    
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
    
    // Update game state (no timer - handled by ServerSocketIO)
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
    
    // No timer here - ServerSocketIO handles the countdown
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

  // ===== TURN TIMER MANAGEMENT =====
  startTurnTimer(gameId, duration, onTimeout) {
    // Clear any existing timer
    this.clearTurnTimer(gameId)
    
    console.log(`⏰ Starting turn timer for game ${gameId}: ${duration}ms`)
    
    const timer = setTimeout(() => {
      console.log(`⏰ Turn timer expired for game ${gameId}`)
      if (onTimeout) {
        onTimeout()
      }
    }, duration)
    
    this.timers.set(`${gameId}_turn`, timer)
  }
  
  clearTurnTimer(gameId) {
    const timerKey = `${gameId}_turn`
    if (this.timers.has(timerKey)) {
      clearTimeout(this.timers.get(timerKey))
      this.timers.delete(timerKey)
      console.log(`⏰ Cleared turn timer for game ${gameId}`)
    }
  }
  
  // ===== AUTO-COMPLETION METHODS =====
  autoMakeChoice(gameId, playerAddress) {
    const game = this.games.get(gameId)
    if (!game) return
    
    console.log(`🤖 Auto-making choice for ${playerAddress} in game ${gameId}`)
    
    // Default to heads
    const defaultChoice = 'heads'
    this.setPlayerChoice(gameId, playerAddress, defaultChoice)
    
    // Auto-start power charging with minimal power
    setTimeout(() => {
      this.autoCompletePowerCharging(gameId, playerAddress)
    }, 1000) // Give 1 second for the choice to register
  }
  
  autoCompletePowerCharging(gameId, playerAddress) {
    const game = this.games.get(gameId)
    if (!game) return
    
    console.log(`🤖 Auto-completing power charging for ${playerAddress} in game ${gameId}`)
    
    const isCreator = playerAddress.toLowerCase() === game.creator.toLowerCase()
    
    // Set minimal power (1.5 out of 10)
    if (isCreator) {
      game.creatorFinalPower = 1.5
      game.creatorCharging = false
      game.creatorPowerProgress = 15
    } else {
      game.challengerFinalPower = 1.5
      game.challengerCharging = false
      game.challengerPowerProgress = 15
    }
    
    // In turn-based mode, immediately execute flip when current player finishes
    console.log(`🎲 Auto-completing power charge - executing flip for turn-based game`)
    this.executeFlip(gameId)
    
    game.updatedAt = new Date().toISOString()
  }

  // ===== CLEANUP =====
  cleanup() {
    console.log('🧹 Cleaning up GameStateManager...')
    
    // Clear all timers (includes both interval and timeout timers)
    this.timers.forEach((timer, key) => {
      if (key.includes('_turn')) {
        clearTimeout(timer)
        console.log(`⏰ Cleared turn timeout for ${key}`)
      } else {
        clearInterval(timer)
        console.log(`⏰ Cleared interval timer for ${key}`)
      }
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