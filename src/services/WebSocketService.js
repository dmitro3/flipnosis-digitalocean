// WebSocket Service - Minification Proof
// This service uses a global object approach to prevent minification issues

import { getWsUrl } from '../config/api'

// Create a global WebSocket service that cannot be minified
if (typeof window !== 'undefined') {
  // Initialize the global service
  window.FlipnosisWS = {
    // Connection state
    socket: null,
    connected: false,
    gameId: null,
    address: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectDelay: 2000,
    messageHandlers: new Map(),
    connectionPromise: null,

    // Connect to WebSocket
    connect: function(gameId, address) {
      this.gameId = gameId
      this.address = address

      // If already connected, return existing connection
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        console.log('🔌 Already connected')
        return Promise.resolve(this.socket)
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
          
          this.socket = new WebSocket(wsUrl)
          
          this.socket.onopen = () => {
            console.log('✅ WebSocket connected')
            this.connected = true
            this.reconnectAttempts = 0
            this.connectionPromise = null
            
            // Join room and register user
            if (this.gameId) {
              this.socket.send(JSON.stringify({
                type: 'join_room',
                roomId: this.gameId
              }))
            }
            
            if (this.address) {
              this.socket.send(JSON.stringify({
                type: 'register_user',
                address: this.address
              }))
            }
            
            resolve(this.socket)
          }
          
          this.socket.onerror = (error) => {
            console.error('❌ WebSocket error:', error)
            this.connected = false
            this.connectionPromise = null
            reject(error)
          }
          
          this.socket.onclose = () => {
            console.log('🔌 WebSocket disconnected')
            this.connected = false
            this.connectionPromise = null
            
            // Try to reconnect
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
              setTimeout(() => {
                this.reconnectAttempts++
                console.log(`🔄 Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
                this.connect(this.gameId, this.address)
              }, this.reconnectDelay)
            }
          }
          
          this.socket.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data)
              console.log('📨 WebSocket message received:', data)
              
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
    },

    // Send message
    send: function(message) {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify(message))
        return true
      }
      console.warn('⚠️ Cannot send message - WebSocket not connected')
      return false
    },

    // Send auto flip message
    sendAutoFlip: function(gameId, player, choice) {
      return this.send({
        type: 'GAME_ACTION',
        gameId,
        action: 'AUTO_FLIP',
        player,
        choice
      })
    },

    // Register message handler
    on: function(messageType, handler) {
      if (!this.messageHandlers.has(messageType)) {
        this.messageHandlers.set(messageType, [])
      }
      this.messageHandlers.get(messageType).push(handler)
    },

    // Remove message handler
    off: function(messageType, handler) {
      const handlers = this.messageHandlers.get(messageType)
      if (handlers) {
        const index = handlers.indexOf(handler)
        if (index > -1) {
          handlers.splice(index, 1)
        }
      }
    },

    // Disconnect
    disconnect: function() {
      if (this.socket) {
        this.socket.close()
        this.socket = null
      }
      this.connected = false
      this.connectionPromise = null
    },

    // Get WebSocket instance
    getWebSocket: function() {
      return this.socket
    },

    // Check if connected
    isConnected: function() {
      try {
        const connected = this.socket && this.socket.readyState === WebSocket.OPEN
        console.log('🔍 WebSocket connection check:', connected, this.socket?.readyState)
        return connected
      } catch (error) {
        console.error('❌ Error in isConnected check:', error)
        return false
      }
    },

    // Check if initialized
    isInitialized: function() {
      return this !== null && typeof this.isConnected === 'function'
    }
  }

  console.log('✅ Global WebSocket service created: window.FlipnosisWS')
  console.log('🔍 Available methods:', Object.keys(window.FlipnosisWS))
}

// Export the global service for direct access
const webSocketService = typeof window !== 'undefined' ? window.FlipnosisWS : null

export default webSocketService
