const { ethers } = require('ethers')
require('dotenv').config()

// Mock ContractService for testing rate limiting
class MockContractService {
  constructor() {
    this.currentRpcIndex = 0
    this.lastRequestTime = 0
    this.requestCount = 0
    this.rateLimitResetTime = 0
    this.requestHistory = []
  }

  async waitForRateLimit() {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    
    // Reset rate limit counter if enough time has passed
    if (now > this.rateLimitResetTime) {
      this.requestCount = 0
      this.rateLimitResetTime = now + 60000 // Reset every minute
    }
    
    // Enforce minimum delay between requests
    if (timeSinceLastRequest < 200) { // 200ms minimum delay
      await new Promise(resolve => setTimeout(resolve, 200 - timeSinceLastRequest))
    }
    
    this.lastRequestTime = Date.now()
    this.requestCount++
    this.requestHistory.push({ timestamp: now, requestCount: this.requestCount })
  }
  
  switchToNextRpc() {
    this.currentRpcIndex = (this.currentRpcIndex + 1) % 4
    console.log(`🔄 Switched to RPC endpoint ${this.currentRpcIndex + 1}/4`)
  }
  
  async executeWithRetry(operation, maxRetries = 3) {
    let lastError = null
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.waitForRateLimit()
        return await operation()
      } catch (error) {
        lastError = error
        console.warn(`⚠️ Attempt ${attempt + 1} failed:`, error.message)
        
        // Check if it's a rate limit error
        if (error.message.includes('429') || error.message.includes('rate limit') || error.message.includes('over rate limit')) {
          console.log(`🔄 Rate limit hit, switching RPC endpoint and retrying...`)
          this.switchToNextRpc()
          
          // Wait longer for rate limit errors
          const delay = Math.min(2000 * (attempt + 1), 5000)
          await new Promise(resolve => setTimeout(resolve, delay))
        } else if (attempt < maxRetries) {
          // For other errors, use exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw lastError
  }

  // Mock getETHAmount function
  async getETHAmount(usdAmount) {
    return await this.executeWithRetry(async () => {
      // Simulate a network request
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Simulate rate limit error occasionally
      if (Math.random() < 0.3) {
        throw new Error('HTTP request failed. Status: 429 URL: https://mainnet.base.org Details: {"code":-32016,"message":"over rate limit"}')
      }
      
      // Return mock ETH amount
      return ethers.parseEther('0.001') // 0.001 ETH
    })
  }
}

async function testRateLimiting() {
  console.log('🧪 Testing rate limiting and retry logic...')
  
  const contractService = new MockContractService()
  
  try {
    // Test multiple concurrent requests
    const promises = []
    for (let i = 0; i < 5; i++) {
      promises.push(
        contractService.getETHAmount(1000000) // $1 USD
          .then(result => {
            console.log(`✅ Request ${i + 1} successful:`, ethers.formatEther(result), 'ETH')
            return result
          })
          .catch(error => {
            console.error(`❌ Request ${i + 1} failed:`, error.message)
            throw error
          })
      )
    }
    
    const results = await Promise.all(promises)
    console.log('🎉 All requests completed successfully!')
    console.log('📊 Request history:', contractService.requestHistory.length, 'requests made')
    console.log('🔄 RPC switches:', contractService.currentRpcIndex)
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testRateLimiting().catch(console.error) 