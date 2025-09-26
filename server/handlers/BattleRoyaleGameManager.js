// BattleRoyaleGameManager.js - Enhanced Server-Controlled Battle Royale
// Manages 8 simultaneous server-side coin flips with Three.js physics

class BattleRoyaleGameManager {
  constructor() {
    this.battleRoyaleGames = new Map() // gameId -> BattleRoyaleState
    this.roundTimers = new Map() // gameId -> timer
    this.gameTimers = new Map() // gameId -> various timers
    this.powerTimers = new Map() // gameId -> Map(playerAddress -> powerTimer)
    this.flipAnimations = new Map() // gameId -> Map(playerAddress -> animationState)
  }

  // ===== BATTLE ROYALE PHASES =====
  PHASES = {
    FILLING: 'filling',           // Waiting for 8 players to join
    STARTING: 'starting',         // 3-second countdown before first round
    ROUND_ACTIVE: 'round_active', // Players making choices and flipping
    ROUND_RESULT: 'round_result', // Showing elimination results
    COMPLETED: 'completed',       // Game finished, winner declared
    CANCELLED: 'cancelled'        // Game cancelled (not enough players)
  }

  // ===== ROUND SUB-PHASES =====
  ROUND_PHASES = {
    REVEALING_TARGET: 'revealing_target',     // 3-second target reveal
    WAITING_CHOICE: 'waiting_choice',         // 20-second choice phase
    CHARGING_POWER: 'charging_power',         // Power charging phase
    EXECUTING_FLIPS: 'executing_flips',       // All 8 coins flipping simultaneously
    SHOWING_RESULT: 'showing_result'          // 5-second result display
  }

  // ===== GAME CREATION =====
  createBattleRoyale(gameId, gameData, dbService = null) {
    console.log(`🎮 Creating Battle Royale game: ${gameId}`)
    console.log(`📊 Game data received:`, gameData)
    
    const battleRoyaleState = {
      // Core identifiers
      gameId,
      phase: this.PHASES.FILLING,
      gamePhase: null,
      roundPhase: null,
      
      // Game settings
      maxPlayers: 8,
      currentPlayers: 0,
      entryFee: gameData.entryFee || 5.00,
      serviceFee: gameData.serviceFee || 0.50,
      
      // Players - enhanced with coin states
      creator: gameData.creator,
      players: new Map(), // address -> PlayerState with coinState
      playerSlots: new Array(8).fill(null), // slot positions for UI
      eliminatedPlayers: new Set(),
      activePlayers: new Set(),
      
      // Round management
      currentRound: 0,
      maxRounds: 10, // Safety limit
      targetResult: null, // 'heads' or 'tails' for current round
      roundCountdown: null, // Current countdown timer value
      roundDeadline: null,
      roundStartTime: null,
      
      // Server-controlled coin states for all 8 players
      coinStates: new Map(), // playerAddress -> coinState
      
      // Results
      winner: null,
      eliminationHistory: [],
      roundResult: null,
      
      // NFT info
      nftContract: gameData.nftContract,
      nftTokenId: gameData.nftTokenId,
      nftName: gameData.nftName,
      nftImage: gameData.nftImage,
      nftCollection: gameData.nftCollection,
      
      // Timing
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      lastActivity: Date.now(),
      
      // Spectators
      spectators: new Set()
    }

    this.battleRoyaleGames.set(gameId, battleRoyaleState)
    console.log(`✅ Battle Royale game created in memory: ${gameId}`)
    
    // Save to database if dbService is provided
    if (dbService) {
      this.saveGameToDatabase(gameId, gameData, dbService)
    } else {
      console.warn(`⚠️ No database service provided - game ${gameId} will not persist across server restarts`)
    }
    
    // Automatically add the creator as the first player (slot 0) for free
    this.addCreatorAsPlayer(gameId, gameData.creator)
    
    return battleRoyaleState
  }

  // ===== DATABASE PERSISTENCE =====
  async saveGameToDatabase(gameId, gameData, dbService) {
    try {
      console.log(`💾 Saving Battle Royale game to database: ${gameId}`)
      
      const dbGameData = {
        id: gameId,
        creator: gameData.creator,
        nft_contract: gameData.nftContract,
        nft_token_id: gameData.nftTokenId,
        nft_name: gameData.nftName,
        nft_image: gameData.nftImage,
        nft_collection: gameData.nftCollection,
        nft_chain: gameData.nftChain || 'base',
        entry_fee: gameData.entryFee,
        service_fee: gameData.serviceFee,
        max_players: 8
      }
      
      await dbService.createBattleRoyaleGame(dbGameData)
      console.log(`✅ Battle Royale game saved to database: ${gameId}`)
    } catch (error) {
      console.error(`❌ Failed to save Battle Royale game to database: ${gameId}`, error)
    }
  }

  // ===== PLAYER MANAGEMENT =====
  addCreatorAsPlayer(gameId, creatorAddress) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) {
      console.error(`❌ Game not found: ${gameId}`)
      return false
    }

    if (game.players.has(creatorAddress)) {
      console.log(`ℹ️ Creator already added to game: ${creatorAddress}`)
      return true
    }

    // Create player state for creator (free entry)
    const creatorState = {
      address: creatorAddress,
      slotNumber: 0, // Creator always gets slot 0
      entryPaid: true, // Creator plays for free but marked as "paid"
      status: 'active',
      joinedAt: new Date().toISOString(),
      
      // Current round state
      choice: null, // 'heads' or 'tails'
      power: 1, // 1-10
      hasFlipped: false,
      flipTime: null,
      
      // Server-controlled coin state
      coinState: {
        rotation: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        isFlipping: false,
        flipStartTime: null,
        flipDuration: 2000,
        flipResult: null,
        totalRotations: 0,
        finalRotation: 0,
        powerUsed: 1
      },
      
      // Coin customization
      coin: {
        id: 'plain',
        type: 'default',
        name: 'Classic',
        headsImage: '/coins/plainh.png',
        tailsImage: '/coins/plaint.png',
        material: null
      },
      
      // Game stats
      roundsParticipated: 0,
      roundsSurvived: 0,
      eliminatedInRound: null,
      
      // Creator-specific
      isCreator: true,
      entryAmount: 0 // Creator pays nothing
    }

    // Add creator to game
    game.players.set(creatorAddress, creatorState)
    game.playerSlots[0] = creatorAddress
    game.activePlayers.add(creatorAddress)
    game.coinStates.set(creatorAddress, creatorState.coinState)
    game.currentPlayers++
    game.lastActivity = Date.now()

    console.log(`✅ Creator ${creatorAddress} added as first player in game ${gameId}`)
    return true
  }

  addPlayer(gameId, playerAddress, slotNumber = null) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) {
      console.error(`❌ Game not found: ${gameId}`)
      return false
    }

    if (game.phase !== this.PHASES.FILLING) {
      console.error(`❌ Cannot join game in phase: ${game.phase}`)
      return false
    }

    if (game.currentPlayers >= game.maxPlayers) {
      console.error(`❌ Game is full: ${gameId}`)
      return false
    }

    if (game.players.has(playerAddress)) {
      console.error(`❌ Player already in game: ${playerAddress}`)
      return false
    }

    // Find available slot (skip slot 0 as it's reserved for creator)
    let assignedSlot = slotNumber
    if (assignedSlot === null || game.playerSlots[assignedSlot] !== null || assignedSlot === 0) {
      assignedSlot = game.playerSlots.findIndex((slot, index) => slot === null && index > 0)
      if (assignedSlot === -1) {
        console.error(`❌ No available slots: ${gameId}`)
        return false
      }
    }

    // Create player state with server-controlled coin
    const playerState = {
      address: playerAddress,
      slotNumber: assignedSlot,
      entryPaid: false, // Will be set to true when blockchain payment confirmed
      status: 'active',
      joinedAt: new Date().toISOString(),
      entryAmount: game.entryFee / 7, // Each of 7 players pays 1/7th
      
      // Current round state
      choice: null,
      power: 1,
      hasFlipped: false,
      flipTime: null,
      
      // Server-controlled coin state - UNIQUE PER PLAYER
      coinState: {
        rotation: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        isFlipping: false,
        flipStartTime: null,
        flipDuration: 2000,
        flipResult: null,
        totalRotations: 0,
        finalRotation: 0,
        powerUsed: 1
      },
      
      // Coin customization
      coin: {
        id: 'plain',
        type: 'default',
        name: 'Classic',
        headsImage: '/coins/plainh.png',
        tailsImage: '/coins/plaint.png',
        material: null
      },
      
      // Game stats
      roundsParticipated: 0,
      roundsSurvived: 0,
      eliminatedInRound: null
    }

    // Add to game
    game.players.set(playerAddress, playerState)
    game.playerSlots[assignedSlot] = playerAddress
    game.activePlayers.add(playerAddress)
    game.coinStates.set(playerAddress, playerState.coinState)
    game.currentPlayers++
    game.lastActivity = Date.now()

    console.log(`✅ Player ${playerAddress} added to slot ${assignedSlot} in game ${gameId}`)
    console.log(`📊 Current players: ${game.currentPlayers}/${game.maxPlayers}`)

    // Check if game is ready to start (all 8 slots filled)
    if (game.currentPlayers === game.maxPlayers) {
      console.log(`🎮 Game ${gameId} is full with ${game.maxPlayers} players - auto-starting!`)
      
      // Need to get the broadcast function - this should be passed from the socket handler
      // For now, we'll set a flag that the socket handler can check
      game.readyToStart = true
    }

    return true
  }

  // ===== GAME START =====
  prepareGameStart(gameId, broadcastFn) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) {
      console.error(`❌ Game not found in prepareGameStart: ${gameId}`)
      return false
    }

    console.log(`🎮 Preparing to start Battle Royale: ${gameId}`)
    console.log(`📊 Game state before start:`, {
      phase: game.phase,
      currentPlayers: game.currentPlayers,
      maxPlayers: game.maxPlayers,
      activePlayers: game.activePlayers.size,
      creator: game.creator
    })
    
    game.phase = this.PHASES.STARTING
    game.startedAt = new Date().toISOString()
    game.lastActivity = Date.now()

    // 3-second countdown before first round
    if (broadcastFn) {
      const startEvent = {
        gameId,
        countdown: 3,
        message: 'Battle Royale starting in 3 seconds!'
      }
      console.log(`📡 Broadcasting battle_royale_starting event:`, startEvent)
      broadcastFn(`br_${gameId}`, 'battle_royale_starting', startEvent)
    } else {
      console.warn(`⚠️ No broadcast function provided for game start: ${gameId}`)
    }

    // Start first round after countdown
    setTimeout(() => {
      console.log(`⏰ Starting first round for game: ${gameId}`)
      this.startNextRound(gameId, broadcastFn)
    }, 3000)

    console.log(`✅ Game start preparation completed for: ${gameId}`)
    return true
  }

  // ===== ROUND MANAGEMENT =====
  startNextRound(gameId, broadcastFn) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return false

    // Check if game should end (only 1 player left)
    if (game.activePlayers.size <= 1) {
      return this.completeGame(gameId, broadcastFn)
    }

    game.currentRound++
    game.phase = this.PHASES.ROUND_ACTIVE
    game.gamePhase = this.ROUND_PHASES.REVEALING_TARGET
    game.roundPhase = this.ROUND_PHASES.REVEALING_TARGET
    game.roundStartTime = Date.now()
    game.lastActivity = Date.now()

    // Clear previous round data for all players
    for (const [address, player] of game.players) {
      if (game.activePlayers.has(address)) {
        player.choice = null
        player.power = 1
        player.hasFlipped = false
        player.flipTime = null
        player.roundsParticipated++
        
        // Reset coin state
        player.coinState = {
          rotation: { x: 0, y: 0, z: 0 },
          velocity: { x: 0, y: 0, z: 0 },
          isFlipping: false,
          flipStartTime: null,
          flipDuration: 2000,
          flipResult: null,
          totalRotations: 0,
          finalRotation: 0,
          powerUsed: 1
        }
        game.coinStates.set(address, player.coinState)
      }
    }

    console.log(`🎯 Starting round ${game.currentRound} for game ${gameId}`)
    console.log(`👥 Active players: ${game.activePlayers.size}`)

    // Randomly select target result
    game.targetResult = Math.random() < 0.5 ? 'heads' : 'tails'
    
    // Show target for 3 seconds
    if (broadcastFn) {
      broadcastFn(`br_${gameId}`, 'battle_royale_target_reveal', {
        gameId,
        round: game.currentRound,
        target: game.targetResult,
        activePlayers: Array.from(game.activePlayers),
        countdown: 3
      })
    }

    // Start choice phase after 3 seconds
    setTimeout(() => {
      this.startChoicePhase(gameId, broadcastFn)
    }, 3000)

    return true
  }

  startChoicePhase(gameId, broadcastFn) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return false

    game.gamePhase = this.ROUND_PHASES.WAITING_CHOICE
    game.roundPhase = this.ROUND_PHASES.WAITING_CHOICE
    game.roundCountdown = 20
    game.roundDeadline = Date.now() + 20000
    game.lastActivity = Date.now()

    console.log(`⏰ Starting 20-second choice/flip phase for round ${game.currentRound}`)

    // Start countdown timer
    const countdownInterval = setInterval(() => {
      if (!this.battleRoyaleGames.has(gameId)) {
        clearInterval(countdownInterval)
        return
      }
      
      const game = this.battleRoyaleGames.get(gameId)
      game.roundCountdown--
      
      if (game.roundCountdown <= 0) {
        clearInterval(countdownInterval)
        this.processRoundResults(gameId, broadcastFn)
      }
      
      // Broadcast state update with countdown
      if (broadcastFn) {
        const state = this.getFullGameState(gameId)
        broadcastFn(`br_${gameId}`, 'battle_royale_state_update', state)
      }
    }, 1000)

    this.roundTimers.set(gameId, countdownInterval)
    return true
  }

  // ===== PLAYER ACTIONS =====
  setPlayerChoice(gameId, playerAddress, choice) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return false

    const player = game.players.get(playerAddress)
    if (!player) return false

    if (!game.activePlayers.has(playerAddress)) {
      console.error(`❌ Player not active: ${playerAddress}`)
      return false
    }

    player.choice = choice
    game.lastActivity = Date.now()
    
    // Transition to power phase once choice is made
    game.gamePhase = this.ROUND_PHASES.CHARGING_POWER
    
    console.log(`🎯 ${playerAddress} chose ${choice} in round ${game.currentRound}`)
    return true
  }

  startPowerCharging(gameId, playerAddress) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return false

    const player = game.players.get(playerAddress)
    if (!player || !player.choice) return false

    // Initialize power timer map for this game if not exists
    if (!this.powerTimers.has(gameId)) {
      this.powerTimers.set(gameId, new Map())
    }

    const startTime = Date.now()
    const powerTimer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / 2000, 1) // 2 seconds to max
      player.power = 1 + (progress * 9) // 1 to 10
      
      // Update coin state power
      player.coinState.powerUsed = player.power
      
      if (player.power >= 10) {
        clearInterval(powerTimer)
        this.powerTimers.get(gameId).delete(playerAddress)
      }
    }, 50)

    this.powerTimers.get(gameId).set(playerAddress, powerTimer)
    
    console.log(`⚡ ${playerAddress} started charging power`)
    return true
  }

  stopPowerCharging(gameId, playerAddress, finalPower) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return false

    const player = game.players.get(playerAddress)
    if (!player) return false

    // Clear power timer
    if (this.powerTimers.has(gameId)) {
      const timer = this.powerTimers.get(gameId).get(playerAddress)
      if (timer) {
        clearInterval(timer)
        this.powerTimers.get(gameId).delete(playerAddress)
      }
    }

    player.power = Math.max(1, Math.min(10, finalPower || player.power))
    player.coinState.powerUsed = player.power
    
    console.log(`⚡ ${playerAddress} stopped charging at power ${player.power}`)
    return true
  }

  executePlayerFlip(gameId, playerAddress, broadcastFn) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return false

    const player = game.players.get(playerAddress)
    if (!player) return false

    if (!game.activePlayers.has(playerAddress)) {
      console.error(`❌ Player not active: ${playerAddress}`)
      return false
    }

    if (player.hasFlipped) {
      console.error(`❌ Player already flipped: ${playerAddress}`)
      return false
    }

    // Auto-assign choice if not set
    if (!player.choice) {
      player.choice = Math.random() < 0.5 ? 'heads' : 'tails'
      console.log(`🎲 Auto-assigned choice ${player.choice} for ${playerAddress}`)
    }

    // Calculate flip result - SERVER DETERMINES OUTCOME
    const flipResult = this.calculateFlipResult(player.choice, player.power)
    
    // Calculate animation parameters based on power
    const flipDuration = Math.max(1000, Math.min(10000, player.power * 1000))
    const rotationsPerSecond = 2
    const totalRotations = (flipDuration / 1000) * rotationsPerSecond * 2 * Math.PI
    const finalRotation = flipResult === 'heads' ? 0 : Math.PI

    // Update player's coin state for animation
    player.coinState = {
      rotation: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: totalRotations / (flipDuration / 1000), z: 0 },
      isFlipping: true,
      flipStartTime: Date.now(),
      flipDuration: flipDuration,
      flipResult: flipResult,
      totalRotations: totalRotations,
      finalRotation: finalRotation,
      powerUsed: player.power
    }
    
    player.hasFlipped = true
    player.flipTime = Date.now()
    game.coinStates.set(playerAddress, player.coinState)
    game.lastActivity = Date.now()

    console.log(`🪙 ${playerAddress} flipped with power ${player.power}: ${flipResult}`)

    // Check if all active players have flipped
    const allFlipped = Array.from(game.activePlayers).every(addr => {
      const p = game.players.get(addr)
      return p && p.hasFlipped
    })

    if (allFlipped) {
      console.log(`✅ All players flipped in round ${game.currentRound}`)
      
      // Broadcast all flips executing
      if (broadcastFn) {
        const playerFlipStates = {}
        for (const addr of game.activePlayers) {
          const p = game.players.get(addr)
          playerFlipStates[addr] = p.coinState
        }
        
        broadcastFn(`br_${gameId}`, 'battle_royale_flips_executing', {
          gameId,
          round: game.currentRound,
          playerFlipStates
        })
      }
      
      // Process results after longest flip completes
      const maxDuration = Math.max(
        ...Array.from(game.activePlayers).map(addr => 
          game.players.get(addr).coinState.flipDuration || 2000
        )
      )
      
      setTimeout(() => {
        this.processRoundResults(gameId, broadcastFn)
      }, maxDuration + 500)
    }

    return true
  }

  calculateFlipResult(choice, power) {
    // Power influences the probability of getting the chosen result
    // Power 1 = 50% chance, Power 10 = 85% chance
    const baseChance = 0.5
    const powerBonus = ((power - 1) / 9) * 0.35 // 0 to 35% bonus
    const successChance = baseChance + powerBonus

    const success = Math.random() < successChance
    return success ? choice : (choice === 'heads' ? 'tails' : 'heads')
  }

  // ===== ROUND PROCESSING =====
  processRoundResults(gameId, broadcastFn) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return false

    console.log(`📄 Processing round ${game.currentRound} results for game ${gameId}`)

    game.gamePhase = this.ROUND_PHASES.SHOWING_RESULT
    game.roundPhase = this.ROUND_PHASES.SHOWING_RESULT
    game.lastActivity = Date.now()

    // Clear countdown timer
    if (this.roundTimers.has(gameId)) {
      clearInterval(this.roundTimers.get(gameId))
      this.roundTimers.delete(gameId)
    }

    // Auto-flip any players who didn't flip
    for (const playerAddress of game.activePlayers) {
      const player = game.players.get(playerAddress)
      if (!player.hasFlipped) {
        // Auto-flip with random choice and minimal power
        player.choice = Math.random() < 0.5 ? 'heads' : 'tails'
        player.power = 1
        const flipResult = this.calculateFlipResult(player.choice, 1)
        
        player.coinState = {
          rotation: { x: 0, y: 0, z: 0 },
          velocity: { x: 0, y: 0, z: 0 },
          isFlipping: false,
          flipStartTime: Date.now(),
          flipDuration: 1000,
          flipResult: flipResult,
          totalRotations: 2 * Math.PI * 2,
          finalRotation: flipResult === 'heads' ? 0 : Math.PI,
          powerUsed: 1
        }
        
        player.hasFlipped = true
        player.flipTime = Date.now()
        game.coinStates.set(playerAddress, player.coinState)
        
        console.log(`⚠️ Auto-flipped ${playerAddress}: ${flipResult}`)
      }
    }

    // Determine eliminations based on target
    const eliminatedThisRound = []
    const survivedThisRound = []

    for (const playerAddress of game.activePlayers) {
      const player = game.players.get(playerAddress)
      
      // Player is eliminated if their coin result doesn't match the target
      if (player.coinState.flipResult !== game.targetResult) {
        eliminatedThisRound.push(playerAddress)
        player.status = 'eliminated'
        player.eliminatedInRound = game.currentRound
        game.eliminatedPlayers.add(playerAddress)
      } else {
        survivedThisRound.push(playerAddress)
        player.roundsSurvived++
      }
    }

    // Update active players
    for (const playerAddress of eliminatedThisRound) {
      game.activePlayers.delete(playerAddress)
    }

    // Record round results
    const roundData = {
      round: game.currentRound,
      targetResult: game.targetResult,
      playersAtStart: game.activePlayers.size + eliminatedThisRound.length,
      eliminatedPlayers: eliminatedThisRound,
      survivingPlayers: survivedThisRound,
      playersRemaining: game.activePlayers.size
    }

    game.eliminationHistory.push(roundData)
    game.roundResult = roundData

    console.log(`📊 Round ${game.currentRound} results:`)
    console.log(`  Target: ${game.targetResult}`)
    console.log(`  Eliminated: ${eliminatedThisRound.length} players`)
    console.log(`  Remaining: ${game.activePlayers.size} players`)

    // Broadcast results
    if (broadcastFn) {
      broadcastFn(`br_${gameId}`, 'battle_royale_round_result', {
        gameId,
        round: game.currentRound,
        targetResult: game.targetResult,
        eliminatedPlayers: eliminatedThisRound,
        survivingPlayers: survivedThisRound,
        playersRemaining: game.activePlayers.size,
        roundResult: roundData,
        playerStates: this.getPlayerStates(gameId)
      })
    }

    // Check if game is complete
    if (game.activePlayers.size <= 1) {
      setTimeout(() => {
        this.completeGame(gameId, broadcastFn)
      }, 3000) // 3-second delay to show final results
    } else {
      // Start next round after 5 seconds
      setTimeout(() => {
        this.startNextRound(gameId, broadcastFn)
      }, 5000)
    }

    return true
  }

  // ===== GAME COMPLETION =====
  completeGame(gameId, broadcastFn) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return false

    console.log(`🏆 Completing Battle Royale game: ${gameId}`)

    game.phase = this.PHASES.COMPLETED
    game.gamePhase = 'game_complete'
    game.completedAt = new Date().toISOString()
    game.lastActivity = Date.now()

    // Determine winner
    if (game.activePlayers.size === 1) {
      game.winner = Array.from(game.activePlayers)[0]
      const winnerPlayer = game.players.get(game.winner)
      if (winnerPlayer) {
        winnerPlayer.status = 'winner'
      }
    } else if (game.activePlayers.size === 0) {
      // Edge case: all players eliminated in final round
      console.warn(`⚠️ No players survived final round in game ${gameId}`)
      game.winner = null
    }

    console.log(`🎉 Battle Royale winner: ${game.winner || 'None'}`)

    if (broadcastFn) {
      broadcastFn(`br_${gameId}`, 'battle_royale_game_complete', {
        gameId,
        winner: game.winner,
        totalRounds: game.currentRound,
        finalPrize: game.nftName,
        finalResults: {
          winner: game.winner,
          totalPlayers: game.currentPlayers,
          totalRounds: game.currentRound,
          eliminationHistory: game.eliminationHistory
        }
      })
    }

    // Clean up timers
    this.clearGameTimers(gameId)

    return true
  }

  // ===== STATE QUERIES =====
  getGame(gameId) {
    return this.battleRoyaleGames.get(gameId)
  }

  getFullGameState(gameId) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return null

    // Convert Maps to objects for transmission
    const players = {}
    const coinStates = {}
    
    for (const [address, player] of game.players) {
      players[address] = {
        ...player,
        coinState: player.coinState || game.coinStates.get(address)
      }
      coinStates[address] = player.coinState || game.coinStates.get(address)
    }

    return {
      gameId: game.gameId,
      phase: game.phase,
      gamePhase: game.gamePhase || game.roundPhase,
      roundPhase: game.roundPhase,
      
      maxPlayers: game.maxPlayers,
      currentPlayers: game.currentPlayers,
      
      creator: game.creator,
      players: players,
      playerSlots: game.playerSlots,
      activePlayers: Array.from(game.activePlayers),
      eliminatedPlayers: Array.from(game.eliminatedPlayers),
      
      currentRound: game.currentRound,
      targetResult: game.targetResult,
      roundCountdown: game.roundCountdown,
      roundResult: game.roundResult,
      
      coinStates: coinStates,
      
      winner: game.winner,
      eliminationHistory: game.eliminationHistory,
      
      nftName: game.nftName,
      nftImage: game.nftImage,
      
      spectators: Array.from(game.spectators),
      
      lastActivity: game.lastActivity
    }
  }

  getPlayerStates(gameId) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return {}
    
    const states = {}
    for (const [address, player] of game.players) {
      states[address] = {
        address: player.address,
        slotNumber: player.slotNumber,
        status: player.status,
        choice: player.choice,
        power: player.power,
        hasFlipped: player.hasFlipped,
        coinState: player.coinState,
        eliminatedInRound: player.eliminatedInRound,
        roundsSurvived: player.roundsSurvived
      }
    }
    return states
  }

  // ===== SPECTATOR MANAGEMENT =====
  addSpectator(gameId, address) {
    const game = this.battleRoyaleGames.get(gameId)
    if (game) {
      game.spectators.add(address)
      return true
    }
    return false
  }

  removeSpectator(gameId, address) {
    const game = this.battleRoyaleGames.get(gameId)
    if (game) {
      game.spectators.delete(address)
      return true
    }
    return false
  }

  // ===== TIMER MANAGEMENT =====
  clearGameTimers(gameId) {
    // Clear round timer
    const roundTimer = this.roundTimers.get(gameId)
    if (roundTimer) {
      clearInterval(roundTimer)
      this.roundTimers.delete(gameId)
    }

    // Clear game timers
    const gameTimer = this.gameTimers.get(gameId)
    if (gameTimer) {
      clearTimeout(gameTimer)
      this.gameTimers.delete(gameId)
    }

    // Clear power timers for all players
    if (this.powerTimers.has(gameId)) {
      const playerTimers = this.powerTimers.get(gameId)
      for (const timer of playerTimers.values()) {
        clearInterval(timer)
      }
      this.powerTimers.delete(gameId)
    }
  }

  // ===== CLEANUP =====
  removeGame(gameId) {
    this.clearGameTimers(gameId)
    this.battleRoyaleGames.delete(gameId)
    this.flipAnimations.delete(gameId)
    console.log(`🗑️ Removed Battle Royale game: ${gameId}`)
  }

  // ===== COIN UPDATE =====
  updatePlayerCoin(gameId, playerAddress, coinData) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return false

    const player = game.players.get(playerAddress)
    if (!player) return false

    // Update player's coin data
    player.coin = {
      id: coinData.id || 'plain',
      type: coinData.type || 'default',
      name: coinData.name || 'Classic',
      headsImage: coinData.headsImage || '/coins/plainh.png',
      tailsImage: coinData.tailsImage || '/coins/plaint.png',
      material: coinData.material || null
    }

    game.lastActivity = Date.now()
    console.log(`✅ Updated coin for player ${playerAddress} in game ${gameId}: ${coinData.name}`)
    return true
  }

  // ===== POWER UPDATE BROADCASTING =====
  broadcastPowerUpdate(gameId, playerAddress, power, broadcastFn) {
    if (!broadcastFn) return
    
    broadcastFn(`br_${gameId}`, 'battle_royale_power_update', {
      gameId,
      playerAddress,
      power
    })
  }
}

module.exports = BattleRoyaleGameManager