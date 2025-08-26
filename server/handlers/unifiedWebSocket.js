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
    
    return false
  }

  startGameTransition() {
    console.log('🎮 Starting game transition for room:', this.gameId)
    
    // Hide offers box immediately
    this.phase = 'countdown'
    
    // Broadcast transition start
    this.broadcast({
      type: 'game_transition_started',
      hideOffers: true,
      moveChat: true,
      currentRound: 1,
      players: {
        creator: this.creator,
        joiner: this.joiner
      }
    })
    
    // Start 3-second countdown
    let countdown = 3
    const countdownInterval = setInterval(() => {
      this.broadcast({
        type: 'countdown_update',
        count: countdown
      })
      
      countdown--
      if (countdown < 0) {
        clearInterval(countdownInterval)
        this.startGame()
      }
    }, 1000)
  }

  startGame() {
    console.log('🎮 Game starting in room:', this.gameId)
    this.phase = 'choosing'
    this.currentRound = 1
    this.currentTurn = 'creator' // Creator always goes first
    
    // Initialize server-side coin
    this.serverCoinState = {
      rotation: 0,
      result: null,
      flipping: false
    }
    
    this.broadcast({
      type: 'game_started',
      phase: 'choosing',
      currentTurn: this.currentTurn,
      currentRound: this.currentRound,
      maxRounds: this.maxRounds,
      serverCoin: true,
      layout: {
        chatPosition: 'top-left',
        nftDetailsPosition: 'left-below-chat',
        gameAreaPosition: 'center',
        offersHidden: true
      }
    })
    
    this.startChoiceTimer()
  }

  startChoiceTimer() {
    // Clear any existing timer
    if (this.choiceTimer) {
      clearTimeout(this.choiceTimer)
    }
    
    // 30 seconds for both players to make choices
    this.choiceTimer = setTimeout(() => {
      this.autoCompleteChoices()
    }, 30000)
    
    this.broadcast({
      type: 'choice_timer_started',
      duration: 30000,
      currentTurn: this.currentTurn
    })
  }

  handleChoice(playerAddress, choice) {
    const isCreator = playerAddress === this.creator
    const isJoiner = playerAddress === this.joiner
    
    if (!isCreator && !isJoiner) {
      return false
    }
    
    // Check if it's their turn
    const playerRole = isCreator ? 'creator' : 'joiner'
    if (this.currentTurn !== playerRole) {
      return false
    }
    
    // Store choice
    this.choices[playerRole] = choice
    
    this.broadcast({
      type: 'choice_made',
      player: playerRole,
      choiceMade: true // Don't reveal the actual choice
    })
    
    // Switch turns
    if (this.currentTurn === 'creator') {
      this.currentTurn = 'joiner'
      this.broadcast({
        type: 'turn_changed',
        currentTurn: 'joiner'
      })
    } else {
      // Both players have chosen, move to power phase
      this.phase = 'power'
      this.broadcast({
        type: 'power_phase_started',
        bothChosen: true
      })
    }
    
    return true
  }

  handlePowerCharge(playerAddress, powerLevel) {
    const isCreator = playerAddress === this.creator
    const isJoiner = playerAddress === this.joiner
    
    if (!isCreator && !isJoiner) {
      return false
    }
    
    const playerRole = isCreator ? 'creator' : 'joiner'
    this.powers[playerRole] = powerLevel
    
    this.broadcast({
      type: 'power_charged',
      player: playerRole,
      powerLevel
    })
    
    // Check if both players have charged
    if (this.powers.creator > 0 && this.powers.joiner > 0) {
      this.executeFlip()
    }
    
    return true
  }

  autoCompleteChoices() {
    // Auto-select for players who haven't chosen
    if (!this.choices.creator) {
      this.choices.creator = Math.random() > 0.5 ? 'heads' : 'tails'
      this.broadcast({
        type: 'auto_choice',
        player: 'creator',
        choice: this.choices.creator
      })
    }
    
    if (!this.choices.joiner) {
      this.choices.joiner = Math.random() > 0.5 ? 'heads' : 'tails'
      this.broadcast({
        type: 'auto_choice',
        player: 'joiner',
        choice: this.choices.joiner
      })
    }
    
    // Auto-set power for final round if needed
    const isFinalRound = this.currentRound === 5 && 
                        this.scores.creator === 2 && 
                        this.scores.joiner === 2
    
    const autoPower = isFinalRound ? 100 : 50
    
    if (this.powers.creator === 0) {
      this.powers.creator = autoPower
    }
    if (this.powers.joiner === 0) {
      this.powers.joiner = autoPower
    }
    
    this.executeFlip()
  }

  executeFlip() {
    clearTimeout(this.choiceTimer)
    this.phase = 'flipping'
    
    // Server determines the result
    const flipResult = Math.random() > 0.5 ? 'heads' : 'tails'
    this.serverCoinState.result = flipResult
    this.serverCoinState.flipping = true
    
    // Stream coin flip animation from server
    const flipDuration = 3000
    const startTime = Date.now()
    const fps = 30
    
    this.broadcast({
      type: 'flip_started',
      duration: flipDuration,
      serverControlled: true,
      choices: {
        creator: this.choices.creator,
        joiner: this.choices.joiner
      },
      powers: {
        creator: this.powers.creator,
        joiner: this.powers.joiner
      }
    })
    
    // Stream coin frames
    const frameInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = elapsed / flipDuration
      
      if (progress >= 1) {
        clearInterval(frameInterval)
        this.serverCoinState.flipping = false
        this.determineWinner()
      } else {
        // Calculate rotation for this frame
        const rotation = progress * Math.PI * 10 // 5 full rotations
        this.serverCoinState.rotation = rotation
        
        // Generate frame data
        const frameData = this.coinStream.renderFrame(this.gameId, rotation, flipResult)
        
        this.broadcast({
          type: 'coin_frame',
          frameData,
          rotation,
          progress,
          timestamp: Date.now()
        })
      }
    }, 1000 / fps)
  }

  determineWinner() {
    const result = this.serverCoinState.result
    
    // Determine round winner
    let roundWinner
    if (this.choices.creator === result) {
      roundWinner = 'creator'
      this.scores.creator++
    } else {
      roundWinner = 'joiner'
      this.scores.joiner++
    }
    
    this.phase = 'result'
    
    this.broadcast({
      type: 'flip_result',
      result,
      roundWinner,
      winner: roundWinner === 'creator' ? this.creator : this.joiner,
      scores: this.scores,
      round: this.currentRound,
      choices: this.choices,
      powers: this.powers
    })
    
    // Check for game winner
    const creatorWins = this.scores.creator >= 3
    const joinerWins = this.scores.joiner >= 3
    const maxRoundsReached = this.currentRound >= this.maxRounds
    
    if (creatorWins || joinerWins || maxRoundsReached) {
      setTimeout(() => this.endGame(), 3000)
    } else {
      // Next round after delay
      setTimeout(() => this.startNextRound(), 3000)
    }
  }

  startNextRound() {
    this.currentRound++
    this.phase = 'choosing'
    this.currentTurn = 'creator' // Creator always goes first each round
    this.choices = { creator: null, joiner: null }
    this.powers = { creator: 0, joiner: 0 }
    
    this.broadcast({
      type: 'next_round',
      round: this.currentRound,
      currentTurn: this.currentTurn,
      scores: this.scores
    })
    
    this.startChoiceTimer()
  }

  endGame() {
    this.phase = 'completed'
    
    const gameWinner = this.scores.creator > this.scores.joiner ? 'creator' : 'joiner'
    const winnerAddress = gameWinner === 'creator' ? this.creator : this.joiner
    
    this.broadcast({
      type: 'game_completed',
      winner: gameWinner,
      winnerAddress,
      finalScores: this.scores,
      totalRounds: this.currentRound
    })
    
    // Clean up timers
    this.clearDepositTimer()
    if (this.choiceTimer) {
      clearTimeout(this.choiceTimer)
    }
    if (this.roundTimer) {
      clearTimeout(this.roundTimer)
    }
  }

  broadcast(message) {
    const fullMessage = {
      ...message,
      gameId: this.gameId,
      timestamp: Date.now()
    }
    
    // Send to all connected players and spectators
    const allAddresses = [this.creator, this.joiner, ...this.spectators]
    allAddresses.forEach(address => {
      if (address) {
        const socket = userSockets.get(address)
        if (socket && socket.readyState === 1) {
          socket.send(JSON.stringify(fullMessage))
        }
      }
    })
  }
}

// Export the handlers
module.exports = {
  gameRooms,
  userSockets,
  GameRoom,
  
  handleConnection(ws, dbService) {
    console.log('🔌 New WebSocket connection')
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message)
        
        switch (data.type) {
          case 'join_game':
            await handleJoinGame(ws, data, dbService)
            break
            
          case 'make_offer':
            handleMakeOffer(ws, data)
            break
            
          case 'accept_offer':
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
  
  // Broadcast to specific room
  broadcastToRoom(gameId, message) {
    const room = gameRooms.get(gameId)
    if (room) {
      room.broadcast(message)
    }
  }
}

// Message handlers
async function handleJoinGame(ws, data, dbService) {
  const { gameId, address } = data
  
  // Store socket reference
  ws.address = address
  userSockets.set(address, ws)
  
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
      ws.send(JSON.stringify({
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
  } else if (address === room.joiner) {
    role = 'joiner'
  } else if (!room.joiner && room.phase === 'waiting') {
    role = 'joiner_candidate'
  }
  
  // Add spectator if not a player
  if (role === 'spectator') {
    room.spectators.add(address)
  }
  
  // Send initial state
  ws.send(JSON.stringify({
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
    currentRound: room.currentRound,
    currentTurn: room.currentTurn
  }))
  
  // Notify others
  room.broadcast({
    type: 'player_joined',
    address,
    role
  })
}

function handleMakeOffer(ws, data) {
  const { gameId, offer } = data
  const room = gameRooms.get(gameId)
  
  if (!room || room.phase !== 'waiting') {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Cannot make offers now'
    }))
    return
  }
  
  const newOffer = {
    id: crypto.randomBytes(8).toString('hex'),
    from: ws.address,
    ...offer,
    timestamp: Date.now()
  }
  
  room.offers.push(newOffer)
  room.broadcast({
    type: 'offer_made',
    offer: newOffer
  })
}

function handleAcceptOffer(ws, data) {
  const { gameId, offerId } = data
  const room = gameRooms.get(gameId)
  
  if (!room || ws.address !== room.creator) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Only creator can accept offers'
    }))
    return
  }
  
  const offer = room.offers.find(o => o.id === offerId)
  if (!offer) {
    ws.send(JSON.stringify({
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

function handleDepositConfirmed(ws, data) {
  const { gameId, assetType } = data
  const room = gameRooms.get(gameId)
  
  if (!room) {
    return
  }
  
  // Confirm the deposit and check if both are ready
  const bothDeposited = room.confirmDeposit(ws.address, assetType)
  
  room.broadcast({
    type: 'deposit_received',
    player: ws.address,
    assetType,
    bothDeposited
  })
}

function handleChoiceMade(ws, data) {
  const { gameId, choice } = data
  const room = gameRooms.get(gameId)
  
  if (!room || room.phase !== 'choosing') {
    return
  }
  
  room.handleChoice(ws.address, choice)
}

function handlePowerCharged(ws, data) {
  const { gameId, powerLevel } = data
  const room = gameRooms.get(gameId)
  
  if (!room || room.phase !== 'power') {
    return
  }
  
  room.handlePowerCharge(ws.address, powerLevel)
}

function handleChatMessage(ws, data) {
  const { gameId, message } = data
  const room = gameRooms.get(gameId)
  
  if (!room) {
    return
  }
  
  const chatMessage = {
    from: ws.address,
    message,
    timestamp: Date.now()
  }
  
  room.messages.push(chatMessage)
  room.broadcast({
    type: 'chat_message',
    ...chatMessage
  })
}

function handleDisconnect(ws) {
  if (ws.address) {
    userSockets.delete(ws.address)
    
    // Remove from any game rooms
    gameRooms.forEach(room => {
      room.removePlayer(ws.address)
    })
  }
}
