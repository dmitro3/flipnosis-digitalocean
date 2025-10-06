// BattleRoyaleSocketHandlers.js - Clean socket event handlers

class BattleRoyaleSocketHandlers {
  // Join room and request state
  async handleJoinBattleRoyaleRoom(socket, data, gameManager, io, dbService) {
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
  async handleRequestBattleRoyaleState(socket, data, gameManager) {
    const { gameId } = data
    const state = gameManager.getFullGameState(gameId)
    
    if (state) {
      socket.emit('battle_royale_state_update', state)
    } else {
      socket.emit('battle_royale_error', { message: 'Game not found' })
    }
  }

  // Player joins game (after payment)
  async handleJoinBattleRoyale(socket, data, gameManager, io, dbService) {
    const { gameId, address } = data
    console.log(`🎮 ${address} joining game: ${gameId}`)
    
    const roomId = `game_${gameId}`
    socket.join(roomId)
    
    // Load game from DB if not in memory
    let game = gameManager.getGame(gameId)
    if (!game && dbService) {
      try {
        const gameData = await dbService.getBattleRoyaleGame(gameId)
        if (gameData && gameData.status === 'filling') {
          game = gameManager.createBattleRoyale(gameId, gameData, dbService)
          console.log(`🔍 Game loaded from database: ${gameId}`)
        }
      } catch (error) {
        console.error('Error loading game:', error)
      }
    }
    
    if (!game) {
      socket.emit('battle_royale_error', { message: 'Game not found' })
      return
    }
    
    // Add player to game
    const success = gameManager.addPlayer(gameId, address)
    if (success) {
      // Send state to the joining player first
      const state = gameManager.getFullGameState(gameId)
      socket.emit('battle_royale_state_update', state)
      
      // Then broadcast to all players in the room
      io.to(roomId).emit('battle_royale_state_update', state)
      
      console.log(`✅ ${address} joined game successfully`)
    } else {
      socket.emit('battle_royale_error', { message: 'Failed to join game' })
    }
  }

  // Player makes choice
  async handleBattleRoyalePlayerChoice(socket, data, gameManager, io) {
    const { gameId, address, choice } = data
    console.log(`🎯 ${address} chose ${choice}`)
    
    const success = gameManager.setPlayerChoice(gameId, address, choice)
    if (success) {
      // Broadcast updated state
      const state = gameManager.getFullGameState(gameId)
      io.to(`game_${gameId}`).emit('battle_royale_state_update', state)
    } else {
      socket.emit('battle_royale_error', { message: 'Cannot make choice now' })
    }
  }

  // Player flips coin
  async handleBattleRoyaleFlipCoin(socket, data, gameManager, io) {
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
  async handleBattleRoyaleUpdateCoin(socket, data, gameManager, io) {
    const { gameId, address, coin } = data
    console.log(`🪙 ${address} updating coin`)
    
    const success = gameManager.updatePlayerCoin(gameId, address, coin)
    if (success) {
      // Broadcast updated state
      const state = gameManager.getFullGameState(gameId)
      io.to(`game_${gameId}`).emit('battle_royale_state_update', state)
    } else {
      socket.emit('battle_royale_error', { message: 'Cannot update coin' })
    }
  }

  // Start game early
  async handleBattleRoyaleStartEarly(socket, data, gameManager, io, dbService) {
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

  // Spectate Battle Royale
  async handleSpectateBattleRoyale(socket, data, gameManager) {
    const { gameId, address } = data
    console.log(`👁️ ${address} spectating: ${gameId}`)
    
    const game = gameManager.getGame(gameId)
    if (!game) {
      socket.emit('battle_royale_error', { message: 'Game not found' })
      return
    }
    
    // Send current state for spectating
    const state = gameManager.getFullGameState(gameId)
    socket.emit('battle_royale_state_update', state)
    
    console.log(`✅ ${address} spectating game ${gameId}`)
  }
}

module.exports = BattleRoyaleSocketHandlers