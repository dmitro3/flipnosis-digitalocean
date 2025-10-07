const socketIO = require('socket.io')
const BattleRoyaleGameManager = require('../BattleRoyaleGameManager')
const PhysicsGameManager = require('../PhysicsGameManager')
const BattleRoyaleDBService = require('../services/BattleRoyaleDBService')
const SocketTracker = require('./SocketTracker')

// ===== CLEAN SERVER ARCHITECTURE =====

// Server handles ALL game logic - clients only send actions and render state

class GameServer {
  constructor(io, dbService) {
    this.io = io
    this.dbService = dbService
    
    // Initialize managers FIRST
    // this.gameManager = new GameManager() // TODO: Not implemented yet - for 1v1 games
    this.battleRoyaleManager = new BattleRoyaleGameManager()
    this.physicsGameManager = new PhysicsGameManager()
    
    // Initialize socket tracker for reliable broadcasting
    this.socketTracker = new SocketTracker()
    
    // Then instantiate handlers (FIXED: They are classes, not modules)
    // this.oneVOneHandlers = require('./1v1SocketHandlers') // TODO: Not implemented yet
    const BattleRoyaleSocketHandlersClass = require('./BattleRoyaleSocketHandlers')
    this.battleRoyaleHandlers = new BattleRoyaleSocketHandlersClass()
    
    this.socketData = new Map() // socketId -> { address, gameId, roomId, role }
    this.userSockets = new Map() // address -> socketId
    this.battleRoyaleRooms = new Map() // gameId -> Set of socketIds
    
    console.log('✅ SocketService: Managers initialized:', {
      battleRoyaleManager: !!this.battleRoyaleManager,
      battleRoyaleHandlers: !!this.battleRoyaleHandlers,
      socketTracker: !!this.socketTracker
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

      // Wrap all socket handlers in try-catch to prevent crashes
      const safeHandler = (handler) => async (data) => {
        try {
          await handler(data)
        } catch (error) {
          console.error('❌ Socket handler error:', error)
          socket.emit('error', { message: 'An error occurred processing your request' })
        }
      }

      // Room management
      socket.on('join_room', safeHandler((data) => this.handleJoinRoom(socket, data)))
      
      // Chat system (preserved)
      socket.on('chat_message', safeHandler((data) => this.handleChatMessage(socket, data)))
      
      // Offer system (preserved - only for notifications)
      
      // Deposit system removed - using polling instead
      
      // ===== BATTLE ROYALE ACTIONS =====
      socket.on('join_battle_royale_room', safeHandler((data) => {
        console.log(`📥 join_battle_royale_room from ${socket.id}`, data)
        return this.battleRoyaleHandlers.handleJoinBattleRoyaleRoom(
          socket, 
          data, 
          this.battleRoyaleManager, 
          this.io,
          this.dbService,
          this.socketTracker
        )
      }))

      socket.on('join_battle_royale', safeHandler((data) => {
        console.log(`📥 join_battle_royale from ${socket.id}`, data)
        return this.battleRoyaleHandlers.handleJoinBattleRoyale(
          socket, 
          data, 
          this.battleRoyaleManager, 
          this.io, 
          this.dbService,
          this.socketTracker
        )
      }))

      socket.on('battle_royale_update_coin', safeHandler((data) => {
        console.log(`📥 battle_royale_update_coin from ${socket.id}`, data)
        return this.battleRoyaleHandlers.handleBattleRoyaleUpdateCoin(
          socket, 
          data, 
          this.battleRoyaleManager, 
          this.io,
          this.dbService,
          this.socketTracker
        )
      }))

      socket.on('spectate_battle_royale', safeHandler((data) => {
        console.log(`📥 spectate_battle_royale from ${socket.id}`)
        return this.battleRoyaleHandlers.handleSpectateBattleRoyale(
          socket, 
          data, 
          this.battleRoyaleManager
        )
      }))

      socket.on('request_battle_royale_state', safeHandler(async (data) => {
        console.log(`📥 request_battle_royale_state from ${socket.id}`)
        const { gameId } = data
        
        // Check if this is a physics game (all new games are)
        if (gameId && gameId.startsWith('physics_')) {
          // Load physics game from database if not in memory
          let game = this.physicsGameManager.getGame(gameId)
          
          if (!game) {
            // Load from database
            const gameData = await this.dbService.getBattleRoyaleGame(gameId)
            if (gameData) {
              console.log(`🔄 Loading physics game from database: ${gameId}`)
              game = this.physicsGameManager.createPhysicsGame(gameId, gameData)
              
              // Load existing players
              const participants = await this.dbService.getBattleRoyaleParticipants(gameId)
              for (const participant of participants) {
                this.physicsGameManager.addPlayer(gameId, participant.player_address)
              }
            }
          }
          
          // Send physics state
          const state = this.physicsGameManager.getFullGameState(gameId)
          if (state) {
            console.log(`✅ Sending physics state for ${gameId} - Phase: ${state.phase}, Players: ${state.currentPlayers}`)
            socket.emit('physics_state_update', state)
          } else {
            socket.emit('physics_error', { message: 'Game not found' })
          }
        } else {
          // Old battle royale games
          return this.battleRoyaleHandlers.handleRequestBattleRoyaleState(
            socket, 
            data, 
            this.battleRoyaleManager,
            this.dbService
          )
        }
      }))

      socket.on('battle_royale_player_choice', safeHandler((data) => {
        console.log(`📥 battle_royale_player_choice from ${socket.id}`, data)
        return this.battleRoyaleHandlers.handleBattleRoyalePlayerChoice(
          socket, 
          data, 
          this.battleRoyaleManager, 
          this.io
        )
      }))

      socket.on('battle_royale_flip_coin', safeHandler((data) => {
        console.log(`📥 battle_royale_flip_coin from ${socket.id}`, data)
        return this.battleRoyaleHandlers.handleBattleRoyaleFlipCoin(
          socket, 
          data, 
          this.battleRoyaleManager, 
          this.io
        )
      }))

      // Shield deploy
      socket.on('battle_royale_deploy_shield', safeHandler((data) => {
        console.log(`📥 battle_royale_deploy_shield from ${socket.id}`, data)
        return this.battleRoyaleHandlers.handleBattleRoyaleDeployShield(
          socket,
          data,
          this.battleRoyaleManager,
          this.io
        )
      }))

      // Lightning round activate
      socket.on('battle_royale_activate_lightning', safeHandler((data) => {
        console.log(`📥 battle_royale_activate_lightning from ${socket.id}`, data)
        return this.battleRoyaleHandlers.handleBattleRoyaleActivateLightning(
          socket,
          data,
          this.battleRoyaleManager,
          this.io
        )
      }))

      socket.on('battle_royale_start_early', safeHandler((data) => {
        console.log(`📥 battle_royale_start_early from ${socket.id}`, data)
        return this.battleRoyaleHandlers.handleBattleRoyaleStartEarly(
          socket, 
          data, 
          this.battleRoyaleManager, 
          this.io, 
          this.dbService
        )
      }))

      // ===== PHYSICS GAME ACTIONS =====
      socket.on('physics_set_choice', safeHandler((data) => {
        console.log(`🔥 physics_set_choice from ${socket.id}`, data)
        const { gameId, address, choice } = data
        const success = this.physicsGameManager.setChoice(gameId, address, choice)
        if (success) {
          this.physicsGameManager.broadcastState(gameId, (room, event, payload) => {
            this.io.to(room).emit(event, payload)
          })
        }
      }))

      socket.on('physics_fire_coin', safeHandler((data) => {
        console.log(`🔥 physics_fire_coin from ${socket.id}`, data)
        const { gameId, address, angle, power } = data
        this.physicsGameManager.fireCoin(gameId, address, angle, power, (room, event, payload) => {
          this.io.to(room).emit(event, payload)
        })
      }))

      socket.on('physics_request_state', safeHandler((data) => {
        console.log(`🔥 physics_request_state from ${socket.id}`)
        const { gameId } = data
        const state = this.physicsGameManager.getFullGameState(gameId)
        if (state) {
          socket.emit('physics_state_update', state)
        }
      }))

      socket.on('physics_start_game', safeHandler((data) => {
        console.log(`🔥 physics_start_game from ${socket.id}`)
        const { gameId, address } = data
        const game = this.physicsGameManager.getGame(gameId)
        if (!game) {
          socket.emit('physics_error', { message: 'Game not found' })
          return
        }
        if (game.creator?.toLowerCase() !== address?.toLowerCase()) {
          socket.emit('physics_error', { message: 'Only creator can start game' })
          return
        }
        this.physicsGameManager.startGame(gameId, (room, event, payload) => {
          this.io.to(room).emit(event, payload)
        })
      }))
      
      // Disconnection
      socket.on('disconnect', safeHandler(() => this.handleDisconnect(socket)))
    })
  }

  // ===== ROOM MANAGEMENT =====
  handleJoinRoom(socket, data) {
    const { roomId, address } = data
    console.log(`🏠 ${address} joining room: ${roomId}`)
    
    socket.join(roomId)
    this.socketData.set(socket.id, { address, roomId })
    
    // Handle Battle Royale room joins
    if (roomId.startsWith('game_')) {
      const gameId = roomId.substring(5)
      this.battleRoyaleHandlers.handleJoinBattleRoyaleRoom(
        socket, 
        { roomId, address }, 
        this.battleRoyaleManager, 
        this.io,
        this.dbService
      )
    }
    
    console.log(`✅ ${address} joined room ${roomId}`)
  }

  // ===== CHAT SYSTEM =====
  async handleChatMessage(socket, data) {
    const { roomId, message, address } = data
    console.log(`💬 Chat from ${address} in ${roomId}: ${message}`)
    
    // Save to database using existing chat_messages table
    if (this.dbService) {
      try {
        // Use roomId as-is for chat_messages table
        await this.dbService.saveChatMessage(roomId, address, message)
        console.log(`✅ Chat message saved to database for room ${roomId}`)
      } catch (error) {
        console.error('❌ Error saving chat message:', error)
      }
    }
    
    // Broadcast to room
    socket.to(roomId).emit('chat_message', {
      address,
      message,
      timestamp: new Date().toISOString()
    })
  }

  // ===== DISCONNECTION =====
  handleDisconnect(socket) {
    const socketData = this.socketData.get(socket.id)
    if (socketData) {
      console.log(`❌ ${socketData.address} disconnected from ${socketData.roomId}`)
      this.socketData.delete(socket.id)
    }
    
    // Clean up from socket tracker
    this.socketTracker.removeSocket(socket.id)
    
    console.log(`🧹 Socket ${socket.id} cleaned up from all trackers`)
  }
}

// Export the initialization function that server.js expects
function initializeSocketIO(server, dbService) {
  const gameServer = new GameServer(null, dbService)
  const io = gameServer.initialize(server, dbService)
  return { io, gameServer }
}

module.exports = { initializeSocketIO }