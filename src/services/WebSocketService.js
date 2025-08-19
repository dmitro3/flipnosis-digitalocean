// WebSocket Service - Minification Proof
// This service uses a global object approach to prevent minification issues

import { getWsUrl } from '../config/api'

// Create a global WebSocket service that cannot be minified
if (typeof window !== 'undefined') {
  window.FlipnosisWS = {
    // Connection state
    socket: null,
    connected: false,
    gameId: null,
    address: null,
    currentRoom: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 10,
    reconnectDelay: 2000,
    messageHandlers: new Map(),
    connectionPromise: null,
    reconnectTimer: null,
    pingInterval: null,

    // Connect to WebSocket
    connect: function(roomId, address) {
      // If connecting to a different room, disconnect first
      if (this.currentRoom && this.currentRoom !== roomId) {
        console.log(`🔄 Switching from room ${this.currentRoom} to ${roomId}`)
        this.disconnect()
      }
      
      this.currentRoom = roomId  // Track current room
      this.address = address
      this.gameId = roomId.replace('game_room_', '').replace('game_', '')  // Extract actual gameId

      // Clear any existing reconnect timer
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer)
        this.reconnectTimer = null
      }

      // If already connected, return existing connection
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        console.log('🔌 Already connected')
        this.setupPingPong()
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
            console.log('✅ WebSocket connected to room:', roomId)
            this.connected = true
            this.reconnectAttempts = 0
            this.connectionPromise = null
            
            // Setup ping-pong to keep connection alive
            this.setupPingPong()
            
            // Join the specific room
            this.socket.send(JSON.stringify({
              type: roomId.startsWith('game_room_') ? 'join_game_room' : 'join_room',
              roomId,
              gameId: roomId.replace('game_room_', '').replace('game_', ''),
              address
            }))
            
            resolve(this.socket)
          }
          
          this.socket.onerror = (error) => {
            console.error('❌ WebSocket error:', error)
            this.connected = false
            this.connectionPromise = null
            
            // Don't reject immediately, let onclose handle reconnection
            if (this.socket.readyState === WebSocket.CONNECTING) {
              reject(error)
            }
          }
          
          this.socket.onclose = (event) => {
            console.log('🔌 WebSocket disconnected', { code: event.code, reason: event.reason })
            this.connected = false
            this.connectionPromise = null
            
            // Clear ping interval
            if (this.pingInterval) {
              clearInterval(this.pingInterval)
              this.pingInterval = null
            }
            
            // Try to reconnect with exponential backoff
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
              const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts), 30000)
              this.reconnectTimer = setTimeout(() => {
                this.reconnectAttempts++
                console.log(`🔄 Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
                this.connect(this.currentRoom, this.address)
              }, delay)
            } else {
              console.error('❌ Max reconnection attempts reached')
            }
          }
          
          this.socket.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data)
              console.log('📨 WebSocket message received:', data)
              
              // Handle pong messages
              if (data.type === 'pong') {
                return // Just a keepalive response
              }
              
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

    // Setup ping-pong to keep connection alive
    setupPingPong: function() {
      // Clear existing interval
      if (this.pingInterval) {
        clearInterval(this.pingInterval)
      }
      
      // Send ping every 30 seconds
      this.pingInterval = setInterval(() => {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({
            type: 'ping',
            timestamp: Date.now()
          }))
        }
      }, 30000)
    },

    // Send message
    send: function(message) {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify(message))
        return true
      }
      console.warn('⚠️ Cannot send message - WebSocket not connected')
      
      // Try to reconnect
      this.connect(this.currentRoom, this.address)
      return false
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
      // Clear timers
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer)
        this.reconnectTimer = null
      }
      if (this.pingInterval) {
        clearInterval(this.pingInterval)
        this.pingInterval = null
      }
      
      // Close socket
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
      return this.socket && this.socket.readyState === WebSocket.OPEN
    },

    // Force reconnect
    forceReconnect: function() {
      this.disconnect()
      this.reconnectAttempts = 0
      return this.connect(this.currentRoom, this.address)
    }
  }

  console.log('✅ Global WebSocket service created: window.FlipnosisWS')
}

// Export the global service for direct access
const webSocketService = typeof window !== 'undefined' ? window.FlipnosisWS : null

export default webSocketService
