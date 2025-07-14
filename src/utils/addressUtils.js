/**
 * Utility functions for handling wallet addresses
 */

/**
 * Formats an address to show first 6 and last 4 characters
 * @param {string} address - The wallet address to format
 * @param {string} fallback - Fallback text if address is invalid
 * @returns {string} Formatted address or fallback
 */
export const formatAddress = (address, fallback = 'Unknown') => {
  if (!address || typeof address !== 'string' || address.length < 10) {
    return fallback
  }
  
  try {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  } catch (error) {
    console.warn('Error formatting address:', error)
    return fallback
  }
}

/**
 * Validates if an address is a valid Ethereum address format
 * @param {string} address - The address to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidAddress = (address) => {
  if (!address || typeof address !== 'string') {
    return false
  }
  
  // Basic Ethereum address validation (0x + 40 hex characters)
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Gets the display name for an address, with fallback to formatted address
 * @param {string} address - The wallet address
 * @param {string} customName - Custom name if available
 * @returns {string} Display name
 */
export const getDisplayName = (address, customName = null) => {
  if (customName) {
    return customName
  }
  
  return formatAddress(address)
} 