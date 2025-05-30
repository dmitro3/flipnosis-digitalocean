import { ethers } from 'ethers'
import { PaymentToken } from '../services/ContractService'

// Example ETH price in USD (you should get this from an oracle in production)
const ETH_PRICE_USD = 2000

/**
 * Calculate the required payment amount in ETH based on USD price
 * @param {number} priceUSD - The price in USD
 * @param {PaymentToken} token - The payment token type
 * @returns {Promise<string>} The required payment amount in wei
 */
export const getRequiredPayment = async (priceUSD, paymentToken) => {
  // Simple ETH price conversion
  const ethPriceUSD = 2500 // You can make this dynamic later
  const ethAmount = priceUSD / ethPriceUSD
  return ethers.parseEther(ethAmount.toString())
}

/**
 * Format ETH amount to display
 * @param {string} weiAmount - Amount in wei
 * @returns {string} Formatted ETH amount
 */
export const formatETHAmount = (weiAmount) => {
  try {
    const ethAmount = ethers.formatEther(weiAmount)
    return `${ethAmount} ETH`
  } catch (error) {
    console.error('Error formatting ETH amount:', error)
    return '0 ETH'
  }
} 