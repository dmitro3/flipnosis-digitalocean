// utils/useWebSocket.js
// Stable WebSocket service hook that's resistant to minification

import { useRef, useEffect } from 'react'
import webSocketService from '../services/WebSocketService'

// Create a stable reference to the WebSocket service
const WS_SERVICE = {
  // Explicit method references that won't be minified
  connect: (gameId, address) => webSocketService.connect(gameId, address),
  send: (message) => webSocketService.send(message),
  sendAutoFlip: (gameId, player, choice) => webSocketService.sendAutoFlip(gameId, player, choice),
  on: (messageType, handler) => webSocketService.on(messageType, handler),
  off: (messageType, handler) => webSocketService.off(messageType, handler),
  disconnect: () => webSocketService.disconnect(),
  getWebSocket: () => webSocketService.getWebSocket(),
  isConnected: () => webSocketService.isConnected(),
  isInitialized: () => webSocketService.isInitialized()
}

export function useWebSocket() {
  const serviceRef = useRef(WS_SERVICE)
  
  // Ensure the service is properly initialized
  useEffect(() => {
    if (!serviceRef.current.isInitialized()) {
      console.warn('⚠️ WebSocket service not properly initialized')
    }
  }, [])
  
  return serviceRef.current
}

// Export the stable service reference for direct use
export { WS_SERVICE as webSocketService }
