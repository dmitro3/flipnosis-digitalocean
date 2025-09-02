// config/api.js
// Configuration for flipnosis.fun domain

export const API_CONFIG = {
  BASE_URL: '',
  WS_URL: null
}

// Helper functions
export const getApiUrl = (endpoint) => {
  return `/api${endpoint}`
}

export const getWsUrl = () => {
  // For development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'ws://localhost:3000'
  }
  
  // For production - use the same hostname and protocol as the current page
  // The nginx proxy will handle routing to the correct backend port
  if (window.location.protocol === 'https:') {
    // Use WSS on the same hostname (nginx will proxy to port 3000)
    return `wss://${window.location.hostname}`
  }
  
  // Fallback to WS on the same hostname (nginx will proxy to port 3000)
  return `ws://${window.location.hostname}`
}

export default API_CONFIG 