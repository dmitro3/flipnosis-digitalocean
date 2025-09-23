// BattleRoyaleGameManager.js - Battle Royale Game State Management
// Extends the existing architecture to support 8-player elimination games

class BattleRoyaleGameManager {
  constructor() {
    this.battleRoyaleGames = new Map() // gameId -> BattleRoyaleState
    this.roundTimers = new Map() // gameId -> timer
    this.gameTimers = new Map() // gameId -> various timers
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
    WAITING_TARGET: 'waiting_target',     // Waiting for server to set target
    SHOWING_TARGET: 'showing_target',     // 3-second target display
    CHOOSING_FLIPPING: 'choosing_flipping', // 20-second choice + flip phase
    PROCESSING: 'processing',             // Server processing results
    SHOWING_RESULTS: 'showing_results'    // 5-second result display
  }

  // ===== GAME CREATION =====
  createBattleRoyale(gameId, gameData) {
    console.log(`🎮 Creating Battle Royale game: ${gameId}`)
    
    const battleRoyaleState = {
      // Core identifiers
      gameId,
      phase: this.PHASES.FILLING,
      roundPhase: null,
      
      // Game settings
      maxPlayers: 8,
      currentPlayers: 0,
      entryFee: gameData.entryFee || 5.00,
      serviceFee: gameData.serviceFee || 0.50,
      
      // Players
      creator: gameData.creator,
      players: new Map(), // address -> PlayerState
      playerSlots: new Array(8).fill(null), // slot positions for UI
      eliminatedPlayers: new Set(),
      activePlayers: new Set(),
      
      // Round management
      currentRound: 0,
      maxRounds: 10, // Safety limit, game should end before this
      targetResult: null, // 'heads' or 'tails' for current round
      roundDeadline: null,
      roundStartTime: null,
      
      // Results
      winner: null,
      eliminationHistory: [], // Array of round elimination data
      
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
    console.log(`✅ Battle Royale game created: ${gameId}`)
    
    // Automatically add the creator as the first player (slot 0) for free
    this.addCreatorAsPlayer(gameId, gameData.creator)
    
    return battleRoyaleState
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
      entryPaid: true, // Creator pays nothing but is marked as "paid"
      status: 'active',
      joinedAt: new Date().toISOString(),
      
      // Current round state
      choice: null, // 'heads' or 'tails'
      power: 0, // 0-10
      coinResult: null, // actual flip result
      hasFlipped: false,
      flipTime: null,
      
      // Coin customization
      coin: {
        id: 'plain',
        type: 'default',
        name: 'Classic',
        headsImage: '/coins/plainh.png',
        tailsImage: '/coins/plaint.png'
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
    game.playerSlots[0] = creatorAddress // Creator gets slot 0
    game.activePlayers.add(creatorAddress)
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

    if (playerAddress.toLowerCase() === game.creator.toLowerCase()) {
      console.error(`❌ Creator already in game as player: ${playerAddress}`)
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

    // Create player state
    const playerState = {
      address: playerAddress,
      slotNumber: assignedSlot,
      entryPaid: false, // Will be set to true when blockchain payment confirmed
      status: 'active',
      joinedAt: new Date().toISOString(),
      entryAmount: game.entryFee + game.serviceFee, // Regular players pay full amount
      
      // Current round state
      choice: null, // 'heads' or 'tails'
      power: 0, // 0-10
      coinResult: null, // actual flip result
      hasFlipped: false,
      flipTime: null,
      
      // Coin customization
      coin: {
        id: 'plain',
        type: 'default',
        name: 'Classic',
        headsImage: '/coins/plainh.png',
        tailsImage: '/coins/plaint.png'
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
    game.currentPlayers++
    game.lastActivity = Date.now()

    console.log(`✅ Player ${playerAddress} added to slot ${assignedSlot} in game ${gameId}`)

    // Check if game is ready to start (7 paying players + 1 creator = 8 total)
    if (game.currentPlayers === game.maxPlayers) {
      this.prepareGameStart(gameId)
    }

    return true
  }

  // ===== COIN MANAGEMENT =====
  updatePlayerCoin(gameId, playerAddress, coinData) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) {
      console.error(`❌ Game not found: ${gameId}`)
      return false
    }

    const player = game.players.get(playerAddress)
    if (!player) {
      console.error(`❌ Player not found in game: ${playerAddress}`)
      return false
    }

    // Update player's coin data
    player.coin = {
      id: coinData.id || 'plain',
      type: coinData.type || 'default',
      name: coinData.name || 'Classic',
      headsImage: coinData.headsImage || '/coins/plainh.png',
      tailsImage: coinData.tailsImage || '/coins/plaint.png'
    }

    game.lastActivity = Date.now()
    console.log(`✅ Updated coin for player ${playerAddress} in game ${gameId}: ${coinData.name}`)
    return true
  }

  // ===== GAME START =====
  prepareGameStart(gameId, broadcastFn) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return false

    console.log(`🎮 Preparing to start Battle Royale: ${gameId}`)
    
    game.phase = this.PHASES.STARTING
    game.startedAt = new Date().toISOString()
    game.lastActivity = Date.now()

    // 3-second countdown before first round
    if (broadcastFn) {
      broadcastFn(gameId, 'battle_royale_starting', {
        gameId,
        countdown: 3,
        message: 'Battle Royale starting in 3 seconds!'
      })
    }

    // Start first round after countdown
    setTimeout(() => {
      this.startNextRound(gameId, broadcastFn)
    }, 3000)

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
    game.roundPhase = this.ROUND_PHASES.WAITING_TARGET
    game.roundStartTime = Date.now()
    game.lastActivity = Date.now()

    // Clear previous round data
    for (const [address, player] of game.players) {
      if (game.activePlayers.has(address)) {
        player.choice = null
        player.power = 0
        player.coinResult = null
        player.hasFlipped = false
        player.flipTime = null
        player.roundsParticipated++
      }
    }

    console.log(`🎯 Starting round ${game.currentRound} for game ${gameId}`)
    console.log(`👥 Active players: ${game.activePlayers.size}`)

    // Randomly select target result
    game.targetResult = Math.random() < 0.5 ? 'heads' : 'tails'
    
    // Show target for 3 seconds
    game.roundPhase = this.ROUND_PHASES.SHOWING_TARGET
    
    if (broadcastFn) {
      broadcastFn(gameId, 'battle_royale_round_start', {
        gameId,
        round: game.currentRound,
        targetResult: game.targetResult,
        activePlayers: Array.from(game.activePlayers),
        phase: 'showing_target',
        countdown: 3
      })
    }

    // Start choice/flip phase after 3 seconds
    setTimeout(() => {
      this.startChoicePhase(gameId, broadcastFn)
    }, 3000)

    return true
  }

  startChoicePhase(gameId, broadcastFn) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return false

    game.roundPhase = this.ROUND_PHASES.CHOOSING_FLIPPING
    game.roundDeadline = Date.now() + 20000 // 20 seconds
    game.lastActivity = Date.now()

    console.log(`⏰ Starting 20-second choice/flip phase for round ${game.currentRound}`)

    if (broadcastFn) {
      broadcastFn(gameId, 'battle_royale_choice_phase', {
        gameId,
        round: game.currentRound,
        targetResult: game.targetResult,
        timeLimit: 20,
        deadline: game.roundDeadline
      })
    }

    // Set timer to auto-process round
    const timer = setTimeout(() => {
      this.processRoundResults(gameId, broadcastFn)
    }, 20000)

    this.roundTimers.set(gameId, timer)
    return true
  }

  // ===== PLAYER ACTIONS =====
  setPlayerChoice(gameId, playerAddress, choice) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return false

    const player = game.players.get(playerAddress)
    if (!player) return false

    if (game.roundPhase !== this.ROUND_PHASES.CHOOSING_FLIPPING) {
      console.error(`❌ Cannot set choice in phase: ${game.roundPhase}`)
      return false
    }

    if (!game.activePlayers.has(playerAddress)) {
      console.error(`❌ Player not active: ${playerAddress}`)
      return false
    }

    player.choice = choice
    game.lastActivity = Date.now()
    
    console.log(`🎯 ${playerAddress} chose ${choice} in round ${game.currentRound}`)
    return true
  }

  executePlayerFlip(gameId, playerAddress, power) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return false

    const player = game.players.get(playerAddress)
    if (!player) return false

    if (game.roundPhase !== this.ROUND_PHASES.CHOOSING_FLIPPING) {
      console.error(`❌ Cannot flip in phase: ${game.roundPhase}`)
      return false
    }

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

    // Execute flip with power influence
    player.power = Math.max(0, Math.min(10, power || 0))
    player.coinResult = this.calculateFlipResult(player.choice, player.power)
    player.hasFlipped = true
    player.flipTime = Date.now()
    game.lastActivity = Date.now()

    console.log(`🪙 ${playerAddress} flipped with power ${player.power}: ${player.coinResult}`)

    // Check if all active players have flipped
    const allFlipped = Array.from(game.activePlayers).every(addr => {
      const p = game.players.get(addr)
      return p && p.hasFlipped
    })

    if (allFlipped) {
      console.log(`✅ All players flipped in round ${game.currentRound}, processing results`)
      // Clear the timer and process immediately
      const timer = this.roundTimers.get(gameId)
      if (timer) {
        clearTimeout(timer)
        this.roundTimers.delete(gameId)
      }
      // Process results after a short delay for dramatic effect
      setTimeout(() => {
        this.processRoundResults(gameId)
      }, 1000)
    }

    return true
  }

  calculateFlipResult(choice, power) {
    // Power influences the probability of getting the chosen result
    // Power 0 = 50% chance, Power 10 = 85% chance
    const baseChance = 0.5
    const powerBonus = (power / 10) * 0.35 // Max 35% bonus
    const successChance = baseChance + powerBonus

    const success = Math.random() < successChance
    return success ? choice : (choice === 'heads' ? 'tails' : 'heads')
  }

  // ===== ROUND PROCESSING =====
  processRoundResults(gameId, broadcastFn) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return false

    console.log(`🔄 Processing round ${game.currentRound} results for game ${gameId}`)

    game.roundPhase = this.ROUND_PHASES.PROCESSING
    game.lastActivity = Date.now()

    // Auto-flip any players who didn't flip
    for (const playerAddress of game.activePlayers) {
      const player = game.players.get(playerAddress)
      if (!player.hasFlipped) {
        // Auto-flip with max power as penalty for not participating
        player.choice = Math.random() < 0.5 ? 'heads' : 'tails'
        player.power = 10
        player.coinResult = this.calculateFlipResult(player.choice, player.power)
        player.hasFlipped = true
        player.flipTime = Date.now()
        console.log(`⚠️ Auto-flipped ${playerAddress}: ${player.coinResult}`)
      }
    }

    // Determine eliminations
    const eliminatedThisRound = []
    const survivedThisRound = []

    for (const playerAddress of game.activePlayers) {
      const player = game.players.get(playerAddress)
      
      // Player is eliminated if their coin result doesn't match the target
      if (player.coinResult !== game.targetResult) {
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
      eliminated: eliminatedThisRound,
      survived: survivedThisRound,
      playersRemaining: game.activePlayers.size
    }

    game.eliminationHistory.push(roundData)

    console.log(`📊 Round ${game.currentRound} results:`)
    console.log(`  Target: ${game.targetResult}`)
    console.log(`  Eliminated: ${eliminatedThisRound.length} players`)
    console.log(`  Remaining: ${game.activePlayers.size} players`)

    // Show results
    game.roundPhase = this.ROUND_PHASES.SHOWING_RESULTS

    if (broadcastFn) {
      broadcastFn(gameId, 'battle_royale_round_results', {
        gameId,
        round: game.currentRound,
        targetResult: game.targetResult,
        eliminated: eliminatedThisRound,
        survived: survivedThisRound,
        playersRemaining: game.activePlayers.size,
        roundData
      })
    }

    // Check if game is complete
    if (game.activePlayers.size <= 1) {
      setTimeout(() => {
        this.completeGame(gameId, broadcastFn)
      }, 3000) // 3-second delay to show final results
    } else {
      // Start next round after 3 seconds
      setTimeout(() => {
        this.startNextRound(gameId, broadcastFn)
      }, 3000)
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
      broadcastFn(gameId, 'battle_royale_completed', {
        gameId,
        winner: game.winner,
        totalRounds: game.currentRound,
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

  // ===== UTILITY METHODS =====
  getGame(gameId) {
    return this.battleRoyaleGames.get(gameId)
  }

  getFullGameState(gameId) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return null

    return {
      ...game,
      players: Object.fromEntries(game.players),
      activePlayers: Array.from(game.activePlayers),
      eliminatedPlayers: Array.from(game.eliminatedPlayers),
      spectators: Array.from(game.spectators)
    }
  }

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

  clearGameTimers(gameId) {
    const roundTimer = this.roundTimers.get(gameId)
    if (roundTimer) {
      clearTimeout(roundTimer)
      this.roundTimers.delete(gameId)
    }

    const gameTimer = this.gameTimers.get(gameId)
    if (gameTimer) {
      clearTimeout(gameTimer)
      this.gameTimers.delete(gameId)
    }
  }

  // ===== CLEANUP =====
  removeGame(gameId) {
    this.clearGameTimers(gameId)
    this.battleRoyaleGames.delete(gameId)
    console.log(`🗑️ Removed Battle Royale game: ${gameId}`)
  }
}

module.exports = BattleRoyaleGameManager
