// BattleRoyaleSocketHandlers.js - Battle Royale Socket Handlers

class BattleRoyaleSocketHandlers {
  constructor() {
    this.pendingRequests = new Map()
  }

  // Join Battle Royale Room
  async handleJoinBattleRoyaleRoom(socket, data, battleRoyaleManager, io) {
    const { roomId, address } = data
    const gameId = roomId.startsWith('br_') ? roomId.substring(3) : roomId
    
    console.log(`🎮 ${address} joining Battle Royale room: ${gameId}`)
    
    socket.join(`br_${gameId}`)
    
    let game = battleRoyaleManager.getGame(gameId)
    if (!game) {
      console.log(`❌ Battle Royale game not found: ${gameId}`)
      socket.emit('battle_royale_error', { message: 'Game not found' })
      return
    }
    
    const fullState = battleRoyaleManager.getFullGameState(gameId)
    socket.emit('battle_royale_state_update', fullState)
    
    console.log(`✅ ${address} joined Battle Royale room ${gameId}`)
  }

  // Player Choice Handler
  async handleBattleRoyalePlayerChoice(socket, data, battleRoyaleManager, io) {
    const { gameId, address, choice } = data
    console.log(`🎯 Battle Royale choice: ${address} chose ${choice}`)
    
    const success = battleRoyaleManager.setPlayerChoice(gameId, address, choice)
    if (!success) {
      socket.emit('battle_royale_error', { message: 'Cannot make choice now' })
      return
    }

    const roomId = `br_${gameId}`
    const fullState = battleRoyaleManager.getFullGameState(gameId)
    io.to(roomId).emit('battle_royale_state_update', fullState)
    
    io.to(roomId).emit('battle_royale_player_chose', {
      gameId,
      playerAddress: address,
      hasChosen: true
    })
  }

  // Execute Flip
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
      io.to(roomId).emit(eventType, eventData)
    })

    if (!success) {
      socket.emit('battle_royale_error', { message: 'Cannot flip coin now' })
    }
  }

  // Update Player Coin
  async handleBattleRoyaleUpdateCoin(socket, data, battleRoyaleManager, io) {
    const { gameId, address, coinData } = data
    console.log(`🪙 Battle Royale coin update: ${address}`)
    
    const success = battleRoyaleManager.updatePlayerCoin(gameId, address, coinData)
    if (!success) {
      socket.emit('battle_royale_error', { message: 'Cannot update coin' })
      return
    }

    const roomId = `br_${gameId}`
    const fullState = battleRoyaleManager.getFullGameState(gameId)
    io.to(roomId).emit('battle_royale_state_update', fullState)
  }

  // Request Game State
  async handleRequestBattleRoyaleState(socket, data, battleRoyaleManager) {
    const { gameId } = data
    console.log(`📊 Battle Royale state requested: ${gameId}`)
    
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

  // Join Battle Royale Game (Payment confirmed)
  async handleJoinBattleRoyale(socket, data, battleRoyaleManager, io, dbService) {
    const { gameId, address } = data
    console.log(`🎮 ${address} joining Battle Royale game: ${gameId}`)
    
    let game = battleRoyaleManager.getGame(gameId)
    if (!game && dbService) {
      try {
        const gameData = await dbService.getGame(gameId)
        if (gameData && gameData.status === 'waiting') {
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

    const success = battleRoyaleManager.addPlayer(gameId, address)
    if (!success) {
      socket.emit('battle_royale_error', { message: 'Cannot join game' })
      return
    }

    const roomId = `br_${gameId}`
    socket.join(roomId)
    
    const fullState = battleRoyaleManager.getFullGameState(gameId)
    io.to(roomId).emit('battle_royale_state_update', fullState)

    if (game && game.currentPlayers === game.maxPlayers && game.phase === battleRoyaleManager.PHASES.FILLING) {
      console.log(`🚀 Battle Royale game ${gameId} is full - auto-starting!`)
      
      setTimeout(() => {
        battleRoyaleManager.prepareGameStart(gameId, (roomId, eventType, eventData) => {
          io.to(roomId).emit(eventType, eventData)
        })
      }, 1000)
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

    battleRoyaleManager.addSpectator(gameId, address)
    
    const roomId = `br_${gameId}`
    socket.join(roomId)

    const fullState = battleRoyaleManager.getFullGameState(gameId)
    socket.emit('battle_royale_state_update', fullState)
  }

  // Start Battle Royale Early
  async handleBattleRoyaleStartEarly(socket, data, battleRoyaleManager, io, dbService) {
    const { gameId, address } = data
    console.log(`🚀 Early start requested by ${address} for game ${gameId}`)
    
    try {
      const game = battleRoyaleManager.getGame(gameId)
      if (!game) {
        socket.emit('battle_royale_error', { message: 'Game not found' })
        return
      }
      
      if (game.creator?.toLowerCase() !== address?.toLowerCase()) {
        socket.emit('battle_royale_error', { message: 'Only creator can start game early' })
        return
      }
      
      if (game.phase !== battleRoyaleManager.PHASES.FILLING) {
        socket.emit('battle_royale_error', { message: 'Game already started or completed' })
        return
      }
      
      if (game.currentPlayers < 2) {
        socket.emit('battle_royale_error', { message: 'Need at least 2 players to start' })
        return
      }
      
      console.log(`🎮 Starting Battle Royale early with ${game.currentPlayers} players`)
      
      const success = battleRoyaleManager.prepareGameStart(gameId, (roomId, eventType, eventData) => {
        if (io && io.to) {
          io.to(roomId).emit(eventType, eventData)
        }
      })
      
      if (success && dbService) {
        await dbService.updateGameStatus(gameId, 'active')
      }
    } catch (error) {
      console.error(`❌ Error in handleBattleRoyaleStartEarly:`, error)
      socket.emit('battle_royale_error', { message: 'Server error' })
    }
  }
}

module.exports = BattleRoyaleSocketHandlers
