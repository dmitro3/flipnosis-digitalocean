// config/api.js
// Configuration for flipnosis.fun domain

export const API_CONFIG = {
  // Base URL for API calls
  BASE_URL: '',
  // WebSocket URL - will be determined dynamically
  WS_URL: null
}

// Helper functions
export const getApiUrl = (endpoint) => {
  return `/api${endpoint}`
}

export const getWsUrl = () => {
  // For development
  if (window.location.hostname === 'localhost') {
    return 'ws://localhost:3001'
  }
  
  // For production - flipnosis.fun domain
  if (window.location.hostname === 'www.flipnosis.fun' || window.location.hostname === 'flipnosis.fun') {
    // Use WS for HTTP (since we removed HTTPS/WSS)
    return `ws://${window.location.host}`
  }
  
  // Fallback - use current host with WS protocol
  return `ws://${window.location.host}`
}

export default API_CONFIG 