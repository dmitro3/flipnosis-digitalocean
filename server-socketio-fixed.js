const socketIO = require('socket.io')
const PhysicsGameManager = require('../PhysicsGameManager')
const SocketTracker = require('./SocketTracker')
const { FlipCollectionService } = require('../services/FlipCollectionService')

// ===== CLEAN SERVER ARCHITECTURE =====
// Server handles ALL game logic - clients only send actions and render state

class ServerSocketIO {
  constructor(server, dbService) {
    this.io = socketIO(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    })
    
    this.dbService = dbService
    this.physicsManager = new PhysicsGameManager()
    this.socketTracker = new SocketTracker()
    this.flipCollectionService = new FlipCollectionService(dbService)
    
    this.setupSocketHandlers()
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('✅ New connection:', socket.id)
      
      // Physics game handlers
      socket.on('physics_join_room', async (data) => {
        try {
          console.log('🔥 physics_join_room from', socket.id, data)
          await this.handlePhysicsJoinRoom(socket, data)
        } catch (error) {
          console.error('❌ Physics join room error:', error)
          socket.emit('physics_error', { message: 'Failed to join physics room' })
        }
      })
      
      socket.on('physics_join', async (data) => {
        try {
          console.log('🎮 physics_join from', socket.id, data)
          await this.handlePhysicsJoin(socket, data)
        } catch (error) {
          console.error('❌ Physics join error:', error)
          socket.emit('physics_error', { message: 'Failed to join physics game' })
        }
      })
      
      socket.on('physics_set_choice', async (data) => {
        try {
          console.log('🎯 physics_set_choice from', socket.id, data)
          await this.handlePhysicsSetChoice(socket, data)
        } catch (error) {
          console.error('❌ Physics set choice error:', error)
          socket.emit('physics_error', { message: 'Failed to set choice' })
        }
      })
      
      socket.on('physics_power_charging_start', async (data) => {
        try {
          console.log('⚡ physics_power_charging_start from', socket.id, data)
          await this.handlePhysicsPowerChargingStart(socket, data)
        } catch (error) {
          console.error('❌ Physics power charging start error:', error)
          socket.emit('physics_error', { message: 'Failed to start power charging' })
        }
      })
      
      socket.on('physics_power_charging_stop', async (data) => {
        try {
          console.log('⚡ physics_power_charging_stop from', socket.id, data)
          await this.handlePhysicsPowerChargingStop(socket, data)
        } catch (error) {
          console.error('❌ Physics power charging stop error:', error)
          socket.emit('physics_error', { message: 'Failed to stop power charging' })
        }
      })
      
      socket.on('physics_power_charging', async (data) => {
        try {
          await this.handlePhysicsPowerCharging(socket, data)
        } catch (error) {
          console.error('❌ Physics power charging error:', error)
        }
      })
      
      socket.on('physics_flip_coin', async (data) => {
        try {
          console.log('🪙 physics_flip_coin from', socket.id, data)
          await this.handlePhysicsFlipCoin(socket, data)
        } catch (error) {
          console.error('❌ Physics flip coin error:', error)
          socket.emit('physics_error', { message: 'Failed to flip coin' })
        }
      })
      
      // FLIP token handlers
      socket.on('collect_flip_tokens', async (data) => {
        try {
          console.log('💰 collect_flip_tokens from', socket.id, data)
          await this.handleCollectFlipTokens(socket, data)
        } catch (error) {
          console.error('❌ Collect FLIP tokens error:', error)
          socket.emit('flip_collection_created', { success: false, error: error.message })
        }
      })
      
      socket.on('claim_flip_tokens', async (data) => {
        try {
          console.log('💎 claim_flip_tokens from', socket.id, data)
          await this.handleClaimFlipTokens(socket, data)
        } catch (error) {
          console.error('❌ Claim FLIP tokens error:', error)
          socket.emit('flip_tokens_collected', { success: false, error: error.message })
        }
      })
      
      socket.on('claim_nft', async (data) => {
        try {
          console.log('🏆 claim_nft from', socket.id, data)
          await this.handleClaimNFT(socket, data)
        } catch (error) {
          console.error('❌ Claim NFT error:', error)
          socket.emit('nft_prize_claimed', { success: false, error: error.message })
        }
      })
      
      socket.on('disconnect', () => {
        console.log('❌ Disconnected:', socket.id)
        this.socketTracker.removeSocket(socket.id)
      })
    })
  }

  // Physics game handlers
  async handlePhysicsJoinRoom(socket, data) {
    const { roomId, address } = data
    if (!roomId || !address) {
      socket.emit('physics_error', { message: 'Missing roomId or address' })
      return
    }
    
    await this.physicsManager.joinRoom(socket, roomId, address)
  }
  
  async handlePhysicsJoin(socket, data) {
    const { gameId, address } = data
    if (!gameId || !address) {
      socket.emit('physics_error', { message: 'Missing gameId or address' })
      return
    }
    
    await this.physicsManager.joinGame(socket, gameId, address)
  }
  
  async handlePhysicsSetChoice(socket, data) {
    const { gameId, address, choice } = data
    if (!gameId || !address || !choice) {
      socket.emit('physics_error', { message: 'Missing gameId, address, or choice' })
      return
    }
    
    await this.physicsManager.setPlayerChoice(socket, gameId, address, choice)
  }
  
  async handlePhysicsPowerChargingStart(socket, data) {
    const { gameId, address, playerSlot } = data
    if (!gameId || !address || playerSlot === undefined) {
      socket.emit('physics_error', { message: 'Missing gameId, address, or playerSlot' })
      return
    }
    
    await this.physicsManager.startPowerCharging(socket, gameId, address, playerSlot)
  }
  
  async handlePhysicsPowerChargingStop(socket, data) {
    const { gameId, address, playerSlot, finalPower } = data
    if (!gameId || !address || playerSlot === undefined) {
      socket.emit('physics_error', { message: 'Missing gameId, address, or playerSlot' })
      return
    }
    
    await this.physicsManager.stopPowerCharging(socket, gameId, address, playerSlot, finalPower)
  }
  
  async handlePhysicsPowerCharging(socket, data) {
    const { gameId, address, playerSlot, power } = data
    if (!gameId || !address || playerSlot === undefined) {
      return
    }
    
    await this.physicsManager.updatePowerCharging(socket, gameId, address, playerSlot, power)
  }
  
  async handlePhysicsFlipCoin(socket, data) {
    const { gameId, address, playerSlot, power } = data
    if (!gameId || !address || playerSlot === undefined) {
      socket.emit('physics_error', { message: 'Missing gameId, address, or playerSlot' })
      return
    }
    
    await this.physicsManager.flipCoin(socket, gameId, address, playerSlot, power)
  }

  // FLIP token handlers
  async handleCollectFlipTokens(socket, data) {
    const { gameId, address } = data
    if (!gameId || !address) {
      socket.emit('flip_collection_created', { success: false, error: 'Missing gameId or address' })
      return
    }
    
    const result = await this.flipCollectionService.createCollectionSession(gameId, address)
    socket.emit('flip_collection_created', result)
  }
  
  async handleClaimFlipTokens(socket, data) {
    const { collectionId, address } = data
    if (!collectionId || !address) {
      socket.emit('flip_tokens_collected', { success: false, error: 'Missing collectionId or address' })
      return
    }
    
    const result = await this.flipCollectionService.claimFlipTokens(collectionId, address)
    socket.emit('flip_tokens_collected', result)
  }
  
  async handleClaimNFT(socket, data) {
    const { gameId, address } = data
    if (!gameId || !address) {
      socket.emit('nft_prize_claimed', { success: false, error: 'Missing gameId or address' })
      return
    }
    
    const result = await this.flipCollectionService.claimNFTPrize(gameId, address)
    socket.emit('nft_prize_claimed', result)
  }
}

module.exports = ServerSocketIO
