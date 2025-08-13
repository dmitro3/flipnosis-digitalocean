// config/api.js
// Simple configuration for single server setup

export const API_CONFIG = {
  // Everything is local now
  BASE_URL: '',
  WS_URL: (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host
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
  
  // For production - use the same domain as the page to avoid mixed content
  // This will use wss:// for HTTPS pages and ws:// for HTTP pages
  return (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host
}

export default API_CONFIG 