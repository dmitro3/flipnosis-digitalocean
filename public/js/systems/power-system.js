/**
 * Power System
 * Handles power charging, accuracy calculations, and sweet spots
 */

import * as THREE from 'three';
import { updatePearlColors } from './pearl-physics.js';

/**
 * Update power charging visual from server
 */
export function updatePowerChargingVisual(data, tubes, updatePearlColorsFunc) {
  if (data.playerSlot >= 0 && data.playerSlot < 4) {
    const tube = tubes[data.playerSlot];
    if (!tube) return;
    
    tube.power = data.power;
    tube.powerLevel = data.powerLevel || Math.min(5, Math.max(1, Math.ceil(data.power / 20)));
    tube.isFilling = data.isFilling;
    
    const powerPercent = tube.power / 100;
    tube.foamIntensity = powerPercent;
    
    console.log(`⚡ Updated power visual for player ${data.playerSlot + 1}: ${data.power}% (level ${tube.powerLevel}, foamIntensity: ${tube.foamIntensity}, isFilling: ${tube.isFilling})`);
    
    updatePearlColorsFunc(tube, powerPercent, data.playerSlot);
    
    if (tube.liquidParticleMeshes && tube.liquidParticleMeshes.length > 0) {
      const visibleCount = tube.liquidParticleMeshes.filter(mesh => mesh.visible).length;
      console.log(`🔍 Tube ${data.playerSlot + 1} has ${tube.liquidParticleMeshes.length} pearls, ${visibleCount} visible`);
    }
    
    if (tube.isFilling && tube.liquidParticleMeshes) {
      tube.liquidParticleMeshes.forEach(mesh => {
        mesh.visible = true;
      });
      console.log(`🫧 Forced pearl visibility for tube ${data.playerSlot + 1}`);
    }
  }
}

/**
 * Calculate release accuracy based on power level
 */
export function calculateReleaseAccuracy(power) {
  const distanceFromCenter = Math.abs(power - 50);
  
  let accuracy, zone, winChance;
  
  if (distanceFromCenter <= 2) {
    accuracy = 'perfect';
    zone = 'SWEET SPOT!';
    winChance = 0.55;
  } else if (distanceFromCenter <= 8) {
    accuracy = 'good';
    zone = 'Nice Timing!';
    winChance = 0.525;
  } else {
    accuracy = 'normal';
    zone = null;
    winChance = 0.50;
  }
  
  console.log(`🎯 Release accuracy: ${accuracy} at ${power}% power (${(winChance * 100).toFixed(1)}% win chance)`);
  
  return { accuracy, zone, winChance };
}

/**
 * Show sweet spot feedback
 */
export function showSweetSpotFeedback(zone, winChance) {
  const feedback = document.createElement('div');
  feedback.className = 'sweet-spot-feedback';
  
  const bonusPercent = ((winChance - 0.5) * 100).toFixed(1);
  
  feedback.innerHTML = `
    <div class="sweet-spot-text">${zone}</div>
    <div class="win-chance">+${bonusPercent}% Win Chance!</div>
  `;
  
  document.body.appendChild(feedback);
  
  setTimeout(() => feedback.classList.add('show'), 10);
  
  setTimeout(() => {
    feedback.classList.remove('show');
    setTimeout(() => feedback.remove(), 300);
  }, 2000);
}

/**
 * Show perfect timing effect
 */
export function showPerfectTimingEffect(coin) {
  const ringGeometry = new THREE.RingGeometry(35, 45, 32);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xFFD700,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.copy(coin.rotation);
  ring.position.copy(coin.position);
  ring.position.y += 5;
  
  coin.parent.add(ring);
  
  let scale = 0.5;
  const animateRing = () => {
    scale += 0.05;
    ring.scale.set(scale, scale, scale);
    ringMaterial.opacity = Math.max(0, 0.8 - (scale - 0.5) * 0.1);
    
    if (scale < 2) {
      requestAnimationFrame(animateRing);
    } else {
      coin.parent.remove(ring);
      ringGeometry.dispose();
      ringMaterial.dispose();
    }
  };
  
  animateRing();
}

