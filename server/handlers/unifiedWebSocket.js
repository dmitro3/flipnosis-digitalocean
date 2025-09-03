const WebSocket = require('ws')

// ===== ROOM MANAGEMENT =====
const rooms = new Map() // roomId -> Set of socket IDs
const socketRooms = new Map() // socketId -> roomId
const socketData = new Map() // socketId -> { address, gameId, etc }
const addressToSocket = new Map() // address -> socketId for direct messaging

// ===== UNIFIED MESSAGE HANDLERS =====
async function handleJoinRoom(socket, data, dbService) {
  const { roomId, address } = data
  
  // STANDARDIZED room naming - always use game_${gameId}
  const normalizedRoomId = roomId.startsWith('game_') ? roomId : `game_${roomId}`
  
  // Leave previous room if any
  const previousRoom = socketRooms.get(socket.id)
  if (previousRoom && rooms.has(previousRoom)) {
    rooms.get(previousRoom).delete(socket.id)
    console.log(`📤 Socket ${socket.id} left room ${previousRoom}`)
  }
  
  // Join new room
  if (!rooms.has(normalizedRoomId)) {
    rooms.set(normalizedRoomId, new Set())
  }
  rooms.get(normalizedRoomId).add(socket.id)
  socketRooms.set(socket.id, normalizedRoomId)
  
  // Store socket data
  socketData.set(socket.id, { address, gameId: normalizedRoomId.replace('game_', '') })
  addressToSocket.set(address?.toLowerCase(), socket.id)
  
  console.log(`✅ Socket ${socket.id} (${address}) joined room ${normalizedRoomId}`)
  
  // Send confirmation
  socket.send(JSON.stringify({
    type: 'room_joined',
    roomId: normalizedRoomId,
    address,
    message: `Successfully joined room ${normalizedRoomId}`
  }))
  
  // Load and send chat history if database is available
  if (dbService && typeof dbService.getChatHistory === 'function') {
    try {
      const messages = await dbService.getChatHistory(normalizedRoomId, 50)
      socket.send(JSON.stringify({
        type: 'chat_history',
        messages
      }))
    } catch (error) {
      console.error('❌ Error loading chat history:', error)
    }
  }
}

async function handleChatMessage(socket, data, dbService) {
  const roomId = socketRooms.get(socket.id)
  if (!roomId) {
    console.error('❌ Socket not in any room')
    return
  }
  
  const messageData = {
    type: 'chat_message',
    gameId: data.gameId || roomId.replace('game_', ''),
    from: data.from || data.address,
    message: data.message,
    timestamp: new Date().toISOString()
  }
  
  // Save to database if available
  if (dbService && typeof dbService.saveChatMessage === 'function') {
    try {
      await dbService.saveChatMessage(
        roomId,
        messageData.from,
        messageData.message,
        messageData.timestamp
      )
    } catch (error) {
      console.error('❌ Error saving chat message:', error)
    }
  }
  
  // Broadcast to room
  broadcastToRoom(roomId, messageData)
}

async function handleCryptoOffer(socket, data, dbService) {
  const roomId = socketRooms.get(socket.id)
  if (!roomId) return
  
  const offerData = {
    type: 'crypto_offer',
    id: Date.now() + Math.random(),
    gameId: data.gameId || roomId.replace('game_', ''),
    offerer_address: data.from || data.address,
    amount: data.amount || data.cryptoAmount,
    timestamp: new Date().toISOString()
  }
  
  // Save to database
  if (dbService && dbService.db) {
    try {
      const gameId = offerData.gameId
      const listingId = data.listingId || gameId
      
      await new Promise((resolve, reject) => {
        dbService.db.run(`
          INSERT INTO crypto_offers (listing_id, offerer_address, offer_price, status)
          VALUES (?, ?, ?, 'pending')
        `, [listingId, offerData.offerer_address, offerData.amount], (err) => {
          if (err) reject(err)
          else resolve()
        })
      })
      
      console.log('💾 Crypto offer saved to database')
    } catch (error) {
      console.error('❌ Error saving crypto offer:', error)
    }
  }
  
  // Broadcast to room
  broadcastToRoom(roomId, offerData)
}

async function handleAcceptOffer(socket, data, dbService) {
  const roomId = socketRooms.get(socket.id)
  if (!roomId) return
  
  const acceptData = {
    type: 'offer_accepted',
    gameId: data.gameId || roomId.replace('game_', ''),
    offerId: data.offerId,
    challenger: data.joinerAddress || data.offerer_address,
    timestamp: new Date().toISOString()
  }
  
  // Update database
  if (dbService && dbService.db) {
    try {
      // Update offer status
      await new Promise((resolve, reject) => {
        dbService.db.run(`
          UPDATE crypto_offers 
          SET status = 'accepted', accepted_at = ?
          WHERE id = ?
        `, [acceptData.timestamp, data.offerId], (err) => {
          if (err) reject(err)
          else resolve()
        })
      })
      
      // Update game with challenger
      await new Promise((resolve, reject) => {
        dbService.db.run(`
          UPDATE games 
          SET challenger = ?, status = 'awaiting_challenger_deposit'
          WHERE id = ?
        `, [acceptData.challenger, acceptData.gameId], (err) => {
          if (err) reject(err)
          else resolve()
        })
      })
      
      console.log('✅ Offer accepted and game updated')
    } catch (error) {
      console.error('❌ Error accepting offer:', error)
    }
  }
  
  // Broadcast to room
  broadcastToRoom(roomId, acceptData)
  
  // Send direct message to challenger
  sendToUser(acceptData.challenger, {
    type: 'your_offer_accepted',
    gameId: acceptData.gameId,
    message: 'Your offer has been accepted! Please deposit crypto.'
  })
}

async function handleDepositConfirmed(socket, data, dbService) {
  const roomId = socketRooms.get(socket.id)
  if (!roomId) return
  
  const gameId = data.gameId || roomId.replace('game_', '')
  
  // Check if both players deposited BEFORE broadcasting
  let bothDeposited = false
  let gameData = null
  
  if (dbService && dbService.db) {
    try {
      // First update the deposit status
      if (data.player && data.assetType) {
        const isCreator = data.assetType === 'nft'
        const updateField = isCreator ? 'creator_deposited' : 'challenger_deposited'
        
        await new Promise((resolve, reject) => {
          dbService.db.run(
            `UPDATE games SET ${updateField} = 1 WHERE id = ?`,
            [gameId],
            (err) => {
              if (err) reject(err)
              else resolve()
            }
          )
        })
        
        console.log(`✅ Updated ${updateField} for game ${gameId}`)
      }
      
      // Now check if both have deposited
      gameData = await new Promise((resolve, reject) => {
        dbService.db.get(
          'SELECT * FROM games WHERE id = ?',
          [gameId],
          (err, row) => {
            if (err) reject(err)
            else resolve(row)
          }
        )
      })
      
      bothDeposited = !!(gameData?.creator_deposited && gameData?.challenger_deposited)
      console.log(`🎮 Game ${gameId} deposit status - Creator: ${gameData?.creator_deposited}, Challenger: ${gameData?.challenger_deposited}, Both: ${bothDeposited}`)
      
    } catch (error) {
      console.error('❌ Error checking deposit status:', error)
    }
  }
  
  // Broadcast deposit confirmation with bothDeposited flag
  const depositData = {
    type: 'deposit_confirmed',
    gameId: gameId,
    player: data.player,
    assetType: data.assetType,
    transactionHash: data.transactionHash,
    bothDeposited: bothDeposited, // Include this crucial flag
    timestamp: new Date().toISOString()
  }
  
  broadcastToRoom(roomId, depositData)
  
  // If both deposited, also send game_ready event
  if (bothDeposited && gameData) {
    setTimeout(() => {
      broadcastToRoom(roomId, {
        type: 'game_ready',
        gameId: gameId,
        message: 'Both players have deposited! Game starting...',
        creator: gameData.creator,
        challenger: gameData.challenger,
        bothDeposited: true
      })
    }, 500)
  }
}

async function handleGameStatusChange(socket, data, dbService) {
  const roomId = socketRooms.get(socket.id)
  if (!roomId) return
  
  broadcastToRoom(roomId, {
    type: 'game_status_changed',
    gameId: data.gameId,
    newStatus: data.newStatus,
    previousStatus: data.previousStatus,
    timestamp: new Date().toISOString()
  })
}

// ===== BROADCAST FUNCTIONS =====
function broadcastToRoom(roomId, message) {
  const normalizedRoomId = roomId.startsWith('game_') ? roomId : `game_${roomId}`
  const room = rooms.get(normalizedRoomId)
  
  if (!room || room.size === 0) {
    console.log(`⚠️ No clients in room ${normalizedRoomId}`)
    return
  }
  
  const messageStr = JSON.stringify(message)
  let sentCount = 0
  
  room.forEach(socketId => {
    const socket = getSocketById(socketId)
    if (socket && socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(messageStr)
        sentCount++
      } catch (error) {
        console.error(`❌ Failed to send to socket ${socketId}:`, error)
        room.delete(socketId)
      }
    } else {
      room.delete(socketId)
    }
  })
  
  console.log(`📢 Broadcast to ${normalizedRoomId}: ${sentCount}/${room.size} clients`)
}

function sendToUser(address, message) {
  const socketId = addressToSocket.get(address?.toLowerCase())
  if (!socketId) {
    console.log(`⚠️ No socket found for address ${address}`)
    return
  }
  
  const socket = getSocketById(socketId)
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message))
    console.log(`📨 Direct message sent to ${address}`)
  }
}

function getSocketById(socketId) {
  for (const client of wss.clients) {
    if (client.id === socketId) {
      return client
    }
  }
  return null
}

// ===== MAIN CONNECTION HANDLER =====
function handleConnection(ws, dbService) {
  ws.id = require('crypto').randomBytes(16).toString('hex')
  
  console.log(`🔌 New WebSocket connection: ${ws.id}`)
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    socketId: ws.id,
    message: 'Connected to CryptoFlipz WebSocket server'
  }))
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString())
      console.log(`📨 Message from ${ws.id}: ${data.type}`)
      
      switch (data.type) {
        case 'join_room':
          await handleJoinRoom(ws, data, dbService)
          break
          
        case 'chat_message':
          await handleChatMessage(ws, data, dbService)
          break
          
        case 'crypto_offer':
          await handleCryptoOffer(ws, data, dbService)
          break
          
        case 'accept_offer':
        case 'accept_crypto_offer':
          await handleAcceptOffer(ws, data, dbService)
          break
          
        case 'deposit_confirmed':
          await handleDepositConfirmed(ws, data, dbService)
          break
          
        case 'game_status_changed':
          await handleGameStatusChange(ws, data, dbService)
          break
          
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }))
          break
          
        default:
          console.log(`⚠️ Unknown message type: ${data.type}`)
      }
    } catch (error) {
      console.error('❌ Error handling message:', error)
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message',
        error: error.message
      }))
    }
  })
  
  ws.on('close', () => {
    console.log(`🔌 WebSocket disconnected: ${ws.id}`)
    
    // Clean up
    const roomId = socketRooms.get(ws.id)
    if (roomId && rooms.has(roomId)) {
      rooms.get(roomId).delete(ws.id)
      console.log(`📤 Removed ${ws.id} from room ${roomId}`)
    }
    
    const userData = socketData.get(ws.id)
    if (userData?.address) {
      addressToSocket.delete(userData.address.toLowerCase())
    }
    
    socketRooms.delete(ws.id)
    socketData.delete(ws.id)
  })
  
  ws.on('error', (error) => {
    console.error(`❌ WebSocket error for ${ws.id}:`, error)
  })
}

// ===== INITIALIZATION =====
let wss = null
let dbService = null

function initializeWebSocket(server, databaseService) {
  wss = new WebSocket.Server({ 
    server,
    path: '/ws',
    perMessageDeflate: false
  })
  
  dbService = databaseService
  
  console.log('🚀 WebSocket server initialized on /ws')
  console.log('📊 Database service:', !!dbService)
  
  wss.on('connection', (ws) => {
    handleConnection(ws, dbService)
  })
  
  wss.on('error', (error) => {
    console.error('❌ WebSocket server error:', error)
  })
  
  // Heartbeat to keep connections alive
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }))
      }
    })
  }, 30000)
  
  wss.on('close', () => {
    clearInterval(interval)
  })
}

module.exports = {
  initializeWebSocket,
  broadcastToRoom,
  sendToUser,
  rooms,
  socketRooms,
  socketData
}
