import { getWsUrl } from '../config/api'

class WebSocketService {
  constructor() {
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 3000
    this.messageHandlers = new Map()
    this.connectionState = 'disconnected' // disconnected, connecting, connected, reconnecting
    this.connectionPromise = null
    this.connectionTimeout = null
    this.heartbeatInterval = null
    this.lastHeartbeat = Date.now()
  }

  // Connect to WebSocket server
  async connect(gameId, address) {
    if (this.connectionState === 'connecting' || this.connectionState === 'connected') {
      console.log('🔌 WebSocket already connecting or connected')
      return this.connectionPromise
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

        // Connection timeout with Chrome-friendly settings
        this.connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            console.log('⏰ WebSocket connection timeout')
            this.ws.close()
            this.connectionState = 'disconnected'
            reject(new Error('Connection timeout'))
          }
        }, 15000) // Increased timeout for Chrome

        this.ws.onopen = () => {
          console.log('🔌 WebSocket connected successfully')
          clearTimeout(this.connectionTimeout)
          this.connectionState = 'connected'
          this.reconnectAttempts = 0
          this.lastHeartbeat = Date.now()

          // Start heartbeat for Chrome
          this.startHeartbeat()

          // Join game room immediately
          this.joinRoom(gameId)
          
          // Register user if address provided
          if (address) {
            this.registerUser(address)
          }

          resolve(this.ws)
        }

        this.ws.onerror = (error) => {
          console.error('🔌 WebSocket error:', error)
          clearTimeout(this.connectionTimeout)
          this.connectionState = 'disconnected'
          this.stopHeartbeat()
          reject(error)
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
          
          // Attempt reconnection if not a clean close
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect(gameId, address)
          }
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event)
        }

      } catch (error) {
        console.error('❌ Error creating WebSocket connection:', error)
        clearTimeout(this.connectionTimeout)
        this.connectionState = 'disconnected'
        reject(error)
      }
    })

    return this.connectionPromise
  }

  // Start heartbeat for Chrome compatibility
  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
    
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }))
          this.lastHeartbeat = Date.now()
        } catch (error) {
          console.error('🔌 Heartbeat error:', error)
          this.stopHeartbeat()
        }
      } else {
        this.stopHeartbeat()
      }
    }, 30000) // Send heartbeat every 30 seconds
  }

  // Stop heartbeat
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // Attempt to reconnect
  async attemptReconnect(gameId, address) {
    if (this.connectionState === 'reconnecting') {
      return
    }

    this.connectionState = 'reconnecting'
    this.reconnectAttempts++
    
    console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
    
    // Exponential backoff for Chrome
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000)
    
    setTimeout(async () => {
      try {
        await this.connect(gameId, address)
      } catch (error) {
        console.error('❌ Reconnection failed:', error)
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect(gameId, address)
        }
      }
    }, delay)
  }

  // Join game room
  joinRoom(roomId) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({
          type: 'join_room',
          roomId: roomId
        }))
        console.log('🎮 Joined room:', roomId)
      } catch (error) {
        console.error('❌ Error joining room:', error)
      }
    }
  }

  // Register user
  registerUser(address) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({
          type: 'register_user',
          address: address
        }))
        console.log('👤 Registered user:', address)
      } catch (error) {
        console.error('❌ Error registering user:', error)
      }
    }
  }

  // Send message with error handling
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message))
        return true
      } catch (error) {
        console.error('❌ Error sending message:', error)
        return false
      }
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message')
      return false
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
}

export default WebSocketService
