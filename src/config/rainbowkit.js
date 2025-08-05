import { getDefaultConfig, connectorsForWallets } from '@rainbow-me/rainbowkit'
import { 
  metaMaskWallet,
  rainbowWallet,
  coinbaseWallet,
  walletConnectWallet,
  trustWallet,
  injectedWallet
} from '@rainbow-me/rainbowkit/wallets'
import { base, mainnet, polygon, arbitrum, optimism, bsc, avalanche } from 'wagmi/chains'
import { createConfig, http } from 'wagmi'

// Enhanced error handling for chain imports
try {
  console.log('Initializing Rainbow Kit with:', {
    projectId: 'fd95ed98ecab7ef051bdcaa27f9d0547',
    chains: [base, mainnet, polygon, arbitrum, optimism, bsc, avalanche]
  })
} catch (error) {
  console.error('❌ Error logging Rainbow Kit initialization:', error)
}

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

// Check if we're on mobile
const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

// Create custom connectors to handle MetaMask mobile properly
let config

if (isMobile) {
  // On mobile, use a custom configuration that prioritizes direct connection for MetaMask
  const connectors = connectorsForWallets(
    [
      {
        groupName: 'Popular',
        wallets: [
          injectedWallet, // This will handle MetaMask on mobile without WalletConnect
          coinbaseWallet,
          rainbowWallet,
          trustWallet,
          walletConnectWallet, // Generic WalletConnect for other wallets
        ],
      },
    ],
    {
      appName: 'FLIPNOSIS',
      projectId,
    }
  )

  config = createConfig({
    chains,
    connectors,
    transports: {
      [base.id]: http(),
      [mainnet.id]: http(),
      [polygon.id]: http(),
      [arbitrum.id]: http(),
      [optimism.id]: http(),
      [bsc.id]: http(),
      [avalanche.id]: http(),
    },
  })
} else {
  // On desktop, use the default config which handles everything automatically
  config = getDefaultConfig({
    appName: 'FLIPNOSIS',
    projectId,
    chains,
    ssr: false,
  })
}

console.log('✅ Rainbow Kit configuration created successfully')

export { config } 