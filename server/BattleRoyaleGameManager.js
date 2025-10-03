// BattleRoyaleGameManager.js - Server-Controlled Battle Royale
// Manages 6-player Battle Royale with server-side coin flips

class BattleRoyaleGameManager {
  constructor() {
    this.battleRoyaleGames = new Map() // gameId -> BattleRoyaleState
    this.roundTimers = new Map() // gameId -> timer
    this.gameTimers = new Map() // gameId -> various timers
  }

  // ===== BATTLE ROYALE PHASES =====
  PHASES = {
    FILLING: 'filling',
    STARTING: 'starting',
    ROUND_ACTIVE: 'round_active',
    ROUND_RESULT: 'round_result',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  }

  // ===== GAME CREATION =====
  createBattleRoyale(gameId, gameData, dbService = null) {
    console.log(`🎮 Creating Battle Royale game: ${gameId}`)
    
    const battleRoyaleState = {
      gameId,
      phase: this.PHASES.FILLING,
      
      maxPlayers: 6,
      currentPlayers: 0,
      entryFee: gameData.entryFee || 5.00,
      serviceFee: gameData.serviceFee || 0.50,
      
      creator: gameData.creator,
      players: new Map(), // address -> PlayerState
      playerSlots: new Array(6).fill(null),
      eliminatedPlayers: new Set(),
      activePlayers: new Set(),
      
      currentRound: 0,
      maxRounds: 10,
      roundStartTime: null,
      roundCountdown: null,
      
      winner: null,
      eliminationHistory: [],
      
      nftContract: gameData.nftContract,
      nftTokenId: gameData.nftTokenId,
      nftName: gameData.nftName,
      nftImage: gameData.nftImage,
      nftCollection: gameData.nftCollection,
      
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      lastActivity: Date.now(),
      
      spectators: new Set()
    }

    this.battleRoyaleGames.set(gameId, battleRoyaleState)
    console.log(`✅ Battle Royale game created in memory: ${gameId}`)
    
    if (dbService) {
      this.saveGameToDatabase(gameId, gameData, dbService)
    }
    
    if (gameData.creator_participates === true || gameData.creator_participates === 1) {
      this.addCreatorAsPlayer(gameId, gameData.creator)
    }
    
    return battleRoyaleState
  }

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
        max_players: 6,
        game_type: 'battle_royale',
        phase: this.PHASES.FILLING,
        status: 'waiting'
      }
      
      await dbService.createGame(dbGameData)
      console.log(`✅ Battle Royale game saved to database: ${gameId}`)
    } catch (error) {
      console.error(`❌ Failed to save Battle Royale game to database: ${gameId}`, error)
    }
  }

  // ===== PLAYER MANAGEMENT =====
  addCreatorAsPlayer(gameId, creatorAddress) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return false

    if (game.players.has(creatorAddress)) {
      console.log(`ℹ️ Creator already added to game: ${creatorAddress}`)
      return true
    }

    const creatorState = {
      address: creatorAddress,
      slotNumber: 0,
      entryPaid: true,
      status: 'active',
      joinedAt: new Date().toISOString(),
      
      choice: null,
      hasFlipped: false,
      flipTime: null,
      flipResult: null,
      
      coin: {
        id: 'plain',
        type: 'default',
        name: 'Classic',
        headsImage: '/coins/plainh.png',
        tailsImage: '/coins/plaint.png'
      },
      
      roundsParticipated: 0,
      roundsSurvived: 0,
      eliminatedInRound: null,
      
      isCreator: true,
      entryAmount: 0
    }

    game.players.set(creatorAddress, creatorState)
    game.playerSlots[0] = creatorAddress
    game.activePlayers.add(creatorAddress)
    game.currentPlayers++
    game.lastActivity = Date.now()

    console.log(`✅ Creator ${creatorAddress} added as first player in game ${gameId}`)
    
    // ADD THIS: Force a state update to be broadcast
    // Store a flag that tells socket handlers to broadcast this
    game.needsStateBroadcast = true
    
    return true
  }

  addPlayer(gameId, playerAddress, slotNumber = null) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return false

    if (game.phase !== this.PHASES.FILLING) {
      console.error(`❌ Cannot join game in phase: ${game.phase}`)
      return false
    }

    if (game.currentPlayers >= game.maxPlayers) return false
    if (game.players.has(playerAddress)) return false

    let assignedSlot = slotNumber
    if (assignedSlot === null || game.playerSlots[assignedSlot] !== null || assignedSlot === 0) {
      assignedSlot = game.playerSlots.findIndex((slot, index) => slot === null && index > 0)
      if (assignedSlot === -1) return false
    }

    const playerState = {
      address: playerAddress,
      slotNumber: assignedSlot,
      entryPaid: false,
      status: 'active',
      joinedAt: new Date().toISOString(),
      entryAmount: game.entryFee / 6,
      
      choice: null,
      hasFlipped: false,
      flipTime: null,
      flipResult: null,
      
      coin: {
        id: 'plain',
        type: 'default',
        name: 'Classic',
        headsImage: '/coins/plainh.png',
        tailsImage: '/coins/plaint.png'
      },
      
      roundsParticipated: 0,
      roundsSurvived: 0,
      eliminatedInRound: null
    }

    game.players.set(playerAddress, playerState)
    game.playerSlots[assignedSlot] = playerAddress
    game.activePlayers.add(playerAddress)
    game.currentPlayers++
    game.lastActivity = Date.now()

    console.log(`✅ Player ${playerAddress} added to slot ${assignedSlot}`)

    if (game.currentPlayers === game.maxPlayers) {
      console.log(`🎮 Game ${gameId} is full - ready to start!`)
      game.readyToStart = true
    }

    return true
  }

  // ===== GAME START =====
  prepareGameStart(gameId, broadcastFn) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return false
    
    game.phase = this.PHASES.STARTING
    game.startedAt = new Date().toISOString()
    game.lastActivity = Date.now()

    console.log(`🎮 Starting countdown for Battle Royale: ${gameId}`)

    if (broadcastFn) {
      // Send initial countdown event
      broadcastFn(`br_${gameId}`, 'battle_royale_starting', {
        gameId,
        countdown: 10,
        message: 'Battle Royale starting in 10 seconds!'
      })
      
      // Broadcast state update so UI switches to countdown view
      const fullState = this.getFullGameState(gameId)
      broadcastFn(`br_${gameId}`, 'battle_royale_state_update', fullState)
    }

    // CREATE A VISIBLE COUNTDOWN (10 seconds)
    let countdown = 10
    const countdownInterval = setInterval(() => {
      countdown--
      
      if (broadcastFn) {
        broadcastFn(`br_${gameId}`, 'battle_royale_countdown', {
          gameId,
          countdown,
          message: `Game starting in ${countdown}...`
        })
      }
      
      if (countdown <= 0) {
        clearInterval(countdownInterval)
        console.log(`⏰ Countdown complete, starting first round for: ${gameId}`)
        this.startNextRound(gameId, broadcastFn)
      }
    }, 1000)

    // Store interval for cleanup
    this.gameTimers.set(`${gameId}_countdown`, countdownInterval)

    return true
  }

  // ===== ROUND MANAGEMENT =====
  startNextRound(gameId, broadcastFn) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return false

    if (game.activePlayers.size <= 1) {
      return this.completeGame(gameId, broadcastFn)
    }

    game.currentRound++
    game.phase = this.PHASES.ROUND_ACTIVE
    game.roundStartTime = Date.now()
    game.roundCountdown = 20
    game.lastActivity = Date.now()

    // Reset all player states
    for (const [address, player] of game.players) {
      if (game.activePlayers.has(address)) {
        player.choice = null
        player.hasFlipped = false
        player.flipTime = null
        player.flipResult = null
        player.roundsParticipated++
      }
    }

    console.log(`🎯 Starting round ${game.currentRound}`)

    if (broadcastFn) {
      broadcastFn(`br_${gameId}`, 'battle_royale_round_start', {
        gameId,
        round: game.currentRound,
        roundDuration: 20000,
        activePlayers: Array.from(game.activePlayers)
      })
      
      const fullState = this.getFullGameState(gameId)
      broadcastFn(`br_${gameId}`, 'battle_royale_state_update', fullState)
    }

    // Start countdown
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

    if (game.phase !== this.PHASES.ROUND_ACTIVE) {
      console.error(`❌ Cannot make choice in phase: ${game.phase}`)
      return false
    }

    player.choice = choice
    game.lastActivity = Date.now()
    
    console.log(`✅ ${playerAddress} chose ${choice}`)
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

    if (!player.choice) {
      console.log(`❌ Player ${playerAddress} didn't choose - cannot flip`)
      return false
    }

    // Pure 50/50 flip
    const flipResult = this.calculateFlipResult()
    
    player.hasFlipped = true
    player.flipTime = Date.now()
    player.flipResult = flipResult
    game.lastActivity = Date.now()

    console.log(`🪙 ${playerAddress} flipped: chose ${player.choice}, got ${flipResult}`)

    if (broadcastFn) {
      broadcastFn(`br_${gameId}`, 'battle_royale_player_flipped', {
        gameId,
        playerAddress,
        flipResult,
        survived: flipResult === player.choice
      })
      
      const fullState = this.getFullGameState(gameId)
      broadcastFn(`br_${gameId}`, 'battle_royale_state_update', fullState)
    }

    return true
  }

  calculateFlipResult() {
    // Pure 50/50 - no power influence
    return Math.random() < 0.5 ? 'heads' : 'tails'
  }

  // ===== ROUND PROCESSING =====
  endRound(gameId, broadcastFn) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return false

    console.log(`🔄 Ending round ${game.currentRound}`)

    game.lastActivity = Date.now()

    if (this.roundTimers.has(gameId)) {
      clearInterval(this.roundTimers.get(gameId))
      this.roundTimers.delete(gameId)
    }

    // Auto-eliminate players who didn't flip
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
    }

    // Update active players
    for (const playerAddress of eliminatedThisRound) {
      game.activePlayers.delete(playerAddress)
    }

    const roundData = {
      round: game.currentRound,
      eliminatedPlayers: eliminatedThisRound,
      survivingPlayers: survivedThisRound,
      playersRemaining: game.activePlayers.size
    }

    game.eliminationHistory.push(roundData)

    console.log(`📊 Round ${game.currentRound} results: ${eliminatedThisRound.length} eliminated, ${game.activePlayers.size} remaining`)

    if (broadcastFn) {
      broadcastFn(`br_${gameId}`, 'battle_royale_round_end', {
        gameId,
        round: game.currentRound,
        eliminatedPlayers: eliminatedThisRound,
        survivingPlayers: survivedThisRound,
        playersRemaining: game.activePlayers.size
      })
    }

    if (game.activePlayers.size <= 1) {
      setTimeout(() => {
        this.completeGame(gameId, broadcastFn)
      }, 3000)
    } else {
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

    if (game.activePlayers.size === 1) {
      game.winner = Array.from(game.activePlayers)[0]
      const winnerPlayer = game.players.get(game.winner)
      if (winnerPlayer) {
        winnerPlayer.status = 'winner'
      }
    }

    console.log(`🎉 Battle Royale winner: ${game.winner || 'None'}`)

    if (broadcastFn) {
      broadcastFn(`br_${gameId}`, 'battle_royale_game_complete', {
        gameId,
        winner: game.winner,
        totalRounds: game.currentRound,
        finalPrize: game.nftName
      })
    }

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

    const players = {}
    for (const [address, player] of game.players) {
      players[address] = { ...player }
    }

    return {
      gameId: game.gameId,
      phase: game.phase,
      
      maxPlayers: game.maxPlayers,
      currentPlayers: game.currentPlayers,
      
      creator: game.creator,
      players: players,
      playerSlots: game.playerSlots,
      activePlayers: Array.from(game.activePlayers),
      eliminatedPlayers: Array.from(game.eliminatedPlayers),
      
      currentRound: game.currentRound,
      roundCountdown: game.roundCountdown,
      startCountdown: game.startCountdown || null,
      
      winner: game.winner,
      eliminationHistory: game.eliminationHistory,
      
      nftName: game.nftName,
      nftImage: game.nftImage,
      
      spectators: Array.from(game.spectators),
      lastActivity: game.lastActivity
    }
  }

  // ===== COIN UPDATE =====
  updatePlayerCoin(gameId, playerAddress, coinData) {
    const game = this.battleRoyaleGames.get(gameId)
    if (!game) return false

    const player = game.players.get(playerAddress)
    if (!player) return false

    player.coin = {
      id: coinData.id || 'plain',
      type: coinData.type || 'default',
      name: coinData.name || 'Classic',
      headsImage: coinData.headsImage || '/coins/plainh.png',
      tailsImage: coinData.tailsImage || '/coins/plaint.png'
    }

    game.lastActivity = Date.now()
    console.log(`✅ Updated coin for ${playerAddress}: ${coinData.name}`)
    return true
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
    const roundTimer = this.roundTimers.get(gameId)
    if (roundTimer) {
      clearInterval(roundTimer)
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
