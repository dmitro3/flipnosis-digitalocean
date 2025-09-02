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
  
  // For production - connect directly to the server (no nginx proxy)
  // The server now handles HTTPS/WSS directly on port 443
  if (window.location.protocol === 'https:') {
    return `wss://${window.location.hostname}`
  }
  
  return `ws://${window.location.hostname}`
}

export default API_CONFIG 