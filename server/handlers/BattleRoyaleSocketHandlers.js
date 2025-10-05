// BattleRoyaleSocketHandlers.js - Enhanced Server-Controlled Battle Royale Socket Handlers
// Handles all Battle Royale socket events with server-controlled game logic

class BattleRoyaleSocketHandlers {
  constructor() {
    this.pendingRequests = new Map()
  }

  // Join Battle Royale Room
  async handleJoinBattleRoyaleRoom(socket, data, battleRoyaleManager, io, dbService) {
    const { roomId, address } = data
    const gameId = roomId.startsWith('game_') ? roomId.substring(5) : roomId
    
    console.log(`🎮 ${address} joining Battle Royale room: ${gameId}`)
    
    // Join socket room
    socket.join(`game_${gameId}`)
    
    // Get or load game from database
    let game = battleRoyaleManager.getGame(gameId)
    if (!game && dbService) {
      console.log(`🔄 Loading Battle Royale game from database: ${gameId}`)
      try {
        const gameData = await dbService.getBattleRoyaleGame(gameId)
        if (gameData) {
          console.log(`✅ Game data loaded from DB:`, {
            creator: gameData.creator,
            status: gameData.status,
            currentPlayers: gameData.current_players,
            creatorParticipates: gameData.creator_participates
          })
          
          // Create game in memory
          game = battleRoyaleManager.createBattleRoyale(gameId, gameData, dbService)
          
          // Load participants from database
          if (dbService.getBattleRoyaleParticipants) {
            try {
              const participants = await dbService.getBattleRoyaleParticipants(gameId)
              console.log(`✅ Loaded ${participants.length} participants from database`)
              
              // Add participants to game state
              for (const participant of participants) {
                if (participant.player_address !== gameData.creator) {
                  battleRoyaleManager.addPlayer(gameId, participant.player_address, participant.slot_number)
                  console.log(`✅ Added participant ${participant.player_address} to slot ${participant.slot_number}`)
                }
              }
            } catch (error) {
              console.error('❌ Error loading participants:', error)
            }
          }
        }
      } catch (error) {
        console.error('❌ Error loading Battle Royale game:', error)
      }
    }
    
    if (!game) {
      console.log(`❌ Battle Royale game not found: ${gameId}`)
      socket.emit('battle_royale_error', { message: 'Game not found' })
      return
    }
    
    // Send current game state
    const fullState = battleRoyaleManager.getFullGameState(gameId)
    socket.emit('battle_royale_state_update', fullState)
    
    console.log(`✅ ${address} joined Battle Royale room game_${gameId}`)
  }

  // Player Choice Handler - SIMPLIFIED
  async handleBattleRoyalePlayerChoice(socket, data, battleRoyaleManager, io) {
    const { gameId, address, choice } = data
    console.log(`🎯 Battle Royale choice: ${address} chose ${choice}`)
    
    const success = battleRoyaleManager.setPlayerChoice(gameId, address, choice)
    if (!success) {
      socket.emit('battle_royale_error', { message: 'Cannot make choice now' })
      return
    }

    const roomId = `game_${gameId}`
    const fullState = battleRoyaleManager.getFullGameState(gameId)
    io.to(roomId).emit('battle_royale_state_update', fullState)
    
    io.to(roomId).emit('battle_royale_player_chose', {
      gameId,
      playerAddress: address,
      hasChosen: true
    })
  }



  // Execute Flip - SIMPLIFIED (no power charging)
  async handleBattleRoyaleExecuteFlip(socket, data, battleRoyaleManager, io) {
    const { gameId, address } = data
    console.log(`🪙 Battle Royale flip execute: ${address}`)
    
    const game = battleRoyaleManager.getGame(gameId)
    if (!game) {
      socket.emit('battle_royale_error', { message: 'Game not found' })
      return
    }

    const player = game.players.get(address)
    if (!player) {
      socket.emit('battle_royale_error', { message: 'Player not found' })
      return
    }
    
    const success = battleRoyaleManager.executePlayerFlip(gameId, address, (roomId, eventType, eventData) => {
      io.to(`game_${gameId}`).emit(eventType, eventData)
    })

    if (!success) {
      socket.emit('battle_royale_error', { message: 'Cannot flip coin now' })
    }
  }

  // Update Player Coin
  async handleBattleRoyaleUpdateCoin(socket, data, battleRoyaleManager, io) {
    try {
      const { gameId, address, coin } = data
      console.log('🪙 Battle Royale: Player updating coin:', { gameId, address, coin })

      if (!battleRoyaleManager) {
        console.error('❌ BattleRoyaleManager not provided to handler')
        socket.emit('error', { message: 'Server error: Manager not available' })
        return
      }

      const game = battleRoyaleManager.getGame(gameId)
      if (!game) {
        console.error('❌ Game not found:', gameId)
        socket.emit('error', { message: 'Game not found' })
        return
      }

      const player = game.players.get(address)
      if (!player) {
        console.error('❌ Player not in game:', address)
        socket.emit('error', { message: 'Player not in game' })
        return
      }

      // Update player's coin
      player.coin = {
        id: coin.id || 'plain',
        type: coin.type || 'default',
        name: coin.name || 'Classic',
        headsImage: coin.headsImage || null,
        tailsImage: coin.tailsImage || null
      }

      console.log(`✅ Updated coin for ${address}:`, player.coin)

      // BROADCAST state to all players in room
      const roomId = `game_${gameId}`
      const gameState = battleRoyaleManager.getFullGameState(gameId)
      
      console.log(`📢 Broadcasting state update to room ${roomId}`)
      io.to(roomId).emit('battle_royale_state_update', gameState)

      // Confirm to the player
      socket.emit('battle_royale_coin_updated', {
        success: true,
        coin: player.coin
      })

    } catch (error) {
      console.error('⚠️ BattleRoyale handler error:', error)
      socket.emit('error', { message: 'Failed to update coin' })
    }
  }

  // Request Game State
  async handleRequestBattleRoyaleState(socket, data, battleRoyaleManager) {
    const { gameId } = data
    console.log(`📊 Battle Royale state requested: ${gameId}`)
    
    // Prevent duplicate requests
    if (this.pendingRequests.has(gameId)) {
      console.log(`⏳ Request already pending for game ${gameId}`)
      return
    }
    
    this.pendingRequests.set(gameId, true)
    
    try {
      const fullState = battleRoyaleManager.getFullGameState(gameId)
      if (fullState) {
        socket.emit('battle_royale_state_update', fullState)
      } else {
        socket.emit('battle_royale_error', { message: 'Game not found' })
      }
    } finally {
      this.pendingRequests.delete(gameId)
    }
  }

  // ===== NEW EVENT HANDLERS =====

  // Start Game
  async handleStartGame(socket, data, battleRoyaleManager, io) {
    const { gameId, address } = data
    console.log(`🚀 Starting Battle Royale game: ${gameId}`)
    
    const broadcastFn = (roomId, eventType, eventData) => {
      io.to(roomId).emit(eventType, eventData)
    }
    
    const success = battleRoyaleManager.startGame(gameId, broadcastFn)
    if (success) {
      console.log(`✅ Game started successfully: ${gameId}`)
    } else {
      socket.emit('battle_royale_error', { message: 'Failed to start game' })
    }
  }

  // Make Choice
  async handleMakeChoice(socket, data, battleRoyaleManager, io) {
    const { gameId, address, choice } = data
    console.log(`🎯 Player choice: ${address} chose ${choice} in ${gameId}`)
    
    const broadcastFn = (roomId, eventType, eventData) => {
      io.to(roomId).emit(eventType, eventData)
    }
    
    const success = battleRoyaleManager.makeChoice(gameId, address, choice, broadcastFn)
    if (!success) {
      socket.emit('battle_royale_error', { message: 'Cannot make choice now' })
    }
  }

  // Flip Coin
  async handleFlipCoin(socket, data, battleRoyaleManager, io) {
    const { gameId, address, powerLevel } = data
    console.log(`🪙 Player flip: ${address} flipping with power ${powerLevel} in ${gameId}`)
    
    const broadcastFn = (roomId, eventType, eventData) => {
      io.to(roomId).emit(eventType, eventData)
    }
    
    const success = battleRoyaleManager.flipCoin(gameId, address, powerLevel, broadcastFn)
    if (!success) {
      socket.emit('battle_royale_error', { message: 'Cannot flip coin now' })
    }
  }

  // Join Battle Royale Game (Payment confirmed)
  async handleJoinBattleRoyale(socket, data, battleRoyaleManager, io, dbService) {
    try {
      const { gameId, address, betAmount } = data
      console.log('🎮 Player joining Battle Royale:', { gameId, address, betAmount })

      if (!battleRoyaleManager) {
        console.error('❌ BattleRoyaleManager not provided')
        socket.emit('error', { message: 'Server error' })
        return
      }

      // Join room first
      const roomId = `game_${gameId}`
      socket.join(roomId)
      console.log(`✅ Socket ${socket.id} joined room ${roomId}`)

      // Get or create game
      let game = battleRoyaleManager.getGame(gameId)
      if (!game && dbService) {
        // Try to load from database
        try {
          const gameData = await dbService.getBattleRoyaleGame(gameId)
          if (gameData && gameData.status === 'filling') {
            game = battleRoyaleManager.createBattleRoyale(gameId, gameData, dbService)
            console.log(`✅ Game ${gameId} loaded from database`)
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
      
      console.log(`✅ Player ${address} joined game ${gameId}`)
      
      // Get updated state
      const gameState = battleRoyaleManager.getFullGameState(gameId)
      
      // BROADCAST to ALL players in room (including the joiner)
      console.log(`📢 Broadcasting join to room ${roomId}, ${gameState.activePlayers.length} players`)
      io.to(roomId).emit('battle_royale_state_update', gameState)
      
      // Emit specific join event
      io.to(roomId).emit('battle_royale_player_joined', {
        gameId,
        playerAddress: address,
        playerCount: gameState.activePlayers.length,
        maxPlayers: 6
      })

      socket.emit('battle_royale_join_success', { gameId, ...gameState })

      // Check if game should auto-start (6 players joined)
      if (game && game.currentPlayers === game.maxPlayers && game.phase === battleRoyaleManager.PHASES.FILLING) {
        console.log(`🚀 Battle Royale game ${gameId} is full - auto-starting!`)
        
        // Auto-start the game
        setTimeout(() => {
          battleRoyaleManager.prepareGameStart(gameId, (roomId, eventType, eventData) => {
            io.to(`game_${gameId}`).emit(eventType, eventData)
          })
        }, 1000) // Small delay to ensure all clients are ready
      }

    } catch (error) {
      console.error('⚠️ Join Battle Royale error:', error)
      socket.emit('error', { message: 'Failed to join game' })
    }
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
    const roomId = `game_${gameId}`
    socket.join(roomId)

    // Send current state
    const fullState = battleRoyaleManager.getFullGameState(gameId)
    socket.emit('battle_royale_state_update', fullState)
  }

  // Start Battle Royale Early
  async handleBattleRoyaleStartEarly(socket, data, battleRoyaleManager, io, dbService) {
    const { gameId, address } = data
    console.log(`🚀 Early start requested by ${address} for game ${gameId}`)
    
    try {
      let game = battleRoyaleManager.getGame(gameId)
      
      // If game not in memory, try to load from database
      if (!game && dbService) {
        try {
          const gameData = await dbService.getBattleRoyaleGame(gameId)
          if (gameData && gameData.status === 'filling') {
            game = battleRoyaleManager.createBattleRoyale(gameId, gameData, dbService)
            console.log(`✅ Game ${gameId} loaded from database for early start`)
          }
        } catch (error) {
          console.error('❌ Error loading Battle Royale game for early start:', error)
        }
      }
      
      if (!game) {
        console.error(`❌ Game not found: ${gameId}`)
        socket.emit('battle_royale_error', { message: 'Game not found' })
        return
      }
      
      // Verify the requester is the creator
      if (game.creator?.toLowerCase() !== address?.toLowerCase()) {
        console.error(`❌ Only creator can start game. Creator: ${game.creator}, Requester: ${address}`)
        socket.emit('battle_royale_error', { message: 'Only creator can start game early' })
        return
      }
      
      // Check if game is in filling phase
      if (game.phase !== battleRoyaleManager.PHASES.FILLING) {
        console.error(`❌ Game not in filling phase. Current phase: ${game.phase}`)
        socket.emit('battle_royale_error', { message: 'Game already started or completed' })
        return
      }
      
      // Check minimum players (at least 2 including creator)
      if (game.currentPlayers < 2) {
        console.error(`❌ Not enough players. Current: ${game.currentPlayers}, Required: 2`)
        socket.emit('battle_royale_error', { message: 'Need at least 2 players to start' })
        return
      }
      
      console.log(`🎮 Starting Battle Royale early with ${game.currentPlayers} players`)
      
      // Start the game with proper error handling
      try {
        const success = battleRoyaleManager.prepareGameStart(gameId, (roomId, eventType, eventData) => {
          console.log(`📡 Broadcasting ${eventType} to ${roomId}`)
          if (io && io.to) {
            io.to(roomId).emit(eventType, eventData)
          } else {
            console.error('IO instance not available for broadcasting')
          }
        })
        
        if (success) {
          console.log(`✅ Game start initiated successfully for ${gameId}`)
          
          // Update database if available
          if (dbService) {
            try {
              await dbService.updateBattleRoyaleStatus(gameId, 'active', game.currentPlayers)
              console.log(`✅ Database updated for game ${gameId}`)
            } catch (error) {
              console.error('Failed to update database:', error)
            }
          }
        } else {
          throw new Error('Failed to start game')
        }
      } catch (error) {
        console.error(`❌ Error starting game: ${error.message}`)
        socket.emit('battle_royale_error', { message: 'Failed to start game' })
      }
    } catch (error) {
      console.error(`❌ Error in handleBattleRoyaleStartEarly:`, error)
      socket.emit('battle_royale_error', { message: 'Server error' })
    }
  }
}

module.exports = BattleRoyaleSocketHandlers
