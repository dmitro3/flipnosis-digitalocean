import { useState, useEffect } from 'react'
import webSocketService from '../../../services/WebSocketService'

// Debug the import
console.log('🔧 useWebSocket hook - webSocketService import:', webSocketService)
console.log('🔧 useWebSocket hook - webSocketService type:', typeof webSocketService)
console.log('🔧 useWebSocket hook - webSocketService methods:', webSocketService ? Object.getOwnPropertyNames(Object.getPrototypeOf(webSocketService)) : 'null')

export const useWebSocket = (gameId, address, gameData) => {
  const [wsConnected, setWsConnected] = useState(false)
  const [wsRef, setWsRef] = useState(null)

  // Initialize WebSocket connection
  const initializeWebSocket = async () => {
    if (!gameId || !address) {
      console.log('⚠️ Cannot initialize WebSocket - missing gameId or address')
      return
    }

    try {
      console.log('🔌 Initializing WebSocket connection for game:', gameId)
      
      // Verify the WebSocket service is properly initialized
      if (!webSocketService || typeof webSocketService.isInitialized !== 'function') {
        console.error('❌ WebSocket service not properly initialized')
        console.error('❌ webSocketService:', webSocketService)
        console.error('❌ webSocketService type:', typeof webSocketService)
        return
      }
      
      // Connect using the WebSocket service
      const ws = await webSocketService.connect(gameId, address)
      setWsRef(ws)
      setWsConnected(true)
      
      console.log('✅ WebSocket connection established successfully')
    } catch (error) {
      console.error('❌ Failed to initialize WebSocket:', error)
      setWsConnected(false)
    }
  }

  // Set up connection state monitoring
  useEffect(() => {
    const checkConnectionState = () => {
      try {
        // Verify the WebSocket service is available and has the isConnected method
        if (!webSocketService) {
          console.error('❌ WebSocket service not available')
          setWsConnected(false)
          return
        }
        
        if (typeof webSocketService.isConnected !== 'function') {
          console.error('❌ WebSocket service isConnected method not available')
          console.error('❌ webSocketService:', webSocketService)
          console.error('❌ webSocketService methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(webSocketService)))
          setWsConnected(false)
          return
        }
        
        // Use the correct method call with error handling
        const isConnected = webSocketService.isConnected()
        setWsConnected(isConnected)
      } catch (error) {
        console.error('❌ Error checking WebSocket connection:', error)
        setWsConnected(false)
      }
    }

    // Check connection state periodically
    const interval = setInterval(checkConnectionState, 2000)
    
    return () => {
      clearInterval(interval)
    }
  }, [])

  // Initialize WebSocket when game data is available
  useEffect(() => {
    if (gameId && address && gameData) {
      initializeWebSocket()
    }

    return () => {
      // Cleanup will be handled by the WebSocket service
    }
  }, [gameId, address, gameData])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef && webSocketService && typeof webSocketService.disconnect === 'function') {
        webSocketService.disconnect()
      }
    }
  }, [wsRef])

  return {
    wsConnected,
    wsRef: webSocketService ? webSocketService.getWebSocket() : null,
    setWsRef,
    webSocketService
  }
} 