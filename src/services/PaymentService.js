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
      const hash = await walletClient.sendTransaction({
        to,
        value: parseEther(value.toString()),
      })
      
      return { success: true, hash }
    } catch (error) {
      console.error('Transaction failed:', error)
      return { success: false, error: error.message }
    }
  }
}

export default PaymentService 