import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base, mainnet, polygon, arbitrum, optimism } from 'wagmi/chains'

// Define your supported chains
export const chains = [
  base,
  mainnet,
  polygon,
  arbitrum,
  optimism
]

// Get WalletConnect Project ID
const projectId = 'fd95ed98ecab7ef051bdcaa27f9d0547'

export const config = getDefaultConfig({
  appName: 'FLIPNOSIS',
  projectId,
  chains,
  ssr: false, // If using SSR, set this to true
}) 