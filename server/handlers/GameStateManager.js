// GameStateManager.js - Clean Server-side Game State Machine
// Single source of truth for all game state management
// Aligned with database schema from database-master.txt

class GameStateManager {
  constructor() {
    this.games = new Map() // gameId -> GameState
    this.timers = new Map() // gameId -> interval timers
  }

  // ===== GAME PHASES =====
  PHASES = {
    OFFER_STAGE: 'offer_stage',
    DEPOSIT_STAGE: 'deposit_stage', 
    GAME_ACTIVE: 'game_active',
    GAME_COMPLETE: 'game_complete',
    CANCELLED: 'cancelled'
  }

  // ===== GAME CREATION =====
  createGame(gameId, gameState) {
    // Validate required fields
    if (!gameId || !gameState) {
      console.error('❌ Invalid game creation parameters')
      return null
    }

    // Ensure game state has required fields
    const cleanGameState = {
      gameId,
      phase: gameState.phase || 'choosing',
      status: gameState.status || 'active',
      currentRound: gameState.currentRound || 1,
      totalRounds: gameState.totalRounds || 5,
      creatorScore: gameState.creatorScore || 0,
      challengerScore: gameState.challengerScore || 0,
      creator: gameState.creator,
      challenger: gameState.challenger,
      currentTurn: gameState.currentTurn || gameState.creator,
      creatorChoice: gameState.creatorChoice || null,
      challengerChoice: gameState.challengerChoice || null,
      creatorPower: gameState.creatorPower || 0,
      challengerPower: gameState.challengerPower || 0,
      flipResult: gameState.flipResult || null,
      roundWinner: gameState.roundWinner || null,
      gameWinner: gameState.gameWinner || null,
      createdAt: gameState.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.games.set(gameId, cleanGameState)
    console.log(`🎮 Game created: ${gameId}`)
    return cleanGameState
  }

  // ===== GAME STATE MANAGEMENT =====
  getGame(gameId) {
    return this.games.get(gameId)
  }

  updateGame(gameId, gameState) {
    if (!this.games.has(gameId)) {
      console.error(`❌ Game not found for update: ${gameId}`)
      return false
    }

    // Update timestamp
    gameState.updatedAt = new Date().toISOString()
    
    this.games.set(gameId, gameState)
    console.log(`🔄 Game updated: ${gameId}`)
    return true
  }

  deleteGame(gameId) {
    // Clear any timers
    if (this.timers.has(gameId)) {
      clearInterval(this.timers.get(gameId))
      this.timers.delete(gameId)
    }

    // Remove game state
    const deleted = this.games.delete(gameId)
    if (deleted) {
      console.log(`🗑️ Game deleted: ${gameId}`)
    }
    return deleted
  }

  // ===== DEPOSIT STAGE MANAGEMENT =====
  startDepositStage(gameId, challenger, broadcastFn) {
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
      challengerDeposited: false
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
        challengerDeposited: game.challengerDeposited || false
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
    
    // Clear all games
    const gameCount = this.games.size
    this.games.clear()
    
    console.log(`✅ Cleanup complete. Removed ${gameCount} games and ${this.timers.size} timers.`)
  }

  // ===== DEBUGGING =====
  getDebugInfo() {
    return {
      totalGames: this.games.size,
      totalTimers: this.timers.size,
      games: Array.from(this.games.entries()).map(([id, game]) => ({
        id,
        phase: game.phase,
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