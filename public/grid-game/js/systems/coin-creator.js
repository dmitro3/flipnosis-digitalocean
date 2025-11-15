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

  // Coin geometry - matching original implementation
  const coinRadius = 65;
  const coinThickness = 16;
  const geometry = new THREE.CylinderGeometry(
    coinRadius,
    coinRadius,
    coinThickness,
    64
  );

  // Load textures
  const textureLoader = new THREE.TextureLoader();
  const headsTexture = textureLoader.load(customTextures?.heads || '/coins/plainh.png');
  const tailsTexture = textureLoader.load(customTextures?.tails || '/coins/plaint.png');

  // Configure textures
  headsTexture.minFilter = THREE.LinearFilter;
  headsTexture.magFilter = THREE.LinearFilter;
  headsTexture.anisotropy = 16;
  headsTexture.generateMipmaps = false;

  tailsTexture.minFilter = THREE.LinearFilter;
  tailsTexture.magFilter = THREE.LinearFilter;
  tailsTexture.anisotropy = 16;
  tailsTexture.generateMipmaps = false;

  // Raw texture shader - displays textures without lighting/processing
  const rawTextureShader = {
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      varying vec2 vUv;
      void main() {
        gl_FragColor = texture2D(map, vUv);
      }
    `
  };

  // Create materials array: [edge, top/heads, bottom/tails]
  const materials = [
    // Edge material - glowing gold
    new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      emissive: 0xFFD700,
      emissiveIntensity: 0.3,
      metalness: 0.8,
      roughness: 0.2,
      side: THREE.DoubleSide,
      transparent: false
    }),
    // Top/Heads - RAW texture pixels (no lighting)
    new THREE.ShaderMaterial({
      uniforms: { map: { value: headsTexture } },
      vertexShader: rawTextureShader.vertexShader,
      fragmentShader: rawTextureShader.fragmentShader,
      side: THREE.DoubleSide,
      depthWrite: true,
      depthTest: true,
      transparent: false
    }),
    // Bottom/Tails - RAW texture pixels (no lighting)
    new THREE.ShaderMaterial({
      uniforms: { map: { value: tailsTexture } },
      vertexShader: rawTextureShader.vertexShader,
      fragmentShader: rawTextureShader.fragmentShader,
      side: THREE.DoubleSide,
      depthWrite: true,
      depthTest: true,
      transparent: false
    })
  ];

  // Create mesh
  const coin = new THREE.Mesh(geometry, materials);

  // Position the coin
  coin.position.set(position.x, position.y, position.z);

  // Rotation - standing on edge, facing camera
  coin.rotation.x = Math.PI / 2; // Standing on edge (90 degrees)
  coin.rotation.y = Math.PI / 2; // Rotated 90 degrees left for proper facing
  coin.rotation.z = 0; // No tilt

  // Critical rendering properties
  coin.visible = true;
  coin.frustumCulled = false; // Never cull from view
  coin.renderOrder = 1; // Render after background
  coin.layers.set(0); // Main rendering layer
  coin.matrixAutoUpdate = true; // Ensure matrix updates

  // Force material updates
  coin.material.forEach(mat => {
    if (mat.needsUpdate !== undefined) mat.needsUpdate = true;
  });

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
 * Create black shadow behind coin
 */
export function createCoinBackground(slotNumber, position) {
  const scene = getScene();

  const shadowSize = COIN_CONFIG.RADIUS * 2.5;

  // Create radial gradient shadow using shader material
  const shadowGeometry = new THREE.CircleGeometry(shadowSize, 64);
  const shadowMaterial = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    uniforms: {
      centerColor: { value: new THREE.Color(0x000000) },
      edgeColor: { value: new THREE.Color(0x000000) },
      opacity: { value: 0.6 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 centerColor;
      uniform vec3 edgeColor;
      uniform float opacity;
      varying vec2 vUv;
      void main() {
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(vUv, center);
        float gradient = smoothstep(0.0, 0.5, dist);
        vec3 color = mix(centerColor, edgeColor, gradient);
        float alpha = opacity * (1.0 - smoothstep(0.2, 0.5, dist));
        gl_FragColor = vec4(color, alpha);
      }
    `
  });

  const background = new THREE.Mesh(shadowGeometry, shadowMaterial);

  // Position behind coin (further back for shadow effect)
  background.position.set(position.x, position.y, position.z - 15);

  // Rotate to face camera
  background.rotation.y = 0;

  background.userData = {
    slotNumber,
    isEliminated: false,
  };

  background.renderOrder = -1; // Render behind coin

  scene.add(background);
  coinBackgrounds[slotNumber] = background;

  return background;
}

/**
 * Create player label (name/avatar) below coin
 */
export function createPlayerLabel(slotNumber, position, playerData) {
  const scene = getScene();

  // Create canvas with player info
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');

  // Background box with border
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.roundRect = function(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    return ctx;
  };

  ctx.roundRect(5, 5, 310, 90, 10).fill();

  // Gold border
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 3;
  ctx.roundRect(5, 5, 310, 90, 10).stroke();

  // Draw avatar placeholder or actual avatar if provided
  const avatarX = 15;
  const avatarY = 15;
  const avatarSize = 70;

  // Avatar background
  ctx.fillStyle = '#FFD700';
  ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, 8).fill();

  // Try to load player avatar if available
  if (playerData.avatar) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, 8);
      ctx.clip();
      ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();

      // Update texture
      const texture = new THREE.CanvasTexture(canvas);
      sprite.material.map = texture;
      sprite.material.needsUpdate = true;
    };
    img.onerror = () => {
      // Use default if avatar fails to load
      drawDefaultAvatar(ctx, avatarX, avatarY, avatarSize, slotNumber);
    };
    img.src = playerData.avatar;
  } else {
    drawDefaultAvatar(ctx, avatarX, avatarY, avatarSize, slotNumber);
  }

  // Player name
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 24px Orbitron';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const playerName = playerData.name || `Player ${slotNumber + 1}`;
  ctx.fillText(playerName, avatarX + avatarSize + 15, avatarY + 8);

  // Player info (lives, etc.)
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '18px Orbitron';
  const livesText = `♥ ${playerData.lives || 3} Lives`;
  ctx.fillText(livesText, avatarX + avatarSize + 15, avatarY + 40);

  // Create texture and sprite
  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
  });

  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(160, 50, 1);
  sprite.position.set(
    position.x,
    position.y - COIN_CONFIG.RADIUS - 80, // Below coin
    position.z
  );

  sprite.userData = {
    slotNumber,
    playerData,
  };

  scene.add(sprite);
  playerLabels[slotNumber] = sprite;

  return sprite;
}

/**
 * Draw default avatar (simple icon)
 */
function drawDefaultAvatar(ctx, x, y, size, slotNumber) {
  // Draw a simple player icon
  ctx.fillStyle = '#0a0f23';
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 3, size / 4, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size * 0.7, size / 3, 0, Math.PI * 2);
  ctx.fill();

  // Player number
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 16px Orbitron';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`P${slotNumber + 1}`, x + size / 2, y + size * 0.7);
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

/**
 * Update coin textures (for when player changes their coin)
 */
export function updateCoinTextures(slotNumber, headsImageUrl, tailsImageUrl) {
  const coin = coins[slotNumber];
  if (!coin) {
    console.warn(`⚠️ Cannot update textures: coin ${slotNumber} not found`);
    return;
  }

  console.log(`🎨 Updating coin textures for slot ${slotNumber}`, { headsImageUrl, tailsImageUrl });

  // Load new textures
  const textureLoader = new THREE.TextureLoader();

  // Load heads texture
  textureLoader.load(headsImageUrl, (headsTexture) => {
    headsTexture.minFilter = THREE.LinearFilter;
    headsTexture.magFilter = THREE.LinearFilter;
    headsTexture.anisotropy = 16;
    headsTexture.generateMipmaps = false;

    // Update heads material (index 1)
    if (coin.material[1] && coin.material[1].uniforms) {
      coin.material[1].uniforms.map.value = headsTexture;
      coin.material[1].needsUpdate = true;
    }

    console.log(`✅ Updated heads texture for slot ${slotNumber}`);
  }, undefined, (error) => {
    console.error(`❌ Failed to load heads texture for slot ${slotNumber}:`, error);
  });

  // Load tails texture
  textureLoader.load(tailsImageUrl, (tailsTexture) => {
    tailsTexture.minFilter = THREE.LinearFilter;
    tailsTexture.magFilter = THREE.LinearFilter;
    tailsTexture.anisotropy = 16;
    tailsTexture.generateMipmaps = false;

    // Update tails material (index 2)
    if (coin.material[2] && coin.material[2].uniforms) {
      coin.material[2].uniforms.map.value = tailsTexture;
      coin.material[2].needsUpdate = true;
    }

    console.log(`✅ Updated tails texture for slot ${slotNumber}`);
  }, undefined, (error) => {
    console.error(`❌ Failed to load tails texture for slot ${slotNumber}:`, error);
  });
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
  updateCoinTextures,
};
