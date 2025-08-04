import { useState, useEffect } from 'react'
import webSocketService from '../../../services/WebSocketService'

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
      const isConnected = webSocketService.isConnected()
      setWsConnected(isConnected)
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
      if (wsRef) {
        webSocketService.disconnect()
      }
    }
  }, [wsRef])

  return {
    wsConnected,
    wsRef: webSocketService.getWebSocket(),
    setWsRef,
    webSocketService
  }
} 