const socketIO = require('socket.io')
const BattleRoyaleGameManager = require('./BattleRoyaleGameManager')
const BattleRoyaleSocketHandlers = require('./BattleRoyaleSocketHandlers')
const BattleRoyaleDBService = require('../services/BattleRoyaleDBService')

// ===== CLEAN SERVER ARCHITECTURE =====
// Single source of truth for all game state management
// Server handles ALL game logic - clients only send actions and render state

class GameServer {
  constructor() {
    this.battleRoyaleManager = new BattleRoyaleGameManager()
    this.battleRoyaleHandlers = new BattleRoyaleSocketHandlers()
    this.socketData = new Map() // socketId -> { address, gameId, roomId, role }
    this.userSockets = new Map() // address -> socketId
    this.battleRoyaleRooms = new Map() // gameId -> Set of socketIds
    this.io = null
    this.dbService = null
    
    console.log(`🏗️ GameServer initialized:`, {
      battleRoyaleManager: !!this.battleRoyaleManager,
      battleRoyaleHandlers: !!this.battleRoyaleHandlers
    })
  }

  // ===== INITIALIZATION =====
  initialize(server, dbService) {
    console.log('🚀 Initializing Clean Game Server...')
    
    this.dbService = dbService
    
    // Add Battle Royale DB service
    if (dbService && dbService.db) {
      this.battleRoyaleDBService = new BattleRoyaleDBService(dbService.db)
    }
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
      
      // Deposit system removed - using polling instead
      
      // ===== BATTLE ROYALE GAME ACTIONS (UNIFIED) =====
      socket.on('request_game_state', (data) => this.handleRequestBattleRoyaleState(socket, data))
      socket.on('activate_game', (data) => this.handleActivateBattleRoyaleGame(socket, data))
      socket.on('player_choice', (data) => this.handleBattleRoyaleChoice(socket, data))
      socket.on('start_power_charge', (data) => this.handleBattleRoyaleStartPowerCharge(socket, data))
      socket.on('stop_power_charge', (data) => this.handleBattleRoyaleStopPowerCharge(socket, data))
      socket.on('execute_flip', (data) => this.handleBattleRoyaleExecuteFlip(socket, data))
      socket.on('spectate_game', (data) => this.handleBattleRoyaleSpectate(socket, data))
      socket.on('request_next_round', (data) => this.handleBattleRoyaleNextRound(socket, data))
      
      // ===== BATTLE ROYALE ACTIONS =====
      socket.on('join_battle_royale_room', (data) => this.battleRoyaleHandlers.handleJoinBattleRoyaleRoom(socket, data, this.battleRoyaleManager, this.io))
      socket.on('join_battle_royale', (data) => this.battleRoyaleHandlers.handleJoinBattleRoyale(socket, data, this.battleRoyaleManager, this.io, this.dbService))
      // REMOVED: battle_royale_player_choice - Battle Royale doesn't use player choices
      socket.on('battle_royale_start_power_charge', (data) => this.battleRoyaleHandlers.handleBattleRoyaleStartPowerCharge(socket, data, this.battleRoyaleManager, this.io))
      socket.on('battle_royale_stop_power_charge', (data) => this.battleRoyaleHandlers.handleBattleRoyaleStopPowerCharge(socket, data, this.battleRoyaleManager, this.io))
      socket.on('battle_royale_execute_flip', (data) => this.battleRoyaleHandlers.handleBattleRoyaleExecuteFlip(socket, data, this.battleRoyaleManager, this.io))
      socket.on('battle_royale_update_coin', (data) => this.battleRoyaleHandlers.handleBattleRoyaleUpdateCoin(socket, data, this.battleRoyaleManager, this.io))
      socket.on('spectate_battle_royale', (data) => this.battleRoyaleHandlers.handleSpectateBattleRoyale(socket, data, this.battleRoyaleManager))
      socket.on('request_battle_royale_state', (data) => this.battleRoyaleHandlers.handleRequestBattleRoyaleState(socket, data, this.battleRoyaleManager))
      socket.on('battle_royale_start_early', (data) => {
        console.log(`🎯 Socket.IO received battle_royale_start_early event from socket ${socket.id}`)
        console.log(`📥 Event data:`, data)
        this.battleRoyaleHandlers.handleBattleRoyaleStartEarly(socket, data, this.battleRoyaleManager, this.io, this.dbService)
      })
      
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
    let gameState = this.gameStateManager.getGame(gameId)
    let role = 'spectator'
    
    // If no game state, try to load from database first
    if (!gameState && this.dbService) {
      try {
        const gameData = await this.dbService.getGame(gameId)
        if (gameData) {
          console.log(`🔍 Loaded game from DB for role detection:`, {
            creator: gameData.creator,
            challenger: gameData.challenger,
            joiningAddress: address
          })
          
          // Check roles against database data
          if (address.toLowerCase() === gameData.creator?.toLowerCase()) {
            role = 'creator'
          } else if (address.toLowerCase() === gameData.challenger?.toLowerCase()) {
            role = 'challenger'
          }
        }
      } catch (error) {
        console.error('❌ Error loading game for role detection:', error)
      }
    } else if (gameState) {
      // Use existing game state
      if (address.toLowerCase() === gameState.creator?.toLowerCase()) {
        role = 'creator'
      } else if (address.toLowerCase() === gameState.challenger?.toLowerCase()) {
        role = 'challenger'
      } else {
        // Add as spectator
        this.gameStateManager.addSpectator(gameId, address)
      }
    }
    
    console.log(`🎭 Role assigned: ${address} → ${role}`)
    
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

  // ===== BATTLE ROYALE GAME STATE MANAGEMENT (UNIFIED) =====
  async handleRequestBattleRoyaleState(socket, data) {
    console.log(`🔍 handleRequestBattleRoyaleState called with data:`, data)
    console.log(`🔍 Socket ID: ${socket.id}`)
    
    if (!data) {
      console.error('❌ No data provided to handleRequestBattleRoyaleState')
      socket.emit('battle_royale_error', { error: 'No data provided' })
      return
    }
    
    const { gameId } = data
    console.log(`📊 Battle Royale game state requested for ${gameId}`)
    
    if (!gameId) {
      console.error('❌ No gameId provided to handleRequestBattleRoyaleState')
      socket.emit('battle_royale_error', { error: 'No gameId provided' })
      return
    }
    
    try {
      // Always use Battle Royale system
      let gameState = this.battleRoyaleManager.getGame(gameId)
      console.log(`🔍 BattleRoyaleManager lookup result:`, gameState ? 'found' : 'not found')
      
      if (!gameState) {
        // Try to load from database and restore
        console.log(`🔍 Attempting database lookup for Battle Royale game: ${gameId}`)
        const gameData = await this.dbService.getBattleRoyaleGame(gameId)
        console.log(`🔍 Database lookup result:`, gameData ? 'found' : 'not found')
        if (gameData) {
          console.log(`🔍 Battle Royale game data from DB:`, { id: gameData.id, status: gameData.status, creator: gameData.creator })
          // Create battle royale game
          gameState = this.battleRoyaleManager.createBattleRoyale(gameId, gameData, this.dbService)
        }
      }
      
      if (gameState) {
        const fullState = this.battleRoyaleManager.getFullGameState(gameId)
        console.log(`📤 Sending battle_royale_state_update to socket ${socket.id}:`, fullState ? 'state found' : 'no state')
        socket.emit('battle_royale_state_update', fullState)
      } else {
        console.log(`📤 Sending battle_royale_error to socket ${socket.id} for gameId: ${gameId}`)
        socket.emit('battle_royale_error', { gameId, error: 'Game not found' })
      }
    } catch (error) {
       console.error('❌ Error in handleRequestBattleRoyaleState:', error)
       socket.emit('battle_royale_error', { gameId, error: error.message })
     }
   }

   // ===== BATTLE ROYALE GAME ACTIVATION (UNIFIED) =====
   async handleActivateBattleRoyaleGame(socket, data) {
     console.log(`🎮 handleActivateBattleRoyaleGame called with data:`, data)
     
     if (!data) {
       console.error('❌ No data provided to handleActivateBattleRoyaleGame')
       return
     }
     
     const { gameId } = data
     console.log(`🎮 Battle Royale game activation requested for ${gameId}`)
     
     if (!gameId) {
       console.error('❌ No gameId provided to handleActivateBattleRoyaleGame')
       return
     }
     
     try {
       // Always use Battle Royale system
       let gameState = this.battleRoyaleManager.getGame(gameId)
       
       if (gameState) {
         console.log(`🎮 Battle Royale game ${gameId} already exists in memory`)
         // Battle Royale games auto-activate when they have enough players
         return
       } else {
         console.log(`🎮 Battle Royale game ${gameId} not in memory, loading from database`)
         
         // Load battle royale game from database
         const battleRoyaleData = await this.dbService.getBattleRoyaleGame(gameId)
         
         if (battleRoyaleData) {
           console.log(`🎮 Battle Royale game found in database: ${gameId}`)
           // Create battle royale game
           gameState = this.battleRoyaleManager.createBattleRoyale(gameId, battleRoyaleData, this.dbService)
           
           // Broadcast game state update
           const fullState = this.battleRoyaleManager.getFullGameState(gameId)
           if (fullState) {
             this.io.to(`br_${gameId}`).emit('battle_royale_state_update', fullState)
           }
         } else {
           console.error(`❌ Battle Royale game ${gameId} not found in database`)
         }
       }
     } catch (error) {
       console.error('❌ Error in handleActivateBattleRoyaleGame:', error)
     }
   }

  // ===== BATTLE ROYALE PLAYER ACTIONS (UNIFIED) =====
  async handleBattleRoyaleChoice(socket, data) {
    const { gameId, address, choice } = data
    console.log(`🎯 Battle Royale player choice: ${address} chose ${choice} in game ${gameId}`)
    
    // Battle Royale doesn't use player choices - redirect to power charging
    socket.emit('battle_royale_error', { message: 'Battle Royale uses power charging, not choices' })
  }

  async handleBattleRoyaleStartPowerCharge(socket, data) {
    const { gameId, address } = data
    console.log(`⚡ Battle Royale starting power charge: ${address} in game ${gameId}`)
    
    // Use Battle Royale handlers
    this.battleRoyaleHandlers.handleBattleRoyaleStartPowerCharge(socket, data, this.battleRoyaleManager, this.io)
  }

  async handleBattleRoyaleStopPowerCharge(socket, data) {
    const { gameId, address } = data
    console.log(`⚡ Battle Royale stopping power charge: ${address} in game ${gameId}`)
    
    // Use Battle Royale handlers
    this.battleRoyaleHandlers.handleBattleRoyaleStopPowerCharge(socket, data, this.battleRoyaleManager, this.io)
  }

  async handleBattleRoyaleExecuteFlip(socket, data) {
    const { gameId, address } = data
    console.log(`🎲 Battle Royale execute flip: ${address} in game ${gameId}`)
    
    // Use Battle Royale handlers
    this.battleRoyaleHandlers.handleBattleRoyaleExecuteFlip(socket, data, this.battleRoyaleManager, this.io)
  }

  async handleBattleRoyaleSpectate(socket, data) {
    const { gameId, address } = data
    console.log(`👁️ Battle Royale spectate: ${address} in game ${gameId}`)
    
    // Use Battle Royale handlers
    this.battleRoyaleHandlers.handleBattleRoyaleSpectate(socket, data, this.battleRoyaleManager, this.io)
  }

  async handleBattleRoyaleNextRound(socket, data) {
    const { gameId } = data
    console.log(`🔄 Battle Royale next round requested for game ${gameId}`)
    
    // Battle Royale rounds are handled automatically by the system
    socket.emit('battle_royale_error', { message: 'Battle Royale rounds are automatic' })
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
    console.log(`🎯 Challenger address received: ${challengerAddress}`)
    
    // Update database with challenger
    try {
      if (this.dbService && this.dbService.db) {
        await new Promise((resolve, reject) => {
          this.dbService.db.run(`
            UPDATE games 
            SET challenger = ?, status = 'awaiting_deposits'
            WHERE id = ?
          `, [challengerAddress, gameId], function(err) {
            if (err) {
              console.error('❌ Database error updating challenger:', err)
              reject(err)
            } else {
              console.log(`✅ Successfully updated challenger ${challengerAddress} for game ${gameId}`)
              resolve()
            }
          })
        })
        
        // Verify the update
        const updatedGame = await new Promise((resolve, reject) => {
          this.dbService.db.get('SELECT challenger FROM games WHERE id = ?', [gameId], (err, row) => {
            if (err) reject(err)
            else resolve(row)
          })
        })
        console.log(`🔍 Verification - Challenger in DB: ${updatedGame?.challenger}`)
        
        // Update the cached game state with the new challenger
        const existingGameState = this.gameStateManager.getGame(gameId)
        if (existingGameState) {
          existingGameState.challenger = challengerAddress
          console.log(`🔄 Updated cached game state challenger: ${challengerAddress}`)
        }
      }
    } catch (error) {
      console.error('❌ Error updating challenger:', error)
    }
    
    // Broadcast offer accepted
    const roomId = gameId.startsWith('game_') ? gameId : `game_${gameId}`
    this.io.to(roomId).emit('offer_accepted', {
      type: 'offer_accepted',
      gameId: gameId,
      accepterAddress: address,
      challengerAddress: challengerAddress,
      cryptoAmount: cryptoAmount,
      timestamp: new Date().toISOString()
    })
    
    // Start countdown for UI display only
    this.startDepositCountdown(gameId, roomId, 120)
  }

  startDepositCountdown(gameId, roomId, initialTime) {
    console.log(`⏰ Starting UI countdown for game ${gameId}`)
    
    let timeLeft = initialTime
    
    const countdownInterval = setInterval(() => {
      this.io.to(roomId).emit('deposit_countdown', {
        gameId,
        timeRemaining: timeLeft,
        message: `Deposit time remaining: ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`
      })
      
      timeLeft--
      
      if (timeLeft < 0) {
        clearInterval(countdownInterval)
        this.io.to(roomId).emit('deposit_timeout', {
          gameId,
          message: 'Deposit time expired!'
        })
      }
    }, 1000)
    
    this.depositCountdowns = this.depositCountdowns || {}
    this.depositCountdowns[gameId] = countdownInterval
  }

  // Removed clearDepositCountdown - no longer needed for 1v1 games


  // ===== HELPER METHODS =====
  // Removed initializeGameState - no longer needed for 1v1 games

  // ===== BATTLE ROYALE HANDLERS =====
  async handleJoinBattleRoyale(socket, data) {
    const { gameId, address } = data
    console.log(`🎮 ${address} joining Battle Royale: ${gameId}`)
    
    // Get or create Battle Royale game
    let game = this.battleRoyaleManager.getGame(gameId)
    if (!game && this.dbService) {
      // Try to load from database
      try {
        const gameData = await this.dbService.getBattleRoyaleGame(gameId)
        if (gameData && gameData.status === 'filling') {
          game = this.battleRoyaleManager.createBattleRoyale(gameId, gameData)
        }
      } catch (error) {
        console.error('❌ Error loading Battle Royale game:', error)
      }
    }

    if (!game) {
      socket.emit('battle_royale_error', { message: 'Game not found' })
      return
    }

    // Add player to game
    const success = this.battleRoyaleManager.addPlayer(gameId, address)
    if (!success) {
      socket.emit('battle_royale_error', { message: 'Cannot join game' })
      return
    }

    // Join room
    const roomId = `br_${gameId}`
    socket.join(roomId)
    
    // Track socket
    this.socketData.set(socket.id, { 
      address, 
      gameId, 
      roomId,
      gameType: 'battle_royale',
      role: 'player' 
    })
    
    // Add to room tracking
    if (!this.battleRoyaleRooms.has(gameId)) {
      this.battleRoyaleRooms.set(gameId, new Set())
    }
    this.battleRoyaleRooms.get(gameId).add(socket.id)

    // Broadcast updated game state
    const fullState = this.battleRoyaleManager.getFullGameState(gameId)
    this.io.to(roomId).emit('battle_royale_state_update', fullState)

    console.log(`✅ ${address} joined Battle Royale ${gameId}`)
  }

  async handleBattleRoyaleChoice(socket, data) {
    const { gameId, address, choice } = data
    console.log(`🎯 Battle Royale choice: ${address} chose ${choice} in ${gameId}`)
    
    const success = this.battleRoyaleManager.setPlayerChoice(gameId, address, choice)
    if (!success) {
      socket.emit('battle_royale_error', { message: 'Cannot set choice' })
      return
    }

    // Broadcast updated state
    const roomId = `br_${gameId}`
    const fullState = this.battleRoyaleManager.getFullGameState(gameId)
    this.io.to(roomId).emit('battle_royale_state_update', fullState)
  }

  async handleBattleRoyaleFlip(socket, data) {
    const { gameId, address, power } = data
    console.log(`🪙 Battle Royale flip: ${address} flipping with power ${power} in ${gameId}`)
    
    const success = this.battleRoyaleManager.executePlayerFlip(gameId, address, power, (gameId, eventType, eventData) => {
      const roomId = `br_${gameId}`
      this.io.to(roomId).emit(eventType, eventData)
    })

    if (!success) {
      socket.emit('battle_royale_error', { message: 'Cannot execute flip' })
      return
    }

    // Broadcast updated state
    const roomId = `br_${gameId}`
    const fullState = this.battleRoyaleManager.getFullGameState(gameId)
    this.io.to(roomId).emit('battle_royale_state_update', fullState)
  }

  async handleBattleRoyaleUpdateCoin(socket, data) {
    const { gameId, address, coinData } = data
    console.log(`🪙 Battle Royale coin update: ${address} changing coin to ${coinData.name} in ${gameId}`)
    
    const success = this.battleRoyaleManager.updatePlayerCoin(gameId, address, coinData)
    if (!success) {
      socket.emit('battle_royale_error', { message: 'Cannot update coin' })
      return
    }

    // Broadcast updated state
    const roomId = `br_${gameId}`
    const fullState = this.battleRoyaleManager.getFullGameState(gameId)
    this.io.to(roomId).emit('battle_royale_state_update', fullState)
  }

  async handleSpectateBattleRoyale(socket, data) {
    const { gameId, address } = data
    console.log(`👁️ ${address} spectating Battle Royale: ${gameId}`)
    
    const game = this.battleRoyaleManager.getGame(gameId)
    if (!game) {
      socket.emit('battle_royale_error', { message: 'Game not found' })
      return
    }

    // Add as spectator
    this.battleRoyaleManager.addSpectator(gameId, address)
    
    // Join room
    const roomId = `br_${gameId}`
    socket.join(roomId)
    
    // Track socket
    this.socketData.set(socket.id, { 
      address, 
      gameId, 
      roomId,
      gameType: 'battle_royale',
      role: 'spectator' 
    })

    // Send current state
    const fullState = this.battleRoyaleManager.getFullGameState(gameId)
    socket.emit('battle_royale_state_update', fullState)
  }

  async handleRequestBattleRoyaleState(socket, data) {
    const { gameId } = data
    console.log(`📊 Battle Royale state requested: ${gameId}`)
    
    const fullState = this.battleRoyaleManager.getFullGameState(gameId)
    if (fullState) {
      socket.emit('battle_royale_state_update', fullState)
    } else {
      socket.emit('battle_royale_error', { message: 'Game not found' })
    }
  }

  // ===== DISCONNECTION =====
  handleDisconnect(socket) {
    console.log('❌ Disconnected:', socket.id)
    
    const data = this.socketData.get(socket.id)
    if (data) {
      // Handle Battle Royale disconnection
      if (data.gameType === 'battle_royale' && data.gameId && data.role === 'spectator') {
        this.battleRoyaleManager.removeSpectator(data.gameId, data.address)
      }
      
      this.userSockets.delete(data.address.toLowerCase())
      this.socketData.delete(socket.id)
      
      // Remove from Battle Royale room tracking
      if (data.gameType === 'battle_royale' && data.gameId) {
        const brRoom = this.battleRoyaleRooms.get(data.gameId)
        if (brRoom) {
          brRoom.delete(socket.id)
          if (brRoom.size === 0) {
            // Consider cleaning up empty Battle Royale games
            this.battleRoyaleRooms.delete(data.gameId)
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
  const io = gameServer.initialize(server, dbService)
  return {
    io,
    gameServer // Export the gameServer instance
  }
}

module.exports = { initializeSocketIO }