/**
 * Socket Manager
 * Handles all Socket.io communication for grid game
 */

import { SOCKET_EVENTS } from '../config.js';
import {
  initializeGameState,
  setPlayerSlot,
  updatePlayer,
  startRound,
  endRound,
  markPlayerFlipped,
  eliminatePlayer,
  updatePlayerLives,
  setGameStatus,
  setWinner,
  updatePlayerStats,
  getGameState,
} from './game-state.js';
import { startFlipAnimation } from '../systems/coin-animator.js';
import { markCoinEliminated } from '../systems/coin-creator.js';

let socket = null;
let isConnected = false;

/**
 * Initialize socket connection
 */
export function initializeSocket(gameId, playerAddress) {
  console.log('🔌 Initializing socket connection...');
  console.log('Game ID:', gameId);
  console.log('Player Address:', playerAddress);

  // Connect to server
  socket = io({
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  // Setup event listeners
  setupSocketListeners(gameId, playerAddress);

  return socket;
}

/**
 * Setup all socket event listeners
 */
function setupSocketListeners(gameId, playerAddress) {
  // Connection events
  socket.on(SOCKET_EVENTS.CONNECT, () => {
    console.log('✅ Socket connected');
    isConnected = true;

    // Join game room
    joinGameRoom(gameId, playerAddress);
  });

  socket.on(SOCKET_EVENTS.DISCONNECT, () => {
    console.log('❌ Socket disconnected');
    isConnected = false;
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error);
  });

  // Game lifecycle events
  socket.on(SOCKET_EVENTS.PLAYER_JOINED, handlePlayerJoined);
  socket.on(SOCKET_EVENTS.PLAYER_LEFT, handlePlayerLeft);
  socket.on(SOCKET_EVENTS.GAME_START, handleGameStart);
  socket.on(SOCKET_EVENTS.GAME_END, handleGameEnd);

  // Round events
  socket.on(SOCKET_EVENTS.ROUND_START, handleRoundStart);
  socket.on(SOCKET_EVENTS.ROUND_END, handleRoundEnd);
  socket.on(SOCKET_EVENTS.TARGET_ANNOUNCED, handleTargetAnnounced);

  // Player action events
  socket.on(SOCKET_EVENTS.COIN_FLIPPED, handleCoinFlipped);
  socket.on(SOCKET_EVENTS.PLAYER_ELIMINATED, handlePlayerEliminated);
  socket.on(SOCKET_EVENTS.COIN_UPDATED, handleCoinUpdated);

  // State updates
  socket.on(SOCKET_EVENTS.STATE_UPDATE, handleStateUpdate);
}

/**
 * Join game room
 */
function joinGameRoom(gameId, playerAddress) {
  console.log('🚪 Joining game room...');

  socket.emit(SOCKET_EVENTS.JOIN_ROOM, {
    gameId,
    playerAddress,
  });
}

/**
 * Send flip request to server
 */
export function sendFlipRequest() {
  if (!isConnected) {
    console.error('❌ Not connected to server');
    return false;
  }

  const state = getGameState();

  if (!state.roundActive) {
    console.warn('⚠️ No active round');
    return false;
  }

  if (state.playerSlot === null) {
    console.warn('⚠️ Player slot not set');
    return false;
  }

  const player = state.players[state.playerSlot];
  if (player.hasFlipped) {
    console.warn('⚠️ Already flipped this round');
    return false;
  }

  console.log('🎲 Sending flip request to server...');

  socket.emit(SOCKET_EVENTS.FLIP_COIN, {
    gameId: state.gameId,
    playerSlot: state.playerSlot,
    playerAddress: state.playerAddress,
    choice: state.roundTarget, // Match the target
    power: state.powerValue,
  });

  return true;
}

/**
 * Handle player joined event
 */
function handlePlayerJoined(data) {
  console.log('👤 Player joined:', data);

  const { slotNumber, playerAddress, playerName, playerData } = data;

  // Update player in state
  updatePlayer(slotNumber, {
    address: playerAddress,
    name: playerName || `Player ${slotNumber + 1}`,
    isActive: true,
    ...playerData,
  });

  // If this is us, set our slot
  const state = getGameState();
  if (playerAddress.toLowerCase() === state.playerAddress?.toLowerCase()) {
    setPlayerSlot(slotNumber);
    console.log(`✅ You are in slot ${slotNumber}`);

    // Load and apply player's coin textures
    setTimeout(() => {
      import('../main.js').then(module => {
        if (module.loadPlayerCoinTextures) {
          module.loadPlayerCoinTextures();
        }
      });
    }, 200);
  }
}

/**
 * Handle player left event
 */
function handlePlayerLeft(data) {
  console.log('👋 Player left:', data);

  const { slotNumber } = data;

  updatePlayer(slotNumber, {
    isActive: false,
  });
}

/**
 * Handle game start event
 */
function handleGameStart(data) {
  console.log('🎮 Game started:', data);

  setGameStatus('active');

  // Hide start button
  const startButton = document.getElementById('start-game-button');
  if (startButton) {
    startButton.style.display = 'none';
  }

  // Update game data
  if (data.gameData) {
    // Update any game-wide settings
  }
}

/**
 * Handle game end event
 */
function handleGameEnd(data) {
  console.log('🏁 Game ended:', data);

  const { winner, winnerSlot } = data;

  setGameStatus('completed');
  setWinner(winnerSlot);

  // Show winner announcement
  showWinnerAnnouncement(winner, winnerSlot);
}

/**
 * Handle round start event
 */
function handleRoundStart(data) {
  console.log('🎯 Round started:', data);

  const { roundNumber, target, duration } = data;

  startRound(roundNumber, target);

  // Enable flip button
  const flipButton = document.getElementById('flip-button');
  if (flipButton) {
    flipButton.disabled = false;
    flipButton.textContent = 'FLIP COIN';
  }

  // Start countdown timer
  startRoundTimer(duration);
}

/**
 * Handle round end event
 */
function handleRoundEnd(data) {
  console.log('🏁 Round ended:', data);

  const { results, eliminations } = data;

  endRound();

  // Process results
  if (results) {
    processRoundResults(results);
  }

  // Process eliminations
  if (eliminations && eliminations.length > 0) {
    eliminations.forEach(slotNumber => {
      eliminatePlayer(slotNumber);
      markCoinEliminated(slotNumber);
    });
  }
}

/**
 * Handle target announced event
 */
function handleTargetAnnounced(data) {
  console.log('🎯 Target announced:', data);

  const { target } = data;

  // Update UI with target
  const targetElement = document.getElementById('target-value');
  if (targetElement) {
    targetElement.textContent = target.toUpperCase();
  }
}

/**
 * Handle coin flipped event
 */
function handleCoinFlipped(data) {
  console.log('🎲 Coin flipped:', data);

  const { slotNumber, targetFace, targetHit, power } = data;

  // Mark player as flipped
  markPlayerFlipped(slotNumber, targetFace);

  // Start flip animation (use power or default to 0.7)
  startFlipAnimation(slotNumber, targetFace, power || 0.7);

  // TODO: Play flip sound
}

/**
 * Handle player eliminated event
 */
function handlePlayerEliminated(data) {
  console.log('💀 Player eliminated:', data);

  const { slotNumber, playerAddress } = data;

  eliminatePlayer(slotNumber);
  markCoinEliminated(slotNumber);

  // Check if it's us
  const state = getGameState();
  if (state.playerSlot === slotNumber) {
    showEliminationMessage();
  }
}

/**
 * Handle coin updated event
 */
function handleCoinUpdated(data) {
  console.log('🪙 Coin updated:', data);

  const { slotNumber, coinData } = data;

  if (slotNumber === undefined || !coinData) {
    console.warn('⚠️ Invalid coin update data');
    return;
  }

  // Update the coin textures for this player
  import('../systems/coin-creator.js').then(({ updateCoinTextures }) => {
    updateCoinTextures(slotNumber, coinData.heads, coinData.tails);
    console.log(`✅ Updated coin textures for slot ${slotNumber}: ${coinData.name}`);
  }).catch(err => {
    console.error('❌ Failed to update coin textures:', err);
  });
}

/**
 * Handle state update event
 */
function handleStateUpdate(data) {
  console.log('📊 State update:', data);

  const { players, roundTarget, currentRound, phase, roundTimer } = data;

  // Update players (players is an object, not array)
  if (players && typeof players === 'object') {
    Object.values(players).forEach((playerData) => {
      if (playerData && playerData.slotNumber !== undefined) {
        updatePlayer(playerData.slotNumber, playerData);
      }
    });
  }

  // Update game state from server data
  const state = getGameState();
  if (roundTarget) {
    state.roundTarget = roundTarget;
  }
  if (currentRound !== undefined) {
    state.currentRound = currentRound;
  }
  if (phase) {
    state.gamePhase = phase;
    state.roundActive = phase === 'round_active';
  }
  if (roundTimer !== undefined) {
    state.roundTimeRemaining = roundTimer;
  }
}

/**
 * Process round results
 */
function processRoundResults(results) {
  results.forEach(result => {
    const { slotNumber, lives, matched } = result;

    updatePlayerLives(slotNumber, lives);

    // Update player stats if it's us
    const state = getGameState();
    if (state.playerSlot === slotNumber) {
      updatePlayerStats({
        lives,
        wins: matched ? state.playerStats.wins + 1 : state.playerStats.wins,
      });
    }
  });
}

/**
 * Start round countdown timer
 */
function startRoundTimer(duration) {
  let timeRemaining = duration;

  const timerInterval = setInterval(() => {
    timeRemaining--;

    // Update countdown display
    const countdownElement = document.getElementById('countdown');
    if (countdownElement) {
      countdownElement.textContent = `${timeRemaining}s`;
    }

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
    }
  }, 1000);
}

/**
 * Show winner announcement
 */
function showWinnerAnnouncement(winnerAddress, winnerSlot) {
  // TODO: Create winner UI overlay
  console.log(`🏆 Winner: ${winnerAddress} (Slot ${winnerSlot})`);

  alert(`🏆 Player ${winnerSlot + 1} wins!`);
}

/**
 * Show elimination message
 */
function showEliminationMessage() {
  // TODO: Create elimination UI overlay
  console.log('💀 You have been eliminated!');

  alert('💀 You have been eliminated! You can still watch the game.');
}

/**
 * Check if socket is connected
 */
export function isSocketConnected() {
  return isConnected;
}

/**
 * Get socket instance
 */
export function getSocket() {
  return socket;
}

/**
 * Disconnect socket
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    isConnected = false;
    console.log('🔌 Socket disconnected');
  }
}

export default {
  initializeSocket,
  sendFlipRequest,
  isSocketConnected,
  getSocket,
  disconnectSocket,
};
