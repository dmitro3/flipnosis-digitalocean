/**
 * Pearl Physics System
 * Handles pearl/particle physics simulation and color updates
 */

import * as THREE from 'three';

/**
 * Update pearl colors based on power level
 */
export function updatePearlColors(tube, powerPercent, tubeIndex) {
  const darkPearl = new THREE.Color(0x1a1a1a); // Dark grey (neutral start)
  
  const neonColors = [
    new THREE.Color(0x00ff00), // Tube 1: NEON GREEN
    new THREE.Color(0x00ddff), // Tube 2: NEON BLUE
    new THREE.Color(0xff0088), // Tube 3: NEON PINK
    new THREE.Color(0xffff00)  // Tube 4: NEON YELLOW
  ];
  
  const neonColor = neonColors[tubeIndex] || neonColors[0];
  const currentColor = darkPearl.clone().lerp(neonColor, powerPercent);
  
  tube.liquidParticleMeshes.forEach(particleMesh => {
    particleMesh.material.color.copy(currentColor);
    particleMesh.material.emissive.copy(currentColor);
    particleMesh.material.emissiveIntensity = 0.2 + (powerPercent * 25.0); // 0.2 to 25.2 - Perfect with bloom!
  });
  
  tube.liquidLight.color.copy(currentColor);
  tube.liquidLight.intensity = 0.3 + (powerPercent * 15.0); // 0.3 to 15.3 - MEGA INTENSE!
}

/**
 * Update pearl physics simulation
 */
export function updatePearlPhysics(tube, powerPercent, tubeIndex, frameCount) {
  const spinForce = powerPercent * 1200; // Orbital force
  const buoyancyForce = powerPercent * 800; // Upward float force
  
  tube.liquidParticles.forEach((particleBody, idx) => {
    particleBody.force.y += buoyancyForce;
    
    const dx = particleBody.position.x - tube.tube.position.x;
    const dz = particleBody.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance > 1) {
      const angle = Math.atan2(dz, dx);
      const tangentAngle = angle + Math.PI / 2; // 90 degrees to create orbit
      
      const orbitForceX = Math.cos(tangentAngle) * spinForce * (1 + idx * 0.05);
      const orbitForceZ = Math.sin(tangentAngle) * spinForce * (1 + idx * 0.05);
      
      particleBody.force.x += orbitForceX;
      particleBody.force.z += orbitForceZ;
    }
    
    const chaos = Math.sin(frameCount * 0.2 + idx) * 200 * powerPercent;
    particleBody.force.x += chaos;
    particleBody.force.z += Math.cos(frameCount * 0.2 + idx * 1.3) * 200 * powerPercent;
  });
}

