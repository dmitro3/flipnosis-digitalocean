// BattleRoyaleGameManager.js - Server-Controlled Battle Royale
// Single source of truth for all game logic

class BattleRoyaleGameManager {
  constructor() {
    this.games = new Map() // gameId -> GameState
    this.roundTimers = new Map() // gameId -> timer
  }

  PHASES = {
    FILLING: 'filling',
    STARTING: 'starting',
    ROUND_ACTIVE: 'round_active',
    ROUND_RESULT: 'round_result',
    COMPLETED: 'completed'
  }

  // ===== CREATE GAME =====
  createBattleRoyale(gameId, gameData, dbService = null) {
    console.log(`🎮 Creating Battle Royale: ${gameId}`)
    
    const game = {
      gameId,
      phase: this.PHASES.FILLING,
      maxPlayers: 6,
      currentPlayers: gameData.current_players || 0,
      entryFee: gameData.entry_fee || 5.00,
      serviceFee: gameData.service_fee || 0.50,
      creator: gameData.creator,
      players: {}, // address -> PlayerState
      playerSlots: [null, null, null, null, null, null],
      activePlayers: [],
      currentRound: 0,
      roundCountdown: null,
      nftContract: gameData.nft_contract,
      nftTokenId: gameData.nft_token_id,
      nftName: gameData.nft_name,
      nftImage: gameData.nft_image,
      nftCollection: gameData.nft_collection,
      nftChain: gameData.nft_chain || 'base',
      winner: null,
      createdAt: new Date().toISOString()
    }

    this.games.set(gameId, game)
    
    // Auto-add creator if they participate
    if (gameData.creator_participates === true || gameData.creator_participates === 1) {
      this.addCreatorAsPlayer(gameId, gameData.creator)
    }
    
    return game
  }

  // ===== ADD CREATOR =====
  addCreatorAsPlayer(gameId, creatorAddress) {
    const game = this.games.get(gameId)
    const normalizedAddress = creatorAddress.toLowerCase()
    
    if (!game || game.players[normalizedAddress]) return

    game.players[normalizedAddress] = {
      address: creatorAddress, // Store original case for display
      slotNumber: 0,
      isCreator: true,
      entryPaid: true,
      status: 'active',
      coin: { 
        id: 'plain', 
        type: 'default', 
        name: 'Classic',
        headsImage: '/coins/plainh.png',
        tailsImage: '/coins/plaint.png'
      },
      choice: null,
      hasFlipped: false,
      flipResult: null,
      joinedAt: new Date().toISOString()
    }

    game.playerSlots[0] = normalizedAddress
    game.activePlayers.push(normalizedAddress)
    game.currentPlayers = 1

    console.log(`✅ Creator added: ${creatorAddress} (normalized: ${normalizedAddress})`)
  }

  // ===== ADD PLAYER =====
  addPlayer(gameId, playerAddress) {
    const game = this.games.get(gameId)
    if (!game || game.phase !== this.PHASES.FILLING) return false
    if (game.currentPlayers >= 6) return false
    
    // Normalize address to lowercase for consistent storage
    const normalizedAddress = playerAddress.toLowerCase()
    
    // Check if player already exists
    if (game.players[normalizedAddress]) {
      console.log(`⚠️ Player ${playerAddress} already in game`)
      return false
    }

    // Find first empty slot
    const slotIndex = game.playerSlots.findIndex(slot => slot === null)
    if (slotIndex === -1) {
      console.log(`❌ No empty slots available for ${playerAddress}`)
      return false
    }

    console.log(`🎮 Adding player ${playerAddress} to slot ${slotIndex} (normalized: ${normalizedAddress})`)

    game.players[normalizedAddress] = {
      address: playerAddress, // Store original case for display
      slotNumber: slotIndex,
      isCreator: false,
      entryPaid: true,
      status: 'active',
      coin: { 
        id: 'plain', 
        type: 'default', 
        name: 'Classic',
        headsImage: '/coins/plainh.png',
        tailsImage: '/coins/plaint.png'
      },
      choice: null,
      hasFlipped: false,
      flipResult: null,
      joinedAt: new Date().toISOString()
    }

    game.playerSlots[slotIndex] = normalizedAddress
    game.activePlayers.push(normalizedAddress)
    game.currentPlayers++

    console.log(`✅ Player joined: ${playerAddress} in slot ${slotIndex} (${game.currentPlayers}/6)`)
    console.log(`📊 Current player slots:`, game.playerSlots)
    console.log(`📊 Current players (normalized):`, Object.keys(game.players))

    // Auto-start if full
    if (game.currentPlayers === 6) {
      game.readyToStart = true
    }

    return true
  }

  // ===== START GAME =====
  prepareGameStart(gameId, broadcastFn) {
    const game = this.games.get(gameId)
    if (!game) return false

    console.log(`🚀 Starting game: ${gameId}`)
    game.phase = this.PHASES.STARTING

    broadcastFn(`game_${gameId}`, 'battle_royale_starting', {
      gameId,
      countdown: 3
    })

    setTimeout(() => {
      this.startNextRound(gameId, broadcastFn)
    }, 3000)

    return true
  }

  // ===== START ROUND =====
  startNextRound(gameId, broadcastFn) {
    const game = this.games.get(gameId)
    if (!game) return false

    // Check win condition
    if (game.activePlayers.length <= 1) {
      return this.completeGame(gameId, broadcastFn)
    }

    game.currentRound++
    game.phase = this.PHASES.ROUND_ACTIVE
    game.roundCountdown = 20

    // Reset player states
    game.activePlayers.forEach(addr => {
      const player = game.players[addr]
      if (player) {
        player.choice = null
        player.hasFlipped = false
        player.flipResult = null
      }
    })

    console.log(`🎯 Round ${game.currentRound} started`)

    broadcastFn(`game_${gameId}`, 'battle_royale_round_start', {
      gameId,
      round: game.currentRound
    })

    this.broadcastState(gameId, broadcastFn)

    // Countdown timer
    const timer = setInterval(() => {
      game.roundCountdown--
      
      if (game.roundCountdown <= 0) {
        clearInterval(timer)
        this.endRound(gameId, broadcastFn)
      } else {
        this.broadcastState(gameId, broadcastFn)
      }
    }, 1000)

    this.roundTimers.set(gameId, timer)
    return true
  }

  // ===== PLAYER CHOICE =====
  setPlayerChoice(gameId, playerAddress, choice) {
    const game = this.games.get(gameId)
    if (!game || game.phase !== this.PHASES.ROUND_ACTIVE) return false

    const normalizedAddress = playerAddress.toLowerCase()
    const player = game.players[normalizedAddress]
    if (!player || player.hasFlipped) return false

    player.choice = choice
    console.log(`🎯 ${playerAddress} chose ${choice}`)
    return true
  }

  // ===== FLIP COIN =====
  executePlayerFlip(gameId, playerAddress, broadcastFn) {
    const game = this.games.get(gameId)
    if (!game || game.phase !== this.PHASES.ROUND_ACTIVE) return false

    const normalizedAddress = playerAddress.toLowerCase()
    const player = game.players[normalizedAddress]
    if (!player || player.hasFlipped || !player.choice) return false

    // Calculate result (50/50)
    const flipResult = Math.random() < 0.5 ? 'heads' : 'tails'
    
    player.hasFlipped = true
    player.flipResult = flipResult

    console.log(`🪙 ${playerAddress} flipped: ${flipResult} (chose ${player.choice})`)

    // Broadcast individual flip
    broadcastFn(`game_${gameId}`, 'battle_royale_player_flipped', {
      gameId,
      playerAddress,
      flipResult
    })

    this.broadcastState(gameId, broadcastFn)
    return true
  }

  // ===== END ROUND =====
  endRound(gameId, broadcastFn) {
    const game = this.games.get(gameId)
    if (!game) return false

    console.log(`🏁 Ending round ${game.currentRound}`)

    // Clear timer
    const timer = this.roundTimers.get(gameId)
    if (timer) {
      clearInterval(timer)
      this.roundTimers.delete(gameId)
    }

    // AUTO-FLIP for players who didn't flip
    game.activePlayers.forEach(addr => {
      const player = game.players[addr]
      if (!player.hasFlipped) {
        console.log(`⚠️ Auto-flipping for ${addr}`)
        if (!player.choice) player.choice = 'heads' // Default choice
        player.flipResult = Math.random() < 0.5 ? 'heads' : 'tails'
        player.hasFlipped = true
      }
    })

    // Determine eliminations
    const eliminated = []
    const survived = []

    game.activePlayers.forEach(addr => {
      const player = game.players[addr]
      const survivedRound = player.flipResult === player.choice

      if (survivedRound) {
        survived.push(addr)
      } else {
        eliminated.push(addr)
        player.status = 'eliminated'
        player.eliminatedInRound = game.currentRound
      }
    })

    game.activePlayers = survived

    console.log(`📊 Round results: ${eliminated.length} eliminated, ${survived.length} survived`)

    broadcastFn(`game_${gameId}`, 'battle_royale_round_end', {
      gameId,
      round: game.currentRound,
      eliminatedPlayers: eliminated,
      survivingPlayers: survived
    })

    this.broadcastState(gameId, broadcastFn)

    // Check for winner or continue
    if (game.activePlayers.length <= 1) {
      setTimeout(() => this.completeGame(gameId, broadcastFn), 3000)
    } else {
      setTimeout(() => this.startNextRound(gameId, broadcastFn), 5000)
    }

    return true
  }

  // ===== COMPLETE GAME =====
  completeGame(gameId, broadcastFn) {
    const game = this.games.get(gameId)
    if (!game) return false

    game.phase = this.PHASES.COMPLETED
    game.winner = game.activePlayers[0] || null

    console.log(`🏆 Game complete: ${game.winner || 'No winner'}`)

    broadcastFn(`game_${gameId}`, 'battle_royale_game_complete', {
      gameId,
      winner: game.winner,
      totalRounds: game.currentRound
    })

    this.broadcastState(gameId, broadcastFn)
    return true
  }

  // ===== UPDATE COIN =====
  async updatePlayerCoin(gameId, playerAddress, coinData, dbService = null) {
    console.log(`🪙 updatePlayerCoin called: gameId=${gameId}, playerAddress=${playerAddress}, coinData=`, coinData)
    
    let game = this.games.get(gameId)
    if (!game && dbService) {
      console.log(`🔄 Game not in memory, loading from database: ${gameId}`)
      game = await this.loadGameFromDatabase(gameId, dbService)
    }
    
    if (!game) {
      console.log(`❌ Game not found: ${gameId}`)
      console.log(`Available games:`, Array.from(this.games.keys()))
      return false
    }

    console.log(`🎮 Game found, current phase: ${game.phase}`)
    console.log(`🎮 Available players:`, Object.keys(game.players))

    // Allow coin updates during filling and starting phases
    if (game.phase !== this.PHASES.FILLING && game.phase !== this.PHASES.STARTING) {
      console.log(`❌ Cannot update coin - game phase is ${game.phase}`)
      return false
    }

    // Normalize address for lookup
    const normalizedAddress = playerAddress.toLowerCase()
    const player = game.players[normalizedAddress]
    
    if (!player) {
      console.log(`❌ Player not found: ${playerAddress} (normalized: ${normalizedAddress})`)
      console.log(`Available players (normalized):`, Object.keys(game.players))
      return false
    }

    player.coin = coinData
    console.log(`✅ Coin updated for ${playerAddress}:`, coinData.name)
    return true
  }

  // ===== STATE =====
  getGame(gameId) {
    return this.games.get(gameId)
  }

  // ===== LOAD GAME FROM DB =====
  async loadGameFromDatabase(gameId, dbService) {
    if (this.games.has(gameId)) {
      return this.games.get(gameId) // Already loaded
    }

    try {
      const gameData = await dbService.getBattleRoyaleGame(gameId)
      if (gameData && gameData.status === 'filling') {
        console.log(`🔄 Loading game from database: ${gameId}`)
        return this.createBattleRoyale(gameId, gameData, dbService)
      }
    } catch (error) {
      console.error(`❌ Error loading game ${gameId} from database:`, error)
    }

    return null
  }

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
      playerSlots: game.playerSlots,
      activePlayers: game.activePlayers,
      currentRound: game.currentRound,
      roundCountdown: game.roundCountdown,
      nftName: game.nftName,
      nftImage: game.nftImage,
      nftCollection: game.nftCollection,
      nftContract: game.nftContract,
      nftTokenId: game.nftTokenId,
      nftChain: game.nftChain,
      winner: game.winner
    }
  }

  broadcastState(gameId, broadcastFn) {
    const state = this.getFullGameState(gameId)
    if (state) {
      broadcastFn(`game_${gameId}`, 'battle_royale_state_update', state)
    }
  }

  // ===== CLEANUP =====
  removeGame(gameId) {
    const timer = this.roundTimers.get(gameId)
    if (timer) {
      clearInterval(timer)
      this.roundTimers.delete(gameId)
    }
    this.games.delete(gameId)
    console.log(`🗑️ Game removed: ${gameId}`)
  }
}

module.exports = BattleRoyaleGameManager