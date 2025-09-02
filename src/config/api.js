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
  
  // For production - use nginx proxy to avoid mixed content issues
  // The server should handle WebSocket upgrade requests properly
  if (window.location.protocol === 'https:') {
    return `wss://${window.location.hostname}`
  }
  
  return `ws://${window.location.hostname}`
}

export default API_CONFIG 