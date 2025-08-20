const crypto = require('crypto')
const CoinStreamService = require('../services/coinStream')
const GameRoom = require('../services/gameRoom')

// Room management
const rooms = new Map() // General lobby rooms: game_${gameId} -> Set<socketId>
const gameRooms = new Map() // Private game rooms: game_room_${gameId} -> GameRoom instance
const socketRooms = new Map() // socketId -> roomId
const userSockets = new Map() // address -> socket

// Create WebSocket handlers
function createWebSocketHandlers(wss, dbService, blockchainService) {
  // Handle WebSocket connections
  wss.on('connection', (socket, req) => {
    socket.id = crypto.randomBytes(16).toString('hex')
    console.log(`🔌 New WebSocket connection: ${socket.id}`)
    console.log(`🌐 Connection from: ${req.socket.remoteAddress}`)
    console.log(`📊 Total connected clients: ${wss.clients.size}`)
    
    socket.on('close', () => {
      console.log(`🔌 WebSocket disconnected: ${socket.id}`)
      
      // Cleanup lobby rooms
      const room = socketRooms.get(socket.id)
      if (room && rooms.has(room)) {
        rooms.get(room).delete(socket.id)
      }
      
      // Cleanup game rooms
      if (socket.address) {
        // Check if player was in a game room
        gameRooms.forEach((gameRoom, roomId) => {
          if (gameRoom.removePlayer(socket.address, socket)) {
            console.log(`🏟️ Removed ${socket.address} from game room ${roomId}`)
          }
        })
        
        userSockets.delete(socket.address)
      }
      
      socketRooms.delete(socket.id)
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
          case 'join_game_room':
            handleJoinGameRoom(socket, data, dbService)
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
          case 'ping':
            // Handle heartbeat ping
            try {
              socket.send(JSON.stringify({ 
                type: 'pong', 
                timestamp: data.timestamp 
              }))
            } catch (error) {
              console.error('❌ Error sending pong:', error)
            }
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

  // Handle joining game room (private 2-player room)
  async function handleJoinGameRoom(socket, data, dbService) {
    const { gameId, address } = data
    
    console.log(`🏟️ Player ${address} requesting to join game room for game ${gameId}`)
    
    // Verify player is authorized for this game
    const db = dbService.getDatabase()
    
    db.get('SELECT * FROM games WHERE id = ?', [gameId], (err, game) => {
      if (err || !game) {
        console.error('❌ Game not found:', gameId)
        socket.send(JSON.stringify({
          type: 'game_room_error',
          error: 'Game not found'
        }))
        return
      }
      
      const creator = game.creator
      const challenger = game.challenger || game.joiner
      
      // Check if player is authorized
      if (address !== creator && address !== challenger) {
        console.log(`❌ Player ${address} not authorized for game ${gameId}`)
        socket.send(JSON.stringify({
          type: 'game_room_error',
          error: 'Not authorized for this game'
        }))
        return
      }
      
      // Get or create game room
      const roomId = `game_room_${gameId}`
      let gameRoom = gameRooms.get(roomId)
      
      if (!gameRoom) {
        // Create new game room
        gameRoom = new GameRoom(gameId, creator, challenger, {
          broadcastToRoom: (roomId, message) => broadcastToRoom(roomId, message),
          broadcastToAll: (message) => broadcastToAll(message),
          sendToUser: (address, message) => sendToUser(address, message)
        })
        gameRooms.set(roomId, gameRoom)
        console.log(`🏟️ Created new game room: ${roomId}`)
      }
      
      // Add player to game room
      if (gameRoom.addPlayer(address, socket)) {
        socket.address = address
        userSockets.set(address, socket)
        socketRooms.set(socket.id, roomId)
        
        socket.send(JSON.stringify({
          type: 'game_room_joined',
          roomId,
          gameId,
          players: gameRoom.players,
          status: gameRoom.getStatus()
        }))
        
        console.log(`✅ Player ${address} joined game room ${roomId}`)
      } else {
        socket.send(JSON.stringify({
          type: 'game_room_error',
          error: 'Failed to join game room'
        }))
      }
    })
  }

  async function handleJoinRoom(socket, data) {
    const { roomId } = data
    
    // Normalize room ID - remove any double prefixes
    let targetRoomId = roomId
    
    // Remove any existing game_ prefix to avoid double prefixes
    if (targetRoomId.startsWith('game_game_')) {
      targetRoomId = targetRoomId.replace('game_game_', 'game_')
    } else if (targetRoomId.startsWith('game_room_')) {
      // Keep game_room_ prefix as is
    } else if (targetRoomId.startsWith('game_')) {
      // Keep single game_ prefix as is
    } else {
      // Add lobby prefix for chat messages
      targetRoomId = `game_${targetRoomId}`
    }
    
    console.log(`👥 Socket ${socket.id} requesting to join room ${targetRoomId} (original: ${roomId})`)
    console.log(`🏠 Current rooms:`, Array.from(rooms.keys()))
    console.log(`👥 Current room members:`, Array.from(rooms.values()).map(room => room.size))
    
    // Leave previous room if any
    const oldRoom = socketRooms.get(socket.id)
    if (oldRoom && rooms.has(oldRoom)) {
      rooms.get(oldRoom).delete(socket.id)
      console.log(`👋 Socket ${socket.id} left old room ${oldRoom}`)
    }
    
    // Join new room
    if (!rooms.has(targetRoomId)) {
      rooms.set(targetRoomId, new Set())
      console.log(`🏠 Created new room: ${targetRoomId}`)
    }
    
    const room = rooms.get(targetRoomId)
    room.add(socket.id)
    socketRooms.set(socket.id, targetRoomId)
    
    console.log(`👥 Socket ${socket.id} joined room ${targetRoomId} (${room.size} members total)`)
    console.log(`🏠 All rooms after join:`, Array.from(rooms.keys()))
    console.log(`👥 All room members:`, Array.from(rooms.entries()).map(([roomId, members]) => ({ roomId, memberCount: members.size, members: Array.from(members) })))
    
    // Send confirmation
    try {
      socket.send(JSON.stringify({
        type: 'room_joined',
        roomId: targetRoomId,
        members: room.size
      }))
      
      // Load and send chat history to the new player
      try {
        const chatHistory = await dbService.getChatHistory(targetRoomId, 50) // Load last 50 messages
        console.log(`📚 Loading chat history for room ${targetRoomId}: ${chatHistory.length} messages`)
        
        if (chatHistory.length > 0) {
          // Send chat history to the new player
          socket.send(JSON.stringify({
            type: 'chat_history',
            roomId: targetRoomId,
            messages: chatHistory
          }))
          console.log(`📤 Sent chat history to new player in room ${targetRoomId}`)
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
    const { roomId, gameId, message, from } = data
    
    // Normalize room ID - remove any double prefixes
    let targetRoomId = roomId || gameId
    
    // Remove any existing game_ prefix to avoid double prefixes
    if (targetRoomId.startsWith('game_game_')) {
      targetRoomId = targetRoomId.replace('game_game_', 'game_')
    } else if (targetRoomId.startsWith('game_room_')) {
      // Keep game_room_ prefix as is
    } else if (targetRoomId.startsWith('game_')) {
      // Keep single game_ prefix as is
    } else {
      // Add lobby prefix for chat messages
      targetRoomId = `game_${targetRoomId}`
    }
    
    const senderAddress = socket.address || from || 'anonymous'
    
    console.log('💬 Processing chat message:', {
      originalRoomId: roomId,
      gameId,
      targetRoomId,
      senderAddress,
      message: message.substring(0, 50) + '...'
    })
    
    try {
      // Save to database
      await dbService.saveChatMessage(targetRoomId, senderAddress, message, 'chat')
      
      // Broadcast to room
      broadcastToRoom(targetRoomId, {
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
    const { gameId, action, choice, player, powerLevel, oppositeChoice } = data
    console.log('🎯 Processing game action:', { gameId, action, choice, player, oppositeChoice })
    
    // Only handle game room actions
    const gameRoomId = `game_room_${gameId}`
    const gameRoom = gameRooms.get(gameRoomId)
    
    if (gameRoom) {
      return await handleGameRoomAction(gameRoom, action, choice, player, powerLevel, oppositeChoice)
    } else {
      console.error('❌ Game room not found:', gameRoomId)
      socket.send(JSON.stringify({
        type: 'game_room_error',
        error: 'Game room not found'
      }))
    }
  }

  // Handle game room specific actions
  async function handleGameRoomAction(gameRoom, action, choice, player, powerLevel, oppositeChoice) {
    console.log(`🏟️ Processing game room action: ${action}`)
    
    switch (action) {
      case 'MAKE_CHOICE':
        return gameRoom.handlePlayerChoice(player, choice, oppositeChoice)
        
      case 'POWER_CHARGE_START':
        // Game rooms handle power charging differently
        return true
        
      case 'POWER_CHARGED':
        return gameRoom.handlePowerCharge(player, powerLevel)
        
      case 'FORFEIT_GAME':
        return gameRoom.handleForfeit(player, 'manual')
        
      default:
        console.log('⚠️ Unhandled game room action:', action)
        return false
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
    // Accept both field name variations for compatibility
    const gameId = data.gameId || data.listingId
    const offererAddress = data.offererAddress || data.address
    const cryptoAmount = data.cryptoAmount || data.amount
    const timestamp = data.timestamp
    
    if (!gameId || !offererAddress || !cryptoAmount) {
      console.error('❌ Invalid crypto offer data:', data)
      return
    }
    
    console.log('🎯 Processing crypto offer:', { gameId, offererAddress, cryptoAmount })
    console.log('🏠 Available rooms:', Array.from(rooms.keys()))
    console.log('👥 Room members for this game:', rooms.has(gameId) ? Array.from(rooms.get(gameId)) : 'Room not found')
    
    try {
      // Get the listing_id for this game
      const db = dbService.getDatabase()
      let listingId = gameId
      
      // If the gameId looks like a listing ID (starts with 'listing_'), use it directly
      if (gameId.startsWith('listing_')) {
        listingId = gameId
        console.log('📋 Using provided listing ID directly:', listingId)
      } else {
        // Otherwise, try to find the game and get its listing_id
        const game = await new Promise((resolve, reject) => {
          db.get('SELECT listing_id FROM games WHERE id = ?', [gameId], (err, result) => {
            if (err) reject(err)
            else resolve(result)
          })
        })
        
        if (!game || !game.listing_id) {
          console.error('❌ Game not found or no listing_id:', gameId)
          return
        }
        
        listingId = game.listing_id
        console.log('📋 Found listing ID from game:', listingId)
      }
      
      // Create offer ID
      const offerId = `offer_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
      
      // Save offer to offers table
      await dbService.createOffer({
        id: offerId,
        listing_id: listingId,
        offerer_address: offererAddress,
        offer_price: cryptoAmount,
        message: `Crypto offer of $${cryptoAmount} USD`
      })
      
      console.log('✅ Offer saved to database:', offerId)
      
      // Find the actual game ID for this listing to save chat message and broadcast
      const game = await new Promise((resolve, reject) => {
        db.get('SELECT id FROM games WHERE listing_id = ?', [listingId], (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      })
      
      const actualGameId = game?.id || gameId
      
      // Normalize room ID for lobby
      const lobbyRoomId = `game_${actualGameId}`
      
      // Also save as chat message for real-time display
      await dbService.saveChatMessage(
        lobbyRoomId, 
        offererAddress, 
        `Crypto offer of $${cryptoAmount} USD`, 
        'offer', 
        { cryptoAmount, offerType: 'crypto', offerId }
      )
      
      // Broadcast to the game room
      const broadcastMessage = {
        type: 'crypto_offer',
        gameId: actualGameId,
        offererAddress,
        cryptoAmount,
        offerId,
        timestamp: timestamp || new Date().toISOString()
      }
      
      console.log('📢 Broadcasting crypto offer:', broadcastMessage)
      broadcastToRoom(lobbyRoomId, broadcastMessage)
      console.log('✅ Crypto offer broadcasted successfully to room', actualGameId)
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
      console.log('🎯 Processing offer acceptance:', { gameId, creatorAddress, acceptedOffer })
      
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
        
        console.log('🔧 Updating game status with data:', {
          gameId,
          status: 'waiting_challenger_deposit',
          depositDeadline: depositDeadline.toISOString(),
          challenger: acceptedOffer.address,
          paymentAmount: acceptedOffer.cryptoAmount
        })
        
        // First, let's check if the game exists and get its current status
        db.get('SELECT status, challenger FROM games WHERE id = ?', [gameId], (err, game) => {
          if (err) {
            console.error('❌ Error checking game status:', err)
            return
          }
          
          if (!game) {
            console.error('❌ Game not found:', gameId)
            return
          }
          
          console.log('📊 Current game status:', game)
          
          // Now update the game status
          db.run(
            'UPDATE games SET status = ?, deposit_deadline = ?, challenger = ?, payment_amount = ? WHERE id = ?',
            ['waiting_challenger_deposit', depositDeadline.toISOString(), acceptedOffer.address, acceptedOffer.cryptoAmount, gameId],
            function(err) {
              if (err) {
                console.error('❌ Error updating game status:', err)
                console.error('❌ SQL Error details:', {
                  message: err.message,
                  code: err.code,
                  errno: err.errno
                })
              } else {
                console.log('✅ Game status updated successfully:', {
                  gameId,
                  rowsAffected: this.changes,
                  newStatus: 'waiting_challenger_deposit',
                  challenger: acceptedOffer.address,
                  paymentAmount: acceptedOffer.cryptoAmount
                })
                
                // Verify the update worked
                db.get('SELECT status, challenger, payment_amount FROM games WHERE id = ?', [gameId], (verifyErr, updatedGame) => {
                  if (verifyErr) {
                    console.error('❌ Error verifying game update:', verifyErr)
                  } else {
                    console.log('✅ Game update verified:', updatedGame)
                  }
                })
                
                // Save system message to database
                dbService.saveChatMessage(
                  gameId, 
                  'system', 
                  `🎮 Game accepted! Player 2, please load your ${acceptedOffer.cryptoAmount} USD worth of ETH to start the game!`, 
                  'system'
                ).catch(err => {
                  console.error('❌ Error saving system message:', err)
                })
                
                // Broadcast game status update to trigger countdown
                broadcastToRoom(gameId, {
                  type: 'game_awaiting_challenger_deposit',
                  gameId,
                  status: 'waiting_challenger_deposit',
                  deposit_deadline: depositDeadline.toISOString(),
                  challenger: acceptedOffer.address,
                  cryptoAmount: acceptedOffer.cryptoAmount,
                  payment_amount: acceptedOffer.cryptoAmount
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
        })
      }
    } catch (error) {
      console.error('❌ Error saving offer acceptance:', error)
      console.error('❌ Error stack:', error.stack)
    }
  }

  // Cleanup empty game rooms periodically
  setInterval(() => {
    gameRooms.forEach((gameRoom, roomId) => {
      if (gameRoom.isEmpty() && gameRoom.state === 'completed') {
        console.log(`🧹 Cleaning up empty game room: ${roomId}`)
        gameRoom.cleanup()
        gameRooms.delete(roomId)
      }
    })
  }, 60000) // Check every minute

  return {
    broadcastToRoom,
    broadcastToAll,
    getUserSocket,
    sendToUser,
    gameRooms
  }
}

module.exports = { createWebSocketHandlers } 