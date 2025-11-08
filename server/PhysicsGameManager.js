/**
 * Enhanced Physics Game Manager - Server-Side Authority
 * Handles game logic with server-side physics simulation using CANNON.js
 * All game decisions are made server-side for fair gameplay
 */

const ServerPhysicsEngine = require('./ServerPhysicsEngine')

class PhysicsGameManager {
  constructor(blockchainService = null, dbService = null) {
    this.games = new Map() // gameId -> gameState
    this.timers = new Map() // gameId -> intervalId
    this.physicsEngine = new ServerPhysicsEngine() // Server-side physics
    this.blockchainService = blockchainService // Blockchain service for contract interactions
    this.dbService = dbService // Database service for game updates
  }

  // Create a new physics game
  createPhysicsGame(gameId, gameData) {
    console.log(`🎮 Creating server-side physics game: ${gameId}`)
    console.log(`🎨 Game data room_type:`, gameData.room_type)
    
    const game = {
      gameId,
      creator: gameData.creator_address || gameData.creator,
      betAmount: gameData.bet_amount,
      maxPlayers: gameData.max_players || 8, // Battle royale game is 8 players max
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
      room_type: gameData.room_type || 'potion', // Add room type
      // Physics state
      physicsInitialized: false,
      material: 'glass', // Default material
      // ✅ FIX: Race condition prevention flags
      isEndingRound: false, // Prevents simultaneous endRound calls
      processingRoundEnd: false // Prevents duplicate round end processing
    }

    this.games.set(gameId, game)
    
    // Initialize physics for this game
    this.physicsEngine.initializeGamePhysics(gameId, gameData)
    game.physicsInitialized = true
    
    return game
  }

  // Load game from database if not in memory
  async loadGameFromDatabase(gameId, dbService) {
    // Check if already loaded in memory
    if (this.games.has(gameId)) {
      console.log(`📦 Game ${gameId} already loaded in memory`)
      return this.games.get(gameId)
    }
    
    if (!dbService) {
      console.log(`⚠️ No database service available, cannot load game ${gameId}`)
      return null
    }
    
    try {
      // Try to load from battle_royale_games table first
      const gameData = await dbService.getBattleRoyaleGame(gameId)
      
      if (gameData) {
        console.log(`📂 Loading game ${gameId} from database...`)
        
        // Check if game already exists in memory
        if (this.games.has(gameId)) {
          console.log(`📦 Game ${gameId} already exists in memory, returning existing game`)
          return this.games.get(gameId)
        }
        
        // Create the game structure from database data
        const game = this.createPhysicsGame(gameId, gameData)
        
        // Restore player data if exists
        if (gameData.players) {
          try {
            const playersData = typeof gameData.players === 'string' 
              ? JSON.parse(gameData.players) 
              : gameData.players
              
            // Restore each player
            for (const [address, playerData] of Object.entries(playersData)) {
              const normalizedAddress = address.toLowerCase()
              
              // Add player to game
              if (!game.players[normalizedAddress]) {
                await this.addPlayer(gameId, address, dbService)
              }
              
              // Restore player state
              if (game.players[normalizedAddress]) {
                Object.assign(game.players[normalizedAddress], playerData)
              }
            }
            
            // Update player count and slots
            game.currentPlayers = Object.keys(game.players).length
            console.log(`✅ Restored ${game.currentPlayers} players for game ${gameId}`)
          } catch (error) {
            console.error(`⚠️ Error restoring players for game ${gameId}:`, error)
          }
        }
        
        // Restore game phase and round
        if (gameData.current_round) {
          game.currentRound = gameData.current_round
        }
        
        // Map database status to game phase
        if (gameData.status === 'active' || gameData.status === 'in_progress') {
          game.phase = 'round_active'
          // Don't restart timer here - let the client request trigger it
        } else if (gameData.status === 'completed') {
          game.phase = 'game_over'
        } else if (gameData.status === 'cancelled') {
          game.phase = 'cancelled'
        } else if (gameData.status === 'filling') {
          game.phase = 'waiting' // filling status = waiting for players
        } else {
          game.phase = 'waiting' // default
        }
        
        console.log(`✅ Game ${gameId} loaded from database - Phase: ${game.phase}, Players: ${game.currentPlayers}`)
        return game
      }
      
      console.log(`⚠️ Game ${gameId} not found in database`)
      return null
      
    } catch (error) {
      console.error(`❌ Error loading game ${gameId} from database:`, error)
      return null
    }
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
        wins: 0, // Track wins for first-to-3-wins system
        choice: null,
        hasFired: false,
        isFlipping: false, // ✅ FIX: Initialize flipping flag
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
    if (!game) {
      console.warn(`❌ Game ${gameId} not found`)
      return false
    }

    if (game.phase !== 'waiting') {
      console.warn(`❌ Game ${gameId} already started (phase: ${game.phase})`)
      return false
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

    return true
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
  serverFlipCoin(gameId, address, choice, power, angle = 0, accuracy = 'normal', broadcast) {
    const game = this.games.get(gameId)
    if (!game || game.phase !== 'round_active') {
      console.warn(`❌ Game ${gameId} not in active round`, {
        gameExists: !!game,
        phase: game?.phase,
        currentRound: game?.currentRound
      })
      return { success: false, reason: 'game_not_active' }
    }

    const normalizedAddress = address.toLowerCase()
    const player = game.players[normalizedAddress]
    
    if (!player) {
      console.warn(`❌ Player ${address} not found in game ${gameId}`)
      return { success: false, reason: 'player_not_found' }
    }
    
    if (!player.isActive) {
      console.warn(`❌ Player ${address} is not active in game ${gameId}`)
      return { success: false, reason: 'player_not_active' }
    }
    
    // ✅ Check if THIS PLAYER already fired in this round
    // NOTE: This check is PER-PLAYER, so multiple DIFFERENT players can flip simultaneously!
    // Only prevents the SAME player from flipping twice in one round
    // This is CORRECT behavior - each player can flip once per round, independent of other players
    if (player.hasFired) {
      console.warn(`❌ Player ${address} already flipped in round ${game.currentRound} for game ${gameId}`, {
        hasFired: player.hasFired,
        isFlipping: player.isFlipping,
        slotNumber: player.slotNumber,
        currentRound: game.currentRound
      })
      return { success: false, reason: 'already_flipped_this_round' }
    }

    if (!player.choice) {
      console.warn(`❌ Player ${address} has no choice set in game ${gameId}`)
      return { success: false, reason: 'no_choice' }
    }

    if (choice && choice !== player.choice) {
      console.warn(`❌ Player ${address} choice mismatch: ${choice} vs ${player.choice}`)
      return { success: false, reason: 'choice_mismatch' }
    }

    // ✅ FIX: Set BOTH flags immediately to prevent race conditions
    // These flags are PER-PLAYER so multiple players can flip at the same time
    player.hasFired = true
    player.isFlipping = true

    // Run server-side physics simulation
    const simulationResult = this.physicsEngine.simulateCoinFlip(
      gameId, 
      player.slotNumber, 
      player.choice, 
      power, 
      angle,
      accuracy
    )

    if (!simulationResult) {
      console.warn(`❌ Physics simulation failed for player ${address}`)
      // Reset flags on failure
      player.hasFired = false
      player.isFlipping = false
      return { success: false, reason: 'simulation_failed' }
    }

    console.log(`🎲 Server-side coin flip initiated for ${address}: power=${power}, choice=${player.choice}, round=${game.currentRound}`)

    // Broadcast the flip start to all clients
    // ✅ FIX: Removed separate glass_shatter event to prevent double-shattering
    // Glass shatter now happens as part of physics_coin_flip_start event
    if (broadcast) {
      const room = `game_${gameId}`
      
      // Generate random FLIP reward amount (server-side for consistency)
      const flipReward = this.generateFlipReward()
      
      // Broadcast flip start (includes power for glass shatter)
      broadcast(room, 'physics_coin_flip_start', {
        gameId: gameId,
        playerAddress: address,
        playerSlot: player.slotNumber,
        power: power,
        angle: angle,
        choice: player.choice,
        duration: simulationResult.duration,
        flipReward: flipReward
      })
    }

    // Schedule result processing after simulation completes
    setTimeout(() => {
      this.processCoinFlipResult(gameId, address, broadcast)
    }, simulationResult.duration + 100) // Small buffer

    return { success: true }
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

    // ✅ FIX: Clear isFlipping flag now that result is determined
    // Note: hasFired should stay true until round ends (prevents same player from flipping twice in same round)
    player.isFlipping = false

    // Update wins (first to 3 wins system)
    if (won) {
      player.wins++
      console.log(`🎉 Player ${address} won! Now has ${player.wins}/3 wins`)
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
        accuracy: coinState.accuracy,
        lives: player.lives,
        wins: player.wins,
        isActive: player.isActive
      })
    }

    // Check if round is over (all active players have fired)
    const allFired = Object.values(game.players)
      .filter(p => p.isActive)
      .every(p => p.hasFired)

    // ✅ FIX: Prevent duplicate endRound calls when multiple players finish simultaneously
    if (allFired && !game.isEndingRound) {
      game.isEndingRound = true; // Set flag IMMEDIATELY to block other calls
      
      // ✅ Cancel the round timer since all players have finished
      if (this.timers.has(gameId)) {
        console.log(`⏰ Cancelling round timer for game ${gameId} - all players have finished`)
        clearInterval(this.timers.get(gameId))
        this.timers.delete(gameId)
      }
      
      console.log(`🏁 Round ending triggered for game ${gameId} - all players finished`)
      this.endRound(gameId, broadcast).catch(err => {
        console.error('Error ending round:', err)
        game.isEndingRound = false; // Reset flag on error
      })
    } else if (allFired && game.isEndingRound) {
      console.log(`⚠️ Round end already in progress for game ${gameId}, skipping duplicate call`)
    } else if (broadcast) {
      this.broadcastState(gameId, broadcast)
    }
  }

  // Fire coin (legacy method - now redirects to server-side)
  fireCoin(gameId, address, angle, power, broadcast) {
    console.log(`🔄 Redirecting fireCoin to server-side simulation`)
    const result = this.serverFlipCoin(gameId, address, null, power, angle, 'normal', broadcast)
    // Return boolean for backward compatibility
    return result.success || false
  }

  // Start round timer
  startRoundTimer(gameId, broadcast) {
    const game = this.games.get(gameId)
    if (!game) return
    
    // Clear any existing timer for this game
    if (this.timers.has(gameId)) {
      console.log(`⚠️ Timer already exists for game ${gameId}, clearing it`)
      clearInterval(this.timers.get(gameId))
      this.timers.delete(gameId)
      console.log(`⏰ Cleared existing timer for game ${gameId}`)
    }
    
    // Reset timer to 60 seconds for new round
    if (game.roundTimer <= 0 || game.roundTimer > 60) {
      console.log(`⚠️ Invalid timer value: ${game.roundTimer}, resetting to 60`)
      game.roundTimer = 60
    }
    
    console.log(`⏰ Starting round timer for game ${gameId} - ${game.roundTimer} seconds`)
    
    let lastBroadcastTime = game.roundTimer
    
    const timerId = setInterval(() => {
      if (!this.games.has(gameId)) {
        // Game was removed, clean up timer
        clearInterval(timerId)
        this.timers.delete(gameId)
        return
      }
      
      if (game.roundTimer > 0) {
        game.roundTimer--
        
        // SERVER-AUTHORITATIVE: Broadcast timer updates more frequently for better responsiveness
        // Broadcast every second for smooth countdown
        const shouldBroadcast = true
        
        if (broadcast && shouldBroadcast && game.roundTimer !== lastBroadcastTime) {
          lastBroadcastTime = game.roundTimer
          this.broadcastState(gameId, broadcast)
        }
      } else {
        // Time's up - clear this timer first to prevent multiple calls
        clearInterval(timerId)
        this.timers.delete(gameId)
        
        // Then end the round
        this.endRound(gameId, broadcast).catch(err => console.error('Error ending round:', err))
      }
    }, 1000)
    
    this.timers.set(gameId, timerId)
  }

  // End round
  async endRound(gameId, broadcast) {
    const game = this.games.get(gameId)
    if (!game) return
    
    // Clear timer immediately to prevent multiple calls
    if (this.timers.has(gameId)) {
      clearInterval(this.timers.get(gameId))
      this.timers.delete(gameId)
    }
    
    // Prevent multiple endRound calls
    if (game.processingRoundEnd) {
      console.log(`⚠️ Already processing round end for game ${gameId} - skipping duplicate call`)
      return
    }
    
    game.processingRoundEnd = true
    
    console.log(`⏱️ Round ${game.currentRound} ended for game ${gameId}`, {
      phase: game.phase,
      timer: game.roundTimer,
      activePlayers: Object.values(game.players).filter(p => p.lives > 0).length
    })
    
    // Auto-flip coins for players who haven't fired yet
    const playersToAutoFlip = []
    Object.entries(game.players).forEach(([address, player]) => {
      if (player.isActive && !player.hasFired && player.lives > 0) {
        playersToAutoFlip.push({ address, player })
      }
    })
    
    if (playersToAutoFlip.length > 0) {
      console.log(`⏱️ Auto-flipping for ${playersToAutoFlip.length} players...`)
      
      playersToAutoFlip.forEach(({ address, player }) => {
        const autoPower = 50 // 50% power for auto-flip
        const autoChoice = player.choice || 'heads' // Default to heads if no choice
        
        console.log(`🪙 Auto-flipping for ${address}: power=${autoPower}, choice=${autoChoice}`)
        
        // Simulate coin flip with auto power
        this.serverFlipCoin(gameId, address, autoChoice, autoPower, 0, broadcast)
      })
    }
    
    // Wait for auto-flips to complete before checking game state
    setTimeout(() => {
      // Check for players who reached 3 wins (game over condition)
      const playersWith3Wins = Object.entries(game.players).filter(([_, p]) => p.wins >= 3)
      
      console.log(`👥 Players with 3+ wins: ${playersWith3Wins.length}`)
      console.log(`🔍 All players state:`, Object.entries(game.players).map(([addr, p]) => ({
        address: addr,
        lives: p.lives,
        wins: p.wins,
        isActive: p.isActive,
        hasFired: p.hasFired
      })))
      
      if (playersWith3Wins.length === 1) {
        // Exactly one player reached 3 wins - they win!
        const [winnerAddress, winnerData] = playersWith3Wins[0]
        game.phase = 'game_over'
        game.winner = winnerAddress
        
        console.log(`🏆 Game ${gameId} ended - Winner: ${winnerAddress} with ${winnerData.wins} wins`)
        
        // Cleanup physics
        this.physicsEngine.cleanupGamePhysics(gameId)
        
        // Update database with winner information (database is source of truth)
        // Game will be completed on-chain later when winner tries to claim
        this.updateGameInDatabase(gameId, winnerAddress).catch(err => {
          console.error(`❌ Error updating game in database: ${err.message}`)
        })
        
        console.log(`📝 Winner ${winnerAddress} recorded in database. Game will be completed on-chain when they claim.`)
        
        // NOTE: We do NOT complete the game on-chain here anymore!
        // The new flow is:
        // 1. Game ends → Update database with winner ✅
        // 2. Winner goes to profile → Sees claimable game ✅
        // 3. Winner clicks claim → Backend completes game on-chain
        // 4. Winner withdraws NFT with their wallet
        // This prevents failed background blockchain transactions
        
        if (broadcast) {
          // Send updated state with game_over phase instead of separate game_over event
          const finalState = this.getFullGameState(gameId)
          console.log(`📡 Broadcasting game over state:`, {
            phase: finalState.phase,
            winner: finalState.winner,
            gameId: finalState.gameId
          })
          broadcast(`game_${gameId}`, 'physics_state_update', finalState)
          
          // Also send the game_over event for backward compatibility
          broadcast(`game_${gameId}`, 'game_over', {
            gameId: gameId,
            winner: winnerAddress,
            winnerData: winnerData,
            reason: 'first_to_3_wins',
            finalState: finalState
          })
        }
      } else if (playersWith3Wins.length > 1) {
        // Multiple players reached 3 wins - tiebreaker round!
        console.log(`🔄 Tiebreaker! ${playersWith3Wins.length} players reached 3 wins - starting tiebreaker round`)
        
        // Reset wins for tiebreaker players only
        playersWith3Wins.forEach(([address, player]) => {
          player.wins = 0 // Reset to 0 for tiebreaker
          player.isActive = true
          player.choice = null
          player.hasFired = false
          player.isFlipping = false // ✅ FIX: Clear flipping flag
          console.log(`🔄 Reset ${address} for tiebreaker: wins=${player.wins}`)
        })
        
        // Deactivate players who didn't reach 3 wins
        Object.entries(game.players).forEach(([address, player]) => {
          if (player.wins < 3) {
            player.isActive = false
            console.log(`💀 Player ${address} eliminated (${player.wins} wins)`)
          }
        })
        
        // Start tiebreaker round
        game.currentRound++
        game.roundTimer = 60
        
        // Reset physics for tiebreaker round
        this.physicsEngine.resetGameForNewRound(gameId)
        this.physicsEngine.updateGamePhase(gameId, 'round_active')
        
        // Start the tiebreaker round timer
        this.startRoundTimer(gameId, broadcast)
        
        console.log(`🎮 Tiebreaker round ${game.currentRound} started for ${playersWith3Wins.length} players`)
      } else {
        // No one has 3 wins yet - continue to next round
        console.log(`🔄 No player has 3 wins yet - starting next round for game ${gameId}`)
        
        // Safety check: ensure game is still valid
        if (!this.games.has(gameId)) {
          console.log(`⚠️ Game ${gameId} no longer exists, aborting round start`)
          return
        }
        
        // Reset physics for new round
        this.physicsEngine.resetGameForNewRound(gameId)
        this.physicsEngine.updateGamePhase(gameId, 'round_active')
        
        // Reset player states for next round
        Object.values(game.players).forEach(player => {
          if (player.lives > 0) {
            player.isActive = true
            player.choice = null
            player.hasFired = false
            player.isFlipping = false // ✅ FIX: Clear flipping flag
            console.log(`🔄 Reset player state: isActive=${player.isActive}, choice=${player.choice}, hasFired=${player.hasFired}, isFlipping=${player.isFlipping}`)
          }
        })
        
        // Increment round and reset timer
        game.currentRound++
        game.roundTimer = 60
        
        // Add detailed logging for round progression
        console.log(`🔄 Round ${game.currentRound} progression:`, {
          phase: game.phase,
          timer: game.roundTimer,
          processing: game.processingRoundEnd,
          activePlayers: Object.values(game.players).filter(p => p.lives > 0).length,
          playersWithLives: Object.entries(game.players).map(([addr, p]) => ({ address: addr, lives: p.lives }))
        })
        
        // Start the new round timer FIRST
        this.startRoundTimer(gameId, broadcast)
        
        // THEN reset the processing flags
        game.processingRoundEnd = false
        game.isEndingRound = false // ✅ FIX: Reset race condition flag
        
        console.log(`🎮 Game ${gameId} - Round ${game.currentRound} started`)
      }
      
      // Broadcast final state
      if (broadcast) {
        this.broadcastState(gameId, broadcast)
      }
      
      // Clear the processing flags if game is over
      if (game.phase === 'game_over') {
        game.processingRoundEnd = false
        game.isEndingRound = false // ✅ FIX: Reset race condition flag
      }
      
    }, 2000) // Wait 2 seconds for auto-flips to process
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
      winner: game.winner, // Add winner field
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
      room_type: game.room_type || 'potion', // Add room type to state
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
      console.log(`📡 Broadcasting state to room ${room}:`, {
        phase: state.phase,
        currentRound: state.currentRound,
        roundTimer: state.roundTimer,
        players: Object.keys(state.players).length
      })
      broadcast(room, 'physics_state_update', state)
    } else {
      console.log(`⚠️ Cannot broadcast state for game ${gameId}:`, {
        hasState: !!state,
        hasBroadcast: !!broadcast
      })
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

  // Generate random FLIP reward with weighted distribution
  generateFlipReward() {
    const rewards = [
      { amount: 50, color: '#ffffff', weight: 40 },      // White - Very common
      { amount: 100, color: '#87ceeb', weight: 25 },     // Sky blue - Common
      { amount: 200, color: '#ffff00', weight: 15 },     // Yellow - Uncommon
      { amount: 500, color: '#ff8800', weight: 10 },     // Orange - Rare
      { amount: 1000, color: '#FFD700', weight: 10 }     // Gold - Rare (max amount)
    ]
    
    const totalWeight = rewards.reduce((sum, reward) => sum + reward.weight, 0)
    const random = Math.random() * totalWeight
    
    let currentWeight = 0
    for (const reward of rewards) {
      currentWeight += reward.weight
      if (random <= currentWeight) {
        return reward
      }
    }
    
    return rewards[0] // Fallback to 50
  }

  // Complete game on blockchain to transfer NFT ownership
  async completeGameOnBlockchain(gameId, winnerAddress, broadcast) {
    console.log(`🏆 Completing game on blockchain: ${gameId} -> ${winnerAddress}`)
    
    // Use blockchainService directly (avoids dotenv dependency issue in gameCompletion.js)
    try {
      if (!this.blockchainService || !this.blockchainService.hasOwnerWallet()) {
        throw new Error('Blockchain service not available or not configured')
      }
      
      const result = await this.blockchainService.completeBattleRoyaleOnChain(gameId, winnerAddress)
      
      if (result.success) {
        console.log(`✅ Game completed on blockchain: ${result.transactionHash}`)
        
        // Update database with completion_tx now that blockchain completion succeeded
        if (this.dbService) {
          await this.dbService.updateBattleRoyaleGame(gameId, {
            completion_tx: result.transactionHash,
            completion_block: result.blockNumber || null,
            status: 'completed' // Ensure status is set
          }).catch(err => {
            console.error(`❌ Error updating completion_tx in database: ${err.message}`)
          })
        }
        
        // Notify all players about the blockchain completion
        if (broadcast) {
          broadcast(`game_${gameId}`, 'battle_royale_completed_on_chain', {
            type: 'battle_royale_completed_on_chain',
            gameId: gameId,
            winner: winnerAddress,
            transactionHash: result.transactionHash
          })
        }
      } else {
        console.error(`❌ Failed to complete game on blockchain: ${result.error}`)
        console.warn(`⚠️ Game marked as completed in database but blockchain transaction failed`)
        
        // Update database to indicate completion failed
        if (this.dbService) {
          await this.dbService.updateBattleRoyaleGame(gameId, {
            completion_error: result.error || 'Unknown error',
            status: 'pending_completion' // Mark as pending so it can be retried
          }).catch(err => {
            console.error(`❌ Error updating completion error in database: ${err.message}`)
          })
        }
      }
    } catch (error) {
      console.error(`❌ Error completing game on blockchain:`, error)
      console.warn(`⚠️ Game marked as completed in database but blockchain transaction failed`)
      
      // Update database to indicate completion error
      if (this.dbService) {
        await this.dbService.updateBattleRoyaleGame(gameId, {
          completion_error: error.message || 'Unknown error',
          status: 'pending_completion' // Mark as pending so it can be retried
        }).catch(err => {
          console.error(`❌ Error updating completion error in database: ${err.message}`)
        })
      }
    }
  }

  // Update game in database to mark as completed
  async updateGameInDatabase(gameId, winnerAddress) {
    console.log(`📝 Updating game in database: ${gameId} -> ${winnerAddress}`)
    
    try {
      if (this.dbService) {
        await this.dbService.updateBattleRoyaleGame(gameId, {
          status: 'completed',
          winner: winnerAddress,
          winner_address: winnerAddress, // Also set winner_address for compatibility
          completed_at: new Date().toISOString(),
          creator_paid: 0, // Initialize as not paid
          nft_claimed: 0   // Initialize as not claimed
        })
        console.log(`✅ Game updated in database: ${gameId}`)
      } else {
        console.warn(`⚠️ Database service not available for game update`)
      }
    } catch (error) {
      console.error(`❌ Error updating game in database:`, error)
    }
  }
}

module.exports = PhysicsGameManager
