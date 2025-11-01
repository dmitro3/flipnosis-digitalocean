/**
 * Socket Manager
 * Handles ALL Socket.io connections and events
 * Preserves all server communication, API calls, and database field references
 */

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
    TUBE_RADIUS,
    TUBE_HEIGHT,
    showResult,
    updateCoinRotationsFromPlayerChoices
  } = dependencies;

  if (typeof io === 'undefined') {
    console.error('❌ Socket.io not loaded');
    return null;
  }

  const socket = io();

  socket.on('connect', () => {
    console.log('✅ Connected to server');
    
    const savedState = loadGameState(gameIdParam, walletParam);
    
    if (gameIdParam && walletParam) {
      socket.emit('physics_join_room', {
        roomId: `game_${gameIdParam}`,
        address: walletParam,
        savedState: savedState
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected from server');
  });

  socket.on('reconnect', () => {
    console.log('🔄 Reconnecting to server...');
    
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
    console.log('✅ Game state restored:', data);
    
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
          tubes[index].selectedCoin = coinOptions.find(c => c.id === selection.coinId) || coinOptions[0];
          tubes[index].selectedMaterial = coinMaterials.find(m => m.id === selection.materialId) || coinMaterials[0];
          applyCoinSelection(index, tubes[index].selectedCoin, tubes[index].selectedMaterial);
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
    console.log('📊 Received physics state update:', {
      phase: state?.phase,
      currentRound: state?.currentRound,
      roundTimer: state?.roundTimer,
      players: state?.players ? Object.keys(state.players).length : 0
    });
    Object.assign(gameState, state);
    updateClientFromServerState(state, {
      gameOver,
      players,
      tubes,
      coins,
      scene,
      physicsWorld,
      playerSlot,
      walletParam,
      currentRound,
      updateTimerDisplay,
      updateRoundDisplay,
      saveGameState,
      updateWinsDisplay,
      updatePlayerCardButtons,
      updatePearlColors,
      showGameOverScreen,
      TUBE_RADIUS,
      TUBE_HEIGHT
    });
    createMobilePlayerCards();
  });

  socket.on('physics_coin_flip_start', (data) => {
    console.log('🪙 Coin flip started:', data);
    startClientCoinFlipAnimation(data);
  });

  socket.on('physics_coin_result', (data) => {
    console.log('🎲 Coin flip result:', data);
    showCoinFlipResult(data);
  });

  socket.on('physics_power_charging', (data) => {
    console.log('⚡ Power charging:', data);
    updatePowerChargingVisual(data);
  });

  socket.on('physics_power_charging_start', (data) => {
    console.log('⚡ Received charging start:', data);
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
    console.log('⚡ Received charging stop:', data);
    if (data.playerSlot >= 0 && data.playerSlot < 4) {
      const tube = tubes[data.playerSlot];
      if (tube) {
        tube.isFilling = false;
        tube.power = data.finalPower || tube.power;
        console.log(`🛑 Stopped pearl animation for tube ${data.playerSlot + 1} at ${tube.power}%`);
      }
    }
  });

  socket.on('physics_coin_angle_update', (data) => {
    console.log('🎯 Coin angle update:', data);
    updateCoinAngleVisual(data);
  });

  socket.on('flip_tokens_awarded', (data) => {
    console.log('💰 FLIP tokens awarded:', data);
    if (data.success) {
      showFloatingMessage(`+${data.amount} FLIP earned!`, '#FFD700', 3000);
    } else {
      console.error('❌ Failed to award FLIP tokens:', data.error);
    }
  });

  socket.on('flip_tokens_awarded_final', (data) => {
    console.log('🎁 FLIP tokens awarded:', data);
    if (data.success) {
      showFloatingMessage(`+${data.totalFlip} FLIP tokens added to your profile!`, '#00ff00', 4000);
    } else {
      console.error('❌ FLIP token award failed:', data.error);
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
    console.log('🏆 NFT prize claimed:', data);
    if (data.success) {
      const nftBtn = document.getElementById('claim-nft-btn');
      if (nftBtn) {
        nftBtn.textContent = '✅ NFT Claimed!';
        nftBtn.style.background = 'linear-gradient(135deg, #888, #666)';
        nftBtn.disabled = true;
      }
      showFloatingMessage('NFT successfully transferred to your wallet!', '#FFD700', 3000);
    }
  });

  socket.on('physics_error', (error) => {
    console.error('❌ Physics error:', error);
    
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
      
      console.log(`🔄 Reset tube ${playerIndex + 1} state after error`);
    }
    
    alert(`Game Error: ${error.message}`);
  });

  socket.on('player_choice_update', (data) => {
    console.log('🎯 Player choice update:', data);
    updatePlayerChoice(data);
  });

  socket.on('coin_update', (data) => {
    console.log('🪙 Coin update received:', data);
    updateCoinFromServer(data);
  });

  socket.on('player_flip_action', (data) => {
    console.log('🎮 Player flip action:', data);
  });

  socket.on('glass_shatter', (data) => {
    console.log('💥 Glass shatter:', data);
    if (data.playerSlot >= 0 && data.playerSlot < 4) {
      shatterGlass(data.playerSlot, data.power);
    }
  });

  // Additional socket events for coin unlock/profile
  socket.on('player_profile_data', (profileData) => {
    console.log('📊 Received profile data:', profileData);
    // This will be handled by the coin selector UI
    return profileData;
  });

  socket.on('coin_unlocked', (result) => {
    console.log('🪙 Coin unlocked:', result);
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
    console.warn(`⚠️ Cannot emit ${event}: socket not connected`);
  }
}

