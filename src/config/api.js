// Single source of truth for API configuration
export const API_CONFIG = {
  // Keep old server for now
  BASE_URL: import.meta.env.DEV ? 'http://localhost:3001' : 'https://cryptoflipz2-production.up.railway.app',
  // New V2 server endpoints
  BASE_URL_V2: import.meta.env.DEV ? 'http://localhost:3002' : 'https://cryptoflipz2-production.up.railway.app',
  WS_URL: import.meta.env.DEV ? 'ws://localhost:3001' : 'wss://cryptoflipz2-production.up.railway.app',
  WS_URL_V2: import.meta.env.DEV ? 'ws://localhost:3002' : 'wss://cryptoflipz2-production.up.railway.app',
  // Toggle this to use V2
  USE_V2: true
}

// Helper functions
export const getApiUrl = (endpoint) => {
  const baseUrl = API_CONFIG.USE_V2 ? API_CONFIG.BASE_URL_V2 : API_CONFIG.BASE_URL
  const prefix = '/api'
  return `${baseUrl}${prefix}${endpoint}`
}

export const getWsUrl = () => {
  return API_CONFIG.USE_V2 ? API_CONFIG.WS_URL_V2 : API_CONFIG.WS_URL
}

export default API_CONFIG; 