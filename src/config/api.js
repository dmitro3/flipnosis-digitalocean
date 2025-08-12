// Single source of truth for API configuration
export const API_CONFIG = {
  // Use relative URLs to avoid CSP issues
  BASE_URL: '',
  WS_URL: (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host
}

// Helper functions
export const getApiUrl = (endpoint) => {
  return `/api${endpoint}`
}

export const getWsUrl = () => {
  return API_CONFIG.WS_URL
}

export default API_CONFIG; 