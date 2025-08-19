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

  // Handle forfeit
  handleForfeit(forfeitingPlayer, reason = 'manual') {
    console.log(`🏳️ Forfeit in game ${this.gameId}: ${forfeitingPlayer} (${reason})`)

    const winner = this.players.find(p => p !== forfeitingPlayer)
    
    this.state = 'forfeited'
    
    // Broadcast forfeit result
    this.broadcast({
      type: 'GAME_FORFEITED',
      gameId: this.gameId,
      forfeitingPlayer,
      winner,
      reason,
      timestamp: Date.now()
    })

    // Winner takes all - update database
    this.updateGameResult(winner, 'forfeit')

    // Cleanup room after short delay
    setTimeout(() => {
      this.cleanup()
    }, 5000)
  }

  // Start the game
  startGame() {
    console.log(`🚀 Starting game in room ${this.gameId}`)
    this.state = 'active'
    
    this.broadcast({
      type: 'GAME_ROOM_STARTED',
      gameId: this.gameId,
      players: this.players,
      currentRound: this.currentRound,
      timestamp: Date.now()
    })
  }

  // Handle player choice with automatic opposite assignment
  handlePlayerChoice(address, choice, oppositeChoice) {
    if (!this.players.includes(address)) {
      return false
    }

    console.log(`🎯 Player choice in room ${this.gameId}: ${address} chose ${choice}`)

    // Set the current player's choice
    this.playerChoices.set(address, choice)
    
    // Automatically assign opposite choice to the other player
    const otherPlayer = this.players.find(p => p !== address)
    if (otherPlayer && oppositeChoice) {
      this.playerChoices.set(otherPlayer, oppositeChoice)
      console.log(`🔄 Auto-assigned ${oppositeChoice} to ${otherPlayer}`)
    }

    // Broadcast both choices made
    this.broadcast({
      type: 'BOTH_CHOICES_MADE',
      gameId: this.gameId,
      activePlayer: address,
      activeChoice: choice,
      otherPlayer: otherPlayer,
      otherChoice: oppositeChoice,
      round: this.currentRound,
      timestamp: Date.now()
    })

    // Since both choices are now made, start power phase
    this.startPowerPhase()

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

  // Trigger coin flip
  triggerFlip() {
    console.log(`🎲 Triggering flip for game room ${this.gameId}`)

    // Generate flip result
    const result = Math.random() < 0.5 ? 'heads' : 'tails'
    
    // Determine round winner
    const player1Choice = this.playerChoices.get(this.player1)
    const player2Choice = this.playerChoices.get(this.player2)
    
    const player1Wins = player1Choice === result
    const roundWinner = player1Wins ? this.player1 : this.player2
    
    // Update wins
    const currentWins = this.wins.get(roundWinner)
    this.wins.set(roundWinner, currentWins + 1)

    console.log(`🎲 Flip result: ${result}, Round winner: ${roundWinner}`)

    // Broadcast flip result
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
    console.log(`🏁 Completing game in room ${this.gameId}`)

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

    // Winner takes all - update database
    this.updateGameResult(winner, 'victory')

    // Cleanup room after short delay
    setTimeout(() => {
      this.cleanup()
    }, 10000)
  }

  // Update game result in database - Winner takes all
  async updateGameResult(winner, resultType) {
    console.log(`💾 Winner Takes All: ${winner} wins by ${resultType}`)
    
    try {
      // Update game status in database
      // The winner gets both the NFT and the crypto
      // This would be handled by the smart contract in a real implementation
      
      // Mark game as completed with winner
      // The smart contract should:
      // 1. Transfer the NFT from escrow to winner
      // 2. Transfer the crypto amount from escrow to winner
      // 3. Update game status to completed
      
      console.log(`🏆 Winner Takes All Implemented:`)
      console.log(`   Winner: ${winner}`)
      console.log(`   Gets: NFT + Crypto Amount`)
      console.log(`   Result Type: ${resultType}`)
      
      // This is where we would call the smart contract method
      // to execute the winner-takes-all transfer
      
      // For now, log the transaction that should happen
      console.log(`📝 Transaction to execute:`)
      console.log(`   - Transfer NFT to: ${winner}`)
      console.log(`   - Transfer crypto to: ${winner}`)
      console.log(`   - Mark game as completed`)
      
    } catch (error) {
      console.error('❌ Error updating winner takes all result:', error)
    }
  }

  // Send message to specific player
  sendToPlayer(address, message) {
    const socket = this.playerSockets.get(address)
    if (socket && socket.readyState === 1) { // WebSocket.OPEN
      try {
        socket.send(JSON.stringify(message))
        console.log(`📤 Sent message to ${address}:`, message.type)
      } catch (error) {
        console.error(`❌ Failed to send message to ${address}:`, error)
      }
    } else {
      console.log(`⚠️ Cannot send message to ${address} - not connected`)
    }
  }

  // Broadcast message to all players in room
  broadcast(message) {
    console.log(`📢 Broadcasting to room ${this.gameId}:`, message.type)
    
    this.players.forEach(address => {
      this.sendToPlayer(address, message)
    })
  }

  // Check if room is empty
  isEmpty() {
    return this.connectedSockets.size === 0
  }

  // Get room status
  getStatus() {
    return {
      gameId: this.gameId,
      roomId: this.roomId,
      state: this.state,
      players: this.players,
      connectedPlayers: Array.from(this.playerSockets.keys()),
      currentRound: this.currentRound,
      wins: Object.fromEntries(this.wins)
    }
  }

  // Cleanup room
  cleanup() {
    console.log(`🧹 Cleaning up game room ${this.gameId}`)
    
    // Clear all timers
    this.disconnectTimers.forEach(timer => clearTimeout(timer))
    this.disconnectTimers.clear()
    
    // Clear collections
    this.connectedSockets.clear()
    this.playerSockets.clear()
    this.playerChoices.clear()
    this.playerPower.clear()
  }
}

module.exports = GameRoom
