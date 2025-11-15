/**
 * Animation Loop
 * Main render loop for the grid game
 */

import { getScene, getCamera, getRenderer } from './scene-setup.js';

let animationFrameId = null;
let isRunning = false;
let updateCallbacks = [];

/**
 * Start the animation loop
 */
export function startAnimationLoop() {
  if (isRunning) {
    console.warn('⚠️ Animation loop already running');
    return;
  }

  console.log('🎬 Starting animation loop...');
  isRunning = true;
  animate();
}

/**
 * Stop the animation loop
 */
export function stopAnimationLoop() {
  if (!isRunning) {
    console.warn('⚠️ Animation loop not running');
    return;
  }

  console.log('⏹️ Stopping animation loop...');
  isRunning = false;

  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

/**
 * Register a callback to be called each frame
 * @param {Function} callback - Function to call each frame
 */
export function registerUpdateCallback(callback) {
  if (typeof callback === 'function') {
    updateCallbacks.push(callback);
  }
}

/**
 * Unregister an update callback
 * @param {Function} callback - Function to remove
 */
export function unregisterUpdateCallback(callback) {
  const index = updateCallbacks.indexOf(callback);
  if (index > -1) {
    updateCallbacks.splice(index, 1);
  }
}

/**
 * Clear all update callbacks
 */
export function clearUpdateCallbacks() {
  updateCallbacks = [];
}

/**
 * Main animation function
 */
function animate() {
  if (!isRunning) return;

  animationFrameId = requestAnimationFrame(animate);

  const scene = getScene();
  const camera = getCamera();
  const renderer = getRenderer();

  if (!scene || !camera || !renderer) {
    console.error('❌ Scene, camera, or renderer not initialized');
    stopAnimationLoop();
    return;
  }

  // Call all registered update callbacks
  updateCallbacks.forEach(callback => {
    try {
      callback();
    } catch (error) {
      console.error('❌ Error in update callback:', error);
    }
  });

  // Render the scene
  renderer.render(scene, camera);
}

/**
 * Check if animation loop is running
 */
export function isAnimationLoopRunning() {
  return isRunning;
}

export default {
  startAnimationLoop,
  stopAnimationLoop,
  registerUpdateCallback,
  unregisterUpdateCallback,
  clearUpdateCallbacks,
  isAnimationLoopRunning,
};
