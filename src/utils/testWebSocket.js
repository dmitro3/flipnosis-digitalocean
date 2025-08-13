// Test file to verify WebSocket service functionality
import webSocketService from '../services/WebSocketService'

console.log('🧪 Testing WebSocket service...')

// Test 1: Check if service is properly imported
console.log('Test 1 - Service import:', webSocketService)
console.log('Test 1 - Service type:', typeof webSocketService)
console.log('Test 1 - Service methods:', webSocketService ? Object.getOwnPropertyNames(Object.getPrototypeOf(webSocketService)) : 'null')

// Test 2: Check if isConnected method exists
if (webSocketService) {
  console.log('Test 2 - isConnected method exists:', typeof webSocketService.isConnected === 'function')
  console.log('Test 2 - isInitialized method exists:', typeof webSocketService.isInitialized === 'function')
  
  // Test 3: Call isConnected method
  try {
    const connected = webSocketService.isConnected()
    console.log('Test 3 - isConnected result:', connected)
  } catch (error) {
    console.error('Test 3 - Error calling isConnected:', error)
  }
  
  // Test 4: Call isInitialized method
  try {
    const initialized = webSocketService.isInitialized()
    console.log('Test 4 - isInitialized result:', initialized)
  } catch (error) {
    console.error('Test 4 - Error calling isInitialized:', error)
  }
} else {
  console.error('Test 2-4 - WebSocket service is null or undefined')
}

console.log('🧪 WebSocket service test complete')
