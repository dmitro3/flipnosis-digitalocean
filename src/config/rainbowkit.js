import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base, mainnet, polygon, arbitrum, optimism, bsc, avalanche } from 'wagmi/chains'
import { createConfig, http } from 'wagmi'

// Chains configuration
export const chains = [
  base,
  mainnet,
  polygon,
  arbitrum,
  optimism,
  bsc,
  avalanche
]

// WalletConnect Project ID
const projectId = 'fd95ed98ecab7ef051bdcaa27f9d0547'

// Create config with proper RPC endpoints and simplified setup
export const config = getDefaultConfig({
  appName: 'FLIPNOSIS',
  projectId,
  chains,
  ssr: false,
  // Use default transports with fallback to public RPC
  transports: {
    [base.id]: http('https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3', {
      batch: true,
      retryCount: 3,
      retryDelay: 1000
    }),
    [mainnet.id]: http('https://eth-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3', {
      batch: true,
      retryCount: 3,
      retryDelay: 1000
    }),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [bsc.id]: http(),
    [avalanche.id]: http(),
  },
})

console.log('✅ Rainbow Kit configuration created successfully')

export { config as wagmiConfig }