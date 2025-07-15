// Single source of truth for API configuration
export const API_CONFIG = {
  // Use local server in development, production server in production
  BASE_URL: import.meta.env.DEV ? 'http://localhost:3000' : 'https://cryptoflipz2-production.up.railway.app',
  WS_URL: import.meta.env.DEV ? 'ws://localhost:3000' : 'wss://cryptoflipz2-production.up.railway.app'
};

export default API_CONFIG; 