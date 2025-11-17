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
 * Calculates rotations to naturally land on target face with power-based speed
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

  // Duration scales with power - longer power = longer spin time
  // Low power (0-0.2): 2-3 seconds
  // Medium power (0.2-0.7): 3-5 seconds
  // High power (0.7-1.0): 5-8 seconds
  const minDuration = 2000; // 2 seconds minimum
  const maxDuration = 8000; // 8 seconds maximum
  const duration = minDuration + (power * (maxDuration - minDuration));

  // Number of rotations scales with power - higher power = more spins
  // Low power: 3-5 full rotations
  // Medium power: 5-12 full rotations
  // High power: 12-25 full rotations
  const minRotations = 3;
  const maxRotations = 25;
  const baseRotations = minRotations + (power * (maxRotations - minRotations));

  // Add small random variation (0-1 rotations) so it's not perfectly predictable
  const randomExtraSpins = Math.random();
  const fullRotations = Math.floor(baseRotations + randomExtraSpins);

  // Calculate target rotation based on desired face
  // Heads: π/2 (90°), Tails: 3π/2 (270°)
  const targetRotation = targetFace === 'heads' ? Math.PI / 2 : (3 * Math.PI / 2);

  // Get current rotation (normalized to 0-2π)
  const currentRotation = coin.rotation.x;
  const normalizedCurrent = ((currentRotation % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);

  // Calculate total rotation: full spins + final landing rotation
  // We want to end at targetRotation, so we calculate the difference and add full rotations
  let rotationDifference = targetRotation - normalizedCurrent;

  // ALWAYS rotate forward (positive direction), never backwards
  // If difference is negative, add 2π to go the "long way" forward
  if (rotationDifference < 0) {
    rotationDifference += 2 * Math.PI;
  }

  const totalRotation = (fullRotations * 2 * Math.PI) + rotationDifference;

  console.log(`  💫 Will perform ${fullRotations} full rotations + final landing = ${(totalRotation / Math.PI).toFixed(2)}π radians over ${(duration/1000).toFixed(2)}s`);

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
    totalRotation, // Total rotation in radians
    targetRotation, // Final rotation position
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
    let progress = Math.min(elapsed / animation.duration, 1);

    if (progress >= 1) {
      // Animation complete - coin has fully stopped
      animation.completed = true;

      // Set final rotation to exact target (no snap, it should already be very close)
      coin.rotation.x = animation.startRotation.x + animation.totalRotation;
      coin.rotation.y = Math.PI / 2; // Fixed facing direction
      coin.rotation.z = 0; // No tilt

      coin.userData.isFlipping = false;
      coin.userData.currentFace = animation.targetFace;

      console.log(`✅ Flip complete for slot ${slotNumber}: landed on ${animation.targetFace}`);

      flipAnimations.delete(slotNumber);
      return;
    }

    // Easing function - creates natural deceleration curve
    // Higher power = more dramatic initial speed, longer tail
    // Uses cubic or quartic ease-out for smooth, natural slowdown
    const easeStrength = 3.0 + (animation.power * 2.0); // 3.0 to 5.0
    const easedProgress = 1 - Math.pow(1 - progress, easeStrength);

    // Apply extra smoothing in the last 20% for ultra-gradual stop
    // This creates the "slow landing" effect the user wants
    let finalProgress = easedProgress;
    if (progress > 0.8) {
      const endPhase = (progress - 0.8) / 0.2; // 0 to 1 in last 20%
      const endSmoothFactor = 1 - (0.12 * Math.pow(endPhase, 2));
      finalProgress = easedProgress * endSmoothFactor;
    }

    // Calculate current rotation based on eased progress
    const currentRotation = animation.totalRotation * finalProgress;

    // Apply rotation - smooth and continuous
    coin.rotation.x = animation.startRotation.x + currentRotation;
    coin.rotation.y = Math.PI / 2; // Keep coin facing camera
    coin.rotation.z = 0; // No wobble

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
 * Calculate animation duration for a given power level
 * This matches the calculation in startFlipAnimation
 */
export function getAnimationDuration(power = 0.7) {
  const minDuration = 2000; // 2 seconds minimum
  const maxDuration = 8000; // 8 seconds maximum
  return minDuration + (power * (maxDuration - minDuration));
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
  getAnimationDuration,
  stopAllFlipAnimations,
  setCoinFace,
  getCurrentFace,
  pulseCoin,
};
