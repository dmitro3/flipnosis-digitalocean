const crypto = require('crypto')

class CoinStreamService {
  constructor() {
    this.scenes = new Map() // gameId -> scene data
  }

  renderFrame(gameId, rotation, result = null) {
    // Generate frame data for the coin animation
    // This is a simplified version - you can enhance with actual image processing
    
    const frameData = {
      id: crypto.randomBytes(8).toString('hex'),
      rotation: rotation,
      timestamp: Date.now(),
      result: result,
      // Add any additional frame metadata here
    }
    
    return frameData
  }

  cleanupScene(gameId) {
    this.scenes.delete(gameId)
  }

  // Method to get coin state for a specific game
  getCoinState(gameId) {
    return this.scenes.get(gameId) || {
      rotation: 0,
      result: null,
      flipping: false
    }
  }

  // Method to update coin state
  updateCoinState(gameId, state) {
    this.scenes.set(gameId, {
      ...this.getCoinState(gameId),
      ...state
    })
  }
}

module.exports = CoinStreamService
