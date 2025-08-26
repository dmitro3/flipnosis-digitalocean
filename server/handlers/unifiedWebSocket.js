const crypto = require('crypto')
const CoinStreamService = require('../services/coinStream')

// Room management (same as old system)
const rooms = new Map() // General lobby rooms: game_${gameId} -> Set<socketId>
const gameRooms = new Map() // Private game rooms: game_room_${gameId} -> GameRoom instance
const socketRooms = new Map() // socketId -> roomId
const userSockets = new Map() // address -> socket

class GameRoom {
  constructor(gameId, creator) {
    this.gameId = gameId
    this.creator = creator
    this.joiner = null
    this.spectators = new Set()
    this.phase = 'waiting' // waiting | locked | deposit | countdown | choosing | flipping | result | completed
    this.offers = []
    this.messages = []
    this.currentRound = 1
    this.maxRounds = 5
    this.scores = { creator: 0, joiner: 0 }
    this.choices = { creator: null, joiner: null }
    this.powers = { creator: 0, joiner: 0 }
    this.currentTurn = 'creator' // creator always goes first
    this.depositTimer = null
    this.roundTimer = null
    this.choiceTimer = null
    this.coinStream = new CoinStreamService()
    this.serverCoinState = {
      rotation: 0,
      result: null,
      flipping: false
    }
    this.depositsConfirmed = { creator: false, joiner: false }
  }

  addPlayer(address, socket, role) {
    if (role === 'joiner' && !this.joiner) {
      this.joiner = address
      this.phase = 'locked'
      this.startDepositTimer()
      return true
    } else if (role === 'spectator') {
      this.spectators.add(address)
      return true
    }
    return false
  }

  removePlayer(address) {
    this.spectators.delete(address)
    if (address === this.joiner && this.phase === 'waiting') {
      this.joiner = null
    }
  }

  startDepositTimer() {
    this.depositTimer = setTimeout(() => {
      if (this.phase === 'locked' || this.phase === 'deposit') {
        this.phase = 'waiting'
        this.joiner = null
        this.depositsConfirmed = { creator: false, joiner: false }
        this.broadcast({
          type: 'deposit_timeout',
          message: 'Player 2 failed to deposit in time'
        })
      }
    }, 120000) // 2 minutes
  }

  clearDepositTimer() {
    if (this.depositTimer) {
      clearTimeout(this.depositTimer)
      this.depositTimer = null
    }
  }

  confirmDeposit(playerAddress, assetType) {
    // Determine if it's creator or joiner
    const isCreator = playerAddress === this.creator
    const isJoiner = playerAddress === this.joiner
    
    if (!isCreator && !isJoiner) {
      return false
    }
    
    // Update deposit status
    if (isCreator && assetType === 'nft') {
      this.depositsConfirmed.creator = true
    } else if (isJoiner && assetType === 'eth') {
      this.depositsConfirmed.joiner = true
    }
    
    // Check if both deposits are confirmed
    if (this.depositsConfirmed.creator && this.depositsConfirmed.joiner) {
      this.clearDepositTimer()
      this.startGameTransition()
      return true
    }
    
    // Update phase to deposit if one player has deposited
    if (this.phase === 'locked') {
      this.phase = 'deposit'
    }
    
    // Broadcast deposit confirmation
    this.broadcast({
      type: 'deposit_received',
      player: playerAddress,
      assetType: assetType,
      depositsConfirmed: this.depositsConfirmed
    })
    
    return false
  }

  startGameTransition() {
    this.phase = 'countdown'
    this.broadcast({
      type: 'game_transition_started',
      phase: 'countdown'
    })
    
    // Start countdown
    let countdown = 3
    const countdownInterval = setInterval(() => {
      this.broadcast({
        type: 'countdown_update',
        countdown: countdown
      })
      
      countdown--
      
      if (countdown < 0) {
        clearInterval(countdownInterval)
        this.startGame()
      }
    }, 1000)
  }

  startGame() {
    this.phase = 'choosing'
    this.currentRound = 1
    this.scores = { creator: 0, joiner: 0 }
    this.currentTurn = 'creator'
    
    this.broadcast({
      type: 'game_started',
      phase: 'choosing',
      currentRound: this.currentRound,
      currentTurn: this.currentTurn,
      scores: this.scores
    })
    
    this.startChoiceTimer()
  }

  startChoiceTimer() {
    this.choiceTimer = setTimeout(() => {
      this.autoCompleteChoices()
    }, 30000) // 30 seconds
  }

  clearChoiceTimer() {
    if (this.choiceTimer) {
      clearTimeout(this.choiceTimer)
      this.choiceTimer = null
    }
  }

  handleChoice(playerAddress, choice) {
    const isCreator = playerAddress === this.creator
    const isJoiner = playerAddress === this.joiner
    
    if (!isCreator && !isJoiner) return
    
    const role = isCreator ? 'creator' : 'joiner'
    
    if (this.choices[role] !== null) {
      return // Already made choice
    }
    
    this.choices[role] = choice
    
    this.broadcast({
      type: 'choice_made',
      player: playerAddress,
      choice: choice,
      role: role
    })
    
    // Check if both players have made choices
    if (this.choices.creator !== null && this.choices.joiner !== null) {
      this.clearChoiceTimer()
      this.startPowerPhase()
    }
  }

  startPowerPhase() {
    this.phase = 'power'
    this.powers = { creator: 0, joiner: 0 }
    
    this.broadcast({
      type: 'power_phase_started',
      phase: 'power'
    })
  }

  handlePowerCharge(playerAddress, powerLevel) {
    const isCreator = playerAddress === this.creator
    const isJoiner = playerAddress === this.joiner
    
    if (!isCreator && !isJoiner) return
    
    const role = isCreator ? 'creator' : 'joiner'
    this.powers[role] = powerLevel
    
    this.broadcast({
      type: 'power_charged',
      player: playerAddress,
      powerLevel: powerLevel,
      role: role
    })
    
    // Check if both players have charged power
    if (this.powers.creator > 0 && this.powers.joiner > 0) {
      this.executeFlip()
    }
  }

  autoCompleteChoices() {
    // Auto-complete any missing choices
    if (this.choices.creator === null) {
      this.choices.creator = Math.random() > 0.5 ? 'heads' : 'tails'
    }
    if (this.choices.joiner === null) {
      this.choices.joiner = Math.random() > 0.5 ? 'heads' : 'tails'
    }
    
    this.broadcast({
      type: 'choices_auto_completed',
      choices: this.choices
    })
    
    this.startPowerPhase()
  }

  executeFlip() {
    this.phase = 'flipping'
    this.serverCoinState.flipping = true
    
    this.broadcast({
      type: 'flip_started',
      phase: 'flipping'
    })
    
    // Simulate coin flip with server control
    const totalPower = this.powers.creator + this.powers.joiner
    const creatorInfluence = this.powers.creator / totalPower
    const joinerInfluence = this.powers.joiner / totalPower
    
    // Server determines result based on power levels and some randomness
    const randomFactor = Math.random()
    let result
    
    if (this.choices.creator === this.choices.joiner) {
      // Same choice - random result
      result = Math.random() > 0.5 ? 'heads' : 'tails'
    } else {
      // Different choices - power influences result
      if (randomFactor < creatorInfluence) {
        result = this.choices.creator
      } else {
        result = this.choices.joiner
      }
    }
    
    // Stream coin animation frames
    let rotation = 0
    const frames = 20
    const rotationStep = (Math.PI * 8) / frames // 4 full rotations
    
    const frameInterval = setInterval(() => {
      rotation += rotationStep
      this.serverCoinState.rotation = rotation
      
      const frameData = this.coinStream.renderFrame(this.gameId, rotation)
      
      this.broadcast({
        type: 'coin_frame',
        frame: frameData,
        rotation: rotation
      })
      
      if (rotation >= Math.PI * 8) {
        clearInterval(frameInterval)
        this.serverCoinState.flipping = false
        this.serverCoinState.result = result
        
        this.broadcast({
          type: 'flip_result',
          result: result,
          choices: this.choices,
          powers: this.powers
        })
        
        this.determineWinner(result)
      }
    }, 100) // 10 FPS for 2 seconds
  }

  determineWinner(result) {
    this.phase = 'result'
    
    let winner = null
    if (this.choices.creator === result) {
      winner = 'creator'
      this.scores.creator++
    } else {
      winner = 'joiner'
      this.scores.joiner++
    }
    
    this.broadcast({
      type: 'round_result',
      winner: winner,
      result: result,
      scores: this.scores
    })
    
    // Check if game is over
    if (this.scores.creator >= 3 || this.scores.joiner >= 3) {
      this.endGame()
    } else {
      // Start next round after 3 seconds
      setTimeout(() => {
        this.startNextRound()
      }, 3000)
    }
  }

  startNextRound() {
    this.currentRound++
    this.choices = { creator: null, joiner: null }
    this.powers = { creator: 0, joiner: 0 }
    this.currentTurn = 'creator'
    this.phase = 'choosing'
    
    this.broadcast({
      type: 'next_round',
      currentRound: this.currentRound,
      currentTurn: this.currentTurn,
      scores: this.scores
    })
    
    this.startChoiceTimer()
  }

  endGame() {
    this.phase = 'completed'
    
    const winner = this.scores.creator >= 3 ? 'creator' : 'joiner'
    const winnerAddress = winner === 'creator' ? this.creator : this.joiner
    
    this.broadcast({
      type: 'game_completed',
      winner: winner,
      winnerAddress: winnerAddress,
      finalScores: this.scores
    })
    
    // Cleanup
    if (this.roundTimer) {
      clearTimeout(this.roundTimer)
    }
    if (this.choiceTimer) {
      clearTimeout(this.choiceTimer)
    }
    if (this.depositTimer) {
      clearTimeout(this.depositTimer)
    }
    
    this.coinStream.cleanupScene(this.gameId)
  }

  broadcast(message) {
    const fullMessage = {
      ...message,
      gameId: this.gameId,
      timestamp: Date.now()
    }
    
    // Use the room-based broadcasting system
    const roomId = `game_${this.gameId}`
    broadcastToRoom(roomId, fullMessage)
  }
}

// Export the handlers
module.exports = {
  gameRooms,
  userSockets,
  GameRoom,
  
  handleConnection(ws, dbService) {
    ws.id = crypto.randomBytes(16).toString('hex')
    console.log(`🔌 New WebSocket connection: ${ws.id}`)
    
    ws.on('message', async (message) => {
      try {
        console.log(`📨 Raw message from ${ws.id}:`, message.toString())
        const data = JSON.parse(message)
        
        console.log('📡 Received WebSocket message:', data)
        console.log('🔍 Message type:', data.type)
        
        console.log('🔍 Processing message type:', data.type)
        switch (data.type) {
          case 'join_game':
            await handleJoinGame(ws, data, dbService)
            break
            
          case 'join_room':
            await handleJoinRoom(ws, data, dbService)
            break
            
          case 'join_game_room':
            await handleJoinGameRoom(ws, data, dbService)
            break
            
          case 'register_user':
            handleRegisterUser(ws, data)
            break
            
          case 'make_offer':
          case 'nft_offer':
          case 'crypto_offer':
            handleMakeOffer(ws, data)
            break
            
          case 'accept_offer':
          case 'accept_nft_offer':
          case 'accept_crypto_offer':
            handleAcceptOffer(ws, data)
            break
            
          case 'deposit_confirmed':
            handleDepositConfirmed(ws, data)
            break
            
          case 'choice_made':
            handleChoiceMade(ws, data)
            break
            
          case 'power_charged':
            handlePowerCharged(ws, data)
            break
            
          case 'chat_message':
            handleChatMessage(ws, data)
            break
            
          case 'GAME_ACTION':
            handleGameAction(ws, data, dbService)
            break
            
          case 'ping':
            // Handle heartbeat ping
            try {
              ws.send(JSON.stringify({ 
                type: 'pong', 
                timestamp: data.timestamp 
              }))
            } catch (error) {
              console.error('❌ Error sending pong:', error)
            }
            break
            
          default:
            console.log('Unknown message type:', data.type)
        }
      } catch (error) {
        console.error('Message handling error:', error)
      }
    })
    
    ws.on('close', () => {
      handleDisconnect(ws)
    })
  },
  
  // Broadcast to specific room (same as old system)
  broadcastToRoom(roomId, message) {
    if (!rooms.has(roomId)) {
      console.log(`⚠️ Room ${roomId} not found, creating it`)
      rooms.set(roomId, new Set())
    }
    
    const room = rooms.get(roomId)
    const messageStr = JSON.stringify(message)
    
    console.log(`📢 Broadcasting to room ${roomId}:`, {
      messageType: message.type,
      roomSize: room.size,
      message: message
    })
    
    let successfulBroadcasts = 0
    let failedBroadcasts = 0
    
    // Get all active WebSocket clients from the global wss
    const activeClients = Array.from(global.wss.clients).filter(client => 
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
}

// Message handlers
async function handleJoinGame(ws, data, dbService) {
  const { gameId, address } = data
  
  // Store user socket
  userSockets.set(address, ws)
  ws.address = address
  
  // Ensure room exists
  const roomId = `game_${gameId}`
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set())
  }
  
  const room = rooms.get(roomId)
  room.add(ws.id)
  socketRooms.set(ws.id, roomId)
  
  console.log(`✅ ${address} joined game ${gameId}`)
  
  // Get or create game room
  let gameRoom = gameRooms.get(gameId)
  if (!gameRoom) {
    gameRoom = new GameRoom(gameId, address)
    gameRooms.set(gameId, gameRoom)
  } else {
    // Add as joiner or spectator
    if (address !== gameRoom.creator) {
      if (!gameRoom.joiner) {
        gameRoom.addPlayer(address, ws, 'joiner')
      } else {
        gameRoom.addPlayer(address, ws, 'spectator')
      }
    }
  }
  
  // Send game joined confirmation
  ws.send(JSON.stringify({
    type: 'game_joined',
    gameId: gameId,
    gameData: {
      creator: gameRoom.creator,
      joiner: gameRoom.joiner,
      phase: gameRoom.phase,
      currentRound: gameRoom.currentRound,
      scores: gameRoom.scores,
      currentTurn: gameRoom.currentTurn,
      offers: gameRoom.offers,
      messages: gameRoom.messages
    }
  }))
}

function handleMakeOffer(ws, data) {
  const { gameId, offer } = data
  const room = gameRooms.get(gameId)
  
  if (!room) return
  
  room.offers.push({
    ...offer,
    id: crypto.randomBytes(8).toString('hex'),
    timestamp: Date.now()
  })
  
  room.broadcast({
    type: 'offer_made',
    offer: offer
  })
}

function handleAcceptOffer(ws, data) {
  const { gameId, offerId } = data
  const room = gameRooms.get(gameId)
  
  if (!room) return
  
  room.broadcast({
    type: 'offer_accepted',
    offerId: offerId
  })
}

function handleDepositConfirmed(ws, data) {
  const { gameId, assetType } = data
  const room = gameRooms.get(gameId)
  
  if (!room) return
  
  room.confirmDeposit(ws.address, assetType)
}

function handleChoiceMade(ws, data) {
  const { gameId, choice } = data
  const room = gameRooms.get(gameId)
  
  if (!room) return
  
  room.handleChoice(ws.address, choice)
}

function handlePowerCharged(ws, data) {
  const { gameId, powerLevel } = data
  const room = gameRooms.get(gameId)
  
  if (!room) return
  
  room.handlePowerCharge(ws.address, powerLevel)
}

function handleChatMessage(ws, data) {
  console.log('💬 Handling chat message:', data)
  const { gameId, message } = data
  console.log('💬 Extracted gameId:', gameId, 'message:', message)
  
  // Try different gameId formats
  let room = gameRooms.get(gameId)
  if (!room) {
    // Try without game_ prefix
    const gameIdWithoutPrefix = gameId.replace('game_', '')
    room = gameRooms.get(gameIdWithoutPrefix)
    console.log('💬 Trying without prefix:', gameIdWithoutPrefix, 'Found:', room ? 'yes' : 'no')
  }
  if (!room) {
    // Try with just the numeric part
    const numericGameId = gameId.replace(/^game_/, '').split('_')[0]
    room = gameRooms.get(numericGameId)
    console.log('💬 Trying numeric part:', numericGameId, 'Found:', room ? 'yes' : 'no')
  }
  
  console.log('💬 Final room found:', room ? 'yes' : 'no')
  
  if (!room) {
    console.log('💬 No room found for gameId:', gameId)
    console.log('💬 Available gameRooms:', Array.from(gameRooms.keys()))
    return
  }
  
  const chatMessage = {
    from: ws.address,
    message,
    timestamp: Date.now()
  }
  
  console.log('💬 Created chat message:', chatMessage)
  
  room.messages.push(chatMessage)
  room.broadcast({
    type: 'chat_message',
    ...chatMessage
  })
  
  console.log('💬 Chat message broadcasted')
}

function handleDisconnect(ws) {
  if (ws.address) {
    userSockets.delete(ws.address)
  }
  
  // Cleanup lobby rooms
  const room = socketRooms.get(ws.id)
  if (room && rooms.has(room)) {
    rooms.get(room).delete(ws.id)
  }
  
  // Cleanup game rooms
  if (ws.address) {
    gameRooms.forEach((gameRoom, roomId) => {
      gameRoom.removePlayer(ws.address)
    })
  }
  
  socketRooms.delete(ws.id)
  console.log(`🔌 WebSocket disconnected: ${ws.id}`)
}

// Additional handlers for old message types
async function handleJoinRoom(ws, data, dbService) {
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
  
  console.log(`👥 Socket ${ws.id} requesting to join room ${targetRoomId} (original: ${roomId})`)
  
  // Leave previous room if any
  const oldRoom = socketRooms.get(ws.id)
  if (oldRoom && rooms.has(oldRoom)) {
    rooms.get(oldRoom).delete(ws.id)
    console.log(`👋 Socket ${ws.id} left old room ${oldRoom}`)
  }
  
  // Join new room
  if (!rooms.has(targetRoomId)) {
    rooms.set(targetRoomId, new Set())
    console.log(`🏠 Created new room: ${targetRoomId}`)
  }
  
  const room = rooms.get(targetRoomId)
  room.add(ws.id)
  socketRooms.set(ws.id, targetRoomId)
  
  console.log(`✅ Socket ${ws.id} joined room ${targetRoomId}`)
  
  // Send confirmation
  ws.send(JSON.stringify({
    type: 'room_joined',
    roomId: targetRoomId
  }))
}

async function handleJoinGameRoom(ws, data, dbService) {
  const { gameId, address } = data
  
  // Store user socket
  userSockets.set(address, ws)
  ws.address = address
  
  const roomId = `game_room_${gameId}`
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set())
  }
  
  const room = rooms.get(roomId)
  room.add(ws.id)
  socketRooms.set(ws.id, roomId)
  
  console.log(`✅ ${address} joined game room ${roomId}`)
  
  // Get or create game room
  let gameRoom = gameRooms.get(gameId)
  if (!gameRoom) {
    gameRoom = new GameRoom(gameId, address)
    gameRooms.set(gameId, gameRoom)
  } else {
    // Add as joiner or spectator
    if (address !== gameRoom.creator) {
      if (!gameRoom.joiner) {
        gameRoom.addPlayer(address, ws, 'joiner')
      } else {
        gameRoom.addPlayer(address, ws, 'spectator')
      }
    }
  }
  
  // Send game room joined confirmation
  ws.send(JSON.stringify({
    type: 'game_room_joined',
    roomId,
    gameId,
    players: {
      creator: gameRoom.creator,
      joiner: gameRoom.joiner
    },
    status: {
      phase: gameRoom.phase,
      currentRound: gameRoom.currentRound,
      scores: gameRoom.scores,
      currentTurn: gameRoom.currentTurn
    }
  }))
}

function handleRegisterUser(ws, data) {
  const { address } = data
  
  // Store user socket
  userSockets.set(address, ws)
  ws.address = address
  
  console.log(`✅ User registered: ${address}`)
  
  // Send confirmation
  ws.send(JSON.stringify({
    type: 'user_registered',
    address: address
  }))
}

function handleGameAction(ws, data, dbService) {
  const { gameId, action, player, choice, powerLevel } = data
  
  console.log(`🎮 Game action: ${action} for game ${gameId} by ${player}`)
  
  const room = gameRooms.get(gameId)
  if (!room) {
    console.log(`⚠️ Game room not found for game ${gameId}`)
    return
  }
  
  switch (action) {
    case 'MAKE_CHOICE':
      room.handleChoice(player, choice)
      break
      
    case 'POWER_CHARGE_START':
      // Handle power charge start
      break
      
    case 'POWER_CHARGE_STOP':
      room.handlePowerCharge(player, powerLevel || 50)
      break
      
    default:
      console.log(`⚠️ Unknown game action: ${action}`)
  }
}
