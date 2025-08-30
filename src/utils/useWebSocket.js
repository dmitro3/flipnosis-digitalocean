// utils/useWebSocket.js
// Stable WebSocket service hook that's resistant to minification

import { useRef, useEffect, useState } from 'react'
import webSocketService from '../services/WebSocketService'

export function useWebSocket() {
  const [lastMessage, setLastMessage] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const messageHandlers = useRef(new Map())

  useEffect(() => {
    // Set up message handler
    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setLastMessage(event)
        
        // Call any registered handlers
        if (messageHandlers.current.has(data.type)) {
          messageHandlers.current.get(data.type).forEach(handler => {
            try {
              handler(data)
            } catch (error) {
              console.error('Error in message handler:', error)
            }
          })
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    // Set up connection status handler
    const handleConnectionChange = (connected) => {
      setIsConnected(connected)
    }

    // Register with WebSocket service
    webSocketService.on('message', handleMessage)
    webSocketService.on('connection_change', handleConnectionChange)

    // Check initial connection status
    setIsConnected(webSocketService.isConnected())

    return () => {
      webSocketService.off('message', handleMessage)
      webSocketService.off('connection_change', handleConnectionChange)
    }
  }, [])

  const sendMessage = (message) => {
    if (!isConnected) {
      console.warn('WebSocket not connected, attempting to send message:', message)
    }
    webSocketService.send(message)
  }

  const connect = (gameId, address) => {
    return webSocketService.connect(gameId, address)
  }

  const disconnect = () => {
    webSocketService.disconnect()
  }

  const on = (messageType, handler) => {
    if (!messageHandlers.current.has(messageType)) {
      messageHandlers.current.set(messageType, new Set())
    }
    messageHandlers.current.get(messageType).add(handler)
  }

  const off = (messageType, handler) => {
    if (messageHandlers.current.has(messageType)) {
      messageHandlers.current.get(messageType).delete(handler)
    }
  }

  return {
    lastMessage,
    isConnected,
    sendMessage,
    connect,
    disconnect,
    on,
    off
  }
}

export default useWebSocket