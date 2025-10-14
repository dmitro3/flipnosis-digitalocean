/**
 * Enhanced Physics Game Manager - Server-Side Authority
 * Handles game logic with server-side physics simulation using CANNON.js
 * All game decisions are made server-side for fair gameplay
 */

const ServerPhysicsEngine = require('./ServerPhysicsEngine')

class PhysicsGameManager {
  constructor() {
    this.games = new Map() // gameId -> gameState
    this.timers = new Map() // gameId -> intervalId
    this.physicsEngine = new ServerPhysicsEngine() // Server-side physics
  }

  // Create a new physics game
  createPhysicsGame(gameId, gameData) {
    console.log(`🎮 Creating server-side physics game: ${gameId}`)
    
    const game = {
      gameId,
      creator: gameData.creator_address || gameData.creator,
      betAmount: gameData.bet_amount,
      maxPlayers: gameData.max_players || 4, // Test tubes game is 4 players max
      currentPlayers: 0,
      phase: 'waiting', // waiting, round_active, game_over
      currentRound: 0,
      roundTimer: 60,
      players: {}, // address -> { lives, choice, hasFired, coin, isActive, slotNumber }
      playerOrder: [], // Array of addresses in slot order
      playerSlots: [], // Array of 4 slots (0-3) for test tubes
      // NFT Data
      nftContract: gameData.nft_contract,
      nftTokenId: gameData.nft_token_id,
      nftName: gameData.nft_name,
      nftImage: gameData.nft_image,
      nftCollection: gameData.nft_collection,
      nftChain: gameData.nft_chain || 'base',
      entryFee: gameData.entry_fee,
      serviceFee: gameData.service_fee,
      // Physics state
      physicsInitialized: false,
      material: 'glass' // Default material
    }

    this.games.set(gameId, game)
    
    // Initialize physics for this game
    this.physicsEngine.initializeGamePhysics(gameId, gameData)
    game.physicsInitialized = true
    
    return game
  }

  // Add a player to the game
  async addPlayer(gameId, address, dbService = null) {
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
      // Find available slot (0-3 for test tubes)
      let slotNumber = -1
      for (let i = 0; i < 4; i++) {
        if (!game.playerSlots[i]) {
          slotNumber = i
          break
        }
      }
      
      if (slotNumber === -1) {
        console.warn(`❌ No available slots in game ${gameId}`)
        return false
      }
      
      // Initialize player with basic game data
      game.players[normalizedAddress] = {
        lives: 3,
        choice: null,
        hasFired: false,
        coin: null,
        isActive: true,
        slotNumber: slotNumber
      }
      
      // Assign to slot
      game.playerSlots[slotNumber] = address

      // Fetch and add profile data if database service is available
      if (dbService) {
        try {
          const profile = await dbService.getProfileByAddress(address)
          if (profile) {
            game.players[normalizedAddress] = {
              ...game.players[normalizedAddress],
              username: profile.username,
              name: profile.name,
              avatar: profile.avatar || profile.profile_picture,
              isCreator: address.toLowerCase() === game.creator.toLowerCase()
            }
            console.log(`✅ Player ${address} profile loaded: ${profile.username || profile.name || 'No name'}`)
          } else {
            console.log(`⚠️ No profile found for ${address}`)
          }
        } catch (error) {
          console.error(`❌ Error fetching profile for ${address}:`, error)
        }
      }

      game.playerOrder.push(address) // Keep original case for display
      game.currentPlayers++
      
      console.log(`✅ Player ${address} added to game ${gameId} in slot ${slotNumber} (${game.currentPlayers}/${game.maxPlayers})`)
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

  // Server-side coin flip with physics simulation
  serverFlipCoin(gameId, address, choice, power, angle = 0, broadcast) {
    const game = this.games.get(gameId)
    if (!game || game.phase !== 'round_active') {
      console.warn(`❌ Game ${gameId} not in active round`)
      return false
    }

    const normalizedAddress = address.toLowerCase()
    const player = game.players[normalizedAddress]
    
    if (!player || !player.isActive || player.hasFired) {
      console.warn(`❌ Player ${address} cannot fire in game ${gameId}`)
      return false
    }

    if (!player.choice) {
      console.warn(`❌ Player ${address} has no choice set in game ${gameId}`)
      return false
    }

    if (choice && choice !== player.choice) {
      console.warn(`❌ Player ${address} choice mismatch: ${choice} vs ${player.choice}`)
      return false
    }

    player.hasFired = true

    // Run server-side physics simulation
    const simulationResult = this.physicsEngine.simulateCoinFlip(
      gameId, 
      player.slotNumber, 
      player.choice, 
      power, 
      angle
    )

    if (!simulationResult) {
      console.warn(`❌ Physics simulation failed for player ${address}`)
      return false
    }

    console.log(`🎲 Server-side coin flip initiated for ${address}: power=${power}, choice=${player.choice}`)

    // Broadcast the flip start to all clients
    if (broadcast) {
      const room = `game_${gameId}`
      broadcast(room, 'physics_coin_flip_start', {
        gameId: gameId,
        playerAddress: address,
        playerSlot: player.slotNumber,
        power: power,
        angle: angle,
        choice: player.choice,
        duration: simulationResult.duration
      })
    }

    // Schedule result processing after simulation completes
    setTimeout(() => {
      this.processCoinFlipResult(gameId, address, broadcast)
    }, simulationResult.duration + 100) // Small buffer

    return true
  }

  // Process coin flip result after physics simulation
  processCoinFlipResult(gameId, address, broadcast) {
    const game = this.games.get(gameId)
    if (!game) return

    const normalizedAddress = address.toLowerCase()
    const player = game.players[normalizedAddress]
    
    if (!player) return

    // Get result from physics engine
    const physicsState = this.physicsEngine.getPhysicsState(gameId)
    if (!physicsState) return

    const coinState = physicsState.coinStates[player.slotNumber]
    if (!coinState || !coinState.result) return

    const result = coinState.result
    const won = result === player.choice

    console.log(`🎲 Player ${address} result: ${result} (chose ${player.choice}) - ${won ? 'WON' : 'LOST'}`)

    // Update lives
    if (!won) {
      player.lives--
      if (player.lives <= 0) {
        player.isActive = false
        console.log(`💀 Player ${address} eliminated from game ${gameId}`)
      }
    }

    // Broadcast result to all clients
    if (broadcast) {
      const room = `game_${gameId}`
      broadcast(room, 'physics_coin_result', {
        gameId: gameId,
        playerAddress: address,
        playerSlot: player.slotNumber,
        result: result,
        won: won,
        lives: player.lives,
        isActive: player.isActive
      })
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

  // Fire coin (legacy method - now redirects to server-side)
  fireCoin(gameId, address, angle, power, broadcast) {
    console.log(`🔄 Redirecting fireCoin to server-side simulation`)
    return this.serverFlipCoin(gameId, address, null, power, angle, broadcast)
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
        
        // Broadcast timer update only every 5 seconds to reduce spam
        if (broadcast && game.roundTimer % 5 === 0) {
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

    // Check if game is over
    const activePlayers = Object.values(game.players).filter(p => p.isActive)
    
    if (activePlayers.length <= 1) {
      // Game over
      game.phase = 'game_over'
      const winner = activePlayers[0] ? Object.keys(game.players).find(k => game.players[k] === activePlayers[0]) : null
      console.log(`🏆 Game ${gameId} ended - Winner: ${winner || 'None'}`)
      
      // Cleanup physics
      this.physicsEngine.cleanupGamePhysics(gameId)
    } else {
      // Next round - reset physics and player states
      this.physicsEngine.resetGameForNewRound(gameId)
      this.physicsEngine.updateGamePhase(gameId, 'round_active')
      
      // Reset player states
      Object.values(game.players).forEach(player => {
        if (player.isActive) {
          player.choice = null
          player.hasFired = false
        }
      })
      
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

    // Get physics state if available
    const physicsState = this.physicsEngine.getPhysicsState(gameId)

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
      playerSlots: game.playerSlots, // Use actual slot array
      // NFT Data
      nftContract: game.nftContract,
      nftTokenId: game.nftTokenId,
      nftName: game.nftName,
      nftImage: game.nftImage,
      nftCollection: game.nftCollection,
      nftChain: game.nftChain,
      entryFee: game.entryFee,
      serviceFee: game.serviceFee,
      // Physics Data
      physicsInitialized: game.physicsInitialized,
      material: game.material,
      coinStates: physicsState ? physicsState.coinStates : null
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
    
    // Cleanup physics
    this.physicsEngine.cleanupGamePhysics(gameId)
    
    this.games.delete(gameId)
    console.log(`🧹 Game ${gameId} removed`)
  }

  // Update material for game
  updateGameMaterial(gameId, materialName) {
    const game = this.games.get(gameId)
    if (!game) return false
    
    const success = this.physicsEngine.updateGameMaterial(gameId, materialName)
    if (success) {
      game.material = materialName
      console.log(`💎 Game ${gameId} material updated to ${materialName}`)
    }
    
    return success
  }
}

module.exports = PhysicsGameManager
