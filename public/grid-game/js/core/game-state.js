/**
 * Game State Manager
 * Manages all game state including players, coins, rounds, etc.
 */

import { GAME_CONFIG } from '../config.js';

// Game state
const state = {
  gameId: null,
  playerAddress: null,
  playerSlot: null,
  maxPlayers: 6,
  gameMode: '6player',

  // Round state
  currentRound: 1,
  roundActive: false,
  roundTarget: null, // 'heads' or 'tails'
  roundTimeRemaining: GAME_CONFIG.ROUND_DURATION,

  // Players
  players: [],       // Array of player objects
  coins: [],         // Array of coin THREE.js objects
  coinStates: [],    // Array of coin animation states

  // Power meter
  powerValue: 0,
  powerDirection: 1, // 1 for increasing, -1 for decreasing
  powerActive: false,

  // Game status
  gameStatus: 'waiting', // 'waiting', 'active', 'completed'
  winner: null,

  // Player stats
  playerStats: {
    lives: GAME_CONFIG.MAX_LIVES,
    wins: 0,
    totalFlips: 0,
  },
};

/**
 * Initialize game state with game data
 */
export function initializeGameState(gameData) {
  console.log('🎮 Initializing game state:', gameData);

  state.gameId = gameData.gameId;
  state.playerAddress = gameData.playerAddress;
  state.maxPlayers = gameData.maxPlayers || 6;
  state.gameMode = gameData.gameMode || '6player';

  // Initialize players array
  state.players = new Array(state.maxPlayers).fill(null).map((_, i) => ({
    slotNumber: i,
    address: null,
    name: `Player ${i + 1}`,
    avatar: null,
    isActive: false,
    isEliminated: false,
    choice: null,
    lives: GAME_CONFIG.MAX_LIVES,
    hasFlipped: false,
  }));

  console.log('✅ Game state initialized');
}

/**
 * Update player in slot
 */
export function updatePlayer(slotNumber, playerData) {
  if (slotNumber >= 0 && slotNumber < state.players.length) {
    state.players[slotNumber] = {
      ...state.players[slotNumber],
      ...playerData,
    };
  }
}

/**
 * Set current player slot
 */
export function setPlayerSlot(slotNumber) {
  state.playerSlot = slotNumber;
  console.log(`👤 Player slot set to: ${slotNumber}`);
}

/**
 * Start new round
 */
export function startRound(roundNumber, target) {
  console.log(`🎯 Starting round ${roundNumber}, target: ${target}`);

  state.currentRound = roundNumber;
  state.roundActive = true;
  state.roundTarget = target;
  state.roundTimeRemaining = GAME_CONFIG.ROUND_DURATION;
  state.powerActive = true;

  // Reset player flip states
  state.players.forEach(player => {
    if (!player.isEliminated) {
      player.hasFlipped = false;
      player.choice = null;
    }
  });
}

/**
 * End current round
 */
export function endRound() {
  console.log(`🏁 Ending round ${state.currentRound}`);

  state.roundActive = false;
  state.powerActive = false;
}

/**
 * Update round timer
 */
export function updateRoundTimer(timeRemaining) {
  state.roundTimeRemaining = Math.max(0, timeRemaining);
}

/**
 * Update power meter
 */
export function updatePowerMeter() {
  if (!state.powerActive) return;

  state.powerValue += GAME_CONFIG.POWER_CYCLE_SPEED * state.powerDirection;

  // Reverse direction at boundaries
  if (state.powerValue >= 1) {
    state.powerValue = 1;
    state.powerDirection = -1;
  } else if (state.powerValue <= 0) {
    state.powerValue = 0;
    state.powerDirection = 1;
  }

  return state.powerValue;
}

/**
 * Get current power value
 */
export function getPowerValue() {
  return state.powerValue;
}

/**
 * Check if power is in sweet spot
 */
export function isPowerInSweetSpot() {
  return state.powerValue >= GAME_CONFIG.SWEET_SPOT_MIN &&
         state.powerValue <= GAME_CONFIG.SWEET_SPOT_MAX;
}

/**
 * Mark player as flipped
 */
export function markPlayerFlipped(slotNumber, choice) {
  if (slotNumber >= 0 && slotNumber < state.players.length) {
    state.players[slotNumber].hasFlipped = true;
    state.players[slotNumber].choice = choice;
  }
}

/**
 * Mark player as eliminated
 */
export function eliminatePlayer(slotNumber) {
  if (slotNumber >= 0 && slotNumber < state.players.length) {
    state.players[slotNumber].isEliminated = true;
    state.players[slotNumber].lives = 0;
    console.log(`💀 Player ${slotNumber} eliminated`);
  }
}

/**
 * Update player lives
 */
export function updatePlayerLives(slotNumber, lives) {
  if (slotNumber >= 0 && slotNumber < state.players.length) {
    state.players[slotNumber].lives = lives;
  }
}

/**
 * Get active players count
 */
export function getActivePlayers() {
  return state.players.filter(p => p.isActive && !p.isEliminated);
}

/**
 * Set game status
 */
export function setGameStatus(status) {
  state.gameStatus = status;
  console.log(`🎮 Game status: ${status}`);
}

/**
 * Set winner
 */
export function setWinner(playerSlot) {
  state.winner = playerSlot;
  console.log(`🏆 Winner: Player ${playerSlot}`);
}

/**
 * Update player stats
 */
export function updatePlayerStats(stats) {
  state.playerStats = {
    ...state.playerStats,
    ...stats,
  };
}

/**
 * Increment total flips
 */
export function incrementTotalFlips() {
  state.playerStats.totalFlips++;
}

/**
 * Get entire game state (read-only)
 */
export function getGameState() {
  return { ...state };
}

/**
 * Get specific state value
 */
export function getState(key) {
  return state[key];
}

/**
 * Set specific state value
 */
export function setState(key, value) {
  state[key] = value;
}

/**
 * Reset game state
 */
export function resetGameState() {
  console.log('🔄 Resetting game state...');

  state.currentRound = 1;
  state.roundActive = false;
  state.roundTarget = null;
  state.roundTimeRemaining = GAME_CONFIG.ROUND_DURATION;
  state.powerValue = 0;
  state.powerDirection = 1;
  state.powerActive = false;
  state.gameStatus = 'waiting';
  state.winner = null;

  state.players.forEach(player => {
    player.isEliminated = false;
    player.hasFlipped = false;
    player.choice = null;
    player.lives = GAME_CONFIG.MAX_LIVES;
  });

  console.log('✅ Game state reset');
}

export default {
  initializeGameState,
  updatePlayer,
  setPlayerSlot,
  startRound,
  endRound,
  updateRoundTimer,
  updatePowerMeter,
  getPowerValue,
  isPowerInSweetSpot,
  markPlayerFlipped,
  eliminatePlayer,
  updatePlayerLives,
  getActivePlayers,
  setGameStatus,
  setWinner,
  updatePlayerStats,
  incrementTotalFlips,
  getGameState,
  getState,
  setState,
  resetGameState,
};
