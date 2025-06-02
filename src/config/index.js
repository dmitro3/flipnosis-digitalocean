export const CONFIG = {
  FEE_RECIPIENT: '0xE1E3dFa98C39Ba5b6C643348420420aBC3556416',
  LISTING_FEE_USD: 0.30,
  ETH_PRICE_USD: 2500,
  WEBSOCKET_URL: process.env.NODE_ENV === 'production' ? 'wss://your-production-domain.com' : 'ws://localhost:3001',
  GAME_EXPIRY_DAYS: 7,
  ROUND_TIMEOUT_SECONDS: 30
} 