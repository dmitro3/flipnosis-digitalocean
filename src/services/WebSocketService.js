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

        this.ws = new WebSocket(wsUrl)

        // Connection timeout
        const connectionTimeout = setTimeout(() => {
          if (this.ws.readyState === WebSocket.CONNECTING) {
            console.log('⏰ WebSocket connection timeout')
            this.ws.close()
            reject(new Error('Connection timeout'))
          }
        }, 10000)

        this.ws.onopen = () => {
          console.log('🔌 WebSocket connected successfully')
          clearTimeout(connectionTimeout)
          this.connectionState = 'connected'
          this.reconnectAttempts = 0

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
          clearTimeout(connectionTimeout)
          this.connectionState = 'disconnected'
          reject(error)
        }

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket disconnected:', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          })
          
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
        this.connectionState = 'disconnected'
        reject(error)
      }
    })

    return this.connectionPromise
  }

  // Attempt to reconnect
  async attemptReconnect(gameId, address) {
    if (this.connectionState === 'reconnecting') {
      return
    }

    this.connectionState = 'reconnecting'
    this.reconnectAttempts++

    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)

    setTimeout(async () => {
      try {
        await this.connect(gameId, address)
      } catch (error) {
        console.error('❌ Reconnection failed:', error)
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect(gameId, address)
        } else {
          console.error('❌ Max reconnection attempts reached')
          this.connectionState = 'disconnected'
        }
      }
    }, this.reconnectDelay * this.reconnectAttempts)
  }

  // Join a game room
  joinRoom(roomId) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ Cannot join room - WebSocket not connected')
      return
    }

    try {
      this.ws.send(JSON.stringify({
        type: 'join_room',
        roomId: roomId
      }))
      console.log('🏠 Joined game room:', roomId)
    } catch (error) {
      console.error('❌ Failed to join room:', error)
    }
  }

  // Register user
  registerUser(address) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ Cannot register user - WebSocket not connected')
      return
    }

    try {
      this.ws.send(JSON.stringify({
        type: 'register_user',
        address: address
      }))
      console.log('👤 Registered user:', address)
    } catch (error) {
      console.error('❌ Failed to register user:', error)
    }
  }

  // Send a message
  send(message) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ Cannot send message - WebSocket not connected')
      console.warn('🔍 WebSocket state:', this.ws ? this.ws.readyState : 'null')
      return false
    }

    try {
      const messageStr = JSON.stringify(message)
      this.ws.send(messageStr)
      console.log('📤 Sent WebSocket message:', message.type, message)
      return true
    } catch (error) {
      console.error('❌ Failed to send message:', error)
      return false
    }
  }

  // Handle incoming messages
  handleMessage(event) {
    try {
      console.log('📨 Raw WebSocket message received:', event.data)
      const data = JSON.parse(event.data)
      console.log('📨 Parsed WebSocket message:', data)

      // Call registered handlers
      if (this.messageHandlers.has(data.type)) {
        console.log(`📨 Found ${this.messageHandlers.get(data.type).length} handlers for message type: ${data.type}`)
        this.messageHandlers.get(data.type).forEach((handler, index) => {
          try {
            console.log(`📨 Calling handler ${index + 1} for ${data.type}`)
            handler(data)
          } catch (error) {
            console.error('❌ Error in message handler:', error)
          }
        })
      } else {
        console.log('📨 No handlers for message type:', data.type)
        console.log('📨 Available handlers:', Array.from(this.messageHandlers.keys()))
      }
    } catch (error) {
      console.error('❌ Error parsing WebSocket message:', error, 'Raw data:', event.data)
    }
  }

  // Register a message handler
  on(messageType, handler) {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, [])
    }
    this.messageHandlers.get(messageType).push(handler)
  }

  // Remove a message handler
  off(messageType, handler) {
    if (this.messageHandlers.has(messageType)) {
      const handlers = this.messageHandlers.get(messageType)
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

  // Get the WebSocket instance
  getWebSocket() {
    return this.ws
  }

  // Disconnect
  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.connectionState = 'disconnected'
    this.messageHandlers.clear()
  }

  // Send game action
  sendGameAction(action, data) {
    return this.send({
      type: 'GAME_ACTION',
      gameId: data.gameId,
      action: action,
      ...data
    })
  }

  // Send player choice
  sendPlayerChoice(gameId, player, choice) {
    return this.sendGameAction('MAKE_CHOICE', {
      gameId,
      player,
      choice
    })
  }

  // Send power charge
  sendPowerCharge(gameId, player, powerLevel) {
    return this.sendGameAction('POWER_CHARGED', {
      gameId,
      player,
      powerLevel
    })
  }

  // Send power charge start
  sendPowerChargeStart(gameId, player) {
    return this.sendGameAction('POWER_CHARGE_START', {
      gameId,
      player
    })
  }

  // Send auto flip
  sendAutoFlip(gameId, player, choice) {
    return this.sendGameAction('AUTO_FLIP', {
      gameId,
      player,
      choice
    })
  }
}

// Create singleton instance
const webSocketService = new WebSocketService()

export default webSocketService
