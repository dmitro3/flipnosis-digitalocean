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

// Detect if we're in Chrome
const isChrome = typeof window !== 'undefined' && 
  /Chrome/.test(navigator.userAgent) && 
  /Google Inc/.test(navigator.vendor);

// Before creating config, add Chrome-specific fixes:
if (isChrome) {
  // Disable problematic wallet connectors in Chrome
  console.log('🔍 Chrome detected, applying compatibility fixes...');
  
  // Override window.ethereum if it's causing issues
  if (window.ethereum && window.ethereum.providers) {
    // Filter out problematic providers
    const providers = window.ethereum.providers.filter(p => {
      try {
        // Test if provider is accessible
        return p && p.request;
      } catch (e) {
        return false;
      }
    });
    
    if (providers.length === 1) {
      window.ethereum = providers[0];
    }
  }
}

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

// Check if we're on mobile
const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

// Check for Chrome extensions that might cause conflicts
const hasChromeExtensions = typeof window !== 'undefined' && window.chrome && window.chrome.runtime

// Add Chrome extension conflict handling
if (hasChromeExtensions) {
  console.log('🔍 Chrome extensions detected, adding conflict handling...')
  
  // Override console.error to filter out Chrome extension errors
  const originalConsoleError = console.error
  console.error = (...args) => {
    const message = args.join(' ')
    if (message.includes('chrome-extension://') || message.includes('Cannot read properties of null')) {
      console.warn('⚠️ Chrome extension error filtered:', message)
      return
    }
    originalConsoleError.apply(console, args)
  }
}

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