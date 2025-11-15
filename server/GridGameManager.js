/**
 * Grid Game Manager
 * Manages grid-based multi-player coin flip games (1v1, 6p, 12p, 18p, 24p)
 * Simplified game logic without physics - just coin flips and eliminations
 */

class GridGameManager {
  constructor() {
    this.games = new Map(); // gameId -> game state
    this.broadcastCallback = null; // Will be set by socket handler
    console.log('🎮 GridGameManager initialized');
  }

  /**
   * Set broadcast callback for socket emissions
   */
  setBroadcastCallback(callback) {
    this.broadcastCallback = callback;
  }

  /**
   * Create a new grid game
   */
  createGame(gameId, gameData) {
    console.log(`🎮 Creating grid game: ${gameId}, mode: ${gameData.game_mode}`);

    const maxPlayers = gameData.max_players || 6;

    const game = {
      gameId,
      creator: gameData.creator_address || gameData.creator,
      maxPlayers,
      currentPlayers: 0,
      gameMode: gameData.game_mode || '6player',
      phase: 'waiting', // waiting, round_active, game_over
      currentRound: 0,
      roundTimer: 30, // 30 seconds per round
      roundTarget: null, // 'heads' or 'tails'
      players: {}, // address -> { slotNumber, lives, wins, hasFlipped, choice, isEliminated }
      playerOrder: [], // Array of addresses in join order
      // NFT Data
      nftContract: gameData.nft_contract,
      nftTokenId: gameData.nft_token_id,
      nftName: gameData.nft_name,
      nftImage: gameData.nft_image,
      nftCollection: gameData.nft_collection,
      nftChain: gameData.nft_chain || 'base',
      entryFee: gameData.entry_fee,
      serviceFee: gameData.service_fee,
      // Game settings
      maxLives: 3,
      winner: null,
      createdAt: Date.now(),
    };

    this.games.set(gameId, game);
    console.log(`✅ Grid game created: ${gameId}, max players: ${maxPlayers}`);

    return game;
  }

  /**
   * Load game from database
   */
  async loadGameFromDatabase(gameId, dbService) {
    if (this.games.has(gameId)) {
      console.log(`📦 Grid game ${gameId} already loaded`);
      return this.games.get(gameId);
    }

    if (!dbService) {
      console.log(`⚠️ No database service, cannot load game ${gameId}`);
      return null;
    }

    try {
      const gameData = await dbService.getBattleRoyaleGame(gameId);
      if (!gameData) {
        console.log(`❌ Game ${gameId} not found in database`);
        return null;
      }

      // Only load if it's a grid game mode
      const isGridGame = ['1v1', '6player', '12player', '18player', '24player'].includes(gameData.game_mode);
      if (!isGridGame) {
        console.log(`⚠️ Game ${gameId} is not a grid game (mode: ${gameData.game_mode})`);
        return null;
      }

      console.log(`📂 Loading grid game ${gameId} from database`);
      const game = this.createGame(gameId, gameData);

      // Restore player data if exists
      if (gameData.players) {
        try {
          const playersData = typeof gameData.players === 'string'
            ? JSON.parse(gameData.players)
            : gameData.players;

          Object.entries(playersData).forEach(([address, playerData]) => {
            game.players[address] = playerData;
            if (!game.playerOrder.includes(address)) {
              game.playerOrder.push(address);
            }
          });

          game.currentPlayers = Object.keys(game.players).length;
          console.log(`✅ Restored ${game.currentPlayers} players for game ${gameId}`);
        } catch (error) {
          console.error(`Error parsing players data for game ${gameId}:`, error);
        }
      }

      return game;
    } catch (error) {
      console.error(`Error loading grid game ${gameId}:`, error);
      return null;
    }
  }

  /**
   * Player joins game
   */
  joinGame(gameId, playerAddress, playerData = {}) {
    const game = this.games.get(gameId);
    if (!game) {
      console.error(`❌ Game ${gameId} not found`);
      return { success: false, error: 'Game not found' };
    }

    if (game.phase !== 'waiting') {
      return { success: false, error: 'Game already started' };
    }

    if (game.currentPlayers >= game.maxPlayers) {
      return { success: false, error: 'Game is full' };
    }

    if (game.players[playerAddress]) {
      console.log(`⚠️ Player ${playerAddress} already in game ${gameId}`);
      return { success: true, slotNumber: game.players[playerAddress].slotNumber };
    }

    const slotNumber = game.currentPlayers;

    game.players[playerAddress] = {
      address: playerAddress,
      slotNumber,
      lives: game.maxLives,
      wins: 0,
      hasFlipped: false,
      choice: null,
      isEliminated: false,
      coinImages: playerData.coinImages || null,
      name: playerData.name || `Player ${slotNumber + 1}`,
      joinedAt: Date.now(),
    };

    game.playerOrder.push(playerAddress);
    game.currentPlayers++;

    console.log(`✅ Player ${playerAddress} joined game ${gameId} (slot ${slotNumber}, ${game.currentPlayers}/${game.maxPlayers})`);

    // Auto-start if lobby is full
    if (game.currentPlayers === game.maxPlayers) {
      console.log(`🚀 Lobby full! Auto-starting game ${gameId}`);
      setTimeout(() => this.startGame(gameId), 1500);
    }

    return { success: true, slotNumber };
  }

  /**
   * Start the game
   */
  startGame(gameId) {
    const game = this.games.get(gameId);
    if (!game) return false;

    if (game.phase !== 'waiting') {
      console.log(`⚠️ Game ${gameId} already started`);
      return false;
    }

    if (game.currentPlayers < 2) {
      console.log(`⚠️ Not enough players to start game ${gameId}`);
      return false;
    }

    game.phase = 'round_active';
    game.currentRound = 1;

    console.log(`🎮 Starting grid game ${gameId} with ${game.currentPlayers} players`);

    // Start first round
    this.startRound(gameId);

    // Emit socket events to clients
    if (this.broadcastCallback) {
      const room = `game_${gameId}`;

      // Broadcast game start
      this.broadcastCallback(room, 'grid_game_start', { gameId });

      // Broadcast state update
      this.broadcastCallback(room, 'grid_state_update', this.getFullGameState(gameId));

      // Broadcast round start
      this.broadcastCallback(room, 'grid_round_start', {
        roundNumber: game.currentRound,
        target: game.roundTarget,
        duration: game.roundTimer,
      });
    }

    return true;
  }

  /**
   * Start a new round
   */
  startRound(gameId) {
    const game = this.games.get(gameId);
    if (!game) return;

    // Randomly choose heads or tails
    game.roundTarget = Math.random() < 0.5 ? 'heads' : 'tails';
    game.roundTimer = 30;

    // Reset player flip states
    Object.values(game.players).forEach(player => {
      if (!player.isEliminated) {
        player.hasFlipped = false;
        player.choice = null;
      }
    });

    console.log(`🎯 Round ${game.currentRound} started for game ${gameId}, target: ${game.roundTarget}`);

    // Start countdown timer
    this.startRoundTimer(gameId);
  }

  /**
   * Start round countdown timer
   */
  startRoundTimer(gameId) {
    const game = this.games.get(gameId);
    if (!game) return;

    const intervalId = setInterval(() => {
      game.roundTimer--;

      if (game.roundTimer <= 0 || this.allPlayersFlipped(gameId)) {
        clearInterval(intervalId);
        this.endRound(gameId);
      }
    }, 1000);

    // Store interval ID to clear later if needed
    game.roundIntervalId = intervalId;
  }

  /**
   * Check if all active players have flipped
   */
  allPlayersFlipped(gameId) {
    const game = this.games.get(gameId);
    if (!game) return false;

    const activePlayers = Object.values(game.players).filter(p => !p.isEliminated);
    return activePlayers.every(p => p.hasFlipped);
  }

  /**
   * Player flips coin
   */
  flipCoin(gameId, playerAddress, choice, power = 0.7) {
    const game = this.games.get(gameId);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    if (game.phase !== 'round_active') {
      return { success: false, error: 'No active round' };
    }

    const player = game.players[playerAddress];
    if (!player) {
      return { success: false, error: 'Player not in game' };
    }

    if (player.isEliminated) {
      return { success: false, error: 'Player eliminated' };
    }

    if (player.hasFlipped) {
      return { success: false, error: 'Already flipped this round' };
    }

    // Simulate coin flip result based on power
    // Power closer to sweet spot (0.7-0.75) has better chance of success
    const targetHit = this.simulateFlip(power);

    player.hasFlipped = true;
    player.choice = choice;

    console.log(`🎲 Player ${playerAddress} flipped: power=${power}, target=${game.roundTarget}, hit=${targetHit}`);

    return {
      success: true,
      targetHit,
      targetFace: game.roundTarget,
      slotNumber: player.slotNumber,
    };
  }

  /**
   * Simulate flip result based on power
   */
  simulateFlip(power) {
    // Power in sweet spot (0.65-0.75) has 80% chance to hit target
    // Power outside sweet spot has lower chance
    const inSweetSpot = power >= 0.65 && power <= 0.75;
    const hitChance = inSweetSpot ? 0.8 : 0.4;

    return Math.random() < hitChance;
  }

  /**
   * End current round
   */
  endRound(gameId) {
    const game = this.games.get(gameId);
    if (!game) return;

    console.log(`🏁 Ending round ${game.currentRound} for game ${gameId}`);

    // Clear interval if it exists
    if (game.roundIntervalId) {
      clearInterval(game.roundIntervalId);
      game.roundIntervalId = null;
    }

    // Process results - eliminate players who didn't hit target or didn't flip
    const eliminated = [];

    Object.values(game.players).forEach(player => {
      if (player.isEliminated) return;

      // Players who didn't flip lose a life
      if (!player.hasFlipped) {
        player.lives--;
        console.log(`⚠️ Player ${player.address} didn't flip, lives: ${player.lives}`);

        if (player.lives <= 0) {
          player.isEliminated = true;
          eliminated.push(player.address);
          console.log(`💀 Player ${player.address} eliminated (didn't flip)`);
        }
      }
    });

    // Check for winner
    const activePlayers = Object.values(game.players).filter(p => !p.isEliminated);

    if (activePlayers.length === 1) {
      // We have a winner!
      game.winner = activePlayers[0].address;
      game.phase = 'game_over';
      console.log(`🏆 Game ${gameId} over! Winner: ${game.winner}`);
    } else if (activePlayers.length === 0) {
      // Everyone eliminated - last one eliminated wins
      game.winner = eliminated[eliminated.length - 1];
      game.phase = 'game_over';
      console.log(`🏆 Game ${gameId} over! Last survivor: ${game.winner}`);
    } else {
      // Continue to next round
      game.currentRound++;
      setTimeout(() => this.startRound(gameId), 3000); // 3 second delay
    }

    return {
      eliminated,
      winner: game.winner,
      gameOver: game.phase === 'game_over',
    };
  }

  /**
   * Get full game state
   */
  getFullGameState(gameId) {
    const game = this.games.get(gameId);
    if (!game) return null;

    return {
      gameId: game.gameId,
      creator: game.creator,
      maxPlayers: game.maxPlayers,
      currentPlayers: game.currentPlayers,
      gameMode: game.gameMode,
      phase: game.phase,
      currentRound: game.currentRound,
      roundTimer: game.roundTimer,
      roundTarget: game.roundTarget,
      winner: game.winner,
      players: game.players,
      playerOrder: game.playerOrder,
      // NFT Data
      nftContract: game.nftContract,
      nftTokenId: game.nftTokenId,
      nftName: game.nftName,
      nftImage: game.nftImage,
      nftCollection: game.nftCollection,
      nftChain: game.nftChain,
      entryFee: game.entryFee,
      serviceFee: game.serviceFee,
      game_mode: game.gameMode, // For routing
    };
  }

  /**
   * Broadcast state to all players
   */
  broadcastState(gameId, broadcast) {
    const state = this.getFullGameState(gameId);
    if (state && broadcast) {
      const room = `game_${gameId}`;
      console.log(`📡 Broadcasting grid state to room ${room}`);
      broadcast(room, 'grid_state_update', state);
    }
  }

  /**
   * Remove game from memory
   */
  removeGame(gameId) {
    const game = this.games.get(gameId);
    if (game && game.roundIntervalId) {
      clearInterval(game.roundIntervalId);
    }
    this.games.delete(gameId);
    console.log(`🗑️ Removed grid game ${gameId}`);
  }

  /**
   * Get all active games
   */
  getActiveGames() {
    return Array.from(this.games.values());
  }
}

module.exports = GridGameManager;
