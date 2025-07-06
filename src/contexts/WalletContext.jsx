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
        if (nft.media && nft.media.length > 0) {
          imageUrl = nft.media[0].gateway || nft.media[0].raw || ''
        } else if (nft.image) {
          imageUrl = nft.image.originalUrl || nft.image.cachedUrl || ''
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
          originalUrl: imageUrl,
          media: nft.media?.[0]?.gateway,
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

  // Load NFTs when address changes
  useEffect(() => {
    console.log('🔄 useEffect triggered:', { address, chainId, isConnected })
    console.log('🔍 loadNFTs function exists:', typeof loadNFTs)
    
    if (address) {
      console.log('📞 Calling loadNFTs for address:', address)
      try {
        loadNFTs()
      } catch (error) {
        console.error('❌ Error calling loadNFTs:', error)
      }
    } else {
      console.log('❌ No address, clearing NFTs')
      setNfts([])
    }
  }, [address, chainId])

  // Show connection success
  useEffect(() => {
    if (isConnected && address) {
      showSuccess(`Connected to ${address.slice(0, 6)}...${address.slice(-4)}`)
    }
  }, [isConnected, address])

  // Debug logging for mobile
  useEffect(() => {
    console.log('🔍 WalletContext state:', {
      isConnected,
      address,
      chainId,
      hasWalletClient: !!walletClient,
      hasPublicClient: !!publicClient,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    })
  }, [isConnected, address, chainId, walletClient, publicClient])

  // Create ethers-compatible provider for legacy code
  const getEthersProvider = () => {
    // For mobile wallets, we should use the walletClient's transport
    if (walletClient && walletClient.transport) {
      try {
        // Create a custom provider that works with mobile wallets
        const provider = {
          // Minimal provider interface for compatibility
          getSigner: () => {
            console.warn('getSigner() is deprecated. Use walletClient directly for transactions.')
            return null
          },
          // Add other methods if needed for compatibility
        }
        return provider
      } catch (error) {
        console.error('Failed to create provider wrapper:', error)
      }
    }
    
    // Fallback to window.ethereum if available
    if (window.ethereum) {
      try {
        return new ethers.BrowserProvider(window.ethereum)
      } catch (error) {
        console.error('Failed to create ethers provider:', error)
      }
    }
    
    return null
  }

  const value = {
    // Connection state - Use Wagmi's state directly
    isConnected,
    isConnecting,
    loading,
    address,
    
    // Chain info
    chainId,
    chain: chains[chainId] ? { ...chains[chainId], id: chainId } : { name: 'Unknown', symbol: 'ETH', id: chainId },
    chains,
    
    // Functions
    switchChain,
    switchToBase,
    
    // NFTs
    nfts,
    loadNFTs,
    
    // Mobile detection
    isMobile,
    
    // Clients for transactions
    walletClient,
    publicClient,
    
    // Legacy ethers provider for existing code
    provider: getEthersProvider(),
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
} 