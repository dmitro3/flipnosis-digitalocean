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
export function startClientCoinFlipAnimation(
  data,
  tubes,
  coins,
  coinMaterials,
  animateCoinFlip,
  showFlipReward,
  shatterGlassFunc
) {
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

      // Ensure the glass shatter effect triggers immediately on the client
      if (typeof shatterGlassFunc === 'function' && !tube.isShattered) {
        const shatterPower = typeof data.power === 'number' ? data.power : (tube.power || 100);
        try {
          shatterGlassFunc(data.playerSlot, shatterPower);
          console.log(`💥 Triggered immediate client-side shatter for coin ${data.playerSlot + 1}`);
        } catch (error) {
          console.error('ERROR: Failed to trigger client-side shatter:', error);
        }
      }
      
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
 * Smooth landing animation for coins - ENHANCED from reference
 * Natural deceleration to the correct face (heads/tails)
 */
export function smoothLandCoin(coin, targetRotation, accuracy, tube, playerSlot) {
  const startRotation = coin.rotation.x;
  const startY = coin.rotation.y;
  const startZ = coin.rotation.z;
  const TWO_PI = Math.PI * 2;
  const normalize = (angle) => {
    let a = angle % TWO_PI;
    if (a < 0) a += TWO_PI;
    return a;
  };
  
  tube.animationState = 'landing';
  tube.landingId = `landing_${playerSlot}_${Date.now()}`;
  tube.isFlipping = false; // Clear flipping flag immediately
  
  const landingDuration = 1000; // 1 second for smooth landing
  const startTime = Date.now();
  
  console.log(`🎯 Landing coin ${playerSlot + 1}:`, {
    from: `${startRotation.toFixed(2)} rad (${(startRotation / Math.PI).toFixed(2)}π)`,
    target: `${targetRotation} rad (${targetRotation === Math.PI/2 ? 'HEADS' : 'TAILS'})`,
    accuracy: accuracy
  });
  
  const savedLandingId = tube.landingId;
  
  // Calculate the forward path to the target face
  // Add extra rotations for visual effect based on accuracy
  const currentNormalized = normalize(startRotation);
  const targetNormalized = normalize(targetRotation);
  let deltaToTarget = targetNormalized - currentNormalized;
  if (deltaToTarget <= 0) {
    deltaToTarget += TWO_PI; // Always rotate forward
  }
  
  // Add 2-3 extra spins for smooth deceleration effect
  const extraTurns = accuracy === 'perfect' ? 3 : (accuracy === 'good' ? 2 : 2);
  const totalSpin = deltaToTarget + (extraTurns * TWO_PI);
  const targetFinal = startRotation + totalSpin;
  
  console.log(`🎯 Landing: ${extraTurns} extra rotations = ${(totalSpin / Math.PI).toFixed(1)}π total`);
  
  const animateLanding = () => {
    if (tube.landingId !== savedLandingId || tube.animationState !== 'landing') {
      console.log(`🛑 Landing animation interrupted for coin ${playerSlot + 1}`);
      tube.animationState = 'idle';
      return;
    }
    
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / landingDuration, 1);
    
    // Smooth deceleration curve - cubic easing for natural feel
    const easeOutCubic = 1 - Math.pow(1 - progress, 3);
    
    // Interpolate rotation smoothly to target
    coin.rotation.x = startRotation + (targetFinal - startRotation) * easeOutCubic;
    
    // Stabilize Y and Z rotation as we land - lock to facing camera
    coin.rotation.y = startY + (Math.PI / 2 - startY) * easeOutCubic;
    coin.rotation.z = startZ * (1 - easeOutCubic);
    
    // Keep coin centered at tube position during landing
    const tubeX = tube.tube.position.x;
    coin.position.x = tubeX;
    coin.position.y = TUBE_Y_POSITION;
    coin.position.z = 0;
    
    // Update quaternion
    coin.quaternion.setFromEuler(coin.rotation);
    
    if (progress < 1) {
      requestAnimationFrame(animateLanding);
    } else {
      // Final position - perfectly on target, facing camera
      const normalizedFinal = normalize(targetRotation);
      const baseCycles = Math.floor(targetFinal / TWO_PI);
      coin.rotation.x = baseCycles * TWO_PI + normalizedFinal;
      coin.rotation.y = Math.PI / 2; // Always face camera
      coin.rotation.z = 0; // No tilt
      coin.quaternion.setFromEuler(coin.rotation);
      
      // Ensure position is locked
      coin.position.x = tube.tube.position.x;
      coin.position.y = TUBE_Y_POSITION;
      coin.position.z = 0;
      
      tube.animationState = 'idle';
      tube.landingId = null;
      tube.flipId = null;
      tube.isFlipping = false;
      tube.lastStableRotation = {
        x: coin.rotation.x,
        y: coin.rotation.y,
        z: coin.rotation.z
      };
      
      console.log(`✅ Coin ${playerSlot + 1} LANDED perfectly facing camera:`, {
        finalRotation: `${coin.rotation.x.toFixed(2)} rad (${(coin.rotation.x / Math.PI).toFixed(2)}π)`,
        result: targetRotation === Math.PI/2 ? 'HEADS ⬆️' : 'TAILS ⬇️',
        facingCamera: coin.rotation.y === Math.PI/2
      });
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
 * Animate coin flip - ENHANCED from reference implementation
 * This is the complete working flip animation with proper physics
 */
export function animateCoinFlip(playerSlot, power, duration, tubes, coins, coinMaterials) {
  const tube = tubes[playerSlot];
  const coin = coins[playerSlot];
  
  if (!tube || !coin) {
    console.warn(`⚠️ animateCoinFlip: missing tube or coin for slot ${playerSlot}`);
    return;
  }
  
  if (tube.animationState !== 'flipping') {
    console.log(`⚠️ animateCoinFlip called but state is ${tube.animationState}, forcing flip state`);
    tube.animationState = 'flipping';
  }
  
  const powerPercent = power / 100;
  const material = tube.selectedMaterial || coinMaterials[2]; // Default to glass/index 2
  const speedMult = material.speedMultiplier || 1.0;
  const durationMult = material.durationMultiplier || 1.0;
  
  // Calculate flip parameters based on power and material
  const baseDuration = 2000 + (powerPercent * 6000);
  const flipDuration = duration || (baseDuration * durationMult);
  const basePowerSpeed = Math.max(0.08, 0.05 + (powerPercent * 0.25));
  const flipSpeed = basePowerSpeed * speedMult;
  
  console.log(`🎲 Starting ENHANCED coin flip for slot ${playerSlot}:`, {
    power: `${power}%`,
    material: material.name,
    duration: `${flipDuration.toFixed(0)}ms`,
    speed: flipSpeed.toFixed(3),
    speedMult: speedMult,
    durationMult: durationMult
  });
  
  const startTime = Date.now();
  const startRotation = coin.rotation.x;
  const flipId = tube.flipId || `flip_${playerSlot}_${startTime}`;
  tube.flipId = flipId;
  tube.isFlipping = true;
  
  // Calculate total rotations - ensure a minimum for visual impact
  // flipSpeed is radians per frame, so multiply by expected frames
  const expectedFrames = (flipDuration / 1000) * 60; // 60 fps
  const baseRotations = flipSpeed * expectedFrames; // Total radians
  const fullCycles = baseRotations / (Math.PI * 2); // Convert to full rotations
  const totalCycleCount = Math.max(6, Math.ceil(fullCycles)); // Minimum 6 full spins for visual impact
  const totalRotationAmount = totalCycleCount * Math.PI * 2;
  
  console.log(`🎲 Coin will do ${totalCycleCount} full rotations over ${flipDuration.toFixed(0)}ms (${(totalCycleCount / (flipDuration / 1000)).toFixed(1)} rotations/sec)`);
  
  const animate = () => {
    // Check if animation should continue
    if (tube.flipId !== flipId || (tube.animationState !== 'flipping' && tube.animationState !== 'landing')) {
      console.log(`🛑 Flip animation stopped for slot ${playerSlot} (state: ${tube.animationState})`);
      return;
    }
    
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / flipDuration, 1);
    
    // Smoother easing - less aggressive deceleration for more consistent spin
    // Use cubic easing for smoother feel
    const easeOutCubic = 1 - Math.pow(1 - progress, 3);
    
    // Calculate current rotation with continuous smooth spin
    const spinRotation = startRotation + (totalRotationAmount * easeOutCubic);
    coin.rotation.x = spinRotation;
    
    // Reduced wobble for cleaner spin appearance
    if (progress < 0.85) {
      const wobbleIntensity = (1 - progress) * 0.05; // Reduced wobble intensity
      coin.rotation.y = (Math.PI / 2) + Math.sin(spinRotation * 2) * wobbleIntensity; // Tie wobble to rotation for consistency
      coin.rotation.z = Math.sin(spinRotation * 1.5) * (wobbleIntensity * 0.5);
    } else {
      // Stabilize smoothly at the end
      const stabilizeProgress = (progress - 0.85) / 0.15;
      const wobbleIntensity = (1 - stabilizeProgress) * 0.05;
      coin.rotation.y = (Math.PI / 2) + (Math.sin(spinRotation * 2) * wobbleIntensity);
      coin.rotation.z = Math.sin(spinRotation * 1.5) * (wobbleIntensity * 0.5);
    }
    
    // Update quaternion from euler angles
    coin.quaternion.setFromEuler(coin.rotation);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Animation complete - normalize rotation and stabilize
      coin.rotation.y = Math.PI / 2;
      coin.rotation.z = 0;
      coin.quaternion.setFromEuler(coin.rotation);
      tube.lastStableRotation = {
        x: coin.rotation.x,
        y: coin.rotation.y,
        z: coin.rotation.z
      };
      console.log(`✅ Flip animation complete for slot ${playerSlot} at rotation ${coin.rotation.x.toFixed(2)} rad, awaiting server result...`);
      // Don't change animation state here - wait for server result
    }
  };
  
  animate();
}

