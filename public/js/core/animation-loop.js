/**
 * Animation Loop
 * Main render loop handling physics, pearls, coins, glass shards, and bloom rendering
 */

import * as THREE from 'three';
import { updatePearlColors, updatePearlPhysics } from '../systems/pearl-physics.js';
import { updateGlassShards } from '../systems/glass-shatter.js';
import { TUBE_Y_POSITION, TIME_STEP } from '../config.js';

/**
 * Start the main animation loop
 */
export function startAnimationLoop(dependencies) {
  const {
    scene,
    camera,
    webglRenderer,
    cssRenderer,
    bloomComposer,
    physicsWorld,
    tubes,
    coins,
    socket,
    gameIdParam,
    walletParam,
    playerSlot,
    isServerSideMode
  } = dependencies;
  
  let frameCount = 0;
  const timeStep = TIME_STEP;
  
  function animate() {
    frameCount++;
    
    physicsWorld.step(timeStep);
    
    // Update tubes (power charging, pearls)
    tubes.forEach((tube, i) => {
      const offset = i * 0.4;
      
      if (tube.isFilling && !tube.isShattered) {
        tube.power = Math.min(tube.power + 0.6, 100);
        const powerPercent = tube.power / 100;
        
        tube.foamIntensity = powerPercent;
        
        const powerLevel = Math.min(5, Math.max(1, Math.ceil(tube.power / 20)));
        
        if (isServerSideMode && socket && gameIdParam && walletParam && playerSlot === i) {
          if (frameCount % 5 === 0) {
            socket.emit('physics_power_charging', {
              gameId: gameIdParam,
              address: walletParam,
              power: tube.power,
              powerLevel: powerLevel,
              playerSlot: i,
              isFilling: tube.isFilling
            });
          }
        }
        
        if (tube.cardElement) {
          const powerFill = tube.cardElement.querySelector('.power-fill');
          const powerValue = tube.cardElement.querySelector('.power-value');
          if (powerFill) powerFill.style.width = `${tube.power}%`;
          if (powerValue) powerValue.textContent = tube.power.toFixed(0);
        }
        
        updatePearlColors(tube, powerPercent, i);
      }
      
      if ((tube.isFilling || tube.foamIntensity > 0) && !tube.isShattered) {
        updatePearlPhysics(tube, tube.foamIntensity, i, frameCount);
      }
      
      // Sync pearl meshes with physics bodies
      tube.liquidParticles.forEach((particleBody, idx) => {
        tube.liquidParticleMeshes[idx].position.copy(particleBody.position);
        tube.liquidParticleMeshes[idx].quaternion.copy(particleBody.quaternion);
      });
      
      if (tube.foamIntensity > 0) {
        const lightPulse = Math.sin(frameCount * 0.15 + offset) * 0.5;
        tube.liquidLight.intensity = tube.liquidLight.intensity + lightPulse * tube.foamIntensity;
      }
    });
    
    // Update coins
    coins.forEach((coin, i) => {
      const tube = tubes[i];
      
      coin.visible = true;
      
      const isAnimating = tube.animationState !== 'idle';
      
      // Skip ALL coin updates during landing - let smoothLandCoin have full control
      if (tube.animationState === 'landing') {
        return; // Exit early - landing animation controls everything
      }
      
      if (isAnimating) {
        if (tube.animationState === 'flipping' && !tube.isFilling) {
          // During flip, maintain centered position
          const tubeX = tube.tube.position.x;
          coin.position.x = tubeX;
          coin.position.y = TUBE_Y_POSITION;
          coin.position.z = 0;
        }
      } else if (tube.isFilling && !tube.isShattered) {
        // Power charging vibration
        const vibIntensity = (tube.power / 100) * 8;
        const vibSpeed = (tube.power / 100) * 20;
        
        const tubeX = tube.tube.position.x;
        coin.position.x = tubeX + Math.sin(frameCount * vibSpeed) * vibIntensity;
        coin.position.y = TUBE_Y_POSITION + Math.cos(frameCount * vibSpeed * 1.3) * vibIntensity;
        coin.position.z = Math.sin(frameCount * vibSpeed * 0.7) * vibIntensity * 0.5;
        
        coin.rotation.z = Math.sin(frameCount * vibSpeed * 0.5) * (vibIntensity / 50);
      } else {
        // Truly idle - maintain stable position
        const tubeX = tube.tube.position.x;
        coin.position.x = tubeX;
        coin.position.y = TUBE_Y_POSITION;
        coin.position.z = 0;
        
        if (tube.lastStableRotation) {
          coin.rotation.x += (tube.lastStableRotation.x - coin.rotation.x) * 0.05;
          coin.rotation.y += (tube.lastStableRotation.y - coin.rotation.y) * 0.05;
          coin.rotation.z += (tube.lastStableRotation.z - coin.rotation.z) * 0.05;
        }
      }
    });
    
    // Update glass shards
    updateGlassShards(tubes, timeStep);
    
    // Render layer 0 (main scene)
    const originalMask = camera.layers.mask;
    camera.layers.disableAll();
    camera.layers.enable(0);
    
    webglRenderer.autoClear = true;
    webglRenderer.clear(true, true, true);
    webglRenderer.render(scene, camera);
    
    // Render layer 1 (pearls with bloom)
    camera.layers.disableAll();
    camera.layers.enable(1);
    
    bloomComposer.render();
    
    webglRenderer.autoClear = false;
    
    const bloomTexture = bloomComposer.readBuffer.texture;
    
    // Composite bloom
    if (!window.bloomQuadMesh) {
      const quadGeometry = new THREE.PlaneGeometry(2, 2);
      const quadMaterial = new THREE.MeshBasicMaterial({
        map: bloomTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
        toneMapped: false
      });
      const quadMesh = new THREE.Mesh(quadGeometry, quadMaterial);
      
      const quadScene = new THREE.Scene();
      quadScene.add(quadMesh);
      
      const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      
      window.bloomQuadMesh = quadMesh;
      window.bloomQuadScene = quadScene;
      window.bloomQuadCamera = quadCamera;
    }
    
    if (window.bloomQuadMesh && bloomTexture) {
      window.bloomQuadMesh.material.map = bloomTexture;
      window.bloomQuadMesh.material.needsUpdate = true;
      
      if (bloomTexture.needsUpdate !== undefined) {
        bloomTexture.needsUpdate = true;
      }
    }
    
    if (window.bloomQuadScene && window.bloomQuadCamera && bloomTexture) {
      webglRenderer.render(window.bloomQuadScene, window.bloomQuadCamera);
    } else {
      camera.layers.disableAll();
      camera.layers.enable(1);
      webglRenderer.render(scene, camera);
      camera.layers.mask = originalMask;
    }
    
    webglRenderer.autoClear = true;
    camera.layers.mask = originalMask;
    
    // Render CSS3D (UI elements)
    cssRenderer.render(scene, camera);
    
    requestAnimationFrame(animate);
  }
  
  animate();
  
  // Handle window resize
  window.addEventListener('resize', () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    
    webglRenderer.setSize(newWidth, newHeight);
    cssRenderer.setSize(newWidth, newHeight);
    bloomComposer.setSize(newWidth, newHeight);
    
    console.log(`📐 Resized to ${newWidth}x${newHeight}`);
  });
  
  return { frameCount };
}

