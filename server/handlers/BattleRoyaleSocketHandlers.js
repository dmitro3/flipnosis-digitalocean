// BattleRoyaleSocketHandlers.js - Clean socket event handlers

class BattleRoyaleSocketHandlers {
  // Join room and request state
  async handleJoinBattleRoyaleRoom(socket, data, gameManager, io, dbService) {
    const { roomId, address } = data
    const gameId = roomId.startsWith('game_') ? roomId.substring(5) : roomId
    
    console.log(`🏠 ${address} joining room: ${gameId}`)
    console.log(`🔌 Socket ID: ${socket.id}`)
    
    socket.join(`game_${gameId}`)
    
    console.log(`✅ Socket ${socket.id} joined room game_${gameId}`)
    console.log(`📡 Room game_${gameId} now has ${io.sockets.adapter.rooms.get(`game_${gameId}`)?.size || 0} sockets`)
    
    // Load game from DB if not in memory
    let game = await gameManager.loadGameFromDatabase(gameId, dbService)
    
    if (!game) {
      console.log(`❌ Game not found: ${gameId}`)
      socket.emit('battle_royale_error', { message: 'Game not found' })
      return
    }
    
    // Send current state
    const state = gameManager.getFullGameState(gameId)
    socket.emit('battle_royale_state_update', state)
    
    console.log(`✅ ${address} joined room game_${gameId}`)
  }

  // Request state
  async handleRequestBattleRoyaleState(socket, data, gameManager, dbService) {
    const { gameId } = data
    console.log(`📊 Requesting state for: ${gameId}`)
    
    // Load game from DB if not in memory
    let game = await gameManager.loadGameFromDatabase(gameId, dbService)
    
    if (!game) {
      console.log(`❌ Game not found: ${gameId}`)
      socket.emit('battle_royale_error', { message: 'Game not found' })
      return
    }
    
    // Get and send state
    const state = gameManager.getFullGameState(gameId)
    if (state) {
      console.log(`✅ Sending state for ${gameId} - Phase: ${state.phase}, Players: ${state.currentPlayers}`)
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
    
    // Load game from DB if not in memory
    let game = await gameManager.loadGameFromDatabase(gameId, dbService)
    
    if (!game) {
      console.log(`❌ Game not found: ${gameId}`)
      socket.emit('battle_royale_error', { message: 'Game not found' })
      return
    }
    
    console.log(`🎮 Game loaded, current players before join: ${game.currentPlayers}`)
    console.log(`🎮 Current player slots before join:`, game.playerSlots)
    
    // Join the room BEFORE adding player
    socket.join(roomId)
    console.log(`🏠 ${address} joined socket room ${roomId}`)
    console.log(`📡 Room now has ${io.sockets.adapter.rooms.get(roomId)?.size || 0} sockets`)
    
    // Add player to game
    const success = gameManager.addPlayer(gameId, address)
    if (success) {
      // Get updated state
      const state = gameManager.getFullGameState(gameId)
      console.log(`📊 Updated game state: ${state.currentPlayers} players`)
      console.log(`📊 Player slots:`, state.playerSlots)
      console.log(`📊 Players:`, Object.keys(state.players))
      
      // Broadcast to ALL players in the room (including the joiner)
      console.log(`📡 Broadcasting updated state to ALL players in room ${roomId}`)
      io.to(roomId).emit('battle_royale_state_update', state)
      
      console.log(`✅ ${address} joined game successfully, new player count: ${state.currentPlayers}`)
    } else {
      console.log(`❌ Failed to add player ${address} to game ${gameId}`)
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
  async handleBattleRoyaleUpdateCoin(socket, data, gameManager, io, dbService = null) {
    const { gameId, address, coin, coinData } = data
    console.log(`🪙 ${address} updating coin in game ${gameId}`)
    console.log(`🔌 Socket ID: ${socket.id}`)
    
    // Handle both parameter names for compatibility
    const coinToUpdate = coin || coinData
    console.log(`🪙 Coin data:`, coinToUpdate)
    
    const roomId = `game_${gameId}`
    
    // Check if THIS socket is in the room
    const socketRooms = Array.from(socket.rooms)
    console.log(`🔍 Socket ${socket.id} is in rooms:`, socketRooms)
    console.log(`🔍 Looking for room: ${roomId}`)
    
    if (!socketRooms.includes(roomId)) {
      console.log(`⚠️ Socket ${socket.id} is NOT in room ${roomId}, joining now...`)
      socket.join(roomId)
      console.log(`✅ Socket ${socket.id} joined room ${roomId}`)
    }
    
    const success = await gameManager.updatePlayerCoin(gameId, address, coinToUpdate, dbService)
    if (success) {
      // Broadcast updated state to ALL players in the room
      const state = gameManager.getFullGameState(gameId)
      
      console.log(`📊 Updated coin for ${address} to ${coinToUpdate?.name || 'unknown'}`)
      console.log(`📡 Broadcasting coin update to room ${roomId}`)
      
      const room = io.sockets.adapter.rooms.get(roomId)
      console.log(`📡 Room ${roomId} has ${room?.size || 0} sockets`)
      if (room) {
        console.log(`📡 Socket IDs in room:`, Array.from(room))
      }
      console.log(`📊 State has ${state.currentPlayers} players:`, Object.keys(state.players))
      
      // Broadcast to everyone in the room
      io.to(roomId).emit('battle_royale_state_update', state)
      
      console.log(`✅ Coin update broadcasted successfully`)
    } else {
      console.log(`❌ Failed to update coin for ${address}`)
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