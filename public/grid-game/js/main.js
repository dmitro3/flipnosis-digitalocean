/**
 * Grid Game - Main Entry Point
 * Initializes and manages the grid-based coin flip game
 */

import { initializeScene, getScene } from './core/scene-setup.js';
import { startAnimationLoop, registerUpdateCallback } from './core/animation-loop.js';
import {
  initializeGameState,
  updatePowerMeter,
  getPowerValue,
  getGameState,
  updatePlayer,
} from './core/game-state.js';
import { calculateGridLayout } from './systems/grid-manager.js';
import { createCompleteCoinSetup } from './systems/coin-creator.js';
import { updateFlipAnimations } from './systems/coin-animator.js';
import { initializeSocket, sendFlipRequest } from './core/socket-manager.js';

// Global state
let gameInitialized = false;
let playerAddress = null;

/**
 * Initialize the game
 */
async function initGame() {
  console.log('🎮 Starting Grid Game...');

  try {
    // Get game ID from URL
    const gameId = getGameIdFromUrl();
    if (!gameId) {
      throw new Error('No game ID found in URL');
    }

    console.log(`🎮 Game ID: ${gameId}`);

    // Get player address from wallet or URL
    playerAddress = await getPlayerAddress();
    console.log(`👤 Player Address: ${playerAddress}`);

    // Initialize scene
    const { scene, camera, renderer } = initializeScene();
    console.log('✅ Scene initialized');

    // Initialize game state (we'll get real data from server later)
    const mockGameData = {
      gameId: gameId,
      playerAddress: playerAddress,
      maxPlayers: 6,
      gameMode: '6player',
    };
    initializeGameState(mockGameData);
    console.log('✅ Game state initialized');

    // Setup UI
    setupUI();
    console.log('✅ UI initialized');

    // Create grid and coins
    createInitialGrid(mockGameData.maxPlayers);
    console.log('✅ Grid and coins created');

    // Register update callbacks
    registerUpdateCallback(updatePowerBar);
    registerUpdateCallback(updateGameUI);
    registerUpdateCallback(updateFlipAnimations);

    // Start animation loop
    startAnimationLoop();
    console.log('✅ Animation loop started');

    // Initialize socket connection
    initializeSocket(gameId, playerAddress);
    console.log('✅ Socket initialized');

    // Hide loading screen
    hideLoadingScreen();

    gameInitialized = true;
    console.log('🎉 Grid game initialized successfully!');

  } catch (error) {
    console.error('❌ Error initializing game:', error);
    showError('Failed to initialize game: ' + error.message);
  }
}

/**
 * Create initial grid with mock players
 */
function createInitialGrid(maxPlayers) {
  console.log(`📐 Creating grid for ${maxPlayers} players...`);

  const layout = calculateGridLayout(maxPlayers);
  console.log('Grid layout:', layout);

  // Create coins for each slot
  for (let i = 0; i < maxPlayers; i++) {
    const position = layout.positions[i];

    // Mock player data
    const playerData = {
      slotNumber: i,
      address: null,
      name: `Player ${i + 1}`,
      avatar: null,
      isActive: false,
      isEliminated: false,
    };

    // Update player in state
    updatePlayer(i, playerData);

    // Create coin, background, and label
    createCompleteCoinSetup(i, position, playerData, null);
  }

  console.log(`✅ Created ${maxPlayers} coins in grid`);
}

/**
 * Get game ID from URL
 */
function getGameIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const gameId = params.get('gameId');

  // Also check hash for backwards compatibility
  if (!gameId) {
    const hash = window.location.hash;
    const match = hash.match(/gameId=([^&]+)/);
    return match ? match[1] : null;
  }

  return gameId;
}

/**
 * Get player address from wallet or URL
 */
async function getPlayerAddress() {
  // Check URL params first (for testing)
  const params = new URLSearchParams(window.location.search);
  const addressParam = params.get('address');
  if (addressParam) {
    return addressParam;
  }

  // Try to get from MetaMask/wallet
  if (typeof window.ethereum !== 'undefined') {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts && accounts.length > 0) {
        return accounts[0];
      }

      // Request account access
      const requestedAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (requestedAccounts && requestedAccounts.length > 0) {
        return requestedAccounts[0];
      }
    } catch (error) {
      console.error('Error getting wallet address:', error);
    }
  }

  // Fallback to mock address
  return '0x0000000000000000000000000000000000000001';
}

/**
 * Setup UI event listeners
 */
function setupUI() {
  // Sidebar toggle
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');

  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('hidden');
    sidebarToggle.textContent = sidebar.classList.contains('hidden') ? '▶' : '◀';
  });

  // Flip button
  const flipButton = document.getElementById('flip-button');
  flipButton.addEventListener('click', handleFlipButtonClick);

  // Mute button
  const muteButton = document.getElementById('mute-button');
  muteButton.addEventListener('click', handleMuteButtonClick);
}

/**
 * Update power bar visual
 */
function updatePowerBar() {
  const powerValue = updatePowerMeter();
  const powerBar = document.getElementById('power-bar');

  if (powerBar) {
    powerBar.style.width = `${powerValue * 100}%`;
  }
}

/**
 * Update game UI elements
 */
function updateGameUI() {
  const state = getGameState();

  // Update round display
  const roundElement = document.getElementById('current-round');
  if (roundElement) {
    roundElement.textContent = state.currentRound;
  }

  // Update target display
  const targetElement = document.getElementById('target-value');
  if (targetElement && state.roundTarget) {
    targetElement.textContent = state.roundTarget.toUpperCase();
  }

  // Update countdown
  const countdownElement = document.getElementById('countdown');
  if (countdownElement) {
    countdownElement.textContent = `${Math.ceil(state.roundTimeRemaining)}s`;
  }

  // Update player stats
  const livesElement = document.getElementById('player-lives');
  const winsElement = document.getElementById('player-wins');
  const flipsElement = document.getElementById('total-flips');

  if (livesElement) {
    livesElement.textContent = state.playerStats.lives;
  }
  if (winsElement) {
    winsElement.textContent = state.playerStats.wins;
  }
  if (flipsElement) {
    flipsElement.textContent = state.playerStats.totalFlips;
  }
}

/**
 * Handle flip button click
 */
function handleFlipButtonClick() {
  console.log('🎲 Flip button clicked');

  // Send flip request to server
  const success = sendFlipRequest();

  if (success) {
    console.log('✅ Flip request sent');

    // Disable button temporarily
    const flipButton = document.getElementById('flip-button');
    if (flipButton) {
      flipButton.disabled = true;
      flipButton.textContent = 'FLIPPING...';

      // Re-enable after 2 seconds
      setTimeout(() => {
        flipButton.disabled = false;
        flipButton.textContent = 'FLIP COIN';
      }, 2000);
    }
  }
}

/**
 * Handle mute button click
 */
function handleMuteButtonClick() {
  const button = document.getElementById('mute-button');
  // TODO: Implement audio muting
  console.log('🔇 Toggle mute');

  const isMuted = button.textContent.includes('Off');
  button.textContent = isMuted ? '🔊 Sound On' : '🔇 Sound Off';
}

/**
 * Hide loading screen
 */
function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.classList.add('hidden');
  }
}

/**
 * Show error message
 */
function showError(message) {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    const loadingText = loadingScreen.querySelector('.loading-text');
    if (loadingText) {
      loadingText.textContent = `❌ ${message}`;
      loadingText.style.color = '#ff1493';
    }
  }
}

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}

export default {
  initGame,
};
