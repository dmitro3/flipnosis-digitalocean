// handlers/server-socketio.js
// Socket.io server implementation - much cleaner than raw WebSocket!

const socketIO = require('socket.io')
const GameStateManager = require('./GameStateManager')

// Initialize game state manager
const gameStateManager = new GameStateManager()

// Store user connections
const userSockets = new Map() // address -> socketId
const socketData = new Map() // socketId -> { address, gameId, roomId }

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

module.exports = { initializeSocketIO }
