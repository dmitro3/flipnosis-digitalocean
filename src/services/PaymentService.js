import { parseEther, formatEther } from 'viem'

export class PaymentService {
  static ETH_PRICE_USD = 2500 // Update periodically
  static FEE_RECIPIENT = '0x47d80671Bcb7Ec368ef4d3ca6E1C20173CCc9a28'
  static LISTING_FEE_USD = 0.10

  static async calculateETHAmount(priceUSD) {
    try {
      // Hardcoded ETH price for now (you can fetch this from an API)
      const ethPriceUSD = 2500 // $2500 per ETH
      
      // Calculate ETH amount
      const ethAmount = priceUSD / ethPriceUSD
      
      // Ensure minimum amount for Base network
      const minAmount = 0.000001 // Minimum viable amount
      
      return {
        success: true,
        ethAmount: Math.max(ethAmount, minAmount),
        ethPrice: ethPriceUSD
      }
    } catch (error) {
      console.error('Error calculating ETH amount:', error)
      return {
        success: false,
        error: error.message,
        ethAmount: 0.000001
      }
    }
  }

  static async buildTransaction(to, valueWei, publicClient) {
    try {
      console.log('🔧 Building transaction for Base network...')
      
      // Get gas estimate
      const gasEstimate = await publicClient.estimateGas({
        to,
        value: valueWei,
      })

      // Add 20% buffer to gas estimate
      const gasLimit = gasEstimate * 120n / 100n

      console.log('✅ Transaction config ready:', {
        to,
        value: formatEther(valueWei),
        gasLimit: gasLimit.toString()
      })

      return { 
        success: true, 
        txConfig: {
          to,
          value: valueWei,
          gas: gasLimit
        }
      }
    } catch (error) {
      console.error('❌ Error building transaction:', error)
      return { 
        success: false, 
        error: error.message
      }
    }
  }

  static getListingFeeUSD() {
    return this.LISTING_FEE_USD
  }

  static getFeeRecipient() {
    return this.FEE_RECIPIENT
  }

  static calculateETHFee(usdAmount) {
    try {
      const ethAmount = usdAmount / this.ETH_PRICE_USD
      const roundedEthAmount = Math.round(ethAmount * 100000000) / 100000000
      const finalEthAmount = Math.max(roundedEthAmount, 0.000001)
      
      return {
        success: true,
        ethAmount: parseFloat(finalEthAmount.toFixed(8)),
        usdAmount,
        ethPriceUsed: this.ETH_PRICE_USD
      }
    } catch (error) {
      console.error('Error calculating ETH fee:', error)
      return {
        success: false,
        error: error.message,
        ethAmount: 0.000001
      }
    }
  }

  // Send transaction using Wagmi with retry logic
  static async sendTransaction(walletClient, to, value, retries = 3) {
    if (!walletClient) {
      throw new Error('Wallet client not available')
    }

    let lastError = null
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        console.log(`📤 Sending transaction (attempt ${attempt + 1}/${retries}):`, {
          to,
          value: value.toString(),
          valueInWei: parseEther(value.toString()).toString(),
          from: walletClient.account.address
        })

        // Get current gas prices with retry logic
        let feeData
        try {
          feeData = await walletClient.estimateFeesPerGas()
          console.log('📡 Fee estimation from network:', feeData)
        } catch (error) {
          console.warn('⚠️ Failed to estimate fees, using fallback:', error)
          // Fallback gas prices for Base network
          feeData = {
            maxFeePerGas: 200000000n, // 0.2 gwei
            maxPriorityFeePerGas: 100000000n // 0.1 gwei
          }
        }
        
        // Set minimum acceptable fees for Base network
        const minBaseFee = 100000000n // 0.1 gwei minimum
        const minPriorityFee = 100000000n // 0.1 gwei minimum
        
        const maxFeePerGas = feeData.maxFeePerGas && feeData.maxFeePerGas > minBaseFee 
          ? feeData.maxFeePerGas 
          : minBaseFee

        const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas && feeData.maxPriorityFeePerGas > minPriorityFee
          ? feeData.maxPriorityFeePerGas
          : minPriorityFee

        console.log('💰 Gas fees being used:', {
          maxFeePerGas: `${maxFeePerGas} wei (${Number(maxFeePerGas) / 1e9} gwei)`,
          maxPriorityFeePerGas: `${maxPriorityFeePerGas} wei (${Number(maxPriorityFeePerGas) / 1e9} gwei)`
        })

        // Try transaction with proper gas settings
        const hash = await walletClient.sendTransaction({
          to,
          value: parseEther(value.toString()),
          gas: 21000n, // Standard ETH transfer gas
          maxFeePerGas,
          maxPriorityFeePerGas
        })
        
        console.log('✅ Transaction sent successfully!', hash)
        return {
          success: true,
          hash,
          attempt: attempt + 1
        }
        
      } catch (error) {
        lastError = error
        console.error(`❌ Transaction attempt ${attempt + 1} failed:`, error)
        
        // Check if it's a rate limit or network busy error
        if (error.message.includes('rate limit') || 
            error.message.includes('429') || 
            error.message.includes('network busy') ||
            error.message.includes('replacement fee too low')) {
          
          // Wait with exponential backoff
          const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000)
          console.log(`⏳ Network busy, waiting ${waitTime}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }
        
        // For other errors, throw immediately
        throw error
      }
    }
    
    // If we exhausted all retries
    throw new Error(`Transaction failed after ${retries} attempts. ${lastError?.message || 'Unknown error'}`)
  }

  // Wait for transaction with better error handling
  static async waitForTransaction(publicClient, hash, confirmations = 2) {
    try {
      console.log(`⏳ Waiting for transaction ${hash} to be confirmed...`)
      
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations,
        timeout: 60000 // 60 second timeout
      })
      
      if (receipt.status === 'reverted') {
        throw new Error('Transaction reverted')
      }
      
      console.log(`✅ Transaction confirmed with ${confirmations} confirmations`)
      return receipt
      
    } catch (error) {
      console.error('Error waiting for transaction:', error)
      
      // Check if transaction was actually successful despite the error
      try {
        const receipt = await publicClient.getTransactionReceipt({ hash })
        if (receipt && receipt.status === 'success') {
          return receipt
        }
      } catch (e) {
        // Ignore, original error will be thrown
      }
      
      throw error
    }
  }

  // Format ETH amount for display
  static formatETH(value) {
    try {
      return formatEther(value)
    } catch (error) {
      console.error('Error formatting ETH:', error)
      return '0'
    }
  }

  // Parse ETH amount from string
  static parseETH(value) {
    try {
      return parseEther(value)
    } catch (error) {
      console.error('Error parsing ETH:', error)
      return 0n
    }
  }

  // Validate transaction parameters
  static validateTransaction(to, value) {
    if (!to || !/^0x[a-fA-F0-9]{40}$/.test(to)) {
      throw new Error('Invalid recipient address')
    }
    
    if (!value || parseFloat(value) <= 0) {
      throw new Error('Invalid transaction value')
    }
    
    if (parseFloat(value) < 0.000001) {
      throw new Error('Transaction value too small (minimum 0.000001 ETH)')
    }
    
    return true
  }

  // Get readable error message
  static getReadableError(error) {
    const errorMessage = error.message || error.toString()
    
    if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
      return 'Network is busy. Please try again in a few seconds.'
    }
    
    if (errorMessage.includes('insufficient funds')) {
      return 'Insufficient funds for transaction.'
    }
    
    if (errorMessage.includes('user rejected') || errorMessage.includes('User denied')) {
      return 'Transaction cancelled by user.'
    }
    
    if (errorMessage.includes('network busy')) {
      return 'Network is congested. Please try again.'
    }
    
    if (errorMessage.includes('replacement fee too low')) {
      return 'Network is busy. Please try again with higher gas fees.'
    }
    
    if (errorMessage.includes('nonce too low')) {
      return 'Transaction conflict detected. Please refresh and try again.'
    }
    
    return errorMessage
  }
}

export default PaymentService 