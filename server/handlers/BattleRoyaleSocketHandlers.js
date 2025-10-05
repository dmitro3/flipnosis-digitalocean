// BattleRoyaleSocketHandlers.js - Clean socket event handlers

class BattleRoyaleSocketHandlers {
  // Join room and request state
  async handleJoinRoom(socket, data, gameManager, io, dbService) {
    const { roomId, address } = data
    const gameId = roomId.startsWith('game_') ? roomId.substring(5) : roomId
    
    console.log(`🏠 ${address} joining room: ${gameId}`)
    
    socket.join(`game_${gameId}`)
    
    // Load game from DB if not in memory
    let game = gameManager.getGame(gameId)
    if (!game && dbService) {
      try {
        const gameData = await dbService.getBattleRoyaleGame(gameId)
        if (gameData) {
          game = gameManager.createBattleRoyale(gameId, gameData, dbService)
        }
      } catch (error) {
        console.error('Error loading game:', error)
      }
    }
    
    if (!game) {
      socket.emit('battle_royale_error', { message: 'Game not found' })
      return
    }
    
    // Send current state
    const state = gameManager.getFullGameState(gameId)
    socket.emit('battle_royale_state_update', state)
    
    console.log(`✅ ${address} joined room game_${gameId}`)
  }

  // Request state
  async handleRequestState(socket, data, gameManager) {
    const { gameId } = data
    const state = gameManager.getFullGameState(gameId)
    
    if (state) {
      socket.emit('battle_royale_state_update', state)
    } else {
      socket.emit('battle_royale_error', { message: 'Game not found' })
    }
  }

  // Player joins game (after payment)
  async handleJoinGame(socket, data, gameManager, io, dbService) {
    const { gameId, address } = data
    console.log(`🎮 ${address} joining game: ${gameId}`)
    
    const roomId = `game_${gameId}`
    socket.join(roomId)
    
    // Load game if needed
    let game = gameManager.getGame(gameId)
    if (!game && dbService) {
      try {
        const gameData = await dbService.getBattleRoyaleGame(gameId)
        if (gameData && gameData.status === 'filling') {
          game = gameManager.createBattleRoyale(gameId, gameData, dbService)
        }
      } catch (error) {
        console.error('Error loading game:', error)
      }
    }
    
    if (!game) {
      socket.emit('battle_royale_error', { message: 'Game not found' })
      return
    }
    
    // Add player
    const success = gameManager.addPlayer(gameId, address)
    if (!success) {
      socket.emit('battle_royale_error', { message: 'Cannot join game' })
      return
    }
    
    // Broadcast updated state
    gameManager.broadcastState(gameId, (room, event, data) => {
      io.to(room).emit(event, data)
    })
    
    // Auto-start if full
    if (game.readyToStart) {
      setTimeout(() => {
        gameManager.prepareGameStart(gameId, (room, event, data) => {
          io.to(room).emit(event, data)
        })
      }, 1000)
    }
    
    console.log(`✅ ${address} joined game`)
  }

  // Player makes choice
  async handlePlayerChoice(socket, data, gameManager, io) {
    const { gameId, address, choice } = data
    console.log(`🎯 ${address} chose ${choice}`)
    
    const success = gameManager.setPlayerChoice(gameId, address, choice)
    if (success) {
      gameManager.broadcastState(gameId, (room, event, data) => {
        io.to(room).emit(event, data)
      })
    } else {
      socket.emit('battle_royale_error', { message: 'Cannot make choice now' })
    }
  }

  // Player flips coin
  async handleFlipCoin(socket, data, gameManager, io) {
    const { gameId, address } = data
    console.log(`🪙 ${address} flipping coin`)
    
    const success = gameManager.executePlayerFlip(gameId, address, (room, event, data) => {
      io.to(room).emit(event, data)
    })
    
    if (!success) {
      socket.emit('battle_royale_error', { message: 'Cannot flip coin now' })
    }
  }

  // Update coin
  async handleUpdateCoin(socket, data, gameManager, io) {
    const { gameId, address, coin } = data
    console.log(`🪙 ${address} updating coin`)
    
    const success = gameManager.updatePlayerCoin(gameId, address, coin)
    if (success) {
      gameManager.broadcastState(gameId, (room, event, data) => {
        io.to(room).emit(event, data)
      })
      socket.emit('battle_royale_coin_updated', { success: true, coin })
    } else {
      socket.emit('battle_royale_error', { message: 'Cannot update coin' })
    }
  }

  // Start game early
  async handleStartEarly(socket, data, gameManager, io, dbService) {
    const { gameId, address } = data
    console.log(`🚀 ${address} starting game early: ${gameId}`)
    
    const game = gameManager.getGame(gameId)
    if (!game) {
      socket.emit('battle_royale_error', { message: 'Game not found' })
      return
    }
    
    // Verify creator
    if (game.creator?.toLowerCase() !== address?.toLowerCase()) {
      socket.emit('battle_royale_error', { message: 'Only creator can start early' })
      return
    }
    
    // Verify minimum players
    if (game.currentPlayers < 2) {
      socket.emit('battle_royale_error', { message: 'Need at least 2 players' })
      return
    }
    
    // Start game
    const success = gameManager.prepareGameStart(gameId, (room, event, data) => {
      io.to(room).emit(event, data)
    })
    
    if (success && dbService) {
      try {
        await dbService.updateBattleRoyaleStatus(gameId, 'active', game.currentPlayers)
      } catch (error) {
        console.error('Failed to update DB:', error)
      }
    }
  }
}

module.exports = BattleRoyaleSocketHandlers