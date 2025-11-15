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
} from './core/game-state.js';

// Global state
let gameInitialized = false;

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

    // Initialize scene
    const { scene, camera, renderer } = initializeScene();
    console.log('✅ Scene initialized');

    // Initialize game state (we'll get real data from server later)
    const mockGameData = {
      gameId: gameId,
      playerAddress: '0x0000000000000000000000000000000000000000', // Will be set by socket
      maxPlayers: 6,
      gameMode: '6player',
    };
    initializeGameState(mockGameData);
    console.log('✅ Game state initialized');

    // Setup UI
    setupUI();
    console.log('✅ UI initialized');

    // Register update callbacks
    registerUpdateCallback(updatePowerBar);
    registerUpdateCallback(updateGameUI);

    // Start animation loop
    startAnimationLoop();
    console.log('✅ Animation loop started');

    // Hide loading screen
    hideLoadingScreen();

    // TODO: Initialize socket connection
    // TODO: Create grid and coins
    // TODO: Handle player joins

    gameInitialized = true;
    console.log('🎉 Grid game initialized successfully!');

  } catch (error) {
    console.error('❌ Error initializing game:', error);
    showError('Failed to initialize game: ' + error.message);
  }
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

  const state = getGameState();

  if (!state.roundActive) {
    console.warn('⚠️ No active round');
    return;
  }

  if (state.playerSlot === null) {
    console.warn('⚠️ Player slot not set');
    return;
  }

  const player = state.players[state.playerSlot];
  if (player.hasFlipped) {
    console.warn('⚠️ Player already flipped this round');
    return;
  }

  // TODO: Send flip request to server
  console.log('🎲 Sending flip request...');
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
