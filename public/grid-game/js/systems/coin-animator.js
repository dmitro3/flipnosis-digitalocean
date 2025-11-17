/**
 * Coin Animator
 * Handles coin flip animations
 */

import * as THREE from 'three';
import { COIN_CONFIG } from '../config.js';
import { getCoin } from './coin-creator.js';

// Animation state
const flipAnimations = new Map();

/**
 * Start flip animation for a coin
 * NO LONGER PREDETERMINES RESULT - determines after landing
 */
export function startFlipAnimation(slotNumber, targetFace, power = 0.7) {
  const coin = getCoin(slotNumber);
  if (!coin) {
    console.error(`❌ Coin not found for slot ${slotNumber}`);
    return false;
  }

  if (coin.userData.isFlipping) {
    console.warn(`⚠️ Coin ${slotNumber} is already flipping`);
    return false;
  }

  console.log(`🎲 Starting flip animation for slot ${slotNumber}, power: ${power.toFixed(2)}`);

  // Dramatic rotation scaling based on power
  // Low power (0-0.2): 3-5 rotations over 2-3 seconds
  // Medium power (0.2-0.7): 5-10 rotations over 3-4.5 seconds
  // High power (0.7-1.0): 10-20 rotations over 4.5-7 seconds
  // INCREASED DURATIONS for longer tail
  const minRotations = 3;
  const maxRotations = 20;
  const powerRotations = minRotations + (power * (maxRotations - minRotations));

  // Add random extra spins (0-2) so it can't be perfectly gamed
  const randomExtraSpins = Math.random() * 2;
  const totalRotations = powerRotations + randomExtraSpins;

  // Duration scales with power - MUCH longer for dramatic tail
  const minDuration = 2000; // 2 seconds minimum
  const maxDuration = 7000; // 7 seconds maximum (extended for long tail)
  const duration = minDuration + (power * (maxDuration - minDuration));

  // CHANGED: Don't predetermine the result
  // Let the coin land naturally, then determine the side based on final position
  // Add a random final rotation that will land on either heads or tails
  const randomLanding = Math.random(); // 0-1
  const finalRotationX = totalRotations * 2 * Math.PI + (randomLanding < 0.5 ? Math.PI / 2 : (3 * Math.PI) / 2);

  // Create animation state
  const animation = {
    slotNumber,
    targetFace,
    startTime: Date.now(),
    duration: duration,
    startRotation: {
      x: coin.rotation.x,
      y: coin.rotation.y,
      z: coin.rotation.z,
    },
    totalRotations,
    finalRotationX,
    power,
    progress: 0,
    completed: false,
  };

  flipAnimations.set(slotNumber, animation);

  coin.userData.isFlipping = true;
  coin.userData.targetFace = targetFace;

  return true;
}

/**
 * Update all active flip animations
 */
export function updateFlipAnimations() {
  const currentTime = Date.now();

  flipAnimations.forEach((animation, slotNumber) => {
    if (animation.completed) {
      flipAnimations.delete(slotNumber);
      return;
    }

    const coin = getCoin(slotNumber);
    if (!coin) {
      flipAnimations.delete(slotNumber);
      return;
    }

    // Calculate progress (0 to 1)
    const elapsed = currentTime - animation.startTime;
    let progress = elapsed / animation.duration;

    if (progress >= 1) {
      // Animation complete
      progress = 1;
      animation.completed = true;

      // Set final rotation
      coin.rotation.x = animation.finalRotationX;
      coin.rotation.y = Math.PI / 2;
      coin.rotation.z = 0;

      coin.userData.isFlipping = false;

      // CHANGED: Determine the face AFTER landing based on final rotation
      const normalizedRotation = animation.finalRotationX % (2 * Math.PI);
      const isHeads = (normalizedRotation >= 0 && normalizedRotation < Math.PI) ||
                      (normalizedRotation >= Math.PI / 4 && normalizedRotation < 3 * Math.PI / 4) ||
                      (normalizedRotation >= 5 * Math.PI / 4 && normalizedRotation < 7 * Math.PI / 4);
      const landedFace = isHeads ? 'heads' : 'tails';

      coin.userData.currentFace = landedFace;
      coin.userData.targetFace = landedFace;

      console.log(`✅ Flip animation complete for slot ${slotNumber}: landed on ${landedFace} (rotation: ${normalizedRotation.toFixed(2)})`);

      flipAnimations.delete(slotNumber);
      return;
    }

    // Easing function - EXTREME exponential decay for VERY long, gradual slow-stop
    // Creates an ultra-long deceleration tail that feels natural
    // Higher power = more dramatic initial speed, but ALWAYS ends with SUPER gradual stop
    const easeStrength = 3.5 + (animation.power * 3.5); // 3.5 to 7.0 for VERY strong ease-out
    const easedProgress = 1 - Math.pow(1 - progress, easeStrength);

    // Apply MUCH MORE smoothing for the last 30% to ensure REALLY gradual stop
    const smoothProgress = progress > 0.7
      ? easedProgress * (1 - 0.15 * Math.pow((progress - 0.7) / 0.3, 3))
      : easedProgress;

    // Calculate rotation using the smoothed progress for gradual deceleration
    const rotationAmount = animation.totalRotations * 2 * Math.PI * smoothProgress;

    // Clean rotation without wobble
    coin.rotation.x = animation.startRotation.x + rotationAmount;
    coin.rotation.y = Math.PI / 2; // Fixed facing direction
    coin.rotation.z = 0; // No tilt

    animation.progress = progress;
  });
}

/**
 * Check if coin is currently flipping
 */
export function isCoinFlipping(slotNumber) {
  return flipAnimations.has(slotNumber);
}

/**
 * Stop all flip animations
 */
export function stopAllFlipAnimations() {
  flipAnimations.forEach((animation, slotNumber) => {
    const coin = getCoin(slotNumber);
    if (coin) {
      coin.userData.isFlipping = false;
    }
  });

  flipAnimations.clear();
  console.log('⏹️ All flip animations stopped');
}

/**
 * Set coin to specific face (instant, no animation)
 */
export function setCoinFace(slotNumber, face) {
  const coin = getCoin(slotNumber);
  if (!coin) return;

  const isHeads = face === 'heads';
  coin.rotation.x = isHeads ? Math.PI / 2 : (3 * Math.PI) / 2;
  coin.rotation.y = Math.PI / 2;
  coin.rotation.z = 0;

  coin.userData.currentFace = face;
}

/**
 * Get current face of coin (based on rotation)
 */
export function getCurrentFace(slotNumber) {
  const coin = getCoin(slotNumber);
  if (!coin) return null;

  return coin.userData.currentFace || 'heads';
}

/**
 * Pulse animation for coin (attention grabber)
 */
export function pulseCoin(slotNumber, duration = 1000) {
  const coin = getCoin(slotNumber);
  if (!coin) return;

  const startScale = coin.scale.clone();
  const startTime = Date.now();

  function pulse() {
    const elapsed = Date.now() - startTime;
    const progress = elapsed / duration;

    if (progress >= 1) {
      coin.scale.copy(startScale);
      return;
    }

    const scale = 1 + Math.sin(progress * Math.PI * 4) * 0.1;
    coin.scale.set(scale, scale, scale);

    requestAnimationFrame(pulse);
  }

  pulse();
}

export default {
  startFlipAnimation,
  updateFlipAnimations,
  isCoinFlipping,
  stopAllFlipAnimations,
  setCoinFace,
  getCurrentFace,
  pulseCoin,
};
