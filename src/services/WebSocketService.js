import { getWsUrl } from '../config/api'

class WebSocketService {
  constructor() {
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10 // Increased from 5
    this.reconnectDelay = 2000 // Decreased from 3000
    this.messageHandlers = new Map()
    this.connectionState = 'disconnected'
    this.connectionPromise = null
    this.connectionTimeout = null
    this.heartbeatInterval = null
    this.lastHeartbeat = Date.now()
    this.messageQueue = [] // Queue messages when disconnected
  }

  // Connect to WebSocket server
  async connect(gameId, address) {
    if (this.connectionState === 'connecting') {
      console.log('🔌 Already connecting, waiting for existing connection...')
      return this.connectionPromise
    }
    
    if (this.connectionState === 'connected' && this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('🔌 Already connected')
      return Promise.resolve(this.ws)
    }

    this.connectionState = 'connecting'
    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        const wsUrl = getWsUrl()
        console.log('🔌 Connecting to WebSocket:', wsUrl)
        console.log('🎮 Game ID:', gameId)
        console.log('👤 Address:', address)

        // Clear any existing connection
        if (this.ws) {
          this.ws.close()
          this.ws = null
        }

        this.ws = new WebSocket(wsUrl)

        // Connection timeout
        this.connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            console.log('⏰ WebSocket connection timeout, retrying...')
            this.ws.close()
            this.attemptReconnect(gameId, address)
          }
        }, 10000) // 10 second timeout

        this.ws.onopen = () => {
          console.log('🔌 WebSocket connected successfully')
          clearTimeout(this.connectionTimeout)
          this.connectionState = 'connected'
          this.reconnectAttempts = 0
          this.lastHeartbeat = Date.now()

          // Start heartbeat
          this.startHeartbeat()

          // Join game room immediately
          if (gameId) {
            this.joinRoom(gameId)
          }
          
          // Register user if address provided
          if (address) {
            this.registerUser(address)
          }

          // Send any queued messages
          this.flushMessageQueue()

          resolve(this.ws)
        }

        this.ws.onerror = (error) => {
          console.error('🔌 WebSocket error:', error)
          clearTimeout(this.connectionTimeout)
          
          // Don't reject immediately, try to reconnect
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            console.log('🔄 Will attempt reconnection...')
            this.attemptReconnect(gameId, address)
          } else {
            this.connectionState = 'disconnected'
            this.stopHeartbeat()
            reject(error)
          }
        }

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket disconnected:', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          })
          
          clearTimeout(this.connectionTimeout)
          this.stopHeartbeat()
          this.connectionState = 'disconnected'
          
          // Always attempt reconnection unless max attempts reached
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect(gameId, address)
          }
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event)
        }

      } catch (error) {
        console.error('❌ Error creating WebSocket connection:', error)
        clearTimeout(this.connectionTimeout)
        
        // Try to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect(gameId, address)
        } else {
          this.connectionState = 'disconnected'
          reject(error)
        }
      }
    })

    return this.connectionPromise
  }

  // Start heartbeat
  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
    
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ 
          type: 'ping', 
          timestamp: Date.now() 
        }))
        
        // Check if we haven't received a pong in a while
        if (Date.now() - this.lastHeartbeat > 30000) {
          console.log('⚠️ No heartbeat response, reconnecting...')
          this.ws.close()
        }
      }
    }, 15000) // Send ping every 15 seconds
  }

  // Stop heartbeat
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // Attempt reconnection with exponential backoff
  attemptReconnect(gameId, address) {
    this.reconnectAttempts++
    
    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      console.log('❌ Max reconnection attempts reached')
      this.connectionState = 'disconnected'
      return
    }

    const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1), 30000)
    console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`)
    
    this.connectionState = 'reconnecting'
    
    setTimeout(() => {
      if (this.connectionState !== 'connected') {
        this.connect(gameId, address).catch(error => {
          console.error('❌ Reconnection failed:', error)
        })
      }
    }, delay)
  }

  // Join room
  joinRoom(roomId) {
    const message = {
      type: 'join_room',
      roomId: roomId
    }
    
    if (!this.send(message)) {
      // Queue the message if not connected
      this.messageQueue.push(message)
    } else {
      console.log('🏠 Joined room:', roomId)
    }
  }

  // Register user
  registerUser(address) {
    const message = {
      type: 'register_user',
      address: address
    }
    
    if (!this.send(message)) {
      // Queue the message if not connected
      this.messageQueue.push(message)
    } else {
      console.log('👤 Registered user:', address)
    }
  }

  // Send message with error handling and queuing
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message))
        return true
      } catch (error) {
        console.error('❌ Error sending message:', error)
        this.messageQueue.push(message)
        return false
      }
    } else {
      console.warn('⚠️ WebSocket not connected, queuing message')
      this.messageQueue.push(message)
      return false
    }
  }

  // Flush queued messages
  flushMessageQueue() {
    if (this.messageQueue.length > 0) {
      console.log(`📤 Sending ${this.messageQueue.length} queued messages`)
      const queue = [...this.messageQueue]
      this.messageQueue = []
      
      queue.forEach(message => {
        this.send(message)
      })
    }
  }

  // Handle incoming messages
  handleMessage(event) {
    try {
      const data = JSON.parse(event.data)
      
      // Handle heartbeat response
      if (data.type === 'pong') {
        this.lastHeartbeat = Date.now()
        return
      }
      
      // Call registered handlers
      const handlers = this.messageHandlers.get(data.type) || []
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error('❌ Error in message handler:', error)
        }
      })
      
      // Also call wildcard handlers
      const wildcardHandlers = this.messageHandlers.get('*') || []
      wildcardHandlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error('❌ Error in wildcard handler:', error)
        }
      })
    } catch (error) {
      console.error('❌ Error parsing WebSocket message:', error)
    }
  }

  // Register message handler
  on(messageType, handler) {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, [])
    }
    this.messageHandlers.get(messageType).push(handler)
  }

  // Remove message handler
  off(messageType, handler) {
    const handlers = this.messageHandlers.get(messageType)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  // Get connection state
  getConnectionState() {
    return this.connectionState
  }

  // Check if connected
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN
  }

  // Get WebSocket instance
  getWebSocket() {
    return this.ws
  }

  // Disconnect
  disconnect() {
    this.stopHeartbeat()
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout)
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.connectionState = 'disconnected'
    this.reconnectAttempts = 0
    this.messageQueue = []
  }

  // Send game action
  sendGameAction(action, data) {
    return this.send({
      type: 'game_action',
      action: action,
      data: data
    })
  }

  // Send player choice
  sendPlayerChoice(gameId, player, choice) {
    return this.send({
      type: 'player_choice',
      gameId: gameId,
      player: player,
      choice: choice
    })
  }

  // Send power charge
  sendPowerCharge(gameId, player, powerLevel) {
    return this.send({
      type: 'power_charge',
      gameId: gameId,
      player: player,
      powerLevel: powerLevel
    })
  }

  // Send power charge start
  sendPowerChargeStart(gameId, player) {
    return this.send({
      type: 'power_charge_start',
      gameId: gameId,
      player: player
    })
  }

  // Send auto flip
  sendAutoFlip(gameId, player, choice) {
    return this.send({
      type: 'auto_flip',
      gameId: gameId,
      player: player,
      choice: choice
    })
  }

  // Send chat message
  sendChatMessage(gameId, address, message) {
    return this.send({
      type: 'chat_message',
      gameId: gameId,
      address: address,
      message: message
    })
  }

  // Send crypto offer
  sendCryptoOffer(listingId, address, amount) {
    return this.send({
      type: 'crypto_offer',
      listingId: listingId,
      address: address,
      cryptoAmount: amount
    })
  }
}

// Create and export a singleton instance
const webSocketService = new WebSocketService()
export default webSocketService
