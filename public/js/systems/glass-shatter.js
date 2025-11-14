/**
 * Flash Effect System
 * Handles colorful flash when tube disappears and particles explode
 */

import * as THREE from 'three';
import { playSound, stopSound, glassBreakSound, powerChargeSound } from '../utils/audio.js';
import { TUBE_RADIUS, TUBE_HEIGHT, TUBE_Y_POSITION } from '../config.js';

/**
 * Remove glass tube and trigger particle explosion
 */
export function shatterGlass(tubeIndex, powerLevel, tubes, scene, physicsWorld) {
  const tube = tubes[tubeIndex];
  if (!tube || tube.isShattered) return;

  const powerPercent = powerLevel / 100;
  console.log(`✨ Removing tube ${tubeIndex + 1} at ${powerLevel.toFixed(0)}% power`);

  stopSound(powerChargeSound);
  playSound(glassBreakSound);

  tube.isShattered = true;

  // Hide glass components immediately - no animation, no flash
  tube.tube.visible = false;
  tube.backing.visible = false;
  tube.topRim.visible = false;
  tube.bottomRim.visible = false;
  tube.liquid.visible = false;
  tube.coinShadow.visible = true;

  physicsWorld.removeBody(tube.glassBody);

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

  console.log(`✨ Tube removed! ${tube.liquidParticles.length} pearls exploded at ${powerLevel.toFixed(0)}% power`);
}

/**
 * Update animations in the render loop (no-op now, kept for compatibility)
 */
export function updateGlassShards(tubes, deltaTime) {
  // No animations needed - everything is instant now
}

