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

  console.log(`🎲 Starting flip animation for slot ${slotNumber}, target: ${targetFace}, power: ${power.toFixed(2)}`);

  // Dramatic rotation scaling based on power
  // Low power (0-0.2): 3-5 rotations over 1-1.5 seconds
  // Medium power (0.2-0.7): 5-10 rotations over 1.5-2.5 seconds
  // High power (0.7-1.0): 10-20 rotations over 2.5-4 seconds
  const minRotations = 3;
  const maxRotations = 20;
  const powerRotations = minRotations + (power * (maxRotations - minRotations));

  // Add random extra spins (0-2) so it can't be perfectly gamed
  const randomExtraSpins = Math.random() * 2;
  const totalRotations = powerRotations + randomExtraSpins;

  // Duration scales with power - faster spins at high power last longer
  const minDuration = 1000; // 1 second minimum
  const maxDuration = 4000; // 4 seconds maximum
  const duration = minDuration + (power * (maxDuration - minDuration));

  // Determine final rotation with slight randomness
  // Add random offset to make it less predictable (within ±15 degrees)
  const randomOffset = (Math.random() - 0.5) * (Math.PI / 12); // ±15 degrees
  const isHeads = targetFace === 'heads';
  const baseRotation = isHeads ? Math.PI / 2 : (3 * Math.PI) / 2;
  const finalRotationX = baseRotation + randomOffset;

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
      coin.userData.currentFace = animation.targetFace;

      console.log(`✅ Flip animation complete for slot ${slotNumber}: ${animation.targetFace}`);

      flipAnimations.delete(slotNumber);
      return;
    }

    // Easing function - exponential decay for smooth, gradual slow-stop
    // Creates a long deceleration tail that feels natural
    // Higher power = more dramatic initial speed, but always ends with gradual stop
    const easeStrength = 2.5 + (animation.power * 2.5); // 2.5 to 5.0 for strong ease-out
    const easedProgress = 1 - Math.pow(1 - progress, easeStrength);

    // Apply additional smoothing for the last 20% to ensure gradual stop
    const smoothProgress = progress > 0.8
      ? easedProgress * (1 - 0.05 * Math.pow((progress - 0.8) / 0.2, 2))
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
