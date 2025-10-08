/**
 * Simplified Physics Game Manager - No CANNON.js
 * Handles game logic without complex physics simulation
 * The 3D visualization is now just simple vertical tube animations
 */

class PhysicsGameManager {
  constructor() {
    this.games = new Map() // gameId -> gameState
    this.timers = new Map() // gameId -> intervalId
  }

  // Create a new physics game
  createPhysicsGame(gameId, gameData) {
    console.log(`🎮 Creating simplified physics game: ${gameId}`)
    
    const game = {
      gameId,
      creator: gameData.creator_address || gameData.creator,
      betAmount: gameData.bet_amount,
      maxPlayers: gameData.max_players || 6,
      currentPlayers: 0,
      phase: 'waiting', // waiting, round_active, game_over
      currentRound: 0,
      roundTimer: 60,
      players: {}, // address -> { lives, choice, hasFired, coin, isActive, slotNumber }
      playerOrder: [], // Array of addresses in slot order
      // NFT Data
      nftContract: gameData.nft_contract,
      nftTokenId: gameData.nft_token_id,
      nftName: gameData.nft_name,
      nftImage: gameData.nft_image,
      nftCollection: gameData.nft_collection,
      nftChain: gameData.nft_chain || 'base',
      entryFee: gameData.entry_fee,
      serviceFee: gameData.service_fee,
    }

    this.games.set(gameId, game)
    return game
  }

  // Add a player to the game
  addPlayer(gameId, address) {
    const game = this.games.get(gameId)
    if (!game) {
      console.warn(`❌ Game ${gameId} not found`)
      return false
    }

    if (game.currentPlayers >= game.maxPlayers) {
      console.warn(`❌ Game ${gameId} is full`)
      return false
    }

    const normalizedAddress = address.toLowerCase()
    
    if (!game.players[normalizedAddress]) {
      game.players[normalizedAddress] = {
        lives: 3,
        choice: null,
        hasFired: false,
        coin: null,
        isActive: true,
        slotNumber: game.currentPlayers
      }
      game.playerOrder.push(address) // Keep original case for display
      game.currentPlayers++
      
      console.log(`✅ Player ${address} added to game ${gameId} (${game.currentPlayers}/${game.maxPlayers})`)
      return true
    }

    return false
  }

  // Update player's coin
  updatePlayerCoin(gameId, address, coin) {
    const game = this.games.get(gameId)
    if (!game) return false

    const normalizedAddress = address.toLowerCase()
    const player = game.players[normalizedAddress]
    
    if (player) {
      player.coin = coin
      console.log(`✅ Player ${address} updated coin in game ${gameId}`)
      return true
    }

    return false
  }

  // Start the game
  startGame(gameId, broadcast) {
    const game = this.games.get(gameId)
    if (!game) return

    if (game.phase !== 'waiting') {
      console.warn(`❌ Game ${gameId} already started`)
      return
    }

    game.phase = 'round_active'
    game.currentRound = 1
    game.roundTimer = 60

    console.log(`🎮 Game ${gameId} started - Round ${game.currentRound}`)

    // Start round timer
    this.startRoundTimer(gameId, broadcast)

    // Broadcast state
    if (broadcast) {
      this.broadcastState(gameId, broadcast)
    }
  }

  // Set player choice (heads/tails)
  setChoice(gameId, address, choice) {
    const game = this.games.get(gameId)
    if (!game || game.phase !== 'round_active') return false

    const normalizedAddress = address.toLowerCase()
    const player = game.players[normalizedAddress]
    
    if (player && player.isActive && !player.hasFired) {
      player.choice = choice
      console.log(`✅ Player ${address} chose ${choice} in game ${gameId}`)
      return true
    }

    return false
  }

  // Fire coin (simplified - no physics, just outcomes)
  fireCoin(gameId, address, angle, power, broadcast) {
    const game = this.games.get(gameId)
    if (!game || game.phase !== 'round_active') return

    const normalizedAddress = address.toLowerCase()
    const player = game.players[normalizedAddress]
    
    if (!player || !player.isActive || player.hasFired || !player.choice) {
      console.warn(`❌ Player ${address} cannot fire in game ${gameId}`)
      return
    }

    player.hasFired = true

    // Simplified outcome - random flip
    const result = Math.random() < 0.5 ? 'heads' : 'tails'
    const won = result === player.choice

    console.log(`🎲 Player ${address} flipped ${result} (chose ${player.choice}) - ${won ? 'WON' : 'LOST'}`)

    // Update lives
    if (!won) {
      player.lives--
      if (player.lives <= 0) {
        player.isActive = false
        console.log(`💀 Player ${address} eliminated from game ${gameId}`)
      }
    }

    // Check if round is over (all active players have fired)
    const allFired = Object.values(game.players)
      .filter(p => p.isActive)
      .every(p => p.hasFired)

    if (allFired) {
      this.endRound(gameId, broadcast)
    } else if (broadcast) {
      this.broadcastState(gameId, broadcast)
    }
  }

  // Start round timer
  startRoundTimer(gameId, broadcast) {
    // Clear existing timer
    if (this.timers.has(gameId)) {
      clearInterval(this.timers.get(gameId))
    }

    const game = this.games.get(gameId)
    if (!game) return

    const timerId = setInterval(() => {
      if (game.roundTimer > 0) {
        game.roundTimer--
        
        // Broadcast timer update every second
        if (broadcast && game.roundTimer % 1 === 0) {
          this.broadcastState(gameId, broadcast)
        }
      } else {
        // Time's up - end round
        this.endRound(gameId, broadcast)
      }
    }, 1000)

    this.timers.set(gameId, timerId)
  }

  // End round
  endRound(gameId, broadcast) {
    const game = this.games.get(gameId)
    if (!game) return

    // Clear timer
    if (this.timers.has(gameId)) {
      clearInterval(this.timers.get(gameId))
      this.timers.delete(gameId)
    }

    // Reset for next round
    Object.values(game.players).forEach(player => {
      if (player.isActive) {
        player.choice = null
        player.hasFired = false
      }
    })

    // Check if game is over
    const activePlayers = Object.values(game.players).filter(p => p.isActive)
    
    if (activePlayers.length <= 1) {
      // Game over
      game.phase = 'game_over'
      console.log(`🏆 Game ${gameId} ended - Winner: ${activePlayers[0] ? Object.keys(game.players).find(k => game.players[k] === activePlayers[0]) : 'None'}`)
    } else {
      // Next round
      game.currentRound++
      game.roundTimer = 60
      this.startRoundTimer(gameId, broadcast)
      console.log(`🎮 Game ${gameId} - Round ${game.currentRound} started`)
    }

    if (broadcast) {
      this.broadcastState(gameId, broadcast)
    }
  }

  // Get game state
  getGame(gameId) {
    return this.games.get(gameId)
  }

  // Get full game state for client
  getFullGameState(gameId) {
    const game = this.games.get(gameId)
    if (!game) return null

    return {
      gameId: game.gameId,
      creator: game.creator,
      betAmount: game.betAmount,
      maxPlayers: game.maxPlayers,
      currentPlayers: game.currentPlayers,
      phase: game.phase,
      currentRound: game.currentRound,
      roundTimer: game.roundTimer,
      players: game.players,
      playerOrder: game.playerOrder,
      playerSlots: game.playerOrder, // Alias for compatibility
      // NFT Data
      nftContract: game.nftContract,
      nftTokenId: game.nftTokenId,
      nftName: game.nftName,
      nftImage: game.nftImage,
      nftCollection: game.nftCollection,
      nftChain: game.nftChain,
      entryFee: game.entryFee,
      serviceFee: game.serviceFee,
    }
  }

  // Broadcast state to all players
  broadcastState(gameId, broadcast) {
    const state = this.getFullGameState(gameId)
    if (state && broadcast) {
      const room = `game_${gameId}`
      broadcast(room, 'physics_state_update', state)
    }
  }

  // Cleanup
  removeGame(gameId) {
    if (this.timers.has(gameId)) {
      clearInterval(this.timers.get(gameId))
      this.timers.delete(gameId)
    }
    this.games.delete(gameId)
    console.log(`🧹 Game ${gameId} removed`)
  }
}

module.exports = PhysicsGameManager
