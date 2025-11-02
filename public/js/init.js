/**
 * Game Initialization Script
 * Entry point for the glass tube game
 */

import { initGame } from './game-main.js';
import { isMobile, updateMobileBackground } from './utils/helpers.js';
import { toggleMute } from './utils/audio.js';
import { TUBE_HEIGHT } from './config.js';

// Main initialization function
async function initialize() {
  console.log('🚀 Starting game initialization...');
  console.log('📍 Current location:', window.location.href);
  
  const info = document.getElementById('info');
  const container = document.getElementById('container');
  
  // Verify critical DOM elements exist
  if (!info) {
    console.error('❌ Info element (#info) not found!');
    alert('Critical error: Info element not found. Please refresh the page.');
    return;
  }
  
  if (!container) {
    console.error('❌ Container element (#container) not found!');
    alert('Critical error: Container element not found. Please refresh the page.');
    return;
  }
  
  console.log('✅ DOM elements found: info, container');
  
  // Parse URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const gameIdParam = urlParams.get('gameId') || '';
  const roleParam = urlParams.get('role') || 'player';
  let walletParam = urlParams.get('address') || '';
  const roomParam = urlParams.get('room') || 'potion';
  const tokenParam = urlParams.get('token') || '';
  
  console.log('📋 URL Parameters:', {
    gameId: gameIdParam,
    role: roleParam,
    wallet: walletParam ? `${walletParam.substring(0, 6)}...` : 'none',
    room: roomParam,
    hasToken: !!tokenParam
  });
  
  // Try to get wallet from localStorage or MetaMask if not in URL
  if (!walletParam) {
    walletParam = localStorage.getItem('walletAddress') || '';
    console.log('🔍 Wallet from localStorage:', walletParam ? `${walletParam.substring(0, 6)}...` : 'none');
    
    if (!walletParam && window.ethereum?.selectedAddress) {
      walletParam = window.ethereum.selectedAddress;
      console.log('🔍 Wallet from MetaMask:', walletParam ? `${walletParam.substring(0, 6)}...` : 'none');
    }
  }
  
  // Set page title
  if (gameIdParam) {
    document.title = `Glass Tube Game • ${gameIdParam}`;
  }
  
  // Apply room-specific body classes
  if (roomParam === 'lab') {
    document.body.classList.add('lab-room');
  } else if (roomParam === 'cyber') {
    document.body.classList.add('cyber-room');
  } else if (roomParam === 'mech') {
    document.body.classList.add('mech-room');
  }
  
  // Update mobile background
  if (isMobile()) {
    console.log('📱 Mobile device detected');
    updateMobileBackground(roomParam);
    
    // Handle orientation changes
    window.addEventListener('orientationchange', function() {
      console.log('🔄 Orientation change detected');
      setTimeout(() => updateMobileBackground(roomParam), 50);
      setTimeout(() => updateMobileBackground(roomParam), 200);
      setTimeout(() => updateMobileBackground(roomParam), 500);
    });
    
    // Handle resize events
    let resizeTimeout;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => updateMobileBackground(roomParam), 100);
    });
  }
  
  // Update loading message
  info.textContent = '🎮 Initializing 4-Player Glass Tube Game...';
  info.style.display = 'block';
  info.style.color = '#00ffff';
  
  try {
    console.log('📦 Calling initGame()...');
    
    // Initialize the game
    const gameInstance = await initGame({
      gameIdParam,
      walletParam,
      roomParam,
      roleParam,
      tokenParam
    });
    
    console.log('✅ Game initialized successfully!', gameInstance);
    
    // Make game instance available globally for debugging
    window.gameInstance = gameInstance;
    
    // Hide loading info
    info.style.display = 'none';
    
    // Load participants and join game (if needed)
    if (gameIdParam && roleParam !== 'spectator') {
      console.log('🔗 Loading participants and joining game...');
      
      // Load participants using the game instance function
      if (gameInstance && typeof gameInstance.loadParticipants === 'function') {
        try {
          await gameInstance.loadParticipants();
        } catch (err) {
          console.warn('⚠️ Participants load failed:', err);
        }
      }
      
      // Join game
      if (walletParam) {
        try {
          const res = await fetch(`/api/battle-royale/${encodeURIComponent(gameIdParam)}/join`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(tokenParam ? { Authorization: `Bearer ${tokenParam}` } : {})
            },
            body: JSON.stringify({ player_address: walletParam })
          });
          
          const data = await res.json().catch(() => ({}));
          if (res.ok) {
            console.log('✅ Joined game on server:', data);
            // Reload participants after joining to get updated state
            if (gameInstance && typeof gameInstance.loadParticipants === 'function') {
              setTimeout(() => gameInstance.loadParticipants(), 500);
            }
          } else {
            // Check if error is "already joined" - that's actually fine
            const errorMsg = data?.error || res.statusText || '';
            if (errorMsg.toLowerCase().includes('already joined')) {
              console.log('✅ Player already in game - this is fine, reloading participants');
              // Reload participants to ensure we have the latest state
              if (gameInstance && typeof gameInstance.loadParticipants === 'function') {
                setTimeout(() => gameInstance.loadParticipants(), 500);
              }
            } else {
              console.warn('⚠️ Join failed:', errorMsg);
            }
          }
        } catch (err) {
          console.error('❌ Join error:', err);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to initialize game:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Show error to user
    if (info) {
      info.textContent = `❌ Error: ${error.message}`;
      info.style.color = '#ff0000';
      info.style.display = 'block';
      info.style.background = 'rgba(0, 0, 0, 0.9)';
      info.style.padding = '20px';
      info.style.borderRadius = '10px';
      info.style.border = '2px solid #ff0000';
    }
    
    // Also alert the user
    alert(`Failed to initialize game: ${error.message}\n\nCheck the browser console for more details.`);
  }
}

// Start initialization when DOM is ready
console.log('📜 Init script loaded, document.readyState:', document.readyState);

if (document.readyState === 'loading') {
  console.log('⏳ Waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  console.log('✅ DOM already loaded, initializing immediately...');
  initialize();
}

