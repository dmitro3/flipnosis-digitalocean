const socketIO = require('socket.io')
const BattleRoyaleGameManager = require('../BattleRoyaleGameManager')
const PhysicsGameManager = require('../PhysicsGameManager')
const BattleRoyaleDBService = require('../services/BattleRoyaleDBService')
const SocketTracker = require('./SocketTracker')
// const FlipService = require('../services/FlipService') // Temporarily disabled for debugging

// ===== CLEAN SERVER ARCHITECTURE =====

// Server handles ALL game logic - clients only send actions and render state

class GameServer {
  constructor(io, dbService) {
    this.io = io
    this.dbService = dbService
    
    // Initialize managers FIRST
    // this.gameManager = new GameManager() // TODO: Not implemented yet - for 1v1 games
    
    // ⚠️ DEPRECATED: Old battle royale system - kept for backward compatibility
    // Current client (test-tubes.html) uses ONLY PhysicsGameManager
    this.battleRoyaleManager = new BattleRoyaleGameManager()
    
    // ✅ ACTIVE: Physics-based game system (current implementation)
    this.physicsGameManager = new PhysicsGameManager()
    
    // this.flipService = new FlipService() // Temporarily disabled for debugging
    this.flipService = null // Placeholder
    
    // Initialize socket tracker for reliable broadcasting
    this.socketTracker = new SocketTracker()
    
    // Then instantiate handlers (FIXED: They are classes, not modules)
    // this.oneVOneHandlers = require('./1v1SocketHandlers') // TODO: Not implemented yet
    const BattleRoyaleSocketHandlersClass = require('./BattleRoyaleSocketHandlers')
    const PhysicsSocketHandlersClass = require('./PhysicsSocketHandlers')
    
    // ⚠️ DEPRECATED: Old handlers - kept for backward compatibility
    this.battleRoyaleHandlers = new BattleRoyaleSocketHandlersClass()
    
    // ✅ ACTIVE: Physics handlers (current implementation)
    this.physicsHandlers = new PhysicsSocketHandlersClass()
    
    this.socketData = new Map() // socketId -> { address, gameId, roomId, role }
    this.userSockets = new Map() // address -> socketId
    this.battleRoyaleRooms = new Map() // gameId -> Set of socketIds
    
    console.log('✅ SocketService: Managers initialized:', {
      battleRoyaleManager: !!this.battleRoyaleManager,
      battleRoyaleHandlers: !!this.battleRoyaleHandlers,
      physicsGameManager: !!this.physicsGameManager,
      physicsHandlers: !!this.physicsHandlers,
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
      socket.on('join_battle_royale_room', safeHandler(async (data) => {
        console.log(`📥 join_battle_royale_room from ${socket.id}`, data)
        const { roomId } = data
        const rawId = roomId.replace('game_', '')
        const isPhysics = rawId.startsWith('physics_') || roomId.includes('physics_')
        const gameId = rawId
        
        // Always join socket.io room for broadcasting, including physics games
        const normalizedRoom = roomId.startsWith('game_') ? roomId : `game_${gameId}`
        socket.join(normalizedRoom)
        this.socketData.set(socket.id, { address: data.address, roomId: normalizedRoom })
        console.log(`✅ ${data.address} joined room ${normalizedRoom}`)
        
        // Track socket for reliable broadcasting
        if (this.socketTracker) {
          this.socketTracker.addSocketToGame(gameId.replace('physics_', ''), socket.id, data.address)
        }
        
        // Physics games: send current physics state immediately if available
        if (isPhysics) {
          console.log(`🎮 Physics game room join: ${gameId}`)
          const state = this.physicsGameManager.getFullGameState(gameId)
          if (state) {
            socket.emit('physics_state_update', state)
          } else {
            // Trigger load via request handler path
            const gameData = await this.dbService.getBattleRoyaleGame(gameId)
            if (gameData) {
              this.physicsGameManager.createPhysicsGame(gameId, gameData)
              const participants = await this.dbService.getBattleRoyaleParticipants(gameId)
              for (const p of participants) { await this.physicsGameManager.addPlayer(gameId, p.player_address, this.dbService) }
              const loadedState = this.physicsGameManager.getFullGameState(gameId)
              if (loadedState) socket.emit('physics_state_update', loadedState)
            }
          }
          return
        }
        
        // Old battle royale games
        return this.battleRoyaleHandlers.handleJoinBattleRoyaleRoom(
          socket, 
          data, 
          this.battleRoyaleManager, 
          this.io,
          this.dbService,
          this.socketTracker
        )
      }))

      socket.on('join_battle_royale', safeHandler(async (data) => {
        console.log(`📥 join_battle_royale from ${socket.id}`, data)
        const { gameId, address } = data || {}
        if (gameId && (gameId.startsWith('physics_') || `${gameId}`.includes('physics_'))) {
          // Physics game join via socket: add player to manager, persist, and broadcast
          const added = await this.physicsGameManager.addPlayer(gameId, address, this.dbService)
          if (added) {
            try {
              await this.dbService.addBattleRoyalePlayer(gameId, {
                player_address: address.toLowerCase(),
                slot_number: this.physicsGameManager.getGame(gameId).currentPlayers,
                entry_paid: !!data?.betAmount,
                entry_payment_hash: data?.payment_hash || null
              })
            } catch (e) {
              console.warn('⚠️ Failed to persist player join (continuing):', e?.message)
            }
            this.physicsGameManager.broadcastState(gameId, (room, event, payload) => {
              this.io.to(room).emit(event, payload)
            })
          } else {
            socket.emit('battle_royale_error', { message: 'Failed to join physics game' })
          }
          return
        }
        return this.battleRoyaleHandlers.handleJoinBattleRoyale(
          socket, 
          data, 
          this.battleRoyaleManager, 
          this.io, 
          this.dbService,
          this.socketTracker
        )
      }))

      // battle_royale_update_coin removed - coin management handled by PhysicsGameManager only

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
                await this.physicsGameManager.addPlayer(gameId, participant.player_address, this.dbService)
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

      // battle_royale_flip_coin removed - coin flipping handled by PhysicsGameManager only

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

      // ===== GLASS TUBE GAME FLIP HANDLERS =====
      // Temporarily disabled for debugging
      /*
      socket.on('request_coin_flip', safeHandler(async (flipRequest) => {
        console.log(`🪙 request_coin_flip from ${socket.id}`, flipRequest)
        try {
          const response = await this.flipService.startFlipSession(flipRequest)
          socket.emit('flip_session_started', response)
          console.log(`✅ Flip session started: ${response.flipId}`)
        } catch (error) {
          console.error('❌ Error starting flip session:', error)
          socket.emit('flip_error', { 
            error: error.message,
            request: flipRequest 
          })
        }
      }))

      socket.on('resolve_flip', safeHandler(async (resolveRequest) => {
        console.log(`🎯 resolve_flip from ${socket.id}`, resolveRequest)
        try {
          const { flipId } = resolveRequest
          if (!flipId) {
            throw new Error('Invalid resolve request: missing flipId')
          }

          const result = await this.flipService.resolveFlipSession(flipId)
          
          // Send result to all players in the game room
          const gameId = result.gameId || 'unknown'
          this.io.to(`game_${gameId}`).emit('coin_flip_result', result)
          
          console.log(`🎲 Flip resolved: ${flipId} -> ${result.result}`)
        } catch (error) {
          console.error('❌ Error resolving flip:', error)
          socket.emit('flip_error', { 
            error: error.message,
            request: resolveRequest 
          })
        }
      }))

      socket.on('verify_flip', safeHandler(async (verifyRequest) => {
        console.log(`🔍 verify_flip from ${socket.id}`, verifyRequest)
        try {
          const { flipId } = verifyRequest
          if (!flipId) {
            throw new Error('Invalid verify request: missing flipId')
          }

          const verification = await this.flipService.verifyFlipResult(flipId)
          socket.emit('flip_verification', verification)
          
          console.log(`✅ Flip verified: ${flipId}`)
        } catch (error) {
          console.error('❌ Error verifying flip:', error)
          socket.emit('flip_error', { 
            error: error.message,
            request: verifyRequest 
          })
        }
      }))
      */

      socket.on('battle_royale_start_early', safeHandler((data) => {
        console.log(`📥 battle_royale_start_early from ${socket.id}`, data)
        const { gameId, address } = data || {}
        // If this is a physics game, route to physics start logic for compatibility with clients
        if (gameId && (gameId.startsWith('physics_') || `${gameId}`.includes('physics_'))) {
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
          return
        }
        return this.battleRoyaleHandlers.handleBattleRoyaleStartEarly(
          socket, 
          data, 
          this.battleRoyaleManager, 
          this.io, 
          this.dbService
        )
      }))

      // ===== PHYSICS GAME ACTIONS =====
      socket.on('physics_join_room', safeHandler((data) => {
        console.log(`🔥 physics_join_room from ${socket.id}`, data)
        return this.physicsHandlers.handleJoinPhysicsRoom(
          socket, 
          data, 
          this.physicsGameManager, 
          this.io,
          this.dbService,
          this.socketTracker
        )
      }))

      socket.on('physics_request_state', safeHandler((data) => {
        console.log(`🔥 physics_request_state from ${socket.id}`, data)
        return this.physicsHandlers.handleRequestPhysicsState(
          socket, 
          data, 
          this.physicsGameManager,
          this.dbService
        )
      }))

      socket.on('physics_join', safeHandler((data) => {
        console.log(`🔥 physics_join from ${socket.id}`, data)
        return this.physicsHandlers.handleJoinPhysics(
          socket, 
          data, 
          this.physicsGameManager, 
          this.io,
          this.dbService,
          this.socketTracker
        )
      }))

      socket.on('physics_set_choice', safeHandler((data) => {
        console.log(`🔥 physics_set_choice from ${socket.id}`, data)
        return this.physicsHandlers.handlePhysicsSetChoice(
          socket, 
          data, 
          this.physicsGameManager, 
          this.io
        )
      }))

      socket.on('physics_flip_coin', safeHandler((data) => {
        console.log(`🔥 physics_flip_coin from ${socket.id}`, data)
        return this.physicsHandlers.handlePhysicsFlipCoin(
          socket, 
          data, 
          this.physicsGameManager, 
          this.io
        )
      }))

      socket.on('physics_update_coin', safeHandler((data) => {
        console.log(`🔥 physics_update_coin from ${socket.id}`, data)
        return this.physicsHandlers.handlePhysicsUpdateCoin(
          socket, 
          data, 
          this.physicsGameManager, 
          this.io,
          this.dbService,
          this.socketTracker
        )
      }))

      socket.on('physics_start_early', safeHandler((data) => {
        console.log(`🔥 physics_start_early from ${socket.id}`, data)
        return this.physicsHandlers.handlePhysicsStartEarly(
          socket, 
          data, 
          this.physicsGameManager, 
          this.io,
          this.dbService
        )
      }))

      socket.on('physics_spectate', safeHandler((data) => {
        console.log(`🔥 physics_spectate from ${socket.id}`, data)
        return this.physicsHandlers.handleSpectatePhysics(
          socket, 
          data, 
          this.physicsGameManager
        )
      }))

      socket.on('physics_update_material', safeHandler((data) => {
        console.log(`🔥 physics_update_material from ${socket.id}`, data)
        return this.physicsHandlers.handlePhysicsUpdateMaterial(
          socket, 
          data, 
          this.physicsGameManager, 
          this.io
        )
      }))

      socket.on('physics_request_update', safeHandler((data) => {
        console.log(`🔥 physics_request_update from ${socket.id}`, data)
        return this.physicsHandlers.handleRequestPhysicsUpdate(
          socket, 
          data, 
          this.physicsGameManager
        )
      }))

      socket.on('physics_charge_power', safeHandler((data) => {
        console.log(`🔥 physics_charge_power from ${socket.id}`, data)
        return this.physicsHandlers.handlePhysicsChargePower(
          socket, 
          data, 
          this.physicsGameManager, 
          this.io
        )
      }))

      socket.on('physics_update_coin_angle', safeHandler((data) => {
        console.log(`🔥 physics_update_coin_angle from ${socket.id}`, data)
        return this.physicsHandlers.handlePhysicsUpdateCoinAngle(
          socket, 
          data, 
          this.physicsGameManager, 
          this.io
        )
      }))

      // Award FLIP tokens for coin flips
      socket.on('award_flip_tokens', safeHandler(async (data) => {
        console.log(`💰 award_flip_tokens from ${socket.id}`, data)
        const { gameId, address, amount, reason } = data
        
        try {
          // Award XP/FLIP tokens using the existing XP service
          const result = await this.xpService.awardSpecialXP(address, reason, amount, gameId)
          
          // Send confirmation back to client
          socket.emit('flip_tokens_awarded', {
            success: true,
            amount: result.xpGained,
            totalXP: result.totalXP,
            message: result.message
          })
          
          console.log(`✅ Awarded ${amount} FLIP tokens to ${address}`)
        } catch (error) {
          console.error('Error awarding FLIP tokens:', error)
          socket.emit('flip_tokens_awarded', {
            success: false,
            error: 'Failed to award FLIP tokens'
          })
        }
      }))

      // Legacy physics events for compatibility
      socket.on('physics_fire_coin', safeHandler((data) => {
        console.log(`🔥 physics_fire_coin (legacy) from ${socket.id}`, data)
        const { gameId, address, angle, power } = data
        this.physicsGameManager.fireCoin(gameId, address, angle, power, (room, event, payload) => {
          this.io.to(room).emit(event, payload)
        })
      }))

      socket.on('physics_start_game', safeHandler((data) => {
        console.log(`🔥 physics_start_game (legacy) from ${socket.id}`)
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
      
      // Skip old handler for physics games - they use request_battle_royale_state instead
      if (!gameId.startsWith('physics_')) {
        this.battleRoyaleHandlers.handleJoinBattleRoyaleRoom(
          socket, 
          { roomId, address }, 
          this.battleRoyaleManager, 
          this.io,
          this.dbService
        )
      }
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