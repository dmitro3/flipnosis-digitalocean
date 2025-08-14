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
  
  // For production - use appropriate protocol based on current page
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}`
}

export default API_CONFIG 