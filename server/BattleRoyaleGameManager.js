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
    FILLING: 'filling',
    STARTING: 'starting',
    ROUND_ACTIVE: 'round_active',  // ✅ Keep this
    ROUND_RESULT: 'round_result',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  }


  // ===== GAME CREATION =====
  createBattleRoyale(gameId, gameData, dbService = null) {
    console.log(`🎮 Creating Battle Royale game: ${gameId}`)
    console.log(`📊 Game data received:`, gameData)
    
    const battleRoyaleState = {
      // Core identifiers
      gameId,
      phase: this.PHASES.FILLING,
      
      // Game settings
      maxPlayers: 6,
      currentPlayers: 0,
      entryFee: gameData.entryFee || 5.00,
      serviceFee: gameData.serviceFee || 0.50,
      
      // Players - enhanced with coin states
      creator: gameData.creator,
      players: new Map(), // address -> PlayerState with coinState
      playerSlots: new Array(6).fill(null),
      eliminatedPlayers: new Set(),
      activePlayers: new Set(),
      
      // Round management - NEW STRUCTURE
      currentRound: 0,
      maxRounds: 10, // Safety limit
      roundStartTime: null,
      roundCountdown: null,
      
      // Server-controlled coin states for all 6 players
      coinStates: new Map(), // playerAddress -> coinState
      
      // Results
      winner: null,
      eliminationHistory: [],
      
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
    
    // Automatically add the creator as the first player if they want to participate
    if (gameData.creator_participates === true || gameData.creator_participates === 1) {
      this.addCreatorAsPlayer(gameId, gameData.creator, dbService)
    } else {
      console.log(`🪙 Creator ${gameData.creator} will NOT participate in game ${gameId}`)
    }
    
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
        max_players: 6
      }
      
      await dbService.createBattleRoyaleGame(dbGameData)
      console.log(`✅ Battle Royale game saved to database: ${gameId}`)
    } catch (error) {
      console.error(`❌ Failed to save Battle Royale game to database: ${gameId}`, error)
    }
  }

  // ===== PLAYER MANAGEMENT =====
  async addCreatorAsPlayer(gameId, creatorAddress, dbService = null) {
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
      flipResult: null,
      
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
    
    // Update database with new player count
    if (dbService && typeof dbService.updateBattleRoyaleGame === 'function') {
      try {
        await dbService.updateBattleRoyaleGame(gameId, { current_players: game.currentPlayers })
        console.log(`✅ Database updated with creator added: ${game.currentPlayers} players`)
      } catch (error) {
        console.error(`❌ Failed to update database with creator:`, error)
      }
    }
    
    // Also add creator to participants table
    if (dbService && typeof dbService.addBattleRoyalePlayer === 'function') {
      try {
        await dbService.addBattleRoyalePlayer(gameId, {
          player_address: creatorAddress,
          slot_number: 0,
          entry_paid: true,
          entry_amount: 0
        })
        console.log(`✅ Creator added to participants table`)
      } catch (error) {
        console.error(`❌ Failed to add creator to participants table:`, error)
      }
    }
    
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
      flipResult: null,
      
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

    // Check if game is ready to start (all 6 slots filled)
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
      console.log(`📡 Broadcasting battle_royale_starting event`)
      broadcastFn(`game_${gameId}`, 'battle_royale_starting', startEvent)
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
    game.roundStartTime = Date.now()
    game.roundCountdown = 20
    game.lastActivity = Date.now()

    // Clear previous round data for all players
    for (const [address, player] of game.players) {
      if (game.activePlayers.has(address)) {
        player.choice = null
        player.power = 1
        player.hasFlipped = false
        player.flipTime = null
        player.flipResult = null
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

    // Broadcast round start immediately
    if (broadcastFn) {
      broadcastFn(`game_${gameId}`, 'battle_royale_round_start', {
        gameId,
        round: game.currentRound,
        roundDuration: 20000,
        activePlayers: Array.from(game.activePlayers)
      })
      
      const fullState = this.getFullGameState(gameId)
      broadcastFn(`game_${gameId}`, 'battle_royale_state_update', fullState)
    }

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
        this.endRound(gameId, broadcastFn)
      }
      
      // Broadcast countdown update
      if (broadcastFn) {
        const state = this.getFullGameState(gameId)
        broadcastFn(`game_${gameId}`, 'battle_royale_state_update', state)
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

    if (game.phase !== this.PHASES.ROUND_ACTIVE) {
      console.error(`❌ Cannot make choice in phase: ${game.phase}`)
      return false
    }

    player.choice = choice
    game.lastActivity = Date.now()
    
    console.log(`✅ ${playerAddress} chose ${choice}`)
    return true
  }


  startPowerCharging(gameId, playerAddress) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return false

    const player = game.players.get(playerAddress)
    if (!player) return false

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

    // Player must choose before flipping
    if (!player.choice) {
      console.log(`❌ Player ${playerAddress} didn't choose - cannot flip`)
      return false
    }

    // Calculate flip result - simple 50/50 with power influence
    const flipResult = this.calculateFlipResult(player.choice, player.power)
    
    // Calculate animation parameters based on power
    const flipDuration = 2000 + (player.power * 100) // 2-3 seconds based on power
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
    player.flipResult = flipResult
    game.coinStates.set(playerAddress, player.coinState)
    game.lastActivity = Date.now()

    console.log(`🪙 ${playerAddress} flipped: chose ${player.choice}, got ${flipResult}, power ${player.power}`)

    // Immediately broadcast this player's flip state to everyone
    if (broadcastFn) {
      broadcastFn(`game_${gameId}`, 'battle_royale_player_flipped', {
        gameId,
        playerAddress,
        flipResult,
        coinState: player.coinState,
        survived: flipResult === player.choice
      })
      
      // Also send full state update
      const fullState = this.getFullGameState(gameId)
      broadcastFn(`game_${gameId}`, 'battle_royale_state_update', fullState)
    }

    return true
  }

  // After executePlayerFlip method, add:
  broadcastFlipComplete(gameId, playerAddress, flipResult, broadcastFn) {
    if (!broadcastFn) return
    
    broadcastFn(`game_${gameId}`, 'battle_royale_player_flipped', {
      gameId,
      playerAddress,
      flipResult,
      coinState: this.coinStates.get(playerAddress)
    })
  }

  calculateFlipResult(choice, power) {
    // Base 50/50 chance
    // Power gives slight advantage: 1-10 power = 50-60% success rate
    const baseChance = 0.5
    const powerBonus = ((power - 1) / 9) * 0.1 // 0% to 10% bonus
    const successChance = baseChance + powerBonus

    const success = Math.random() < successChance
    return success ? choice : (choice === 'heads' ? 'tails' : 'heads')
  }

  // ===== ROUND PROCESSING =====
  endRound(gameId, broadcastFn) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return false

    console.log(`📄 Ending round ${game.currentRound} for game ${gameId}`)

    game.lastActivity = Date.now()

    // Clear countdown timer
    if (this.roundTimers.has(gameId)) {
      clearInterval(this.roundTimers.get(gameId))
      this.roundTimers.delete(gameId)
    }

    // Auto-eliminate any players who didn't flip
    for (const playerAddress of game.activePlayers) {
      const player = game.players.get(playerAddress)
      if (!player.hasFlipped || !player.choice) {
        console.log(`⚠️ Player ${playerAddress} didn't flip - auto-eliminating`)
        player.status = 'eliminated'
        player.eliminatedInRound = game.currentRound
        game.eliminatedPlayers.add(playerAddress)
      }
    }

    // Determine eliminations based on flip results
    const eliminatedThisRound = []
    const survivedThisRound = []

    for (const playerAddress of game.activePlayers) {
      const player = game.players.get(playerAddress)
      
      // Player survives if their flip matches their choice
      const survived = (player.flipResult === player.choice)
      
      if (!survived || !player.hasFlipped) {
        eliminatedThisRound.push(playerAddress)
        player.status = 'eliminated'
        player.eliminatedInRound = game.currentRound
        game.eliminatedPlayers.add(playerAddress)
      } else {
        survivedThisRound.push(playerAddress)
        player.roundsSurvived++
      }
      
      console.log(`Player ${playerAddress}: chose ${player.choice}, got ${player.flipResult}, ${survived ? 'SURVIVED' : 'ELIMINATED'}`)
    }

    // Update active players
    for (const playerAddress of eliminatedThisRound) {
      game.activePlayers.delete(playerAddress)
    }

    // Record round results
    const roundData = {
      round: game.currentRound,
      playersAtStart: game.activePlayers.size + eliminatedThisRound.length,
      eliminatedPlayers: eliminatedThisRound,
      survivingPlayers: survivedThisRound,
      playersRemaining: game.activePlayers.size
    }

    game.eliminationHistory.push(roundData)

    console.log(`📊 Round ${game.currentRound} results:`)
    console.log(`  Eliminated: ${eliminatedThisRound.length} players`)
    console.log(`  Remaining: ${game.activePlayers.size} players`)

    // Broadcast results
    if (broadcastFn) {
      broadcastFn(`game_${gameId}`, 'battle_royale_round_end', {
        gameId,
        round: game.currentRound,
        eliminatedPlayers: eliminatedThisRound,
        survivingPlayers: survivedThisRound,
        playersRemaining: game.activePlayers.size
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
      broadcastFn(`game_${gameId}`, 'battle_royale_game_complete', {
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


  // Add this method to the BattleRoyaleGameManager class
  resetGameState(gameId) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return false
    
    console.log(`🔄 Resetting game state for ${gameId}`)
    
    // If game is completed but still being accessed, clean it up
    if (game.phase === 'completed' || game.phase === this.PHASES.COMPLETED) {
      console.log(`🧹 Cleaning up completed game ${gameId}`)
      this.removeGame(gameId)
      return false
    }
    
    // Reset stuck games
    if (!game.playerSlots) {
      game.playerSlots = new Array(6).fill(null)
    }
    
    if (!game.players) {
      game.players = new Map()
    }
    
    if (!game.activePlayers) {
      game.activePlayers = new Set()
    }
    
    if (!game.eliminatedPlayers) {
      game.eliminatedPlayers = new Set()
    }
    
    if (!game.coinStates) {
      game.coinStates = new Map()
    }
    
    if (!game.spectators) {
      game.spectators = new Set()
    }
    
    game.lastActivity = Date.now()
    
    console.log(`✅ Game state reset for ${gameId}`)
    return true
  }

  getFullGameState(gameId) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return null

    // Validate game state before sending
    if (!game.players || !game.playerSlots) {
      console.warn(`Game ${gameId} has invalid state, reinitializing...`)
      return null
    }

    // Convert Maps to objects for transmission
    const players = {}
    const coinStates = {}
    
    try {
      for (const [address, player] of game.players) {
        players[address] = {
          ...player,
          coinState: player.coinState || game.coinStates.get(address) || {}
        }
        coinStates[address] = player.coinState || game.coinStates.get(address) || {}
      }
    } catch (error) {
      console.error('Error processing player states:', error)
      return null
    }

    return {
      gameId: game.gameId,
      phase: game.phase || 'filling',
      
      maxPlayers: game.maxPlayers || 6,
      currentPlayers: game.currentPlayers || 0,
      
      creator: game.creator,
      players: players,
      playerSlots: game.playerSlots || new Array(6).fill(null),
      activePlayers: Array.from(game.activePlayers || []),
      eliminatedPlayers: Array.from(game.eliminatedPlayers || []),
      
      currentRound: game.currentRound || 0,
      roundCountdown: game.roundCountdown || null,
      
      coinStates: coinStates,
      
      winner: game.winner || null,
      eliminationHistory: game.eliminationHistory || [],
      
      nftName: game.nftName || '',
      nftImage: game.nftImage || '',
      
      spectators: Array.from(game.spectators || []),
      
      lastActivity: game.lastActivity || Date.now()
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

  // ===== NEW EVENT HANDLERS =====
  
  // When game starts
  startGame(gameId, broadcastFn) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return false

    // Initialize all players as alive
    game.activePlayers.clear()
    game.eliminatedPlayers.clear()
    
    for (const [address, player] of game.players) {
      player.status = 'alive'
      player.currentChoice = null
      player.hasFlipped = false
      player.flipResult = null
      player.powerLevel = 0
      game.activePlayers.add(address)
    }

    // Start first round
    this.startNewRound(gameId, broadcastFn)
    return true
  }

  // Player makes choice
  makeChoice(gameId, playerAddress, choice, broadcastFn) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return false

    const player = game.players.get(playerAddress)
    if (!player || !game.activePlayers.has(playerAddress)) return false

    // Update player's choice
    player.currentChoice = choice

    // Broadcast choice made (not the choice itself)
    const playerIndex = game.playerSlots.indexOf(playerAddress)
    broadcastFn(`br_${gameId}`, 'playerChose', {
      playerId: playerAddress,
      playerIndex: playerIndex
    })

    return true
  }

  // Player flips coin
  flipCoin(gameId, playerAddress, powerLevel, broadcastFn) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return false

    const player = game.players.get(playerAddress)
    if (!player || !game.activePlayers.has(playerAddress)) return false

    // Validate player can flip
    if (player.hasFlipped || !player.currentChoice) return false

    // Calculate result (can be weighted by power)
    const result = this.calculateFlipResult(player.currentChoice, powerLevel)

    // Update state
    player.flipResult = result
    player.hasFlipped = true
    player.powerLevel = powerLevel

    // Broadcast flip animation to all
    const playerIndex = game.playerSlots.indexOf(playerAddress)
    broadcastFn(`br_${gameId}`, 'coinFlipping', {
      playerIndex: playerIndex,
      playerId: playerAddress
    })

    // After animation time, send result
    setTimeout(() => {
      broadcastFn(`br_${gameId}`, 'flipResult', {
        playerIndex: playerIndex,
        result: result,
        survived: result === player.currentChoice
      })

      this.checkRoundComplete(gameId, broadcastFn)
    }, 2000) // 2 second flip animation

    return true
  }

  // Check if round is complete
  checkRoundComplete(gameId, broadcastFn) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return

    const alivePlayers = Array.from(game.activePlayers).map(addr => game.players.get(addr))
    const allFlipped = alivePlayers.every(p => p.hasFlipped)
    const timeExpired = Date.now() > (game.roundStartTime + game.roundDuration)

    if (allFlipped || timeExpired) {
      this.endRound(gameId, broadcastFn)
    }
  }

  // End round and eliminate players
  endRound(gameId, broadcastFn) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return

    game.phase = 'eliminating'

    // Determine who survives
    const eliminations = []
    const survivors = []

    for (const [address, player] of game.players) {
      if (game.activePlayers.has(address)) {
        if (!player.hasFlipped || player.flipResult !== player.currentChoice) {
          player.status = 'eliminated'
          game.activePlayers.delete(address)
          game.eliminatedPlayers.add(address)
          eliminations.push(game.playerSlots.indexOf(address))
        } else {
          survivors.push(address)
        }
      }
    }

    broadcastFn(`br_${gameId}`, 'roundEnd', {
      eliminations: eliminations,
      survivors: survivors
    })

    // Check for winner
    if (game.activePlayers.size === 1) {
      // Game over, we have a winner
      const winnerAddress = Array.from(game.activePlayers)[0]
      const winner = game.players.get(winnerAddress)
      
      broadcastFn(`br_${gameId}`, 'gameWon', {
        winner: {
          id: winnerAddress,
          name: winner.name || winnerAddress.slice(0, 6) + '...'
        }
      })
    } else if (game.activePlayers.size === 0) {
      // Everyone eliminated - restart round
      broadcastFn(`br_${gameId}`, 'allEliminated')
    } else {
      // Start next round after delay
      setTimeout(() => this.startNewRound(gameId, broadcastFn), 3000)
    }
  }

  // Start new round
  startNewRound(gameId, broadcastFn) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return

    game.currentRound += 1
    game.roundStartTime = Date.now()

    // Reset player states for new round
    for (const address of game.activePlayers) {
      const player = game.players.get(address)
      if (player) {
        player.currentChoice = null
        player.hasFlipped = false
        player.flipResult = null
        player.powerLevel = 0
      }
    }

    const deadline = game.roundStartTime + game.roundDuration

    broadcastFn(`br_${gameId}`, 'roundStart', {
      round: game.currentRound,
      alivePlayers: Array.from(game.activePlayers),
      deadline: deadline
    })
  }

  // Calculate flip result with power weighting
  calculateFlipResult(choice, powerLevel) {
    // Base probability is 50/50, but power can influence it slightly
    const baseProbability = 0.5
    const powerInfluence = (powerLevel / 100) * 0.1 // Max 10% influence
    
    // If choice is heads, increase probability of heads with power
    const headsProbability = choice === 'heads' ? 
      baseProbability + powerInfluence : 
      baseProbability - powerInfluence
    
    return Math.random() < headsProbability ? 'heads' : 'tails'
  }
}

module.exports = BattleRoyaleGameManager