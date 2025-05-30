import { ethers } from 'ethers'

export class PaymentService {
  static async calculateETHAmount(usdAmount, ethPriceUSD = 2500) {
    try {
      const ethAmount = usdAmount / ethPriceUSD
      return {
        success: true,
        ethAmount: parseFloat(ethAmount.toFixed(6)),
        weiAmount: ethers.parseEther(ethAmount.toString())
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        ethAmount: 0,
        weiAmount: 0
      }
    }
  }

  static async buildTransaction(to, valueWei, provider) {
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

    return txConfig
  }
} 