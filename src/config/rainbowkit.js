import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base, mainnet, polygon, arbitrum, optimism, bsc, avalanche } from 'wagmi/chains'

console.log('Initializing Rainbow Kit with:', {
  projectId: 'fd95ed98ecab7ef051bdcaa27f9d0547',
  chains: [base, mainnet, polygon, arbitrum, optimism, bsc, avalanche]
})

// Define your supported chains - make sure they're properly imported
export const chains = [
  base,
  mainnet,
  polygon,
  arbitrum,
  optimism,
  bsc,
  avalanche
]

// Validate chains array
if (!chains || !Array.isArray(chains) || chains.length === 0) {
  console.error('❌ Chains array is invalid:', chains)
  throw new Error('Chains configuration is invalid')
}

// Validate each chain has required properties
chains.forEach((chain, index) => {
  if (!chain || !chain.id || !chain.name) {
    console.error(`❌ Invalid chain at index ${index}:`, chain)
    throw new Error(`Chain at index ${index} is invalid`)
  }
})

console.log('✅ Chains validated successfully:', chains.map(c => ({ id: c.id, name: c.name })))

// Get WalletConnect Project ID
const projectId = 'fd95ed98ecab7ef051bdcaa27f9d0547'

if (!projectId) {
  throw new Error('WalletConnect Project ID is required')
}

// Create the config using getDefaultConfig which handles all wallet setup
const config = getDefaultConfig({
  appName: 'FLIPNOSIS',
  projectId,
  chains,
  ssr: false, // Not using server-side rendering
})

console.log('✅ Rainbow Kit configuration created successfully')

export { config } 