// WebSocket Service - Clean WebSocket-only implementation with Singleton pattern
import { getWsUrl } from '../config/api'

// Singleton instance
let instance = null

class WebSocketService {
  constructor() {
    // Prevent multiple instances
    if (instance) {
      return instance
    }
    
    this.socket = null
    this.connected = false
    this.connecting = false
    this.gameId = null
    this.address = null
    this.currentRoom = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10
    this.reconnectDelay = 2000
    this.messageHandlers = new Map()
    this.messageQueue = []
    this.pingInterval = null
    this.reconnectTimer = null
    
    // Set instance
    instance = this
  }

  // Static method to get singleton instance
  static getInstance() {
    if (!instance) {
      instance = new WebSocketService()
    }
    return instance
  }

  async connect(gameId, address) {
    // Normalize room ID - ALWAYS use game_${gameId} format
    const roomId = gameId.startsWith('game_') ? gameId : `game_${gameId}`
    
    // If already connected to this room, just return
    if (this.connected && this.currentRoom === roomId) {
      console.log('✅ Already connected to room:', roomId)
      return Promise.resolve()
    }
    
    // If connecting, wait for it
    if (this.connecting) {
      console.log('⏳ Connection already in progress...')
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.connecting) {
            clearInterval(checkInterval)
            resolve()
          }
        }, 100)
      })
    }
    
    // Disconnect from previous room if different
    if (this.currentRoom && this.currentRoom !== roomId) {
      console.log(`🔄 Switching from ${this.currentRoom} to ${roomId}`)
      this.disconnect()
    }
    
    this.connecting = true
    this.currentRoom = roomId
    this.gameId = roomId.replace('game_', '')
    this.address = address
    
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = getWsUrl()
        console.log('🔌 Connecting to WebSocket:', wsUrl)
        
        this.socket = new WebSocket(wsUrl)
        
        this.socket.onopen = () => {
          console.log('✅ WebSocket connected')
          this.connected = true
          this.connecting = false
          this.reconnectAttempts = 0
          
          // Join room immediately
          this.send({
            type: 'join_room',
            roomId: roomId,
            address: address
          })
          
          // Process queued messages
          this.processMessageQueue()
          
          // Setup ping to keep connection alive
          this.setupPingInterval()
          
          // Notify handlers
          this.notifyHandlers('connected', { roomId, address })
          
          resolve()
        }
        
        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            // Skip heartbeat/ping/pong messages
            if (data.type === 'heartbeat' || data.type === 'pong') {
              return
            }
            
            console.log('📨 Message received:', data.type, data)
            
            // Call registered handlers
            const handlers = this.messageHandlers.get(data.type) || []
            handlers.forEach(handler => {
              try {
                handler(data)
              } catch (error) {
                console.error(`❌ Handler error for ${data.type}:`, error)
              }
            })
          } catch (error) {
            console.error('❌ Failed to parse message:', error)
          }
        }
        
        this.socket.onerror = (error) => {
          console.error('❌ WebSocket error:', error)
          this.connecting = false
          
          if (!this.connected) {
            reject(error)
          }
        }
        
        this.socket.onclose = (event) => {
          console.log('🔌 WebSocket disconnected:', event.code, event.reason)
          this.connected = false
          this.connecting = false
          
          // Clear ping interval
          if (this.pingInterval) {
            clearInterval(this.pingInterval)
            this.pingInterval = null
          }
          
          // Notify handlers
          this.notifyHandlers('disconnected', { code: event.code, reason: event.reason })
          
          // Auto-reconnect if not manually closed
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect()
          }
        }
      } catch (error) {
        console.error('❌ Failed to create WebSocket:', error)
        this.connecting = false
        reject(error)
      }
    })
  }

  scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    
    const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts), 30000)
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`)
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++
      this.connect(this.gameId, this.address).catch(error => {
        console.error('❌ Reconnection failed:', error)
      })
    }, delay)
  }

  setupPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
    }
    
    // Send ping every 30 seconds
    this.pingInterval = setInterval(() => {
      if (this.connected && this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }))
      }
    }, 30000)
  }

  send(message) {
    if (this.connected && this.socket && this.socket.readyState === WebSocket.OPEN) {
      const messageStr = JSON.stringify(message)
      this.socket.send(messageStr)
      console.log('📤 Message sent:', message.type)
      return true
    } else {
      // Queue message for later
      console.log('⏳ Queueing message (not connected):', message.type)
      this.messageQueue.push(message)
      
      // Try to reconnect
      if (!this.connected && !this.connecting) {
        this.connect(this.gameId, this.address)
      }
      
      return false
    }
  }

  processMessageQueue() {
    if (this.messageQueue.length > 0) {
      console.log(`📤 Processing ${this.messageQueue.length} queued messages`)
      const queue = [...this.messageQueue]
      this.messageQueue = []
      
      queue.forEach(message => {
        this.send(message)
      })
    }
  }

  on(eventType, handler) {
    if (!this.messageHandlers.has(eventType)) {
      this.messageHandlers.set(eventType, [])
    }
    this.messageHandlers.get(eventType).push(handler)
    console.log(`✅ Handler registered for: ${eventType}`)
  }

  off(eventType, handler) {
    const handlers = this.messageHandlers.get(eventType)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
        console.log(`✅ Handler removed for: ${eventType}`)
      }
    }
  }

  notifyHandlers(eventType, data) {
    const handlers = this.messageHandlers.get(eventType) || []
    handlers.forEach((handler, index) => {
      try {
        // Validate handler is actually a function
        if (typeof handler !== 'function') {
          console.error(`❌ Invalid handler for ${eventType} at index ${index}:`, handler)
          return
        }
        handler(data)
      } catch (error) {
        console.error(`❌ Error in ${eventType} handler at index ${index}:`, error)
        console.error('Handler:', handler)
        console.error('Data:', data)
      }
    })
  }

  disconnect() {
    console.log('🔌 Disconnecting WebSocket...')
    
    // Clear timers
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    // Close socket
    if (this.socket) {
      this.socket.close(1000, 'Client disconnect')
      this.socket = null
    }
    
    this.connected = false
    this.connecting = false
    this.currentRoom = null
    this.reconnectAttempts = 0
  }

  isConnected() {
    return this.connected && this.socket && this.socket.readyState === WebSocket.OPEN
  }

  getConnectionStatus() {
    if (this.connected) return 'connected'
    if (this.connecting) return 'connecting'
    return 'disconnected'
  }
}

// Create singleton instance
const webSocketService = new WebSocketService()

// Make it globally available for debugging
if (typeof window !== 'undefined') {
  window.webSocketService = webSocketService
}

export default webSocketService
