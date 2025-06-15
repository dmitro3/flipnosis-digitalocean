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

  // Load NFTs using Alchemy
  const loadNFTs = async () => {
    if (!address) return
    
    setLoading(true)
    try {
      const currentChain = chains[chainId]
      if (!currentChain) {
        throw new Error('Unsupported network')
      }

      // Hardcoded API key for now
      const apiKey = 'hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3'
      console.log('Using Alchemy API key:', apiKey)

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
        const formattedNft = {
          contractAddress: nft.contract.address,
          tokenId: nft.tokenId,
          name: nft.title || nft.name || `#${nft.tokenId}`,
          collection: nft.contract.name || 'Unknown Collection',
          image: nft.media?.[0]?.gateway || nft.media?.[0]?.raw || nft.image?.originalUrl || nft.image?.cachedUrl || '',
          chain: currentChain.name,
          description: nft.description || '',
          animationUrl: nft.media?.[0]?.format === 'mp4' ? nft.media[0].gateway : nft.animation_url || ''
        }

        return formattedNft
      }))

      console.log('✅ Loaded NFTs:', {
        count: formattedNFTs.length,
        nfts: formattedNFTs
      })
      
      setNfts(formattedNFTs)
    } catch (error) {
      console.error('❌ Error loading NFTs:', error)
      showError('Failed to load NFTs: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Load NFTs when address changes
  useEffect(() => {
    if (address) {
      loadNFTs()
    } else {
      setNfts([])
    }
  }, [address, chainId])

  // Show connection success
  useEffect(() => {
    if (isConnected && address) {
      showSuccess(`Connected to ${address.slice(0, 6)}...${address.slice(-4)}`)
    }
  }, [isConnected, address])

  // Create ethers-compatible provider for legacy code
  const getEthersProvider = () => {
    if (!window.ethereum) return null
    
    try {
      // Use ethers directly since it's imported at the top
      return new ethers.BrowserProvider(window.ethereum)
    } catch (error) {
      console.error('Failed to create ethers provider:', error)
      return null
    }
  }

  const value = {
    // Connection state - Use Wagmi's state directly
    isConnected,
    isConnecting,
    loading,
    address,
    
    // Chain info
    chainId,
    chain: chains[chainId] || { name: 'Unknown', symbol: 'ETH' },
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