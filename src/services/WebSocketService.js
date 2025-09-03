// BULLETPROOF WebSocket Service - No function reference corruption possible
import { getWsUrl } from '../config/api'

// Global singleton instance
let globalInstance = null

class BulletproofWebSocketService {
  constructor() {
    // Enforce singleton
    if (globalInstance) {
      return globalInstance
    }
    
    // Initialize state
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
    
    // Set global instance
    globalInstance = this
    
    // Bind methods to prevent reference loss
    this.connect = this.connect.bind(this)
    this.disconnect = this.disconnect.bind(this)
    this.send = this.send.bind(this)
    this.on = this.on.bind(this)
    this.off = this.off.bind(this)
    this.isConnected = this.isConnected.bind(this)
    this.getConnectionStatus = this.getConnectionStatus.bind(this)
  }

  // Static getInstance method
  static getInstance() {
    if (!globalInstance) {
      globalInstance = new BulletproofWebSocketService()
    }
    return globalInstance
  }

  async connect(gameId, address) {
    try {
      // Normalize room ID
      const roomId = gameId.startsWith('game_') ? gameId : `game_${gameId}`
      
      // If already connected to this room, return
      if (this.connected && this.currentRoom === roomId) {
        console.log('✅ Already connected to room:', roomId)
        return Promise.resolve()
      }
      
      // If connecting, wait
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
            
            // Setup ping
            this.setupPingInterval()
            
            // Notify handlers safely
            this.safeNotifyHandlers('connected', { roomId, address })
            
            resolve()
          }
          
          this.socket.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data)
              
              // Skip heartbeat messages
              if (data.type === 'heartbeat' || data.type === 'pong') {
                return
              }
              
              console.log('📨 Message received:', data.type, data)
              
              // Safely notify handlers
              this.safeNotifyHandlers(data.type, data)
              
            } catch (error) {
              console.error('❌ Error parsing WebSocket message:', error)
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
            
            // Notify handlers safely
            this.safeNotifyHandlers('disconnected', { code: event.code, reason: event.reason })
            
            // Attempt reconnection
            if (event.code !== 1000) {
              this.scheduleReconnect()
            }
          }
          
          this.socket.onerror = (error) => {
            console.error('❌ WebSocket error:', error)
            this.connecting = false
            reject(error)
          }
          
        } catch (error) {
          console.error('❌ Error creating WebSocket:', error)
          this.connecting = false
          reject(error)
        }
      })
      
    } catch (error) {
      console.error('❌ Connection error:', error)
      this.connecting = false
      throw error
    }
  }

  // BULLETPROOF handler notification - no function reference corruption possible
  safeNotifyHandlers(eventType, data) {
    try {
      const handlers = this.messageHandlers.get(eventType)
      if (!handlers || handlers.length === 0) {
        return
      }
      
      // Create a safe copy of handlers array
      const safeHandlers = [...handlers]
      
      safeHandlers.forEach((handler, index) => {
        try {
          // Triple-check handler is valid
          if (!handler) {
            console.warn(`⚠️ Null handler for ${eventType} at index ${index}`)
            return
          }
          
          if (typeof handler !== 'function') {
            console.warn(`⚠️ Invalid handler type for ${eventType} at index ${index}:`, typeof handler)
            return
          }
          
          // Call handler with error boundary
          const result = handler(data)
          
          // Handle async handlers
          if (result && typeof result.then === 'function') {
            result.catch(error => {
              console.error(`❌ Async handler error for ${eventType}:`, error)
            })
          }
          
        } catch (error) {
          console.error(`❌ Handler execution error for ${eventType} at index ${index}:`, error)
          console.error('Handler:', handler)
          console.error('Data:', data)
        }
      })
      
    } catch (error) {
      console.error(`❌ Critical error in safeNotifyHandlers for ${eventType}:`, error)
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached')
      return
    }
    
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
    if (!handler || typeof handler !== 'function') {
      console.error('❌ Invalid handler provided to on():', handler)
      return
    }
    
    if (!this.messageHandlers.has(eventType)) {
      this.messageHandlers.set(eventType, [])
    }
    
    // Store handler with validation
    const handlers = this.messageHandlers.get(eventType)
    if (!handlers.includes(handler)) {
      handlers.push(handler)
      console.log(`✅ Handler registered for: ${eventType}`)
    }
  }

  off(eventType, handler) {
    if (!handler) {
      // Remove all handlers for this event type
      this.messageHandlers.delete(eventType)
      console.log(`✅ All handlers removed for: ${eventType}`)
      return
    }
    
    const handlers = this.messageHandlers.get(eventType)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
        console.log(`✅ Handler removed for: ${eventType}`)
      }
    }
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

  // Debug method
  debugHandlers() {
    console.log('🔍 Bulletproof WebSocket Service Debug:')
    console.log('Connection status:', this.getConnectionStatus())
    console.log('Current room:', this.currentRoom)
    console.log('Message handlers:', Array.from(this.messageHandlers.entries()).map(([type, handlers]) => ({
      type,
      count: handlers.length,
      validHandlers: handlers.filter(h => typeof h === 'function').length,
      invalidHandlers: handlers.filter(h => typeof h !== 'function').length
    })))
  }
}

// Create and export singleton instance
const webSocketService = BulletproofWebSocketService.getInstance()

// Make it globally available for debugging
if (typeof window !== 'undefined') {
  window.webSocketService = webSocketService
  window.BulletproofWebSocketService = BulletproofWebSocketService
}

export default webSocketService
