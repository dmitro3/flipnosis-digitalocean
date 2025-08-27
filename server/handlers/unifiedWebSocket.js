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

// Broadcast to room (same as old system)
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
  
  console.log(`✅ Broadcast complete: ${successfulBroadcasts} successful, ${failedBroadcasts} failed`)
  
  // Clean up empty rooms
  if (room.size === 0) {
    rooms.delete(roomId)
    console.log(`🧹 Cleaned up empty room: ${roomId}`)
  }
}

// Export the handlers
module.exports = {
  gameRooms,
  userSockets,
  GameRoom,
  broadcastToRoom,
  
  handleConnection(ws, dbService) {
    ws.id = crypto.randomBytes(16).toString('hex')
    console.log(`🔌 New WebSocket connection: ${ws.id}`)
    
    ws.on('message', async (message) => {
      try {
        console.log(`📨 Raw message from ${ws.id}:`, message.toString())
        const data = JSON.parse(message)
        
        console.log('📡 Received WebSocket message:', data)
        console.log('🔍 Message type:', data.type)
        console.log('🔍 Socket ID:', ws.id)
        console.log('🔍 Client address:', data.address)
        
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
            handleMakeOffer(ws, data)
            break
          case 'crypto_offer':
            handleCryptoOffer(ws, data, dbService)
            break
            
          case 'accept_offer':
          case 'accept_nft_offer':
          case 'accept_crypto_offer':
            handleAcceptOffer(ws, data, dbService)
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
            handleChatMessage(ws, data, dbService)
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

// Handle crypto offer (for NFT-vs-crypto games)
async function handleCryptoOffer(ws, data, dbService) {
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

async function handleAcceptOffer(ws, data, dbService) {
  const { gameId, offerId, acceptedOffer } = data
  console.log('🎯 Handling offer acceptance:', { gameId, offerId, acceptedOffer })
  
  // Extract offerId from acceptedOffer if not provided directly
  const actualOfferId = offerId || (acceptedOffer && acceptedOffer.id)
  console.log('🎯 Using offerId:', actualOfferId)
  
  if (!actualOfferId) {
    console.error('❌ No offerId found in acceptance data')
    return
  }
  
  // Get the offer details from the database
  try {
    const db = dbService.getDatabase()
    const offer = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM offers WHERE id = ?', [actualOfferId], (err, result) => {
        if (err) reject(err)
        else resolve(result)
      })
    })
    
    if (!offer) {
      console.error('❌ Offer not found:', actualOfferId)
      return
    }
    
    console.log('📋 Found offer:', offer)
    
    // Create the acceptance message for Player 2 (the offerer)
    const acceptanceMessage = {
      type: 'accept_crypto_offer',
      gameId: gameId,
      offerId: actualOfferId,
      creatorAddress: ws.address, // Player 1 (creator)
      acceptedOffer: {
        offerer_address: offer.offerer_address,
        cryptoAmount: offer.offer_price,
        offerId: actualOfferId,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    }
    
    console.log('📢 Broadcasting offer acceptance to Player 2:', acceptanceMessage)
    
    // Broadcast to the room so Player 2 receives it
    const roomId = `game_${gameId}`
    broadcastToRoom(roomId, acceptanceMessage)
    
    // Also save as a chat message for persistence
    await dbService.saveChatMessage(
      roomId,
      ws.address,
      `Offer accepted! Game starting...`,
      'offer_accepted',
      { acceptedOffer: acceptanceMessage.acceptedOffer }
    )
    
    // If this is a crypto offer acceptance, trigger the game start process
    if (offer.offer_price) {
      console.log('🎮 Crypto offer accepted, triggering game start process for game:', gameId)
      
      // Update game status to waiting for challenger deposit
      const depositDeadline = new Date(Date.now() + 2 * 60 * 1000) // 2 minutes from now
      
      console.log('🔧 Updating game status with data:', {
        gameId,
        status: 'waiting_challenger_deposit',
        depositDeadline: depositDeadline.toISOString(),
        challenger: offer.offerer_address,
        paymentAmount: offer.offer_price
      })
      
      // First, let's check if the game exists and get its current status
      const game = await new Promise((resolve, reject) => {
        db.get('SELECT status, challenger FROM games WHERE id = ?', [gameId], (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      })
      
      if (!game) {
        console.error('❌ Game not found:', gameId)
        return
      }
      
      console.log('📊 Current game status:', game)
      
      // Now update the game status
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE games SET status = ?, deposit_deadline = ?, challenger = ?, payment_amount = ? WHERE id = ?',
          ['waiting_challenger_deposit', depositDeadline.toISOString(), offer.offerer_address, offer.offer_price, gameId],
          function(err) {
            if (err) {
              console.error('❌ Error updating game status:', err)
              reject(err)
            } else {
              console.log('✅ Game status updated successfully:', {
                gameId,
                rowsAffected: this.changes,
                newStatus: 'waiting_challenger_deposit',
                challenger: offer.offerer_address,
                paymentAmount: offer.offer_price
              })
              resolve()
            }
          }
        )
      })
      
      // Save system message to database
      await dbService.saveChatMessage(
        roomId, 
        'system', 
        `🎮 Game accepted! Player 2, please load your ${offer.offer_price} USD worth of ETH to start the game!`, 
        'system'
      )
      
      // Broadcast game status update to trigger countdown
      broadcastToRoom(roomId, {
        type: 'game_awaiting_challenger_deposit',
        gameId,
        status: 'waiting_challenger_deposit',
        deposit_deadline: depositDeadline.toISOString(),
        challenger: offer.offerer_address,
        cryptoAmount: offer.offer_price,
        payment_amount: offer.offer_price
      })
      
      // Broadcast a system message to prompt the joiner to load their crypto
      broadcastToRoom(roomId, {
        type: 'chat_message',
        message: `🎮 Game accepted! Player 2, please load your ${offer.offer_price} USD worth of ETH to start the game!`,
        from: 'system',
        timestamp: new Date().toISOString()
      })
    }
    
    console.log('✅ Offer acceptance broadcasted successfully')
  } catch (error) {
    console.error('❌ Error handling offer acceptance:', error)
  }
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

async function handleChatMessage(ws, data, dbService) {
  console.log('💬 Handling chat message:', data)
  const { gameId, message, sender } = data
  console.log('💬 Extracted gameId:', gameId, 'message:', message, 'sender:', sender)
  
  // Use the sender from the message or fall back to ws.address
  const senderAddress = sender || ws.address
  
  if (!senderAddress) {
    console.error('💬 No sender address found')
    return
  }
  
  try {
    // Save to database first
    if (dbService && dbService.saveChatMessage) {
      await dbService.saveChatMessage(
        gameId, 
        senderAddress, 
        message, 
        'chat'
      )
    }
    
    // Broadcast to the room using the old system's broadcastToRoom
    broadcastToRoom(gameId, {
      type: 'chat_message',
      message,
      from: senderAddress,
      timestamp: new Date().toISOString()
    })
    
    console.log('💬 Chat message saved and broadcasted successfully')
  } catch (error) {
    console.error('❌ Error saving chat message:', error)
  }
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
  const { roomId, address } = data
  
  console.log('🔍 handleJoinRoom called with:', { roomId, address, socketId: ws.id })
  
  // Store user socket if address is provided
  if (address) {
    userSockets.set(address, ws)
    ws.address = address
  }
  
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
