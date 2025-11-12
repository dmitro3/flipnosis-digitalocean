/**
 * Socket Manager
 * Handles ALL Socket.io connections and events
 * Preserves all server communication, API calls, and database field references
 */

import { io } from 'socket.io-client';
import { loadGameState } from './game-state.js';
import { powerChargeSound } from '../utils/audio.js';

/**
 * Initialize Socket.io connection with all event handlers
 * @param {Object} dependencies - All required game objects and functions
 */
export function initializeSocket(dependencies) {
  const {
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
    // Callback functions
    updatePlayerCardChoice,
    applyCoinSelection,
    handleGameEnd,
    updateClientFromServerState,
    createMobilePlayerCards,
    startClientCoinFlipAnimation,
    showCoinFlipResult,
    updatePowerChargingVisual,
    updateCoinAngleVisual,
    updatePlayerChoice,
    updateCoinFromServer,
    shatterGlass,
    updatePlayerCardButtons,
    updateWinsDisplay,
    updateTimerDisplay,
    updateRoundDisplay,
    saveGameState,
    updatePearlColors,
    showFloatingMessage,
    showGameOverScreen: showGameOverScreenFromDeps,
    showCoinSelector,
    showXPAwardNotification,
    showGamePhaseIndicator,
    showGameStartNotification,
    TUBE_RADIUS,
    TUBE_HEIGHT,
    showResult,
    updateCoinRotationsFromPlayerChoices
  } = dependencies;

  // Use the function from dependencies, with a fallback - ALWAYS ensure it exists
  const showGameOverScreenLocal = (showGameOverScreenFromDeps && typeof showGameOverScreenFromDeps === 'function')
    ? showGameOverScreenFromDeps 
    : ((winnerIndex, winnerName) => {
        console.warn('WARN: showGameOverScreen was not provided or is not a function', {
          winnerIndex,
          winnerName,
          wasProvided: showGameOverScreenFromDeps !== undefined,
          type: typeof showGameOverScreenFromDeps
        });
      });

  if (!showGameOverScreenFromDeps || typeof showGameOverScreenFromDeps !== 'function') {
    console.warn('WARN: showGameOverScreen missing or invalid from dependencies!', {
      wasProvided: showGameOverScreenFromDeps !== undefined,
      type: typeof showGameOverScreenFromDeps,
      availableKeys: Object.keys(dependencies).filter(k => k.includes('Game') || k.includes('game'))
    });
  } else {
    console.log('OK: showGameOverScreen found in dependencies, type:', typeof showGameOverScreenFromDeps);
  }

  // io is now imported as ES module
  // Determine socket URL based on environment
  let socketUrl = undefined; // Default to current origin (same origin = same protocol/host/port)
  
  // Development: Connect directly to backend server
  // Production: Use same origin (backend serves frontend)
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isViteDev = isLocalhost && window.location.port === '5173';
  const isHetzner = window.location.hostname.includes('159.') || window.location.hostname === 'flipnosis.fun' || window.location.hostname === 'www.flipnosis.fun';
  
  if (isViteDev) {
    // Vite dev server (port 5173) - connect directly to backend (port 3000)
    socketUrl = `http://localhost:3000`;
    console.log('🔌 SOCKET: Development mode - Connecting to http://localhost:3000');
  } else if (isHetzner) {
    // Hetzner production server - use current origin
    socketUrl = undefined; // Same origin
    console.log('🔌 SOCKET: Production mode (Hetzner) - Connecting to same origin:', window.location.origin);
  } else {
    // Production or same-origin: use current origin (undefined = same origin)
    // This works because backend serves the frontend on the same server
    socketUrl = undefined;
    console.log('🔌 SOCKET: Production mode - Connecting to same origin:', window.location.origin);
  }
  
  const socket = io(socketUrl, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    forceNew: false,
    autoConnect: true,
    path: '/socket.io' // Explicitly set the socket.io path
  });

  socket.on('connect', () => {
    console.log('OK: Connected to server');
    console.log(`SOCKET: Socket ID: ${socket.id}, Connected: ${socket.connected}`);
    
    const savedState = loadGameState(gameIdParam, walletParam);
    
    if (gameIdParam && walletParam) {
      // First join the room
      socket.emit('physics_join_room', {
        roomId: `game_${gameIdParam}`,
        address: walletParam,
        savedState: savedState
      });
      console.log(`📤 Emitted physics_join_room for game ${gameIdParam}`);
      
      // CRITICAL FIX: Only emit physics_join if player hasn't already joined via API
      // The API endpoint (/api/battle-royale/:gameId/join) already adds the player
      // So we should NOT call physics_join if the player is already in the game
      // We'll let the server state update tell us if we need to join
      // The physics_join_room is sufficient for socket communication
      console.log(`INFO: Skipping physics_join - player should already be in game via API endpoint`);
    }
  });

  socket.on('disconnect', () => {
    console.log('ERROR: Disconnected from server');
  });

  socket.on('reconnect', () => {
    console.log('RECONNECT: Reconnecting to server...');
    
    const savedState = loadGameState(gameIdParam, walletParam);
    
    if (gameIdParam && walletParam) {
      socket.emit('physics_rejoin_room', {
        roomId: `game_${gameIdParam}`,
        address: walletParam,
        lastKnownSlot: playerSlot,
        savedState: savedState,
        disconnectTime: savedState?.timestamp || Date.now()
      });
    }
  });

  socket.on('game_state_restored', (data) => {
    console.log('OK: Game state restored:', data);
    
    if (data.playerChoices) {
      Object.keys(data.playerChoices).forEach(slot => {
        const slotIndex = parseInt(slot);
        if (players[slotIndex]) {
          players[slotIndex].choice = data.playerChoices[slot];
          updatePlayerCardChoice(slotIndex, data.playerChoices[slot]);
        }
      });
    }
    
    if (data.coinSelections) {
      data.coinSelections.forEach((selection, index) => {
        if (selection && tubes[index]) {
          const newCoin = coinOptions.find(c => c.id === selection.coinId) || coinOptions[0];
          const newMaterial = coinMaterials.find(m => m.id === selection.materialId) || coinMaterials[0];

          // Only apply if coin selection has changed to avoid repeated texture loading
          const currentCoin = tubes[index].selectedCoin;
          const currentMaterial = tubes[index].selectedMaterial;
          const hasChanged = !currentCoin || !currentMaterial ||
                            currentCoin.id !== newCoin.id ||
                            currentMaterial.id !== newMaterial.id;

          if (hasChanged) {
            tubes[index].selectedCoin = newCoin;
            tubes[index].selectedMaterial = newMaterial;
            applyCoinSelection(index, newCoin, newMaterial);
          }
        }
      });
    }
    
    if (data.phase) {
      gameState.phase = data.phase;
      if (data.phase === 'game_over') {
        gameOver = true;
        handleGameEnd(data);
      }
    }
  });

  socket.on('physics_state_update', (state) => {
    // Wrap everything in try-catch to prevent any errors from blocking state updates
    try {
      // Reduced logging - only log state updates when debugging
      // console.log('STATE: Received physics state update:', {
      //   phase: state?.phase,
      //   currentRound: state?.currentRound,
      //   roundTimer: state?.roundTimer,
      //   players: state?.players ? Object.keys(state.players).length : 0
      // });
      
      if (!state) {
        console.warn('WARN: Received null/undefined state update');
        return;
      }
      
      Object.assign(gameState, state);
      
      // Ensure showGameOverScreen is available - use the local constant which is always defined
      // showGameOverScreenLocal is always a function (even if it's a no-op fallback)
      const safeShowGameOverScreen = showGameOverScreenLocal;
      
      // Pass playerSlot and currentRound as mutable references
      const playerSlotRef = { value: playerSlot };
      const currentRoundRef = { value: currentRound };
      
      // Wrap updateClientFromServerState in try-catch since it can throw async errors
      try {
        const previousSlot = playerSlotRef.value;
        updateClientFromServerState(state, {
          gameOver,
          players,
          tubes,
          coins,
          scene,
          physicsWorld,
          playerSlot: playerSlotRef.value,
          playerSlotRef, // Mutable reference for updates
          walletParam,
          gameIdParam,
          currentRound: currentRoundRef.value,
          currentRoundRef, // Mutable reference for updates
          updateTimerDisplay,
          updateRoundDisplay,
          saveGameState,
          updateWinsDisplay,
          updatePlayerCardButtons,
          updatePearlColors,
          showGameOverScreen: safeShowGameOverScreen,
          TUBE_RADIUS,
          TUBE_HEIGHT
        });
        
        // Only log slot change if it actually changed and is a valid transition
        if (playerSlotRef.value !== previousSlot && playerSlotRef.value >= 0) {
          // Note: playerSlot is passed by value, so we can't update it here
          // The update should happen in game-main.js's updateClientFromServerState wrapper
          // Reduced logging - only log slot changes when debugging
          // console.log(`🔄 Detected slot change: ${previousSlot} -> ${playerSlotRef.value}`);
        }
      } catch (updateError) {
        console.error('ERROR: Error in updateClientFromServerState:', updateError);
        console.error('Update error details:', {
          message: updateError.message,
          stack: updateError.stack,
          statePhase: state?.phase
        });
      }
      
      // Only recreate mobile player cards if players data actually changed
      // Debounce to avoid recreating on every state update
      if (!socket._lastPlayerState || JSON.stringify(state.players) !== socket._lastPlayerState) {
        try {
          createMobilePlayerCards();
          socket._lastPlayerState = JSON.stringify(state.players);
        } catch (cardsError) {
          console.error('ERROR: Error creating mobile player cards:', cardsError);
        }
      }
    } catch (error) {
      console.error('ERROR: Error in physics_state_update handler:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        statePhase: state?.phase,
        hasShowGameOverScreenLocal: typeof showGameOverScreenLocal !== 'undefined'
      });
      // Continue anyway - don't block future state updates
    }
  });

  socket.on('physics_coin_flip_start', (data) => {
    console.log('FLIP: Coin flip started:', data);
    startClientCoinFlipAnimation(data);
  });

  socket.on('physics_coin_result', (data) => {
    console.log('RESULT: Coin flip result:', data);
    showCoinFlipResult(data);
  });

  socket.on('physics_power_charging', (data) => {
    console.log('POWER: Power charging:', data);
    updatePowerChargingVisual(data);
  });

  socket.on('physics_power_charging_start', (data) => {
    console.log('POWER_START: Received charging start:', data);
    if (data.playerSlot >= 0 && data.playerSlot < 4) {
      const tube = tubes[data.playerSlot];
      if (tube) {
        tube.isFilling = true;
        tube.power = 0;
        tube.chargingStartTime = Date.now();
        console.log(`🫧 Started pearl animation for tube ${data.playerSlot + 1}`);
        
        if (tube.liquidParticleMeshes) {
          tube.liquidParticleMeshes.forEach(mesh => {
            mesh.visible = true;
          });
          console.log(`🫧 Forced pearl visibility on charging start for tube ${data.playerSlot + 1}`);
        }
      }
    }
  });

  socket.on('physics_power_charging_stop', (data) => {
    console.log('POWER_STOP: Received charging stop:', data);
    if (data.playerSlot >= 0 && data.playerSlot < 4) {
      const tube = tubes[data.playerSlot];
      if (tube) {
        tube.isFilling = false;
        tube.power = data.finalPower || tube.power;
        console.log(`STOP: Stopped pearl animation for tube ${data.playerSlot + 1} at ${tube.power}%`);
      }
    }
  });

  socket.on('physics_coin_angle_update', (data) => {
    console.log('ANGLE: Coin angle update:', data);
    updateCoinAngleVisual(data);
  });

  socket.on('flip_tokens_awarded', (data) => {
    console.log('TOKENS: FLIP tokens awarded:', data);
    if (data.success) {
      showFloatingMessage(`+${data.amount} FLIP earned!`, '#FFD700', 3000);
    } else {
      console.error('ERROR: Failed to award FLIP tokens:', data.error);
    }
  });

  socket.on('flip_tokens_awarded_final', (data) => {
    console.log('TOKENS_FINAL: FLIP tokens awarded:', data);
    if (data.success) {
      showFloatingMessage(`+${data.totalFlip} FLIP tokens added to your profile!`, '#00ff00', 4000);
    } else {
      console.error('ERROR: FLIP token award failed:', data.error);
      showFloatingMessage(`Failed to award FLIP tokens: ${data.error}`, '#ff0000', 3000);
    }
  });

  socket.on('flip_tokens_collected', (data) => {
    console.log('💎 FLIP tokens collected:', data);
    if (data.success) {
      showFloatingMessage(`Successfully claimed ${data.amount} FLIP!`, '#00ff00', 3000);
    }
  });

  socket.on('nft_prize_claimed', (data) => {
    console.log('NFT: NFT prize claimed:', data);
    if (data.success) {
      const nftBtn = document.getElementById('claim-nft-btn');
      if (nftBtn) {
        nftBtn.textContent = 'OK: NFT Claimed!';
        nftBtn.style.background = 'linear-gradient(135deg, #888, #666)';
        nftBtn.disabled = true;
      }
      showFloatingMessage('NFT successfully transferred to your wallet!', '#FFD700', 3000);
    }
  });

  socket.on('physics_error', (error) => {
    console.error('ERROR: Physics error:', error);
    
    const playerIndex = players.findIndex(p => p.address === walletParam);
    if (playerIndex !== -1 && tubes[playerIndex]) {
      tubes[playerIndex].isFilling = false;
      tubes[playerIndex].power = 0;
      tubes[playerIndex].powerLevel = 0;
      isCharging = false;
      
      if (powerChargeSound && !powerChargeSound.paused) {
        powerChargeSound.pause();
        powerChargeSound.currentTime = 0;
      }
      
      console.log(`RESET: Reset tube ${playerIndex + 1} state after error`);
    }
    
    alert(`Game Error: ${error.message}`);
  });

  socket.on('player_choice_update', (data) => {
    console.log('CHOICE: Player choice update:', data);
    updatePlayerChoice(data);
  });

  socket.on('coin_update', (data) => {
    // Reduced logging - only log coin updates when debugging
    // console.log('COIN: Coin update received:', data);
    updateCoinFromServer(data);
  });

  socket.on('player_flip_action', (data) => {
    // Reduced logging - only log flip actions when debugging
    // console.log('ACTION: Player flip action:', data);
  });

  socket.on('glass_shatter', (data) => {
    console.log('SHATTER: Glass shatter event received (deprecated - shatter happens in flip start):', data);
    // ✅ FIX: Don't shatter here - it's handled in physics_coin_flip_start
    // This prevents double-shattering and race conditions
    // Keeping the listener for backward compatibility but not executing
  });

  // Additional socket events for coin unlock/profile
  socket.on('player_profile_data', (profileData) => {
    console.log('PROFILE: Received profile data:', profileData);
    // This will be handled by the coin selector UI
    return profileData;
  });

  socket.on('coin_unlocked', (result) => {
    console.log('UNLOCK: Coin unlocked:', result);
    // This will be handled by the coin selector UI
    return result;
  });

  return socket;
}

/**
 * Socket emit helper - wraps common emit patterns
 */
export function emitSocketEvent(socket, event, data) {
  if (socket && socket.connected) {
    socket.emit(event, data);
  } else {
    console.warn(`WARN: Cannot emit ${event}: socket not connected`);
  }
}

