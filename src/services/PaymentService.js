import { ethers } from 'ethers'

export class PaymentService {
  static ETH_PRICE_USD = 2500 // Update periodically
  static FEE_RECIPIENT = '0xE1E3dFa98C39Ba5b6C643348420420aBC3556416'
  static LISTING_FEE_USD = 0.30

  static async calculateETHAmount(usdAmount, ethPriceUSD = this.ETH_PRICE_USD) {
    try {
      // Calculate ETH amount with proper precision handling
      const ethAmount = usdAmount / ethPriceUSD
      
      // Round to 8 decimal places to avoid ethers.js precision issues
      const roundedEthAmount = Math.round(ethAmount * 100000000) / 100000000
      
      // Ensure minimum amount (ethers.js needs at least some wei)
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
      const feeData = await provider.getFeeData()
      
      const txConfig = {
        to,
        value: valueWei,
        gasLimit: 100000
      }

      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        const maxPriorityFee = feeData.maxPriorityFeePerGas
        const baseFee = feeData.maxFeePerGas - maxPriorityFee
        
        txConfig.maxFeePerGas = baseFee + (maxPriorityFee * 110n / 100n)
        txConfig.maxPriorityFeePerGas = maxPriorityFee * 110n / 100n
      } else if (feeData.gasPrice) {
        txConfig.gasPrice = feeData.gasPrice * 110n / 100n
      }

      return { success: true, txConfig }
    } catch (error) {
      return { success: false, error: error.message }
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
        ethAmount: 0.000001 // Fallback amount
      }
    }
  }
}

export default PaymentService 