const express = require('express')
const http = require('http')
const WebSocket = require('ws')
const cors = require('cors')

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

app.use(cors())
app.use(express.json())

// Game state management
class GameSession {
  constructor(gameId) {
    this.gameId = gameId
    this.creator = null
    this.joiner = null
    this.phase = 'waiting' // waiting, ready, round_active, round_complete, game_complete
    this.currentRound = 1
    this.currentPlayer = null
    this.maxRounds = 0
    this.creatorWins = 0
    this.joinerWins = 0
    this.winner = null
    this.spectators = 0
    this.flipState = {
      creatorPower: 0,
      joinerPower: 0,
      creatorReady: false,
      joinerReady: false,
      flipResult: null,
      roundTimer: 30
    }
    this.clients = new Set()
    this.lastActionTime = Date.now()
    this.roundStartTime = null
  }

  addClient(ws) {
    this.clients.add(ws)
  }

  removeClient(ws) {
    this.clients.delete(ws)
  }

  broadcast(message) {
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message))
      }
    })
  }

  getState() {
    return {
      gameId: this.gameId,
      creator: this.creator,
      joiner: this.joiner,
      phase: this.phase,
      currentRound: this.currentRound,
      currentPlayer: this.currentPlayer,
      maxRounds: this.maxRounds,
      creatorWins: this.creatorWins,
      joinerWins: this.joinerWins,
      winner: this.winner,
      spectators: this.spectators,
      flipState: this.flipState
    }
  }

  setJoiner(address) {
    this.joiner = address
    this.phase = 'ready'
    this.broadcast({ type: 'player_joined', state: this.getState() })
  }

  startGame() {
    console.log('🚀 Starting game')
    this.phase = 'round_active'
    this.currentPlayer = this.creator // Creator goes first
    this.lastActionTime = Date.now()
    this.roundStartTime = Date.now()
    console.log('👤 Current player set to:', this.currentPlayer)
    
    this.broadcast({ 
      type: 'game_started', 
      state: this.getState(),
      currentPlayer: this.currentPlayer
    })
    return true
  }

  updatePower(address, power) {
    if (address === this.creator) {
      this.flipState.creatorPower = power
    } else if (address === this.joiner) {
      this.flipState.joinerPower = power
    }
    
    // Update timer
    if (this.roundStartTime) {
      const elapsed = Math.floor((Date.now() - this.roundStartTime) / 1000)
      this.flipState.roundTimer = Math.max(0, 30 - elapsed)
    }
    
    this.broadcast({ 
      type: 'power_update', 
      state: this.getState(),
      currentPlayer: this.currentPlayer
    })
  }

  lockPower(address) {
    if (address === this.creator) {
      this.flipState.creatorReady = true
    } else if (address === this.joiner) {
      this.flipState.joinerReady = true
    }

    if (this.flipState.creatorReady && this.flipState.joinerReady) {
      this.executeFlip()
    }

    this.broadcast({ type: 'power_locked', state: this.getState() })
  }

  executeFlip() {
    // Simple flip logic - you can enhance this
    const result = Math.random() < 0.5 ? 'heads' : 'tails'
    this.flipState.flipResult = result

    // Update scores (simplified)
    if (result === 'heads') {
      this.creatorWins++
    } else {
      this.joinerWins++
    }

    this.phase = 'round_complete'
    this.broadcast({ type: 'flip_result', state: this.getState() })

    // Check for game completion
    const winsNeeded = Math.ceil(this.maxRounds / 2)
    if (this.creatorWins >= winsNeeded || this.joinerWins >= winsNeeded) {
      this.completeGame()
    } else {
      // Reset for next round
      setTimeout(() => {
        this.nextRound()
      }, 3000)
    }
  }

  switchTurn() {
    this.currentPlayer = this.currentPlayer === this.creator ? this.joiner : this.creator
    this.lastActionTime = Date.now()
    console.log('🔄 Turn switched to:', this.currentPlayer)
    
    this.broadcast({
      type: 'turn_switch',
      state: this.getState(),
      currentPlayer: this.currentPlayer,
      timestamp: this.lastActionTime
    })
  }

  handleFlipComplete(result, player) {
    console.log('🎲 Handling flip from player:', player, 'result:', result)
    
    // Update scores
    if (result === 'heads') {
      this.creatorWins++
    } else {
      this.joinerWins++
    }

    // Switch turns
    this.switchTurn()

    // Check win condition
    const winsNeeded = Math.ceil(this.maxRounds / 2)
    if (this.creatorWins >= winsNeeded || this.joinerWins >= winsNeeded) {
      this.phase = 'game_complete'
      this.winner = this.creatorWins > this.joinerWins ? this.creator : this.joiner
    }

    this.broadcast({
      type: 'flip_complete',
      state: this.getState(),
      result,
      scorer: result === 'heads' ? 'creator' : 'joiner',
      currentPlayer: this.currentPlayer
    })
  }

  nextRound() {
    this.currentRound++
    this.phase = 'round_active'
    this.flipState = {
      creatorPower: 0,
      joinerPower: 0,
      creatorReady: false,
      joinerReady: false,
      flipResult: null,
      roundTimer: 30
    }
    this.lastActionTime = Date.now()
    this.roundStartTime = Date.now()
    this.broadcast({ 
      type: 'round_started', 
      state: this.getState(),
      currentPlayer: this.currentPlayer
    })
  }

  completeGame() {
    this.phase = 'game_complete'
    this.winner = this.creatorWins > this.joinerWins ? this.creator : this.joiner
    this.broadcast({ type: 'game_complete', state: this.getState() })
  }
}

const activeSessions = new Map()

wss.on('connection', (ws) => {
  console.log('New WebSocket connection')
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message)
      handleMessage(ws, data)
    } catch (error) {
      console.error('Error parsing message:', error)
    }
  })
  
  ws.on('close', () => {
    console.log('Client disconnected')
    // Remove from all game sessions
    activeSessions.forEach(session => {
      session.removeClient(ws)
    })
  })
})

function handleMessage(ws, data) {
  const { type, gameId } = data

  let session = activeSessions.get(gameId)
  if (!session && type === 'join_game') {
    session = new GameSession(gameId)
    activeSessions.set(gameId, session)
  }

  if (!session) return

  session.addClient(ws)

  switch (type) {
    case 'join_game':
      if (data.role === 'creator') {
        session.creator = data.address
        session.maxRounds = data.gameConfig?.maxRounds || 5
      } else {
        session.setJoiner(data.address)
      }
      break

    case 'start_game':
      session.startGame()
      break

    case 'charge_power':
      session.updatePower(data.address, data.power)
      break

    case 'lock_power':
      session.lockPower(data.address)
      break

    case 'flip_complete':
      console.log('📡 Received flip_complete from:', data.player)
      if (session && session.currentPlayer === (data.player === 'creator' ? session.creator : session.joiner)) {
        session.handleFlipComplete(data.result, data.player)
      } else {
        console.log('❌ Invalid turn - current player is:', session?.currentPlayer)
      }
      break
  }
}

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`)
}) 