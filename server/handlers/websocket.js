const crypto = require('crypto')
const CoinStreamService = require('../services/coinStream')
const GameEngine = require('../services/gameEngine')

// Room management
const rooms = new Map()
const socketRooms = new Map()
const userSockets = new Map()

// Initialize game engine
let gameEngine = null

// Create WebSocket handlers
function createWebSocketHandlers(wss, dbService, blockchainService) {
  // Initialize game engine
  gameEngine = new GameEngine(dbService, {
    broadcastToRoom: (roomId, message) => broadcastToRoom(roomId, message),
    broadcastToAll: (message) => broadcastToAll(message),
    sendToUser: (address, message) => sendToUser(address, message)
  })
  // Handle WebSocket connections
  wss.on('connection', (socket, req) => {
    socket.id = crypto.randomBytes(16).toString('hex')
    console.log(`🔌 New WebSocket connection: ${socket.id}`)
    console.log(`🌐 Connection from: ${req.socket.remoteAddress}`)
    console.log(`📊 Total connected clients: ${wss.clients.size}`)
    
    socket.on('close', () => {
      console.log(`🔌 WebSocket disconnected: ${socket.id}`)
      
      // Cleanup
      const room = socketRooms.get(socket.id)
      if (room && rooms.has(room)) {
        rooms.get(room).delete(socket.id)
      }
      socketRooms.delete(socket.id)
      
      if (socket.address) {
        userSockets.delete(socket.address)
      }
    })

    socket.on('message', async (message) => {
      try {
        console.log(`📨 Raw message from ${socket.id}:`, message.toString())
        const data = JSON.parse(message)
        
        // Ensure type field exists
        if (!data || typeof data !== 'object') {
          console.warn('Invalid WebSocket data format')
          return
        }
        
        console.log('📡 Received WebSocket message:', data)
        console.log('🔍 Message type:', data.type)
        
        switch (data.type) {
          case 'join_room':
            handleJoinRoom(socket, data)
            break
          case 'register_user':
            handleRegisterUser(socket, data)
            break
          case 'chat_message':
            handleChatMessage(socket, data)
            break
          case 'GAME_ACTION':
            console.log('🎮 Received GAME_ACTION:', data)
            handleGameAction(socket, data, dbService)
            break
          case 'nft_offer':
            handleNftOffer(socket, data)
            break
          case 'crypto_offer':
            console.log('🎯 Handling crypto_offer:', data)
            handleCryptoOffer(socket, data, dbService)
            break
          case 'accept_nft_offer':
          case 'accept_crypto_offer':
            handleOfferAccepted(socket, data)
            break
          default:
            console.log('⚠️ Unhandled WebSocket message type:', data.type)
        }
      } catch (error) {
        console.error('❌ WebSocket error:', error)
      }
    })
  })

  // Broadcast to room
  function broadcastToRoom(roomId, message) {
    if (!rooms.has(roomId)) {
      console.log(`⚠️ Room ${roomId} not found, creating it`)
      rooms.set(roomId, new Set())
    }
    
    const room = rooms.get(roomId)
    const messageStr = JSON.stringify(message)
    
    console.log(`📢 Broadcasting to room ${roomId}:`, {
      messageType: message.type,
      roomSize: room.size,
      connectedClients: wss.clients.size,
      message: message,
      roomMembers: Array.from(room)
    })
    
    let successfulBroadcasts = 0
    let failedBroadcasts = 0
    
    // Get all active WebSocket clients
    const activeClients = Array.from(wss.clients).filter(client => 
      client.readyState === 1 // WebSocket.OPEN
    )
    
    console.log(`🔍 Active clients: ${activeClients.length}, Room members: ${room.size}`)
    
    // Broadcast to room members
    room.forEach(socketId => {
      const client = activeClients.find(s => s.id === socketId)
      if (client) {
        try {
          client.send(messageStr)
          successfulBroadcasts++
          console.log(`✅ Sent message to client ${socketId}`)
        } catch (error) {
          console.error(`❌ Failed to send to client ${socketId}:`, error)
          failedBroadcasts++
          // Remove failed client from room
          room.delete(socketId)
        }
      } else {
        console.log(`⚠️ Client ${socketId} not found or not connected, removing from room`)
        room.delete(socketId)
        failedBroadcasts++
      }
    })
    
    // Also try to broadcast to any clients that might not be in the room but should receive the message
    // This is a safety net for connection issues
    if (message.type === 'player_choice_made' || message.type === 'both_choices_made' || message.type === 'power_charged') {
      activeClients.forEach(client => {
        if (client.address && !room.has(client.id)) {
          try {
            client.send(messageStr)
            console.log(`📤 Sent message to non-room client: ${client.address}`)
          } catch (error) {
            console.error(`❌ Failed to send to non-room client:`, error)
          }
        }
      })
    }
    
    console.log(`✅ Broadcast complete: ${successfulBroadcasts} successful, ${failedBroadcasts} failed`)
    
    // Clean up empty rooms
    if (room.size === 0) {
      rooms.delete(roomId)
      console.log(`🧹 Cleaned up empty room: ${roomId}`)
    }
  }

  // Broadcast to all
  function broadcastToAll(message) {
    const messageStr = JSON.stringify(message)
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(messageStr)
      }
    })
  }

  // Get user socket
  function getUserSocket(address) {
    return userSockets.get(address)
  }

  // Send message to specific user
  function sendToUser(address, message) {
    const socket = userSockets.get(address)
    if (socket && socket.readyState === 1) { // WebSocket.OPEN
      socket.send(JSON.stringify(message))
    }
  }

  // Add a function to ensure room membership
  function ensureRoomMembership(socket, roomId) {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set())
    }
    
    const room = rooms.get(roomId)
    if (!room.has(socket.id)) {
      room.add(socket.id)
      socketRooms.set(socket.id, roomId)
      console.log(`✅ Added socket ${socket.id} to room ${roomId}`)
    }
  }

  async function handleJoinRoom(socket, data) {
    const { roomId } = data
    
    console.log(`👥 Socket ${socket.id} requesting to join room ${roomId}`)
    console.log(`🏠 Current rooms:`, Array.from(rooms.keys()))
    console.log(`👥 Current room members:`, Array.from(rooms.values()).map(room => room.size))
    
    // Leave previous room if any
    const oldRoom = socketRooms.get(socket.id)
    if (oldRoom && rooms.has(oldRoom)) {
      rooms.get(oldRoom).delete(socket.id)
      console.log(`👋 Socket ${socket.id} left old room ${oldRoom}`)
    }
    
    // Join new room
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set())
      console.log(`🏠 Created new room: ${roomId}`)
    }
    
    const room = rooms.get(roomId)
    room.add(socket.id)
    socketRooms.set(socket.id, roomId)
    
    console.log(`👥 Socket ${socket.id} joined room ${roomId} (${room.size} members total)`)
    console.log(`🏠 All rooms after join:`, Array.from(rooms.keys()))
    console.log(`👥 All room members:`, Array.from(rooms.entries()).map(([roomId, members]) => ({ roomId, memberCount: members.size, members: Array.from(members) })))
    
    // Send confirmation
    try {
      socket.send(JSON.stringify({
        type: 'room_joined',
        roomId: roomId,
        members: room.size
      }))
      
      // Load and send chat history to the new player
      try {
        const chatHistory = await dbService.getChatHistory(roomId, 50) // Load last 50 messages
        console.log(`📚 Loading chat history for room ${roomId}: ${chatHistory.length} messages`)
        
        if (chatHistory.length > 0) {
          // Send chat history to the new player
          socket.send(JSON.stringify({
            type: 'chat_history',
            roomId: roomId,
            messages: chatHistory
          }))
          console.log(`📤 Sent chat history to new player in room ${roomId}`)
        }
      } catch (error) {
        console.error('❌ Error loading chat history:', error)
      }
      
    } catch (error) {
      console.error('❌ Failed to send room join confirmation:', error)
    }
  }

  function handleRegisterUser(socket, data) {
    const { address } = data
    socket.address = address
    userSockets.set(address, socket)
    console.log(`👤 User registered: ${address}`)
  }

  async function handleChatMessage(socket, data) {
    const { roomId, message, from } = data
    
    const senderAddress = socket.address || from || 'anonymous'
    
    try {
      // Save to database
      await dbService.saveChatMessage(roomId, senderAddress, message, 'chat')
      
      // Broadcast to room
      broadcastToRoom(roomId, {
        type: 'chat_message',
        message,
        from: senderAddress,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('❌ Error saving chat message:', error)
    }
  }

  async function handleGameAction(socket, data, dbService) {
    const { gameId, action, choice, player, powerLevel } = data
    console.log('🎯 Processing game action:', { gameId, action, choice, player })
    
    if (!gameEngine) {
      console.error('❌ Game engine not initialized')
      return
    }
    
    // Get game state from engine
    let gameState = gameEngine.getGameState(gameId)
    
    // If game not in engine, try to initialize it
    if (!gameState) {
      console.log('🔄 Game not in engine, initializing...')
      const db = dbService.getDatabase()
      
      db.get('SELECT * FROM games WHERE id = ?', [gameId], async (err, game) => {
        if (err || !game) {
          console.error('❌ Game not found in database:', gameId)
          return
        }
        
        // Initialize game in engine
        gameState = await gameEngine.initializeGame(gameId, game)
        if (!gameState) {
          console.error('❌ Failed to initialize game in engine')
          return
        }
        
        // Now handle the action
        await handleGameActionInternal(gameId, action, choice, player, powerLevel)
      })
      return
    }
    
    // Handle action with existing game state
    await handleGameActionInternal(gameId, action, choice, player, powerLevel)
  }

  async function handleGameActionInternal(gameId, action, choice, player, powerLevel) {
    console.log('🎯 Processing game action with engine:', { gameId, action, choice, player })
    
    switch (action) {
      case 'MAKE_CHOICE':
        console.log('🎯 Player making choice:', { player, choice, gameId })
        await gameEngine.handlePlayerChoice(gameId, player, choice)
        break
        
      case 'POWER_CHARGE_START':
        console.log('⚡ Power charge started:', { player, gameId })
        await gameEngine.handlePowerChargeStart(gameId, player)
        break
        
      case 'POWER_CHARGED':
        console.log('⚡ Power charged:', { player, powerLevel, gameId })
        await gameEngine.handlePowerChargeComplete(gameId, player, powerLevel)
        break
        
      case 'AUTO_FLIP':
      case 'AUTO_FLIP_TIMEOUT':
        console.log('🎲 Auto flip triggered:', { player, choice, gameId })
        // Auto-flip is handled by timers in the game engine
        break
        
      default:
        console.log('⚠️ Unhandled game action:', action)
    }
  }









  // Handle NFT offer (for NFT-vs-NFT games)
  async function handleNftOffer(socket, data) {
    const { gameId, offererAddress, nft, timestamp } = data
    if (!gameId || !offererAddress || !nft) {
      console.error('❌ Invalid NFT offer data:', data)
      return
    }
    
    try {
      // Save to database
      await dbService.saveChatMessage(
        gameId, 
        offererAddress, 
        `NFT offer submitted`, 
        'offer', 
        { nft, offerType: 'nft' }
      )
      
      // Broadcast to the game room
      broadcastToRoom(gameId, {
        type: 'nft_offer',
        offererAddress,
        nft,
        timestamp: timestamp || new Date().toISOString()
      })
      console.log('📢 Broadcasted nft_offer to room', gameId)
    } catch (error) {
      console.error('❌ Error saving NFT offer:', error)
    }
  }

  // Handle crypto offer (for NFT-vs-crypto games)
  async function handleCryptoOffer(socket, data, dbService) {
    const { gameId, offererAddress, cryptoAmount, timestamp } = data
    if (!gameId || !offererAddress || !cryptoAmount) {
      console.error('❌ Invalid crypto offer data:', data)
      return
    }
    
    console.log('🎯 Processing crypto offer:', { gameId, offererAddress, cryptoAmount })
    console.log('🏠 Available rooms:', Array.from(rooms.keys()))
    console.log('👥 Room members for this game:', rooms.has(gameId) ? Array.from(rooms.get(gameId)) : 'Room not found')
    
    try {
      // Save to database
      await dbService.saveChatMessage(
        gameId, 
        offererAddress, 
        `Crypto offer of $${cryptoAmount} USD`, 
        'offer', 
        { cryptoAmount, offerType: 'crypto' }
      )
      
      // Broadcast to the game room
      const broadcastMessage = {
        type: 'crypto_offer',
        gameId,
        offererAddress,
        cryptoAmount,
        timestamp: timestamp || new Date().toISOString()
      }
      
      console.log('📢 Broadcasting crypto offer:', broadcastMessage)
      broadcastToRoom(gameId, broadcastMessage)
      console.log('✅ Crypto offer broadcasted successfully to room', gameId)
    } catch (error) {
      console.error('❌ Error saving crypto offer:', error)
    }
  }

  // Handle offer acceptance (for both NFT and crypto offers)
  async function handleOfferAccepted(socket, data) {
    const { gameId, creatorAddress, acceptedOffer, timestamp } = data
    if (!gameId || !creatorAddress || !acceptedOffer) {
      console.error('❌ Invalid accept offer data:', data)
      return
    }
    
    try {
      // Determine the offer type and broadcast accordingly
      const offerType = acceptedOffer.cryptoAmount ? 'accept_crypto_offer' : 'accept_nft_offer'
      
      // Save acceptance to database
      await dbService.saveChatMessage(
        gameId, 
        creatorAddress, 
        `Offer accepted`, 
        'offer_accepted', 
        { acceptedOffer, offerType }
      )
      
      // Broadcast acceptance to the game room
      broadcastToRoom(gameId, {
        type: offerType,
        acceptedOffer,
        creatorAddress,
        timestamp: timestamp || new Date().toISOString()
      })
      console.log(`📢 Broadcasted ${offerType} to room`, gameId)
      
      // If this is a crypto offer acceptance, trigger the game start process
      if (acceptedOffer.cryptoAmount) {
        console.log('🎮 Crypto offer accepted, triggering game start process for game:', gameId)
        
        // Update game status to waiting for challenger deposit
        const depositDeadline = new Date(Date.now() + 2 * 60 * 1000) // 2 minutes from now
        const db = dbService.getDatabase()
        
        db.run(
          'UPDATE games SET status = ?, deposit_deadline = ?, challenger = ? WHERE id = ?',
          ['waiting_challenger_deposit', depositDeadline.toISOString(), acceptedOffer.address, gameId],
          async (err) => {
            if (err) {
              console.error('❌ Error updating game status:', err)
            } else {
              console.log('✅ Game status updated to waiting_challenger_deposit')
              
              // Save system message to database
              await dbService.saveChatMessage(
                gameId, 
                'system', 
                `🎮 Game accepted! Player 2, please load your ${acceptedOffer.cryptoAmount} USD worth of ETH to start the game!`, 
                'system'
              )
              
              // Broadcast game status update to trigger countdown
              broadcastToRoom(gameId, {
                type: 'game_awaiting_challenger_deposit',
                gameId,
                status: 'waiting_challenger_deposit',
                deposit_deadline: depositDeadline.toISOString(),
                challenger: acceptedOffer.address,
                cryptoAmount: acceptedOffer.cryptoAmount
              })
              
              // Broadcast a system message to prompt the joiner to load their crypto
              broadcastToRoom(gameId, {
                type: 'chat_message',
                message: `🎮 Game accepted! Player 2, please load your ${acceptedOffer.cryptoAmount} USD worth of ETH to start the game!`,
                from: 'system',
                timestamp: new Date().toISOString()
              })
            }
          }
        )
      }
    } catch (error) {
      console.error('❌ Error saving offer acceptance:', error)
    }
  }

  return {
    broadcastToRoom,
    broadcastToAll,
    getUserSocket,
    sendToUser,
    gameEngine
  }
}

module.exports = { createWebSocketHandlers } 