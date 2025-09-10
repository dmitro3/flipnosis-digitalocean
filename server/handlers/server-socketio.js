const socketIO = require('socket.io')
const GameStateManager = require('./GameStateManager')

// ===== CLEAN SERVER ARCHITECTURE =====
// Single source of truth for all game state management
// Server handles ALL game logic - clients only send actions and render state

class GameServer {
  constructor() {
    this.gameStateManager = new GameStateManager()
    this.socketData = new Map() // socketId -> { address, gameId, roomId, role }
    this.userSockets = new Map() // address -> socketId
    this.gameRooms = new Map() // gameId -> Set of socketIds
    this.io = null
    this.dbService = null
  }

  // ===== INITIALIZATION =====
  initialize(server, dbService) {
    console.log('🚀 Initializing Clean Game Server...')
    
    this.dbService = dbService
    this.io = socketIO(server, {
      cors: { origin: true, credentials: true },
      transports: ['websocket', 'polling']
    })

    this.setupEventHandlers()
    console.log('✅ Clean Game Server initialized successfully')
    
    return this.io
  }

  // ===== EVENT HANDLERS SETUP =====
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('✅ New connection:', socket.id)

      // Room management
      socket.on('join_room', (data) => this.handleJoinRoom(socket, data))
      
      // Chat system (preserved)
      socket.on('chat_message', (data) => this.handleChatMessage(socket, data))
      
      // Offer system (preserved)
      socket.on('crypto_offer', (data) => this.handleCryptoOffer(socket, data))
      socket.on('accept_offer', (data) => this.handleAcceptOffer(socket, data))
      
      // Deposit system (preserved)
      socket.on('deposit_confirmed', (data) => this.handleDepositConfirmed(socket, data))
      
      // ===== NEW GAME ACTIONS =====
      socket.on('request_game_state', (data) => this.handleRequestGameState(socket, data))
      socket.on('player_choice', (data) => this.handlePlayerChoice(socket, data))
      socket.on('start_power_charge', (data) => this.handleStartPowerCharge(socket, data))
      socket.on('stop_power_charge', (data) => this.handleStopPowerCharge(socket, data))
      socket.on('execute_flip', (data) => this.handleExecuteFlip(socket, data))
      socket.on('spectate_game', (data) => this.handleSpectateGame(socket, data))
      
      // Disconnection
      socket.on('disconnect', () => this.handleDisconnect(socket))
    })
  }

  // ===== ROOM MANAGEMENT =====
  async handleJoinRoom(socket, data) {
    const { roomId, address } = data
    console.log(`🏠 ${address} joining ${roomId}`)
    
    // Leave previous rooms
    socket.rooms.forEach(room => {
      if (room !== socket.id) socket.leave(room)
    })
    
    // Join new room
    socket.join(roomId)
    
    // Determine role (creator, challenger, or spectator)
    const gameId = roomId.replace('game_', '')
    const gameState = this.gameStateManager.getGame(gameId)
    let role = 'spectator'
    
    if (gameState) {
      if (address.toLowerCase() === gameState.creator?.toLowerCase()) {
        role = 'creator'
      } else if (address.toLowerCase() === gameState.challenger?.toLowerCase()) {
        role = 'challenger'
      } else {
        // Add as spectator
        this.gameStateManager.addSpectator(gameId, address)
      }
    }
    
    this.socketData.set(socket.id, { address, roomId, gameId, role })
    this.userSockets.set(address.toLowerCase(), socket.id)
    
    // Add to game room tracking
    if (!this.gameRooms.has(gameId)) {
      this.gameRooms.set(gameId, new Set())
    }
    this.gameRooms.get(gameId).add(socket.id)
    
    socket.emit('room_joined', { 
      roomId, 
      role,
      members: this.io.sockets.adapter.rooms.get(roomId)?.size || 0 
    })
    
    // Send current game state if it exists
    if (gameState) {
      const fullState = this.gameStateManager.getFullGameState(gameId)
      socket.emit('game_state_update', fullState)
      
      // Start state broadcasting if game is active
      if (gameState.phase === 'game_active' && !this.gameStateManager.stateUpdateIntervals.has(gameId)) {
        this.gameStateManager.startStateBroadcasting(gameId, (room, message) => {
          this.io.to(room).emit(message.type, message)
        })
      }
    }
    
    // Send chat history if exists (preserved)
    if (this.dbService && typeof this.dbService.getChatHistory === 'function') {
      try {
        const messages = await this.dbService.getChatHistory(roomId, 50)
        socket.emit('chat_history', { roomId, messages })
        console.log(`📚 Sent ${messages.length} chat messages to ${address}`)
      } catch (error) {
        console.error('❌ Error loading chat history:', error)
      }
    }
  }

  // ===== GAME STATE MANAGEMENT =====
  async handleRequestGameState(socket, data) {
    const { gameId } = data
    console.log(`📊 Game state requested for ${gameId}`)
    
    let gameState = this.gameStateManager.getGame(gameId)
    
    if (!gameState) {
      // Try to load from database and restore
      const gameData = await this.dbService.getGame(gameId)
      if (gameData && gameData.status === 'active') {
        gameState = this.initializeGameState(gameId, gameData)
        this.gameStateManager.createGame(gameId, gameState)
        
        // Start state broadcasting
        this.gameStateManager.startStateBroadcasting(gameId, (room, message) => {
          this.io.to(room).emit(message.type, message)
        })
      }
    }
    
    if (gameState) {
      const fullState = this.gameStateManager.getFullGameState(gameId)
      socket.emit('game_state_update', fullState)
    } else {
      socket.emit('game_not_found', { gameId })
    }
  }

  // ===== PLAYER ACTIONS =====
  async handlePlayerChoice(socket, data) {
    const { gameId, address, choice } = data
    console.log(`🎯 Player choice: ${address} chose ${choice} in game ${gameId}`)
    
    const gameState = this.gameStateManager.getGame(gameId)
    if (!gameState) {
      socket.emit('error', { message: 'Game not found' })
      return
    }
    
    // Validate it's the player's turn
    if (gameState.currentTurn?.toLowerCase() !== address.toLowerCase()) {
      socket.emit('error', { message: 'Not your turn' })
      return
    }
    
    // Set the choice
    this.gameStateManager.setPlayerChoice(gameId, address, choice)
    
    // Broadcast updated state
    const fullState = this.gameStateManager.getFullGameState(gameId)
    this.io.to(`game_${gameId}`).emit('game_state_update', fullState)
  }

  async handleStartPowerCharge(socket, data) {
    const { gameId, address } = data
    console.log(`⚡ Starting power charge: ${address} in game ${gameId}`)
    
    const gameState = this.gameStateManager.getGame(gameId)
    if (!gameState) {
      socket.emit('error', { message: 'Game not found' })
      return
    }
    
    // Validate player has made a choice
    const isCreator = address.toLowerCase() === gameState.creator?.toLowerCase()
    const hasChoice = isCreator ? gameState.creatorChoice : gameState.challengerChoice
    if (!hasChoice) {
      socket.emit('error', { message: 'Must choose heads or tails first' })
      return
    }
    
    // Start power charging
    this.gameStateManager.startPowerCharging(gameId, address)
    
    // State will be broadcast automatically via the update interval
  }

  async handleStopPowerCharge(socket, data) {
    const { gameId, address } = data
    console.log(`⚡ Stopping power charge: ${address} in game ${gameId}`)
    
    const gameState = this.gameStateManager.getGame(gameId)
    if (!gameState) {
      socket.emit('error', { message: 'Game not found' })
      return
    }
    
    // Stop power charging
    this.gameStateManager.stopPowerCharging(gameId, address)
    
    // Check if both players are ready (have choice and power)
    const isCreator = address.toLowerCase() === gameState.creator?.toLowerCase()
    
    if (isCreator) {
      // Creator is ready, switch to challenger's turn
      gameState.currentTurn = gameState.challenger
      gameState.gamePhase = 'waiting_choice'
    } else {
      // Challenger is ready, both players have acted - execute flip
      this.handleExecuteFlip(socket, { gameId })
    }
    
    // Broadcast updated state
    const fullState = this.gameStateManager.getFullGameState(gameId)
    this.io.to(`game_${gameId}`).emit('game_state_update', fullState)
  }

  async handleExecuteFlip(socket, data) {
    const { gameId } = data
    console.log(`🎲 Executing flip for game ${gameId}`)
    
    const gameState = this.gameStateManager.executeFlip(gameId)
    if (!gameState) {
      socket.emit('error', { message: 'Game not found' })
      return
    }
    
    // Broadcast flip execution with all details
    this.io.to(`game_${gameId}`).emit('flip_executing', {
      gameId,
      coinState: gameState.coinState,
      creatorChoice: gameState.creatorChoice,
      challengerChoice: gameState.challengerChoice,
      creatorPower: gameState.creatorFinalPower,
      challengerPower: gameState.challengerFinalPower
    })
    
    // State updates will continue via broadcast interval
  }

  async handleSpectateGame(socket, data) {
    const { gameId, address } = data
    console.log(`👁️ ${address} spectating game ${gameId}`)
    
    const gameState = this.gameStateManager.getGame(gameId)
    if (!gameState) {
      socket.emit('error', { message: 'Game not found' })
      return
    }
    
    // Add as spectator
    this.gameStateManager.addSpectator(gameId, address)
    
    // Send current state
    const fullState = this.gameStateManager.getFullGameState(gameId)
    socket.emit('game_state_update', fullState)
  }

  // ===== PRESERVED METHODS (Chat, Offers, Deposits) =====
  async handleChatMessage(socket, data) {
    const { roomId, message, address } = data
    console.log(`💬 Chat message from ${address} in ${roomId}: ${message}`)
    
    // Save to database
    if (this.dbService && typeof this.dbService.saveChatMessage === 'function') {
      try {
        await this.dbService.saveChatMessage(roomId, address, message)
      } catch (error) {
        console.error('❌ Error saving chat message:', error)
      }
    }
    
    // Broadcast to room
    this.io.to(roomId).emit('chat_message', {
      type: 'chat_message',
      message,
      from: address,
      timestamp: new Date().toISOString()
    })
  }

  async handleCryptoOffer(socket, data) {
    const { gameId, address, cryptoAmount, message } = data
    console.log(`💰 Crypto offer from ${address} for game ${gameId}: $${cryptoAmount}`)
    
    // Broadcast to room
    this.io.to(`game_${gameId}`).emit('crypto_offer', {
      type: 'crypto_offer',
      id: `${Date.now()}_${Math.random()}`,
      address,
      cryptoAmount,
      message,
      timestamp: new Date().toISOString()
    })
  }

  async handleAcceptOffer(socket, data) {
    const { gameId, address, offerId, cryptoAmount } = data
    console.log(`✅ Offer accepted by ${address} for game ${gameId}`)
    
    // Start deposit stage
    this.gameStateManager.startDepositStage(gameId, address, (roomId, message) => {
      this.io.to(roomId).emit(message.type, message)
    })
  }

  async handleDepositConfirmed(socket, data) {
    const { gameId, address, assetType } = data
    console.log(`💰 Deposit confirmed: ${address} deposited ${assetType} in game ${gameId}`)
    
    // Get current game data
    const gameData = await this.dbService.getGame(gameId)
    if (!gameData) {
      console.error('❌ Game not found:', gameId)
      return
    }
    
    // Update deposit status
    const isCreator = address.toLowerCase() === gameData.creator?.toLowerCase()
    if (isCreator) {
      gameData.creatorDeposited = true
    } else {
      gameData.challengerDeposited = true
    }
    
    // Check if both players have deposited
    const bothDeposited = gameData.creatorDeposited && gameData.challengerDeposited
    
    if (bothDeposited) {
      console.log(`🎮 Both players deposited in game ${gameId}, starting game!`)
      
      // Initialize game state with coin data from database
      const gameState = this.initializeGameState(gameId, gameData)
      this.gameStateManager.createGame(gameId, gameState)
      
      // Start state broadcasting
      this.gameStateManager.startStateBroadcasting(gameId, (room, message) => {
        this.io.to(room).emit(message.type, message)
      })
      
      // Notify all players that game is starting
      this.io.to(`game_${gameId}`).emit('game_started', {
        gameId,
        phase: 'game_active',
        message: 'Both deposits confirmed! Game starting...'
      })
      
      // Send initial state
      const fullState = this.gameStateManager.getFullGameState(gameId)
      this.io.to(`game_${gameId}`).emit('game_state_update', fullState)
      
    } else {
      // Just confirm the deposit
      this.io.to(`game_${gameId}`).emit('deposit_confirmed', {
        gameId,
        player: address,
        assetType,
        creatorDeposited: gameData.creatorDeposited,
        challengerDeposited: gameData.challengerDeposited,
        bothDeposited: false
      })
    }
  }

  // ===== HELPER METHODS =====
  initializeGameState(gameId, gameData) {
    // Parse coin data if needed
    let coinData = null
    try {
      coinData = gameData.coin_data ? 
        (typeof gameData.coin_data === 'string' ? JSON.parse(gameData.coin_data) : gameData.coin_data)
        : null
    } catch (e) {
      console.warn('Failed to parse coin_data:', e)
    }
    
    return {
      gameId,
      phase: 'game_active',
      status: 'active',
      currentRound: 1,
      totalRounds: 5,
      creatorScore: 0,
      challengerScore: 0,
      creator: gameData.creator,
      challenger: gameData.challenger || gameData.joiner,
      currentTurn: gameData.creator, // Creator always goes first
      coinData: coinData,
      createdAt: new Date().toISOString()
    }
  }

  // ===== DISCONNECTION =====
  handleDisconnect(socket) {
    console.log('❌ Disconnected:', socket.id)
    
    const data = this.socketData.get(socket.id)
    if (data) {
      // Remove as spectator if applicable
      if (data.gameId && data.role === 'spectator') {
        this.gameStateManager.removeSpectator(data.gameId, data.address)
      }
      
      this.userSockets.delete(data.address.toLowerCase())
      this.socketData.delete(socket.id)
      
      // Remove from game room tracking
      if (data.gameId) {
        const gameRoom = this.gameRooms.get(data.gameId)
        if (gameRoom) {
          gameRoom.delete(socket.id)
          if (gameRoom.size === 0) {
            // No one left in room, stop broadcasting
            this.gameStateManager.stopStateBroadcasting(data.gameId)
            this.gameRooms.delete(data.gameId)
          }
        }
      }
    }
  }
}

// ===== SINGLETON INSTANCE =====
const gameServer = new GameServer()

// ===== EXPORT FUNCTION =====
function initializeSocketIO(server, dbService) {
  return gameServer.initialize(server, dbService)
}

module.exports = { initializeSocketIO }