import { getWsUrl } from '../config/api'

class WebSocketService {
  constructor() {
    this.socket = null
    this.listeners = new Map()
    this.reconnectTimeout = null
    this.gameId = null
    this.userAddress = null
  }

  connect(gameId, userAddress) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.disconnect()
    }
    this.gameId = gameId
    this.userAddress = userAddress
    this.socket = new WebSocket(getWsUrl())
    this.socket.onopen = () => {
      console.log('WebSocket connected')
      // Subscribe to game
      if (gameId) {
        this.send({
          type: 'subscribe_game',
          gameId
        })
      }
      // Register user
      if (userAddress) {
        this.send({
          type: 'register_user',
          address: userAddress
        })
      }
      this.emit('connected')
    }
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.emit(data.type, data)
      } catch (error) {
        console.error('WebSocket message error:', error)
      }
    }
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.emit('error', error)
    }
    this.socket.onclose = () => {
      console.log('WebSocket disconnected')
      this.emit('disconnected')
      this.attemptReconnect()
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }

  attemptReconnect() {
    if (this.reconnectTimeout) return
    this.reconnectTimeout = setTimeout(() => {
      console.log('Attempting to reconnect...')
      this.connect(this.gameId, this.userAddress)
    }, 3000)
  }

  send(data) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket not connected, cannot send:', data)
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return
    const callbacks = this.listeners.get(event)
    const index = callbacks.indexOf(callback)
    if (index > -1) {
      callbacks.splice(index, 1)
    }
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return
    this.listeners.get(event).forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`Error in WebSocket listener for ${event}:`, error)
      }
    })
  }
}

export default new WebSocketService() 