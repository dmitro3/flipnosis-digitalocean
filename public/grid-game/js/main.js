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
    updateLoadingText('Getting game ID...');
    const gameId = getGameIdFromUrl();
    if (!gameId) {
      throw new Error('No game ID found in URL');
    }

    console.log(`🎮 Game ID: ${gameId}`);

    // Get player address from wallet or URL
    updateLoadingText('Connecting wallet...');
    playerAddress = await getPlayerAddress();
    console.log(`👤 Player Address: ${playerAddress}`);

    // Initialize scene
    updateLoadingText('Initializing 3D scene...');
    const { scene, camera, renderer } = initializeScene();
    console.log('✅ Scene initialized');

    // Initialize game state (we'll get real data from server later)
    updateLoadingText('Setting up game state...');
    const mockGameData = {
      gameId: gameId,
      playerAddress: playerAddress,
      maxPlayers: 6,
      gameMode: '6player',
    };
    initializeGameState(mockGameData);
    console.log('✅ Game state initialized');

    // Setup UI
    updateLoadingText('Setting up UI...');
    setupUI();
    console.log('✅ UI initialized');

    // Create grid and coins
    updateLoadingText('Creating coin grid...');
    createInitialGrid(mockGameData.maxPlayers);
    console.log('✅ Grid and coins created');

    // Register update callbacks
    updateLoadingText('Starting animation...');
    registerUpdateCallback(updatePowerBar);
    registerUpdateCallback(updateGameUI);
    registerUpdateCallback(updateFlipAnimations);

    // Start animation loop
    startAnimationLoop();
    console.log('✅ Animation loop started');

    // Initialize socket connection
    updateLoadingText('Connecting to game server...');
    initializeSocket(gameId, playerAddress);
    console.log('✅ Socket initialized');

    // Load NFT data
    updateLoadingText('Loading prize NFT...');
    loadNFTData(gameId);

    // Hide loading screen
    setTimeout(() => {
      hideLoadingScreen();
    }, 500);

    gameInitialized = true;
    console.log('🎉 Grid game initialized successfully!');

  } catch (error) {
    console.error('❌ Error initializing game:', error);
    showError('Failed to initialize: ' + error.message);
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
    console.log('Using address from URL params:', addressParam);
    return addressParam;
  }

  // Check localStorage (set by BattleRoyaleGameContext)
  const storedAddress = localStorage.getItem('walletAddress');
  if (storedAddress) {
    console.log('Using address from localStorage:', storedAddress);
    return storedAddress;
  }

  // Try to get from MetaMask/wallet
  if (typeof window.ethereum !== 'undefined') {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts && accounts.length > 0) {
        console.log('Using address from MetaMask (connected):', accounts[0]);
        return accounts[0];
      }

      // Don't request account access automatically - user should connect first
      console.warn('MetaMask not connected, cannot request accounts without user interaction');
    } catch (error) {
      console.error('Error getting wallet address:', error);
    }
  }

  // Fallback to mock address
  console.warn('No wallet address found, using fallback address');
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

  // Change coin button
  const changeCoinButton = document.getElementById('change-coin-button');
  changeCoinButton.addEventListener('click', handleChangeCoinClick);

  // Load player coin images
  loadPlayerCoinImages();
}

/**
 * Handle change coin button click
 */
function handleChangeCoinClick() {
  console.log('🎨 Change coin clicked');
  // Navigate to coin customization page or show modal
  // For now, redirect to profile page
  window.location.href = '/profile';
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
 * Load NFT data from server
 */
async function loadNFTData(gameId) {
  try {
    const response = await fetch(`/api/battle-royale/${gameId}`);
    const data = await response.json();

    if (data && data.nft_image) {
      const nftImage = document.getElementById('nft-image');
      const nftName = document.getElementById('nft-name');

      if (nftImage) {
        nftImage.src = data.nft_image;
        nftImage.alt = data.nft_name || 'Prize NFT';
      }

      if (nftName) {
        nftName.textContent = data.nft_name || data.nft_collection || 'Prize NFT';
      }

      console.log('✅ Loaded NFT data:', data.nft_name);
    }
  } catch (error) {
    console.error('Failed to load NFT data:', error);
  }
}

/**
 * Load player coin images from localStorage/API
 */
async function loadPlayerCoinImages() {
  try {
    // Check if player has custom coin images in localStorage
    const headsImage = localStorage.getItem(`coinImage_heads_${playerAddress}`);
    const tailsImage = localStorage.getItem(`coinImage_tails_${playerAddress}`);

    const headsPreview = document.getElementById('heads-preview');
    const tailsPreview = document.getElementById('tails-preview');

    if (headsImage && headsPreview) {
      headsPreview.src = headsImage;
    }

    if (tailsImage && tailsPreview) {
      tailsPreview.src = tailsImage;
    }

    console.log('✅ Loaded player coin images');
  } catch (error) {
    console.error('Failed to load player coin images:', error);
  }
}

/**
 * Update loading screen text
 */
function updateLoadingText(message) {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    const loadingText = loadingScreen.querySelector('.loading-text');
    if (loadingText) {
      loadingText.textContent = message;
      console.log(`⏳ ${message}`);
    }
  }
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
    const spinner = loadingScreen.querySelector('.loading-spinner');

    if (spinner) {
      spinner.style.display = 'none';
    }

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
