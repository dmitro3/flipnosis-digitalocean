const socketIO = require('socket.io')
const GameStateManager = require('./GameStateManager')

// ===== CLEAN SERVER ARCHITECTURE =====
// Single source of truth for all game state management
// Server handles ALL game logic - clients only send actions and render state

class GameServer {
  constructor() {
    this.gameStateManager = new GameStateManager()
    this.socketData = new Map() // socketId -> { address, gameId, roomId }
    this.userSockets = new Map() // address -> socketId
    this.gameRooms = new Map() // gameId -> Set of socketIds
    this.io = null
    this.dbService = null
  }

  // ===== INITIALIZATION =====
  initialize(server, dbService) {
    console.log('🚀 Initializing Clean Game Server...')
    
    this.dbService = dbService
    this.io = socketIO(server, {
      cors: { origin: true, credentials: true },
      transports: ['websocket', 'polling']
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
      
      // Chat system
      socket.on('chat_message', (data) => this.handleChatMessage(socket, data))
      
      // Offer system
      socket.on('crypto_offer', (data) => this.handleCryptoOffer(socket, data))
      socket.on('accept_offer', (data) => this.handleAcceptOffer(socket, data))
      
      // Deposit system
      socket.on('deposit_confirmed', (data) => this.handleDepositConfirmed(socket, data))
      
      // Game actions
      socket.on('player_choice', (data) => this.handlePlayerChoice(socket, data))
      socket.on('request_game_state', (data) => this.handleRequestGameState(socket, data))
      
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
    this.socketData.set(socket.id, { address, roomId, gameId: roomId.replace('game_', '') })
    this.userSockets.set(address.toLowerCase(), socket.id)
    
    // Add to game room tracking
    const gameId = roomId.replace('game_', '')
    if (!this.gameRooms.has(gameId)) {
      this.gameRooms.set(gameId, new Set())
    }
    this.gameRooms.get(gameId).add(socket.id)
    
    socket.emit('room_joined', { roomId, members: this.io.sockets.adapter.rooms.get(roomId)?.size || 0 })
    
    // Send chat history if exists
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

  // ===== CHAT SYSTEM =====
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

  // ===== OFFER SYSTEM =====
  async handleCryptoOffer(socket, data) {
    const { gameId, address, offerPrice, message } = data
    console.log(`💰 Crypto offer from ${address} for game ${gameId}: $${offerPrice}`)
    
    // Save offer to database
    if (this.dbService && typeof this.dbService.saveOffer === 'function') {
      try {
        await this.dbService.saveOffer(gameId, address, offerPrice, message)
      } catch (error) {
        console.error('❌ Error saving offer:', error)
      }
    }
    
    // Broadcast to room
    this.io.to(`game_${gameId}`).emit('crypto_offer', {
      gameId,
      address,
      offerPrice,
      message,
      timestamp: new Date().toISOString()
    })
  }

  async handleAcceptOffer(socket, data) {
    const { gameId, address, offerId } = data
    console.log(`✅ Offer accepted by ${address} for game ${gameId}`)
    
    // Update offer status in database
    if (this.dbService && typeof this.dbService.acceptOffer === 'function') {
      try {
        await this.dbService.acceptOffer(offerId, address)
      } catch (error) {
        console.error('❌ Error accepting offer:', error)
      }
    }
    
    // Start deposit stage
    const gameState = this.gameStateManager.getGame(gameId)
    if (gameState) {
      this.gameStateManager.startDepositStage(gameId, address, (roomId, message) => {
        this.io.to(roomId).emit(message.type, message)
      })
    }
  }

  // ===== DEPOSIT SYSTEM =====
  async handleDepositConfirmed(socket, data) {
    const { gameId, address, nftId, nftData } = data
    console.log(`💰 Deposit confirmed: ${address} deposited ${nftId} in game ${gameId}`)
    
    // Update database
    if (this.dbService && typeof this.dbService.updateGameDeposit === 'function') {
      try {
        await this.dbService.updateGameDeposit(gameId, address, nftId, nftData)
      } catch (error) {
        console.error('❌ Error updating deposit:', error)
      }
    }
    
    // Get current game data
    const gameData = await this.dbService.getGame(gameId)
    if (!gameData) {
      console.error('❌ Game not found:', gameId)
      return
    }
    
    // Check if both players have deposited
    const bothDeposited = gameData.creatorDeposited && gameData.challengerDeposited
    
    if (bothDeposited) {
      console.log(`🎮 Both players deposited in game ${gameId}, starting game!`)
      
      // Initialize game state
      const gameState = this.initializeGameState(gameId, gameData)
      this.gameStateManager.createGame(gameId, gameState)
      
      // Notify all players that game is starting
      this.io.to(`game_${gameId}`).emit('game_started', {
        gameId,
        gameIdFull: `game_${gameId}`,
        phase: gameState.phase,
        status: 'active',
        currentRound: gameState.currentRound,
        totalRounds: gameState.totalRounds,
        creatorScore: gameState.creatorScore,
        challengerScore: gameState.challengerScore,
        creator: gameState.creator,
        challenger: gameState.challenger,
        currentTurn: gameState.currentTurn
      })
      
      // Emit complete game state with all required fields
      this.io.to(`game_${gameId}`).emit('game_state_update', {
        gameId: gameState.gameId,
        phase: gameState.phase,
        status: 'active',
        currentRound: gameState.currentRound,
        totalRounds: gameState.totalRounds,
        creatorScore: gameState.creatorScore,
        challengerScore: gameState.challengerScore,
        creator: gameState.creator,
        challenger: gameState.challenger,
        currentTurn: gameState.currentTurn,
        creatorChoice: gameState.creatorChoice,
        challengerChoice: gameState.challengerChoice,
        creatorPower: gameState.creatorPower,
        challengerPower: gameState.challengerPower,
        flipResult: gameState.flipResult,
        roundWinner: gameState.roundWinner,
        gameWinner: gameState.gameWinner,
        createdAt: gameState.createdAt
      })
      
    } else {
      // Just confirm the deposit
      this.io.to(`game_${gameId}`).emit('deposit_confirmed', {
        gameId,
        address,
        nftId,
        nftData,
        bothDeposited: false
      })
    }
  }

  // ===== GAME ACTIONS =====
  async handlePlayerChoice(socket, data) {
    const { gameId, address, choice, power } = data
    console.log(`🎯 Player choice: ${address} chose ${choice} with power ${power} in game ${gameId}`)
    
    // Get current game state
    const gameState = this.gameStateManager.getGame(gameId)
    if (!gameState) {
      console.error('❌ Game state not found:', gameId)
      return
    }
    
    // Validate it's the player's turn
    if (gameState.currentTurn.toLowerCase() !== address.toLowerCase()) {
      console.error('❌ Not player\'s turn:', address, 'current turn:', gameState.currentTurn)
      return
    }
    
    // Validate game phase
    if (gameState.phase !== 'choosing') {
      console.error('❌ Game not in choosing phase:', gameState.phase)
      return
    }
    
    // Update player's choice and power
    const isCreator = address.toLowerCase() === gameState.creator.toLowerCase()
    if (isCreator) {
      gameState.creatorChoice = choice
      gameState.creatorPower = power
    } else {
      gameState.challengerChoice = choice
      gameState.challengerPower = power
    }
    
    this.gameStateManager.updateGame(gameId, gameState)
    
    // Emit choice made event
    this.io.to(`game_${gameId}`).emit('choice_made', {
      gameId,
      address,
      choice,
      power,
      isCreator
    })
    
    // Execute the flip immediately
    await this.executePlayerFlip(gameId, gameState, address)
  }

  async handleRequestGameState(socket, data) {
    const { gameId } = data
    console.log(`📊 Game state requested for ${gameId}`)
    
    let gameState = this.gameStateManager.getGame(gameId)
    
    if (!gameState) {
      // Try to load from database
      const gameData = await this.dbService.getGame(gameId)
      if (gameData && gameData.status === 'active') {
        gameState = this.initializeGameState(gameId, gameData)
        this.gameStateManager.createGame(gameId, gameState)
      }
    }
    
    if (gameState) {
      // Send complete game state with all required fields
      socket.emit('game_state_update', {
        gameId: gameState.gameId,
        phase: gameState.phase,
        status: 'active',
        currentRound: gameState.currentRound,
        totalRounds: gameState.totalRounds,
        creatorScore: gameState.creatorScore,
        challengerScore: gameState.challengerScore,
        creator: gameState.creator,
        challenger: gameState.challenger,
        currentTurn: gameState.currentTurn,
        creatorChoice: gameState.creatorChoice,
        challengerChoice: gameState.challengerChoice,
        creatorPower: gameState.creatorPower,
        challengerPower: gameState.challengerPower,
        flipResult: gameState.flipResult,
        roundWinner: gameState.roundWinner,
        gameWinner: gameState.gameWinner,
        createdAt: gameState.createdAt
      })
    }
  }

// ===== GAME LOGIC FUNCTIONS =====
  initializeGameState(gameId, gameData) {
  return {
    gameId,
    phase: 'choosing', // choosing, flipping, result, completed
    status: 'active',
    currentRound: 1,
    totalRounds: 5,
    creatorScore: 0,
    challengerScore: 0,
    creator: gameData.creator,
    challenger: gameData.challenger,
    currentTurn: gameData.creator, // Creator always goes first
    creatorChoice: null,
    challengerChoice: null,
    creatorPower: 0,
    challengerPower: 0,
    flipResult: null,
    roundWinner: null,
    gameWinner: null,
    createdAt: new Date().toISOString()
  }
}

  async executePlayerFlip(gameId, gameState, currentPlayer) {
  console.log(`🎲 Executing flip for ${currentPlayer} in game ${gameId}`)
  
  // Determine the choices
  const isCreator = currentPlayer.toLowerCase() === gameState.creator.toLowerCase()
  const playerChoice = isCreator ? gameState.creatorChoice : gameState.challengerChoice
  const opponentChoice = isCreator ? gameState.challengerChoice : gameState.creatorChoice
  
  // If opponent hasn't chosen yet, they get the opposite choice
  const finalOpponentChoice = opponentChoice || (playerChoice === 'heads' ? 'tails' : 'heads')
  
  // Update opponent's choice if they haven't chosen
  if (!opponentChoice) {
    if (isCreator) {
      gameState.challengerChoice = finalOpponentChoice
    } else {
      gameState.creatorChoice = finalOpponentChoice
    }
  }
  
  // Generate flip result (server-side for security)
  const flipResult = Math.random() < 0.5 ? 'heads' : 'tails'
  gameState.flipResult = flipResult
  
  // Determine round winner
  const creatorWon = gameState.creatorChoice === flipResult
  const challengerWon = gameState.challengerChoice === flipResult
  
  if (creatorWon) {
    gameState.creatorScore++
    gameState.roundWinner = gameState.creator
  } else if (challengerWon) {
    gameState.challengerScore++
    gameState.roundWinner = gameState.challenger
  } else {
    gameState.roundWinner = null // Tie
  }
  
  // Update game state
  gameState.phase = 'result'
    this.gameStateManager.updateGame(gameId, gameState)
  
  // Emit flip result to all players
    this.io.to(`game_${gameId}`).emit('flip_result', {
    gameId,
    round: gameState.currentRound,
    flipResult,
    creatorChoice: gameState.creatorChoice,
    challengerChoice: gameState.challengerChoice,
    roundWinner: gameState.roundWinner,
    creatorScore: gameState.creatorScore,
    challengerScore: gameState.challengerScore
  })
  
  // Check for game completion
  if (gameState.creatorScore >= 3 || gameState.challengerScore >= 3) {
    gameState.phase = 'completed'
    gameState.gameWinner = gameState.creatorScore >= 3 ? gameState.creator : gameState.challenger
      this.gameStateManager.updateGame(gameId, gameState)
    
      this.io.to(`game_${gameId}`).emit('game_complete', {
      gameId,
      winner: gameState.gameWinner,
      creatorScore: gameState.creatorScore,
      challengerScore: gameState.challengerScore
    })
  } else {
    // Start next round after a delay
    setTimeout(() => {
        this.startNextRound(gameId, gameState)
    }, 3000)
  }
}

  startNextRound(gameId, gameState) {
  gameState.currentRound++
  gameState.phase = 'choosing'
  gameState.creatorChoice = null
  gameState.challengerChoice = null
  gameState.creatorPower = 0
  gameState.challengerPower = 0
  gameState.flipResult = null
  gameState.roundWinner = null
  
  // Switch turns - if creator went first last round, challenger goes first this round
  gameState.currentTurn = gameState.currentTurn === gameState.creator 
    ? gameState.challenger 
    : gameState.creator
  
    this.gameStateManager.updateGame(gameId, gameState)
  
    this.io.to(`game_${gameId}`).emit('round_start', {
      gameId,
      round: gameState.currentRound,
      currentTurn: gameState.currentTurn,
      creatorScore: gameState.creatorScore,
      challengerScore: gameState.challengerScore
    })
    
    // Also emit complete game state update to ensure all clients are in sync
    this.io.to(`game_${gameId}`).emit('game_state_update', {
      gameId: gameState.gameId,
      phase: gameState.phase,
      status: 'active',
      currentRound: gameState.currentRound,
      totalRounds: gameState.totalRounds,
      creatorScore: gameState.creatorScore,
      challengerScore: gameState.challengerScore,
      creator: gameState.creator,
      challenger: gameState.challenger,
      currentTurn: gameState.currentTurn,
      creatorChoice: gameState.creatorChoice,
      challengerChoice: gameState.challengerChoice,
      creatorPower: gameState.creatorPower,
      challengerPower: gameState.challengerPower,
      flipResult: gameState.flipResult,
      roundWinner: gameState.roundWinner,
      gameWinner: gameState.gameWinner,
      createdAt: gameState.createdAt
    })
  }

    // ===== DISCONNECTION =====
  handleDisconnect(socket) {
      console.log('❌ Disconnected:', socket.id)
      
    const data = this.socketData.get(socket.id)
      if (data) {
      this.userSockets.delete(data.address.toLowerCase())
      this.socketData.delete(socket.id)
        
        // Remove from game room tracking
        if (data.gameId) {
        const gameRoom = this.gameRooms.get(data.gameId)
          if (gameRoom) {
            gameRoom.delete(socket.id)
            if (gameRoom.size === 0) {
            this.gameRooms.delete(data.gameId)
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
  return gameServer.initialize(server, dbService)
}

module.exports = { initializeSocketIO }