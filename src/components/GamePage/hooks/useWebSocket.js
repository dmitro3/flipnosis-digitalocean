import { useState, useEffect } from 'react'
import webSocketService from '../../../services/WebSocketService'

// Debug the import
console.log('🔧 useWebSocket hook - webSocketService import:', webSocketService)
console.log('🔧 useWebSocket hook - webSocketService type:', typeof webSocketService)
console.log('🔧 useWebSocket hook - webSocketService methods:', webSocketService ? Object.getOwnPropertyNames(Object.getPrototypeOf(webSocketService)) : 'null')

export const useWebSocket = (gameId, address, gameData) => {
  const [wsConnected, setWsConnected] = useState(false)
  const [wsRef, setWsRef] = useState(null)

  // Helper function to safely call WebSocket service methods
  const safeCallMethod = (methodName, ...args) => {
    try {
      if (!webSocketService) {
        console.error('❌ WebSocket service not available')
        return null
      }
      
      // Try different ways to access the method
      const method = webSocketService[methodName] || 
                    webSocketService[`is${methodName.charAt(0).toUpperCase() + methodName.slice(1)}`] ||
                    (typeof webSocketService[methodName] === 'function' ? webSocketService[methodName] : null)
      
      if (typeof method === 'function') {
        return method.apply(webSocketService, args)
      }
      
      console.error(`❌ Method ${methodName} not found on WebSocket service`)
      return null
    } catch (error) {
      console.error(`❌ Error calling ${methodName}:`, error)
      return null
    }
  }

  // Initialize WebSocket connection
  const initializeWebSocket = async () => {
    if (!gameId || !address) {
      console.log('⚠️ Cannot initialize WebSocket - missing gameId or address')
      return
    }

    try {
      console.log('🔌 Initializing WebSocket connection for game:', gameId)
      
      // Connect using the WebSocket service
      const ws = await safeCallMethod('connect', gameId, address)
      if (ws) {
        setWsRef(ws)
        setWsConnected(true)
        console.log('✅ WebSocket connection established successfully')
      } else {
        console.error('❌ Failed to connect WebSocket')
        setWsConnected(false)
      }
    } catch (error) {
      console.error('❌ Failed to initialize WebSocket:', error)
      setWsConnected(false)
    }
  }

  // Set up connection state monitoring
  useEffect(() => {
    const checkConnectionState = () => {
      try {
        const isConnected = safeCallMethod('isConnected')
        if (isConnected !== null) {
          setWsConnected(isConnected)
        } else {
          setWsConnected(false)
        }
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
      safeCallMethod('disconnect')
    }
  }, [wsRef])

  return {
    wsConnected,
    wsRef: webSocketService ? safeCallMethod('getWebSocket') : null,
    setWsRef,
    webSocketService
  }
} 