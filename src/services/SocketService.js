// services/SocketService.js
// Clean Socket.io implementation - much simpler than WebSocket!

import { io } from 'socket.io-client'
import { getWsUrl } from '../config/api'

class SocketService {
  constructor() {
    this.socket = null
    this.connected = false
    this.gameId = null
    this.address = null
    this.currentRoom = null
  }

  connect(gameId, address) {
    // Validate parameters
    if (!gameId) {
      console.error('❌ SocketService.connect: gameId is required')
      return Promise.reject(new Error('gameId is required'))
    }
    
    // If already connected to this room, just return
    const roomId = `game_${gameId.replace('game_', '')}`
    
    if (this.connected && this.currentRoom === roomId && this.socket) {
      console.log('✅ Already connected to room:', roomId)
      return Promise.resolve()
    }

    // Disconnect from previous room if different
    if (this.socket && this.currentRoom !== roomId) {
      console.log(`🔄 Switching rooms from ${this.currentRoom} to ${roomId}`)
      this.disconnect()
    }

    // If already connecting, wait for it to complete
    if (this.connecting) {
      console.log('⏳ Already connecting, waiting...')
      return new Promise((resolve) => {
        const checkConnection = () => {
          if (!this.connecting) {
            resolve()
          } else {
            setTimeout(checkConnection, 100)
          }
        }
        checkConnection()
      })
    }

    this.currentRoom = roomId
    this.gameId = gameId ? gameId.replace('game_', '') : ''
    this.address = address
    this.connecting = true

    return new Promise((resolve, reject) => {
      try {
        // Connect to Socket.io server
        const wsUrl = getWsUrl()
        if (!wsUrl) {
          throw new Error('Failed to get WebSocket URL')
        }
        const socketUrl = wsUrl.replace('/ws', '') // Remove /ws suffix for socket.io
        console.log('🔌 Connecting to Socket.io:', socketUrl)
        
        this.socket = io(socketUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 2000,
          timeout: 10000,
          forceNew: true // Force new connection
        })

        // Connection established
        this.socket.on('connect', () => {
          console.log('✅ Socket.io connected')
          this.connected = true
          this.connecting = false
          
          // Join game room
          this.emit('join_room', {
            roomId: roomId,
            address: address
          })
          
          resolve()
        })

        // Handle disconnection
        this.socket.on('disconnect', (reason) => {
          console.log('🔌 Socket.io disconnected:', reason)
          this.connected = false
        })

        // Handle reconnection
        this.socket.on('reconnect', (attemptNumber) => {
          console.log('🔄 Socket.io reconnected after', attemptNumber, 'attempts')
          this.connected = true
          
          // Rejoin room after reconnection
          this.emit('join_room', {
            roomId: this.currentRoom,
            address: this.address
          })
        })

        // Handle errors
        this.socket.on('connect_error', (error) => {
          console.error('❌ Socket.io connection error:', error.message)
          this.connecting = false
          if (!this.connected) {
            reject(error)
          }
        })

      } catch (error) {
        console.error('❌ Failed to create Socket.io connection:', error)
        reject(error)
      }
    })
  }

  // Emit events to server
  emit(eventName, data) {
    if (this.socket && this.connected) {
      this.socket.emit(eventName, data)
      console.log('📤 Emitted:', eventName)
      return true
    } else {
      console.warn('⚠️ Not connected, cannot emit:', eventName)
      return false
    }
  }

  // Listen for events (wrapper for socket.on)
  on(eventName, handler) {
    if (this.socket) {
      this.socket.on(eventName, handler)
      console.log('✅ Listener registered for:', eventName)
    }
  }

  // Remove event listener
  off(eventName, handler) {
    if (this.socket) {
      this.socket.off(eventName, handler)
      console.log('✅ Listener removed for:', eventName)
    }
  }

  // Disconnect and cleanup
  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting Socket.io...')
      this.socket.disconnect()
      this.socket = null
      this.connected = false
      this.currentRoom = null
    }
  }

  // Check connection status
  isConnected() {
    return this.connected && this.socket && this.socket.connected
  }

  // Get current room
  getCurrentRoom() {
    return this.currentRoom
  }
}

// Create singleton instance
const socketService = new SocketService()

// Make it globally available for debugging
if (typeof window !== 'undefined') {
  window.socketService = socketService
  window.FlipnosisSocket = socketService // Alias for compatibility
}

export default socketService
