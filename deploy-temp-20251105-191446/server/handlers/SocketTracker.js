// SocketTracker.js - Robust socket tracking for Battle Royale games
// Tracks which sockets belong to which games for reliable broadcasting

class SocketTracker {
  constructor() {
    // gameId -> Set of socketIds
    this.gameSockets = new Map()
    
    // socketId -> { gameId, address }
    this.socketInfo = new Map()
  }

  // Add a socket to a game
  addSocketToGame(gameId, socketId, address) {
    console.log(`📌 Tracking socket ${socketId} for game ${gameId} (${address})`)
    
    // Add to game's socket set
    if (!this.gameSockets.has(gameId)) {
      this.gameSockets.set(gameId, new Set())
    }
    this.gameSockets.get(gameId).add(socketId)
    
    // Store socket info
    this.socketInfo.set(socketId, { gameId, address })
    
    console.log(`📊 Game ${gameId} now has ${this.gameSockets.get(gameId).size} sockets`)
  }

  // Remove a socket from a game
  removeSocketFromGame(gameId, socketId) {
    console.log(`🗑️ Removing socket ${socketId} from game ${gameId}`)
    
    const gameSockets = this.gameSockets.get(gameId)
    if (gameSockets) {
      gameSockets.delete(socketId)
      
      // Clean up empty game entries
      if (gameSockets.size === 0) {
        this.gameSockets.delete(gameId)
        console.log(`🧹 Removed empty game ${gameId} from tracker`)
      }
    }
    
    this.socketInfo.delete(socketId)
  }

  // Remove a socket from ALL games (on disconnect)
  removeSocket(socketId) {
    const info = this.socketInfo.get(socketId)
    if (info) {
      console.log(`🔌 Removing disconnected socket ${socketId} from game ${info.gameId}`)
      this.removeSocketFromGame(info.gameId, socketId)
    }
  }

  // Get all sockets for a game
  getGameSockets(gameId) {
    return this.gameSockets.get(gameId)
  }

  // Get socket info
  getSocketInfo(socketId) {
    return this.socketInfo.get(socketId)
  }

  // Get all tracked games
  getAllGames() {
    return Array.from(this.gameSockets.keys())
  }

  // Get stats for debugging
  getStats() {
    return {
      totalGames: this.gameSockets.size,
      totalSockets: this.socketInfo.size,
      games: Array.from(this.gameSockets.entries()).map(([gameId, sockets]) => ({
        gameId,
        socketCount: sockets.size,
        socketIds: Array.from(sockets)
      }))
    }
  }
}

module.exports = SocketTracker

