/**
 * Server-side Flip Service for Glass Tube Game
 * Implements commit-reveal mechanics for fair coin flipping
 */

const crypto = require('crypto')

class FlipService {
  constructor() {
    this.pendingFlips = new Map() // flipId -> flipData
    this.flipSessions = new Map() // flipId -> sessionData
  }

  /**
   * Start a new flip session
   * @param {Object} flipRequest - The flip request from client
   * @returns {Object} Response with flipId and commitHash
   */
  async startFlipSession(flipRequest) {
    const {
      gameId,
      playerAddress,
      choice,
      power,
      coinData
    } = flipRequest

    // Validate inputs
    if (!gameId || !playerAddress || !choice || power === undefined) {
      throw new Error('Invalid flip request: missing required fields')
    }

    if (!['heads', 'tails'].includes(choice.toLowerCase())) {
      throw new Error('Invalid choice: must be heads or tails')
    }

    if (power < 0 || power > 100) {
      throw new Error('Invalid power: must be between 0 and 100')
    }

    // Generate cryptographically secure random seed
    const seed = this.generateSecureSeed()
    const commitHash = this.hashSeed(seed)
    const flipId = this.generateFlipId()

    // Store session data
    const sessionData = {
      flipId,
      gameId,
      playerAddress: playerAddress.toLowerCase(),
      choice: choice.toLowerCase(),
      power,
      coinData,
      seed,
      commitHash,
      status: 'in_progress',
      createdAt: Date.now(),
      resolvedAt: null,
      result: null,
      signature: null
    }

    this.flipSessions.set(flipId, sessionData)

    // Calculate animation parameters
    const animationParams = this.calculateAnimationParams(power, coinData)

    console.log(`🎯 Flip session started: ${flipId} for ${playerAddress}`)

    return {
      flipId,
      commitHash,
      animationParams
    }
  }

  /**
   * Resolve a flip session when coin stops
   * @param {string} flipId - The flip session ID
   * @returns {Object} Result with outcome, seed, and signature
   */
  async resolveFlipSession(flipId) {
    const session = this.flipSessions.get(flipId)
    
    if (!session) {
      throw new Error('Flip session not found')
    }

    if (session.status !== 'in_progress') {
      throw new Error('Flip session already resolved')
    }

    // Calculate outcome using server-side logic
    const outcome = this.calculateOutcome(session)
    
    // Generate signature for verification
    const signature = this.signResult(session, outcome)

    // Update session
    session.status = 'resolved'
    session.result = outcome
    session.resolvedAt = Date.now()
    session.signature = signature

    console.log(`🎲 Flip resolved: ${flipId} -> ${outcome}`)

    return {
      flipId,
      gameId: session.gameId,
      result: outcome,
      seed: session.seed,
      signature,
      audit: {
        decidedAt: session.resolvedAt,
        durationMs: session.resolvedAt - session.createdAt
      }
    }
  }

  /**
   * Calculate outcome using server-side physics simulation
   * @param {Object} session - The flip session data
   * @returns {string} 'heads' or 'tails'
   */
  calculateOutcome(session) {
    const { seed, power, choice, coinData } = session

    // Use seed to generate deterministic but unpredictable perturbations
    const perturbations = this.generatePerturbations(seed)
    
    // Apply power and material effects to base physics
    const baseAngularVelocity = this.calculateBaseVelocity(power, coinData)
    
    // Add server-side noise for fairness
    const finalVelocity = baseAngularVelocity + perturbations.velocityNoise
    
    // Simulate coin physics until it stops
    const finalAngle = this.simulateCoinPhysics(finalVelocity, perturbations)
    
    // Determine outcome based on final orientation
    const outcome = this.determineOutcome(finalAngle)
    
    return outcome
  }

  /**
   * Generate cryptographically secure random seed
   * @returns {Buffer} 32-byte random seed
   */
  generateSecureSeed() {
    return crypto.randomBytes(32)
  }

  /**
   * Hash the seed for commit-reveal
   * @param {Buffer} seed - The random seed
   * @returns {string} SHA-256 hash of the seed
   */
  hashSeed(seed) {
    return crypto.createHash('sha256').update(seed).digest('hex')
  }

  /**
   * Generate unique flip ID
   * @returns {string} Unique flip identifier
   */
  generateFlipId() {
    return 'flip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  /**
   * Calculate animation parameters based on power and coin material
   * @param {number} power - Power level (0-100)
   * @param {Object} coinData - Coin material data
   * @returns {Object} Animation parameters
   */
  calculateAnimationParams(power, coinData) {
    const baseDuration = 2000 // 2 seconds base
    const powerMultiplier = 1 + (power / 100) * 1.5 // 1x to 2.5x duration
    
    // Material effects
    const materialMultiplier = this.getMaterialMultiplier(coinData)
    
    return {
      durationMs: Math.round(baseDuration * powerMultiplier * materialMultiplier),
      baseSpeed: 1.0,
      materialSpeedMult: materialMultiplier,
      powerLevel: power
    }
  }

  /**
   * Get material multiplier for different coin types
   * @param {Object} coinData - Coin material data
   * @returns {number} Speed multiplier
   */
  getMaterialMultiplier(coinData) {
    if (!coinData || !coinData.type) return 1.0
    
    const multipliers = {
      'gold': 1.2,
      'silver': 1.0,
      'bronze': 0.8,
      'custom': 1.1
    }
    
    return multipliers[coinData.type] || 1.0
  }

  /**
   * Generate perturbations from seed
   * @param {Buffer} seed - Random seed
   * @returns {Object} Perturbation values
   */
  generatePerturbations(seed) {
    // Use seed to generate deterministic but unbiased noise
    const velocityNoise = (seed[0] - 128) / 128 * 0.05 // ±5% max
    const angleNoise = (seed[1] - 128) / 128 * Math.PI / 8 // ±22.5 degrees max
    
    return {
      velocityNoise,
      angleNoise
    }
  }

  /**
   * Calculate base angular velocity from power and material
   * @param {number} power - Power level (0-100)
   * @param {Object} coinData - Coin material data
   * @returns {number} Base angular velocity
   */
  calculateBaseVelocity(power, coinData) {
    const baseVelocity = 10 + (power / 100) * 20 // 10-30 rotations/sec
    const materialMultiplier = this.getMaterialMultiplier(coinData)
    
    return baseVelocity * materialMultiplier
  }

  /**
   * Simulate coin physics until it stops
   * @param {number} initialVelocity - Starting angular velocity
   * @param {Object} perturbations - Perturbation values
   * @returns {number} Final angle in radians
   */
  simulateCoinPhysics(initialVelocity, perturbations) {
    // Simple physics simulation
    let velocity = initialVelocity
    let angle = 0
    const friction = 0.98 // Deceleration factor
    const threshold = 0.1 // Stop threshold
    
    while (Math.abs(velocity) > threshold) {
      angle += velocity * 0.016 // 60fps simulation
      velocity *= friction
    }
    
    // Add final perturbation
    angle += perturbations.angleNoise
    
    // Normalize to 0-2π range
    return ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  }

  /**
   * Determine outcome from final angle
   * @param {number} angle - Final angle in radians
   * @returns {string} 'heads' or 'tails'
   */
  determineOutcome(angle) {
    // Heads: 0 to π, Tails: π to 2π
    return angle < Math.PI ? 'heads' : 'tails'
  }

  /**
   * Sign the result for verification
   * @param {Object} session - Flip session data
   * @param {string} outcome - The outcome
   * @returns {string} Digital signature
   */
  signResult(session, outcome) {
    // Simple signature (in production, use proper cryptographic signing)
    const data = `${session.flipId}:${outcome}:${session.seed.toString('hex')}`
    return 'sig_' + this.hashSeed(Buffer.from(data))
  }

  /**
   * Verify a flip result
   * @param {string} flipId - Flip session ID
   * @returns {Object} Verification data
   */
  verifyFlipResult(flipId) {
    const session = this.flipSessions.get(flipId)
    
    if (!session) {
      throw new Error('Flip session not found')
    }

    return {
      flipId,
      commitHash: session.commitHash,
      result: session.result,
      seed: session.seed,
      signature: session.signature,
      verified: this.verifySignature(session)
    }
  }

  /**
   * Verify the signature
   * @param {Object} session - Flip session data
   * @returns {boolean} Whether signature is valid
   */
  verifySignature(session) {
    if (!session.result || !session.signature) return false
    
    const expectedSignature = this.signResult(session, session.result)
    return session.signature === expectedSignature
  }

  /**
   * Get flip session data
   * @param {string} flipId - Flip session ID
   * @returns {Object} Session data
   */
  getFlipSession(flipId) {
    return this.flipSessions.get(flipId)
  }

  /**
   * Clean up old sessions
   * @param {number} maxAge - Maximum age in milliseconds
   */
  cleanupOldSessions(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    const now = Date.now()
    
    for (const [flipId, session] of this.flipSessions.entries()) {
      if (now - session.createdAt > maxAge) {
        this.flipSessions.delete(flipId)
        console.log(`🧹 Cleaned up old flip session: ${flipId}`)
      }
    }
  }
}

module.exports = FlipService
