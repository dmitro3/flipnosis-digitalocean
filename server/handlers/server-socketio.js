// handlers/server-socketio.js
// Socket.io server implementation - much cleaner than raw WebSocket!

const socketIO = require('socket.io')
const GameStateManager = require('./GameStateManager')

// Initialize game state manager
const gameStateManager = new GameStateManager()

// Store user connections
const userSockets = new Map() // address -> socketId
const socketData = new Map() // socketId -> { address, gameId, roomId }

// Game state management on server
const gameStates = new Map() // Store active game states

// Initialize game state when both players deposit
function initializeGameState(gameId, gameData) {
  const initialState = {
    gameId,
    status: 'active',
    currentRound: 1,
    totalRounds: 3,
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
  
  gameStates.set(gameId, initialState)
  return initialState
}

// Execute flip logic
async function executeFlip(gameId, gameState, io, dbService) {
  if (gameState.flipInProgress) return
  
  gameState.flipInProgress = true
  
  console.log(`🎲 Executing flip for game ${gameId}`)
  console.log(`   Creator: ${gameState.creatorChoice} (Power: ${gameState.creatorPower})`)
  console.log(`   Challenger: ${gameState.challengerChoice} (Power: ${gameState.challengerPower})`)
  
  // Generate random result
  const seed = Math.random()
  const powerDiff = gameState.creatorPower - gameState.challengerPower
  const powerInfluence = powerDiff * 0.01 // 1% influence per power point
  const adjustedSeed = Math.max(0, Math.min(1, seed + powerInfluence))
  
  const result = adjustedSeed < 0.5 ? 'heads' : 'tails'
  
  // Determine winner
  const creatorWon = gameState.creatorChoice === result
  const challengerWon = gameState.challengerChoice === result
  
  let roundWinner = null
  if (creatorWon && !challengerWon) {
    roundWinner = 'creator'
    gameState.creatorScore++
  } else if (challengerWon && !creatorWon) {
    roundWinner = 'challenger'
    gameState.challengerScore++
  }
  // If both chose the same, it's a tie - no score change
  
  // Record round history
  gameState.roundHistory.push({
    round: gameState.currentRound,
    result,
    creatorChoice: gameState.creatorChoice,
    challengerChoice: gameState.challengerChoice,
    creatorPower: gameState.creatorPower,
    challengerPower: gameState.challengerPower,
    winner: roundWinner,
    seed: adjustedSeed
  })
  
  // Broadcast flip result
  io.to(`game_${gameId}`).emit('flip_result', {
    gameId,
    round: gameState.currentRound,
    result,
    winner: roundWinner,
    creatorScore: gameState.creatorScore,
    challengerScore: gameState.challengerScore,
    seed: adjustedSeed
  })
  
  // Check if game is complete
  const gameComplete = 
    gameState.currentRound >= gameState.totalRounds ||
    gameState.creatorScore > gameState.totalRounds / 2 ||
    gameState.challengerScore > gameState.totalRounds / 2
  
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
    // Move to next round
    gameState.currentRound++
    gameState.creatorChoice = null
    gameState.challengerChoice = null
    gameState.creatorPower = 0
    gameState.challengerPower = 0
    gameState.flipInProgress = false
    
    // Switch turns (optional)
    gameState.currentTurn = gameState.currentTurn === gameState.creator ? 
      gameState.challenger : gameState.creator
    
    // Broadcast updated state
    io.to(`game_${gameId}`).emit('game_state_update', gameState)
    
    io.to(`game_${gameId}`).emit('round_complete', {
      gameId,
      nextRound: gameState.currentRound,
      currentTurn: gameState.currentTurn
    })
  }
}

function initializeSocketIO(server, dbService) {
  console.log('🚀 Initializing Socket.io server...')
  
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
      
      // Send chat history if exists
      if (dbService) {
        dbService.getChatHistory(roomId.replace('game_', ''), 50)
          .then(messages => {
            socket.emit('chat_history', {
              roomId,
              messages
            })
          })
          .catch(err => console.error('Error loading chat history:', err))
      }
    })

    // Handle chat messages
    socket.on('chat_message', (data) => {
      const socketInfo = socketData.get(socket.id)
      if (!socketInfo) return
      
      const message = {
        type: 'chat_message',
        message: data.message,
        from: data.from || socketInfo.address,
        timestamp: new Date().toISOString()
      }
      
      // Broadcast to room
      io.to(socketInfo.roomId).emit('chat_message', message)
      
      // Save to database
      if (dbService) {
        dbService.saveChatMessage(
          socketInfo.gameId,
          message.from,
          message.message
        ).catch(err => console.error('Error saving chat:', err))
      }
    })

    // Handle crypto offers
    socket.on('crypto_offer', (data) => {
      const socketInfo = socketData.get(socket.id)
      if (!socketInfo) return
      
      const offer = {
        type: 'crypto_offer',
        id: Date.now() + '_' + Math.random(),
        address: data.address || socketInfo.address,
        cryptoAmount: data.cryptoAmount,
        timestamp: new Date().toISOString()
      }
      
      // Broadcast to room
      io.to(socketInfo.roomId).emit('crypto_offer', offer)
    })

    // Handle offer acceptance - THIS IS THE KEY PART!
    socket.on('accept_offer', async (data) => {
      const socketInfo = socketData.get(socket.id)
      if (!socketInfo) return
      
      const gameId = socketInfo.gameId
      const creator = data.accepterAddress
      const challenger = data.challengerAddress || data.offerer_address
      
      console.log(`🎯 Offer accepted: Creator ${creator} accepts Challenger ${challenger}`)
      
      // Create or get game state
      if (!gameStateManager.getGame(gameId)) {
        gameStateManager.createGame(gameId, creator, {}, data.cryptoAmount)
      }
      
      // Start deposit stage with synchronized countdown
      const game = gameStateManager.getGame(gameId)
      game.phase = 'deposit_stage'
      game.challenger = challenger
      game.depositTimeRemaining = 120
      game.depositStartTime = Date.now()
      
      // IMPORTANT: Creator has already deposited NFT when they created the game
      game.creatorDeposited = true
      console.log('🎯 Set creatorDeposited to true (NFT already deposited)')
      
      // Start countdown timer that broadcasts to ALL users in room
      const timer = setInterval(() => {
        game.depositTimeRemaining--
        
        // Broadcast countdown to ENTIRE ROOM
        io.to(socketInfo.roomId).emit('deposit_countdown', {
          gameId: socketInfo.roomId, // Use full roomId (includes game_ prefix)
          timeRemaining: game.depositTimeRemaining,
          creatorDeposited: game.creatorDeposited,
          challengerDeposited: game.challengerDeposited
        })
        
        console.log('⏰ Countdown broadcast:', {
          timeRemaining: game.depositTimeRemaining,
          creatorDeposited: game.creatorDeposited,
          challengerDeposited: game.challengerDeposited
        })
        
        // Check if time expired
        if (game.depositTimeRemaining <= 0) {
          clearInterval(timer)
          io.to(socketInfo.roomId).emit('deposit_timeout', {
            gameId: socketInfo.roomId, // Use full roomId (includes game_ prefix)
            message: 'Deposit time expired!'
          })
        }
        
        // Check if both deposited
        if (game.creatorDeposited && game.challengerDeposited) {
          clearInterval(timer)
          
          // Update game state to active
          game.phase = 'game_active'
          game.currentRound = 1
          game.currentTurn = game.creator
          
          console.log('🎮 Both players deposited during countdown - starting game!')
          
          // Broadcast game started event
          io.to(socketInfo.roomId).emit('game_started', {
            gameId: socketInfo.gameId,
            gameIdFull: socketInfo.roomId,
            phase: 'game_active',
            status: 'active', // Also set status for compatibility
            currentRound: 1,
            currentTurn: game.creator,
            creator: game.creator,
            challenger: game.challenger,
            creatorDeposited: game.creatorDeposited,
            challengerDeposited: game.challengerDeposited,
            bothDeposited: true,
            message: 'Both players deposited! Game starting...',
            timestamp: new Date().toISOString()
          })
          
          // Also broadcast transport event to ensure clients switch to flip suite
          setTimeout(() => {
            console.log('🚀 Broadcasting transport_to_flip_suite event from countdown')
            io.to(socketInfo.roomId).emit('transport_to_flip_suite', {
              gameId: socketInfo.gameId,
              gameIdFull: socketInfo.roomId,
              immediate: true,
              reason: 'both_players_deposited',
              creator: game.creator,
              challenger: game.challenger,
              message: 'Both players deposited! Entering Battle Arena...'
            })
          }, 1000)
        }
      }, 1000) // Update every second
      
      // Store timer reference
      gameStateManager.timers.set(gameId, timer)
      
      // Send initial deposit stage notification to ENTIRE ROOM
      io.to(socketInfo.roomId).emit('deposit_stage_started', {
        gameId: socketInfo.roomId, // Use full roomId (includes game_ prefix)
        creator: creator,
        challenger: challenger,
        timeRemaining: 120,
        creatorDeposited: true, // NFT already deposited
        challengerDeposited: false
      })
      
      console.log('🎯 Sent deposit_stage_started with creatorDeposited: true')
      
      // Send specific event to challenger (Player 2) to show deposit overlay
      const challengerSocketId = userSockets.get(challenger.toLowerCase())
      if (challengerSocketId) {
        io.to(challengerSocketId).emit('your_offer_accepted', {
          gameId: socketInfo.roomId, // Use full roomId (includes game_ prefix)
          challenger: challenger,
          cryptoAmount: data.cryptoAmount,
          finalPrice: data.cryptoAmount,
          timestamp: new Date().toISOString()
        })
        console.log(`🎯 Sent your_offer_accepted to challenger: ${challenger}`)
      }
      
      // Update database
      if (dbService) {
        await dbService.updateGameStatus(gameId, 'awaiting_deposits', challenger)
      }
    })

    // Handle deposit confirmation
    socket.on('deposit_confirmed', (data) => {
      console.log('🎯 Server received deposit_confirmed event:', data)
      
      const socketInfo = socketData.get(socket.id)
      if (!socketInfo) {
        console.error('❌ No socket info found for socket:', socket.id)
        return
      }
      
      console.log('🎯 Socket info:', socketInfo)
      
      const game = gameStateManager.getGame(socketInfo.gameId)
      if (!game) {
        console.error('❌ No game found for gameId:', socketInfo.gameId)
        return
      }
      
      console.log('🎯 Current game state:', {
        gameId: socketInfo.gameId,
        challenger: game.challenger,
        player: data.player,
        creatorDeposited: game.creatorDeposited,
        challengerDeposited: game.challengerDeposited
      })
      
      // Update game state
      if (data.player === game.challenger) {
        game.challengerDeposited = true
        console.log('✅ Updated challengerDeposited to true')
      }
      
      // Broadcast to room
      const broadcastData = {
        gameId: socketInfo.gameId,
        player: data.player,
        assetType: data.assetType,
        creatorDeposited: game.creatorDeposited,
        challengerDeposited: game.challengerDeposited,
        bothDeposited: game.creatorDeposited && game.challengerDeposited
      }
      
      console.log('🎯 Broadcasting deposit_confirmed:', broadcastData)
      io.to(socketInfo.roomId).emit('deposit_confirmed', broadcastData)
      
      // Check if both deposited to start game
      if (game.creatorDeposited && game.challengerDeposited) {
        console.log('🎮 Both players deposited - starting game!')
        
        // Update game state to active
        game.phase = 'game_active'
        game.currentRound = 1
        game.currentTurn = game.creator
        
        // Broadcast game started event
        io.to(socketInfo.roomId).emit('game_started', {
          gameId: socketInfo.gameId,
          gameIdFull: socketInfo.roomId, // Include full roomId
          phase: 'game_active',
          status: 'active', // Also set status for compatibility
          currentRound: 1,
          currentTurn: game.creator,
          creator: game.creator,
          challenger: game.challenger,
          creatorDeposited: game.creatorDeposited,
          challengerDeposited: game.challengerDeposited,
          bothDeposited: true,
          message: 'Both players deposited! Game starting...',
          timestamp: new Date().toISOString()
        })
        
        // Also broadcast transport event to ensure clients switch to flip suite
        setTimeout(() => {
          console.log('🚀 Broadcasting transport_to_flip_suite event')
          io.to(socketInfo.roomId).emit('transport_to_flip_suite', {
            gameId: socketInfo.gameId,
            gameIdFull: socketInfo.roomId,
            immediate: true,
            reason: 'both_players_deposited',
            creator: game.creator,
            challenger: game.challenger,
            message: 'Both players deposited! Entering Battle Arena...'
          })
        }, 1000)
      }
    })

    // Request current game state
    socket.on('request_game_state', async ({ gameId }) => {
      console.log(`📊 Game state requested for ${gameId}`)
      
      let gameState = gameStates.get(gameId)
      
      if (!gameState) {
        // Try to load from database
        const gameData = await dbService.getGame(gameId)
        if (gameData && gameData.status === 'active') {
          gameState = initializeGameState(gameId, gameData)
        }
      }
      
      if (gameState) {
        socket.emit('game_state_update', gameState)
      }
    })
    
    // Handle player choice (heads/tails)
    socket.on('player_choice', async ({ gameId, choice, power }) => {
      const gameState = gameStates.get(gameId)
      if (!gameState) return
      
      const userAddress = socket.userAddress || socketData.get(socket.id)?.address
      const isCreator = userAddress === gameState.creator
      
      console.log(`🎯 Player choice: ${choice} with power ${power} from ${isCreator ? 'creator' : 'challenger'}`)
      
      // Store the choice
      if (isCreator) {
        gameState.creatorChoice = choice
        gameState.creatorPower = power
      } else {
        gameState.challengerChoice = choice
        gameState.challengerPower = power
      }
      
      // Broadcast updated state
      io.to(`game_${gameId}`).emit('game_state_update', gameState)
      
      // Check if both players have made their choice
      if (gameState.creatorChoice && gameState.challengerChoice) {
        // Execute the flip
        await executeFlip(gameId, gameState, io, dbService)
      }
    })
    
    // Handle game ready (both deposits confirmed)
    socket.on('game_deposits_confirmed', async ({ gameId }) => {
      console.log(`💰 Both deposits confirmed for game ${gameId}`)
      
      const gameData = await dbService.getGame(gameId)
      if (!gameData) return
      
      // Initialize game state
      const gameState = initializeGameState(gameId, gameData)
      
      // Update database
      await dbService.updateGame(gameId, { 
        status: 'active',
        phase: 'active'
      })
      
      // Notify all players
      io.to(`game_${gameId}`).emit('game_ready', {
        gameId,
        message: 'Game is starting!',
        gameState
      })
      
      io.to(`game_${gameId}`).emit('game_state_update', gameState)
    })

    // Handle game actions
    socket.on('game_action', (data) => {
      console.log('🎮 Game action received:', data)
      
      const socketInfo = socketData.get(socket.id)
      if (!socketInfo) {
        console.error('❌ No socket info found for game action')
        return
      }
      
      const game = gameStateManager.getGame(socketInfo.gameId)
      if (!game) {
        console.error('❌ No game found for game action')
        return
      }
      
      // Handle different game actions
      switch (data.action) {
        case 'MAKE_CHOICE':
          console.log('🎯 Player made choice:', data.choice)
          // Broadcast choice to room
          io.to(socketInfo.roomId).emit('choice_made', {
            gameId: socketInfo.gameId,
            player: data.player,
            choice: data.choice,
            currentRound: game.currentRound || 1
          })
          break
          
        case 'POWER_CHARGE_START':
          console.log('⚡ Power charge started by:', data.player)
          io.to(socketInfo.roomId).emit('power_charge_started', {
            gameId: socketInfo.gameId,
            player: data.player
          })
          break
          
        case 'POWER_CHARGED':
          console.log('⚡ Power charged by:', data.player, 'Level:', data.powerLevel)
          io.to(socketInfo.roomId).emit('power_charged', {
            gameId: socketInfo.gameId,
            player: data.player,
            powerLevel: data.powerLevel
          })
          break
          
        case 'FORFEIT_GAME':
          console.log('🏳️ Game forfeited by:', data.player)
          io.to(socketInfo.roomId).emit('game_forfeited', {
            gameId: socketInfo.gameId,
            forfeiter: data.player
          })
          break
          
        default:
          console.log('⚠️ Unknown game action:', data.action)
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

  console.log('✅ Socket.io server initialized')
  return io
}

// Export the handler function to be added to your main socket handler
module.exports = { 
  initializeSocketIO,
  addGameHandlers: (socket, io, dbService) => {
    // Request current game state
    socket.on('request_game_state', async ({ gameId }) => {
      console.log(`📊 Game state requested for ${gameId}`)
      
      let gameState = gameStates.get(gameId)
      
      if (!gameState) {
        // Try to load from database
        const gameData = await dbService.getGame(gameId)
        if (gameData && gameData.status === 'active') {
          gameState = initializeGameState(gameId, gameData)
        }
      }
      
      if (gameState) {
        socket.emit('game_state_update', gameState)
      }
    })
    
    // Handle player choice (heads/tails)
    socket.on('player_choice', async ({ gameId, choice, power }) => {
      const gameState = gameStates.get(gameId)
      if (!gameState) return
      
      const userAddress = socket.userAddress || socketData.get(socket.id)?.address
      const isCreator = userAddress === gameState.creator
      
      console.log(`🎯 Player choice: ${choice} with power ${power} from ${isCreator ? 'creator' : 'challenger'}`)
      
      // Store the choice
      if (isCreator) {
        gameState.creatorChoice = choice
        gameState.creatorPower = power
      } else {
        gameState.challengerChoice = choice
        gameState.challengerPower = power
      }
      
      // Broadcast updated state
      io.to(`game_${gameId}`).emit('game_state_update', gameState)
      
      // Check if both players have made their choice
      if (gameState.creatorChoice && gameState.challengerChoice) {
        // Execute the flip
        await executeFlip(gameId, gameState, io, dbService)
      }
    })
    
    // Handle game ready (both deposits confirmed)
    socket.on('game_deposits_confirmed', async ({ gameId }) => {
      console.log(`💰 Both deposits confirmed for game ${gameId}`)
      
      const gameData = await dbService.getGame(gameId)
      if (!gameData) return
      
      // Initialize game state
      const gameState = initializeGameState(gameId, gameData)
      
      // Update database
      await dbService.updateGame(gameId, { 
        status: 'active',
        phase: 'active'
      })
      
      // Notify all players
      io.to(`game_${gameId}`).emit('game_ready', {
        gameId,
        message: 'Game is starting!',
        gameState
      })
      
      io.to(`game_${gameId}`).emit('game_state_update', gameState)
    })
  }
}
