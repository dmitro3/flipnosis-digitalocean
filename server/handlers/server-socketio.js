const socketIO = require('socket.io')
const GameStateManager = require('./GameStateManager')

// ===== GAME STATE MANAGER =====
const gameStateManager = new GameStateManager()

// ===== ROOM & SOCKET MANAGEMENT =====
const socketData = new Map() // socketId -> { address, gameId, roomId }
const userSockets = new Map() // address -> socketId
const gameRooms = new Map() // gameId -> Set of socketIds

// ===== GAME LOGIC FUNCTIONS =====

/**
 * Initialize a new game state
 */
function initializeGameState(gameId, gameData) {
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

/**
 * Execute a player's flip with proper turn management
 */
async function executePlayerFlip(gameId, gameState, io, dbService, currentPlayer) {
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
  gameStateManager.updateGame(gameId, gameState)
  
  // Emit flip result to all players
  io.to(`game_${gameId}`).emit('flip_result', {
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
    gameStateManager.updateGame(gameId, gameState)
    
    io.to(`game_${gameId}`).emit('game_complete', {
      gameId,
      winner: gameState.gameWinner,
      creatorScore: gameState.creatorScore,
      challengerScore: gameState.challengerScore
    })
  } else {
    // Start next round after a delay
    setTimeout(() => {
      startNextRound(gameId, gameState, io)
    }, 3000)
  }
}

/**
 * Start the next round
 */
function startNextRound(gameId, gameState, io) {
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
  
  gameStateManager.updateGame(gameId, gameState)
  
  io.to(`game_${gameId}`).emit('round_start', {
    gameId,
    round: gameState.currentRound,
    currentTurn: gameState.currentTurn,
    creatorScore: gameState.creatorScore,
    challengerScore: gameState.challengerScore
  })
}

// ===== MAIN SOCKET.IO INITIALIZATION =====
function initializeSocketIO(server, dbService) {
  console.log('🚀 Initializing Socket.io server...')
  
  const io = socketIO(server, {
    cors: { origin: true, credentials: true },
    transports: ['websocket', 'polling']
  })

  io.on('connection', (socket) => {
    console.log('✅ New connection:', socket.id)

    // ===== ROOM MANAGEMENT =====
    socket.on('join_room', async (data) => {
      const { roomId, address } = data
      console.log(`🏠 ${address} joining ${roomId}`)
      
      // Leave previous rooms
      socket.rooms.forEach(room => {
        if (room !== socket.id) socket.leave(room)
      })
      
      // Join new room
      socket.join(roomId)
      socketData.set(socket.id, { address, roomId, gameId: roomId.replace('game_', '') })
      userSockets.set(address.toLowerCase(), socket.id)
      
      // Add to game room tracking
      const gameId = roomId.replace('game_', '')
      if (!gameRooms.has(gameId)) {
        gameRooms.set(gameId, new Set())
      }
      gameRooms.get(gameId).add(socket.id)
      
      socket.emit('room_joined', { roomId, members: io.sockets.adapter.rooms.get(roomId)?.size || 0 })
      
      // Send chat history if exists
      if (dbService && typeof dbService.getChatHistory === 'function') {
        try {
          const messages = await dbService.getChatHistory(roomId, 50)
          socket.emit('chat_history', { roomId, messages })
          console.log(`📚 Sent ${messages.length} chat messages to ${address}`)
        } catch (error) {
          console.error('❌ Error loading chat history:', error)
        }
      }
    })

    // ===== CHAT SYSTEM =====
    socket.on('chat_message', async (data) => {
      const { roomId, message, address } = data
      console.log(`💬 Chat from ${address} in ${roomId}: ${message}`)
      
      // Save to database
      if (dbService && typeof dbService.saveChatMessage === 'function') {
        try {
          await dbService.saveChatMessage(roomId, address, message)
        } catch (error) {
          console.error('❌ Error saving chat message:', error)
        }
      }
      
      // Broadcast to room
      io.to(roomId).emit('chat_message', {
        roomId,
        address,
        message,
        timestamp: new Date().toISOString()
      })
    })

    // ===== OFFER SYSTEM =====
    socket.on('crypto_offer', async (data) => {
      const { roomId, fromAddress, toAddress, nftId, nftData } = data
      console.log(`💰 Offer from ${fromAddress} to ${toAddress} in ${roomId}`)
      
      // Save offer to database
      if (dbService && typeof dbService.saveOffer === 'function') {
        try {
          await dbService.saveOffer(roomId, fromAddress, toAddress, nftId, nftData)
        } catch (error) {
          console.error('❌ Error saving offer:', error)
        }
      }
      
      // Notify target player
      const targetSocketId = userSockets.get(toAddress.toLowerCase())
      if (targetSocketId) {
        io.to(targetSocketId).emit('offer_received', {
          roomId,
          fromAddress,
          nftId,
          nftData
        })
      }
      
      // Broadcast to room
      io.to(roomId).emit('offer_created', {
        roomId,
        fromAddress,
        toAddress,
        nftId,
        nftData
      })
    })

    socket.on('accept_offer', async (data) => {
      const { roomId, fromAddress, toAddress, nftId } = data
      console.log(`✅ Offer accepted: ${fromAddress} -> ${toAddress} in ${roomId}`)
      
      // Update offer status in database
      if (dbService && typeof dbService.updateOfferStatusByDetails === 'function') {
        try {
          await dbService.updateOfferStatusByDetails(roomId, fromAddress, toAddress, nftId, 'accepted')
        } catch (error) {
          console.error('❌ Error updating offer status:', error)
        }
      }
      
      // Notify both players
      const fromSocketId = userSockets.get(fromAddress.toLowerCase())
      const toSocketId = userSockets.get(toAddress.toLowerCase())
      
      if (fromSocketId) {
        io.to(fromSocketId).emit('offer_accepted', { roomId, toAddress, nftId })
      }
      if (toSocketId) {
        io.to(toSocketId).emit('offer_accepted', { roomId, fromAddress, nftId })
      }
      
      // Broadcast to room
      io.to(roomId).emit('offer_accepted', {
        roomId,
        fromAddress,
        toAddress,
        nftId
      })
    })

    // ===== DEPOSIT SYSTEM =====
    socket.on('deposit_confirmed', async (data) => {
      const { gameId, address, nftId, nftData } = data
      console.log(`💰 Deposit confirmed: ${address} deposited ${nftId} in game ${gameId}`)
      
      // Update database
      if (dbService && typeof dbService.updateGameDeposit === 'function') {
        try {
          await dbService.updateGameDeposit(gameId, address, nftId, nftData)
        } catch (error) {
          console.error('❌ Error updating deposit:', error)
        }
      }
      
      // Get current game data
      const gameData = await dbService.getGame(gameId)
      if (!gameData) {
        console.error('❌ Game not found:', gameId)
        return
      }
      
      // Check if both players have deposited
      const bothDeposited = gameData.creatorDeposit && gameData.challengerDeposit
      
      if (bothDeposited) {
        console.log(`🎮 Both players deposited in game ${gameId}, starting game!`)
        
        // Initialize game state
        const gameState = initializeGameState(gameId, gameData)
        gameStateManager.createGame(gameId, gameState)
        
        // Notify all players that game is starting
        io.to(`game_${gameId}`).emit('game_started', {
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
      } else {
        // Just confirm the deposit
        io.to(`game_${gameId}`).emit('deposit_confirmed', {
          gameId,
          address,
          nftId,
          nftData,
          bothDeposited: false
        })
      }
    })

    // ===== GAME ACTIONS =====
    socket.on('player_choice', async (data) => {
      const { gameId, address, choice, power } = data
      console.log(`🎯 Player choice: ${address} chose ${choice} with power ${power} in game ${gameId}`)
      
      // Get current game state
      const gameState = gameStateManager.getGame(gameId)
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
      
      gameStateManager.updateGame(gameId, gameState)
      
      // Emit choice made event
      io.to(`game_${gameId}`).emit('choice_made', {
        gameId,
        address,
        choice,
        power,
        isCreator
      })
      
      // Execute the flip immediately
      await executePlayerFlip(gameId, gameState, io, dbService, address)
    })

    // ===== DISCONNECTION =====
    socket.on('disconnect', () => {
      console.log('❌ Disconnected:', socket.id)
      
      const data = socketData.get(socket.id)
      if (data) {
        userSockets.delete(data.address.toLowerCase())
        socketData.delete(socket.id)
        
        // Remove from game room tracking
        if (data.gameId) {
          const gameRoom = gameRooms.get(data.gameId)
          if (gameRoom) {
            gameRoom.delete(socket.id)
            if (gameRoom.size === 0) {
              gameRooms.delete(data.gameId)
            }
          }
        }
      }
    })
  })

  return io
}

module.exports = { initializeSocketIO }