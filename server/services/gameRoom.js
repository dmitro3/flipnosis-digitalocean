const crypto = require('crypto')

class GameRoom {
  constructor(gameId, player1, player2, wsHandlers) {
    this.gameId = gameId
    this.players = [player1, player2]
    this.player1 = player1
    this.player2 = player2
    this.state = 'waiting' // waiting, active, completed, forfeited
    this.roomId = `game_room_${gameId}`
    this.wsHandlers = wsHandlers
    this.connectedSockets = new Set()
    this.playerSockets = new Map() // address -> socket
    this.disconnectTimers = new Map() // address -> timer
    this.forfeitGracePeriod = 30000 // 30 seconds grace period for reconnection
    
    // Game state
    this.currentRound = 1
    this.maxRounds = 5
    this.playerChoices = new Map()
    this.playerPower = new Map()
    this.wins = new Map()
    this.wins.set(player1, 0)
    this.wins.set(player2, 0)
    this.flipSeed = null
    
    console.log(`🏟️ GameRoom created for game ${gameId}:`, {
      roomId: this.roomId,
      player1,
      player2
    })
  }

  // Add player to room (only the 2 designated players allowed)
  addPlayer(address, socket) {
    if (!this.players.includes(address)) {
      console.log(`❌ Player ${address} not authorized for game room ${this.gameId}`)
      return false
    }

    // Clear any existing disconnect timer
    if (this.disconnectTimers.has(address)) {
      clearTimeout(this.disconnectTimers.get(address))
      this.disconnectTimers.delete(address)
      console.log(`⏰ Cancelled disconnect timer for ${address}`)
    }

    this.connectedSockets.add(socket.id)
    this.playerSockets.set(address, socket)
    
    console.log(`✅ Player ${address} added to game room ${this.gameId}`)
    console.log(`👥 Connected players: ${this.connectedSockets.size}/2`)

    // Start game if both players are connected
    if (this.connectedSockets.size === 2 && this.state === 'waiting') {
      this.startGame()
    }

    return true
  }

  // Remove player from room (triggers forfeit warning)
  removePlayer(address, socket) {
    if (!this.players.includes(address)) {
      return false
    }

    this.connectedSockets.delete(socket?.id)
    this.playerSockets.delete(address)

    console.log(`⚠️ Player ${address} disconnected from game room ${this.gameId}`)

    // If game is active, start forfeit timer
    if (this.state === 'active') {
      this.startForfeitTimer(address)
    }

    return true
  }

  // Start forfeit timer for disconnected player
  startForfeitTimer(address) {
    console.log(`⏰ Starting forfeit timer for ${address} - ${this.forfeitGracePeriod/1000}s to reconnect`)

    // Notify remaining player
    const remainingPlayer = this.players.find(p => p !== address)
    this.sendToPlayer(remainingPlayer, {
      type: 'PLAYER_DISCONNECTED',
      disconnectedPlayer: address,
      graceTime: this.forfeitGracePeriod,
      message: 'Opponent disconnected. They have 30 seconds to reconnect or forfeit.'
    })

    const timer = setTimeout(() => {
      console.log(`🏳️ Player ${address} forfeited due to disconnect timeout`)
      this.handleForfeit(address, 'disconnect_timeout')
    }, this.forfeitGracePeriod)

    this.disconnectTimers.set(address, timer)
  }

  // Start the game
  startGame() {
    console.log(`🎮 Starting game in room ${this.gameId}`)
    this.state = 'active'
    
    // Broadcast game start
    this.broadcast({
      type: 'GAME_STARTED',
      gameId: this.gameId,
      roundNumber: this.currentRound,
      timestamp: Date.now()
    })

    // Start first round
    this.startNewRound()
  }

  // Start a new round
  startNewRound() {
    console.log(`🔄 Starting round ${this.currentRound} in game room ${this.gameId}`)
    
    // Reset round state
    this.playerChoices.clear()
    this.playerPower.clear()
    this.flipSeed = null

    this.broadcast({
      type: 'NEW_ROUND_STARTED',
      gameId: this.gameId,
      roundNumber: this.currentRound,
      player1Wins: this.wins.get(this.player1),
      player2Wins: this.wins.get(this.player2),
      timestamp: Date.now()
    })
  }

  // Handle player choice
  handlePlayerChoice(address, choice) {
    if (!this.players.includes(address)) {
      return false
    }

    console.log(`👤 Player ${address} chose ${choice} in room ${this.gameId}`)
    this.playerChoices.set(address, choice)

    // Broadcast choice made (without revealing the choice)
    this.broadcast({
      type: 'PLAYER_CHOICE_MADE',
      gameId: this.gameId,
      player: address,
      round: this.currentRound,
      timestamp: Date.now()
    })

    // Check if both players have chosen
    if (this.playerChoices.size === 2) {
      this.startPowerPhase()
    }

    return true
  }

  // Start power charging phase
  startPowerPhase() {
    console.log(`⚡ Starting power phase for game room ${this.gameId}`)
    
    this.broadcast({
      type: 'POWER_PHASE_STARTED',
      gameId: this.gameId,
      round: this.currentRound,
      timestamp: Date.now()
    })
  }

  // Handle power charge
  handlePowerCharge(address, powerLevel) {
    if (!this.players.includes(address)) {
      return false
    }

    console.log(`⚡ Power charge in room ${this.gameId}: ${address} charged ${powerLevel}`)
    this.playerPower.set(address, powerLevel)

    // Broadcast power charged
    this.broadcast({
      type: 'POWER_CHARGED',
      gameId: this.gameId,
      player: address,
      powerLevel,
      round: this.currentRound,
      timestamp: Date.now()
    })

    // Check if both players have charged
    if (this.playerPower.size === 2) {
      this.triggerFlip()
    }

    return true
  }

  // Trigger coin flip with deterministic seed
  triggerFlip() {
    console.log(`🎲 Triggering flip for game room ${this.gameId}`)

    // Generate deterministic seed based on game state
    // This ensures both clients can reproduce the same animation
    this.flipSeed = this.generateFlipSeed()
    
    // Generate flip result
    const result = Math.random() < 0.5 ? 'heads' : 'tails'
    
    // Determine round winner
    const player1Choice = this.playerChoices.get(this.player1)
    const player2Choice = this.playerChoices.get(this.player2)
    
    const player1Wins = player1Choice === result
    const roundWinner = player1Wins ? this.player1 : this.player2
    
    // Update wins
    const currentWins = this.wins.get(roundWinner) || 0
    this.wins.set(roundWinner, currentWins + 1)

    console.log(`🎲 Flip result: ${result}, Round winner: ${roundWinner}`)

    // Broadcast flip start - clients will handle animation
    this.broadcast({
      type: 'FLIP_START',
      gameId: this.gameId,
      result,
      seed: this.flipSeed, // Send seed for deterministic animation
      duration: 3000, // Animation duration
      player1Power: this.playerPower.get(this.player1),
      player2Power: this.playerPower.get(this.player2),
      timestamp: Date.now()
    })

    // Schedule result announcement after animation
    setTimeout(() => {
      this.announceFlipResult(result, roundWinner, player1Choice, player2Choice)
    }, 3000)
  }

  // Generate deterministic seed for flip animation
  generateFlipSeed() {
    // Create seed from game state
    const player1Power = this.playerPower.get(this.player1) || 0
    const player2Power = this.playerPower.get(this.player2) || 0
    const roundSeed = this.currentRound * 1000
    const timeSeed = Date.now() % 1000
    
    return roundSeed + player1Power + player2Power + timeSeed
  }

  // Announce flip result after animation
  announceFlipResult(result, roundWinner, player1Choice, player2Choice) {
    this.broadcast({
      type: 'FLIP_RESULT',
      gameId: this.gameId,
      result,
      roundWinner,
      roundNumber: this.currentRound,
      player1Choice,
      player2Choice,
      player1Wins: this.wins.get(this.player1),
      player2Wins: this.wins.get(this.player2),
      timestamp: Date.now()
    })

    // Check if game is complete
    const player1TotalWins = this.wins.get(this.player1)
    const player2TotalWins = this.wins.get(this.player2)
    
    if (player1TotalWins >= 3 || player2TotalWins >= 3 || this.currentRound >= this.maxRounds) {
      this.completeGame()
    } else {
      this.startNextRound()
    }
  }

  // Start next round
  startNextRound() {
    this.currentRound++
    this.playerChoices.clear()
    this.playerPower.clear()
    this.flipSeed = null

    console.log(`🔄 Starting round ${this.currentRound} in game room ${this.gameId}`)

    this.broadcast({
      type: 'NEW_ROUND_STARTED',
      gameId: this.gameId,
      roundNumber: this.currentRound,
      player1Wins: this.wins.get(this.player1),
      player2Wins: this.wins.get(this.player2),
      timestamp: Date.now()
    })
  }

  // Complete the game
  completeGame() {
    console.log(`🏆 Completing game in room ${this.gameId}`)

    const player1Wins = this.wins.get(this.player1)
    const player2Wins = this.wins.get(this.player2)
    const winner = player1Wins > player2Wins ? this.player1 : this.player2

    this.state = 'completed'

    // Broadcast game completion
    this.broadcast({
      type: 'GAME_COMPLETED',
      gameId: this.gameId,
      winner,
      player1Wins,
      player2Wins,
      timestamp: Date.now()
    })

    // Cleanup room after short delay
    setTimeout(() => {
      this.cleanup()
    }, 10000)
  }

  // Handle forfeit
  handleForfeit(address, reason) {
    console.log(`🏳️ Player ${address} forfeited: ${reason}`)
    
    const winner = this.players.find(p => p !== address)
    this.state = 'completed'

    this.broadcast({
      type: 'GAME_COMPLETED',
      gameId: this.gameId,
      winner,
      forfeitReason: reason,
      forfeitedPlayer: address,
      timestamp: Date.now()
    })

    // Cleanup room after short delay
    setTimeout(() => {
      this.cleanup()
    }, 10000)
  }

  // Send message to specific player
  sendToPlayer(address, message) {
    const socket = this.playerSockets.get(address)
    if (socket) {
      socket.emit('game_message', message)
    }
  }

  // Broadcast message to all players in room
  broadcast(message) {
    console.log(`📢 Broadcasting to room ${this.gameId}:`, message.type)
    
    this.players.forEach(address => {
      this.sendToPlayer(address, message)
    })
  }

  // Cleanup room
  cleanup() {
    console.log(`🧹 Cleaning up game room ${this.gameId}`)
    this.playerChoices.clear()
    this.playerPower.clear()
    this.wins.clear()
    
    // Clear disconnect timers
    this.disconnectTimers.forEach(timer => clearTimeout(timer))
    this.disconnectTimers.clear()
    
    // Remove from room manager
    if (this.wsHandlers && this.wsHandlers.removeRoom) {
      this.wsHandlers.removeRoom(this.gameId)
    }
  }

  // Get room info
  getRoomInfo() {
    return {
      gameId: this.gameId,
      state: this.state,
      currentRound: this.currentRound,
      player1: this.player1,
      player2: this.player2,
      player1Wins: this.wins.get(this.player1),
      player2Wins: this.wins.get(this.player2),
      connectedPlayers: this.connectedSockets.size
    }
  }
}

module.exports = GameRoom
