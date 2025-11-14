/**
 * Server-Side Physics Engine for Test Tubes Game
 * Handles deterministic coin flip physics simulation using CANNON.js
 */

const CANNON = require('cannon-es')

class ServerPhysicsEngine {
  constructor() {
    this.world = new CANNON.World()
    this.bodies = new Map() // gameId -> physics bodies
    this.gameStates = new Map() // gameId -> game state
    this.materials = new Map() // material definitions
    
    this.setupWorld()
    this.setupMaterials()
  }

  setupWorld() {
    // Configure physics world
    this.world.gravity.set(0, -9.82, 0) // Earth gravity
    this.world.broadphase = new CANNON.NaiveBroadphase()
    this.world.solver.iterations = 10
    this.world.solver.tolerance = 0.1
    
    // Add ground plane
    const groundShape = new CANNON.Plane()
    const groundBody = new CANNON.Body({ mass: 0 })
    groundBody.addShape(groundShape)
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
    groundBody.position.set(0, 0, 0)
    this.world.addBody(groundBody)
    
    console.log('🌍 Server physics world initialized')
  }

  setupMaterials() {
    // Material definitions matching client-side
    this.materials.set('glass', {
      name: 'Glass',
      speedMultiplier: 1.0,
      durationMultiplier: 1.0,
      friction: 0.3,
      restitution: 0.4
    })
    
    this.materials.set('crystal', {
      name: 'Crystal',
      speedMultiplier: 1.5,
      durationMultiplier: 0.8,
      friction: 0.2,
      restitution: 0.6
    })
    
    this.materials.set('diamond', {
      name: 'Diamond',
      speedMultiplier: 2.0,
      durationMultiplier: 0.6,
      friction: 0.1,
      restitution: 0.8
    })
    
    this.materials.set('emerald', {
      name: 'Emerald',
      speedMultiplier: 1.8,
      durationMultiplier: 0.7,
      friction: 0.15,
      restitution: 0.7
    })
    
    console.log('💎 Physics materials configured')
  }

  // Initialize game physics
  initializeGamePhysics(gameId, gameData) {
    const gameBodies = {
      tubes: [],
      coins: []
      // liquidParticles removed - client-side visual only
    }

    // Create tube physics bodies (4 tubes)
    for (let i = 0; i < 4; i++) {
      const tubeX = -150 + (i * 100) // Position tubes left to right
      
      // Glass tube body
      const tubeShape = new CANNON.Cylinder(25, 25, 200, 8) // radius, height
      const tubeBody = new CANNON.Body({ mass: 0 }) // Static body
      tubeBody.addShape(tubeShape)
      tubeBody.position.set(tubeX, 100, 0)
      this.world.addBody(tubeBody)
      
      // Coin body (dynamic)
      const coinShape = new CANNON.Cylinder(15, 15, 2, 8) // Thin coin
      const coinBody = new CANNON.Body({ mass: 0.1 })
      coinBody.addShape(coinShape)
      coinBody.position.set(tubeX, 200, 0) // Start at top of tube
      coinBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2) // Lay flat
      this.world.addBody(coinBody)
      
      // Liquid particles removed - client-side visual only for performance
      
      gameBodies.tubes.push(tubeBody)
      gameBodies.coins.push(coinBody)
    }

    this.bodies.set(gameId, gameBodies)
    
    // Initialize game state
    this.gameStates.set(gameId, {
      phase: 'waiting',
      currentRound: 0,
      players: {},
      coinStates: new Array(4).fill({
        isFlipping: false,
        result: null,
        flipStartTime: null,
        power: 0,
        angle: 0
      })
    })
    
    console.log(`🎮 Physics initialized for game ${gameId}`)
    return true
  }

  // Simulate coin flip with deterministic physics
  simulateCoinFlip(gameId, playerIndex, choice, power, angle = 0, accuracy = 'normal') {
    const perfStart = Date.now();
    const gameBodies = this.bodies.get(gameId)
    const gameState = this.gameStates.get(gameId)

    if (!gameBodies || !gameState) {
      console.warn(`❌ Game ${gameId} physics not initialized`)
      return null
    }

    if (playerIndex < 0 || playerIndex >= 4) {
      console.warn(`❌ Invalid player index: ${playerIndex}`)
      return null
    }

    const coin = gameBodies.coins[playerIndex]
    const coinState = gameState.coinStates[playerIndex]

    if (coinState.isFlipping) {
      console.warn(`❌ Coin ${playerIndex} already flipping`)
      return null
    }

    // Get material properties (default to glass)
    const material = this.materials.get('glass')
    const powerPercent = power / 100

    // Calculate physics parameters
    const baseDuration = 2000 + (powerPercent * 6000)
    const flipDuration = baseDuration * material.durationMultiplier
    const basePowerSpeed = Math.max(0.08, 0.05 + (powerPercent * 0.25))
    const flipSpeed = basePowerSpeed * material.speedMultiplier

    // Apply initial forces to coin
    const beforeImpulse = Date.now();
    const forceMagnitude = power * 0.5 // Scale force with power
    const forceX = Math.cos(angle) * forceMagnitude
    const forceY = Math.sin(angle) * forceMagnitude + power * 2 // Upward force

    coin.applyImpulse(new CANNON.Vec3(forceX, forceY, 0))

    // Apply angular velocity for spinning
    const spinForce = flipSpeed * 100 // Convert to angular velocity
    coin.angularVelocity.set(spinForce, 0, 0)
    const afterImpulse = Date.now();
    console.log(`⏱️ applyImpulse + angularVelocity took ${afterImpulse - beforeImpulse}ms`);
    
    // Update coin state
    coinState.isFlipping = true
    coinState.flipStartTime = Date.now()
    coinState.power = power
    coinState.angle = angle
    coinState.accuracy = accuracy
    coinState.result = null
    
    console.log(`🪙 Simulating coin flip for player ${playerIndex}: power=${power}, duration=${flipDuration.toFixed(0)}ms`)
    
    // Start simulation
    const startTime = Date.now()
    const simulate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / flipDuration, 1)
      
      // Run physics step
      this.world.step(1/60) // 60 FPS
      
      if (progress < 1) {
        // Continue simulation
        setTimeout(simulate, 16) // ~60 FPS
      } else {
        // Simulation complete - determine result
        this.finishCoinFlip(gameId, playerIndex, choice)
      }
    }
    
    // Start simulation
    setTimeout(simulate, 16)

    const totalSimTime = Date.now() - perfStart;
    console.log(`⏱️ Total simulateCoinFlip took ${totalSimTime}ms`);

    return {
      success: true,
      duration: flipDuration,
      power: power,
      angle: angle
    }
  }

  // Finish coin flip and determine result
  finishCoinFlip(gameId, playerIndex, choice) {
    const gameState = this.gameStates.get(gameId)
    const gameBodies = this.bodies.get(gameId)
    
    if (!gameState || !gameBodies) return
    
    const coin = gameBodies.coins[playerIndex]
    const coinState = gameState.coinStates[playerIndex]
    
    // Get final coin orientation
    const rotationX = coin.quaternion.x
    const rotationY = coin.quaternion.y
    const rotationZ = coin.quaternion.z
    const rotationW = coin.quaternion.w
    
    // Convert quaternion to Euler angles
    const euler = new CANNON.Vec3()
    // Simplified: use rotation around X axis to determine heads/tails
    // This is a simplified heuristic - in reality you'd need more complex logic
    
    // Use accuracy-based win chances with deterministic seed
    const seed = this.generateSeed(gameId, playerIndex, coinState.flipStartTime)
    const randomValue = this.seededRandom(seed)
    
    // Map accuracy to win probability
    const winChanceMap = {
      'perfect': 0.55,   // Sweet spot: +5% edge
      'good': 0.525,     // Good timing: +2.5% edge
      'normal': 0.50     // Standard: fair 50/50
    }
    
    const winChance = winChanceMap[coinState.accuracy] || 0.50
    
    // Weighted random roll
    const playerWins = randomValue < winChance
    const result = playerWins ? choice : (choice === 'heads' ? 'tails' : 'heads')
    const won = playerWins
    
    console.log(`🎲 Player ${playerIndex}: chose ${choice}, accuracy: ${coinState.accuracy} (${(winChance*100).toFixed(1)}% chance), rolled: ${randomValue.toFixed(3)}, result: ${result}, won: ${won}`)
    
    // Update coin state
    coinState.isFlipping = false
    coinState.result = result
    coinState.won = won
    
    // Reset coin position for next round
    const tubeX = -150 + (playerIndex * 100)
    coin.position.set(tubeX, 200, 0)
    coin.quaternion.set(0, 0, 0, 1)
    coin.velocity.set(0, 0, 0)
    coin.angularVelocity.set(0, 0, 0)
    
    console.log(`🪙 Coin ${playerIndex} finished: ${result} (chose ${choice}) - ${won ? 'WON' : 'LOST'}`)
    
    return {
      result: result,
      won: won,
      finalPosition: {
        x: coin.position.x,
        y: coin.position.y,
        z: coin.position.z
      },
      finalRotation: {
        x: rotationX,
        y: rotationY,
        z: rotationZ,
        w: rotationW
      }
    }
  }

  // Generate deterministic seed for fair randomness
  generateSeed(gameId, playerIndex, timestamp) {
    const seedString = `${gameId}_${playerIndex}_${timestamp}_${Date.now()}`
    let hash = 0
    for (let i = 0; i < seedString.length; i++) {
      const char = seedString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  // Seeded random number generator (0-1)
  seededRandom(seed) {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }

  // Update player choice
  updatePlayerChoice(gameId, playerIndex, choice) {
    const gameState = this.gameStates.get(gameId)
    if (!gameState) return false
    
    if (!gameState.players[playerIndex]) {
      gameState.players[playerIndex] = {}
    }
    
    gameState.players[playerIndex].choice = choice
    console.log(`🎯 Player ${playerIndex} chose ${choice} in game ${gameId}`)
    return true
  }

  // Get current physics state
  getPhysicsState(gameId) {
    const gameBodies = this.bodies.get(gameId)
    const gameState = this.gameStates.get(gameId)
    
    if (!gameBodies || !gameState) return null
    
    const coinStates = gameBodies.coins.map((coin, index) => {
      const isFlipping = gameState.coinStates[index].isFlipping
      
      // Only send position/rotation updates when NOT flipping
      // During flip, client handles animation locally
      if (isFlipping) {
        return {
          index: index,
          position: { x: coin.position.x, y: 200, z: 0 }, // Keep centered
          rotation: null, // Don't send rotation during flip - prevents conflict
          velocity: null,
          angularVelocity: null,
          isFlipping: true,
          result: gameState.coinStates[index].result
        }
      }
      
      // When not flipping, send full state
      return {
        index: index,
        position: {
          x: coin.position.x,
          y: coin.position.y,
          z: coin.position.z
        },
        rotation: {
          x: coin.quaternion.x,
          y: coin.quaternion.y,
          z: coin.quaternion.z,
          w: coin.quaternion.w
        },
        velocity: {
          x: coin.velocity.x,
          y: coin.velocity.y,
          z: coin.velocity.z
        },
        angularVelocity: {
          x: coin.angularVelocity.x,
          y: coin.angularVelocity.y,
          z: coin.angularVelocity.z
        },
        isFlipping: false,
        result: gameState.coinStates[index].result
      }
    })
    
    return {
      gameId: gameId,
      coinStates: coinStates,
      players: gameState.players,
      phase: gameState.phase,
      currentRound: gameState.currentRound
    }
  }

  // Update game phase
  updateGamePhase(gameId, phase) {
    const gameState = this.gameStates.get(gameId)
    if (!gameState) return false
    
    gameState.phase = phase
    if (phase === 'round_active') {
      gameState.currentRound++
    }
    
    console.log(`🎮 Game ${gameId} phase updated to ${phase}`)
    return true
  }

  // Reset game for new round
  resetGameForNewRound(gameId) {
    const gameBodies = this.bodies.get(gameId)
    const gameState = this.gameStates.get(gameId)
    
    if (!gameBodies || !gameState) return false
    
    // Reset all coins to starting positions
    gameBodies.coins.forEach((coin, index) => {
      const tubeX = -150 + (index * 100)
      coin.position.set(tubeX, 200, 0)
      coin.quaternion.set(0, 0, 0, 1)
      coin.velocity.set(0, 0, 0)
      coin.angularVelocity.set(0, 0, 0)
    })
    
    // Reset coin states
    gameState.coinStates = gameState.coinStates.map(() => ({
      isFlipping: false,
      result: null,
      flipStartTime: null,
      power: 0,
      angle: 0
    }))
    
    // Reset player choices
    Object.values(gameState.players).forEach(player => {
      player.choice = null
      player.hasFired = false
    })
    
    console.log(`🔄 Game ${gameId} reset for new round`)
    return true
  }

  // Cleanup game physics
  cleanupGamePhysics(gameId) {
    const gameBodies = this.bodies.get(gameId)
    
    if (gameBodies) {
      // Remove all bodies from world
      [...gameBodies.tubes, ...gameBodies.coins].forEach(body => {
        this.world.removeBody(body)
      })
      
      this.bodies.delete(gameId)
    }
    
    this.gameStates.delete(gameId)
    console.log(`🧹 Physics cleanup completed for game ${gameId}`)
  }

  // Get material by name
  getMaterial(materialName) {
    return this.materials.get(materialName) || this.materials.get('glass')
  }

  // Update material for a game
  updateGameMaterial(gameId, materialName) {
    const material = this.getMaterial(materialName)
    if (!material) return false
    
    // Store material preference for this game
    const gameState = this.gameStates.get(gameId)
    if (gameState) {
      gameState.material = material
      console.log(`💎 Game ${gameId} material updated to ${material.name}`)
      return true
    }
    
    return false
  }
}

module.exports = ServerPhysicsEngine
