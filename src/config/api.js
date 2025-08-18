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
  
  // For production - always use WSS when on HTTPS
  if (window.location.protocol === 'https:') {
    // Use WSS on standard port
    return `wss://${window.location.hostname}`
  }
  
  // Fallback to WS
  return `ws://${window.location.hostname}`
}

export default API_CONFIG 