// BattleRoyaleSocketHandlers.js - Enhanced Server-Controlled Battle Royale Socket Handlers
// Handles all Battle Royale socket events with server-controlled game logic

class BattleRoyaleSocketHandlers {
  
  // Join Battle Royale Room
  async handleJoinBattleRoyaleRoom(socket, data, battleRoyaleManager, io) {
    const { roomId, address } = data
    const gameId = roomId.startsWith('br_') ? roomId.substring(3) : roomId
    
    console.log(`🎮 ${address} joining Battle Royale room: ${gameId}`)
    
    // Join socket room
    socket.join(`br_${gameId}`)
    
    // Get or create game
    let game = battleRoyaleManager.getGame(gameId)
    if (!game) {
      // This would normally load from database
      console.log(`❌ Battle Royale game not found: ${gameId}`)
      socket.emit('battle_royale_error', { message: 'Game not found' })
      return
    }
    
    // Send current game state
    const fullState = battleRoyaleManager.getFullGameState(gameId)
    socket.emit('battle_royale_state_update', fullState)
    
    console.log(`✅ ${address} joined Battle Royale room ${gameId}`)
  }


  // Start Power Charging
  async handleBattleRoyaleStartPowerCharge(socket, data, battleRoyaleManager, io) {
    const { gameId, address } = data
    console.log(`⚡ Battle Royale power charge start: ${address} in ${gameId}`)
    
    const success = battleRoyaleManager.startPowerCharging(gameId, address)
    if (!success) {
      socket.emit('battle_royale_error', { message: 'Cannot start power charge' })
      return
    }

    // Start broadcasting power updates
    const powerBroadcastInterval = setInterval(() => {
      const game = battleRoyaleManager.getGame(gameId)
      if (!game) {
        clearInterval(powerBroadcastInterval)
        return
      }
      
      const player = game.players.get(address)
      if (!player || !player.coinState.powerUsed) {
        clearInterval(powerBroadcastInterval)
        return
      }
      
      // Broadcast power update to all players
      battleRoyaleManager.broadcastPowerUpdate(
        gameId, 
        address, 
        player.power,
        (roomId, eventType, eventData) => {
          io.to(roomId).emit(eventType, eventData)
        }
      )
    }, 50) // Update every 50ms for smooth animation
    
    // Store interval reference for cleanup
    socket.data.powerInterval = powerBroadcastInterval
  }

  // Stop Power Charging
  async handleBattleRoyaleStopPowerCharge(socket, data, battleRoyaleManager, io) {
    const { gameId, address, finalPower } = data
    console.log(`⚡ Battle Royale power charge stop: ${address} at ${finalPower} in ${gameId}`)
    
    // Clear power broadcast interval
    if (socket.data.powerInterval) {
      clearInterval(socket.data.powerInterval)
      delete socket.data.powerInterval
    }
    
    const success = battleRoyaleManager.stopPowerCharging(gameId, address, finalPower)
    if (!success) {
      socket.emit('battle_royale_error', { message: 'Cannot stop power charge' })
      return
    }

    // Broadcast final power state
    const roomId = `br_${gameId}`
    const fullState = battleRoyaleManager.getFullGameState(gameId)
    io.to(roomId).emit('battle_royale_state_update', fullState)
  }

  // Execute Flip
  async handleBattleRoyaleExecuteFlip(socket, data, battleRoyaleManager, io) {
    const { gameId, address } = data
    console.log(`🪙 Battle Royale flip execute: ${address} in ${gameId}`)
    
    const success = battleRoyaleManager.executePlayerFlip(
      gameId, 
      address,
      (roomId, eventType, eventData) => {
        io.to(roomId).emit(eventType, eventData)
      }
    )
    
    if (!success) {
      socket.emit('battle_royale_error', { message: 'Cannot execute flip' })
      return
    }

    // Broadcast updated state with coin animation data
    const roomId = `br_${gameId}`
    const fullState = battleRoyaleManager.getFullGameState(gameId)
    io.to(roomId).emit('battle_royale_state_update', fullState)
  }

  // Update Player Coin
  async handleBattleRoyaleUpdateCoin(socket, data, battleRoyaleManager, io) {
    const { gameId, address, coinData } = data
    console.log(`🪙 Battle Royale coin update: ${address} changing coin in ${gameId}`)
    
    const success = battleRoyaleManager.updatePlayerCoin(gameId, address, coinData)
    if (!success) {
      socket.emit('battle_royale_error', { message: 'Cannot update coin' })
      return
    }

    // Broadcast updated state
    const roomId = `br_${gameId}`
    const fullState = battleRoyaleManager.getFullGameState(gameId)
    io.to(roomId).emit('battle_royale_state_update', fullState)
  }

  // Request Game State
  async handleRequestBattleRoyaleState(socket, data, battleRoyaleManager) {
    const { gameId } = data
    console.log(`📊 Battle Royale state requested: ${gameId}`)
    
    const fullState = battleRoyaleManager.getFullGameState(gameId)
    if (fullState) {
      socket.emit('battle_royale_state_update', fullState)
    } else {
      socket.emit('battle_royale_error', { message: 'Game not found' })
    }
  }

  // Join Battle Royale Game (Payment confirmed)
  async handleJoinBattleRoyale(socket, data, battleRoyaleManager, io, dbService) {
    const { gameId, address } = data
    console.log(`🎮 ${address} joining Battle Royale game: ${gameId}`)
    
    // Get or create game
    let game = battleRoyaleManager.getGame(gameId)
    if (!game && dbService) {
      // Try to load from database
      try {
        const gameData = await dbService.getBattleRoyaleGame(gameId)
        if (gameData && gameData.status === 'filling') {
          game = battleRoyaleManager.createBattleRoyale(gameId, gameData)
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
    const success = battleRoyaleManager.addPlayer(gameId, address)
    if (!success) {
      socket.emit('battle_royale_error', { message: 'Cannot join game' })
      return
    }

    // Join room
    const roomId = `br_${gameId}`
    socket.join(roomId)
    
    // Broadcast updated game state to all players
    const fullState = battleRoyaleManager.getFullGameState(gameId)
    io.to(roomId).emit('battle_royale_state_update', fullState)

    // Check if game should start (all 8 players joined)
    if (game.currentPlayers === game.maxPlayers) {
      console.log(`🚀 Battle Royale game ${gameId} is full - starting!`)
      battleRoyaleManager.prepareGameStart(gameId, (roomId, eventType, eventData) => {
        io.to(roomId).emit(eventType, eventData)
      })
    }

    console.log(`✅ ${address} joined Battle Royale ${gameId}`)
  }

  // Spectate Battle Royale
  async handleSpectateBattleRoyale(socket, data, battleRoyaleManager) {
    const { gameId, address } = data
    console.log(`👁️ ${address} spectating Battle Royale: ${gameId}`)
    
    const game = battleRoyaleManager.getGame(gameId)
    if (!game) {
      socket.emit('battle_royale_error', { message: 'Game not found' })
      return
    }

    // Add as spectator
    battleRoyaleManager.addSpectator(gameId, address)
    
    // Join room
    const roomId = `br_${gameId}`
    socket.join(roomId)

    // Send current state
    const fullState = battleRoyaleManager.getFullGameState(gameId)
    socket.emit('battle_royale_state_update', fullState)
  }

  // Start Battle Royale Early
  async handleBattleRoyaleStartEarly(socket, data, battleRoyaleManager, io) {
    const { gameId, address } = data
    console.log(`🚀 ${address} requesting early start for Battle Royale: ${gameId}`)
    console.log(`🚀 Data received:`, data)
    
    const game = battleRoyaleManager.getGame(gameId)
    if (!game) {
      console.log(`❌ Game not found: ${gameId}`)
      socket.emit('battle_royale_error', { message: 'Game not found' })
      return
    }

    console.log(`🎮 Game found - Creator: ${game.creator}, Requester: ${address}, Phase: ${game.phase}`)

    // Check if requester is the creator
    if (game.creator.toLowerCase() !== address.toLowerCase()) {
      console.log(`❌ Not creator - Creator: ${game.creator}, Requester: ${address}`)
      socket.emit('battle_royale_error', { message: 'Only the creator can start the game early' })
      return
    }

    // Start the game early
    const success = battleRoyaleManager.startGameEarly(gameId, (roomId, eventType, eventData) => {
      console.log(`📡 Broadcasting ${eventType} to ${roomId}`)
      io.to(roomId).emit(eventType, eventData)
    })

    if (success) {
      console.log(`✅ Battle Royale ${gameId} started early by ${address}`)
    } else {
      console.log(`❌ Failed to start game early`)
      socket.emit('battle_royale_error', { message: 'Failed to start game early' })
    }
  }

}

module.exports = BattleRoyaleSocketHandlers
