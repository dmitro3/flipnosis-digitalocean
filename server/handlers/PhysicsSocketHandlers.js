/**
 * Physics Socket Handlers - Server-Side Test Tubes Game
 * Handles all socket events for the server-side physics game
 */

class PhysicsSocketHandlers {
  // Join room and request state
  async handleJoinPhysicsRoom(socket, data, gameManager, io, dbService, socketTracker) {
    const { roomId, address } = data
    const gameId = roomId.startsWith('game_') ? roomId.substring(5) : roomId
    
    console.log(`🏠 ${address} joining physics room: ${gameId}`)
    console.log(`🔌 Socket ID: ${socket.id}`)
    
    // Join both socket.io room AND our tracking system
    socket.join(`game_${gameId}`)
    
    // Track this socket in our game tracker
    if (socketTracker) {
      socketTracker.addSocketToGame(gameId, socket.id, address)
      console.log(`✅ Socket ${socket.id} tracked for physics game ${gameId}`)
      console.log(`📊 Game ${gameId} now has ${socketTracker.getGameSockets(gameId)?.size || 0} tracked sockets`)
    }
    
    console.log(`✅ Socket ${socket.id} joined room game_${gameId}`)
    console.log(`📡 Room game_${gameId} now has ${io.sockets.adapter.rooms.get(`game_${gameId}`)?.size || 0} sockets`)
    
    // Load game from DB if not in memory
    let game = await gameManager.loadGameFromDatabase(gameId, dbService)
    
    if (!game) {
      console.log(`❌ Game not found: ${gameId}`)
      socket.emit('physics_error', { message: 'Game not found' })
      return
    }
    
    // Send current state
    const state = gameManager.getFullGameState(gameId)
    socket.emit('physics_state_update', state)
    
    console.log(`✅ ${address} joined physics room game_${gameId}`)
  }

  // Request state
  async handleRequestPhysicsState(socket, data, gameManager, dbService) {
    const { gameId } = data
    console.log(`📊 Requesting physics state for: ${gameId}`)
    
    // Load game from DB if not in memory
    let game = await gameManager.loadGameFromDatabase(gameId, dbService)
    
    if (!game) {
      console.log(`❌ Game not found: ${gameId}`)
      socket.emit('physics_error', { message: 'Game not found' })
      return
    }
    
    // Get and send state
    const state = gameManager.getFullGameState(gameId)
    if (state) {
      console.log(`✅ Sending physics state for ${gameId} - Phase: ${state.phase}, Players: ${state.currentPlayers}`)
      socket.emit('physics_state_update', state)
    } else {
      socket.emit('physics_error', { message: 'Game not found' })
    }
  }

  // Player joins game (after payment)
  async handleJoinPhysics(socket, data, gameManager, io, dbService, socketTracker) {
    const { gameId, address } = data
    console.log(`🎮 ${address} joining physics game: ${gameId}`)
    console.log(`🔌 Socket ID: ${socket.id}`)
    
    const roomId = `game_${gameId}`
    
    // Load game from DB if not in memory
    let game = await gameManager.loadGameFromDatabase(gameId, dbService)
    
    if (!game) {
      console.log(`❌ Game not found: ${gameId}`)
      socket.emit('physics_error', { message: 'Game not found' })
      return
    }
    
    console.log(`🎮 Physics game loaded, current players before join: ${game.currentPlayers}`)
    console.log(`🎮 Current player slots before join:`, game.playerSlots)
    
    // Join the room BEFORE adding player
    socket.join(roomId)
    console.log(`🏠 ${address} joined socket room ${roomId}`)
    
    // ALSO add to socket tracker
    if (socketTracker) {
      socketTracker.addSocketToGame(gameId, socket.id, address)
      console.log(`✅ Socket ${socket.id} added to tracker for physics game ${gameId}`)
    }
    
    console.log(`📡 Room now has ${io.sockets.adapter.rooms.get(roomId)?.size || 0} sockets`)
    
    // Add player to game
    const success = await gameManager.addPlayer(gameId, address, dbService)
    if (success) {
      // Get updated state
      const state = gameManager.getFullGameState(gameId)
      console.log(`📊 Updated physics game state: ${state.currentPlayers} players`)
      console.log(`📊 Player slots:`, state.playerSlots)
      console.log(`📊 Players:`, Object.keys(state.players))
      
      // Broadcast using tracker
      console.log(`📡 Broadcasting updated state to ALL players`)
      if (socketTracker) {
        const gameSockets = socketTracker.getGameSockets(gameId)
        console.log(`📡 Tracker has ${gameSockets?.size || 0} sockets for physics game ${gameId}`)
        if (gameSockets) {
          gameSockets.forEach(socketId => {
            const targetSocket = io.sockets.sockets.get(socketId)
            if (targetSocket) {
              targetSocket.emit('physics_state_update', state)
              console.log(`✅ Sent physics join update to socket ${socketId}`)
            }
          })
        }
      } else {
        io.to(roomId).emit('physics_state_update', state)
      }
      
      console.log(`✅ ${address} joined physics game successfully, new player count: ${state.currentPlayers}`)
    } else {
      console.log(`❌ Failed to add player ${address} to physics game ${gameId}`)
      socket.emit('physics_error', { message: 'Failed to join game' })
    }
  }

  // Player sets choice (heads/tails)
  async handlePhysicsSetChoice(socket, data, gameManager, io) {
    const { gameId, address, choice } = data
    console.log(`🎯 ${address} chose ${choice} in physics game`)
    
    const success = gameManager.setChoice(gameId, address, choice)
    if (success) {
      // Also update physics engine
      const game = gameManager.getGame(gameId)
      if (game && game.players[address.toLowerCase()]) {
        const player = game.players[address.toLowerCase()]
        gameManager.physicsEngine.updatePlayerChoice(gameId, player.slotNumber, choice)
        
        // Broadcast choice update to all players immediately for responsive UI
        io.to(`game_${gameId}`).emit('player_choice_update', {
          address: address,
          playerSlot: player.slotNumber,
          choice: choice,
          gameId: gameId
        })
        console.log(`📢 Broadcasting choice update for player ${player.slotNumber}: ${choice}`)
      }
      
      // Broadcast updated state
      const state = gameManager.getFullGameState(gameId)
      io.to(`game_${gameId}`).emit('physics_state_update', state)
    } else {
      socket.emit('physics_error', { message: 'Cannot make choice now' })
    }
  }

  // Player flips coin with server-side physics
  async handlePhysicsFlipCoin(socket, data, gameManager, io) {
    const { gameId, address, power, angle = 0 } = data
    console.log(`🪙 ${address} flipping coin with power ${power} in physics game`)
    
    // Validate power range
    if (power < 0 || power > 100) {
      socket.emit('physics_error', { message: 'Invalid power level' })
      return
    }
    
    const success = gameManager.serverFlipCoin(gameId, address, null, power, angle, (room, event, payload) => {
      io.to(room).emit(event, payload)
    })
    
    if (!success) {
      socket.emit('physics_error', { message: 'Cannot flip coin now' })
    }
  }

  // Update coin selection
  async handlePhysicsUpdateCoin(socket, data, gameManager, io, dbService = null, socketTracker = null) {
    const { gameId, address, coin, coinData } = data
    console.log(`\n${'='.repeat(60)}`)
    console.log(`🪙 PHYSICS COIN UPDATE REQUEST`)
    console.log(`Game ID: ${gameId}`)
    console.log(`Address: ${address}`)
    console.log(`Socket ID: ${socket.id}`)
    console.log(`Coin: ${(coin || coinData)?.name}`)
    
    // Handle both parameter names for compatibility
    const coinToUpdate = coin || coinData
    
    // Check if socketTracker exists
    console.log(`📊 SocketTracker available: ${!!socketTracker}`)
    if (socketTracker) {
      console.log(`📊 Tracker stats:`, socketTracker.getStats())
    }
    
    const success = await gameManager.updatePlayerCoin(gameId, address, coinToUpdate, dbService)
    if (success) {
      // Broadcast updated state
      const state = gameManager.getFullGameState(gameId)
      
      console.log(`✅ Coin updated in physics game state`)
      console.log(`📊 State has ${state.currentPlayers} players:`, Object.keys(state.players))
      console.log(`📊 Player ${address.slice(0, 8)}... now has coin:`, state.players[address.toLowerCase()]?.coin?.name)
      
      // Get player slot for coin update broadcast
      const game = gameManager.getGame(gameId)
      let playerSlot = -1
      if (game && game.players) {
        const normalizedAddress = address.toLowerCase()
        const player = game.players[normalizedAddress]
        if (player) {
          playerSlot = player.slotNumber || 0
        }
      }
      
      // Use our socket tracker for direct broadcast
      if (socketTracker) {
        const gameSockets = socketTracker.getGameSockets(gameId)
        console.log(`📡 Tracker has ${gameSockets?.size || 0} sockets for this physics game`)
        
        if (gameSockets && gameSockets.size > 0) {
          console.log(`📡 Socket IDs in tracker:`, Array.from(gameSockets))
          
          let successCount = 0
          gameSockets.forEach(socketId => {
            const targetSocket = io.sockets.sockets.get(socketId)
            if (targetSocket) {
              // Send both state update and specific coin update
              targetSocket.emit('physics_state_update', state)
              targetSocket.emit('coin_update', {
                gameId: gameId,
                playerAddress: address,
                playerSlot: playerSlot,
                coinData: coinToUpdate
              })
              console.log(`✅ Sent physics coin update to socket ${socketId}`)
              successCount++
            } else {
              console.log(`⚠️ Socket ${socketId} no longer exists, removing from tracker`)
              socketTracker.removeSocketFromGame(gameId, socketId)
            }
          })
          console.log(`📡 Successfully sent to ${successCount}/${gameSockets.size} sockets`)
        } else {
          console.log(`⚠️ WARNING: No sockets tracked for this physics game!`)
          console.log(`⚠️ Falling back to room-based broadcast`)
          const roomId = `game_${gameId}`
          io.to(roomId).emit('physics_state_update', state)
          io.to(roomId).emit('coin_update', {
            gameId: gameId,
            playerAddress: address,
            playerSlot: playerSlot,
            coinData: coinToUpdate
          })
        }
      } else {
        console.log(`⚠️ WARNING: SocketTracker not available!`)
        console.log(`⚠️ Falling back to room-based broadcast`)
        const roomId = `game_${gameId}`
        io.to(roomId).emit('physics_state_update', state)
        io.to(roomId).emit('coin_update', {
          gameId: gameId,
          playerAddress: address,
          playerSlot: playerSlot,
          coinData: coinToUpdate
        })
        console.log(`📡 Broadcasted to room ${roomId}`)
      }
      
      console.log(`✅ Physics coin update broadcast complete`)
      console.log(`${'='.repeat(60)}\n`)
    } else {
      console.log(`❌ Failed to update coin for ${address}`)
      console.log(`${'='.repeat(60)}\n`)
      socket.emit('physics_error', { message: 'Cannot update coin' })
    }
  }

  // Start game early
  async handlePhysicsStartEarly(socket, data, gameManager, io, dbService) {
    const { gameId, address } = data
    console.log(`🚀 ${address} starting physics game early: ${gameId}`)
    
    const game = gameManager.getGame(gameId)
    if (!game) {
      socket.emit('physics_error', { message: 'Game not found' })
      return
    }
    
    // Verify creator
    if (game.creator?.toLowerCase() !== address?.toLowerCase()) {
      socket.emit('physics_error', { message: 'Only creator can start early' })
      return
    }
    
    // Verify minimum players
    if (game.currentPlayers < 2) {
      socket.emit('physics_error', { message: 'Need at least 2 players' })
      return
    }
    
    // Start game
    const success = gameManager.startGame(gameId, (room, event, data) => {
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

  // Spectate physics game
  async handleSpectatePhysics(socket, data, gameManager) {
    const { gameId, address } = data
    console.log(`👁️ ${address} spectating physics game: ${gameId}`)
    
    const game = gameManager.getGame(gameId)
    if (!game) {
      socket.emit('physics_error', { message: 'Game not found' })
      return
    }
    
    // Send current state for spectating
    const state = gameManager.getFullGameState(gameId)
    socket.emit('physics_state_update', state)
    
    console.log(`✅ ${address} spectating physics game ${gameId}`)
  }

  // Update material for game
  async handlePhysicsUpdateMaterial(socket, data, gameManager, io) {
    const { gameId, address, material } = data
    console.log(`💎 ${address} updating material to ${material} for game ${gameId}`)
    
    const game = gameManager.getGame(gameId)
    if (!game) {
      socket.emit('physics_error', { message: 'Game not found' })
      return
    }
    
    // Verify creator
    if (game.creator?.toLowerCase() !== address?.toLowerCase()) {
      socket.emit('physics_error', { message: 'Only creator can change material' })
      return
    }
    
    const success = gameManager.updateGameMaterial(gameId, material)
    if (success) {
      // Broadcast updated state
      const state = gameManager.getFullGameState(gameId)
      io.to(`game_${gameId}`).emit('physics_state_update', state)
      
      console.log(`✅ Material updated to ${material} for game ${gameId}`)
    } else {
      socket.emit('physics_error', { message: 'Invalid material' })
    }
  }

  // Request physics update (for real-time physics state)
  async handleRequestPhysicsUpdate(socket, data, gameManager) {
    const { gameId } = data
    console.log(`🔄 Requesting physics update for: ${gameId}`)
    
    const state = gameManager.getFullGameState(gameId)
    if (state) {
      socket.emit('physics_state_update', state)
    } else {
      socket.emit('physics_error', { message: 'Game not found' })
    }
  }

  // Handle power charging (for visual feedback)
  async handlePhysicsChargePower(socket, data, gameManager, io) {
    const { gameId, address, power } = data
    console.log(`⚡ ${address} charging power to ${power}%`)
    
    // Get player slot from game state
    const game = gameManager.getGame(gameId)
    let playerSlot = -1
    if (game && game.players) {
      const normalizedAddress = address.toLowerCase()
      const player = game.players[normalizedAddress]
      if (player) {
        playerSlot = player.slotNumber || 0
      }
    }
    
    // Broadcast power charging to all clients for visual feedback
    io.to(`game_${gameId}`).emit('physics_power_charging', {
      gameId: gameId,
      playerAddress: address,
      playerSlot: playerSlot,
      power: power
    })
  }

  // Handle coin angle adjustment
  async handlePhysicsUpdateCoinAngle(socket, data, gameManager, io) {
    const { gameId, address, angle } = data
    console.log(`🎯 ${address} setting coin angle to ${angle}°`)
    
    // Broadcast angle update to all clients for visual feedback
    io.to(`game_${gameId}`).emit('physics_coin_angle_update', {
      gameId: gameId,
      playerAddress: address,
      angle: angle
    })
  }
}

module.exports = PhysicsSocketHandlers
