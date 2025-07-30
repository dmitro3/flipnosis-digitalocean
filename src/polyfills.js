// Polyfills for browser compatibility
import { Buffer } from 'buffer'
import process from 'process'

// Make Buffer and process available globally
window.Buffer = Buffer
window.process = process

// EventEmitter polyfill if needed
if (typeof window !== 'undefined' && !window.EventEmitter) {
  class EventEmitter {
    constructor() {
      this._events = {}
      this._maxListeners = 10
    }

    on(event, listener) {
      if (!this._events[event]) {
        this._events[event] = []
      }
      this._events[event].push(listener)
      return this
    }

    once(event, listener) {
      const onceWrapper = (...args) => {
        this.off(event, onceWrapper)
        listener.apply(this, args)
      }
      return this.on(event, onceWrapper)
    }

    off(event, listener) {
      if (!this._events[event]) return this
      this._events[event] = this._events[event].filter(l => l !== listener)
      return this
    }

    emit(event, ...args) {
      if (!this._events[event]) return false
      this._events[event].forEach(listener => {
        try {
          listener.apply(this, args)
        } catch (error) {
          console.error('EventEmitter error:', error)
        }
      })
      return true
    }

    removeAllListeners(event) {
      if (event) {
        delete this._events[event]
      } else {
        this._events = {}
      }
      return this
    }
  }

  window.EventEmitter = EventEmitter
}

export default {} 