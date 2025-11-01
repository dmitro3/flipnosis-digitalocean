/**
 * Main Game Entry Point
 * Initializes all systems and starts the game
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { initializeScene } from './core/scene-setup.js';
import { initializeSocket } from './core/socket-manager.js';
import { createTubes } from './systems/tube-creator.js';
import * as CoinManager from './systems/coin-manager.js';
import * as PearlPhysics from './systems/pearl-physics.js';
import * as GlassShatter from './systems/glass-shatter.js';
import * as PowerSystem from './systems/power-system.js';
import { initializeGameState, coinOptions, coinMaterials, saveGameState, loadGameState } from './core/game-state.js';
import { startAnimationLoop } from './core/animation-loop.js';
import { updateClientFromServerState } from './core/update-client-state.js';
import { isMobile, updateMobileBackground } from './utils/helpers.js';
import { playSound, stopSound, powerChargeSound } from './utils/audio.js';
import { triggerHaptic } from './utils/haptics.js';
import { TUBE_RADIUS, TUBE_HEIGHT } from './config.js';

/**
 * Initialize the game
 * Called from test-tubes.html after DOM loads
 */
export async function initGame(params) {
  console.log('🎮 Initializing game...');
  
  const {
    gameIdParam,
    walletParam,
    roomParam = 'potion',
    roleParam = 'player',
    tokenParam = ''
  } = params;
  
  // 1. Initialize Three.js scene
  const sceneData = await initializeScene(roomParam);
  const { 
    scene, 
    camera, 
    webglRenderer, 
    cssRenderer, 
    bloomComposer,
    physicsWorld,
    textureLoader,
    brassColorMap,
    brassDisplacementMap,
    tubeAlphaTexture
  } = sceneData;
  
  // 2. Initialize game state
  const gameState = initializeGameState();
  let playerSlot = -1;
  let currentRound = 1;
  let gameOver = false;
  let roundStartWins = [];
  let isServerSideMode = true;
  let isCharging = false;
  
  // 3. Initialize players array
  const players = gameState.players;
  
  // 4. Create empty arrays for tubes and coins (will be populated by createTubes)
  const tubes = [];
  const coins = [];
  
  // Helper functions that need to be passed to modules
  const updatePlayerCardButtons = () => {
    // This will be set up later when UI manager is available
    console.log('🔄 Updating player card buttons');
  };
  
  const showChoiceRequiredMessage = (slot) => {
    console.log(`⚠️ Choice required for player ${slot + 1}`);
  };
  
  const updatePlayerCardChoice = (slot, choice) => {
    const player = players[slot];
    if (player) {
      player.choice = choice;
      CoinManager.updateCoinRotationsFromPlayerChoices(tubes, players, coins);
    }
  };
  
  const applyCoinSelection = (slot, coinOption, materialOption) => {
    // This will be implemented by the coin manager
    console.log(`🪙 Applying coin selection for slot ${slot}:`, coinOption?.name, materialOption?.name);
  };
  
  const handleGameEnd = (data) => {
    gameOver = true;
    console.log('🏁 Game ended:', data);
  };
  
  const updateWinsDisplay = (slot) => {
    const tube = tubes[slot];
    const player = players[slot];
    if (tube?.cardElement && player) {
      const winsDisplay = tube.cardElement.querySelector('.wins-display');
      if (player.wins > 0) {
        if (!winsDisplay) {
          const playerInfo = tube.cardElement.querySelector('.player-info');
          if (playerInfo) {
            const winElement = document.createElement('div');
            winElement.className = 'wins-display';
            winElement.style.cssText = 'margin-top: 8px; justify-content: center; align-items: center;';
            winElement.textContent = 'WIN';
            playerInfo.appendChild(winElement);
          }
        } else {
          winsDisplay.textContent = 'WIN';
          winsDisplay.style.display = 'block';
        }
      } else {
        if (winsDisplay) {
          winsDisplay.style.display = 'none';
        }
      }
    }
  };
  
  const showResult = (slot, won, result) => {
    console.log(`🎯 Result for slot ${slot}: ${result}, won: ${won}`);
    // This will be implemented by UI manager
  };
  
  const showFlipReward = (slot, reward) => {
    console.log(`💰 Flip reward for slot ${slot}: ${reward}`);
    // This will be implemented by UI manager
  };
  
  const showFloatingMessage = (message, color, duration) => {
    console.log(`💬 ${message}`);
    // This will be implemented by UI manager
  };
  
  const updateRoundDisplay = () => {
    console.log(`📊 Round ${currentRound}`);
    // This will be implemented by UI manager
  };
  
  const updateTimerDisplay = (time) => {
    console.log(`⏱️ Timer: ${time}`);
    // This will be implemented by UI manager
  };
  
  const showCoinFlipResult = (data) => {
    CoinManager.showCoinFlipResult(
      data, 
      tubes, 
      coins, 
      players, 
      CoinManager.smoothLandCoin,
      updateWinsDisplay,
      showResult
    );
  };
  
  const startClientCoinFlipAnimation = (data) => {
    CoinManager.startClientCoinFlipAnimation(
      data,
      tubes,
      coins,
      coinMaterials,
      CoinManager.animateCoinFlip,
      showFlipReward
    );
  };
  
  const updatePowerChargingVisual = (data) => {
    PowerSystem.updatePowerChargingVisual(data, tubes, PearlPhysics.updatePearlColors);
  };
  
  const updateCoinAngleVisual = (data) => {
    CoinManager.updateCoinAngleVisual(data, tubes, coins);
  };
  
  const updatePlayerChoice = (data) => {
    if (data.playerSlot >= 0 && data.playerSlot < 4) {
      players[data.playerSlot].choice = data.choice;
      updatePlayerCardChoice(data.playerSlot, data.choice);
      CoinManager.updateCoinRotationsFromPlayerChoices(tubes, players, coins);
    }
  };
  
  const updateCoinFromServer = (data) => {
    CoinManager.updateCoinFromServer(
      data,
      tubes,
      coins,
      players,
      coinOptions,
      coinMaterials,
      applyCoinSelection
    );
  };
  
  const shatterGlassFunc = (tubeIndex, powerLevel) => {
    GlassShatter.shatterGlass(tubeIndex, powerLevel, tubes, scene, physicsWorld);
  };
  
  const flipCoinWithPower = (slot, power) => {
    // This will be implemented by power system
    console.log(`🪙 Flipping coin for slot ${slot} with power ${power}`);
  };
  
  const animateCoinFlip = (slot, power, duration) => {
    CoinManager.animateCoinFlip(slot, power, duration, tubes, coins, coinMaterials);
  };
  
  // 5. Create tubes (this also creates coins)
  const tubeDependencies = {
    scene,
    camera,
    physicsWorld,
    textureLoader,
    brassColorMap,
    brassDisplacementMap,
    tubeAlphaTexture,
    webglRenderer,
    roomParam,
    players,
    isServerSideMode,
    socket: null, // Will be set after socket initialization
    gameIdParam,
    walletParam,
    playerSlot,
    currentRound,
    saveGameState: (gameId, wallet, slot, round, players, tubes) => {
      saveGameState(gameId || gameIdParam, wallet || walletParam, slot, round || currentRound, players, tubes);
    },
    updatePlayerCardButtons,
    showChoiceRequiredMessage,
    showSweetSpotFeedback: PowerSystem.showSweetSpotFeedback,
    shatterGlassFunc,
    flipCoinWithPower,
    updateCoinRotationsFromPlayerChoicesFunc: (t, p, c) => {
      CoinManager.updateCoinRotationsFromPlayerChoices(t || tubes, p || players, c || coins);
    }
  };
  
  // 5. Create all 4 tubes at once
  const tubeResult = await createTubes(tubeDependencies);
  tubes.push(...tubeResult.tubes);
  coins.push(...tubeResult.coins);
  
  // 6. Initialize socket connection
  const socket = await initializeSocket({
    gameIdParam,
    walletParam,
    playerSlot,
    players,
    tubes,
    coins,
    scene,
    physicsWorld,
    gameState,
    currentRound,
    gameOver,
    coinOptions,
    coinMaterials,
    isCharging,
    isServerSideMode,
    TUBE_RADIUS,
    TUBE_HEIGHT,
    updatePlayerCardChoice,
    applyCoinSelection,
    handleGameEnd,
    updateClientFromServerState: (state) => {
      updateClientFromServerState(state, {
        gameOver,
        players,
        tubes,
        coins,
        scene,
        physicsWorld,
        playerSlot,
        walletParam,
        gameIdParam,
        currentRound,
        updateRoundDisplay,
        updateTimerDisplay,
        saveGameState: (gameId, wallet, slot, round, players, tubes) => {
          saveGameState(gameId, wallet, slot, round, players, tubes);
        },
        updateWinsDisplay,
        updatePlayerCardButtons,
        updatePearlColors: PearlPhysics.updatePearlColors,
        showGameOverScreen: () => {
          console.log('🏁 Game over');
          gameOver = true;
        }
      });
    },
    createMobilePlayerCards: () => {
      // Mobile UI creation
      if (isMobile()) {
        console.log('📱 Creating mobile player cards');
      }
    },
    startClientCoinFlipAnimation,
    showCoinFlipResult,
    updatePowerChargingVisual,
    updateCoinAngleVisual,
    updatePlayerChoice,
    updateCoinFromServer,
    shatterGlass: shatterGlassFunc,
    updatePlayerCardButtons,
    updateWinsDisplay,
    updateTimerDisplay,
    updateRoundDisplay,
    saveGameState: (gameId, wallet, slot, round, players, tubes) => {
      saveGameState(gameId, wallet, slot, round, players, tubes);
    },
    updatePearlColors: PearlPhysics.updatePearlColors,
    showFloatingMessage,
    showCoinSelector: () => {
      console.log('🪙 Showing coin selector');
      // This will be implemented by UI manager
    },
    showResult,
    updateRoundDisplay,
    showXPAwardNotification: () => console.log('⭐ XP awarded'),
    showGamePhaseIndicator: () => console.log('📊 Phase indicator'),
    showGameStartNotification: () => console.log('🎮 Game started'),
    showGameOverScreen: () => console.log('🏁 Game over'),
    loadGameState: () => loadGameState(gameIdParam, walletParam),
    updateCoinRotationsFromPlayerChoices: () => {
      CoinManager.updateCoinRotationsFromPlayerChoices(tubes, players, coins);
    }
  });
  
  // Update tube dependencies with socket
  tubeDependencies.socket = socket;
  
  // 7. Start animation loop
  startAnimationLoop({
    scene,
    camera,
    webglRenderer,
    cssRenderer,
    bloomComposer,
    physicsWorld,
    tubes,
    coins,
    socket,
    gameIdParam,
    walletParam,
    playerSlot,
    isServerSideMode
  });
  
  // 8. Setup mobile optimizations
  if (isMobile()) {
    updateMobileBackground(roomParam);
    window.addEventListener('orientationchange', () => {
      setTimeout(() => updateMobileBackground(roomParam), 50);
    });
  }
  
  // 9. Setup window resize handler
  window.addEventListener('resize', () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    
    webglRenderer.setSize(newWidth, newHeight);
    cssRenderer.setSize(newWidth, newHeight);
    bloomComposer.setSize(newWidth, newHeight);
  });
  
  console.log('✅ Game initialized successfully');
  
  // Return game objects for debugging/external access
  return {
    scene,
    camera,
    webglRenderer,
    cssRenderer,
    bloomComposer,
    physicsWorld,
    tubes,
    coins,
    players,
    socket,
    gameState,
    playerSlot,
    currentRound,
    gameOver,
    isServerSideMode
  };
}

// Make initGame available globally if needed
if (typeof window !== 'undefined') {
  window.initGame = initGame;
}
