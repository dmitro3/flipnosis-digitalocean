/**
 * Coin Manager
 * Handles all coin logic, rotations, animations, and flip mechanics
 */

import * as THREE from 'three';
import { TUBE_Y_POSITION } from '../config.js?v=777PINK';

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
export function startClientCoinFlipAnimation(
  data,
  tubes,
  coins,
  coinMaterials,
  animateCoinFlip,
  showFlipReward,
  shatterGlassFunc
) {
  const perfStartTotal = performance.now();
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
      tube.flipStartTime = tube.animationStartTime;
      tube.flipId = flipId;
      tube.isFlipping = true;
      
      tube.lastStableRotation = {
        x: coin.rotation.x,
        y: coin.rotation.y,
        z: coin.rotation.z
      };
      
      coin.rotation.order = 'XYZ';
      
      console.log(`🎬 Starting flip animation for coin ${data.playerSlot + 1} with ID: ${flipId}`);

      // ✅ FIX: Shatter glass IMMEDIATELY and SYNCHRONOUSLY before any other animations
      // shatterGlass function will handle setting the isShattered flag internally
      const beforeShatter = performance.now();
      if (typeof shatterGlassFunc === 'function' && !tube.isShattered) {
        const shatterPower = typeof data.power === 'number' ? data.power : (tube.power || 100);
        try {
          // Call shatter synchronously - it should execute immediately
          shatterGlassFunc(data.playerSlot, shatterPower);
          const afterShatter = performance.now();
          console.log(`💥 Triggered immediate client-side shatter for coin ${data.playerSlot + 1} at ${shatterPower}% power (took ${(afterShatter - beforeShatter).toFixed(2)}ms)`);
        } catch (error) {
          console.error('ERROR: Failed to trigger client-side shatter:', error);
        }
      } else if (tube.isShattered) {
        console.log(`⚠️ Glass already shattered for coin ${data.playerSlot + 1}, skipping`);
      }

      const beforeAnimate = performance.now();
      animateCoinFlip(data.playerSlot, data.power, data.duration, tubes, coins, coinMaterials);
      const afterAnimate = performance.now();
      console.log(`⏱️ animateCoinFlip() call took ${(afterAnimate - beforeAnimate).toFixed(2)}ms`);

      showFlipReward(data.playerSlot, data.flipReward);
      const totalTime = performance.now() - perfStartTotal;
      console.log(`⏱️ Total startClientCoinFlipAnimation took ${totalTime.toFixed(2)}ms`);
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
      // Allow result even if flip wasn't started locally (server-side mode)
      // The server controls the flip, so we should accept the result
      if (tube.animationState === 'idle' && !tube.flipStartTime && !tube.isFlipping) {
        console.log(`⚠️ Received result for coin ${data.playerSlot + 1} but it's not flipping - setting up flip state`);
        // Set up flip state so we can process the result
        tube.animationState = 'flipping';
        tube.flipStartTime = Date.now();
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
 * Smooth landing animation - WORKING REFERENCE IMPLEMENTATION
 * Takes over from current rotation and smoothly lands on target
 */
export function smoothLandCoin(coin, targetRotation, accuracy, tube, playerSlot) {
  const startRotation = coin.rotation.x;
  const startY = coin.rotation.y;
  const startZ = coin.rotation.z;
  
  // Set landing flag to prevent other functions from overriding rotation
  tube.isLanding = true;
  tube.isFlipping = false;
  
  // Calculate shortest path to target
  const rotationCycles = Math.floor(startRotation / (Math.PI * 2));
  const currentInCycle = startRotation - (rotationCycles * Math.PI * 2);
  let finalRotation = rotationCycles * (Math.PI * 2) + targetRotation;
  
  // If we're past the target in this cycle, go to next cycle's target
  if (currentInCycle > targetRotation + Math.PI) {
    finalRotation += Math.PI * 2;
  }
  
  const landingDuration = 800; // Smooth 0.8 second landing
  const startTime = Date.now();
  const landingId = Date.now(); // Unique ID for this landing
  tube.currentLandingId = landingId;
  
  console.log(`🎯 Landing coin ${playerSlot + 1}: from ${startRotation.toFixed(2)} to ${finalRotation.toFixed(2)}`);
  
  const animateLanding = () => {
    // Stop if landing was interrupted
    if (tube.currentLandingId !== landingId) {
      console.log(`🛑 Landing animation stopped for coin ${playerSlot + 1} - interrupted`);
      tube.isLanding = false;
      return;
    }
    
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / landingDuration, 1);
    
    // Smooth deceleration curve
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    
    coin.rotation.x = startRotation + (finalRotation - startRotation) * easeOutQuart;
    coin.rotation.y = startY + (Math.PI / 2 - startY) * easeOutQuart;
    coin.rotation.z = startZ * (1 - easeOutQuart);
    
    if (progress < 1) {
      requestAnimationFrame(animateLanding);
    } else {
      // Snap to exact final position
      coin.rotation.x = finalRotation;
      coin.rotation.y = Math.PI / 2;
      coin.rotation.z = 0;
      tube.isLanding = false; // Clear landing flag
      tube.currentLandingId = null;
      console.log(`✅ Coin ${playerSlot + 1} landing complete`);
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
      // Reduced logging
      // console.log(`🪙 Updating coin for player ${data.playerSlot + 1}: ${data.coinData.name}`);

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
 * Animate coin flip - WORKING REFERENCE IMPLEMENTATION
 * Uses progressive rotation increment (not calculated total)
 */
export function animateCoinFlip(playerSlot, power, duration, tubes, coins, coinMaterials) {
  const perfStart = performance.now();
  console.log('🎬 v777PINK animateCoinFlip called:', { playerSlot, power, duration });

  const tube = tubes[playerSlot];
  const coin = coins[playerSlot];
  
  if (!tube || !coin) {
    console.warn(`⚠️ animateCoinFlip: missing tube or coin for slot ${playerSlot}`);
    return;
  }
  
  // Set flipping state if not already set
  if (!tube.isFlipping) {
    tube.isFlipping = true;
  }
  
  const powerPercent = power / 100;
  const material = tube.selectedMaterial || coinMaterials[2];
  const speedMult = material?.speedMultiplier || 1.0;
  const durationMult = material?.durationMultiplier || 1.0;
  
  const flipDuration = duration || (2000 + (powerPercent * 6000)) * durationMult;
  const basePowerSpeed = Math.max(0.08, 0.05 + (powerPercent * 0.25));
  const flipSpeed = basePowerSpeed * speedMult;
  
  const wobbleAmount = 0.02 + (powerPercent * 0.05); // More power = more wobble
  const tumbleAmount = 0.01 + (powerPercent * 0.03);

  const setupTime = performance.now() - perfStart;
  console.log(`🎬 Starting visual coin flip for slot ${playerSlot}: duration=${flipDuration}ms, speed=${flipSpeed}, setup took ${setupTime.toFixed(2)}ms`);

  const startTime = Date.now();
  const flipId = Date.now(); // Unique ID for this flip
  tube.currentFlipId = flipId;

  let wobblePhase = 0;
  let tumblePhase = 0;
  let frameCount = 0;

  const animateFlip = () => {
    frameCount++;
    if (frameCount === 1) {
      const firstFrameTime = performance.now() - perfStart;
      console.log(`⏱️ First animation frame executing after ${firstFrameTime.toFixed(2)}ms`);
    }
    // Stop animation if this flip was superseded or interrupted
    if (tube.currentFlipId !== flipId || !tube.isFlipping) {
      console.log(`🛑 Animation stopped for slot ${playerSlot} - flip interrupted or superseded`);
      return;
    }
    
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / flipDuration, 1);
    
    const easeOut = 1 - Math.pow(1 - progress, 3);
    
    // Progressive rotation increment (key difference from calculated approach)
    if (progress < 0.7) {
      const currentSpeed = flipSpeed * (1 - (progress / 0.7) * 0.3);
      coin.rotation.x += currentSpeed;
    } else {
      const decelProgress = (progress - 0.7) / 0.3;
      const currentSpeed = flipSpeed * 0.7 * (1 - decelProgress);
      coin.rotation.x += currentSpeed;
    }
    
    // Wobble effect
    wobblePhase += 0.15 * (1 - progress * 0.5);
    const wobbleIntensity = wobbleAmount * (1 - easeOut);
    coin.rotation.y = (Math.PI / 2) + Math.sin(wobblePhase) * wobbleIntensity;
    
    // Tumble effect
    tumblePhase += 0.1 * (1 - progress * 0.5);
    const tumbleIntensity = tumbleAmount * (1 - easeOut);
    coin.rotation.z = Math.sin(tumblePhase * 0.7) * tumbleIntensity;
    
    if (progress < 1) {
      requestAnimationFrame(animateFlip);
    } else {
      console.log(`🎬 Visual flip animation complete for slot ${playerSlot}, awaiting result...`);
    }
  };
  
  animateFlip();
}

