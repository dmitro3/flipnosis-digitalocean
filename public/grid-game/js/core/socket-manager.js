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
let autoStartTimer = null;
let autoStartCountdown = 20;

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

  // Fetch full player profile from server to get avatar and name
  const socket = getSocket();
  socket.emit('player_get_profile', { address: playerAddress }, (profileData) => {
    console.log(`📊 Received profile for ${playerAddress}:`, profileData);

    // Prepare full player data with profile info
    const fullPlayerData = {
      address: playerAddress,
      name: profileData?.name || playerName || playerData?.name || `Player ${slotNumber + 1}`,
      isActive: true,
      lives: playerData?.lives || 3,
      avatar: profileData?.avatar || playerData?.avatar || null,
      ...playerData,
    };

    // Update player in state
    updatePlayer(slotNumber, fullPlayerData);

    // Update player label with real data
    import('../systems/coin-creator.js').then(({ updatePlayerLabel }) => {
      updatePlayerLabel(slotNumber, fullPlayerData);
    });
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

  // Start auto-start countdown when first player joins
  startAutoStartCountdown();
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

  // Clear auto-start timer if running
  if (autoStartTimer) {
    clearInterval(autoStartTimer);
    autoStartTimer = null;
    autoStartCountdown = 20;
  }

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

  const { winner, winnerSlot, winnerName } = data;

  setGameStatus('completed');
  setWinner(winnerSlot);

  // Show winner announcement
  showWinnerAnnouncement(winner, winnerSlot, winnerName);
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

  const { slotNumber, targetFace, targetHit, power, playerAddress } = data;

  // Mark player as flipped
  markPlayerFlipped(slotNumber, targetFace);

  // Start flip animation (use power or default to 0.7)
  startFlipAnimation(slotNumber, targetFace, power || 0.7);

  // Show win/loss notification for current player
  const state = getGameState();
  if (state.playerSlot === slotNumber) {
    setTimeout(() => {
      showFlipResult(targetHit);
    }, 1500); // Show after flip completes
  }

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

  // Get current state to check our slot
  const state = getGameState();

  // Update players (players is an object, not array)
  if (players && typeof players === 'object') {
    Object.values(players).forEach((playerData) => {
      if (playerData && playerData.slotNumber !== undefined) {
        updatePlayer(playerData.slotNumber, playerData);

        // If this is our player, sync lives to playerStats
        if (state.playerSlot !== null && playerData.slotNumber === state.playerSlot) {
          if (playerData.lives !== undefined) {
            updatePlayerStats({ lives: playerData.lives });
            console.log(`💚 Synced lives to sidebar: ${playerData.lives}`);
          }
        }

        // Update player label if player is active
        if (playerData.address) {
          import('../systems/coin-creator.js').then(({ updatePlayerLabel }) => {
            updatePlayerLabel(playerData.slotNumber, playerData);
          });
        }
      }
    });
  }

  // Update game state from server data
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

// Store timer interval so we can clear it
let roundTimerInterval = null;

/**
 * Start round countdown timer
 */
function startRoundTimer(duration) {
  // Clear any existing timer
  if (roundTimerInterval) {
    clearInterval(roundTimerInterval);
  }

  let timeRemaining = duration;

  // Update immediately
  const countdownElement = document.getElementById('countdown');
  if (countdownElement) {
    countdownElement.textContent = `${timeRemaining}s`;
  }

  roundTimerInterval = setInterval(() => {
    timeRemaining--;

    // Update countdown display
    if (countdownElement) {
      countdownElement.textContent = `${timeRemaining}s`;
    }

    if (timeRemaining <= 0) {
      clearInterval(roundTimerInterval);
      roundTimerInterval = null;
    }
  }, 1000);
}

/**
 * Start auto-start countdown (20 seconds)
 */
function startAutoStartCountdown() {
  // Only start countdown if not already running and game hasn't started
  const state = getGameState();
  if (autoStartTimer || state.gameStatus !== 'waiting') {
    return;
  }

  console.log('⏱️ Starting 20 second auto-start countdown...');

  // Hide start button and show countdown
  const startButton = document.getElementById('start-game-button');
  if (startButton) {
    startButton.textContent = `AUTO-START IN ${autoStartCountdown}s`;
    startButton.disabled = true;
  }

  autoStartTimer = setInterval(() => {
    autoStartCountdown--;

    // Update button text
    if (startButton) {
      startButton.textContent = `AUTO-START IN ${autoStartCountdown}s`;
    }

    console.log(`⏱️ Auto-start in ${autoStartCountdown} seconds...`);

    // When countdown reaches 0, start the game
    if (autoStartCountdown <= 0) {
      clearInterval(autoStartTimer);
      autoStartTimer = null;
      autoStartCountdown = 20; // Reset for next time

      console.log('🚀 Auto-starting game!');

      // Emit start game event
      const state = getGameState();
      if (socket && socket.connected && state.gameId && state.playerAddress) {
        socket.emit('grid_start_game', {
          gameId: state.gameId,
          playerAddress: state.playerAddress,
        });
      }
    }
  }, 1000);
}

/**
 * Show winner announcement
 */
function showWinnerAnnouncement(winnerAddress, winnerSlot, winnerName) {
  // TODO: Create winner UI overlay
  const displayName = winnerName || `Player ${winnerSlot + 1}`;
  console.log(`🏆 Winner: ${winnerAddress} (Slot ${winnerSlot}) - ${displayName}`);

  alert(`🏆 ${displayName} wins!`);
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
 * Show flip result notification
 */
function showFlipResult(targetHit) {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 30px 60px;
    background: ${targetHit ? 'rgba(0, 255, 0, 0.9)' : 'rgba(255, 0, 0, 0.9)'};
    color: white;
    font-family: 'Orbitron', monospace;
    font-size: 2.5rem;
    font-weight: bold;
    border-radius: 20px;
    box-shadow: 0 0 30px ${targetHit ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)'};
    z-index: 10000;
    animation: fadeIn 0.3s ease-out;
  `;

  notification.textContent = targetHit ? '✓ HIT!' : '✗ MISS!';
  document.body.appendChild(notification);

  // Add CSS animation
  if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.5);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
      }
      @keyframes fadeOut {
        from {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
        to {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.5);
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Remove after 2 seconds with fade out
  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 2000);
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
