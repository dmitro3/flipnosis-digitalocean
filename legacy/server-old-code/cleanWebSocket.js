const WebSocket = require('ws')

// ===== CLEAN WEBSOCKET ARCHITECTURE =====
// ONE connection per game session
// NO API calls for real-time actions  
// CLEAR message flow

// ===== STATE MANAGEMENT =====
const rooms = new Map() // roomId -> Set of socket IDs
const socketRooms = new Map() // socketId -> roomId
const socketData = new Map() // socketId -> { address, gameId }
const addressToSocket = new Map() // address -> socketId

let wss = null
let dbService = null

// ===== CORE MESSAGE HANDLERS =====

async function handleJoinRoom(socket, data) {
  const { roomId, address } = data
  const gameId = roomId.replace('game_', '')
  
  console.log(`🔌 ${address} joining room ${roomId}`)
  
  // Leave previous room
  const previousRoom = socketRooms.get(socket.id)
  if (previousRoom && rooms.has(previousRoom)) {
    rooms.get(previousRoom).delete(socket.id)
  }
  
  // Join new room
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set())
  }
  rooms.get(roomId).add(socket.id)
  socketRooms.set(socket.id, roomId)
  socketData.set(socket.id, { address, gameId })
  addressToSocket.set(address.toLowerCase(), socket.id)
  
  // Confirm join
  socket.send(JSON.stringify({
    type: 'room_joined',
    roomId,
    address,
    members: rooms.get(roomId).size
  }))
  
  console.log(`✅ ${address} joined ${roomId} (${rooms.get(roomId).size} total)`)
}

async function handleChatMessage(socket, data) {
  const roomId = socketRooms.get(socket.id)
  if (!roomId) return
  
  const message = {
    type: 'chat_message',
    from: data.from || data.address,
    message: data.message,
    timestamp: new Date().toISOString()
  }
  
  // Save to database
  if (dbService) {
    try {
      await saveChatToDatabase(roomId, message.from, message.message)
    } catch (error) {
      console.error('❌ Failed to save chat:', error)
    }
  }
  
  // Broadcast to room
  broadcastToRoom(roomId, message)
}

async function handleCryptoOffer(socket, data) {
  const roomId = socketRooms.get(socket.id)
  if (!roomId) return
  
  const offer = {
    type: 'crypto_offer',
    id: `offer_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
    address: data.address,
    cryptoAmount: data.cryptoAmount,
    listingId: data.listingId,
    timestamp: new Date().toISOString()
  }
  
  // Save to database
  if (dbService) {
    try {
      await saveOfferToDatabase(offer)
    } catch (error) {
      console.error('❌ Failed to save offer:', error)
    }
  }
  
  // Broadcast to room
  broadcastToRoom(roomId, offer)
  console.log(`💰 Crypto offer broadcast: ${offer.cryptoAmount} from ${offer.address}`)
}

async function handleAcceptOffer(socket, data) {
  const roomId = socketRooms.get(socket.id)
  if (!roomId) return
  
  const { offerId, accepterAddress, challengerAddress, cryptoAmount } = data
  
  console.log(`🎯 OFFER ACCEPTED: ${accepterAddress} accepted offer from ${challengerAddress}`)
  
  // Update database
  if (dbService) {
    try {
      await updateOfferStatus(offerId, 'accepted')
      await updateGameWithChallenger(roomId.replace('game_', ''), challengerAddress)
    } catch (error) {
      console.error('❌ Failed to update database:', error)
    }
  }
  
  // Send to CREATOR (Player 1) - they wait for challenger deposit
  sendToUser(accepterAddress, {
    type: 'offer_accepted_creator',
    challengerAddress,
    cryptoAmount,
    message: 'Waiting for challenger to deposit...',
    isCreatorWaiting: true,
    timeLimit: 120 // 2 minutes
  })
  
  // Send to CHALLENGER (Player 2) - they need to deposit
  sendToUser(challengerAddress, {
    type: 'offer_accepted_challenger', 
    challengerAddress,
    cryptoAmount,
    message: 'Your offer was accepted! Deposit now.',
    needsDeposit: true,
    timeLimit: 120 // 2 minutes
  })
  
  console.log(`✅ Deposit countdown started for both players`)
}

async function handleDepositConfirmed(socket, data) {
  const roomId = socketRooms.get(socket.id)
  if (!roomId) return
  
  const { player, assetType, transactionHash } = data
  
  // Update database
  if (dbService) {
    try {
      const isCreator = assetType === 'nft'
      const field = isCreator ? 'creator_deposited' : 'challenger_deposited'
      await updateGameDeposit(roomId.replace('game_', ''), field)
    } catch (error) {
      console.error('❌ Failed to update deposit:', error)
    }
  }
  
  // Broadcast deposit confirmation
  broadcastToRoom(roomId, {
    type: 'deposit_confirmed',
    player,
    assetType,
    transactionHash,
    timestamp: new Date().toISOString()
  })
  
  console.log(`✅ Deposit confirmed: ${player} deposited ${assetType}`)
}

// ===== UTILITY FUNCTIONS =====

function broadcastToRoom(roomId, message) {
  const room = rooms.get(roomId)
  if (!room || room.size === 0) {
    console.log(`⚠️ No clients in room ${roomId}`)
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
  
  console.log(`📢 Broadcast to ${roomId}: ${sentCount} clients`)
}

function sendToUser(address, message) {
  const socketId = addressToSocket.get(address.toLowerCase())
  if (!socketId) {
    console.log(`⚠️ No socket found for address ${address}`)
    return
  }
  
  const socket = getSocketById(socketId)
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message))
    console.log(`📨 Direct message sent to ${address}: ${message.type}`)
  }
}

function getSocketById(socketId) {
  if (!wss) return null
  
  for (const client of wss.clients) {
    if (client.id === socketId) {
      return client
    }
  }
  return null
}

// ===== DATABASE HELPERS =====

async function saveChatToDatabase(roomId, sender, message) {
  if (!dbService?.db) return
  
  return new Promise((resolve, reject) => {
    dbService.db.run(
      'INSERT INTO chat_messages (room_id, sender_address, message, timestamp) VALUES (?, ?, ?, ?)',
      [roomId, sender, message, new Date().toISOString()],
      (err) => err ? reject(err) : resolve()
    )
  })
}

async function saveOfferToDatabase(offer) {
  if (!dbService?.db) return
  
  return new Promise((resolve, reject) => {
    dbService.db.run(
      'INSERT INTO offers (id, listing_id, offerer_address, offer_price, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [offer.id, offer.listingId, offer.address, offer.cryptoAmount, 'pending', offer.timestamp],
      (err) => err ? reject(err) : resolve()
    )
  })
}

async function updateOfferStatus(offerId, status) {
  if (!dbService?.db) return
  
  return new Promise((resolve, reject) => {
    dbService.db.run(
      'UPDATE offers SET status = ?, accepted_at = ? WHERE id = ?',
      [status, new Date().toISOString(), offerId],
      (err) => err ? reject(err) : resolve()
    )
  })
}

async function updateGameWithChallenger(gameId, challenger) {
  if (!dbService?.db) return
  
  return new Promise((resolve, reject) => {
    dbService.db.run(
      'UPDATE games SET challenger = ?, status = ? WHERE id = ?',
      [challenger, 'awaiting_deposits', gameId],
      (err) => err ? reject(err) : resolve()
    )
  })
}

async function updateGameDeposit(gameId, field) {
  if (!dbService?.db) return
  
  return new Promise((resolve, reject) => {
    dbService.db.run(
      `UPDATE games SET ${field} = 1 WHERE id = ?`,
      [gameId],
      (err) => err ? reject(err) : resolve()
    )
  })
}

// ===== CONNECTION HANDLER =====

function handleConnection(ws, database) {
  ws.id = require('crypto').randomBytes(16).toString('hex')
  console.log(`🔌 New connection: ${ws.id}`)
  
  ws.send(JSON.stringify({
    type: 'connected',
    socketId: ws.id
  }))
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString())
      console.log(`📨 ${ws.id}: ${data.type}`)
      
      switch (data.type) {
        case 'join_room':
          await handleJoinRoom(ws, data)
          break
        case 'chat_message':
          await handleChatMessage(ws, data)
          break
        case 'crypto_offer':
          await handleCryptoOffer(ws, data)
          break
        case 'accept_offer':
          await handleAcceptOffer(ws, data)
          break
        case 'deposit_confirmed':
          await handleDepositConfirmed(ws, data)
          break
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }))
          break
        default:
          console.log(`⚠️ Unknown message: ${data.type}`)
      }
    } catch (error) {
      console.error('❌ Message error:', error)
    }
  })
  
  ws.on('close', () => {
    console.log(`🔌 Disconnected: ${ws.id}`)
    
    // Cleanup
    const roomId = socketRooms.get(ws.id)
    if (roomId && rooms.has(roomId)) {
      rooms.get(roomId).delete(ws.id)
    }
    
    const userData = socketData.get(ws.id)
    if (userData?.address) {
      addressToSocket.delete(userData.address.toLowerCase())
    }
    
    socketRooms.delete(ws.id)
    socketData.delete(ws.id)
  })
}

// ===== INITIALIZATION =====

function initializeWebSocket(server, database) {
  wss = new WebSocket.Server({ server })
  dbService = database
  
  console.log('🚀 CLEAN WebSocket server initialized')
  
  wss.on('connection', (ws) => {
    handleConnection(ws, database)
  })
}

module.exports = {
  initializeWebSocket,
  broadcastToRoom,
  sendToUser
}
