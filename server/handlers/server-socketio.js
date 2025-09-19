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
      
      // Deposit system removed - using polling instead
      
      // ===== NEW GAME ACTIONS =====
      socket.on('request_game_state', (data) => this.handleRequestGameState(socket, data))
      socket.on('activate_game', (data) => this.handleActivateGame(socket, data))
      socket.on('player_choice', (data) => this.handlePlayerChoice(socket, data))
    socket.on('start_power_charge', (data) => this.handleStartPowerCharge(socket, data))
    socket.on('stop_power_charge', (data) => this.handleStopPowerCharge(socket, data))
    socket.on('execute_flip', (data) => this.handleExecuteFlip(socket, data))
    socket.on('spectate_game', (data) => this.handleSpectateGame(socket, data))
    socket.on('request_next_round', (data) => this.handleRequestNextRound(socket, data))
      
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

   // ===== GAME ACTIVATION =====
   async handleActivateGame(socket, data) {
     console.log(`🎮 handleActivateGame called with data:`, data)
     
     if (!data) {
       console.error('❌ No data provided to handleActivateGame')
       return
     }
     
     const { gameId } = data
     console.log(`🎮 Game activation requested for ${gameId}`)
     
     if (!gameId) {
       console.error('❌ No gameId provided to handleActivateGame')
       return
     }
     
     try {
       // Check if game already exists in GameStateManager
       let gameState = this.gameStateManager.getGame(gameId)
       
       if (gameState) {
         console.log(`🎮 Game ${gameId} already exists in memory, checking if it needs activation`)
         
         // If it's still in deposit_stage, activate it
         if (gameState.phase === 'deposit_stage') {
           console.log(`🎮 Activating existing game ${gameId} from deposit_stage to game_active`)
           
           // Use the GameStateManager's activation method
           const success = this.gameStateManager.activateGameAfterDeposits(gameId, (roomId, eventType, eventData) => {
             this.io.to(roomId).emit(eventType, eventData)
           })
           
           if (success) {
             console.log(`✅ Game ${gameId} successfully activated`)
             
             // Broadcast game started event to all players in the room
             this.io.to(`game_${gameId}`).emit('game_started', {
               type: 'game_started',
               gameId,
               message: 'Both assets deposited - game starting!'
             })
             
             // Send updated game state to all players
             const fullState = this.gameStateManager.getFullGameState(gameId)
             if (fullState) {
               this.io.to(`game_${gameId}`).emit('game_state_update', fullState)
             }
           } else {
             console.error(`❌ Failed to activate game ${gameId}`)
           }
         } else {
           console.log(`🎮 Game ${gameId} is already in phase ${gameState.phase}, no activation needed`)
         }
       } else {
         console.log(`🎮 Game ${gameId} not in memory, loading from database and activating`)
         
         // Load from database
         const gameData = await this.dbService.getGame(gameId)
         
         if (gameData && (gameData.creator_deposited && gameData.challenger_deposited)) {
           console.log(`🎮 Both players deposited for ${gameId}, creating active game state`)
           
           // Create game state directly as active (both deposits confirmed)
           gameState = this.initializeGameState(gameId, gameData)
           
           // Force it to be active since we know both deposits are confirmed
           gameState.phase = 'game_active'
           gameState.gamePhase = 'waiting_choice'
           gameState.creatorDeposited = true
           gameState.challengerDeposited = true
           gameState.currentTurn = gameState.creator
           gameState.actionDeadline = Date.now() + 20000 // 20 seconds for choice
           
           // Create the game in GameStateManager
           this.gameStateManager.createGame(gameId, gameState)
           
           // Start state broadcasting
           this.gameStateManager.startStateBroadcasting(gameId, (roomId, eventType, eventData) => {
             console.log(`📡 Broadcasting ${eventType} to ${roomId}`)
             this.io.to(roomId).emit(eventType, eventData)
           })
           
           // Start round countdown with proper broadcast function
           this.gameStateManager.startRoundCountdown(gameId, (roomId, eventType, eventData) => {
             console.log(`📡 Broadcasting ${eventType} to ${roomId}`)
             this.io.to(roomId).emit(eventType, eventData)
           })
           
           console.log(`✅ Game ${gameId} created and activated`)
           
           // Broadcast game started event
           this.io.to(`game_${gameId}`).emit('game_started', {
             type: 'game_started',
             gameId,
             message: 'Both assets deposited - game starting!'
           })
           
           // Send updated game state to all players
           const fullState = this.gameStateManager.getFullGameState(gameId)
           if (fullState) {
             this.io.to(`game_${gameId}`).emit('game_state_update', fullState)
           }
         } else {
           console.error(`❌ Game ${gameId} not found or deposits not confirmed`)
         }
       }
     } catch (error) {
       console.error('❌ Error in handleActivateGame:', error)
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
    
    // Just broadcast the updated state
    const fullState = this.gameStateManager.getFullGameState(gameId)
    const roomId = gameId.startsWith('game_') ? gameId : `game_${gameId}`
    this.io.to(roomId).emit('game_state_update', fullState)
  }

  async handleExecuteFlip(socket, data) {
    const { gameId } = data
    console.log(`🎲 SERVER: handleExecuteFlip called for game ${gameId}`)
    
    try {
      // Pass broadcast function to executeFlip so it can handle round progression
      console.log(`🎲 SERVER: About to call gameStateManager.executeFlip`)
      const gameState = this.gameStateManager.executeFlip(gameId, (roomId, eventType, data) => {
        console.log(`🎲 SERVER: Broadcasting ${eventType} to room ${roomId}`)
        this.io.to(roomId).emit(eventType, data)
      })
      console.log(`🎲 SERVER: executeFlip returned:`, gameState ? 'success' : 'null')
    
      if (!gameState) {
        console.log(`🎲 SERVER: executeFlip returned null - game not found`)
        socket.emit('error', { message: 'Game not found' })
        return
      }
      
      // Broadcast flip execution with all details
      console.log(`🎲 SERVER: Broadcasting flip_executing event`)
      const roomId = gameId.startsWith('game_') ? gameId : `game_${gameId}`
      this.io.to(roomId).emit('flip_executing', {
        gameId,
        coinState: gameState.coinState,
        creatorChoice: gameState.creatorChoice,
        challengerChoice: gameState.challengerChoice,
        creatorPower: gameState.creatorFinalPower,
        challengerPower: gameState.challengerFinalPower
      })
      
      console.log(`🎲 SERVER: handleExecuteFlip completed successfully`)
      // State updates will continue via broadcast interval
    } catch (error) {
      console.error(`🎲 SERVER: Error in handleExecuteFlip:`, error)
      socket.emit('error', { message: 'Failed to execute flip' })
    }
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

  async handleRequestNextRound(socket, data) {
    const { gameId } = data
    console.log(`🔄 Next round requested for game ${gameId}`)
    
    // Start next round
    const gameState = this.gameStateManager.startNextRound(gameId, (roomId, eventType, data) => {
      this.io.to(roomId).emit(eventType, data)
    })
    
    if (gameState) {
      console.log(`✅ Next round started for game ${gameId}`)
    } else {
      console.log(`❌ Could not start next round for game ${gameId}`)
    }
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

  clearDepositCountdown(gameId) {
    if (this.depositCountdowns && this.depositCountdowns[gameId]) {
      clearInterval(this.depositCountdowns[gameId])
      delete this.depositCountdowns[gameId]
      console.log(`⏰ Cleared deposit countdown for game ${gameId}`)
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
    
    console.log(`🔍 Initializing game state for ${gameId}:`)
    console.log(`  - Creator: ${gameData.creator}`)
    console.log(`  - Challenger: ${gameData.challenger}`)
    console.log(`  - Status: ${gameData.status}`)
    
    // Check if both players are deposited to determine initial game phase
    const bothDeposited = Boolean(gameData.creator_deposited && gameData.challenger_deposited)
    const initialPhase = bothDeposited ? 'game_active' : 'deposit_stage'
    const initialGamePhase = bothDeposited ? 'waiting_choice' : null
    
    console.log(`🎮 Game initialization: bothDeposited=${bothDeposited}, phase=${initialPhase}, gamePhase=${initialGamePhase}`)
    
    return {
      gameId,
      phase: initialPhase,
      gamePhase: initialGamePhase,
      status: 'active',
      currentRound: 1,
      totalRounds: 5,
      creatorScore: 0,
      challengerScore: 0,
      creator: gameData.creator,
      challenger: gameData.challenger,
      currentTurn: gameData.creator, // Creator always goes first
      
      // Player choices and power (reset for new game)
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
      actionDeadline: bothDeposited ? Date.now() + 20000 : null, // 20 second timer for first choice
      roundStartTime: bothDeposited ? Date.now() : null,
      turnStartTime: bothDeposited ? Date.now() : null,
      
      // Results
      flipResult: null,
      roundWinner: null,
      gameWinner: null,
      
      // Spectators
      spectators: [],
      
      coinData: coinData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      // Add deposit status fields for game readiness check
      creatorDeposited: gameData.creator_deposited || false,
      challengerDeposited: gameData.challenger_deposited || false
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
  const io = gameServer.initialize(server, dbService)
  return {
    io,
    gameServer, // Export the gameServer instance
    clearDepositCountdown: (gameId) => gameServer.clearDepositCountdown(gameId)
  }
}

module.exports = { initializeSocketIO }