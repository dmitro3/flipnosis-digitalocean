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
import { initializeSocket, sendFlipRequest, getSocket } from './core/socket-manager.js';

// Global state
let gameInitialized = false;
let playerAddress = null;
let playerFlipBalance = 0;
let unlockedCoins = ['plain']; // Plain coin is always unlocked
let customCoinHeads = null;
let customCoinTails = null;

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
    const { scene, camera, renderer } = await initializeScene();
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

  // Start game button
  const startGameButton = document.getElementById('start-game-button');
  startGameButton.addEventListener('click', handleStartGameClick);
}

/**
 * Handle change coin button click
 */
function handleChangeCoinClick() {
  console.log('🎨 Change coin clicked');
  showCoinPickerModal();
}

/**
 * Show coin picker modal
 */
function showCoinPickerModal() {
  const modal = document.getElementById('coin-picker-modal');
  if (!modal) return;

  // Fetch player profile data first
  fetchPlayerProfile();

  // Populate coin options
  populateCoinPicker();

  // Show modal
  modal.classList.remove('hidden');

  // Setup close handlers
  const closeButton = document.getElementById('close-coin-picker');
  closeButton.onclick = () => modal.classList.add('hidden');

  // Close on backdrop click
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  };
}

/**
 * Fetch player profile data (FLIP balance, unlocked coins, custom coins)
 */
function fetchPlayerProfile() {
  const socket = getSocket();
  if (!socket || !playerAddress) {
    console.warn('⚠️ Cannot fetch profile: no socket or address');
    return;
  }

  console.log('📋 Fetching player profile for:', playerAddress);

  // Remove old listener to prevent duplicates
  socket.off('player_profile_data');

  // Listen for profile data
  socket.on('player_profile_data', (profileData) => {
    console.log('📊 Received profile data:', profileData);

    playerFlipBalance = profileData.flip_balance || 0;

    try {
      unlockedCoins = JSON.parse(profileData.unlocked_coins || '["plain"]');
    } catch (e) {
      unlockedCoins = ['plain'];
    }

    customCoinHeads = profileData.custom_coin_heads;
    customCoinTails = profileData.custom_coin_tails;

    console.log('💰 FLIP balance:', playerFlipBalance);
    console.log('🪙 Unlocked coins:', unlockedCoins);

    // Update balance display if visible
    const balanceElement = document.getElementById('flip-balance');
    if (balanceElement) {
      balanceElement.textContent = playerFlipBalance;
    }

    // Refresh coin display
    populateCoinPicker();
  });

  // Request profile data
  socket.emit('get_player_profile', { address: playerAddress });
}

/**
 * Populate coin picker with available coins
 */
function populateCoinPicker() {
  const coinGrid = document.getElementById('coin-grid');
  if (!coinGrid) return;

  // Get currently selected coin from localStorage
  const savedCoinId = localStorage.getItem('selectedCoinId') || 'plain';

  // Default coins with FLIP unlock costs
  const defaultCoins = [
    { id: 'plain', name: 'Classic', heads: '/coins/plainh.png', tails: '/coins/plaint.png', cost: 0 },
    { id: 'skull', name: 'Skull', heads: '/coins/skullh.png', tails: '/coins/skullt.png', cost: 100 },
    { id: 'trump', name: 'Trump', heads: '/coins/trumpheads.webp', tails: '/coins/trumptails.webp', cost: 150 },
    { id: 'mario', name: 'Mario', heads: '/coins/mario.png', tails: '/coins/luigi.png', cost: 200 },
    { id: 'jestress', name: 'Jestress', heads: '/coins/jestressh.png', tails: '/coins/jestresst.png', cost: 250 },
    { id: 'dragon', name: '龙', heads: '/coins/dragonh.png', tails: '/coins/dragont.png', cost: 300 },
    { id: 'stinger', name: 'Stinger', heads: '/coins/stingerh.png', tails: '/coins/stingert.png', cost: 350 },
    { id: 'manga', name: 'Heroine', heads: '/coins/mangah.png', tails: '/coins/mangat.png', cost: 400 },
    { id: 'pharaoh', name: 'Pharaoh', heads: '/coins/pharaohh.png', tails: '/coins/pharaoht.png', cost: 450 },
    { id: 'calavera', name: 'Calavera', heads: '/coins/calaverah.png', tails: '/coins/calaverat.png', cost: 500 }
  ];

  // Clear existing options
  coinGrid.innerHTML = '';

  // Add each coin option with lock/unlock state
  defaultCoins.forEach(coin => {
    const isUnlocked = unlockedCoins.includes(coin.id);
    const canAfford = playerFlipBalance >= coin.cost;
    const isLocked = !isUnlocked && coin.cost > 0;

    const option = document.createElement('div');
    option.className = 'coin-option';
    option.dataset.coinId = coin.id;
    option.dataset.cost = coin.cost;
    option.dataset.unlocked = isUnlocked;

    if (coin.id === savedCoinId && isUnlocked) {
      option.classList.add('selected');
    }

    // Apply styling based on lock state
    if (isLocked) {
      option.style.opacity = '0.6';
      option.style.border = '2px solid rgba(255, 0, 0, 0.5)';
      option.style.background = 'rgba(255, 0, 0, 0.1)';
      option.style.cursor = canAfford ? 'pointer' : 'not-allowed';
    } else {
      option.style.border = '2px solid rgba(0, 255, 255, 0.3)';
      option.style.background = 'rgba(0, 255, 255, 0.05)';
      option.style.cursor = 'pointer';
    }

    option.innerHTML = `
      ${isLocked ? '<div style="position: absolute; top: 5px; right: 5px; background: rgba(255, 0, 0, 0.8); color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">🔒</div>' : ''}
      <div class="coin-preview-pair">
        <img src="${coin.heads}" alt="${coin.name} Heads" />
        <img src="${coin.tails}" alt="${coin.name} Tails" />
      </div>
      <div class="coin-name">${coin.name}</div>
      <div style="color: ${isUnlocked ? '#00ff88' : canAfford ? '#FFD700' : '#ff4444'}; font-size: 0.75rem; font-weight: bold; margin-top: 0.5rem;">
        ${isUnlocked ? 'UNLOCKED' : coin.cost > 0 ? `${coin.cost} FLIP` : 'FREE'}
      </div>
    `;

    option.onclick = () => handleCoinClick(coin, isUnlocked);

    coinGrid.appendChild(option);
  });

  // Add custom coin if available
  if (customCoinHeads && customCoinTails) {
    const option = document.createElement('div');
    option.className = 'coin-option';
    option.dataset.coinId = 'custom';
    option.dataset.cost = 0;
    option.dataset.unlocked = true;
    option.style.border = '2px solid rgba(0, 255, 255, 0.3)';
    option.style.background = 'rgba(0, 255, 255, 0.05)';

    option.innerHTML = `
      <div class="coin-preview-pair">
        <img src="${customCoinHeads}" alt="Custom Heads" />
        <img src="${customCoinTails}" alt="Custom Tails" />
      </div>
      <div class="coin-name">Custom</div>
      <div style="color: #00ff88; font-size: 0.75rem; font-weight: bold; margin-top: 0.5rem;">YOUR COIN</div>
    `;

    option.onclick = () => selectCoin({ id: 'custom', name: 'Custom', heads: customCoinHeads, tails: customCoinTails });

    coinGrid.appendChild(option);
  }

  console.log(`✅ Populated ${defaultCoins.length} coin options, unlocked: ${unlockedCoins.length}`);
}

/**
 * Handle coin click - check if locked and handle unlock
 */
function handleCoinClick(coin, isUnlocked) {
  console.log('🪙 Coin clicked:', coin.name, 'unlocked:', isUnlocked);

  if (!isUnlocked && coin.cost > 0) {
    // Try to unlock the coin
    if (playerFlipBalance >= coin.cost) {
      if (confirm(`Unlock ${coin.name} for ${coin.cost} FLIP?`)) {
        unlockCoin(coin);
      }
    } else {
      alert(`Not enough FLIP! You need ${coin.cost} FLIP but only have ${playerFlipBalance} FLIP.`);
    }
  } else {
    // Coin is unlocked, select it
    selectCoin(coin);
  }
}

/**
 * Unlock a coin via socket
 */
function unlockCoin(coin) {
  const socket = getSocket();
  if (!socket || !playerAddress) {
    alert('Cannot unlock coin: not connected');
    return;
  }

  console.log('🔓 Unlocking coin:', coin.id, 'cost:', coin.cost);

  socket.emit('unlock_coin', { address: playerAddress, coinId: coin.id, cost: coin.cost });

  socket.once('coin_unlocked', (result) => {
    if (result.success) {
      console.log('✅ Coin unlocked!', result);
      playerFlipBalance = result.newBalance;
      unlockedCoins = result.unlockedCoins;

      // Update FLIP balance display
      const balanceElement = document.getElementById('flip-balance');
      if (balanceElement) {
        balanceElement.textContent = playerFlipBalance;
      }

      // Refresh coin display
      populateCoinPicker();

      // Auto-select the newly unlocked coin
      selectCoin(coin);
    } else {
      alert(`Failed to unlock: ${result.error || 'Unknown error'}`);
    }
  });
}

/**
 * Select a coin
 */
function selectCoin(coin) {
  console.log('🪙 Selected coin:', coin.name);

  // Save to localStorage
  localStorage.setItem('selectedCoinId', coin.id);
  localStorage.setItem(`coinImage_heads_${playerAddress}`, coin.heads);
  localStorage.setItem(`coinImage_tails_${playerAddress}`, coin.tails);

  // Update selected state in modal
  document.querySelectorAll('.coin-option').forEach(el => el.classList.remove('selected'));
  const selectedOption = document.querySelector(`[data-coin-id="${coin.id}"]`);
  if (selectedOption) {
    selectedOption.classList.add('selected');
    selectedOption.style.borderColor = '#FFD700';
    selectedOption.style.borderWidth = '3px';
  }

  // Close modal after a short delay
  setTimeout(() => {
    document.getElementById('coin-picker-modal').classList.add('hidden');
  }, 300);
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
 * Handle start game button click
 */
function handleStartGameClick() {
  console.log('🚀 Start game button clicked');

  const socket = getSocket();
  if (!socket) {
    console.error('❌ No socket connection');
    return;
  }

  const state = getGameState();
  if (!state.gameId || !state.playerAddress) {
    console.error('❌ Missing game ID or player address');
    return;
  }

  console.log('🎮 Requesting game start...');

  socket.emit('grid_start_game', {
    gameId: state.gameId,
    playerAddress: state.playerAddress,
  });

  // Disable button
  const startButton = document.getElementById('start-game-button');
  if (startButton) {
    startButton.disabled = true;
    startButton.textContent = 'STARTING...';
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
