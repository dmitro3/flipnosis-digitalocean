/**
 * Glass Shattering System
 * Handles glass tube shattering effects and shard physics
 */

import * as THREE from 'three';
import { playSound, stopSound, glassBreakSound, powerChargeSound } from '../utils/audio.js';
import { TUBE_RADIUS, TUBE_HEIGHT, TUBE_Y_POSITION } from '../config.js';

/**
 * Shatter a glass tube with physics-based shards
 */
export function shatterGlass(tubeIndex, powerLevel, tubes, scene, physicsWorld) {
  const tube = tubes[tubeIndex];
  if (!tube || tube.isShattered) return;
  
  const powerPercent = powerLevel / 100;
  console.log(`💥 Shattering glass for tube ${tubeIndex + 1} at ${powerLevel.toFixed(0)}% power`);
  
  stopSound(powerChargeSound);
  playSound(glassBreakSound);
  
  tube.isShattered = true;
  
  // Hide glass components
  tube.tube.visible = false;
  tube.backing.visible = false;
  tube.topRim.visible = false;
  tube.bottomRim.visible = false;
  tube.liquid.visible = false;
  tube.coinShadow.visible = true;
  
  physicsWorld.removeBody(tube.glassBody);
  
  // ✅ PERFORMANCE FIX: Reduce shard count to prevent stutter
  // Old: 20-80 shards | New: 12-30 shards (60% reduction)
  const shardCount = Math.floor(12 + (powerPercent * 18));
  const tubeY = TUBE_Y_POSITION;
  
  // Initialize shards array if needed
  if (!tube.glassShards) {
    tube.glassShards = [];
  }
  
  // ✅ PERFORMANCE FIX: Create shared material to reuse (saves memory & rendering)
  const sharedMaterial = new THREE.MeshStandardMaterial({
    color: 0xe0e0e0,
    metalness: 0.95,
    roughness: 0.1,
    emissive: 0xc0c0c0,
    emissiveIntensity: 0.4,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6
  });
  
  // ✅ PERFORMANCE FIX: Batch shard creation
  const shardsToAdd = [];
  
  for (let s = 0; s < shardCount; s++) {
    const size = Math.random() * 12 + 5;
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0, 0, 0,
      size, 0, 0,
      size * 0.5, size, 0
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    
    // ✅ REUSE shared material instead of creating new one each time
    const shard = new THREE.Mesh(geometry, sharedMaterial);
    
    const angle = (s / shardCount) * Math.PI * 2;
    const heightPos = (Math.random() - 0.5) * TUBE_HEIGHT;
    shard.position.set(
      tube.tube.position.x + Math.cos(angle) * TUBE_RADIUS,
      tubeY + heightPos,
      Math.sin(angle) * TUBE_RADIUS
    );
    
    shard.rotation.set(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );
    
    const baseSpeed = 2 + (powerPercent * 12);
    const velocity = {
      x: Math.cos(angle) * (Math.random() * baseSpeed + baseSpeed * 0.5),
      y: Math.random() * 3 - 1.5,
      z: Math.sin(angle) * (Math.random() * baseSpeed + baseSpeed * 0.5)
    };
    
    const rotVelocity = {
      x: (Math.random() - 0.5) * 0.3,
      y: (Math.random() - 0.5) * 0.3,
      z: (Math.random() - 0.5) * 0.3
    };
    
    shardsToAdd.push({
      mesh: shard,
      velocity,
      rotVelocity,
      lifetime: 0
    });
  }
  
  // ✅ PERFORMANCE FIX: Add all shards to scene in one batch
  shardsToAdd.forEach(shard => {
    scene.add(shard.mesh);
    tube.glassShards.push(shard);
  });
  
  // Explode liquid particles (pearls)
  // ✅ PERFORMANCE FIX: Use requestAnimationFrame to avoid blocking
  if (tube.liquidParticles) {
    requestAnimationFrame(() => {
      tube.liquidParticles.forEach((particleBody, idx) => {
        const dx = particleBody.position.x - tube.tube.position.x;
        const dz = particleBody.position.z - tube.tube.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz) || 1;
        
        const baseForce = 2000 + (powerPercent * 16000);
        const explosionForce = baseForce + Math.random() * (baseForce * 0.3);
        
        particleBody.velocity.set(
          (dx / distance) * explosionForce,
          Math.random() * 800 - 400,
          (dz / distance) * explosionForce
        );
        
        const spinForce = 15 * powerPercent;
        particleBody.angularVelocity.set(
          Math.random() * spinForce * 2 - spinForce,
          Math.random() * spinForce * 2 - spinForce,
          Math.random() * spinForce * 2 - spinForce
        );
      });
    });
  }
  
  console.log(`💥 Glass shattered! ${shardCount} shards + ${tube.liquidParticles.length} liquid particles at ${powerLevel.toFixed(0)}% power`);
}

/**
 * Update glass shard animations in the render loop
 */
export function updateGlassShards(tubes, deltaTime) {
  tubes.forEach(tube => {
    if (tube.glassShards && tube.glassShards.length > 0) {
      tube.glassShards = tube.glassShards.filter(shard => {
        shard.lifetime += deltaTime;
        
        // Update position
        shard.mesh.position.x += shard.velocity.x * deltaTime;
        shard.mesh.position.y += shard.velocity.y * deltaTime;
        shard.mesh.position.z += shard.velocity.z * deltaTime;
        
        // Update rotation
        shard.mesh.rotation.x += shard.rotVelocity.x * deltaTime;
        shard.mesh.rotation.y += shard.rotVelocity.y * deltaTime;
        shard.mesh.rotation.z += shard.rotVelocity.z * deltaTime;
        
        // Apply gravity
        shard.velocity.y -= 0.3 * deltaTime * 60; // Gravity (normalized for 60fps)
        
        // Fade out
        shard.mesh.material.opacity = Math.max(0, 0.6 - (shard.lifetime / 2) * 0.6);
        
        // Remove after 2 seconds
        if (shard.lifetime > 2) {
          shard.mesh.visible = false;
          // Clean up
          shard.mesh.geometry.dispose();
          shard.mesh.material.dispose();
          return false; // Filter out
        }
        
        return true; // Keep shard
      });
    }
  });
}

