const socketIO = require('socket.io')
const BattleRoyaleGameManager = require('../BattleRoyaleGameManager')
const BattleRoyaleDBService = require('../services/BattleRoyaleDBService')

// ===== CLEAN SERVER ARCHITECTURE =====
// Single source of truth for all game state management
// Server handles ALL game logic - clients only send actions and render state

class GameServer {
  constructor(io, dbService) {
    this.io = io
    this.dbService = dbService
    
    // Initialize managers FIRST
    // this.gameManager = new GameManager() // TODO: Not implemented yet - for 1v1 games
    this.battleRoyaleManager = new BattleRoyaleGameManager()
    
    // Then instantiate handlers (FIXED: They are classes, not modules)
    // this.oneVOneHandlers = require('./1v1SocketHandlers') // TODO: Not implemented yet
    const BattleRoyaleSocketHandlersClass = require('./BattleRoyaleSocketHandlers')
    this.battleRoyaleHandlers = new BattleRoyaleSocketHandlersClass()
    
    this.socketData = new Map() // socketId -> { address, gameId, roomId, role }
    this.userSockets = new Map() // address -> socketId
    this.battleRoyaleRooms = new Map() // gameId -> Set of socketIds
    
    console.log('✅ SocketService: Managers initialized:', {
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
      
      // Offer system (preserved - only for notifications)
      
      // Deposit system removed - using polling instead
      
      // ===== BATTLE ROYALE ACTIONS =====
      socket.on('join_battle_royale_room', (data) => {
        console.log(`📥 join_battle_royale_room from ${socket.id}`, data)
        this.battleRoyaleHandlers.handleJoinBattleRoyaleRoom(
          socket, 
          data, 
          this.battleRoyaleManager, 
          this.io,
          this.dbService
        )
      })

      socket.on('join_battle_royale', (data) => {
        console.log(`📥 join_battle_royale from ${socket.id}`, data)
        this.battleRoyaleHandlers.handleJoinBattleRoyale(
          socket, 
          data, 
          this.battleRoyaleManager, 
          this.io, 
          this.dbService
        )
      })

      socket.on('battle_royale_update_coin', (data) => {
        console.log(`📥 battle_royale_update_coin from ${socket.id}`, data)
        this.battleRoyaleHandlers.handleBattleRoyaleUpdateCoin(
          socket, 
          data, 
          this.battleRoyaleManager, 
          this.io
        )
      })

      socket.on('spectate_battle_royale', (data) => {
        console.log(`📥 spectate_battle_royale from ${socket.id}`)
        this.battleRoyaleHandlers.handleSpectateBattleRoyale(
          socket, 
          data, 
          this.battleRoyaleManager
        )
      })

      socket.on('request_battle_royale_state', (data) => {
        console.log(`📥 request_battle_royale_state from ${socket.id}`)
        this.battleRoyaleHandlers.handleRequestBattleRoyaleState(
          socket, 
          data, 
          this.battleRoyaleManager
        )
      })

      socket.on('battle_royale_player_choice', (data) => {
        console.log(`📥 battle_royale_player_choice from ${socket.id}`, data)
        this.battleRoyaleHandlers.handlePlayerChoice(
          socket, 
          data, 
          this.battleRoyaleManager, 
          this.io
        )
      })

      socket.on('battle_royale_flip_coin', (data) => {
        console.log(`📥 battle_royale_flip_coin from ${socket.id}`, data)
        this.battleRoyaleHandlers.handleFlipCoin(
          socket, 
          data, 
          this.battleRoyaleManager, 
          this.io
        )
      })

      socket.on('battle_royale_start_early', (data) => {
        console.log(`📥 battle_royale_start_early from ${socket.id}`, data)
        this.battleRoyaleHandlers.handleBattleRoyaleStartEarly(
          socket, 
          data, 
          this.battleRoyaleManager, 
          this.io, 
          this.dbService
        )
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
    
    // Determine role (creator, challenger, or spectator) - Battle Royale only
    const gameId = roomId // Keep the full game ID including 'br_' prefix
    let role = 'spectator'
    
    // For Battle Royale games, check database for role
    if (this.dbService) {
      try {
        const gameData = await this.dbService.getBattleRoyaleGame(gameId)
        if (gameData) {
          console.log(`🔍 Loaded Battle Royale game from DB for role detection:`, {
            creator: gameData.creator,
            joiningAddress: address
          })
          
          // Check roles against database data
          if (address.toLowerCase() === gameData.creator?.toLowerCase()) {
            role = 'creator'
          } else {
            role = 'player'
          }
        }
      } catch (error) {
        console.error('❌ Error loading Battle Royale game for role detection:', error)
      }
    }
    
    console.log(`🎭 Role assigned: ${address} → ${role}`)
    
    this.socketData.set(socket.id, { address, roomId, gameId, role })
    this.userSockets.set(address.toLowerCase(), socket.id)
    
    // Add to Battle Royale room tracking
    if (!this.battleRoyaleRooms.has(gameId)) {
      this.battleRoyaleRooms.set(gameId, new Set())
    }
    this.battleRoyaleRooms.get(gameId).add(socket.id)
    
    socket.emit('room_joined', { 
      roomId, 
      role,
      members: this.io.sockets.adapter.rooms.get(roomId)?.size || 0 
    })
    
    // Send current Battle Royale game state if it exists
    const battleRoyaleGame = this.battleRoyaleManager.getGame(gameId)
    if (battleRoyaleGame) {
      const fullState = this.battleRoyaleManager.getFullGameState(gameId)
      socket.emit('battle_royale_state_update', fullState)
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