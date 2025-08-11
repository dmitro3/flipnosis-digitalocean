// Single source of truth for API configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.DEV ? 'http://localhost:3001' : 'https://www.flipnosis.fun',
  WS_URL: import.meta.env.DEV ? 'ws://localhost:3001' : 'wss://www.flipnosis.fun'
}

// Helper functions
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}/api${endpoint}`
}

export const getWsUrl = () => {
  return API_CONFIG.WS_URL
}

export default API_CONFIG; 