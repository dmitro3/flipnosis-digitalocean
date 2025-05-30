/**
 * Deterministic flip calculation that combines both players' powers with randomness
 * This makes the game fair and prevents gaming the system
 */
export class FlipCalculation {
  /**
   * Calculate flip result using both players' powers and deterministic randomness
   * @param {number} creatorPower - Player 1's power (0-10)
   * @param {number} joinerPower - Player 2's power (0-10) 
   * @param {string} gameId - Game ID for randomness seed
   * @param {number} round - Current round number
   * @param {number} timestamp - Current timestamp
   * @returns {Object} Flip result with rotations and outcome
   */
  static calculateFlip(creatorPower, joinerPower, gameId, round, timestamp) {
    // Normalize powers to 0-10 range
    const normalizedCreatorPower = Math.max(0, Math.min(10, creatorPower))
    const normalizedJoinerPower = Math.max(0, Math.min(10, joinerPower))
    
    // Create deterministic seed
    const seed = this.createSeed(gameId, round, timestamp)
    const random = this.seededRandom(seed)
    
    // Calculate total influence
    const totalPower = normalizedCreatorPower + normalizedJoinerPower
    const powerInfluence = totalPower / 20 // 0-1 range
    
    // Combine power influence with randomness
    const flipValue = (powerInfluence * 0.3) + (random * 0.7)
    const result = flipValue > 0.5 ? 'heads' : 'tails'
    
    // Calculate flip duration (1-5 seconds based on power)
    const flipDuration = 1000 + (totalPower * 400) // 1-5 seconds
    
    return {
      result,
      flipDuration,
      totalPower,
      influence: {
        creator: totalPower > 0 ? (normalizedCreatorPower / totalPower) * 100 : 50,
        joiner: totalPower > 0 ? (normalizedJoinerPower / totalPower) * 100 : 50
      }
    }
  }
  
  /**
   * Create a deterministic seed from game parameters
   * @param {string} gameId 
   * @param {number} round 
   * @param {number} timestamp 
   * @returns {number} Deterministic seed
   */
  static createSeed(gameId, round, timestamp) {
    let hash = 0
    const str = `${gameId}-${round}-${Math.floor(timestamp / 1000)}`
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0xffffffff
    }
    return Math.abs(hash)
  }
  
  /**
   * Seeded random number generator (Linear Congruential Generator)
   * Returns deterministic random number between 0 and 1
   * @param {number} seed 
   * @returns {number} Random number 0-1
   */
  static seededRandom(seed) {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }
  
  /**
   * Validate flip result by recalculating
   * @param {Object} flipResult - Original flip result
   * @param {string} gameId 
   * @param {number} round 
   * @param {number} timestamp 
   * @returns {boolean} Whether result is valid
   */
  static validateFlipResult(flipResult, gameId, round, timestamp) {
    const recalculated = this.calculateFlip(
      flipResult.powerBreakdown.creatorPower,
      flipResult.powerBreakdown.joinerPower,
      gameId,
      round,
      timestamp
    )
    
    return recalculated.result === flipResult.result &&
           recalculated.randomComponents.seed === flipResult.randomComponents.seed
  }
  
  /**
   * Get power influence description
   * @param {number} creatorPower 
   * @param {number} joinerPower 
   * @returns {string} Description of power balance
   */
  static getPowerInfluenceDescription(creatorPower, joinerPower) {
    const totalPower = creatorPower + joinerPower
    
    if (totalPower === 0) return "No power applied - pure randomness!"
    
    const creatorPercentage = (creatorPower / totalPower) * 100
    const joinerPercentage = (joinerPower / totalPower) * 100
    
    if (Math.abs(creatorPercentage - joinerPercentage) < 10) {
      return "Evenly matched powers!"
    } else if (creatorPercentage > joinerPercentage) {
      return `Player 1 dominated with ${creatorPercentage.toFixed(0)}% influence!`
    } else {
      return `Player 2 dominated with ${joinerPercentage.toFixed(0)}% influence!`
    }
  }
  
  /**
   * Calculate win probability based on power difference
   * Note: This is just for display - actual result is still deterministic
   * @param {number} creatorPower 
   * @param {number} joinerPower 
   * @returns {Object} Win probabilities
   */
  static calculateWinProbabilities(creatorPower, joinerPower) {
    const totalPower = creatorPower + joinerPower
    
    if (totalPower === 0) {
      return { creator: 50, joiner: 50 }
    }
    
    // Base probability from power ratio
    const creatorRatio = creatorPower / totalPower
    const joinerRatio = joinerPower / totalPower
    
    // Apply some curve to make it less linear but still fair
    // Higher power gives advantage but doesn't guarantee win
    const creatorAdvantage = Math.pow(creatorRatio, 0.8) * 0.6 + 0.2 // 20-80% range
    const joinerAdvantage = Math.pow(joinerRatio, 0.8) * 0.6 + 0.2 // 20-80% range
    
    // Normalize to 100%
    const total = creatorAdvantage + joinerAdvantage
    const creatorProbability = (creatorAdvantage / total) * 100
    const joinerProbability = (joinerAdvantage / total) * 100
    
    return {
      creator: Math.round(creatorProbability),
      joiner: Math.round(joinerProbability)
    }
  }
}

export default FlipCalculation 