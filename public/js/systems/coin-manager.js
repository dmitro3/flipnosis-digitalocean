/**
 * Coin Manager
 * Handles all coin logic, rotations, animations, and flip mechanics
 */

import * as THREE from 'three';
import { TUBE_Y_POSITION } from '../config.js';

/**
 * Update coin rotations based on player choices
 */
export function updateCoinRotationsFromPlayerChoices(tubes, players, coins) {
  tubes.forEach((tube, i) => {
    const player = players[i];
    const coin = coins[i];
    
    if (coin && !tube.isFlipping && !tube.isShattered) {
      if (player && !player.isEmpty) {
        if (player.choice === 'heads') {
          coin.rotation.x = Math.PI / 2;
          coin.rotation.y = Math.PI / 2;
          coin.rotation.z = 0;
        } else if (player.choice === 'tails') {
          coin.rotation.x = 3 * Math.PI / 2;
          coin.rotation.y = Math.PI / 2;
          coin.rotation.z = 0;
        } else {
          coin.rotation.x = Math.PI / 2;
          coin.rotation.y = Math.PI / 2;
          coin.rotation.z = 0;
        }
      } else {
        coin.rotation.x = Math.PI / 2;
        coin.rotation.y = Math.PI / 2;
        coin.rotation.z = 0;
      }
    }
  });
}

/**
 * Update coin states from server
 */
export function updateCoinStatesFromServer(coinStates, tubes, coins) {
  if (!coinStates) return;
  
  coinStates.forEach((coinState, index) => {
    if (coinState && coinState.position) {
      const coin = coins[index];
      const tube = tubes[index];
      if (coin && tube) {
        if (tube.animationState === 'idle') {
          const tubeX = tube.tube.position.x;
          coin.position.set(tubeX, coinState.position.y, coinState.position.z);
          
          if (coinState.rotation && !coinState.isFlipping) {
            const euler = new THREE.Euler();
            euler.setFromQuaternion(new THREE.Quaternion(
              coinState.rotation.x,
              coinState.rotation.y,
              coinState.rotation.z,
              coinState.rotation.w
            ));
            coin.rotation.copy(euler);
            coin.quaternion.set(0, 0, 0, 1);
          } else {
            updateCoinRotationsFromPlayerChoices([tube], [null], [coin]);
          }
        }
      }
    }
  });
}

/**
 * Start client coin flip animation
 */
export function startClientCoinFlipAnimation(data, tubes, coins, coinMaterials, animateCoinFlip, showFlipReward) {
  console.log('🎁 Received flip reward data:', data.flipReward);
  
  if (data.playerSlot >= 0 && data.playerSlot < 4) {
    const tube = tubes[data.playerSlot];
    const coin = coins[data.playerSlot];
    
    if (tube && coin) {
      if (tube.animationState !== 'idle') {
        console.log(`⚠️ Coin ${data.playerSlot + 1} already flipping, ignoring duplicate flip request`);
        return;
      }
      
      const flipId = `flip_${data.playerSlot}_${Date.now()}`;
      
      tube.animationState = 'flipping';
      tube.animationStartTime = Date.now();
      tube.animationEndTime = Date.now() + (data.duration || 8000);
      tube.flipId = flipId;
      
      tube.lastStableRotation = {
        x: coin.rotation.x,
        y: coin.rotation.y,
        z: coin.rotation.z
      };
      
      coin.rotation.order = 'XYZ';
      
      console.log(`🎬 Starting flip animation for coin ${data.playerSlot + 1} with ID: ${flipId}`);
      
      animateCoinFlip(data.playerSlot, data.power, data.duration);
      showFlipReward(data.playerSlot, data.flipReward);
    }
  }
}

/**
 * Show coin flip result and animate landing
 */
export function showCoinFlipResult(data, tubes, coins, players, smoothLandCoin, updateWinsDisplay, showResult) {
  if (data.playerSlot >= 0 && data.playerSlot < 4) {
    const tube = tubes[data.playerSlot];
    const coin = coins[data.playerSlot];
    const player = players[data.playerSlot];
    
    if (tube && coin && player) {
      if (!tube.isFlipping && !tube.flipStartTime) {
        console.log(`⚠️ Received result for coin ${data.playerSlot + 1} but it's not flipping - ignoring stale result`);
        return;
      }
      
      tube.animationState = 'landing';
      tube.flipId = null;
      
      const targetRotationX = data.result === 'heads' ? Math.PI / 2 : (3 * Math.PI / 2);
      smoothLandCoin(coin, targetRotationX, data.accuracy || 'normal', tube, data.playerSlot);
      
      console.log(`✅ Coin ${data.playerSlot + 1} landing to ${data.result} (server-side)`);
      
      if (data.wins !== undefined) {
        player.wins = data.wins;
        console.log(`📊 Updated player ${data.playerSlot + 1} wins from server: ${player.wins}`);
        updateWinsDisplay(data.playerSlot);
      }
      
      setTimeout(() => {
        showResult(data.playerSlot, data.won, data.result);
      }, 1300);
    }
  }
}

/**
 * Smooth landing animation for coins
 */
export function smoothLandCoin(coin, targetRotation, accuracy, tube, playerSlot) {
  const startRotation = coin.rotation.x;
  const startY = coin.rotation.y;
  const startZ = coin.rotation.z;
  
  tube.animationState = 'landing';
  tube.landingId = `landing_${playerSlot}_${Date.now()}`;
  
  const landingDuration = 1200;
  const startTime = Date.now();
  
  let lastRotation = startRotation;
  const initialSpeed = 0.15;
  let currentSpeed = initialSpeed;
  
  console.log(`🎯 Landing coin ${playerSlot + 1} naturally: starting from ${startRotation.toFixed(2)}`);
  
  const savedLandingId = tube.landingId;
  
  const animateLanding = () => {
    if (tube.landingId !== savedLandingId || tube.animationState !== 'landing') {
      console.log(`🛑 Landing animation stopped for coin ${playerSlot + 1} - interrupted`);
      tube.animationState = 'idle';
      return;
    }
    
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / landingDuration, 1);
    
    currentSpeed = initialSpeed * Math.pow(0.92, progress * 15);
    
    if (progress < 1) {
      coin.rotation.x += currentSpeed;
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      coin.rotation.y = startY + (Math.PI / 2 - startY) * easeOutQuart;
      coin.rotation.z = startZ * (1 - easeOutQuart);
      
      coin.quaternion.setFromEuler(coin.rotation);
      
      requestAnimationFrame(animateLanding);
    } else {
      const finalCycles = Math.floor(coin.rotation.x / (Math.PI * 2));
      coin.rotation.x = finalCycles * (Math.PI * 2) + targetRotation;
      coin.rotation.y = Math.PI / 2;
      coin.rotation.z = 0;
      coin.quaternion.setFromEuler(coin.rotation);
      
      tube.animationState = 'idle';
      tube.landingId = null;
      console.log(`✅ Coin ${playerSlot + 1} landed on target rotation ${coin.rotation.x.toFixed(2)} facing camera (server-side)`);
    }
  };
  
  animateLanding();
}

/**
 * Update coin from server data
 */
export function updateCoinFromServer(data, tubes, coins, players, coinOptions, coinMaterials, applyCoinSelection) {
  if (data.playerSlot >= 0 && data.playerSlot < 4) {
    const tube = tubes[data.playerSlot];
    const coin = coins[data.playerSlot];
    const player = players[data.playerSlot];
    
    if (tube && coin && player && data.coinData) {
      console.log(`🪙 Updating coin for player ${data.playerSlot + 1}: ${data.coinData.name}`);
      
      const selectedCoin = coinOptions.find(c => c.id === data.coinData.coinId) || coinOptions[0];
      const selectedMaterial = coinMaterials.find(m => m.id === data.coinData.materialId) || coinMaterials[0];
      
      tube.selectedCoin = selectedCoin;
      tube.selectedMaterial = selectedMaterial;
      
      applyCoinSelection(data.playerSlot, selectedCoin, selectedMaterial);
    }
  }
}

/**
 * Update coin angle visual
 */
export function updateCoinAngleVisual(data, tubes, coins) {
  if (data.playerSlot >= 0 && data.playerSlot < 4) {
    const coin = coins[data.playerSlot];
    const tube = tubes[data.playerSlot];
    if (coin && tube && tube.animationState === 'idle') {
      const angleRad = (data.angle * Math.PI) / 180;
      coin.rotation.z = angleRad;
    }
  }
}

/**
 * Animate coin flip
 */
export function animateCoinFlip(playerSlot, power, duration, tubes, coins, coinMaterials) {
  const tube = tubes[playerSlot];
  const coin = coins[playerSlot];
  
  if (!tube || !coin) return;
  
  if (tube.animationState !== 'flipping') {
    console.log(`⚠️ animateCoinFlip called but state is ${tube.animationState}`);
    return;
  }
  
  const powerPercent = power / 100;
  const material = tube.selectedMaterial || coinMaterials[2];
  const speedMult = material.speedMultiplier;
  const durationMult = material.durationMultiplier;
  
  const flipDuration = duration || (2000 + (powerPercent * 6000)) * durationMult;
  const basePowerSpeed = Math.max(0.08, 0.05 + (powerPercent * 0.25));
  const flipSpeed = basePowerSpeed * speedMult;
  
  const wobbleAmount = 0.02 + (powerPercent * 0.05);
  const tumbleAmount = 0.01 + (powerPercent * 0.03);
  
  console.log(`🎲 Starting visual coin flip for slot ${playerSlot}: duration=${flipDuration}ms, speed=${flipSpeed}`);
  
  const startTime = Date.now();
  const flipId = tube.flipId;
  
  if (!flipId) {
    console.error(`❌ ERROR: No flipId in tube state for slot ${playerSlot}!`);
    return;
  }
  
  let wobblePhase = 0;
  let tumblePhase = 0;
  
  const animateFlip = () => {
    if (tube.flipId !== flipId || tube.animationState !== 'flipping') {
      console.log(`🛑 Animation stopped for slot ${playerSlot}`);
      return;
    }
    
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / flipDuration, 1);
    
    const easeOut = 1 - Math.pow(1 - progress, 3);
    
    coin.updateMatrix();
    
    if (progress < 0.7) {
      const currentSpeed = flipSpeed * (1 - (progress / 0.7) * 0.3);
      coin.rotation.x += currentSpeed;
      coin.quaternion.setFromEuler(coin.rotation);
    } else {
      const decelProgress = (progress - 0.7) / 0.3;
      const currentSpeed = flipSpeed * 0.7 * (1 - decelProgress);
      coin.rotation.x += currentSpeed;
      coin.quaternion.setFromEuler(coin.rotation);
    }
    
    wobblePhase += 0.15 * (1 - progress * 0.5);
    const wobbleIntensity = wobbleAmount * (1 - easeOut);
    coin.rotation.y = (Math.PI / 2) + Math.sin(wobblePhase) * wobbleIntensity;
    
    tumblePhase += 0.1 * (1 - progress * 0.5);
    const tumbleIntensity = tumbleAmount * (1 - easeOut);
    coin.rotation.z = Math.sin(tumblePhase * 0.7) * tumbleIntensity;
    
    coin.quaternion.setFromEuler(coin.rotation);
    
    if (progress < 1) {
      requestAnimationFrame(animateFlip);
    } else {
      console.log(`🎲 Visual flip animation complete for slot ${playerSlot}, awaiting result...`);
    }
  };
  
  animateFlip();
}

