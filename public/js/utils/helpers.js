/**
 * Helper Functions
 * General utility functions used throughout the game
 */

export function isMobile() {
  return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function triggerHaptic() {
  if (navigator.vibrate) {
    navigator.vibrate(30);
  }
}

/**
 * Get URL parameters
 */
export function getUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    gameId: urlParams.get('gameId') || '',
    role: urlParams.get('role') || 'player',
    address: urlParams.get('address') || '',
    room: urlParams.get('room') || 'potion',
    token: urlParams.get('token') || ''
  };
}

/**
 * Update mobile background based on room type
 */
export function updateMobileBackground(roomParam) {
  if (!isMobile()) return;
  
  const isLandscape = window.innerWidth > window.innerHeight;
  const newRoomParam = new URLSearchParams(window.location.search).get('room') || roomParam;
  
  document.body.style.background = 'none';
  document.body.style.backgroundImage = 'none';
  document.body.style.backgroundSize = '';
  
  if (isLandscape) {
    if (newRoomParam === 'lab') {
      document.body.style.background = "url('/images/background/thelab.png') no-repeat center center !important";
      document.body.style.backgroundSize = '100% 100% !important';
    } else if (newRoomParam === 'cyber') {
      document.body.style.background = "url('/images/background/cyber.png') no-repeat center center !important";
      document.body.style.backgroundSize = '100% 100% !important';
    } else if (newRoomParam === 'mech') {
      document.body.style.background = "url('/images/background/mech.png') no-repeat center center !important";
      document.body.style.backgroundSize = '100% 100% !important';
    } else {
      document.body.style.background = "url('/images/background/game room2.png') no-repeat center center !important";
      document.body.style.backgroundSize = '100% 100% !important';
    }
  }
}

