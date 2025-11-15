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

  console.log(`🎲 Starting flip animation for slot ${slotNumber}, target: ${targetFace}`);

  // Calculate rotations based on target and power
  const baseRotations = COIN_CONFIG.FLIP_ROTATIONS;
  const powerMultiplier = 0.8 + (power * 0.4); // 0.8 to 1.2x
  const totalRotations = baseRotations * powerMultiplier;

  // Determine final rotation
  const isHeads = targetFace === 'heads';
  const finalRotationX = isHeads ? Math.PI / 2 : (3 * Math.PI) / 2;

  // Create animation state
  const animation = {
    slotNumber,
    targetFace,
    startTime: Date.now(),
    duration: COIN_CONFIG.FLIP_DURATION,
    startRotation: {
      x: coin.rotation.x,
      y: coin.rotation.y,
      z: coin.rotation.z,
    },
    totalRotations,
    finalRotationX,
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

    // Easing function (ease-out quad)
    const easedProgress = 1 - Math.pow(1 - progress, 2);

    // Calculate rotation
    const rotationAmount = animation.totalRotations * 2 * Math.PI * easedProgress;

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
