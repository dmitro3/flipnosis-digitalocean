// handlers/server-socketio.js
// CLEAN Socket.io-only server implementation

const socketIO = require('socket.io')

// Store user connections and game states
const userSockets = new Map() // address -> socketId
const socketData = new Map() // socketId -> { address, gameId, roomId }
const gameStates = new Map() // gameId -> gameState

// Initialize game state when both players deposit
function initializeGameState(gameId, gameData) {
  const initialState = {
    gameId,
    status: 'active',
    phase: 'choosing',
    currentRound: 1,
    totalRounds: 5,
    creatorScore: 0,
    challengerScore: 0,
    currentTurn: gameData.creator,
    creator: gameData.creator,
    challenger: gameData.challenger || gameData.joiner,
    creatorChoice: null,
    challengerChoice: null,
    creatorPower: 0,
    challengerPower: 0,
    flipInProgress: false,
    roundHistory: []
  }
  
  console.log(`🎮 Initialized game state for ${gameId}`)
  gameStates.set(gameId, initialState)
  return initialState
}

// Execute flip for current player's turn
async function executePlayerFlip(gameId, gameState, io, dbService, currentPlayer) {
  if (gameState.flipInProgress) return
  
  gameState.flipInProgress = true
  console.log(`🎲 Executing flip for ${currentPlayer}`)
  
  const isCreator = currentPlayer === gameState.creator
  const playerChoice = isCreator ? gameState.creatorChoice : gameState.challengerChoice
  const playerPower = isCreator ? gameState.creatorPower : gameState.challengerPower
  
  // Generate result
  const baseSeed = Math.random()
  const powerInfluence = (playerPower / 10) * 0.15
  const adjustedSeed = Math.max(0, Math.min(1, baseSeed + (playerChoice === 'heads' ? powerInfluence : -powerInfluence)))
  const result = adjustedSeed < 0.5 ? 'heads' : 'tails'
  const playerWon = playerChoice === result
  
  // Update scores
  if (playerWon) {
    if (isCreator) gameState.creatorScore++
    else gameState.challengerScore++
  }
  
  // Broadcast result
  io.to(`game_${gameId}`).emit('round_result', {
    gameId,
    round: gameState.currentRound,
    player: currentPlayer,
    choice: playerChoice,
    power: playerPower,
    result,
    roundWinner: playerWon ? currentPlayer : null,
    creatorScore: gameState.creatorScore,
    challengerScore: gameState.challengerScore,
    seed: adjustedSeed,
    flipAnimation: {
      duration: Math.max(2000, Math.min(5000, playerPower * 300)),
      rotations: Math.max(5, Math.min(25, 5 + playerPower * 2)),
      result
    }
  })
  
  // Check if game complete
  const gameComplete = gameState.creatorScore >= 3 || gameState.challengerScore >= 3 || gameState.currentRound >= 5
  
  if (gameComplete) {
    const finalWinner = gameState.creatorScore > gameState.challengerScore ? gameState.creator : gameState.challenger
    gameState.status = 'completed'
    gameState.winner = finalWinner
    
    io.to(`game_${gameId}`).emit('game_complete', {
      gameId,
      winner: finalWinner,
      creatorScore: gameState.creatorScore,
      challengerScore: gameState.challengerScore
    })
    
    setTimeout(() => gameStates.delete(gameId), 60000)
  } else {
    // Next round
    gameState.currentRound++
    gameState.creatorChoice = null
    gameState.challengerChoice = null
    gameState.creatorPower = 0
    gameState.challengerPower = 0
    gameState.flipInProgress = false
    gameState.currentTurn = gameState.currentRound % 2 === 1 ? gameState.creator : gameState.challenger
    gameState.phase = 'choosing'
    
    io.to(`game_${gameId}`).emit('game_state_update', gameState)
    io.to(`game_${gameId}`).emit('round_complete', {
      gameId,
      nextRound: gameState.currentRound,
      currentTurn: gameState.currentTurn,
      message: `Round ${gameState.currentRound} starting!`
    })
  }
}

function initializeSocketIO(server, dbService) {
  console.log('🚀 Initializing Socket.io server...')
  
  const io = socketIO(server, {
    cors: { origin: true, credentials: true },
    transports: ['websocket', 'polling']
  })

  io.on('connection', (socket) => {
    console.log('✅ New connection:', socket.id)

    // Join room
    socket.on('join_room', (data) => {
      const { roomId, address } = data
      console.log(`🏠 ${address} joining ${roomId}`)
      
      socket.rooms.forEach(room => {
        if (room !== socket.id) socket.leave(room)
      })
      
      socket.join(roomId)
      socketData.set(socket.id, { address, roomId, gameId: roomId.replace('game_', '') })
      userSockets.set(address.toLowerCase(), socket.id)
      
      socket.emit('room_joined', { roomId, members: io.sockets.adapter.rooms.get(roomId)?.size || 0 })
      
      // Send chat history if exists
      if (dbService && typeof dbService.getChatHistory === 'function') {
        try {
          const messages = await dbService.getChatHistory(roomId, 50)
          socket.emit('chat_history', {
            roomId,
            messages
          })
          console.log(`📚 Sent ${messages.length} chat messages to ${address}`)
        } catch (error) {
          console.error('❌ Error loading chat history:', error)
        }
      }
    })

    // Chat
    socket.on('chat_message', async (data) => {
      const { roomId, message, address } = data
      console.log(`💬 Chat message in ${roomId}:`, message)
      
      // Save to database
      if (dbService && typeof dbService.saveChatMessage === 'function') {
        try {
          await dbService.saveChatMessage(roomId, address, message)
          console.log('✅ Chat message saved to database')
        } catch (error) {
          console.error('❌ Error saving chat message:', error)
        }
      }
      
      // Broadcast to room
      io.to(roomId).emit('chat_message', { 
        message, 
        address, 
        timestamp: new Date().toISOString() 
      })
    })

    // Offers
    socket.on('crypto_offer', async (data) => {
      const { gameId, cryptoAmount, address, message } = data
      console.log(`💰 Crypto offer: ${cryptoAmount} from ${address}`)
      
      const offer = {
        id: `${Date.now()}_${Math.random()}`,
        type: 'crypto_offer',
        address,
        cryptoAmount,
        message: message || 'Crypto offer',
        timestamp: new Date().toISOString()
      }
      
      // Save to database if available
      if (dbService && typeof dbService.createOffer === 'function') {
        try {
          await dbService.createOffer({
            id: offer.id,
            listing_id: gameId,
            offerer_address: address,
            offer_price: cryptoAmount,
            message: message || 'Crypto offer'
          })
          console.log('✅ Offer saved to database')
        } catch (error) {
          console.error('❌ Error saving offer:', error)
        }
      }
      
      // Broadcast to room
      io.to(`game_${gameId}`).emit('crypto_offer', offer)
    })

    // Accept offer
    socket.on('accept_offer', async (data) => {
      const { gameId, offerId, offerData } = data
      console.log(`✅ Offer accepted:`, offerId)
      
      try {
        const gameData = await dbService.getGameById(gameId)
        if (!gameData) return
        
        await dbService.updateGame(gameId, {
          challenger: offerData.address || offerData.offerer_address,
          status: 'deposits_pending'
        })
        
        io.to(`game_${gameId}`).emit('deposit_stage_started', {
          gameId,
          creator: gameData.creator,
          challenger: offerData.address || offerData.offerer_address,
          cryptoAmount: offerData.cryptoAmount,
          timeRemaining: 120,
          creatorDeposited: true,
          challengerDeposited: false
        })
      } catch (error) {
        console.error('❌ Error accepting offer:', error)
      }
    })

    // Deposit confirmed
    socket.on('deposit_confirmed', async (data) => {
      const { gameId, player, assetType } = data
      console.log(`💰 Deposit confirmed: ${player}`)
      
      try {
        const gameData = await dbService.getGameById(gameId)
        if (!gameData) return
        
        const bothDeposited = true // Simplified for now
        
        if (bothDeposited) {
          const gameState = initializeGameState(gameId, gameData)
          
          await dbService.updateGame(gameId, { status: 'active', phase: 'active' })
          
          io.to(`game_${gameId}`).emit('game_started', {
            gameId,
            gameIdFull: `game_${gameId}`,
            phase: 'game_active',
            status: 'active',
            currentRound: 1,
            totalRounds: 5,
            creatorScore: 0,
            challengerScore: 0,
            creator: gameData.creator,
            challenger: gameData.challenger,
            currentTurn: gameData.creator
          })
          
          io.to(`game_${gameId}`).emit('game_state_update', gameState)
        }
        
        io.to(`game_${gameId}`).emit('deposit_confirmed', {
          gameId, player, assetType, bothDeposited
        })
      } catch (error) {
        console.error('❌ Error handling deposit:', error)
      }
    })

    // Request game state
    socket.on('request_game_state', async ({ gameId }) => {
      let gameState = gameStates.get(gameId)
      if (!gameState) {
        const gameData = await dbService.getGameById(gameId)
        if (gameData && gameData.status === 'active') {
          gameState = initializeGameState(gameId, gameData)
        }
      }
      if (gameState) {
        socket.emit('game_state_update', gameState)
      }
    })
    
    // Player choice - CLEAN TURN-BASED
    socket.on('player_choice', async ({ gameId, choice, power }) => {
      const gameState = gameStates.get(gameId)
      const socketInfo = socketData.get(socket.id)
      
      if (!gameState || !socketInfo) {
        console.log('❌ No game state or socket info')
        return
      }
      
      const player = socketInfo.address
      const isCreator = player === gameState.creator
      
      if (gameState.currentTurn !== player) {
        console.log(`❌ Not ${player}'s turn (current: ${gameState.currentTurn})`)
        return
      }
      
      console.log(`🎯 Player choice: ${choice} power: ${power || 0}`)
      
      // Store choice
      if (isCreator) {
        gameState.creatorChoice = choice
        if (power) gameState.creatorPower = Math.max(1, Math.min(10, power))
      } else {
        gameState.challengerChoice = choice
        if (power) gameState.challengerPower = Math.max(1, Math.min(10, power))
      }
      
      // Execute flip if power provided
      if (power && power > 0) {
        console.log('🎮 Executing flip')
        gameState.phase = 'flipping'
        io.to(`game_${gameId}`).emit('game_state_update', gameState)
        await executePlayerFlip(gameId, gameState, io, dbService, player)
      } else {
        gameState.phase = 'charging'
        io.to(`game_${gameId}`).emit('game_state_update', gameState)
      }
    })

    // Disconnect
    socket.on('disconnect', () => {
      console.log('👋 Disconnected:', socket.id)
      const socketInfo = socketData.get(socket.id)
      if (socketInfo) {
        userSockets.delete(socketInfo.address.toLowerCase())
        socketData.delete(socket.id)
      }
    })
  })

  console.log('✅ Socket.io server ready')
  return io
}

module.exports = { initializeSocketIO }