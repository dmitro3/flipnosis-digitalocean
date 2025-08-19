import { useState, useEffect } from 'react'
import webSocketService from '../../../services/WebSocketService'

export const useLobbyWebSocket = (gameId, address, gameData) => {
  const [wsConnected, setWsConnected] = useState(false)
  const [wsRef, setWsRef] = useState(null)

  // Initialize WebSocket connection for lobby
  const initializeWebSocket = async () => {
    if (!gameId || !address) {
      console.log('⚠️ Cannot initialize lobby WebSocket - missing gameId or address')
      return
    }

    try {
      console.log('🔌 Initializing lobby WebSocket connection for game:', gameId)
      
      // Connect using the WebSocket service with lobby room
      const lobbyRoomId = `game_${gameId}` // General lobby room
      const ws = await webSocketService.connect(lobbyRoomId, address)
      if (ws) {
        setWsRef(ws)
        setWsConnected(true)
        console.log('✅ Lobby WebSocket connection established successfully')
      } else {
        console.error('❌ Failed to connect lobby WebSocket')
        setWsConnected(false)
      }
    } catch (error) {
      console.error('❌ Failed to initialize lobby WebSocket:', error)
      setWsConnected(false)
    }
  }

  // Set up connection state monitoring
  useEffect(() => {
    const checkConnectionState = () => {
      try {
        // Check if WebSocket service has the isConnected method
        if (webSocketService && typeof webSocketService.isConnected === 'function') {
          const isConnected = webSocketService.isConnected()
          setWsConnected(isConnected)
        } else {
          // Fallback: check if WebSocket exists and is open
          const ws = webSocketService?.getWebSocket?.()
          const connected = ws && ws.readyState === WebSocket.OPEN
          setWsConnected(connected)
        }
      } catch (error) {
        console.error('❌ Error checking lobby WebSocket connection:', error)
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

  // Listen for WebSocket messages about game state changes
  useEffect(() => {
    if (!webSocketService || typeof webSocketService.getWebSocket !== 'function') {
      return
    }

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('🏠 Lobby WebSocket message:', data)
        
        // Handle messages that affect lobby state
        if (data.type === 'game_started' || data.type === 'deposit_received') {
          console.log('💰 Deposit/Game started message received, triggering countdown check')
          // Trigger a custom event to notify the lobby to check countdown
          window.dispatchEvent(new CustomEvent('lobbyRefresh', { detail: data }))
        }
      } catch (error) {
        console.error('❌ Error parsing lobby WebSocket message:', error)
      }
    }

    const ws = webSocketService.getWebSocket()
    if (ws) {
      ws.addEventListener('message', handleMessage)
      return () => {
        ws.removeEventListener('message', handleMessage)
      }
    }
  }, [webSocketService, wsConnected])

  // Send lobby-specific messages
  const sendOfferMessage = (offerData) => {
    if (webSocketService && typeof webSocketService.send === 'function') {
      webSocketService.send({
        type: 'crypto_offer',
        gameId,
        ...offerData
      })
    }
  }

  const sendChatMessage = (message) => {
    if (webSocketService && typeof webSocketService.send === 'function') {
      webSocketService.send({
        type: 'chat_message',
        gameId,
        roomId: gameId,
        message,
        from: address
      })
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (webSocketService && typeof webSocketService.disconnect === 'function') {
        webSocketService.disconnect()
      }
    }
  }, [wsRef])

  return {
    wsConnected,
    wsRef: webSocketService?.getWebSocket?.() || null,
    webSocketService,
    sendOfferMessage,
    sendChatMessage
  }
}
