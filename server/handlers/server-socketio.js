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
      cors: { 
        origin: ['https://flipnosis.fun', 'https://www.flipnosis.fun', 'http://localhost:3000', 'http://localhost:5173'],
        credentials: true 
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true
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
    const gameId = roomId // Keep the full game ID including 'game_' prefix
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
    console.log(`🔍 handleRequestGameState called with data:`, data)
    console.log(`🔍 Socket ID: ${socket.id}`)
    
    if (!data) {
      console.error('❌ No data provided to handleRequestGameState')
      socket.emit('game_not_found', { error: 'No data provided' })
      return
    }
    
    const { gameId } = data
    console.log(`📊 Game state requested for ${gameId}`)
    
    if (!gameId) {
      console.error('❌ No gameId provided to handleRequestGameState')
      socket.emit('game_not_found', { error: 'No gameId provided' })
      return
    }
    
    try {
      let gameState = this.gameStateManager.getGame(gameId)
      console.log(`🔍 GameStateManager lookup result:`, gameState ? 'found' : 'not found')
      
      if (!gameState) {
        // Try to load from database and restore
        console.log(`🔍 Attempting database lookup for game: ${gameId}`)
        const gameData = await this.dbService.getGame(gameId)
        console.log(`🔍 Database lookup result:`, gameData ? 'found' : 'not found')
        if (gameData) {
          console.log(`🔍 Game data from DB:`, { id: gameData.id, status: gameData.status, creator: gameData.creator })
        }
        if (gameData && (gameData.status === 'active' || gameData.status === 'awaiting_deposit' || gameData.status === 'awaiting_challenger')) {
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
        console.log(`📤 Sending game_state_update to socket ${socket.id}:`, fullState ? 'state found' : 'no state')
        socket.emit('game_state_update', fullState)
      } else {
        console.log(`📤 Sending game_not_found to socket ${socket.id} for gameId: ${gameId}`)
        socket.emit('game_not_found', { gameId })
      }
    } catch (error) {
      console.error('❌ Error in handleRequestGameState:', error)
      socket.emit('game_not_found', { gameId, error: error.message })
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
    const roomId = gameId.startsWith('game_') ? gameId : `game_${gameId}`
    this.io.to(roomId).emit('game_state_update', fullState)
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
    const roomId = gameId.startsWith('game_') ? gameId : `game_${gameId}`
    this.io.to(roomId).emit('game_state_update', fullState)
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
    const roomId = gameId.startsWith('game_') ? gameId : `game_${gameId}`
    this.io.to(roomId).emit('flip_executing', {
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
    
    // Save to database
    if (this.dbService && typeof this.dbService.createOffer === 'function') {
      try {
        // Get the game's listing_id from the database
        const game = await this.dbService.getGameById(gameId)
        if (!game) {
          console.error('❌ Game not found:', gameId)
          return
        }
        
        const offerId = `${gameId}_${address}_${Date.now()}`
        const offerData = {
          id: offerId,
          listing_id: game.listing_id, // Use the actual listing_id from the game
          offerer_address: address,
          offer_price: cryptoAmount,
          message: message || 'Crypto offer'
        }
        await this.dbService.createOffer(offerData)
        console.log(`💾 Saved offer to database: ${offerId} for listing: ${game.listing_id}`)
      } catch (error) {
        console.error('❌ Error saving offer to database:', error)
      }
    }
    
    // Broadcast to room
    const roomId = gameId.startsWith('game_') ? gameId : `game_${gameId}`
    this.io.to(roomId).emit('crypto_offer', {
      type: 'crypto_offer',
      id: `${Date.now()}_${Math.random()}`,
      address,
      cryptoAmount,
      message,
      timestamp: new Date().toISOString()
    })
  }

  async handleAcceptOffer(socket, data) {
    const { gameId, address, offerId, cryptoAmount, challengerAddress } = data
    console.log(`✅ Offer accepted by ${address} for game ${gameId}`)
    
    // UPDATE GAMES TABLE WITH CHALLENGER INFORMATION
    try {
      if (this.dbService && this.dbService.db) {
        await new Promise((resolve, reject) => {
          this.dbService.db.run(`
            UPDATE games 
            SET challenger = ?, status = 'awaiting_deposits'
            WHERE id = ?
          `, [challengerAddress, gameId], function(err) {
            if (err) {
              console.error('❌ Error updating games table with challenger:', err)
              reject(err)
            } else {
              console.log(`✅ Updated games table with challenger: ${challengerAddress}`)
              resolve()
            }
          })
        })
      } else {
        console.warn('⚠️ Database service not available for challenger update')
      }
    } catch (error) {
      console.error('❌ Error updating games table with challenger:', error)
    }
    
    // Broadcast offer accepted event to all players in the room
    const roomId = gameId.startsWith('game_') ? gameId : `game_${gameId}`
    this.io.to(roomId).emit('offer_accepted', {
      type: 'offer_accepted',
      gameId: gameId,
      accepterAddress: address,
      challengerAddress: challengerAddress,
      cryptoAmount: cryptoAmount,
      timestamp: new Date().toISOString()
    })
    
    // Start synchronized deposit countdown for both players
    this.startDepositCountdown(gameId, roomId, 120) // 2 minutes
  }

  startDepositCountdown(gameId, roomId, initialTime) {
    console.log(`⏰ Starting deposit countdown for game ${gameId}: ${initialTime} seconds`)
    
    let timeLeft = initialTime
    
    const countdownInterval = setInterval(() => {
      // Broadcast countdown to all players in the room
      this.io.to(roomId).emit('deposit_countdown', {
        gameId,
        timeRemaining: timeLeft,
        message: `Deposit time remaining: ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`
      })
      
      timeLeft--
      
      if (timeLeft < 0) {
        clearInterval(countdownInterval)
        console.log(`⏰ Deposit countdown expired for game ${gameId}`)
        
        // Notify all players that deposit time has expired
        this.io.to(roomId).emit('deposit_timeout', {
          gameId,
          message: 'Deposit time expired! Game cancelled.'
        })
        
        // Clean up the game state
        this.gameStateManager.removeGame(gameId)
      }
    }, 1000)
    
    // Store the interval so we can clear it if deposits complete early
    this.depositCountdowns = this.depositCountdowns || {}
    this.depositCountdowns[gameId] = countdownInterval
  }

  clearDepositCountdown(gameId) {
    if (this.depositCountdowns && this.depositCountdowns[gameId]) {
      clearInterval(this.depositCountdowns[gameId])
      delete this.depositCountdowns[gameId]
      console.log(`⏰ Cleared deposit countdown for game ${gameId}`)
    }
  }

  async handleDepositConfirmed(socket, data) {
    try {
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
      
      if (isCreator && assetType === 'nft') {
        gameData.creatorDeposited = true
        await new Promise((resolve, reject) => {
          this.dbService.db.run(`
            UPDATE games 
            SET creator_deposited = true, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [gameId], (err) => {
            if (err) reject(err)
            else resolve()
          })
        })
      } else if (!isCreator && assetType === 'eth') {
        gameData.challengerDeposited = true
        await new Promise((resolve, reject) => {
          this.dbService.db.run(`
            UPDATE games 
            SET challenger_deposited = true, status = 'active', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [gameId], (err) => {
            if (err) reject(err)
            else resolve()
          })
        })
      }
      
      const roomId = gameId.startsWith('game_') ? gameId : `game_${gameId}`
      const bothDeposited = gameData.creatorDeposited && gameData.challengerDeposited
      
      // First, always acknowledge the deposit
      this.io.to(roomId).emit('deposit_confirmed', {
        gameId,
        player: address,
        assetType,
        creatorDeposited: gameData.creatorDeposited,
        challengerDeposited: gameData.challengerDeposited,
        bothDeposited: bothDeposited
      })
      
      if (bothDeposited) {
        console.log(`🎮 Both players deposited in game ${gameId}, initializing game!`)
        
        // Clear any deposit countdowns
        this.clearDepositCountdown(gameId)
        
        // Initialize game state
        const gameState = this.initializeGameState(gameId, gameData)
        this.gameStateManager.createGame(gameId, gameState)
        
        // Start state broadcasting
        this.gameStateManager.startStateBroadcasting(gameId, (room, message) => {
          this.io.to(room).emit(message.type, message)
        })
        
        // Send ONE authoritative event that both players will respond to
        setTimeout(() => {
          // Small delay to ensure state is ready
          this.io.to(roomId).emit('game_transport_ready', {
            gameId,
            phase: 'game_active',
            message: 'Game initialized! Transporting all players...',
            creator: gameData.creator,
            challenger: gameData.challenger,
            transportNow: true
          })
          
          // Also send initial game state
          const fullState = this.gameStateManager.getFullGameState(gameId)
          this.io.to(roomId).emit('game_state_update', fullState)
        }, 500)
      }
    } catch (error) {
      console.error('❌ Error in handleDepositConfirmed:', error)
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
      challenger: gameData.challenger,
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