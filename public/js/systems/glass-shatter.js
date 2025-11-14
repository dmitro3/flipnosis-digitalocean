/**
 * Flash Effect System
 * Handles colorful flash when tube disappears and particles explode
 */

import * as THREE from 'three';
import { playSound, stopSound, glassBreakSound, powerChargeSound } from '../utils/audio.js';
import { TUBE_RADIUS, TUBE_HEIGHT, TUBE_Y_POSITION } from '../config.js';

/**
 * Remove glass tube and trigger colorful flash + particle explosion
 */
export function shatterGlass(tubeIndex, powerLevel, tubes, scene, physicsWorld) {
  const tube = tubes[tubeIndex];
  if (!tube || tube.isShattered) return;
  
  const powerPercent = powerLevel / 100;
  console.log(`✨ Triggering flash for tube ${tubeIndex + 1} at ${powerLevel.toFixed(0)}% power`);
  
  stopSound(powerChargeSound);
  playSound(glassBreakSound);
  
  tube.isShattered = true;

  // Hide glass components immediately - no animation
  tube.tube.visible = false;
  tube.backing.visible = false;
  tube.topRim.visible = false;
  tube.bottomRim.visible = false;
  tube.liquid.visible = false;
  tube.coinShadow.visible = true;

  physicsWorld.removeBody(tube.glassBody);

  // Create big colorful flash effect
  const flashGeometry = new THREE.SphereGeometry(TUBE_RADIUS * 3, 16, 16);
  const flashMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00, // Bright yellow/gold
    transparent: true,
    opacity: 1.0,
    side: THREE.DoubleSide
  });

  const flash = new THREE.Mesh(flashGeometry, flashMaterial);
  flash.position.set(
    tube.tube.position.x,
    TUBE_Y_POSITION,
    tube.tube.position.z
  );

  scene.add(flash);

  // Initialize flash animation
  tube.flashAnimation = {
    mesh: flash,
    time: 0,
    duration: 0.15, // 150ms - quick and snappy
    initialScale: 0.5,
    maxScale: 2.5
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

  console.log(`✨ Flash burst! ${tube.liquidParticles.length} liquid particles at ${powerLevel.toFixed(0)}% power`);
}

/**
 * Update flash animations in the render loop
 */
export function updateGlassShards(tubes, deltaTime) {
  tubes.forEach(tube => {
    // Animate flash effect
    if (tube.flashAnimation) {
      tube.flashAnimation.time += deltaTime;
      const progress = Math.min(tube.flashAnimation.time / tube.flashAnimation.duration, 1);

      // Easing function for explosive growth (easeOutQuad)
      const ease = 1 - Math.pow(1 - progress, 2);

      // Scale: starts small, expands rapidly
      const scale = tube.flashAnimation.initialScale +
                   (ease * (tube.flashAnimation.maxScale - tube.flashAnimation.initialScale));
      tube.flashAnimation.mesh.scale.set(scale, scale, scale);

      // Color cycle through rainbow (for colorful effect)
      const hue = (progress * 0.3) % 1; // Cycle through 30% of hue spectrum (yellow->orange->red)
      tube.flashAnimation.mesh.material.color.setHSL(hue * 0.15 + 0.15, 1.0, 0.5); // Start at yellow-gold

      // Opacity fade: 1.0 → 0 (fast fade)
      const opacity = Math.pow(1 - progress, 2); // Quadratic fade
      tube.flashAnimation.mesh.material.opacity = opacity;

      // Animation complete - remove flash
      if (progress >= 1) {
        scene.remove(tube.flashAnimation.mesh);
        tube.flashAnimation.mesh.geometry.dispose();
        tube.flashAnimation.mesh.material.dispose();
        delete tube.flashAnimation;
      }
    }
  });
}

