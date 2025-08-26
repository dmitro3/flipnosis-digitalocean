const crypto = require('crypto')
const CoinStreamService = require('../services/coinStream')

// Game room management
const gameRooms = new Map() // gameId -> GameRoom instance
const userSockets = new Map() // address -> socket

class GameRoom {
  constructor(gameId, creator) {
    this.gameId = gameId
    this.creator = creator
    this.joiner = null
    this.spectators = new Set()
    this.phase = 'waiting' // waiting | locked | countdown | playing | completed
    this.offers = []
    this.messages = []
    this.currentRound = 1
    this.scores = { creator: 0, joiner: 0 }
    this.choices = { creator: null, joiner: null }
    this.powers = { creator: 0, joiner: 0 }
    this.currentTurn = creator
    this.depositTimer = null
    this.roundTimer = null
    this.coinStream = new CoinStreamService()
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
      if (this.phase === 'locked') {
        this.phase = 'waiting'
        this.joiner = null
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

  startRound() {
    this.choices = { creator: null, joiner: null }
    this.powers = { creator: 0, joiner: 0 }
    
    // 30 second timer for choices
    this.roundTimer = setTimeout(() => {
      this.autoFlip()
    }, 30000)
  }

  autoFlip() {
    // Auto-select choices if not made
    if (!this.choices.creator) {
      this.choices.creator = Math.random() > 0.5 ? 'heads' : 'tails'
    }
    if (!this.choices.joiner) {
      this.choices.joiner = Math.random() > 0.5 ? 'heads' : 'tails'
    }
    
    // Set power to 50 for auto-flip (or 100 for round 5)
    const autoPower = this.currentRound === 5 && this.scores.creator === 2 && this.scores.joiner === 2 ? 100 : 50
    if (this.powers.creator === 0) this.powers.creator = autoPower
    if (this.powers.joiner === 0) this.powers.joiner = autoPower
    
    this.executeFlip()
  }

  executeFlip() {
    clearTimeout(this.roundTimer)
    
    // Start streaming coin flip
    const flipDuration = 2000
    const startTime = Date.now()
    
    this.broadcast({
      type: 'flip_started',
      duration: flipDuration
    })
    
    // Stream coin frames
    const frameInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = elapsed / flipDuration
      
      if (progress >= 1) {
        clearInterval(frameInterval)
        this.determineWinner()
      } else {
        const rotation = progress * Math.PI * 10 // 5 full rotations
        const frameData = this.coinStream.renderFrame(this.gameId, rotation)
        
        this.broadcast({
          type: 'coin_frame',
          frameData,
          timestamp: Date.now()
        })
      }
    }, 1000 / 30) // 30 FPS
  }

  determineWinner() {
    // Calculate winner based on choices and power
    const result = Math.random() > 0.5 ? 'heads' : 'tails'
    
    // Determine round winner (simplified - you can add power logic here)
    let winner
    if (this.choices.creator === result) {
      winner = this.creator
      this.scores.creator++
    } else {
      winner = this.joiner
      this.scores.joiner++
    }
    
    this.broadcast({
      type: 'flip_result',
      result,
      winner,
      scores: this.scores,
      round: this.currentRound
    })
    
    // Check for game winner
    if (this.scores.creator === 3 || this.scores.joiner === 3 || this.currentRound === 5) {
      this.endGame()
    } else {
      // Next round
      this.currentRound++
      this.currentTurn = this.currentTurn === this.creator ? this.joiner : this.creator
      setTimeout(() => {
        this.startRound()
        this.broadcast({
          type: 'next_round',
          round: this.currentRound,
          currentTurn: this.currentTurn
        })
      }, 3000)
    }
  }

  endGame() {
    const winner = this.scores.creator > this.scores.joiner ? this.creator : this.joiner
    this.phase = 'completed'
    
    this.broadcast({
      type: 'game_completed',
      winner,
      finalScores: this.scores
    })
    
    // Clean up
    this.coinStream.cleanupScene(this.gameId)
  }

  broadcast(message) {
    const messageStr = JSON.stringify(message)
    
    // Send to creator
    const creatorSocket = userSockets.get(this.creator)
    if (creatorSocket?.readyState === 1) {
      creatorSocket.send(messageStr)
    }
    
    // Send to joiner
    if (this.joiner) {
      const joinerSocket = userSockets.get(this.joiner)
      if (joinerSocket?.readyState === 1) {
        joinerSocket.send(messageStr)
      }
    }
    
    // Send to spectators
    this.spectators.forEach(address => {
      const socket = userSockets.get(address)
      if (socket?.readyState === 1) {
        socket.send(messageStr)
      }
    })
  }
}

function createUnifiedWebSocketHandlers(wss, dbService) {
  wss.on('connection', (socket, req) => {
    socket.id = crypto.randomBytes(16).toString('hex')
    console.log(`🔌 New connection: ${socket.id}`)
    
    socket.on('close', () => {
      console.log(`🔌 Disconnected: ${socket.id}`)
      
      // Clean up
      if (socket.address) {
        userSockets.delete(socket.address)
        
        // Remove from game rooms
        gameRooms.forEach((room, gameId) => {
          room.removePlayer(socket.address)
        })
      }
    })

    socket.on('message', async (message) => {
      try {
        const data = JSON.parse(message)
        
        // Handle different message types
        switch (data.type) {
          case 'join_game':
            handleJoinGame(socket, data, dbService)
            break
            
          case 'make_offer':
            handleMakeOffer(socket, data)
            break
            
          case 'accept_offer':
            handleAcceptOffer(socket, data)
            break
            
          case 'deposit_confirmed':
            handleDepositConfirmed(socket, data)
            break
            
          case 'choice_made':
            handleChoiceMade(socket, data)
            break
            
          case 'power_charged':
            handlePowerCharged(socket, data)
            break
            
          case 'trigger_flip':
            handleTriggerFlip(socket, data)
            break
            
          case 'chat_message':
            handleChatMessage(socket, data)
            break
            
          default:
            console.log('Unknown message type:', data.type)
        }
      } catch (error) {
        console.error('Message handling error:', error)
      }
    })
  })

  // Message handlers
  async function handleJoinGame(socket, data, dbService) {
    const { gameId, address } = data
    
    // Store socket reference
    socket.address = address
    userSockets.set(address, socket)
    
    // Get or create game room
    let room = gameRooms.get(gameId)
    
    if (!room) {
      // Verify game exists in database
      const db = dbService.getDatabase()
      const game = await new Promise((resolve) => {
        db.get('SELECT * FROM games WHERE id = ?', [gameId], (err, row) => {
          resolve(row)
        })
      })
      
      if (!game) {
        socket.send(JSON.stringify({
          type: 'error',
          message: 'Game not found'
        }))
        return
      }
      
      room = new GameRoom(gameId, game.creator)
      gameRooms.set(gameId, room)
    }
    
    // Determine player role
    let role = 'spectator'
    if (address === room.creator) {
      role = 'creator'
    } else if (!room.joiner && room.phase === 'waiting') {
      role = 'joiner_candidate'
    } else if (address === room.joiner) {
      role = 'joiner'
    }
    
    // Send initial state
    socket.send(JSON.stringify({
      type: 'game_joined',
      gameId,
      role,
      phase: room.phase,
      offers: room.offers,
      messages: room.messages,
      players: {
        creator: room.creator,
        joiner: room.joiner
      },
      scores: room.scores,
      currentRound: room.currentRound
    }))
    
    // Notify others
    room.broadcast({
      type: 'player_joined',
      address,
      role
    })
  }

  function handleMakeOffer(socket, data) {
    const { gameId, offer } = data
    const room = gameRooms.get(gameId)
    
    if (!room || room.phase !== 'waiting') {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Cannot make offers now'
      }))
      return
    }
    
    const newOffer = {
      id: crypto.randomBytes(8).toString('hex'),
      from: socket.address,
      ...offer,
      timestamp: Date.now()
    }
    
    room.offers.push(newOffer)
    room.broadcast({
      type: 'offer_made',
      offer: newOffer
    })
  }

  function handleAcceptOffer(socket, data) {
    const { gameId, offerId } = data
    const room = gameRooms.get(gameId)
    
    if (!room || socket.address !== room.creator) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Only creator can accept offers'
      }))
      return
    }
    
    const offer = room.offers.find(o => o.id === offerId)
    if (!offer) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Offer not found'
      }))
      return
    }
    
    // Lock in the joiner
    room.addPlayer(offer.from, userSockets.get(offer.from), 'joiner')
    
    room.broadcast({
      type: 'offer_accepted',
      offerId,
      joinerAddress: offer.from,
      joinerName: offer.fromName || 'Player 2'
    })
  }

  function handleDepositConfirmed(socket, data) {
    const { gameId } = data
    const room = gameRooms.get(gameId)
    
    if (!room || socket.address !== room.joiner) {
      return
    }
    
    room.clearDepositTimer()
    room.phase = 'countdown'
    
    room.broadcast({
      type: 'deposit_confirmed'
    })
    
    // Start game after countdown
    setTimeout(() => {
      room.phase = 'playing'
      room.startRound()
      room.broadcast({
        type: 'game_started',
        currentTurn: room.currentTurn
      })
    }, 3000)
  }

  function handleChoiceMade(socket, data) {
    const { gameId, choice } = data
    const room = gameRooms.get(gameId)
    
    if (!room || room.phase !== 'playing') {
      return
    }
    
    // Store choice
    if (socket.address === room.creator) {
      room.choices.creator = choice
    } else if (socket.address === room.joiner) {
      room.choices.joiner = choice
    }
    
    room.broadcast({
      type: 'choice_made',
      player: socket.address,
      choice: '?' // Don't reveal choice to opponent
    })
    
    // Check if both choices made
    if (room.choices.creator && room.choices.joiner) {
      room.executeFlip()
    }
  }

  function handlePowerCharged(socket, data) {
    const { gameId, power } = data
    const room = gameRooms.get(gameId)
    
    if (!room || room.phase !== 'playing') {
      return
    }
    
    // Store power
    if (socket.address === room.creator) {
      room.powers.creator = power
    } else if (socket.address === room.joiner) {
      room.powers.joiner = power
    }
    
    room.broadcast({
      type: 'power_charged',
      player: socket.address,
      power
    })
  }

  function handleTriggerFlip(socket, data) {
    const { gameId } = data
    const room = gameRooms.get(gameId)
    
    if (!room) return
    
    // This is called when both choices are made
    room.executeFlip()
  }

  function handleChatMessage(socket, data) {
    const { gameId, message } = data
    const room = gameRooms.get(gameId)
    
    if (!room) return
    
    const chatMessage = {
      id: crypto.randomBytes(8).toString('hex'),
      from: socket.address,
      message,
      timestamp: Date.now()
    }
    
    room.messages.push(chatMessage)
    room.broadcast({
      type: 'chat_message',
      ...chatMessage
    })
  }

  return {
    gameRooms,
    userSockets
  }
}

module.exports = createUnifiedWebSocketHandlers
