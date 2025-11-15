/**
 * Scene Setup
 * Initialize Three.js scene, camera, renderer, and lighting
 */

import * as THREE from 'three';
import { CAMERA_CONFIG, COLORS } from '../config.js';

let scene, camera, renderer;

/**
 * Initialize the Three.js scene
 */
export function initializeScene() {
  console.log('🎬 Initializing scene...');

  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.BACKGROUND);
  scene.fog = new THREE.Fog(COLORS.BACKGROUND, 1000, 3000);

  // Create camera
  const container = document.getElementById('canvas-container');
  const aspect = container.clientWidth / container.clientHeight;

  camera = new THREE.PerspectiveCamera(
    CAMERA_CONFIG.FOV,
    aspect,
    CAMERA_CONFIG.NEAR,
    CAMERA_CONFIG.FAR
  );

  camera.position.set(
    CAMERA_CONFIG.POSITION_X,
    CAMERA_CONFIG.POSITION_Y,
    CAMERA_CONFIG.POSITION_Z
  );

  camera.lookAt(0, CAMERA_CONFIG.LOOK_AT_Y, 0);

  // Create renderer
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
  });

  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  container.appendChild(renderer.domElement);

  // Add lighting
  setupLighting();

  // Handle window resize
  window.addEventListener('resize', onWindowResize);

  console.log('✅ Scene initialized');

  return { scene, camera, renderer };
}

/**
 * Setup scene lighting
 */
function setupLighting() {
  // Ambient light for overall illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  // Main directional light (sun-like)
  const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
  mainLight.position.set(0, 500, 500);
  mainLight.castShadow = true;
  mainLight.shadow.camera.left = -1000;
  mainLight.shadow.camera.right = 1000;
  mainLight.shadow.camera.top = 1000;
  mainLight.shadow.camera.bottom = -1000;
  mainLight.shadow.mapSize.width = 2048;
  mainLight.shadow.mapSize.height = 2048;
  scene.add(mainLight);

  // Fill light (from opposite side)
  const fillLight = new THREE.DirectionalLight(0x00ffff, 0.3);
  fillLight.position.set(-500, 300, -500);
  scene.add(fillLight);

  // Rim light (from behind)
  const rimLight = new THREE.DirectionalLight(0xff1493, 0.2);
  rimLight.position.set(0, 200, -500);
  scene.add(rimLight);

  console.log('✅ Lighting setup complete');
}

/**
 * Handle window resize
 */
function onWindowResize() {
  const container = document.getElementById('canvas-container');

  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(container.clientWidth, container.clientHeight);
}

/**
 * Get the scene objects
 */
export function getScene() {
  return scene;
}

export function getCamera() {
  return camera;
}

export function getRenderer() {
  return renderer;
}

/**
 * Dispose of scene resources
 */
export function disposeScene() {
  console.log('🧹 Disposing scene...');

  window.removeEventListener('resize', onWindowResize);

  if (renderer) {
    renderer.dispose();
    const container = document.getElementById('canvas-container');
    if (container && renderer.domElement) {
      container.removeChild(renderer.domElement);
    }
  }

  console.log('✅ Scene disposed');
}

export default {
  initializeScene,
  getScene,
  getCamera,
  getRenderer,
  disposeScene,
};
