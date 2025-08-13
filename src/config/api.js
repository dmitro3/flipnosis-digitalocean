// config/api.js
// Simple configuration for single server setup

export const API_CONFIG = {
  // Everything is local now
  BASE_URL: '',
  WS_URL: (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + '/ws'
}

// Helper functions
export const getApiUrl = (endpoint) => {
  return `/api${endpoint}`
}

export const getWsUrl = () => {
  // For development
  if (window.location.hostname === 'localhost') {
    return 'ws://localhost:3001/ws'
  }
  
  // For production (your 159 server)
  return API_CONFIG.WS_URL
}

export default API_CONFIG 