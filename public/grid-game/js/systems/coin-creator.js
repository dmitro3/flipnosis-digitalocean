/**
 * Coin Creator
 * Creates 3D coin objects without tubes or physics
 */

import * as THREE from 'three';
import { COIN_CONFIG, COLORS, getPlayerBackgroundColor } from '../config.js';
import { getScene } from '../core/scene-setup.js';

// Store created coins
const coins = [];
const coinBackgrounds = [];
const playerLabels = [];

/**
 * Create a single coin at specified position
 */
export function createCoin(slotNumber, position, customTextures = null) {
  const scene = getScene();

  // Create coin geometry
  const geometry = new THREE.CylinderGeometry(
    COIN_CONFIG.RADIUS,
    COIN_CONFIG.RADIUS,
    COIN_CONFIG.THICKNESS,
    COIN_CONFIG.SEGMENTS
  );

  // Create materials
  const materials = [];

  // Edge material (gold)
  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: COIN_CONFIG.EDGE_COLOR,
    metalness: 0.8,
    roughness: 0.2,
  });

  // Heads material
  const headsMaterial = createCoinFaceMaterial(
    customTextures?.heads || null,
    'HEADS'
  );

  // Tails material
  const tailsMaterial = createCoinFaceMaterial(
    customTextures?.tails || null,
    'TAILS'
  );

  // Material order for CylinderGeometry: [side, top, bottom]
  materials[0] = edgeMaterial;  // Side
  materials[1] = headsMaterial; // Top (heads)
  materials[2] = tailsMaterial; // Bottom (tails)

  // Create mesh
  const coin = new THREE.Mesh(geometry, materials);

  // Position the coin
  coin.position.set(position.x, position.y, position.z);

  // Rotate to show heads by default
  coin.rotation.x = Math.PI / 2;

  // Add metadata
  coin.userData = {
    slotNumber,
    isFlipping: false,
    currentFace: 'heads',
    targetFace: 'heads',
    flipProgress: 0,
  };

  // Add to scene
  scene.add(coin);

  // Store reference
  coins[slotNumber] = coin;

  console.log(`✅ Created coin for slot ${slotNumber} at`, position);

  return coin;
}

/**
 * Create coin face material (heads or tails)
 */
function createCoinFaceMaterial(textureUrl, defaultText) {
  if (textureUrl) {
    // Load custom texture
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(textureUrl);
    texture.anisotropy = 16;

    return new THREE.MeshStandardMaterial({
      map: texture,
      metalness: 0.3,
      roughness: 0.4,
    });
  } else {
    // Create default material with text
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(0, 0, 512, 512);

    // Border
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 20;
    ctx.strokeRect(10, 10, 492, 492);

    // Text
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 80px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(defaultText, 256, 256);

    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16;

    return new THREE.MeshStandardMaterial({
      map: texture,
      metalness: 0.3,
      roughness: 0.4,
    });
  }
}

/**
 * Create background plane for coin with gold frame
 */
export function createCoinBackground(slotNumber, position) {
  const scene = getScene();

  const bgSize = COIN_CONFIG.RADIUS * 2.8;
  const frameThickness = 8;

  // Create canvas for background with gold frame
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Draw gold frame (outer border)
  ctx.fillStyle = '#FFD700'; // Gold
  ctx.fillRect(0, 0, 512, 512);

  // Draw dark navy background (inner area)
  ctx.fillStyle = '#0a0f23'; // Dark navy
  ctx.fillRect(frameThickness, frameThickness, 512 - frameThickness * 2, 512 - frameThickness * 2);

  // Add inner gold glow/highlight
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(frameThickness + 2, frameThickness + 2, 512 - frameThickness * 2 - 4, 512 - frameThickness * 2 - 4);

  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;

  const geometry = new THREE.PlaneGeometry(bgSize, bgSize);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: false,
    side: THREE.DoubleSide,
  });

  const background = new THREE.Mesh(geometry, material);

  // Position behind coin
  background.position.set(position.x, position.y, position.z - 20);

  // Rotate to face camera
  background.rotation.y = 0;

  background.userData = {
    slotNumber,
    isEliminated: false,
  };

  scene.add(background);
  coinBackgrounds[slotNumber] = background;

  return background;
}

/**
 * Create player label (name/avatar) above coin
 */
export function createPlayerLabel(slotNumber, position, playerData) {
  // For now, we'll use Three.js text
  // In production, you might use CSS3D or sprites

  const scene = getScene();

  // Create text using canvas texture
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
  ctx.fillRect(0, 0, 256, 64);

  // Border
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 256, 64);

  // Text
  ctx.fillStyle = '#00ffff';
  ctx.font = 'bold 24px Orbitron';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(playerData.name || `Player ${slotNumber + 1}`, 128, 32);

  // Create texture and sprite
  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
  });

  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(120, 30, 1);
  sprite.position.set(
    position.x,
    position.y + COIN_CONFIG.RADIUS + 60,
    position.z
  );

  sprite.userData = {
    slotNumber,
  };

  scene.add(sprite);
  playerLabels[slotNumber] = sprite;

  return sprite;
}

/**
 * Create complete coin setup (coin + background + label)
 */
export function createCompleteCoinSetup(slotNumber, position, playerData, customTextures) {
  const coin = createCoin(slotNumber, position, customTextures);
  const background = createCoinBackground(slotNumber, position);
  const label = createPlayerLabel(slotNumber, position, playerData);

  return { coin, background, label };
}

/**
 * Remove coin and associated objects
 */
export function removeCoin(slotNumber) {
  const scene = getScene();

  // Remove coin
  if (coins[slotNumber]) {
    scene.remove(coins[slotNumber]);
    coins[slotNumber].geometry.dispose();
    coins[slotNumber].material.forEach(m => m.dispose());
    coins[slotNumber] = null;
  }

  // Remove background
  if (coinBackgrounds[slotNumber]) {
    scene.remove(coinBackgrounds[slotNumber]);
    coinBackgrounds[slotNumber].geometry.dispose();
    coinBackgrounds[slotNumber].material.dispose();
    coinBackgrounds[slotNumber] = null;
  }

  // Remove label
  if (playerLabels[slotNumber]) {
    scene.remove(playerLabels[slotNumber]);
    playerLabels[slotNumber].material.map.dispose();
    playerLabels[slotNumber].material.dispose();
    playerLabels[slotNumber] = null;
  }
}

/**
 * Update coin position (for grid reorganization)
 */
export function updateCoinPosition(slotNumber, newPosition, animated = true) {
  const coin = coins[slotNumber];
  const background = coinBackgrounds[slotNumber];
  const label = playerLabels[slotNumber];

  if (!coin) return;

  if (animated) {
    // TODO: Add smooth animation
    // For now, just update position
  }

  coin.position.set(newPosition.x, newPosition.y, newPosition.z);

  if (background) {
    background.position.set(newPosition.x, newPosition.y, newPosition.z - 20);
  }

  if (label) {
    label.position.set(
      newPosition.x,
      newPosition.y + COIN_CONFIG.RADIUS + 60,
      newPosition.z
    );
  }
}

/**
 * Mark coin as eliminated (visual change)
 */
export function markCoinEliminated(slotNumber) {
  const coin = coins[slotNumber];
  const background = coinBackgrounds[slotNumber];

  if (!coin) return;

  // Darken the coin
  coin.material[0].color.setHex(COLORS.ELIMINATED);
  coin.material[0].metalness = 0.2;

  // Fade background
  if (background) {
    background.material.opacity = 0.1;
    background.userData.isEliminated = true;
  }

  console.log(`💀 Marked coin ${slotNumber} as eliminated`);
}

/**
 * Get all coins
 */
export function getAllCoins() {
  return coins.filter(c => c !== null);
}

/**
 * Get coin by slot number
 */
export function getCoin(slotNumber) {
  return coins[slotNumber];
}

/**
 * Clear all coins
 */
export function clearAllCoins() {
  for (let i = 0; i < coins.length; i++) {
    removeCoin(i);
  }
  coins.length = 0;
  coinBackgrounds.length = 0;
  playerLabels.length = 0;
}

export default {
  createCoin,
  createCoinBackground,
  createPlayerLabel,
  createCompleteCoinSetup,
  removeCoin,
  updateCoinPosition,
  markCoinEliminated,
  getAllCoins,
  getCoin,
  clearAllCoins,
};
