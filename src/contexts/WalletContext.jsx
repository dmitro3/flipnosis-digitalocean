import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useAccount, useChainId, useSwitchChain, useWalletClient, usePublicClient } from 'wagmi'
import { useToast } from './ToastContext'
import { Alchemy, Network } from 'alchemy-sdk'
import contractService from '../services/ContractService'

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
  const [isContractInitialized, setIsContractInitialized] = useState(false)
  
  // Use ref to prevent multiple initializations
  const initializingRef = useRef(false)
  const lastInitializedAddress = useRef(null)
  
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

  // Initialize contract service when wallet is ready - with deduplication
  useEffect(() => {
    const initializeContract = async () => {
      // Check if already initializing or already initialized for this address
      if (initializingRef.current || lastInitializedAddress.current === address) {
        return
      }
      
      // Check if we have all required components
      if (!isConnected || !walletClient || !publicClient || !address || chainId !== 8453) {
        setIsContractInitialized(false)
        return
      }
      
      initializingRef.current = true
      
      try {
        console.log('🔧 Initializing contract service from WalletContext...')
        const result = await contractService.initialize(walletClient, publicClient)
        
        if (result.success) {
          console.log('✅ Contract service initialized successfully')
          setIsContractInitialized(true)
          lastInitializedAddress.current = address
        } else {
          console.error('❌ Contract initialization failed:', result.error)
          setIsContractInitialized(false)
        }
      } catch (error) {
        console.error('❌ Failed to initialize contract service:', error)
        setIsContractInitialized(false)
      } finally {
        initializingRef.current = false
      }
    }

    initializeContract()
  }, [isConnected, walletClient, publicClient, address, chainId])

  // Switch to Base network
  const switchToBase = useCallback(async () => {
    try {
      await switchChain({ chainId: 8453 })
      showSuccess('Switched to Base network')
    } catch (error) {
      console.error('Network switch error:', error)
      if (error.message?.includes('User rejected')) {
        showError('Network switch cancelled')
      } else {
        showError('Failed to switch to Base network')
      }
    }
  }, [switchChain, showSuccess, showError])

  // Load NFTs using Alchemy
  const loadNFTs = useCallback(async () => {
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

      // Use Alchemy API key
      const apiKey = 'hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3'
      
      // Initialize Alchemy
      const alchemy = new Alchemy({
        apiKey,
        network: currentChain.network
      })

      console.log('🔍 Loading NFTs for:', {
        address,
        chain: currentChain.name,
        network: currentChain.network
      })

      // Get NFTs for the address with pagination
      let allNFTs = []
      let pageKey = null
      
      do {
        const nftsForOwner = await alchemy.nft.getNftsForOwner(address, {
          omitMetadata: false,
          pageKey: pageKey
        })

        allNFTs = [...allNFTs, ...nftsForOwner.ownedNfts]
        pageKey = nftsForOwner.pageKey
      } while (pageKey)

      console.log('🎨 Total NFTs found (Alchemy):', allNFTs.length)

      // Verify ownership on-chain to filter out stale data
      const verifiedNFTs = []
      
      for (const nft of allNFTs) {
        try {
          console.log(`🔍 Verifying ownership of ${nft.contract.address}:${nft.tokenId}...`)
          
          // Check actual ownership on blockchain
          const actualOwner = await publicClient.readContract({
            address: nft.contract.address,
            abi: [
              {
                "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
                "name": "ownerOf",
                "outputs": [{"internalType": "address", "name": "", "type": "address"}],
                "stateMutability": "view",
                "type": "function"
              }
            ],
            functionName: 'ownerOf',
            args: [BigInt(nft.tokenId)]
          })
          
          console.log(`🔍 Actual owner: ${actualOwner}, Wallet: ${address}`)
          
          if (actualOwner.toLowerCase() === address.toLowerCase()) {
            console.log(`✅ Wallet actually owns ${nft.contract.address}:${nft.tokenId}`)
            
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

            verifiedNFTs.push({
              contractAddress: nft.contract.address,
              tokenId: nft.tokenId,
              name: nft.title || nft.name || `#${nft.tokenId}`,
              collection: nft.contract.name || 'Unknown Collection',
              image: imageUrl,
              chain: currentChain.name,
              description: nft.description || '',
              animationUrl: nft.media?.[0]?.format === 'mp4' ? nft.media[0].gateway : nft.animation_url || ''
            })
          } else {
            console.log(`❌ Wallet does NOT own ${nft.contract.address}:${nft.tokenId} (stale Alchemy data)`)
          }
        } catch (verifyError) {
          console.warn(`⚠️ Could not verify ownership of ${nft.contract.address}:${nft.tokenId}:`, verifyError.message)
          // Skip this NFT if we can't verify ownership
        }
      }

      console.log('✅ Verified NFTs actually owned by wallet:', verifiedNFTs.length)
      setNfts(verifiedNFTs)
    } catch (error) {
      console.error('❌ Error loading NFTs:', error)
      showError('Failed to load NFTs')
    } finally {
      setLoading(false)
    }
  }, [address, chainId, showError])

  // Manual NFT loading function
  const loadNFTsManually = useCallback(async () => {
    if (address) {
      console.log('📞 Manually loading NFTs for address:', address)
      try {
        await loadNFTs()
      } catch (error) {
        console.error('❌ Error manually loading NFTs:', error)
      }
    }
  }, [address, loadNFTs])

  // Show connection success (removed debug message)
  useEffect(() => {
    if (isConnected && address && !lastInitializedAddress.current) {
      // Connection success handled silently to avoid spam
    }
  }, [isConnected, address, showSuccess])

  // Check if wallet is fully ready
  const isFullyConnected = isConnected && 
                          address && 
                          walletClient && 
                          publicClient && 
                          isContractInitialized &&
                          chainId === 8453

  const value = {
    // Connection state
    isConnected: isConnected || false,
    isConnecting: isConnecting || false,
    loading,
    address: address || null,
    
    // Chain info
    chainId: chainId || null,
    chain: chainId && chains[chainId] ? { ...chains[chainId], id: chainId } : null,
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
    
    // Clients for transactions
    walletClient: walletClient || null,
    publicClient: publicClient || null,
    
    // Connection status helpers
    hasWalletClient: !!walletClient,
    hasPublicClient: !!publicClient,
    isContractInitialized,
    isFullyConnected,
    
    // Legacy compatibility (simplified)
    signer: walletClient,
    provider: publicClient,
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}