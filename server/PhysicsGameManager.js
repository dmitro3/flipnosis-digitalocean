const CANNON = require('cannon-es')

class PhysicsGameManager {
  constructor() {
    this.games = new Map()
    this.worlds = new Map()
  }

  PHASES = {
    LOBBY: 'lobby',
    GAME_STARTING: 'game_starting',
    PLAYER_TURN: 'player_turn',
    COIN_FLYING: 'coin_flying',
    COIN_LANDING: 'coin_landing',
    TURN_RESULT: 'turn_result',
    GAME_OVER: 'game_over'
  }

  createPhysicsGame(gameId, gameData) {
    console.log(`🎮 Creating Physics Battle Royale: ${gameId}`)
    const world = new CANNON.World()
    world.gravity.set(0, -20, 0)
    world.broadphase = new CANNON.NaiveBroadphase()
    world.solver.iterations = 10

    const groundBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      position: new CANNON.Vec3(0, -10, 0)
    })
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
    world.addBody(groundBody)

    const game = {
      gameId,
      phase: this.PHASES.LOBBY,
      maxPlayers: 2,
      currentPlayers: 0,
      entryFee: gameData.entry_fee || 5.00,
      serviceFee: gameData.service_fee || 0.50,
      creator: gameData.creator,
      players: {},
      playerOrder: [],
      currentTurnIndex: 0,
      currentTurnPlayer: null,
      turnTimer: 30,
      activeCoin: null,
      obstacles: [],
      nftContract: gameData.nft_contract,
      nftTokenId: gameData.nft_token_id,
      nftName: gameData.nft_name,
      nftImage: gameData.nft_image,
      nftCollection: gameData.nft_collection,
      winner: null,
      createdAt: new Date().toISOString()
    }

    // Restore obstacles from game_data if available, otherwise create new ones
    let obstaclesData = null
    if (gameData.game_data) {
      try {
        const parsedGameData = typeof gameData.game_data === 'string' 
          ? JSON.parse(gameData.game_data) 
          : gameData.game_data
        obstaclesData = parsedGameData.obstacles
      } catch (error) {
        console.error('❌ Error parsing game_data:', error)
      }
    }

    if (obstaclesData && obstaclesData.length > 0) {
      console.log(`📦 Restoring ${obstaclesData.length} obstacles from database`)
      game.obstacles = obstaclesData
      // Recreate physics bodies from obstacle data
      obstaclesData.forEach(obstacle => {
        const obstacleBody = new CANNON.Body({
          mass: 0,
          shape: new CANNON.Sphere(obstacle.radius),
          position: new CANNON.Vec3(obstacle.position.x, obstacle.position.y, obstacle.position.z),
          material: new CANNON.Material({ friction: 0.3, restitution: 0.7 })
        })
        world.addBody(obstacleBody)
      })
    } else {
      console.log(`🆕 Creating new obstacles`)
      game.obstacles = this.createObstacles(world)
    }

    this.games.set(gameId, game)
    this.worlds.set(gameId, world)

    if (gameData.creator) {
      this.addPlayer(gameId, gameData.creator)
    }

    return game
  }

  createObstacles(world) {
    const obstacles = []
    
    // Create 20 obstacles matching your 20 images
    for (let i = 0; i < 20; i++) {
      // Varied sizes - mix of small, medium, large
      let radius
      if (i < 8) {
        radius = 1.5 + Math.random() * 1.5 // Small: 1.5-3
      } else if (i < 16) {
        radius = 3 + Math.random() * 2 // Medium: 3-5
      } else {
        radius = 5 + Math.random() * 3 // Large: 5-8
      }
      
      // Spread obstacles across the space
      const x = (Math.random() - 0.5) * 50 // -25 to 25
      const y = 15 + Math.random() * 70 // Height from 15 to 85 (tall space)
      const z = (Math.random() - 0.5) * 50 // -25 to 25
      
      const obstacleBody = new CANNON.Body({
        mass: 0, // Static obstacles
        shape: new CANNON.Sphere(radius),
        position: new CANNON.Vec3(x, y, z),
        material: new CANNON.Material({ friction: 0.3, restitution: 0.7 })
      })
      
      world.addBody(obstacleBody)
      
      obstacles.push({
        id: `obstacle_${i}`,
        type: 'sphere',
        radius,
        position: { x, y, z },
        textureIndex: i + 1 // Maps to 1.png, 2.png, etc.
      })
    }
    
    return obstacles
  }

  addPlayer(gameId, playerAddress) {
    const game = this.games.get(gameId)
    if (!game || game.currentPlayers >= game.maxPlayers) return false

    const normalizedAddress = playerAddress.toLowerCase()
    if (game.players[normalizedAddress]) return false

    game.players[normalizedAddress] = {
      address: playerAddress,
      lives: 3,
      isActive: true,
      choice: null,
      coin: { id: 'plain', type: 'default', name: 'Classic', headsImage: '/coins/plainh.png', tailsImage: '/coins/plaint.png' },
      cannonPosition: { x: (game.currentPlayers - 0.5) * 10, y: 0, z: 0 },
      joinedAt: new Date().toISOString()
    }
    game.playerOrder.push(normalizedAddress)
    game.currentPlayers++
    console.log(`✅ Player joined: ${playerAddress} (${game.currentPlayers}/${game.maxPlayers})`)
    return true
  }

  startGame(gameId, broadcastFn) {
    const game = this.games.get(gameId)
    if (!game || game.currentPlayers < 2) return false
    console.log(`🚀 Starting physics game: ${gameId}`)
    game.phase = this.PHASES.GAME_STARTING
    broadcastFn(`game_${gameId}`, 'physics_game_starting', { gameId, countdown: 3 })
    setTimeout(() => { this.startNextTurn(gameId, broadcastFn) }, 3000)
    return true
  }

  startNextTurn(gameId, broadcastFn) {
    const game = this.games.get(gameId)
    if (!game) return false
    const activePlayers = Object.values(game.players).filter(p => p.isActive)
    if (activePlayers.length <= 1) { return this.endGame(gameId, broadcastFn) }
    let attempts = 0
    while (attempts < game.playerOrder.length) {
      const playerAddr = game.playerOrder[game.currentTurnIndex]
      const player = game.players[playerAddr]
      if (player && player.isActive) {
        game.currentTurnPlayer = playerAddr
        game.phase = this.PHASES.PLAYER_TURN
        game.turnTimer = 30
        player.choice = null
        console.log(`🎯 Turn started for: ${playerAddr}`)
        broadcastFn(`game_${gameId}`, 'physics_turn_start', { gameId, playerAddress: playerAddr, timeLimit: 30 })
        this.broadcastState(gameId, broadcastFn)
        const timerInterval = setInterval(() => {
          game.turnTimer--
          if (game.turnTimer <= 0) {
            clearInterval(timerInterval)
            this.fireCoin(gameId, playerAddr, 0, 5, broadcastFn)
          } else {
            this.broadcastState(gameId, broadcastFn)
          }
        }, 1000)
        return true
      }
      game.currentTurnIndex = (game.currentTurnIndex + 1) % game.playerOrder.length
      attempts++
    }
    return this.endGame(gameId, broadcastFn)
  }

  setChoice(gameId, playerAddress, choice) {
    const game = this.games.get(gameId)
    if (!game || game.phase !== this.PHASES.PLAYER_TURN) return false
    const normalizedAddress = playerAddress.toLowerCase()
    if (normalizedAddress !== game.currentTurnPlayer) return false
    const player = game.players[normalizedAddress]
    if (!player) return false
    player.choice = choice
    console.log(`✅ ${playerAddress} chose ${choice}`)
    return true
  }

  fireCoin(gameId, playerAddress, angle, power, broadcastFn) {
    const game = this.games.get(gameId)
    const world = this.worlds.get(gameId)
    if (!game || !world || game.phase !== this.PHASES.PLAYER_TURN) return false
    const normalizedAddress = playerAddress.toLowerCase()
    if (normalizedAddress !== game.currentTurnPlayer) return false
    const player = game.players[normalizedAddress]
    if (!player || !player.choice) return false
    console.log(`🚀 ${playerAddress} firing coin: angle=${angle}, power=${power}`)
    game.phase = this.PHASES.COIN_FLYING
    const coinRadius = 1.5
    const coinThickness = 0.2
    const coinShape = new CANNON.Cylinder(coinRadius, coinRadius, coinThickness, 32)
    const coinBody = new CANNON.Body({
      mass: 1,
      shape: coinShape,
      position: new CANNON.Vec3(player.cannonPosition.x, player.cannonPosition.y + 2, player.cannonPosition.z),
      material: new CANNON.Material({ friction: 0.3, restitution: 0.8 })
    })
    const powerScale = power * 2
    const angleRad = (angle * Math.PI) / 180
    coinBody.velocity.set(Math.sin(angleRad) * powerScale * 0.3, powerScale, 0)
    coinBody.angularVelocity.set(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5)
    world.addBody(coinBody)
    game.activeCoin = { body: coinBody, playerAddress: normalizedAddress, startTime: Date.now(), lastBroadcast: 0 }
    broadcastFn(`game_${gameId}`, 'physics_coin_fired', { gameId, playerAddress, angle, power })
    this.startPhysicsLoop(gameId, broadcastFn)
    return true
  }

  startPhysicsLoop(gameId, broadcastFn) {
    const game = this.games.get(gameId)
    const world = this.worlds.get(gameId)
    if (!game || !world) return
    const fixedTimeStep = 1 / 60
    let lastTime = Date.now()
    const simulationLoop = () => {
      if (game.phase !== this.PHASES.COIN_FLYING) { return }
      const currentTime = Date.now()
      const deltaTime = (currentTime - lastTime) / 1000
      lastTime = currentTime
      world.step(fixedTimeStep, deltaTime, 3)
      if (!game.activeCoin) return
      const coinBody = game.activeCoin.body
      if (currentTime - game.activeCoin.lastBroadcast > 50) {
        broadcastFn(`game_${gameId}`, 'physics_coin_position', {
          gameId,
          position: { x: coinBody.position.x, y: coinBody.position.y, z: coinBody.position.z },
          rotation: { x: coinBody.quaternion.x, y: coinBody.quaternion.y, z: coinBody.quaternion.z, w: coinBody.quaternion.w },
          velocity: { x: coinBody.velocity.x, y: coinBody.velocity.y, z: coinBody.velocity.z }
        })
        game.activeCoin.lastBroadcast = currentTime
      }
      const velocity = Math.sqrt(coinBody.velocity.x ** 2 + coinBody.velocity.y ** 2 + coinBody.velocity.z ** 2)
      if (velocity < 0.5 && coinBody.position.y < 5) {
        this.handleCoinLanded(gameId, broadcastFn)
        return
      }
      if (currentTime - game.activeCoin.startTime > 10000) {
        this.handleCoinLanded(gameId, broadcastFn)
        return
      }
      setTimeout(simulationLoop, 16)
    }
    simulationLoop()
  }

  handleCoinLanded(gameId, broadcastFn) {
    const game = this.games.get(gameId)
    const world = this.worlds.get(gameId)
    if (!game || !game.activeCoin) return
    console.log(`🎯 Coin landed in game ${gameId}`)
    game.phase = this.PHASES.COIN_LANDING
    const coinBody = game.activeCoin.body
    const playerAddress = game.activeCoin.playerAddress
    const player = game.players[playerAddress]
    const result = this.determineCoinFace(coinBody.quaternion)
    world.removeBody(coinBody)
    console.log(`🎲 Result: ${result}, Player chose: ${player.choice}`)
    const won = result === player.choice
    if (!won) {
      player.lives--
      if (player.lives <= 0) { player.isActive = false }
    }
    player.lastResult = { won, result }
    broadcastFn(`game_${gameId}`, 'physics_coin_landed', { gameId, playerAddress, result, won, livesRemaining: player.lives, eliminated: !player.isActive })
    this.broadcastState(gameId, broadcastFn)
    game.activeCoin = null
    setTimeout(() => {
      game.currentTurnIndex = (game.currentTurnIndex + 1) % game.playerOrder.length
      this.startNextTurn(gameId, broadcastFn)
    }, 3000)
  }

  determineCoinFace(quaternion) {
    const upVector = new CANNON.Vec3(0, 1, 0)
    quaternion.vmult(upVector, upVector)
    return upVector.y > 0 ? 'heads' : 'tails'
  }

  endGame(gameId, broadcastFn) {
    const game = this.games.get(gameId)
    if (!game) return false
    game.phase = this.PHASES.GAME_OVER
    const activePlayers = Object.values(game.players).filter(p => p.isActive)
    game.winner = activePlayers.length > 0 ? activePlayers[0].address : null
    console.log(`🏆 Game over: ${game.winner || 'No winner'}`)
    broadcastFn(`game_${gameId}`, 'physics_game_over', { gameId, winner: game.winner })
    this.broadcastState(gameId, broadcastFn)
    return true
  }

  updatePlayerCoin(gameId, playerAddress, coinData) {
    const game = this.games.get(gameId)
    if (!game) return false
    const normalizedAddress = playerAddress.toLowerCase()
    const player = game.players[normalizedAddress]
    if (!player) return false
    player.coin = coinData
    console.log(`✅ Coin updated for ${playerAddress}`)
    return true
  }

  getGame(gameId) { return this.games.get(gameId) }

  getFullGameState(gameId) {
    const game = this.games.get(gameId)
    if (!game) return null
    return {
      gameId: game.gameId,
      phase: game.phase,
      maxPlayers: game.maxPlayers,
      currentPlayers: game.currentPlayers,
      entryFee: game.entryFee,
      serviceFee: game.serviceFee,
      creator: game.creator,
      players: game.players,
      playerOrder: game.playerOrder,
      currentTurnPlayer: game.currentTurnPlayer,
      turnTimer: game.turnTimer,
      obstacles: game.obstacles,
      nftName: game.nftName,
      nftImage: game.nftImage,
      nftCollection: game.nftCollection,
      nftContract: game.nftContract,
      nftTokenId: game.nftTokenId,
      winner: game.winner
    }
  }

  broadcastState(gameId, broadcastFn) {
    const state = this.getFullGameState(gameId)
    if (state) { broadcastFn(`game_${gameId}`, 'physics_state_update', state) }
  }

  removeGame(gameId) {
    const world = this.worlds.get(gameId)
    if (world) {
      world.bodies.forEach(body => world.removeBody(body))
      this.worlds.delete(gameId)
    }
    this.games.delete(gameId)
    console.log(`🗑️ Physics game removed: ${gameId}`)
  }
}

module.exports = PhysicsGameManager


