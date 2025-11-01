/**
 * Tube Creator
 * Creates all game tubes with glass, coins, pearls, and player cards
 * Handles all event handlers and socket connections
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { NUM_TUBES, TUBE_RADIUS, TUBE_HEIGHT, SPACING, TUBE_Y_POSITION, START_X } from '../config.js';
import { coinOptions, coinMaterials } from '../core/game-state.js';
import { playSound, stopSound, powerChargeSound } from '../utils/audio.js';
import { updatePearlColors } from './pearl-physics.js';
import { calculateReleaseAccuracy } from './power-system.js';
import { shatterGlass } from './glass-shatter.js';
import { updateCoinRotationsFromPlayerChoices } from './coin-manager.js';
import { isMobile } from '../utils/helpers.js';

/**
 * Get tube style based on room type
 */
export function getTubeStyle(roomType) {
  if (roomType === 'lab') {
    return {
      glassColor: 0x4a90e2,
      glassOpacity: 0.2,
      glassEmissive: 0x1a3a5c,
      glassEmissiveIntensity: 0.1,
      capColor: 0x8B4513,
      capMetalness: 0.1,
      capRoughness: 0.8,
      rimColor: 0x00ff88,
      backingColor: 0x34495e,
      backingMetalness: 0.8,
      backingRoughness: 0.4,
      tubeShape: 'lab',
      tubeRadius: TUBE_RADIUS * 0.8,
      tubeHeight: TUBE_HEIGHT * 1.1
    };
  } else if (roomType === 'cyber') {
    return {
      glassColor: 0x00ffff,
      glassOpacity: 0.25,
      glassEmissive: 0x004444,
      glassEmissiveIntensity: 0.2,
      capColor: 0xff6600,
      capMetalness: 0.3,
      capRoughness: 0.2,
      rimColor: 0xff6600,
      backingColor: 0x001122,
      backingMetalness: 0.9,
      backingRoughness: 0.1,
      tubeShape: 'cyber',
      tubeRadius: TUBE_RADIUS * 0.9,
      tubeHeight: TUBE_HEIGHT * 1.05
    };
  } else if (roomType === 'mech') {
    return {
      glassColor: 0x666666,
      glassOpacity: 0.3,
      glassEmissive: 0x220000,
      glassEmissiveIntensity: 0.1,
      capColor: 0xff0000,
      capMetalness: 0.8,
      capRoughness: 0.3,
      rimColor: 0xff0000,
      backingColor: 0x222222,
      backingMetalness: 0.9,
      backingRoughness: 0.2,
      tubeShape: 'mech',
      tubeRadius: TUBE_RADIUS * 0.95,
      tubeHeight: TUBE_HEIGHT * 1.02
    };
  } else {
    return {
      glassColor: 0xd0d0d0,
      glassOpacity: 0.15,
      glassEmissive: 0x505050,
      glassEmissiveIntensity: 0.15,
      capColor: 0xcd7f32,
      capMetalness: 0.98,
      capRoughness: 0.1,
      rimColor: 0xff8800,
      backingColor: 0xe0e0e0,
      backingMetalness: 0.98,
      backingRoughness: 0.1,
      tubeShape: 'potion',
      tubeRadius: TUBE_RADIUS,
      tubeHeight: TUBE_HEIGHT
    };
  }
}

/**
 * Create all game tubes
 */
export function createTubes(dependencies) {
  const {
    scene,
    camera,
    physicsWorld,
    textureLoader,
    brassColorMap,
    brassDisplacementMap,
    tubeAlphaTexture,
    webglRenderer,
    roomParam,
    players,
    isServerSideMode,
    socket,
    gameIdParam,
    walletParam,
    playerSlot,
    currentRound,
    // Callback functions
    saveGameState,
    updatePlayerCardButtons,
    showChoiceRequiredMessage,
    showSweetSpotFeedback,
    shatterGlassFunc,
    flipCoinWithPower,
    updateCoinRotationsFromPlayerChoicesFunc
  } = dependencies;

  const tubeStyle = getTubeStyle(roomParam);
  console.log(`🎨 Using ${roomParam} room tube style:`, tubeStyle);

  const tubes = [];
  const coins = [];

  for (let i = 0; i < NUM_TUBES; i++) {
    const x = START_X + (i * SPACING);
    const player = players[i];

    // Tube geometry based on style
    let tubeGeometry;
    if (tubeStyle.tubeShape === 'lab') {
      tubeGeometry = new THREE.CylinderGeometry(
        tubeStyle.tubeRadius * 0.9,
        tubeStyle.tubeRadius,
        tubeStyle.tubeHeight,
        128, 1, true
      );
    } else if (tubeStyle.tubeShape === 'cyber') {
      tubeGeometry = new THREE.CylinderGeometry(
        tubeStyle.tubeRadius * 0.85,
        tubeStyle.tubeRadius * 1.05,
        tubeStyle.tubeHeight,
        128, 1, true
      );
    } else if (tubeStyle.tubeShape === 'mech') {
      tubeGeometry = new THREE.CylinderGeometry(
        tubeStyle.tubeRadius,
        tubeStyle.tubeRadius,
        tubeStyle.tubeHeight,
        128, 1, true
      );
    } else {
      tubeGeometry = new THREE.CylinderGeometry(
        tubeStyle.tubeRadius,
        tubeStyle.tubeRadius,
        tubeStyle.tubeHeight,
        128, 1, true
      );
    }

    // Glass material
    const glassMaterial = new THREE.MeshStandardMaterial({
      color: tubeStyle.glassColor,
      transparent: true,
      opacity: tubeStyle.glassOpacity,
      alphaMap: tubeAlphaTexture,
      roughness: 0.2,
      metalness: 1.0,
      emissive: tubeStyle.glassEmissive,
      emissiveIntensity: tubeStyle.glassEmissiveIntensity,
      side: THREE.DoubleSide
    });
    const tube = new THREE.Mesh(tubeGeometry, glassMaterial);
    tube.position.set(x, TUBE_Y_POSITION, 0);
    tube.rotation.y = Math.PI;
    scene.add(tube);

    // Backing
    const backingGeometry = new THREE.CylinderGeometry(
      tubeStyle.tubeRadius + 5,
      tubeStyle.tubeRadius + 5,
      tubeStyle.tubeHeight + 20,
      32, 1, false
    );
    const backingMaterial = new THREE.MeshStandardMaterial({
      color: tubeStyle.backingColor,
      roughness: tubeStyle.backingRoughness,
      metalness: tubeStyle.backingMetalness,
      emissive: 0x404040,
      emissiveIntensity: 0.1,
      side: THREE.BackSide
    });
    const backing = new THREE.Mesh(backingGeometry, backingMaterial);
    backing.position.set(x, TUBE_Y_POSITION, -10);
    scene.add(backing);

    // Cap material
    const capMaterial = new THREE.MeshStandardMaterial({
      map: brassColorMap,
      displacementMap: brassDisplacementMap,
      displacementScale: 0.2,
      color: tubeStyle.capColor,
      metalness: tubeStyle.capMetalness,
      roughness: tubeStyle.capRoughness,
    });

    const capGeometry = new THREE.CylinderGeometry(
      tubeStyle.tubeRadius + 10,
      tubeStyle.tubeRadius + 10,
      15, 64
    );

    const capCanvas = document.createElement('canvas');
    capCanvas.width = 256;
    capCanvas.height = 256;
    const capCtx = capCanvas.getContext('2d');
    capCtx.fillStyle = 'white';
    capCtx.fillRect(0, 0, 256, 256);
    capCtx.globalCompositeOperation = 'destination-out';
    capCtx.fillStyle = 'black';
    capCtx.beginPath();
    capCtx.arc(128, 128, 60, 0, Math.PI * 2);
    capCtx.fill();
    const capAlphaTexture = new THREE.CanvasTexture(capCanvas);

    const topCapMaterial = capMaterial.clone();
    topCapMaterial.alphaMap = capAlphaTexture;
    topCapMaterial.transparent = true;

    const topCap = new THREE.Mesh(capGeometry, topCapMaterial);
    topCap.position.set(x, TUBE_Y_POSITION + (tubeStyle.tubeHeight / 2) + 7.5, 0);
    scene.add(topCap);

    const bottomCap = new THREE.Mesh(capGeometry, capMaterial.clone());
    bottomCap.position.set(x, TUBE_Y_POSITION - (tubeStyle.tubeHeight / 2) - 7.5, 0);
    scene.add(bottomCap);

    // Rims
    const rimGeometry = new THREE.TorusGeometry(tubeStyle.tubeRadius + 5, 8, 32, 64);
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: tubeStyle.rimColor,
      metalness: 0.95,
      roughness: 0.1,
    });

    const topRim = new THREE.Mesh(rimGeometry, rimMaterial);
    topRim.position.set(x, TUBE_Y_POSITION + tubeStyle.tubeHeight / 2, 0);
    topRim.rotation.x = Math.PI / 2;
    scene.add(topRim);

    const bottomRim = topRim.clone();
    bottomRim.position.y = TUBE_Y_POSITION - tubeStyle.tubeHeight / 2;
    scene.add(bottomRim);

    // Physics body
    const glassBody = new CANNON.Body({
      type: CANNON.Body.STATIC,
      position: new CANNON.Vec3(x, TUBE_Y_POSITION, 0)
    });

    const bottomCapShape = new CANNON.Box(new CANNON.Vec3(tubeStyle.tubeRadius + 5, 20, tubeStyle.tubeRadius + 5));
    const bottomCapOffset = new CANNON.Vec3(0, -(tubeStyle.tubeHeight / 2) - 15, 0);
    glassBody.addShape(bottomCapShape, bottomCapOffset);

    const topCapShape = new CANNON.Box(new CANNON.Vec3(tubeStyle.tubeRadius + 5, 30, tubeStyle.tubeRadius + 5));
    const topCapOffset = new CANNON.Vec3(0, (tubeStyle.tubeHeight / 2) + 20, 0);
    glassBody.addShape(topCapShape, topCapOffset);

    const numWalls = 16;
    const wallThickness = 3;
    for (let w = 0; w < numWalls; w++) {
      const angle = (w / numWalls) * Math.PI * 2;
      const wallX = Math.cos(angle) * (tubeStyle.tubeRadius - 6);
      const wallZ = Math.sin(angle) * (tubeStyle.tubeRadius - 6);
      const wallShape = new CANNON.Box(new CANNON.Vec3(wallThickness, (tubeStyle.tubeHeight - 10) / 2, wallThickness));
      const wallOffset = new CANNON.Vec3(wallX, 0, wallZ);
      glassBody.addShape(wallShape, wallOffset);
    }

    physicsWorld.addBody(glassBody);
    console.log(`⚛️ Sealed physics container created for tube ${i + 1}`);

    // Liquid particles (pearls)
    const liquidParticles = [];
    const liquidParticleMeshes = [];
    const particleRadius = 7;
    const maxLayers = 80;

    for (let p = 0; p < maxLayers; p++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * (tubeStyle.tubeRadius - 25);
      const pearlX = x + Math.cos(angle) * radius;
      const pearlZ = Math.sin(angle) * radius;
      const pearlY = TUBE_Y_POSITION - (tubeStyle.tubeHeight / 2) + 30 + Math.random() * 60;

      const particleShape = new CANNON.Sphere(particleRadius);
      const particleBody = new CANNON.Body({
        mass: 0.3,
        position: new CANNON.Vec3(pearlX, pearlY, pearlZ),
        material: new CANNON.Material({ friction: 0.1, restitution: 0.8 })
      });
      particleBody.addShape(particleShape);
      particleBody.linearDamping = 0.6;
      particleBody.angularDamping = 0.6;
      particleBody.collisionFilterGroup = 1;
      particleBody.collisionFilterMask = -1;

      physicsWorld.addBody(particleBody);

      const particleGeometry = new THREE.SphereGeometry(particleRadius, 32, 32);
      const particleMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x1a1a1a,
        metalness: 0.0,
        roughness: 0.3,
        transparent: true,
        opacity: 0.7,
        emissive: 0x0a0a0a,
        emissiveIntensity: 0.2,
        toneMapped: false,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05
      });
      const particleMesh = new THREE.Mesh(particleGeometry, particleMaterial);
      particleMesh.visible = true;
      particleMesh.layers.set(1);
      scene.add(particleMesh);

      liquidParticles.push(particleBody);
      liquidParticleMeshes.push(particleMesh);
    }

    // Liquid surface
    const liquidHeight = TUBE_HEIGHT - 20;
    const liquidGeometry = new THREE.CylinderGeometry(TUBE_RADIUS - 6, TUBE_RADIUS - 6, liquidHeight, 32, 32);
    const liquidMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1a1a2e,
      metalness: 0.05,
      roughness: 0.3,
      transparent: true,
      opacity: 0.25,
      transmission: 0.6,
      thickness: 1.5,
      clearcoat: 0.6,
      clearcoatRoughness: 0.05,
      emissive: 0x0a0a1a,
      emissiveIntensity: 0.2,
      ior: 1.33,
      reflectivity: 0.3,
      envMapIntensity: 1.2,
      side: THREE.DoubleSide
    });
    const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
    const liquidY = TUBE_Y_POSITION - (TUBE_HEIGHT / 2) + (liquidHeight / 2);
    liquid.position.set(x, liquidY, 0);
    liquid.scale.y = 1.0;
    liquid.visible = true;
    scene.add(liquid);

    const liquidLight = new THREE.PointLight(0x1a1a2e, 0.3, 400);
    liquidLight.position.set(0, 0, 0);
    liquid.add(liquidLight);

    // Spotlight
    const spotlight = new THREE.SpotLight(0xffffff, 0.7, 700, Math.PI / 6, 0.5, 2);
    spotlight.position.set(x, TUBE_Y_POSITION + TUBE_HEIGHT / 2 + 300, 150);
    spotlight.target.position.set(x, TUBE_Y_POSITION, 0);
    scene.add(spotlight);
    scene.add(spotlight.target);

    // Platform
    const platformGeometry = new THREE.CylinderGeometry(TUBE_RADIUS + 20, TUBE_RADIUS + 20, 15, 32);
    const platformMaterial = new THREE.MeshStandardMaterial({
      map: brassColorMap,
      displacementMap: brassDisplacementMap,
      displacementScale: 0.2,
      metalness: 0.98,
      roughness: 0.1,
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(x, TUBE_Y_POSITION - (TUBE_HEIGHT / 2) - 30, 0);
    scene.add(platform);

    // Coin
    const coinRadius = 65;
    const coinThickness = 16;
    const coinGeometry = new THREE.CylinderGeometry(coinRadius, coinRadius, coinThickness, 64);

    const headsTexture = textureLoader.load('/coins/plainh.png');
    const tailsTexture = textureLoader.load('/coins/plaint.png');

    headsTexture.minFilter = THREE.LinearFilter;
    headsTexture.magFilter = THREE.LinearFilter;
    headsTexture.anisotropy = webglRenderer.capabilities.getMaxAnisotropy();
    headsTexture.generateMipmaps = false;

    tailsTexture.minFilter = THREE.LinearFilter;
    tailsTexture.magFilter = THREE.LinearFilter;
    tailsTexture.anisotropy = webglRenderer.capabilities.getMaxAnisotropy();
    tailsTexture.generateMipmaps = false;

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

    const coinMaterials_array = [
      new THREE.MeshStandardMaterial({
        color: 0xFFD700,
        emissive: 0xFFD700,
        emissiveIntensity: 0.3,
        metalness: 0.8,
        roughness: 0.2,
        side: THREE.DoubleSide,
        transparent: false
      }),
      new THREE.ShaderMaterial({
        uniforms: { map: { value: headsTexture } },
        vertexShader: rawTextureShader.vertexShader,
        fragmentShader: rawTextureShader.fragmentShader,
        side: THREE.DoubleSide,
        depthWrite: true,
        depthTest: true,
        transparent: false
      }),
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

    const coin = new THREE.Mesh(coinGeometry, coinMaterials_array);
    coin.rotation.x = Math.PI / 2;
    coin.rotation.y = Math.PI / 2;
    coin.rotation.z = 0;
    coin.position.set(x, TUBE_Y_POSITION, 0);
    coin.visible = true;
    coin.frustumCulled = false;
    coin.renderOrder = 1;
    coin.layers.set(0);
    coin.matrixAutoUpdate = true;

    coin.material.forEach(mat => {
      if (mat.needsUpdate !== undefined) mat.needsUpdate = true;
    });

    scene.add(coin);

    // Coin shadow
    const shadowGeometry = new THREE.CircleGeometry(coinRadius * 1.5, 64);
    const shadowMaterial = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      uniforms: {
        centerColor: { value: new THREE.Color(0x0a0a2e) },
        edgeColor: { value: new THREE.Color(0x000000) },
        opacity: { value: 0.85 }
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
          float alpha = opacity * (1.0 - smoothstep(0.3, 0.5, dist));
          gl_FragColor = vec4(color, alpha);
        }
      `
    });

    const coinShadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    coinShadow.position.set(x, TUBE_Y_POSITION, -8);
    coinShadow.visible = false;
    scene.add(coinShadow);

    coins.push(coin);

    // Player card
    const cardElement = document.createElement('div');
    cardElement.className = 'player-card';

    let showButtons = false;
    if (!isServerSideMode) {
      showButtons = !player.isEmpty;
    }

    const emptySlotOverlay = player.isEmpty ? `
      <div class="empty-slot-overlay" style="
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 50, 0.9);
        border-radius: 16px;
        z-index: 10;
      "></div>
    ` : '';

    cardElement.innerHTML = `
      ${emptySlotOverlay}
      <div class="card-header">
        <img src="${player.avatar || '/images/default-avatar.png'}" class="player-avatar" alt="${player.name}" style="width: 80px; height: 100px;" />
        <div class="player-info">
          <div class="player-name">${player.name}</div>
          ${player.wins > 0 ? '<div class="wins-display" style="margin-top: 8px; justify-content: center; align-items: center;">WIN</div>' : ''}
        </div>
      </div>
      ${player.choice ? `
        <div class="choice-badge ${player.choice}" style="display: ${player.choice ? 'block' : 'none'};">
          ${player.choice.toUpperCase()}
        </div>
      ` : ''}
      <div class="choice-buttons" style="display: ${showButtons && !player.choice ? 'block' : 'none'};">
        <button class="choice-btn heads">HEADS</button>
        <button class="choice-btn tails">TAILS</button>
      </div>
      <div style="margin: 15px 0;">
        <div class="power-bar-container">
          <div class="zone-overlay">
            <div class="zone safe" style="left: 0%; width: 42%;"></div>
            <div class="zone good" style="left: 42%; width: 6%;"></div>
            <div class="zone perfect" style="left: 48%; width: 4%;"></div>
            <div class="zone good" style="left: 52%; width: 6%;"></div>
            <div class="zone safe" style="left: 58%; width: 42%;"></div>
          </div>
          <div class="power-fill"></div>
          <div class="power-text">POWER: <span class="power-value">0</span>%</div>
        </div>
      </div>
      <button class="action-btn" style="display: ${showButtons ? 'block' : 'none'};">CHARGE POWER</button>
    `;

    cardElement.style.pointerEvents = 'auto';

    // Choice button handlers
    const choiceButtons = cardElement.querySelectorAll('.choice-btn');
    choiceButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const choice = button.classList.contains('heads') ? 'heads' : 'tails';

        choiceButtons.forEach(btn => {
          btn.style.opacity = '0.5';
          btn.style.transform = 'scale(0.95)';
        });
        button.style.opacity = '1';
        button.style.transform = 'scale(1.1)';
        button.style.boxShadow = '0 0 25px rgba(255, 255, 255, 0.8)';

        players[i].choice = choice;
        console.log(`🎯 Local choice set for player ${i + 1}: ${choice}`);
        updateCoinRotationsFromPlayerChoicesFunc(tubes, players, coins);
        // Note: saveGameState should be called by the caller with proper arguments

        const choiceBadge = cardElement.querySelector('.choice-badge');
        const choiceButtonsContainer = cardElement.querySelector('.choice-buttons');
        if (choiceButtonsContainer && choiceBadge) {
          choiceButtonsContainer.style.display = 'none';
          choiceBadge.style.display = 'inline-block';
          choiceBadge.textContent = choice.toUpperCase();
          choiceBadge.className = `choice-badge ${choice}`;
        }

        updateCoinRotationsFromPlayerChoicesFunc(tubes, players, coins);

        if (isServerSideMode && socket && gameIdParam && walletParam) {
          socket.emit('physics_set_choice', {
            gameId: gameIdParam,
            address: walletParam,
            choice: choice
          });
          console.log(`🎯 Sent choice to server: ${choice}`);
        }

        updatePlayerCardButtons();
      });
    });

    // Power button handlers
    const flipButtons = cardElement.querySelectorAll('.action-btn');
    const powerButton = flipButtons[0];

    if (powerButton) {
      powerButton.style.pointerEvents = 'auto';

      let isCharging = false;

      powerButton.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        console.log(`🖱️ Power button mousedown for player ${i + 1}`);

        if (!players[i].choice) {
          showChoiceRequiredMessage(i);
          console.log(`❌ Player ${i + 1} must choose heads or tails first!`);
          return;
        }

        if (tubes[i].hasUsedPower) {
          console.log(`❌ Player ${i + 1} already used power this round`);
          return;
        }

        console.log(`⚡ Charging power for tube ${i + 1}`);
        isCharging = true;
        tubes[i].isFilling = true;
        tubes[i].power = 0;
        tubes[i].chargingStartTime = Date.now();

        playSound(powerChargeSound);

        if (isServerSideMode && socket && gameIdParam && walletParam) {
          socket.emit('physics_power_charging_start', {
            gameId: gameIdParam,
            address: walletParam,
            playerSlot: i,
            power: 0,
            isFilling: true
          });
          console.log(`📡 Broadcast: Player ${i + 1} started charging`);
        }
      });

      powerButton.addEventListener('mouseup', (e) => {
        e.stopPropagation();
        const finalPower = tubes[i].power;
        console.log(`⚡ Power released at ${finalPower.toFixed(0)}%`);
        isCharging = false;
        tubes[i].isFilling = false;

        stopSound(powerChargeSound);

        if (isServerSideMode && socket && gameIdParam && walletParam) {
          socket.emit('physics_power_charging_stop', {
            gameId: gameIdParam,
            address: walletParam,
            playerSlot: i,
            finalPower: finalPower
          });
          console.log(`📡 Broadcast: Player ${i + 1} stopped charging at ${finalPower}%`);
        }

        if (finalPower >= 5) {
          if (isServerSideMode && socket && gameIdParam && walletParam) {
            const playerChoice = players[i].choice;
            const releaseData = calculateReleaseAccuracy(finalPower);

            socket.emit('physics_flip_coin', {
              gameId: gameIdParam,
              address: walletParam,
              power: finalPower,
              accuracy: releaseData.accuracy,
              angle: 0
            });

            if (releaseData.zone) {
              showSweetSpotFeedback(releaseData.zone, releaseData.winChance);
            }

            console.log(`🪙 Sent flip request to server: power=${finalPower}, choice=${playerChoice}`);
          } else {
            shatterGlassFunc(i, finalPower);
            const playerChoice = players[i].choice;
            flipCoinWithPower(i, finalPower, playerChoice);
          }

          powerButton.disabled = true;
          powerButton.style.opacity = '0.5';
          powerButton.style.cursor = 'not-allowed';
          powerButton.style.background = '#cccccc';
          powerButton.style.color = '#666666';
          powerButton.style.borderColor = '#999999';
          tubes[i].hasUsedPower = true;
        }
      });

      powerButton.addEventListener('mouseleave', (e) => {
        if (isCharging) {
          const finalPower = tubes[i].power;
          console.log(`⚡ Power released at ${finalPower.toFixed(0)}%`);

          stopSound(powerChargeSound);

          if (isServerSideMode && socket && gameIdParam && walletParam) {
            socket.emit('physics_power_charging_stop', {
              gameId: gameIdParam,
              address: walletParam,
              playerSlot: i,
              finalPower: finalPower
            });
            console.log(`📡 Broadcast: Player ${i + 1} stopped charging (mouseleave) at ${finalPower}%`);
          }

          if (finalPower >= 5) {
            if (isServerSideMode && socket && gameIdParam && walletParam) {
              const playerChoice = players[i].choice;
              const releaseData = calculateReleaseAccuracy(finalPower);

              socket.emit('physics_flip_coin', {
                gameId: gameIdParam,
                address: walletParam,
                power: finalPower,
                accuracy: releaseData.accuracy,
                angle: 0
              });

              if (releaseData.zone) {
                showSweetSpotFeedback(releaseData.zone, releaseData.winChance);
              }

              console.log(`🪙 Sent flip request to server (mouseleave): power=${finalPower}, choice=${playerChoice}`);
            } else {
              shatterGlassFunc(i, finalPower);
              const playerChoice = players[i].choice;
              flipCoinWithPower(i, finalPower, playerChoice);
            }

            powerButton.disabled = true;
            powerButton.style.opacity = '0.5';
            powerButton.style.cursor = 'not-allowed';
            powerButton.style.background = '#cccccc';
            powerButton.style.color = '#666666';
            powerButton.style.borderColor = '#999999';
            tubes[i].hasUsedPower = true;
          }
        }
        isCharging = false;
        tubes[i].isFilling = false;
      });
    }

    // CSS3D object for card
    const cssObject = new CSS3DObject(cardElement);
    cssObject.position.set(x, TUBE_Y_POSITION - (TUBE_HEIGHT / 2) - 140, 0);
    cssObject.scale.set(0.6, 0.45, 0.6);
    scene.add(cssObject);

    // Apply default coin textures
    const defaultCoin = coinOptions[0];
    const defaultMaterial = coinMaterials[0];

    textureLoader.load(defaultCoin.headsImage, (headsTex) => {
      headsTex.minFilter = THREE.LinearFilter;
      headsTex.magFilter = THREE.LinearFilter;
      headsTex.anisotropy = webglRenderer.capabilities.getMaxAnisotropy();
      headsTex.generateMipmaps = false;

      textureLoader.load(defaultCoin.tailsImage, (tailsTex) => {
        tailsTex.minFilter = THREE.LinearFilter;
        tailsTex.magFilter = THREE.LinearFilter;
        tailsTex.anisotropy = webglRenderer.capabilities.getMaxAnisotropy();
        tailsTex.generateMipmaps = false;

        coin.material[1].uniforms.map.value = headsTex;
        coin.material[1].needsUpdate = true;
        coin.material[2].uniforms.map.value = tailsTex;
        coin.material[2].needsUpdate = true;
        coin.visible = true;

        console.log(`✅ Applied default ${defaultCoin.name} textures to ${player.name}'s coin`);
      });
    });

    const edgeColor = new THREE.Color(defaultMaterial.edgeColor);
    coin.material[0].color.copy(edgeColor);
    coin.material[0].emissive.copy(edgeColor);
    coin.material[0].emissiveIntensity = 0.3;
    coin.material[0].needsUpdate = true;

    console.log(`✅ Applied default ${defaultCoin.name} with ${defaultMaterial.name} material to ${player.name}'s coin`);

    // Push tube object
    tubes.push({
      tube, backing, topRim, bottomRim, liquid, liquidLight, spotlight, platform, coin,
      coinShadow,
      liquidParticles,
      liquidParticleMeshes,
      glassBody,
      cardElement,
      powerButton,
      particleRadius,
      liquidBaseY: liquidY,
      liquidBaseHeight: liquidHeight,
      isFilling: false,
      power: 0,
      isShattered: false,
      animationState: 'idle',
      animationStartTime: null,
      animationEndTime: null,
      flipId: null,
      landingId: null,
      lastStableRotation: null,
      isFlipping: false,
      isLanding: false,
      flipStartTime: null,
      currentFlipId: null,
      currentLandingId: null,
      glassShards: [],
      winLight: null,
      loseLight: null,
      resultBox: null,
      foamIntensity: 0,
      hasUsedPower: false,
      selectedCoin: defaultCoin,
      selectedMaterial: defaultMaterial
    });
  }

  // Preload assets
  console.log('🔥 PRE-LOADING ALL ASSETS during initialization...');

  const loadingIndicator = document.createElement('div');
  loadingIndicator.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    color: #00ffff;
    padding: 30px 50px;
    border-radius: 15px;
    border: 2px solid #00ffff;
    font-family: 'Orbitron', sans-serif;
    font-size: 18px;
    z-index: 99999;
    text-align: center;
  `;
  loadingIndicator.innerHTML = `
    <div style="font-size: 24px; margin-bottom: 10px;">⚡ LOADING GAME</div>
    <div style="font-size: 14px; opacity: 0.8;">Preloading materials...</div>
  `;
  document.body.appendChild(loadingIndicator);

  const preloadMaterials = [];
  const pearlColors = [0x00ff00, 0x00ddff, 0xff0088, 0xffff00];
  pearlColors.forEach(color => {
    const material = new THREE.MeshPhysicalMaterial({
      color: color,
      metalness: 0.0,
      roughness: 0.3,
      transparent: true,
      opacity: 0.7,
      emissive: color,
      emissiveIntensity: 0.2,
      toneMapped: false,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05
    });
    preloadMaterials.push(material);
  });

  const glassShardMaterial = new THREE.MeshStandardMaterial({
    color: 0xe0e0e0,
    metalness: 0.95,
    roughness: 0.1,
    emissive: 0xc0c0c0,
    emissiveIntensity: 0.4,
    side: THREE.DoubleSide
  });
  preloadMaterials.push(glassShardMaterial);

  const resultMaterials = [
    new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.8 }),
    new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.8 })
  ];
  preloadMaterials.push(...resultMaterials);

  const dummyGeometry = new THREE.BoxGeometry(1, 1, 1);
  const dummyMeshes = [];

  preloadMaterials.forEach((material, i) => {
    const mesh = new THREE.Mesh(dummyGeometry, material);
    mesh.position.set(-10000 - i * 10, -10000, -10000);
    scene.add(mesh);
    dummyMeshes.push(mesh);
  });

  for (let i = 0; i < 3; i++) {
    webglRenderer.render(scene, camera);
  }

  console.log(`✅ Pre-compiled ${preloadMaterials.length} materials`);

  tubes.forEach((tube, i) => {
    tube.power = 1;
    tube.foamIntensity = 0.01;
    updatePearlColors(tube, 0.01, i);
  });

  webglRenderer.render(scene, camera);

  setTimeout(() => {
    dummyMeshes.forEach(mesh => {
      scene.remove(mesh);
    });
    dummyGeometry.dispose();

    tubes.forEach((tube, i) => {
      tube.power = 0;
      tube.foamIntensity = 0;
      updatePearlColors(tube, 0, i);
    });

    loadingIndicator.remove();
    console.log('✅ ALL ASSETS PRELOADED - Game ready!');
  }, 100);

  console.log('🎮 Game started - coin textures already applied during tube creation');

  return { tubes, coins };
}

