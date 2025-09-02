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
  
  // Use the /ws path that nginx is configured to proxy
  // This avoids the mixed content issue since nginx handles the WebSocket upgrade
  if (window.location.protocol === 'https:') {
    return `wss://${window.location.hostname}/ws`
  }
  
  return `ws://${window.location.hostname}/ws`
}

export default API_CONFIG 