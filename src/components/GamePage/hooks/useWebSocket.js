import { useState, useEffect } from 'react'
import { getWsUrl } from '../../../config/api'

export const useWebSocket = (gameId, address, gameData) => {
  const [wsConnected, setWsConnected] = useState(false)
  const [wsRef, setWsRef] = useState(null)

  // Initialize WebSocket connection
  const initializeWebSocket = () => {
    if (wsRef) {
      console.log('🔌 Closing existing WebSocket connection')
      wsRef.close()
    }

    const wsUrl = getWsUrl()
    console.log('🔌 Initializing WebSocket connection to:', wsUrl)

    const ws = new WebSocket(wsUrl)
    setWsRef(ws)

    // Add connection timeout
    const connectionTimeout = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        console.log('⏰ WebSocket connection timeout, closing...')
        ws.close()
      }
    }, 10000) // 10 second timeout

    ws.onopen = () => {
      console.log('🔌 WebSocket connected successfully')
      clearTimeout(connectionTimeout)
      setWsConnected(true)

      // Join game room immediately
      try {
        ws.send(JSON.stringify({
          type: 'join_room',
          roomId: gameId
        }))
        console.log('🏠 Joined game room:', gameId)
      } catch (error) {
        console.error('❌ Failed to join room:', error)
      }

      // Register user if we have an address
      if (address) {
        try {
          ws.send(JSON.stringify({
            type: 'register_user',
            address: address
          }))
          console.log('👤 Registered user:', address)
        } catch (error) {
          console.error('❌ Failed to register user:', error)
        }
      }
    }

    ws.onerror = (error) => {
      console.error('🔌 WebSocket error:', error)
      clearTimeout(connectionTimeout)
      setWsConnected(false)
    }

    ws.onclose = (event) => {
      console.log('🔌 WebSocket disconnected:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      })
      clearTimeout(connectionTimeout)
      setWsConnected(false)

      // Reconnect if game is still active
      if (gameData && !gameData.completed && gameData.status !== 'cancelled') {
        setTimeout(() => {
          console.log('🔄 Reconnecting WebSocket...')
          initializeWebSocket()
        }, 3000)
      }
    }
  }

  // Initialize WebSocket when game data is available
  useEffect(() => {
    if (gameId && gameData) {
      initializeWebSocket()
    }

    return () => {
      if (wsRef) {
        wsRef.close()
      }
    }
  }, [gameId, gameData])

  return {
    wsConnected,
    wsRef,
    setWsRef
  }
} 