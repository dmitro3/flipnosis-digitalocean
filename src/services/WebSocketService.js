// services/WebSocketService.js
// Simplified WebSocket service for single server

import { getWsUrl } from '../config/api'

class WebSocketService {
  constructor() {
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 2000
    this.messageHandlers = new Map()
    this.isConnected = false
    this.connectionPromise = null
  }

  async connect(gameId, address) {
    // If already connected, return existing connection
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('🔌 Already connected')
      return this.ws
    }

    // If connection is in progress, wait for it
    if (this.connectionPromise) {
      console.log('🔌 Connection in progress, waiting...')
      return this.connectionPromise
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        const wsUrl = getWsUrl()
        console.log('🔌 Connecting to WebSocket:', wsUrl)
        
        this.ws = new WebSocket(wsUrl)
        
        this.ws.onopen = () => {
          console.log('✅ WebSocket connected')
          this.isConnected = true
          this.reconnectAttempts = 0
          this.connectionPromise = null
          
          // Join room and register user
          if (gameId) {
            this.ws.send(JSON.stringify({
              type: 'join_room',
              roomId: gameId
            }))
          }
          
          if (address) {
            this.ws.send(JSON.stringify({
              type: 'register_user',
              address: address
            }))
          }
          
          resolve(this.ws)
        }
        
        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error)
          this.isConnected = false
          this.connectionPromise = null
          reject(error)
        }
        
        this.ws.onclose = () => {
          console.log('🔌 WebSocket disconnected')
          this.isConnected = false
          this.connectionPromise = null
          
          // Try to reconnect
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => {
              this.reconnectAttempts++
              console.log(`🔄 Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
              this.connect(gameId, address)
            }, this.reconnectDelay)
          }
        }
        
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            // Call registered handlers
            const handlers = this.messageHandlers.get(data.type) || []
            handlers.forEach(handler => handler(data))
            
          } catch (error) {
            console.error('Error handling message:', error)
          }
        }
        
      } catch (error) {
        console.error('Failed to create WebSocket:', error)
        this.connectionPromise = null
        reject(error)
      }
    })

    return this.connectionPromise
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
      return true
    }
    console.warn('⚠️ Cannot send message - WebSocket not connected')
    return false
  }

  sendAutoFlip(gameId, player, choice) {
    return this.send({
      type: 'GAME_ACTION',
      gameId,
      action: 'AUTO_FLIP',
      player,
      choice
    })
  }

  on(messageType, handler) {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, [])
    }
    this.messageHandlers.get(messageType).push(handler)
  }

  off(messageType, handler) {
    const handlers = this.messageHandlers.get(messageType)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
    this.connectionPromise = null
  }

  getWebSocket() {
    return this.ws
  }

  isConnected() {
    const connected = this.ws && this.ws.readyState === WebSocket.OPEN
    console.log('🔍 WebSocket connection check:', connected, this.ws?.readyState)
    return connected
  }
}

const webSocketService = new WebSocketService()
export default webSocketService
