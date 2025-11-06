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
    tubes.forEach((tube, i) => {
      if (tube.cardElement) {
        const player = players[i];
        if (!player || player.isEmpty) return;
        
        // Determine if this is the current player's slot
        const isCurrentPlayer = isServerSideMode ? (playerSlot === i) : true;
        
        // Update choice buttons visibility
        const choiceButtons = tube.cardElement.querySelector('.choice-buttons');
        const choiceBadge = tube.cardElement.querySelector('.choice-badge');
        
        if (isCurrentPlayer) {
          // Show choice buttons for current player only if they haven't made a choice yet
          if (player.choice) {
            // Player has made a choice - show the badge
            if (choiceButtons) choiceButtons.style.display = 'none';
            if (choiceBadge) {
              choiceBadge.style.display = 'inline-block';
              choiceBadge.textContent = player.choice.toUpperCase();
              choiceBadge.className = `choice-badge ${player.choice}`;
            }
          } else {
            // Player hasn't made a choice yet - show buttons
            if (choiceBadge) choiceBadge.style.display = 'none';
            if (choiceButtons) choiceButtons.style.display = 'flex';
          }
        } else if (player.choice) {
          // Show choice badge for other players
          if (choiceButtons) choiceButtons.style.display = 'none';
          if (choiceBadge) {
            choiceBadge.style.display = 'block';
            choiceBadge.textContent = player.choice.toUpperCase();
            choiceBadge.className = `choice-badge ${player.choice}`;
          }
        } else {
          // Hide everything for other players without choices
          if (choiceButtons) choiceButtons.style.display = 'none';
          if (choiceBadge) choiceBadge.style.display = 'none';
        }
        
        // Update action buttons visibility
        const actionButtons = tube.cardElement.querySelectorAll('.action-btn');
        
        if (isCurrentPlayer) {
          // Show action buttons for current player
          actionButtons.forEach(btn => {
            btn.style.display = 'block';
            btn.style.pointerEvents = 'auto';
          });
        } else {
          // Hide action buttons for other players
          actionButtons.forEach(btn => btn.style.display = 'none');
        }
      }
    });
    console.log('🔄 Updated player card buttons');
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
    if (slot < 0 || slot >= tubes.length) {
      console.warn(`⚠️ Invalid slot ${slot} for coin selection`);
      return;
    }
    
    const tube = tubes[slot];
    const coin = coins[slot];
    
    if (!tube || !coin || !coinOption || !materialOption) {
      console.warn(`⚠️ Missing dependencies for coin selection at slot ${slot}`);
      return;
    }
    
    console.log(`🪙 Applying coin selection for slot ${slot}:`, coinOption?.name, materialOption?.name);
    
    // Store selections in tube
    tube.selectedCoin = coinOption;
    tube.selectedMaterial = materialOption;
    
    // Load and apply coin textures
    const loader = new THREE.TextureLoader();
    
    loader.load(coinOption.headsImage, (headsTexture) => {
      headsTexture.minFilter = THREE.LinearFilter;
      headsTexture.magFilter = THREE.LinearFilter;
      headsTexture.anisotropy = webglRenderer.capabilities.getMaxAnisotropy();
      headsTexture.generateMipmaps = false;
      
      loader.load(coinOption.tailsImage, (tailsTexture) => {
        tailsTexture.minFilter = THREE.LinearFilter;
        tailsTexture.magFilter = THREE.LinearFilter;
        tailsTexture.anisotropy = webglRenderer.capabilities.getMaxAnisotropy();
        tailsTexture.generateMipmaps = false;
        
        // Update coin textures
        if (coin.material && coin.material[1] && coin.material[1].uniforms) {
          coin.material[1].uniforms.map.value = headsTexture;
          coin.material[1].needsUpdate = true;
        }
        
        if (coin.material && coin.material[2] && coin.material[2].uniforms) {
          coin.material[2].uniforms.map.value = tailsTexture;
          coin.material[2].needsUpdate = true;
        }
        
        // Update coin edge color based on material
        if (coin.material && coin.material[0]) {
          const edgeColor = new THREE.Color(materialOption.edgeColor);
          coin.material[0].color.copy(edgeColor);
          coin.material[0].emissive.copy(edgeColor);
          coin.material[0].emissiveIntensity = 0.3;
          coin.material[0].needsUpdate = true;
        }
        
        console.log(`✅ Applied ${coinOption.name} with ${materialOption.name} material to slot ${slot + 1}'s coin`);
        
        // Send to server if in server-side mode
        // CRITICAL FIX: Use tube's socket if available, check if connected
        const activeSocket = tubes[slot]?.socket || socket;
        if (isServerSideMode && activeSocket && activeSocket.connected && gameIdParam && walletParam && playerSlot === slot) {
          activeSocket.emit('physics_update_coin', {
            gameId: gameIdParam,
            address: walletParam,
            coinData: {
              coinId: coinOption.id,
              materialId: materialOption.id,
              id: coinOption.id,
              name: coinOption.name,
              headsImage: coinOption.headsImage,
              tailsImage: coinOption.tailsImage,
              material: materialOption
            }
          });
          console.log(`📤 Sent coin selection to server: ${coinOption.id} / ${materialOption.id}`);
        } else {
          console.warn(`⚠️ Cannot send coin update: socket=${!!activeSocket}, connected=${activeSocket?.connected}, gameId=${!!gameIdParam}, wallet=${!!walletParam}, slot=${slot}, playerSlot=${playerSlot}`);
        }
      }, undefined, (error) => {
        console.error(`❌ Failed to load tails texture for ${coinOption.name}:`, error);
      });
    }, undefined, (error) => {
      console.error(`❌ Failed to load heads texture for ${coinOption.name}:`, error);
    });
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
    // Update desktop round display
    const roundNumberEl = document.getElementById('round-number');
    if (roundNumberEl) {
      roundNumberEl.textContent = currentRound;
    }
    // Update mobile round display
    const mobileRoundNumberEl = document.getElementById('mobile-round-number');
    if (mobileRoundNumberEl) {
      mobileRoundNumberEl.textContent = currentRound;
    }
  };
  
  const updateTimerDisplay = (time) => {
    console.log(`⏱️ Timer: ${time}`);
    // Update desktop timer display
    const timerValueEl = document.getElementById('timer-value');
    if (timerValueEl) {
      timerValueEl.textContent = time;
    }
    // Update mobile timer display
    const mobileTimerValueEl = document.getElementById('mobile-timer-value');
    if (mobileTimerValueEl) {
      mobileTimerValueEl.textContent = time;
    }
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

  // Define showGameOverScreen before it's used in initializeSocket
  const showGameOverScreen = (winnerIndex, winnerName) => {
    console.log('🏁 GAME OVER - Showing end screen');
    
    // Prevent duplicate game over screens
    if (gameOver) {
      console.log('⚠️ Game over screen already shown, ignoring duplicate call');
      return;
    }
    
    // Stop any ongoing game mechanics
    gameOver = true;
    
    // Determine if current player won
    const didCurrentPlayerWin = (playerSlot === winnerIndex);
    
    console.log(`🏁 Game Over Debug:`, {
      playerSlot,
      winnerIndex,
      didCurrentPlayerWin,
      winnerName
    });
    
    // Show immediate game over overlay
    const existingOverlay = document.getElementById('game-over-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }
    
    const gameOverDiv = document.createElement('div');
    gameOverDiv.id = 'game-over-overlay';
    gameOverDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: 'Orbitron', sans-serif;
    `;
    
    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = `
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      border: 4px solid ${didCurrentPlayerWin ? '#FFD700' : '#ff0000'};
      border-radius: 25px;
      padding: 50px;
      text-align: center;
      box-shadow: 0 0 50px ${didCurrentPlayerWin ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)'};
      max-width: 600px;
      width: 90%;
    `;
    
    // Show different content based on win/lose
    if (didCurrentPlayerWin && winnerIndex >= 0) {
      contentDiv.innerHTML = `
        <div style="font-size: 80px; margin-bottom: 20px;">🏆</div>
        <div style="font-size: 48px; font-weight: bold; color: #FFD700; margin-bottom: 20px;">
          VICTORY!
        </div>
        <div style="font-size: 24px; color: #ffffff; margin-bottom: 30px;">
          ${winnerName || 'You'} won the game!
        </div>
        <button onclick="location.reload()" style="
          background: linear-gradient(135deg, #00ff00, #39ff14);
          border: none;
          border-radius: 15px;
          padding: 15px 30px;
          font-family: 'Orbitron', sans-serif;
          font-size: 18px;
          font-weight: bold;
          color: #000;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 2px;
          transition: all 0.3s ease;
        ">Play Again</button>
      `;
    } else if (winnerIndex >= 0) {
      contentDiv.innerHTML = `
        <div style="font-size: 80px; margin-bottom: 20px;">😢</div>
        <div style="font-size: 48px; font-weight: bold; color: #ff0000; margin-bottom: 20px;">
          DEFEAT
        </div>
        <div style="font-size: 24px; color: #ffffff; margin-bottom: 30px;">
          ${winnerName || 'Unknown'} won the game
        </div>
        <button onclick="location.reload()" style="
          background: linear-gradient(135deg, #ff4444, #cc0000);
          border: none;
          border-radius: 15px;
          padding: 15px 30px;
          font-family: 'Orbitron', sans-serif;
          font-size: 18px;
          font-weight: bold;
          color: #fff;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 2px;
          transition: all 0.3s ease;
        ">Play Again</button>
      `;
    } else {
      contentDiv.innerHTML = `
        <div style="font-size: 80px; margin-bottom: 20px;">⏸️</div>
        <div style="font-size: 48px; font-weight: bold; color: #ffaa00; margin-bottom: 20px;">
          GAME OVER
        </div>
        <div style="font-size: 24px; color: #ffffff; margin-bottom: 30px;">
          The game has ended
        </div>
        <button onclick="location.reload()" style="
          background: linear-gradient(135deg, #9d00ff, #c44aff);
          border: none;
          border-radius: 15px;
          padding: 15px 30px;
          font-family: 'Orbitron', sans-serif;
          font-size: 18px;
          font-weight: bold;
          color: #fff;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 2px;
          transition: all 0.3s ease;
        ">Play Again</button>
      `;
    }
    
    gameOverDiv.appendChild(contentDiv);
    document.body.appendChild(gameOverDiv);
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
  
  // Store showCoinSelector function for later use
  let showCoinSelectorFunc = null;
  
  // 6. Initialize socket connection
  const socketDeps = {
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
    updateClientFromServerState: (state, overrideDeps) => {
      // Use override dependencies if provided (from socket-manager), otherwise use local ones
      // Pass playerSlot and currentRound as part of mutable objects so they can be updated
      const playerSlotRef = { value: playerSlot };
      const currentRoundRef = { value: currentRound };
      const deps = overrideDeps || {
        gameOver,
        players,
        tubes,
        coins,
        scene,
        physicsWorld,
        playerSlot: playerSlotRef.value,
        playerSlotRef, // Mutable reference
        walletParam,
        gameIdParam,
        currentRound: currentRoundRef.value,
        currentRoundRef, // Mutable reference
        updateRoundDisplay,
        updateTimerDisplay,
        saveGameState: (gameId, wallet, slot, round, players, tubes) => {
          saveGameState(gameId, wallet, slot, round, players, tubes);
        },
        updateWinsDisplay,
        updatePlayerCardButtons,
        updatePearlColors: PearlPhysics.updatePearlColors,
        showGameOverScreen
      };
      // Call the imported updateClientFromServerState function
      const result = updateClientFromServerState(state, deps);
      // Update playerSlot if it was modified AND the new value is valid (>= 0)
      // Don't reset to -1 if we already have a valid slot
      if (deps.playerSlotRef && deps.playerSlotRef.value !== playerSlot) {
        // Only update if new value is valid, or if current value is invalid (-1)
        if (deps.playerSlotRef.value >= 0 || playerSlot < 0) {
          playerSlot = deps.playerSlotRef.value;
          console.log(`🔄 Updated playerSlot to: ${playerSlot}`);
        } else {
          console.log(`⚠️ Ignoring playerSlot update to ${deps.playerSlotRef.value} (keeping current valid slot: ${playerSlot})`);
        }
      }
      // Update currentRound if it was modified
      if (deps.currentRoundRef && deps.currentRoundRef.value !== currentRound) {
        currentRound = deps.currentRoundRef.value;
        console.log(`🔄 Updated currentRound to: ${currentRound}`);
      }
      return result;
    },
    createMobilePlayerCards: () => {
      const container = document.getElementById('mobile-player-cards');
      if (!container) {
        return;
      }

      console.log('📱 Creating mobile player cards...', { tubes: tubes.length, players: players.length });
      container.innerHTML = '';
      
      for (let i = 0; i < 4; i++) {
        const player = players[i];
        const box = document.createElement('div');
        box.className = 'player-box';
        
        if (player && !player.isEmpty) {
          box.innerHTML = `
            <img src="${player.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Vc2VyPC90ZXh0Pjwvc3ZnPg=='}" class="player-avatar" alt="${player.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Vc2VyPC90ZXh0Pjwvc3ZnPg==';" />
            <div class="player-info">
              <div class="player-name">${player.name}</div>
              <div class="player-wins">🏆 ${player.wins}</div>
            </div>
          `;
        } else {
          box.innerHTML = `
            <div class="player-info">
              <div class="player-name">Empty</div>
              <div class="player-wins">-</div>
            </div>
          `;
        }
        
        container.appendChild(box);
      }
      
      console.log(`📱 Mobile player boxes created: ${container.children.length} boxes`);
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
    showResult,
    showXPAwardNotification: () => console.log('⭐ XP awarded'),
    showGamePhaseIndicator: () => console.log('📊 Phase indicator'),
    showGameStartNotification: () => {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #00ff00, #39ff14);
        border: 3px solid #00ff00;
        border-radius: 20px;
        padding: 40px 60px;
        text-align: center;
        font-family: 'Orbitron', sans-serif;
        color: #000;
        font-size: 32px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 3px;
        box-shadow: 0 0 60px rgba(0, 255, 0, 0.8);
        z-index: 10001;
        animation: gameStartPulse 0.5s ease-out;
      `;
      
      notification.innerHTML = `
        <div style="margin-bottom: 10px;">🎮</div>
        <div>GAME STARTED!</div>
        <div style="font-size: 18px; margin-top: 10px;">Round 1 Beginning</div>
      `;
      
      const style = document.createElement('style');
      if (!document.getElementById('game-start-animation')) {
        style.id = 'game-start-animation';
        style.textContent = `
          @keyframes gameStartPulse {
            0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
            50% { transform: translate(-50%, -50%) scale(1.1); }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          }
        `;
        document.head.appendChild(style);
      }
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.animation = 'gameStartPulse 0.5s ease-out reverse';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 500);
      }, 3000);
    },
    showGameOverScreen,
    showCoinSelector: (tubeIndex) => {
      // This is a placeholder - will be replaced after socket is created
      console.warn(`⚠️ showCoinSelector called before socket is ready for tube ${tubeIndex}`);
    },
    loadGameState: () => loadGameState(gameIdParam, walletParam),
    updateCoinRotationsFromPlayerChoices: () => {
      CoinManager.updateCoinRotationsFromPlayerChoices(tubes, players, coins);
    }
  };
  
  // Initialize socket with dependencies
  const socket = initializeSocket(socketDeps);
  
  // CRITICAL FIX: Update socket reference in all tubes after socket is created
  // Also add connection status check
  tubes.forEach(tube => {
    tube.socket = socket;
  });
  console.log(`✅ Updated socket reference in ${tubes.length} tubes`);
  console.log(`🔌 Socket connected: ${socket.connected}, Socket ID: ${socket.id || 'pending'}`);
  
  // Wait for socket connection if not already connected
  if (!socket.connected) {
    socket.once('connect', () => {
      console.log(`✅ Socket connected! Updating all tubes with socket reference`);
      tubes.forEach(tube => {
        tube.socket = socket;
      });
    });
  }
  
  // Now that socket exists, update showCoinSelector to use it
  socketDeps.showCoinSelector = (tubeIndex) => {
    console.log(`🪙 showCoinSelector called for tube ${tubeIndex}`);
    // Use absolute path from root to ensure it resolves correctly on production server
    // Try multiple path variations in case of server routing issues
    const paths = [
      '/js/ui/coin-selector.js',
      './js/ui/coin-selector.js',
      'js/ui/coin-selector.js'
    ];
    
    let pathIndex = 0;
    const tryImport = () => {
      if (pathIndex >= paths.length) {
        console.error('❌ Failed to load coin selector from all paths:', paths);
        alert('Failed to load coin selector. Please refresh the page.');
        return;
      }
      
      const path = paths[pathIndex];
      console.log(`🔄 Trying to load coin selector from: ${path}`);
      
      import(path).then(({ showCoinSelector: showSelector }) => {
        console.log(`✅ Successfully loaded coin selector from: ${path}`);
        showSelector(tubeIndex, {
          tubes,
          players,
          coinOptions,
          coinMaterials,
          walletParam,
          gameIdParam,
          playerSlot,
          socket, // Socket is now available
          isServerSideMode,
          webglRenderer,
          applyCoinSelection
        });
      }).catch(err => {
        console.warn(`⚠️ Failed to load from ${path}, trying next path...`, err);
        pathIndex++;
        tryImport();
      });
    };
    
    tryImport();
  };
  
  // Store reference for button access
  showCoinSelectorFunc = socketDeps.showCoinSelector;
  
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
  
  // Setup change coin button - unified handler for both mobile and desktop
  // Use the top-left coin button (#change-coin-btn) for both platforms
  setTimeout(() => {
    // Helper function to open coin selector
    const openCoinSelector = () => {
      let currentPlayerSlot = playerSlot;
      
      if (currentPlayerSlot === undefined || currentPlayerSlot < 0) {
        currentPlayerSlot = players.findIndex(p => p.address && walletParam && p.address.toLowerCase() === walletParam.toLowerCase());
        console.log(`🔍 Fallback search found player slot: ${currentPlayerSlot}`);
      }
      
      if (currentPlayerSlot !== undefined && currentPlayerSlot >= 0) {
        console.log(`🪙 Opening coin selector for player slot ${currentPlayerSlot}`);
        // Use the stored showCoinSelector function
        if (showCoinSelectorFunc) {
          showCoinSelectorFunc(currentPlayerSlot);
        } else {
          // Fallback: import and call directly
          const tryCoinSelectorImport = async () => {
            const paths = ['/js/ui/coin-selector.js', './js/ui/coin-selector.js', 'js/ui/coin-selector.js'];
            for (const path of paths) {
              try {
                const { showCoinSelector: showSelector } = await import(path);
                showSelector(currentPlayerSlot, {
                  tubes,
                  players,
                  coinOptions,
                  coinMaterials,
                  walletParam,
                  gameIdParam,
                  playerSlot,
                  socket,
                  isServerSideMode,
                  webglRenderer,
                  applyCoinSelection
                });
                return;
              } catch (err) {
                console.warn(`⚠️ Failed to load from ${path}, trying next...`, err);
              }
            }
            console.error('❌ Failed to load coin selector from all paths');
            alert('Failed to load coin selector. Please refresh the page.');
          };
          tryCoinSelectorImport();
        }
      } else {
        console.warn('⚠️ Player slot not found for coin selection', {
          playerSlot,
          walletParam,
          players: players.map((p, i) => ({ slot: i, address: p.address, name: p.name }))
        });
      }
    };
    
    // Hook up the desktop HTML button (#change-coin-btn) - top left
    const desktopChangeCoinBtn = document.getElementById('change-coin-btn');
    if (desktopChangeCoinBtn) {
      desktopChangeCoinBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🪙 Desktop change coin button clicked');
        openCoinSelector();
      });
    }
    
    // Hook up mobile button - it should trigger the same top-left button
    const mobileChangeCoinBtn = document.getElementById('mobile-change-coin');
    if (mobileChangeCoinBtn) {
      mobileChangeCoinBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🪙 Mobile change coin button clicked');
        // Trigger the desktop button if it exists, otherwise open directly
        if (desktopChangeCoinBtn) {
          desktopChangeCoinBtn.click();
        } else {
          openCoinSelector();
        }
      });
    }
  }, 100);
  
  // Function to load participants from API and update players
  const loadParticipants = async () => {
    if (!gameIdParam) {
      console.warn('⚠️ Cannot load participants: no gameId');
      return players;
    }
    
    try {
      console.log(`📡 Fetching participants for game: ${gameIdParam}`);
      const res = await fetch(`/api/battle-royale/${encodeURIComponent(gameIdParam)}`);
      if (!res.ok) {
        console.warn('⚠️ Failed to load participants:', res.status, res.statusText);
        return players;
      }
      
      const data = await res.json();
      const parts = (data?.game?.participants || []).slice().sort((a, b) => (a.slot_number || 0) - (b.slot_number || 0));
      console.log('👥 Raw participants data:', parts);
      
      // Completely replace players array (like reference implementation)
      const newPlayers = [1, 2, 3, 4].map((slot, idx) => {
        const p = parts[idx];
        if (!p) {
          console.log(`📭 Slot ${idx + 1}: Empty`);
          return {
            id: idx + 1,
            name: 'Empty',
            wins: 0,
            address: '',
            choice: null,
            avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Vc2VyPC90ZXh0Pjwvc3ZnPg==',
            isEmpty: true
          };
        }
        
        const playerData = {
          id: idx + 1,
          name: p.username || p.name || `Player ${idx + 1}`,
          wins: p.wins || 0,
          address: p.player_address || '',
          choice: null,
          avatar: p.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Vc2VyPC90ZXh0Pjwvc3ZnPg==',
          isEmpty: false
        };
        
        console.log(`👤 Slot ${idx + 1}:`, {
          raw: p,
          processed: playerData
        });
        
        // If this is the current player, set playerSlot
        if (walletParam && p.player_address && p.player_address.toLowerCase() === walletParam.toLowerCase()) {
          playerSlot = idx;
          console.log(`🎮 Current player slot set to: ${playerSlot}`);
        }
        
        return playerData;
      });
      
      // Replace the entire players array
      players.length = 0;
      players.push(...newPlayers);
      
      console.log('✅ Participants mapped:', players.map(p => ({ name: p.name, isEmpty: p.isEmpty })));
      
      // Update all player cards
      tubes.forEach((tube, idx) => {
        const player = players[idx];
        if (!tube.cardElement || !player) return;
        
        const nameEl = tube.cardElement.querySelector('.player-name');
        const avatarEl = tube.cardElement.querySelector('.player-avatar');
        const winsEl = tube.cardElement.querySelector('.wins-display span:last-child');
        const overlayEl = tube.cardElement.querySelector('.empty-slot-overlay');
        
        if (nameEl) nameEl.textContent = player.name;
        if (avatarEl) {
          avatarEl.src = player.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Vc2VyPC90ZXh0Pjwvc3ZnPg==';
          avatarEl.onerror = function() {
            this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Vc2VyPC90ZXh0Pjwvc3ZnPg==';
          };
          avatarEl.alt = player.name;
        }
        if (winsEl) winsEl.textContent = player.wins;
        
        // Remove empty overlay if player exists
        if (overlayEl && !player.isEmpty) {
          overlayEl.remove();
          console.log(`✅ Removed overlay from player slot ${idx + 1}`);
        } else if (!overlayEl && player.isEmpty) {
          // Add empty overlay
          const overlay = document.createElement('div');
          overlay.className = 'empty-slot-overlay';
          overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 50, 0.9);
            border-radius: 16px;
            z-index: 10;
          `;
          tube.cardElement.appendChild(overlay);
        }
      });
      
      updatePlayerCardButtons();
      
      // Call createMobilePlayerCards via socket dependency if available, otherwise create directly
      const container = document.getElementById('mobile-player-cards');
      if (container) {
        container.innerHTML = '';
        for (let i = 0; i < 4; i++) {
          const player = players[i];
          const box = document.createElement('div');
          box.className = 'player-box';
          
          if (player && !player.isEmpty) {
            box.innerHTML = `
              <img src="${player.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Vc2VyPC90ZXh0Pjwvc3ZnPg=='}" class="player-avatar" alt="${player.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Vc2VyPC90ZXh0Pjwvc3ZnPg==';" />
              <div class="player-info">
                <div class="player-name">${player.name}</div>
                <div class="player-wins">🏆 ${player.wins}</div>
              </div>
            `;
          } else {
            box.innerHTML = `
              <div class="player-info">
                <div class="player-name">Empty</div>
                <div class="player-wins">-</div>
              </div>
            `;
          }
          container.appendChild(box);
        }
      }
      
      return players;
    } catch (err) {
      console.error('❌ Failed to load participants:', err);
      console.error('Error stack:', err.stack);
      return players;
    }
  };
  
  // Auto-load participants after a short delay to ensure everything is ready
  // This is a fallback in case init.js doesn't call it
  setTimeout(() => {
    if (gameIdParam && typeof loadParticipants === 'function') {
      console.log('🔄 Auto-loading participants after initialization (fallback)...');
      loadParticipants().catch(err => console.error('Auto-load failed:', err));
    } else {
      console.warn('⚠️ Cannot auto-load participants:', {
        hasGameId: !!gameIdParam,
        hasLoadParticipants: typeof loadParticipants
      });
    }
  }, 1500);
  
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
    loadParticipants,
    currentRound,
    gameOver,
    isServerSideMode
  };
}

// Make initGame available globally if needed
if (typeof window !== 'undefined') {
  window.initGame = initGame;
}

// DEBUG: File version check
