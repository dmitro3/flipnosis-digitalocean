// Single source of truth for API configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.DEV ? 'http://localhost:3001' : 'http://143.198.166.196',
  WS_URL: import.meta.env.DEV ? 'ws://localhost:3001' : 'ws://143.198.166.196'
}

// Helper functions
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}/api${endpoint}`
}

export const getWsUrl = () => {
  return API_CONFIG.WS_URL
}

export default API_CONFIG; 