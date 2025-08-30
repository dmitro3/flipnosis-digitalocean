const WebSocket = require('ws')

// ===== SIMPLE ROOM MANAGEMENT =====
const rooms = new Map() // roomId -> Set of socket IDs
const socketRooms = new Map() // socketId -> roomId
const socketData = new Map() // socketId -> { address, gameId, etc }

// ===== GAME ROOMS =====
const gameRooms = new Map()

class GameRoom {
  constructor(gameId, creator) {
    this.gameId = gameId
    this.creator = creator
    this.joiner = null
    this.phase = 'waiting'
    this.currentRound = 0
    this.scores = { creator: 0, joiner: 0 }
    this.choices = { creator: null, joiner: null }
    this.powers = { creator: 0, joiner: 0 }
  }
  
  addJoiner(joinerAddress) {
    this.joiner = joinerAddress
    this.phase = 'locked'
    return true
  }
  
  handleChoice(player, choice) {
    const role = player === this.creator ? 'creator' : 'joiner'
    this.choices[role] = choice
    
    console.log(`👤 ${role} chose ${choice}`)
    
    // Check if both players have chosen
    if (this.choices.creator && this.choices.joiner) {
      this.executeCoinFlip()
    }
  }
  
  handlePowerRelease(player, power) {
    const role = player === this.creator ? 'creator' : 'joiner'
    this.powers[role] = power
    console.log(`⚡ ${role} released power at ${power}%`)
  }
  
  executeCoinFlip() {
    console.log(`🪙 Executing coin flip for game ${this.gameId}`)
    
    // Simple flip result
    const flipResult = Math.random() < 0.5 ? 'heads' : 'tails'
    let winner = null
    
    if (this.choices.creator === flipResult) {
      winner = 'creator'
      this.scores.creator++
    } else if (this.choices.joiner === flipResult) {
      winner = 'joiner'
      this.scores.joiner++
    }
    
    // Broadcast result
    broadcastToRoom(`game_${this.gameId}`, {
      type: 'round_result',
      winner,
      result: flipResult,
      scores: this.scores,
      choices: this.choices
    })
    
    // Reset for next round
    this.choices = { creator: null, joiner: null }
    this.powers = { creator: 0, joiner: 0 }
    this.currentRound++
  }
}

// ===== SIMPLE BROADCASTING =====
function broadcastToRoom(roomId, message) {
  const messageStr = JSON.stringify(message)
  const room = rooms.get(roomId)
  
  if (!room) {
    console.log(`⚠️ Room ${roomId} not found for broadcast`)
    return
  }
  
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
  
  console.log(`📢 Broadcast to room ${roomId}: ${sentCount} clients`)
}

function getSocketById(socketId) {
  // Find socket in global wss.clients
  for (const client of wss.clients) {
    if (client.id === socketId) {
      return client
    }
  }
  return null
}

// ===== MESSAGE HANDLERS =====
async function handleJoinRoom(socket, data, dbService) {
  const { roomId } = data
  
  // Normalize room ID
  const targetRoomId = roomId.startsWith('game_') ? roomId : `game_${roomId}`
  
  console.log(`👥 Socket ${socket.id} joining room ${targetRoomId}`)
  
  // Leave previous room
  const oldRoom = socketRooms.get(socket.id)
  if (oldRoom && rooms.has(oldRoom)) {
    rooms.get(oldRoom).delete(socket.id)
  }
  
  // Join new room
  if (!rooms.has(targetRoomId)) {
    rooms.set(targetRoomId, new Set())
  }
  
  const room = rooms.get(targetRoomId)
  room.add(socket.id)
  socketRooms.set(socket.id, targetRoomId)
  
  // Send confirmation
  socket.send(JSON.stringify({
    type: 'room_joined',
    roomId: targetRoomId,
    members: room.size
  }))
  
  // Load chat history
  try {
    const chatHistory = await dbService.getChatHistory(targetRoomId, 50)
    if (chatHistory.length > 0) {
      socket.send(JSON.stringify({
        type: 'chat_history',
        roomId: targetRoomId,
        messages: chatHistory
      }))
    }
  } catch (error) {
    console.error('❌ Error loading chat history:', error)
  }
}

async function handleChatMessage(socket, data, dbService) {
  const { roomId, gameId, message, from } = data
  
  // Normalize room ID
  const targetRoomId = roomId || `game_${gameId}`
  const senderAddress = socket.address || from || 'anonymous'
  
  console.log(`💬 Chat message in ${targetRoomId} from ${senderAddress}`)
  
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

function handleJoinGame(socket, data) {
  const { gameId, address } = data
  
  // Store socket data
  socketData.set(socket.id, { address, gameId })
  
  console.log(`✅ ${address} joined game ${gameId}`)
  
  // Get or create game room
  let gameRoom = gameRooms.get(gameId)
  if (!gameRoom) {
    gameRoom = new GameRoom(gameId, address)
    gameRooms.set(gameId, gameRoom)
  } else if (address !== gameRoom.creator && !gameRoom.joiner) {
    gameRoom.addJoiner(address)
  }
  
  // Send game state
  socket.send(JSON.stringify({
    type: 'game_joined',
    gameId,
    phase: gameRoom.phase,
    round: gameRoom.currentRound,
    scores: gameRoom.scores,
    creator: gameRoom.creator,
    joiner: gameRoom.joiner
  }))
}

function handlePlayerChoice(socket, data) {
  const { gameId, choice, player } = data
  const gameRoom = gameRooms.get(gameId)
  
  if (!gameRoom) {
    console.error(`❌ Game room not found: ${gameId}`)
    return
  }
  
  gameRoom.handleChoice(player, choice)
}

function handlePowerRelease(socket, data) {
  const { gameId, power, player } = data
  const gameRoom = gameRooms.get(gameId)
  
  if (!gameRoom) {
    console.error(`❌ Game room not found: ${gameId}`)
    return
  }
  
  gameRoom.handlePowerRelease(player, power)
}

// ===== MAIN CONNECTION HANDLER =====
function handleConnection(ws, dbService) {
  ws.id = require('crypto').randomBytes(16).toString('hex')
  
  console.log(`🔌 New WebSocket connection: ${ws.id}`)
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString())
      console.log(`📨 Message from ${ws.id}: ${data.type}`)
      
      switch (data.type) {
        case 'join_room':
          handleJoinRoom(ws, data, dbService)
          break
          
        case 'chat_message':
          handleChatMessage(ws, data, dbService)
          break
          
        case 'join_game':
          handleJoinGame(ws, data)
          break
          
        case 'player_choice':
          handlePlayerChoice(ws, data)
          break
          
        case 'power_release':
          handlePowerRelease(ws, data)
          break
          
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }))
          break
          
        default:
          console.log(`⚠️ Unknown message type: ${data.type}`)
      }
    } catch (error) {
      console.error('❌ Error handling message:', error)
    }
  })
  
  ws.on('close', () => {
    console.log(`🔌 WebSocket disconnected: ${ws.id}`)
    
    // Clean up
    const roomId = socketRooms.get(ws.id)
    if (roomId && rooms.has(roomId)) {
      rooms.get(roomId).delete(ws.id)
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
  wss = new WebSocket.Server({ server })
  dbService = databaseService
  
  wss.on('connection', (ws) => {
    handleConnection(ws, dbService)
  })
  
  console.log('🚀 WebSocket server initialized')
}

module.exports = {
  initializeWebSocket,
  gameRooms,
  broadcastToRoom
}
