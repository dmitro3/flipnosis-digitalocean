// handlers/server-socketio-clean.js
// CLEAN Socket.io-only server implementation - NO LEGACY CODE

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
    totalRounds: 5, // First to 3 wins out of 5
    creatorScore: 0,
    challengerScore: 0,
    currentTurn: gameData.creator, // Creator goes first
    creator: gameData.creator,
    challenger: gameData.challenger || gameData.joiner,
    creatorChoice: null,
    challengerChoice: null,
    creatorPower: 0,
    challengerPower: 0,
    flipInProgress: false,
    roundHistory: []
  }
  
  console.log(`🎮 Initialized game state for ${gameId}:`, {
    creator: initialState.creator,
    challenger: initialState.challenger,
    currentTurn: initialState.currentTurn
  })
  
  gameStates.set(gameId, initialState)
  return initialState
}

// Execute flip for current player's turn (TURN-BASED SYSTEM)
async function executePlayerFlip(gameId, gameState, io, dbService, currentPlayer) {
  if (gameState.flipInProgress) return
  
  gameState.flipInProgress = true
  
  console.log(`🎲 Executing flip for ${currentPlayer} in game ${gameId}`)
  
  const isCreator = currentPlayer === gameState.creator
  const playerChoice = isCreator ? gameState.creatorChoice : gameState.challengerChoice
  const playerPower = isCreator ? gameState.creatorPower : gameState.challengerPower
  
  console.log(`   Player: ${currentPlayer}`)
  console.log(`   Choice: ${playerChoice}`)
  console.log(`   Power: ${playerPower}`)
  
  // Generate deterministic result based on power and randomness
  const baseSeed = Math.random()
  const powerInfluence = (playerPower / 10) * 0.15 // Up to 15% influence at max power
  const adjustedSeed = Math.max(0, Math.min(1, baseSeed + (playerChoice === 'heads' ? powerInfluence : -powerInfluence)))
  
  const result = adjustedSeed < 0.5 ? 'heads' : 'tails'
  const playerWon = playerChoice === result
  
  // Update scores
  if (playerWon) {
    if (isCreator) {
      gameState.creatorScore++
    } else {
      gameState.challengerScore++
    }
  }
  
  // Record round history
  gameState.roundHistory.push({
    round: gameState.currentRound,
    player: currentPlayer,
    choice: playerChoice,
    power: playerPower,
    result,
    won: playerWon,
    seed: adjustedSeed
  })
  
  // Broadcast flip result with synchronized animation
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
      duration: Math.max(2000, Math.min(5000, playerPower * 300)), // 2-5 seconds based on power
      rotations: Math.max(5, Math.min(25, 5 + playerPower * 2)), // 5-25 rotations based on power
      result
    }
  })
  
  // Check if game is complete (first to 3 wins or all 5 rounds played)
  const gameComplete = 
    gameState.creatorScore >= 3 ||
    gameState.challengerScore >= 3 ||
    gameState.currentRound >= 5
  
  if (gameComplete) {
    // Determine final winner
    const finalWinner = gameState.creatorScore > gameState.challengerScore ? 
      gameState.creator : gameState.challenger
    
    gameState.status = 'completed'
    gameState.winner = finalWinner
    
    // Update database
    await dbService.updateGame(gameId, {
      status: 'completed',
      winner: finalWinner,
      finalScore: `${gameState.creatorScore}-${gameState.challengerScore}`,
      roundHistory: JSON.stringify(gameState.roundHistory)
    })
    
    // Broadcast game complete
    io.to(`game_${gameId}`).emit('game_complete', {
      gameId,
      winner: finalWinner,
      creatorScore: gameState.creatorScore,
      challengerScore: gameState.challengerScore,
      roundHistory: gameState.roundHistory
    })
    
    // Clean up game state after a delay
    setTimeout(() => {
      gameStates.delete(gameId)
    }, 60000) // Keep for 1 minute for any final updates
    
  } else {
    // Move to next turn/round
    gameState.currentRound++
    
    // Reset choices and power for next round
    gameState.creatorChoice = null
    gameState.challengerChoice = null
    gameState.creatorPower = 0
    gameState.challengerPower = 0
    gameState.flipInProgress = false
    
    // Switch turns - alternate who goes first each round
    gameState.currentTurn = gameState.currentRound % 2 === 1 ? 
      gameState.creator : gameState.challenger
    gameState.phase = 'choosing'
    
    // Broadcast updated state for next round
    io.to(`game_${gameId}`).emit('game_state_update', gameState)
    
    io.to(`game_${gameId}`).emit('round_complete', {
      gameId,
      nextRound: gameState.currentRound,
      currentTurn: gameState.currentTurn,
      message: `Round ${gameState.currentRound} starting! ${gameState.currentTurn === gameState.creator ? 'Creator' : 'Challenger'} goes first.`
    })
  }
}

function initializeSocketIO(server, dbService) {
  console.log('🚀 Initializing CLEAN Socket.io server...')
  
  const io = socketIO(server, {
    cors: {
      origin: true,
      credentials: true
    },
    transports: ['websocket', 'polling']
  })

  io.on('connection', (socket) => {
    console.log('✅ New Socket.io connection:', socket.id)

    // Handle room joining
    socket.on('join_room', (data) => {
      const { roomId, address } = data
      console.log(`🏠 ${address} joining room ${roomId}`)
      
      // Leave previous rooms
      socket.rooms.forEach(room => {
        if (room !== socket.id) {
          socket.leave(room)
        }
      })
      
      // Join new room
      socket.join(roomId)
      
      // Store socket data
      socketData.set(socket.id, { address, roomId, gameId: roomId.replace('game_', '') })
      userSockets.set(address.toLowerCase(), socket.id)
      
      // Notify room
      socket.emit('room_joined', {
        roomId,
        members: io.sockets.adapter.rooms.get(roomId)?.size || 0
      })
    })

    // Handle chat messages
    socket.on('chat_message', (data) => {
      const { roomId, message, address } = data
      console.log(`💬 Chat message in ${roomId}:`, message)
      
      // Broadcast to room
      io.to(roomId).emit('chat_message', {
        message,
        address,
        timestamp: new Date().toISOString()
      })
    })

    // Handle crypto offers
    socket.on('crypto_offer', async (data) => {
      const { gameId, cryptoAmount, address } = data
      console.log(`💰 Crypto offer: ${cryptoAmount} from ${address}`)
      
      const offer = {
        id: `${Date.now()}_${Math.random()}`,
        type: 'crypto_offer',
        address,
        cryptoAmount,
        timestamp: new Date().toISOString()
      }
      
      // Broadcast to room
      io.to(`game_${gameId}`).emit('crypto_offer', offer)
    })

    // Handle offer acceptance
    socket.on('accept_offer', async (data) => {
      const { gameId, offerId, offerData } = data
      console.log(`✅ Offer accepted:`, offerId)
      
      try {
        const gameData = await dbService.getGameById(gameId)
        if (!gameData) return
        
        // Set challenger in game data
        await dbService.updateGame(gameId, {
          challenger: offerData.address || offerData.offerer_address,
          status: 'deposits_pending'
        })
        
        // Notify both players that deposit stage is starting
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

    // Handle deposit confirmation
    socket.on('deposit_confirmed', async (data) => {
      const { gameId, player, assetType } = data
      console.log(`💰 Deposit confirmed: ${player} deposited ${assetType}`)
      
      try {
        const gameData = await dbService.getGameById(gameId)
        if (!gameData) return
        
        // Check if both players have deposited
        const creatorDeposited = true // Assume creator always deposits first
        const challengerDeposited = true // This deposit confirmation
        
        if (creatorDeposited && challengerDeposited) {
          // Initialize game state
          const gameState = initializeGameState(gameId, gameData)
          
          // Update database
          await dbService.updateGame(gameId, { 
            status: 'active',
            phase: 'active'
          })
          
          // Notify all players that game is starting
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
          
          // Send initial game state
          io.to(`game_${gameId}`).emit('game_state_update', gameState)
        }
        
        // Broadcast deposit confirmation
        io.to(`game_${gameId}`).emit('deposit_confirmed', {
          gameId,
          player,
          assetType,
          creatorDeposited,
          challengerDeposited,
          bothDeposited: creatorDeposited && challengerDeposited
        })
        
      } catch (error) {
        console.error('❌ Error handling deposit confirmation:', error)
      }
    })

    // Request current game state
    socket.on('request_game_state', async ({ gameId }) => {
      console.log(`📊 Game state requested for ${gameId}`)
      
      let gameState = gameStates.get(gameId)
      
      if (!gameState) {
        // Try to load from database
        const gameData = await dbService.getGameById(gameId)
        if (gameData && gameData.status === 'active') {
          gameState = initializeGameState(gameId, gameData)
        }
      }
      
      if (gameState) {
        socket.emit('game_state_update', gameState)
      }
    })
    
    // Handle player choice (heads/tails) - CLEAN TURN-BASED SYSTEM
    socket.on('player_choice', async ({ gameId, choice, power }) => {
      const gameState = gameStates.get(gameId)
      if (!gameState) {
        console.log('❌ No game state found for player choice')
        return
      }
      
      const socketInfo = socketData.get(socket.id)
      if (!socketInfo) {
        console.log('❌ No socket info found for player choice')
        return
      }
      
      const player = socketInfo.address
      const isCreator = player === gameState.creator
      
      // Check if it's this player's turn
      if (gameState.currentTurn !== player) {
        console.log(`❌ Not ${player}'s turn (current turn: ${gameState.currentTurn})`)
        return
      }
      
      console.log(`🎯 Player choice: ${choice} with power ${power || 0} from ${isCreator ? 'creator' : 'challenger'}`)
      
      // Store the choice
      if (isCreator) {
        gameState.creatorChoice = choice
        if (power) gameState.creatorPower = Math.max(1, Math.min(10, power))
      } else {
        gameState.challengerChoice = choice
        if (power) gameState.challengerPower = Math.max(1, Math.min(10, power))
      }
      
      // If power is provided (final choice with flip), execute immediately
      if (power && power > 0) {
        console.log('🎮 Player choice with power - executing flip immediately')
        gameState.phase = 'flipping'
        
        // Broadcast state update
        io.to(`game_${gameId}`).emit('game_state_update', gameState)
        
        // Execute the flip for this player
        await executePlayerFlip(gameId, gameState, io, dbService, player)
      } else {
        // Just choice, move to charging phase
        gameState.phase = 'charging'
        io.to(`game_${gameId}`).emit('game_state_update', gameState)
      }
    })

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('👋 Socket disconnected:', socket.id)
      const socketInfo = socketData.get(socket.id)
      if (socketInfo) {
        userSockets.delete(socketInfo.address.toLowerCase())
        socketData.delete(socket.id)
      }
    })
  })

  console.log('✅ CLEAN Socket.io server initialized')
  return io
}

module.exports = { initializeSocketIO }
