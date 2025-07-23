// Single source of truth for API configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.DEV ? 'http://localhost:3001' : 'https://cryptoflipz2-production.up.railway.app',
  WS_URL: import.meta.env.DEV ? 'ws://localhost:3001' : 'wss://cryptoflipz2-production.up.railway.app'
}

// Helper functions
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}/api${endpoint}`
}

export const getWsUrl = () => {
  return API_CONFIG.WS_URL
}

export default API_CONFIG; 