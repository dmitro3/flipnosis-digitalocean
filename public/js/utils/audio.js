/**
 * Audio Management
 * Handles all sound playback and muting
 */

let isMuted = false;

const glassBreakSound = new Audio('/Sound/coin-flip-88793.mp3');
glassBreakSound.volume = 0.8;

const powerChargeSound = new Audio('/Sound/powerclipped.mp3');
powerChargeSound.volume = 0.6;
powerChargeSound.loop = true;

export function playSound(audio) {
  if (!isMuted && audio) {
    audio.currentTime = 0;
    audio.play().catch(err => console.log('Audio play prevented:', err));
  }
}

export function stopSound(audio) {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
}

export function toggleMute() {
  isMuted = !isMuted;
  console.log(`🔊 Sound ${isMuted ? 'MUTED' : 'UNMUTED'}`);
  
  glassBreakSound.muted = isMuted;
  powerChargeSound.muted = isMuted;
  
  return isMuted;
}

export { glassBreakSound, powerChargeSound, isMuted };

