import { ethers } from 'ethers'
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
        weiAmount: ethers.parseEther(finalEthAmount.toFixed(18))
      }
    } catch (error) {
      console.error('Payment calculation error:', error)
      return {
        success: false,
        error: error.message,
        ethAmount: 0,
        weiAmount: 0
      }
    }
  }

  static async buildTransaction(to, valueWei, provider) {
    try {
      console.log('🔧 Building transaction for Base network...')
      
      // Simple transaction config for Base network
      const txConfig = {
        to,
        value: valueWei,
        gasLimit: 21000 // Standard ETH transfer
      }

      try {
        // Try to get gas price (fallback method for Base)
        const gasPrice = await provider.getGasPrice()
        txConfig.gasPrice = gasPrice * 120n / 100n // 20% buffer
        console.log('✅ Using legacy gas price:', ethers.formatUnits(txConfig.gasPrice, 'gwei'), 'gwei')
      } catch (gasPriceError) {
        // Ultimate fallback
        console.warn('⚠️ Using fallback gas price')
        txConfig.gasPrice = ethers.parseUnits('1', 'gwei') // 1 gwei fallback for Base
      }

      console.log('✅ Transaction config ready:', {
        to: txConfig.to,
        value: ethers.formatEther(txConfig.value),
        gasLimit: txConfig.gasLimit.toString(),
        gasPrice: ethers.formatUnits(txConfig.gasPrice, 'gwei') + ' gwei'
      })

      return { success: true, txConfig }
    } catch (error) {
      console.error('❌ Error building transaction:', error)
      return { 
        success: false, 
        error: error.message,
        txConfig: {
          to,
          value: valueWei,
          gasLimit: 21000,
          gasPrice: ethers.parseUnits('1', 'gwei')
        }
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

  // Add new method for Wagmi transactions
  static async sendTransactionWithWagmi(walletClient, to, value) {
    if (!walletClient) {
      throw new Error('Wallet client not available')
    }

    try {
      const hash = await walletClient.sendTransaction({
        to,
        value: parseEther(value.toString()),
      })
      
      return { hash }
    } catch (error) {
      console.error('Transaction failed:', error)
      throw error
    }
  }
}

export default PaymentService 