const CANNON = require('cannon-es')

class PhysicsGameManager {
  constructor() {
    this.games = new Map()
    this.worlds = new Map()
  }

  PHASES = {
    LOBBY: 'lobby',
    GAME_STARTING: 'game_starting',
    ROUND_ACTIVE: 'round_active',
    ROUND_RESULTS: 'round_results',
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
      maxPlayers: 6,
      currentPlayers: 0,
      entryFee: gameData.entry_fee || 5.00,
      serviceFee: gameData.service_fee || 0.50,
      creator: gameData.creator,
      players: {},
      playerOrder: [],
      currentRound: 0,
      roundTimer: 30,
      roundStartTime: null,
      activeCoins: new Map(), // Multiple coins flying simultaneously
      obstacles: [],
      nftContract: gameData.nft_contract,
      nftTokenId: gameData.nft_token_id,
      nftName: gameData.nft_name,
      nftImage: gameData.nft_image,
      nftCollection: gameData.nft_collection,
      winner: null,
      createdAt: new Date().toISOString()
    }

    // Restore or create obstacles
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
    
    for (let i = 0; i < 20; i++) {
      let radius
      if (i < 8) {
        radius = 1.5 + Math.random() * 1.5
      } else if (i < 16) {
        radius = 3 + Math.random() * 2
      } else {
        radius = 5 + Math.random() * 3
      }
      
      const x = (Math.random() - 0.5) * 50
      const y = 15 + Math.random() * 70
      const z = (Math.random() - 0.5) * 50
      
      const obstacleBody = new CANNON.Body({
        mass: 0,
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
        textureIndex: i + 1
      })
    }
    
    return obstacles
  }

  addPlayer(gameId, playerAddress) {
    const game = this.games.get(gameId)
    if (!game || game.currentPlayers >= game.maxPlayers) return false

    const normalizedAddress = playerAddress.toLowerCase()
    if (game.players[normalizedAddress]) return false

    // Position players in a circle
    const angle = (game.currentPlayers / game.maxPlayers) * Math.PI * 2
    const radius = 15
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius

    game.players[normalizedAddress] = {
      address: playerAddress,
      lives: 3,
      isActive: true,
      choice: null,
      hasFired: false,
      coin: { id: 'plain', type: 'default', name: 'Classic', headsImage: '/coins/plainh.png', tailsImage: '/coins/plaint.png' },
      cannonPosition: { x, y: 0, z },
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
    setTimeout(() => { this.startRound(gameId, broadcastFn) }, 3000)
    return true
  }

  startRound(gameId, broadcastFn) {
    const game = this.games.get(gameId)
    if (!game) return false

    const activePlayers = Object.values(game.players).filter(p => p.isActive)
    if (activePlayers.length <= 1) {
      return this.endGame(gameId, broadcastFn)
    }

    game.currentRound++
    game.phase = this.PHASES.ROUND_ACTIVE
    game.roundTimer = 30
    game.roundStartTime = Date.now()
    game.activeCoins.clear()

    // Reset player states for new round
    game.playerOrder.forEach(addr => {
      const player = game.players[addr]
      if (player && player.isActive) {
        player.choice = null
        player.hasFired = false
      }
    })

    console.log(`🎯 Round ${game.currentRound} started - ALL PLAYERS GO SIMULTANEOUSLY`)

    broadcastFn(`game_${gameId}`, 'physics_round_start', {
      gameId,
      round: game.currentRound,
      timeLimit: 30
    })

    this.broadcastState(gameId, broadcastFn)

    // Round timer
    const timerInterval = setInterval(() => {
      game.roundTimer--
      
      if (game.roundTimer <= 0) {
        clearInterval(timerInterval)
        this.endRound(gameId, broadcastFn)
      } else {
        this.broadcastState(gameId, broadcastFn)
      }
    }, 1000)

    game.timerInterval = timerInterval
  }

  setChoice(gameId, playerAddress, choice) {
    const game = this.games.get(gameId)
    if (!game || game.phase !== this.PHASES.ROUND_ACTIVE) return false
    
    const normalizedAddress = playerAddress.toLowerCase()
    const player = game.players[normalizedAddress]
    if (!player || !player.isActive || player.hasFired) return false

    player.choice = choice
    console.log(`✅ ${playerAddress} chose ${choice}`)
    return true
  }

  fireCoin(gameId, playerAddress, angle, power, broadcastFn) {
    const game = this.games.get(gameId)
    const world = this.worlds.get(gameId)
    if (!game || !world || game.phase !== this.PHASES.ROUND_ACTIVE) return false
    
    const normalizedAddress = playerAddress.toLowerCase()
    const player = game.players[normalizedAddress]
    if (!player || !player.isActive || player.hasFired || !player.choice) return false

    console.log(`🚀 ${playerAddress} firing coin: angle=${angle}, power=${power}`)
    
    player.hasFired = true

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

    game.activeCoins.set(normalizedAddress, {
      body: coinBody,
      playerAddress: normalizedAddress,
      startTime: Date.now(),
      lastBroadcast: 0,
      landed: false
    })

    broadcastFn(`game_${gameId}`, 'physics_coin_fired', { gameId, playerAddress, angle, power })

    // Start physics loop if not already running
    if (!game.physicsLoopRunning) {
      this.startPhysicsLoop(gameId, broadcastFn)
    }

    return true
  }

  startPhysicsLoop(gameId, broadcastFn) {
    const game = this.games.get(gameId)
    const world = this.worlds.get(gameId)
    if (!game || !world) return

    game.physicsLoopRunning = true

    const fixedTimeStep = 1 / 60
    let lastTime = Date.now()

    const simulationLoop = () => {
      if (game.phase !== this.PHASES.ROUND_ACTIVE || game.activeCoins.size === 0) {
        game.physicsLoopRunning = false
        return
      }

      const currentTime = Date.now()
      const deltaTime = (currentTime - lastTime) / 1000
      lastTime = currentTime

      world.step(fixedTimeStep, deltaTime, 3)

      // Broadcast all active coin positions
      game.activeCoins.forEach((coinData, playerAddr) => {
        if (coinData.landed) return

        const coinBody = coinData.body

        if (currentTime - coinData.lastBroadcast > 50) {
          broadcastFn(`game_${gameId}`, 'physics_coin_position', {
            gameId,
            playerAddress: playerAddr,
            position: { x: coinBody.position.x, y: coinBody.position.y, z: coinBody.position.z },
            rotation: { x: coinBody.quaternion.x, y: coinBody.quaternion.y, z: coinBody.quaternion.z, w: coinBody.quaternion.w },
            velocity: { x: coinBody.velocity.x, y: coinBody.velocity.y, z: coinBody.velocity.z }
          })
          coinData.lastBroadcast = currentTime
        }

        // Check if coin has landed
        const velocity = Math.sqrt(coinBody.velocity.x ** 2 + coinBody.velocity.y ** 2 + coinBody.velocity.z ** 2)
        if (velocity < 0.5 && coinBody.position.y < 5) {
          this.handleCoinLanded(gameId, playerAddr, broadcastFn)
        }

        // Timeout after 10 seconds
        if (currentTime - coinData.startTime > 10000) {
          this.handleCoinLanded(gameId, playerAddr, broadcastFn)
        }
      })

      setTimeout(simulationLoop, 16)
    }

    simulationLoop()
  }

  handleCoinLanded(gameId, playerAddress, broadcastFn) {
    const game = this.games.get(gameId)
    const world = this.worlds.get(gameId)
    if (!game) return

    const coinData = game.activeCoins.get(playerAddress)
    if (!coinData || coinData.landed) return

    console.log(`🎯 Coin landed for ${playerAddress}`)

    coinData.landed = true
    const coinBody = coinData.body
    const player = game.players[playerAddress]

    const result = this.determineCoinFace(coinBody.quaternion)
    const won = result === player.choice

    console.log(`🎲 Result: ${result}, Player chose: ${player.choice}, Won: ${won}`)

    if (!won) {
      player.lives--
      if (player.lives <= 0) {
        player.isActive = false
      }
    }

    player.lastResult = { won, result }

    world.removeBody(coinBody)

    broadcastFn(`game_${gameId}`, 'physics_coin_landed', {
      gameId,
      playerAddress,
      result,
      won,
      livesRemaining: player.lives,
      eliminated: !player.isActive
    })

    this.broadcastState(gameId, broadcastFn)

    // Check if all coins have landed
    const allLanded = Array.from(game.activeCoins.values()).every(c => c.landed)
    if (allLanded) {
      this.checkRoundEnd(gameId, broadcastFn)
    }
  }

  endRound(gameId, broadcastFn) {
    const game = this.games.get(gameId)
    if (!game) return

    console.log(`⏰ Round ${game.currentRound} time expired`)

    if (game.timerInterval) {
      clearInterval(game.timerInterval)
      game.timerInterval = null
    }

    // Auto-fire for players who didn't act
    game.playerOrder.forEach(addr => {
      const player = game.players[addr]
      if (player.isActive && !player.hasFired) {
        console.log(`⚠️ Auto-firing for ${addr}`)
        if (!player.choice) player.choice = 'heads'
        this.fireCoin(gameId, addr, 0, 5, broadcastFn)
      }
    })

    // Wait a bit for auto-fired coins to land
    setTimeout(() => {
      this.checkRoundEnd(gameId, broadcastFn)
    }, 5000)
  }

  checkRoundEnd(gameId, broadcastFn) {
    const game = this.games.get(gameId)
    if (!game) return

    const activePlayers = Object.values(game.players).filter(p => p.isActive)
    
    // Check for tie scenario (all remaining players lost their last life)
    const allDead = activePlayers.length === 0 && game.playerOrder.some(addr => game.players[addr].lives === 0)
    
    if (allDead) {
      console.log(`⚠️ TIE - All players eliminated! Replaying round...`)
      
      // Reset lives for tied players
      game.playerOrder.forEach(addr => {
        const player = game.players[addr]
        if (player.lives === 0) {
          player.lives = 1
          player.isActive = true
        }
      })

      broadcastFn(`game_${gameId}`, 'physics_round_tie', {
        gameId,
        message: 'All players eliminated! Replaying round...'
      })

      this.broadcastState(gameId, broadcastFn)

      setTimeout(() => {
        this.startRound(gameId, broadcastFn)
      }, 3000)

      return
    }

    game.phase = this.PHASES.ROUND_RESULTS

    broadcastFn(`game_${gameId}`, 'physics_round_end', {
      gameId,
      round: game.currentRound,
      survivors: activePlayers.map(p => p.address)
    })

    this.broadcastState(gameId, broadcastFn)

    if (activePlayers.length <= 1) {
      setTimeout(() => {
        this.endGame(gameId, broadcastFn)
      }, 3000)
    } else {
      setTimeout(() => {
        this.startRound(gameId, broadcastFn)
      }, 5000)
    }
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
      currentRound: game.currentRound,
      roundTimer: game.roundTimer,
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
    const game = this.games.get(gameId)
    if (game && game.timerInterval) {
      clearInterval(game.timerInterval)
    }
    
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