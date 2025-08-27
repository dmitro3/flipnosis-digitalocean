const WebSocket = require('ws')
const dbService = require('../services/database')

// Game rooms storage
const gameRooms = new Map()

// GameRoom class to manage game state
class GameRoom {
  constructor(gameId, creator) {
    this.gameId = gameId
    this.creator = creator
    this.joiner = null
    this.phase = 'waiting' // waiting, locked, countdown, playing, completed
    this.depositTimer = null
    this.roundTimer = null
    this.currentRound = 0
    this.scores = { creator: 0, joiner: 0 }
    this.roundResults = []
    this.choices = { creator: null, joiner: null }
    this.powers = { creator: 0, joiner: 0 }
    this.flipAnimation = null
    this.spectators = new Set()
  }
  
  // Add joiner to room
  addJoiner(joinerAddress) {
    this.joiner = joinerAddress
    this.phase = 'locked'
    return true
  }
  
  // Start deposit timer
  startDepositTimer() {
    this.depositTimer = setTimeout(() => {
      this.handleDepositTimeout()
    }, 120000) // 2 minutes
  }
  
  // Clear deposit timer
  clearDepositTimer() {
    if (this.depositTimer) {
      clearTimeout(this.depositTimer)
      this.depositTimer = null
    }
  }
  
  // Handle deposit timeout
  handleDepositTimeout() {
    console.log(`⏰ Deposit timeout for game ${this.gameId}`)
    this.phase = 'waiting'
    this.joiner = null
    
    // Broadcast timeout to room
    broadcastToRoom(this.gameId, {
      type: 'deposit_timeout',
      message: 'Deposit time expired. Game cancelled.'
    })
    
    // Update database
    const db = dbService.getDatabase()
    db.run(
      'UPDATE games SET status = ?, challenger = NULL WHERE id = ?',
      ['waiting_for_challenger', this.gameId]
    )
  }
  
  // Both deposits confirmed - start game
  startGame() {
    this.phase = 'countdown'
    this.clearDepositTimer()
    
    console.log(`🎮 Starting game ${this.gameId}`)
    
    // Broadcast phase transition
    broadcastToRoom(this.gameId, {
      type: 'game_phase_transition',
      phase: 'game_active',
      message: 'Both deposits confirmed! Game starting...'
    })
    
    // Start countdown after a brief delay
    setTimeout(() => {
      this.startCountdown()
    }, 1000)
  }
  
  // Start countdown
  startCountdown() {
    let count = 3
    
    const countInterval = setInterval(() => {
      broadcastToRoom(this.gameId, {
        type: 'countdown_start',
        count
      })
      
      count--
      if (count < 0) {
        clearInterval(countInterval)
        this.startRound()
      }
    }, 1000)
  }
  
  // Start a new round
  startRound() {
    this.currentRound++
    this.phase = 'playing'
    this.choices = { creator: null, joiner: null }
    this.powers = { creator: 0, joiner: 0 }
    
    console.log(`🎲 Starting round ${this.currentRound} for game ${this.gameId}`)
    
    broadcastToRoom(this.gameId, {
      type: 'round_start',
      round: this.currentRound,
      scores: this.scores
    })
    
    // Start round timer (30 seconds)
    this.roundTimer = setTimeout(() => {
      this.autoCompleteRound()
    }, 30000)
  }
  
  // Handle player choice
  handleChoice(player, choice) {
    const role = player === this.creator ? 'creator' : 'joiner'
    this.choices[role] = choice
    
    console.log(`👤 ${role} chose ${choice}`)
    
    // Broadcast to opponent
    const opponent = role === 'creator' ? this.joiner : this.creator
    sendToClient(opponent, {
      type: 'opponent_choice',
      choice: 'hidden' // Don't reveal yet
    })
    
    // Check if both players have chosen
    if (this.choices.creator && this.choices.joiner) {
      this.waitForPowers()
    }
  }
  
  // Wait for power charges
  waitForPowers() {
    // Give players 5 seconds to charge power
    setTimeout(() => {
      this.executeCoinFlip()
    }, 5000)
  }
  
  // Handle power release
  handlePowerRelease(player, power) {
    const role = player === this.creator ? 'creator' : 'joiner'
    this.powers[role] = power
    
    console.log(`⚡ ${role} released power at ${power}%`)
  }
  
  // Execute coin flip with server-side animation
  executeCoinFlip() {
    if (this.roundTimer) {
      clearTimeout(this.roundTimer)
      this.roundTimer = null
    }
    
    console.log(`🪙 Executing coin flip for round ${this.currentRound}`)
    
    // Broadcast flip start
    broadcastToRoom(this.gameId, {
      type: 'coin_flip_start',
      choices: this.choices
    })
    
    // Calculate result based on choices and powers
    const result = this.calculateFlipResult()
    
    // Stream coin animation frames
    this.streamCoinAnimation(result)
  }
  
  // Calculate flip result
  calculateFlipResult() {
    // Base 50/50 chance
    let creatorChance = 50
    let joinerChance = 50
    
    // Apply power influence (max 15% per player)
    creatorChance += (this.powers.creator / 100) * 15
    joinerChance += (this.powers.joiner / 100) * 15
    
    // Normalize
    const total = creatorChance + joinerChance
    creatorChance = (creatorChance / total) * 100
    
    // Random roll
    const roll = Math.random() * 100
    const creatorWins = roll < creatorChance
    
    // Determine actual result
    const flipResult = Math.random() < 0.5 ? 'heads' : 'tails'
    
    // Determine winner based on choices
    let winner = null
    if (this.choices.creator === flipResult) {
      winner = 'creator'
    } else if (this.choices.joiner === flipResult) {
      winner = 'joiner'
    }
    
    // Apply power influence to potentially override
    if (creatorWins && this.powers.creator > this.powers.joiner) {
      winner = 'creator'
    } else if (!creatorWins && this.powers.joiner > this.powers.creator) {
      winner = 'joiner'
    }
    
    return { flipResult, winner }
  }
  
  // Stream coin animation to clients
  streamCoinAnimation(result) {
    const frames = 30 // Total animation frames
    let frame = 0
    
    const animInterval = setInterval(() => {
      frame++
      
      // Calculate rotation
      const progress = frame / frames
      const rotation = progress * 720 // Two full rotations
      
      // Send frame to clients
      broadcastToRoom(this.gameId, {
        type: 'coin_flip_frame',
        frame,
        totalFrames: frames,
        rotation,
        result: frame === frames ? result.flipResult : null
      })
      
      if (frame >= frames) {
        clearInterval(animInterval)
        this.handleRoundResult(result)
      }
    }, 100) // 100ms per frame = 3 second animation
  }
  
  // Handle round result
  handleRoundResult(result) {
    const winner = result.winner
    
    if (winner === 'creator') {
      this.scores.creator++
    } else if (winner === 'joiner') {
      this.scores.joiner++
    }
    
    this.roundResults.push({
      round: this.currentRound,
      winner,
      result: result.flipResult,
      choices: this.choices,
      powers: this.powers
    })
    
    console.log(`🏆 Round ${this.currentRound} winner: ${winner}`)
    
    // Broadcast result
    broadcastToRoom(this.gameId, {
      type: 'round_result',
      round: this.currentRound,
      winner,
      result: result.flipResult,
      scores: this.scores,
      choices: this.choices
    })
    
    // Check for game completion
    if (this.scores.creator >= 3 || this.scores.joiner >= 3) {
      setTimeout(() => {
        this.completeGame()
      }, 3000)
    } else {
      // Start next round after delay
      setTimeout(() => {
        this.startRound()
      }, 3000)
    }
  }
  
  // Auto-complete round if timer expires
  autoCompleteRound() {
    console.log(`⏰ Round ${this.currentRound} timer expired`)
    
    // Auto-select for players who haven't chosen
    if (!this.choices.creator) {
      this.choices.creator = Math.random() < 0.5 ? 'heads' : 'tails'
    }
    if (!this.choices.joiner) {
      this.choices.joiner = Math.random() < 0.5 ? 'heads' : 'tails'
    }
    
    // Auto-set max power for round 5
    if (this.currentRound === 5) {
      this.powers.creator = 100
      this.powers.joiner = 100
    }
    
    this.executeCoinFlip()
  }
  
  // Complete the game
  completeGame() {
    this.phase = 'completed'
    
    const gameWinner = this.scores.creator > this.scores.joiner ? 'creator' : 'joiner'
    const winnerAddress = gameWinner === 'creator' ? this.creator : this.joiner
    
    console.log(`🎊 Game ${this.gameId} completed. Winner: ${gameWinner}`)
    
    // Update database
    const db = dbService.getDatabase()
    db.run(
      'UPDATE games SET status = ?, winner = ? WHERE id = ?',
      ['completed', winnerAddress, this.gameId]
    )
    
    // Broadcast completion
    broadcastToRoom(this.gameId, {
      type: 'game_complete',
      winner: winnerAddress,
      scores: this.scores,
      rounds: this.roundResults
    })
    
    // Clean up room after delay
    setTimeout(() => {
      gameRooms.delete(this.gameId)
    }, 60000) // Keep room for 1 minute for claims
  }
  
  // Add spectator
  addSpectator(address) {
    this.spectators.add(address)
    
    // Send current game state to spectator
    sendToClient(address, {
      type: 'spectator_sync',
      phase: this.phase,
      round: this.currentRound,
      scores: this.scores,
      roundResults: this.roundResults
    })
  }
}

// Global WebSocket server instance
let wss = null

// Client management
const clients = new Map() // socketId -> { socket, address, gameId }
const userSockets = new Map() // address -> socketId

// Broadcast to room
function broadcastToRoom(gameId, message) {
  const roomId = `game_${gameId}`
  const messageStr = JSON.stringify(message)
  
  console.log(`📢 Broadcasting to room ${roomId}:`, message.type)
  
  let sentCount = 0
  clients.forEach((client, socketId) => {
    if (client.gameId === gameId && client.socket.readyState === WebSocket.OPEN) {
      try {
        client.socket.send(messageStr)
        sentCount++
      } catch (error) {
        console.error(`❌ Failed to send to client ${socketId}:`, error)
        clients.delete(socketId)
      }
    }
  })
  
  console.log(`✅ Broadcast sent to ${sentCount} clients`)
}

// Send to specific client
function sendToClient(address, message) {
  const socketId = userSockets.get(address)
  if (socketId) {
    const client = clients.get(socketId)
    if (client && client.socket.readyState === WebSocket.OPEN) {
      try {
        client.socket.send(JSON.stringify(message))
      } catch (error) {
        console.error(`❌ Failed to send to client ${address}:`, error)
      }
    }
  }
}

// Message handlers
function handleJoinGame(socket, data) {
  const { gameId, address } = data
  
  // Store client info
  clients.set(socket.id, { socket, address, gameId })
  userSockets.set(address, socket.id)
  
  console.log(`✅ ${address} joined game ${gameId}`)
  
  // Get or create game room
  let gameRoom = gameRooms.get(gameId)
  if (!gameRoom) {
    gameRoom = new GameRoom(gameId, address)
    gameRooms.set(gameId, gameRoom)
  } else {
    // Add as joiner if not creator
    if (address !== gameRoom.creator && !gameRoom.joiner) {
      gameRoom.addJoiner(address)
    } else if (address !== gameRoom.creator && address !== gameRoom.joiner) {
      gameRoom.addSpectator(address)
    }
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

function handleRequestRoundStart(socket, data) {
  const { gameId, round } = data
  const gameRoom = gameRooms.get(gameId)
  
  if (!gameRoom) {
    console.error(`❌ Game room not found: ${gameId}`)
    return
  }
  
  // This could be used to manually trigger round start
  if (gameRoom.phase === 'countdown') {
    gameRoom.startRound()
  }
}

function handleDepositConfirmed(socket, data) {
  const { gameId, player, assetType } = data
  const gameRoom = gameRooms.get(gameId)
  
  if (!gameRoom) {
    console.error(`❌ Game room not found: ${gameId}`)
    return
  }
  
  // Update deposit status and check if both are confirmed
  if (assetType === 'nft' && player === gameRoom.creator) {
    gameRoom.creatorDepositConfirmed = true
  } else if (assetType === 'eth' && player === gameRoom.joiner) {
    gameRoom.joinerDepositConfirmed = true
  }
  
  // Check if both deposits are confirmed
  if (gameRoom.creatorDepositConfirmed && gameRoom.joinerDepositConfirmed) {
    gameRoom.startGame()
  }
}

// Main WebSocket handler
function handleConnection(ws, dbService) {
  ws.id = require('crypto').randomBytes(16).toString('hex')
  
  console.log(`🔌 New WebSocket connection: ${ws.id}`)
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString())
      console.log(`📨 Received message from ${ws.id}:`, data.type)
      
      switch (data.type) {
        case 'join_game':
          handleJoinGame(ws, data)
          break
          
        case 'player_choice':
          handlePlayerChoice(ws, data)
          break
          
        case 'power_release':
          handlePowerRelease(ws, data)
          break
          
        case 'request_round_start':
          handleRequestRoundStart(ws, data)
          break
          
        case 'deposit_confirmed':
          handleDepositConfirmed(ws, data)
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
    
    // Clean up client data
    const client = clients.get(ws.id)
    if (client) {
      userSockets.delete(client.address)
      clients.delete(ws.id)
    }
  })
  
  ws.on('error', (error) => {
    console.error(`❌ WebSocket error for ${ws.id}:`, error)
  })
}

// Initialize WebSocket server
function initializeWebSocket(server) {
  wss = new WebSocket.Server({ server })
  
  wss.on('connection', (ws) => {
    handleConnection(ws, dbService)
  })
  
  console.log('🚀 WebSocket server initialized')
}

module.exports = {
  initializeWebSocket,
  gameRooms,
  broadcastToRoom,
  sendToClient
}
