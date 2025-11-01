/**
 * Haptic Feedback
 * Handles device vibration for mobile devices
 */

export function triggerHaptic(duration = 30) {
  if (navigator.vibrate) {
    navigator.vibrate(duration);
  }
}

export function triggerHapticPattern(pattern = [50, 50, 50]) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

