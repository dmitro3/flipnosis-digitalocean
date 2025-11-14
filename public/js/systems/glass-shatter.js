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
  
  // Pop + Fade animation instead of glass shards
  // Make tube visible again for animation
  tube.tube.visible = true;
  tube.backing.visible = true;
  tube.topRim.visible = true;
  tube.bottomRim.visible = true;

  // Set up materials to be transparent for animation
  tube.tube.material.transparent = true;
  tube.backing.material.transparent = true;
  tube.topRim.material.transparent = true;
  tube.bottomRim.material.transparent = true;

  // Store original emissive values
  const originalEmissive = {
    tube: tube.tube.material.emissive ? tube.tube.material.emissive.clone() : new THREE.Color(0x000000),
    backing: tube.backing.material.emissive ? tube.backing.material.emissive.clone() : new THREE.Color(0x000000),
    topRim: tube.topRim.material.emissive ? tube.topRim.material.emissive.clone() : new THREE.Color(0x000000),
    bottomRim: tube.bottomRim.material.emissive ? tube.bottomRim.material.emissive.clone() : new THREE.Color(0x000000)
  };

  // Initialize pop animation state
  tube.popAnimation = {
    time: 0,
    duration: 0.2, // 200ms total animation
    originalScale: { x: tube.tube.scale.x, y: tube.tube.scale.y, z: tube.tube.scale.z },
    originalEmissive: originalEmissive
  };
  
  // Explode liquid particles (pearls) - INSTANT, no delay
  if (tube.liquidParticles) {
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
  }

  console.log(`💥 Glass popped! ${tube.liquidParticles.length} liquid particles at ${powerLevel.toFixed(0)}% power`);
}

/**
 * Update pop/fade animations in the render loop
 */
export function updateGlassShards(tubes, deltaTime) {
  tubes.forEach(tube => {
    // Animate pop + fade effect
    if (tube.popAnimation) {
      tube.popAnimation.time += deltaTime;
      const progress = Math.min(tube.popAnimation.time / tube.popAnimation.duration, 1);

      // Easing function for smooth animation (easeOutCubic)
      const ease = 1 - Math.pow(1 - progress, 3);

      // Scale animation: 1.0 → 1.15 → 0
      // First 30% of animation: scale up to 1.15
      // Remaining 70%: scale down to 0
      let scale;
      if (progress < 0.3) {
        const scaleProgress = progress / 0.3;
        scale = 1.0 + (scaleProgress * 0.15);
      } else {
        const scaleProgress = (progress - 0.3) / 0.7;
        scale = 1.15 * (1 - scaleProgress);
      }

      tube.tube.scale.set(scale, scale, scale);
      tube.backing.scale.set(scale, scale, scale);
      tube.topRim.scale.set(scale, scale, scale);
      tube.bottomRim.scale.set(scale, scale, scale);

      // Opacity fade: 1.0 → 0
      const opacity = 1 - ease;
      tube.tube.material.opacity = opacity;
      tube.backing.material.opacity = opacity;
      tube.topRim.material.opacity = opacity;
      tube.bottomRim.material.opacity = opacity;

      // Flash effect: bright white flash at start, then fade
      const flashIntensity = Math.max(0, 1 - (progress * 3)); // Fast fade (33% of animation)
      const flashColor = new THREE.Color(1, 1, 1); // White flash

      if (tube.tube.material.emissive) {
        tube.tube.material.emissive.lerp(flashColor, flashIntensity);
        tube.tube.material.emissiveIntensity = flashIntensity * 2;
      }
      if (tube.backing.material.emissive) {
        tube.backing.material.emissive.lerp(flashColor, flashIntensity);
        tube.backing.material.emissiveIntensity = flashIntensity * 2;
      }
      if (tube.topRim.material.emissive) {
        tube.topRim.material.emissive.lerp(flashColor, flashIntensity);
        tube.topRim.material.emissiveIntensity = flashIntensity * 2;
      }
      if (tube.bottomRim.material.emissive) {
        tube.bottomRim.material.emissive.lerp(flashColor, flashIntensity);
        tube.bottomRim.material.emissiveIntensity = flashIntensity * 2;
      }

      // Animation complete - hide everything
      if (progress >= 1) {
        tube.tube.visible = false;
        tube.backing.visible = false;
        tube.topRim.visible = false;
        tube.bottomRim.visible = false;

        // Reset scale
        tube.tube.scale.set(
          tube.popAnimation.originalScale.x,
          tube.popAnimation.originalScale.y,
          tube.popAnimation.originalScale.z
        );

        // Clean up animation state
        delete tube.popAnimation;
      }
    }
  });
}

