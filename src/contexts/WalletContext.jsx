import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAccount, useChainId, useSwitchChain, useWalletClient, usePublicClient } from 'wagmi'
import { useToast } from './ToastContext'
import { Alchemy, Network } from 'alchemy-sdk'
import { ethers } from 'ethers'

const WalletContext = createContext()

export const useWallet = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

export const WalletProvider = ({ children }) => {
  const { showSuccess, showError, showInfo } = useToast()
  const { address, isConnected, isConnecting } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  
  const [nfts, setNfts] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Chrome extension conflict detection
  const hasChromeExtensions = typeof window !== 'undefined' && window.chrome && window.chrome.runtime

  // Chain information
  const chains = {
    1: { name: 'Ethereum', symbol: 'ETH', network: Network.ETH_MAINNET },
    137: { name: 'Polygon', symbol: 'MATIC', network: Network.MATIC_MAINNET },
    8453: { name: 'Base', symbol: 'ETH', network: Network.BASE_MAINNET },
    42161: { name: 'Arbitrum', symbol: 'ETH', network: Network.ARB_MAINNET },
    10: { name: 'Optimism', symbol: 'ETH', network: Network.OPT_MAINNET },
    56: { name: 'BSC', symbol: 'BNB', network: Network.BSC_MAINNET },
    43114: { name: 'Avalanche', symbol: 'AVAX', network: Network.AVAX_MAINNET }
  }

  // Mobile detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  // Switch to Base network
  const switchToBase = async () => {
    try {
      await switchChain({ chainId: 8453 })
      showSuccess('Switched to Base network')
    } catch (error) {
      console.error('Network switch error:', error)
      showError('Failed to switch to Base network')
    }
  }

  // Load NFTs using Alchemy with hardcoded API key
  const loadNFTs = async () => {
    console.log('🚀 loadNFTs called with address:', address)
    
    if (!address) {
      console.log('❌ No address provided, skipping NFT load')
      return
    }
    
    setLoading(true)
    try {
      const currentChain = chains[chainId]
      console.log('🔍 Current chain info:', {
        chainId,
        currentChain,
        availableChains: Object.keys(chains)
      })
      
      if (!currentChain) {
        console.error('❌ Unsupported network:', chainId)
        throw new Error('Unsupported network')
      }

      // Use your actual Alchemy API key (protected by allowlist)
      const apiKey = 'hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3'
      console.log('🔑 Using Alchemy API key (protected by allowlist):', apiKey)

      // Initialize Alchemy
      console.log('🔧 Creating Alchemy instance with:', {
        apiKey: apiKey.substring(0, 10) + '...',
        network: currentChain.network
      })
      
      let alchemy
      try {
        alchemy = new Alchemy({
          apiKey,
          network: currentChain.network
        })
        console.log('✅ Alchemy instance created successfully')
      } catch (alchemyError) {
        console.error('❌ Failed to create Alchemy instance:', alchemyError)
        throw alchemyError
      }

      console.log('🔍 Loading NFTs for:', {
        address,
        chain: currentChain.name,
        network: currentChain.network
      })

      console.log('🔧 Alchemy configuration:', {
        apiKey: apiKey.substring(0, 10) + '...',
        network: currentChain.network
      })

      // Get NFTs for the address with pagination
      let allNFTs = []
      let pageKey = null
      
      console.log('🔍 Starting NFT fetch for address:', address)
      
      do {
        console.log('📦 Fetching NFTs page:', { pageKey })
        
        const nftsForOwner = await alchemy.nft.getNftsForOwner(address, {
          omitMetadata: false,
          pageKey: pageKey
        })

        console.log('📦 Raw NFTs from Alchemy:', {
          count: nftsForOwner.ownedNfts.length,
          pageKey: nftsForOwner.pageKey,
          totalCount: nftsForOwner.totalCount
        })

        allNFTs = [...allNFTs, ...nftsForOwner.ownedNfts]
        pageKey = nftsForOwner.pageKey
      } while (pageKey)

      console.log('🎨 Total NFTs found:', allNFTs.length)

      const formattedNFTs = await Promise.all(allNFTs.map(async (nft) => {
        // Enhanced image URL handling
        let imageUrl = ''
        
        // Try media first (most reliable)
        if (nft.media && nft.media.length > 0) {
          imageUrl = nft.media[0].gateway || nft.media[0].raw || ''
        }
        
        // Try image object if media not available
        if (!imageUrl && nft.image) {
          if (typeof nft.image === 'string') {
            imageUrl = nft.image
          } else if (typeof nft.image === 'object') {
            imageUrl = nft.image.originalUrl || nft.image.cachedUrl || nft.image.gateway || ''
          }
        }
        
        // Fallback to metadata image if available
        if (!imageUrl && nft.metadata && nft.metadata.image) {
          imageUrl = nft.metadata.image
        }

        // Fix IPFS URLs to use gateway
        if (imageUrl && imageUrl.startsWith('ipfs://')) {
          imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')
        }

        // Ensure HTTPS for security
        if (imageUrl && imageUrl.startsWith('http://')) {
          imageUrl = imageUrl.replace('http://', 'https://')
        }

        console.log('🖼️ NFT Image URL:', {
          name: nft.title || nft.name,
          finalUrl: imageUrl,
          media: nft.media?.[0]?.gateway,
          imageObject: nft.image,
          metadata: nft.metadata?.image
        })

        const formattedNft = {
          contractAddress: nft.contract.address,
          tokenId: nft.tokenId,
          name: nft.title || nft.name || `#${nft.tokenId}`,
          collection: nft.contract.name || 'Unknown Collection',
          image: imageUrl,
          chain: currentChain.name,
          description: nft.description || '',
          animationUrl: nft.media?.[0]?.format === 'mp4' ? nft.media[0].gateway : nft.animation_url || ''
        }

        return formattedNft
      }))

      console.log('✅ Loaded NFTs:', {
        count: formattedNFTs.length,
        nfts: formattedNFTs.map(nft => ({
          name: nft.name,
          image: nft.image,
          contractAddress: nft.contractAddress,
          tokenId: nft.tokenId
        }))
      })
      
      setNfts(formattedNFTs)
    } catch (error) {
      console.error('❌ Error loading NFTs:', error)
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      showError('Failed to load NFTs: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // DISABLED: Automatic NFT loading to prevent spam
  // NFTs will only be loaded manually when needed
  useEffect(() => {
    console.log('🔄 useEffect triggered:', { address, chainId, isConnected })
    console.log('🚫 Automatic NFT loading is DISABLED to prevent spam')
    console.log('📱 Current path:', window.location.pathname)
    
    // Always clear NFTs to prevent spam
    setNfts([])
    
    // Only load NFTs manually when explicitly requested
    console.log('💡 Use loadNFTsManually() to load NFTs when needed')
  }, [address, chainId])
  
  // Manual NFT loading function for when needed
  const loadNFTsManually = async () => {
    if (address) {
      console.log('📞 Manually loading NFTs for address:', address)
      try {
        await loadNFTs()
      } catch (error) {
        console.error('❌ Error manually loading NFTs:', error)
      }
    }
  }

  // Show connection success
  useEffect(() => {
    if (isConnected && address) {
      showSuccess(`Connected to ${address ? address.slice(0, 6) + '...' + address.slice(-4) : 'Unknown'}`)
    }
  }, [isConnected, address])

  // Debug logging for mobile (only in development)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🔍 WalletContext state:', {
        isConnected,
        address,
        chainId,
        hasWalletClient: !!walletClient,
        hasPublicClient: !!publicClient,
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      })
    }
  }, [isConnected, address, chainId, walletClient, publicClient])



  // Create a proper signer that works with the new walletClient
  const getSigner = () => {
    try {
      // Add immediate return if Chrome extension issues detected
      if (typeof window !== 'undefined' && window.chrome?.runtime) {
        try {
          // Test if wallet is accessible
          if (!walletClient || !walletClient.account?.address) {
            console.warn('⚠️ Wallet not ready in Chrome');
            return null;
          }
        } catch (e) {
          console.warn('⚠️ Chrome wallet access failed');
          return null;
        }
      }
      
      if (!walletClient || !publicClient) {
        return null;
      }

      // Create a signer that wraps the walletClient for ethers compatibility
      const signer = {
        // Basic signer interface
        getAddress: async () => {
          try {
            return walletClient.account?.address || null
          } catch (error) {
            console.warn('⚠️ Error getting address:', error)
            return null
          }
        },
        signMessage: async (message) => {
          try {
            if (!walletClient.signMessage) {
              throw new Error('Sign message not available')
            }
            return await walletClient.signMessage({ message })
          } catch (error) {
            console.warn('⚠️ Error signing message:', error)
            throw error
          }
        },
        signTransaction: async (transaction) => {
          // This is a simplified version - in practice, you'd use walletClient.writeContract
          console.warn('⚠️ signTransaction is deprecated. Use walletClient.writeContract instead.')
          throw new Error('Use walletClient.writeContract for transactions')
        },
        connect: () => signer,
        provider: {
          getNetwork: async () => {
            try {
              return { chainId: chainId || 1 }
            } catch (error) {
              console.warn('⚠️ Error getting network:', error)
              return { chainId: 1 }
            }
          },
          getBalance: async (address) => {
            try {
              if (!publicClient.getBalance) {
                throw new Error('Get balance not available')
              }
              return await publicClient.getBalance({ address })
            } catch (error) {
              console.warn('⚠️ Error getting balance:', error)
              throw error
            }
          }
        }
      }
      
      return signer
    } catch (error) {
      console.error('Failed to create signer wrapper:', error)
      return null
    }
  }

  // Create a provider that works with the new clients
  const getProvider = () => {
    if (!publicClient) {
      console.warn('⚠️ Public client not available')
      return null
    }

    try {
      // Create a provider that wraps the publicClient for ethers compatibility
      const provider = {
        getNetwork: async () => ({ chainId: chainId || 1 }),
        getBalance: async (address) => {
          if (!publicClient.getBalance) {
            throw new Error('Get balance not available')
          }
          return await publicClient.getBalance({ address })
        },
        getCode: async (address) => {
          if (!publicClient.getBytecode) {
            throw new Error('Get bytecode not available')
          }
          return await publicClient.getBytecode({ address })
        },
        getStorageAt: async (address, slot) => {
          if (!publicClient.getStorageAt) {
            throw new Error('Get storage at not available')
          }
          return await publicClient.getStorageAt({ address, slot })
        }
      }
      
      return provider
    } catch (error) {
      console.error('Failed to create provider wrapper:', error)
      return null
    }
  }

  const value = {
    // Connection state - Use Wagmi's state directly
    isConnected: isConnected || false,
    isConnecting: isConnecting || false,
    loading,
    address: address || null,
    
    // Chain info
    chainId: chainId || null,
    chain: chainId && chains[chainId] ? { ...chains[chainId], id: chainId } : { name: 'Unknown', symbol: 'ETH', id: chainId || 1 },
    chains,
    
    // Functions
    switchChain: switchChain || (() => Promise.reject(new Error('Switch chain not available'))),
    switchToBase,
    
    // NFTs
    nfts: nfts || [],
    loadNFTs,
    loadNFTsManually,
    
    // Mobile detection
    isMobile,
    
    // New clients for transactions (preferred)
    walletClient: walletClient || null,
    publicClient: publicClient || null,
    
    // Connection status helpers
    hasWalletClient: !!walletClient,
    hasPublicClient: !!publicClient,
    isFullyConnected: isConnected && walletClient && publicClient ? {
      address,
      walletClient,
      publicClient,
      chainId
    } : null,
    
    // Legacy compatibility (for existing code)
    signer: getSigner(),
    provider: getProvider(),
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
} 