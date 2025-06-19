import { parseEther, formatEther } from 'viem'

export class PaymentService {
  static ETH_PRICE_USD = 2500 // Update periodically
  static FEE_RECIPIENT = '0xE1E3dFa98C39Ba5b6C643348420420aBC3556416'
  static LISTING_FEE_USD = 0.10

  static async calculateETHAmount(usdAmount, ethPriceUSD = this.ETH_PRICE_USD) {
    try {
      const ethAmount = usdAmount / ethPriceUSD
      const roundedEthAmount = Math.round(ethAmount * 100000000) / 100000000
      const finalEthAmount = Math.max(roundedEthAmount, 0.000001)
      
      console.log(`💰 Payment calculation: $${usdAmount} USD = ${finalEthAmount} ETH (price: $${ethPriceUSD}/ETH)`)
      
      return {
        success: true,
        ethAmount: parseFloat(finalEthAmount.toFixed(8)),
        weiAmount: parseEther(finalEthAmount.toFixed(18))
      }
    } catch (error) {
      console.error('Payment calculation error:', error)
      return {
        success: false,
        error: error.message,
        ethAmount: 0,
        weiAmount: 0n
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

  // Send transaction using Wagmi
  static async sendTransaction(walletClient, to, value) {
    if (!walletClient) {
      throw new Error('Wallet client not available')
    }

    try {
      console.log('📤 Sending transaction:', {
        to,
        value: value.toString(),
        valueInWei: parseEther(value.toString()).toString(),
        from: walletClient.account.address
      })

      // Get current gas prices from the network
      let feeData
      try {
        feeData = await walletClient.estimateFeesPerGas()
        console.log('📡 Raw fee estimation from network:', feeData)
      } catch (error) {
        console.warn('⚠️ Failed to estimate fees, using fallback:', error)
        // Fallback gas prices for Base network
        feeData = {
          maxFeePerGas: parseEther('0.000000002'), // 2 gwei
          maxPriorityFeePerGas: parseEther('0.000000001') // 1 gwei
        }
      }
      
      // Set minimum acceptable fees for Base network (higher minimum)
      const minBaseFee = parseEther('0.000000002') // 2 gwei minimum
      const minPriorityFee = parseEther('0.000000001') // 1 gwei minimum
      
      const maxFeePerGas = feeData.maxFeePerGas && feeData.maxFeePerGas > minBaseFee 
        ? feeData.maxFeePerGas 
        : minBaseFee

      const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas && feeData.maxPriorityFeePerGas > minPriorityFee
        ? feeData.maxPriorityFeePerGas
        : minPriorityFee

      console.log('💰 Final gas fees being used:', {
        maxFeePerGas: maxFeePerGas.toString() + ' wei (' + (Number(maxFeePerGas) / 1e9).toFixed(2) + ' gwei)',
        maxPriorityFeePerGas: maxPriorityFeePerGas.toString() + ' wei (' + (Number(maxPriorityFeePerGas) / 1e9).toFixed(2) + ' gwei)',
        originalEstimation: feeData
      })

      // Try direct transaction first (bypassing prepareTransactionRequest which might have gas issues)
      let hash
      try {
        console.log('🎯 Attempting direct transaction...')
        hash = await walletClient.sendTransaction({
          to,
          value: parseEther(value.toString()),
          gas: 21000n, // Standard ETH transfer gas
          maxFeePerGas,
          maxPriorityFeePerGas
        })
        console.log('✅ Direct transaction succeeded!')
      } catch (directError) {
        console.warn('⚠️ Direct transaction failed, trying with prepareTransactionRequest:', directError.message)
        
        // Fallback to prepareTransactionRequest
        const request = await walletClient.prepareTransactionRequest({
          to,
          value: parseEther(value.toString()),
          chain: walletClient.chain,
          account: walletClient.account,
          maxFeePerGas,
          maxPriorityFeePerGas
        })

        hash = await walletClient.sendTransaction(request)
      }
      
      console.log('✅ Transaction sent:', hash)
      
      return { success: true, hash }
    } catch (error) {
      console.error('Transaction failed:', error)
      return { success: false, error: error.message }
    }
  }
}

export default PaymentService 