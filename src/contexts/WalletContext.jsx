import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { useConnectors } from 'wagmi'
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
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  
  const [nfts, setNfts] = useState([])
  const [loading, setLoading] = useState(false)

  // Chain information
  const chains = {
    1: { name: 'Ethereum', symbol: 'ETH', network: Network.ETH_MAINNET },
    137: { name: 'Polygon', symbol: 'MATIC', network: Network.MATIC_MAINNET },
    8453: { name: 'Base', symbol: 'ETH', network: Network.BASE_MAINNET },
    42161: { name: 'Arbitrum', symbol: 'ETH', network: Network.ARB_MAINNET },
    10: { name: 'Optimism', symbol: 'ETH', network: Network.OPT_MAINNET }
  }

  // Mobile detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const isMetaMaskBrowser = window.ethereum?.isMetaMask && isMobile

  // Connect wallet function
  const connectWallet = async () => {
    try {
      setLoading(true)
      
      // Find best connector - prioritize injected for mobile
      const injectedConnector = connectors.find(connector => 
        connector.type === 'injected' && connector.ready
      )
      
      const walletConnectConnector = connectors.find(connector => 
        connector.type === 'walletConnect'
      )

      // Use injected if available (MetaMask, etc.), otherwise WalletConnect
      const connector = injectedConnector || walletConnectConnector

      if (!connector) {
        throw new Error('No wallet connector available')
      }

      connect({ connector })
      return true
    } catch (error) {
      console.error('Connection error:', error)
      showError(`Failed to connect: ${error.message}`)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Disconnect wallet
  const disconnectWallet = () => {
    disconnect()
    setNfts([])
    showInfo('Wallet disconnected')
  }

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

      // Initialize Alchemy
      const alchemy = new Alchemy({
        apiKey: import.meta.env.VITE_ALCHEMY_API_KEY,
        network: currentChain.network
      })

      // Get NFTs for the address with metadata
      const nfts = await alchemy.nft.getNftsForOwner(address, {
        contractAddresses: [], // Empty array means all contracts
        withMetadata: true,    // Include metadata
        withMedia: true,       // Include media
        pageSize: 100,         // Get more NFTs per page
        pageKey: undefined     // Start from the beginning
      })
      
      console.log('🔍 Raw Alchemy response:', JSON.stringify(nfts, null, 2))
      
      // Transform the NFTs into our format
      const formattedNFTs = await Promise.all(nfts.ownedNfts.map(async nft => {
        console.log('🔍 Full NFT data:', JSON.stringify(nft, null, 2))
        
        // Get the best available image URL
        let imageUrl = ''
        
        // Try to get image from the new Alchemy image object format
        if (nft.image) {
          console.log('📸 Image object:', JSON.stringify(nft.image, null, 2))
          // Use cachedUrl first, then pngUrl, then originalUrl
          imageUrl = nft.image.cachedUrl || nft.image.pngUrl || nft.image.originalUrl || ''
        }
        
        // If no image object, try raw metadata
        if (!imageUrl && nft.raw?.metadata?.image) {
          console.log('📸 Raw metadata image:', nft.raw.metadata.image)
          imageUrl = nft.raw.metadata.image
        }

        // If still no image, try tokenUri
        if (!imageUrl && nft.tokenUri?.raw) {
          console.log('📸 Token URI:', nft.tokenUri.raw)
          try {
            const response = await fetch(nft.tokenUri.raw)
            const metadata = await response.json()
            console.log('📸 Token URI metadata:', metadata)
            if (metadata.image) {
              imageUrl = metadata.image
            }
          } catch (error) {
            console.error('❌ Error fetching token URI:', error)
          }
        }

        // Handle different URL formats
        if (imageUrl) {
          console.log('🖼️ Original image URL:', imageUrl)
          
          // Handle IPFS URLs
          if (imageUrl.startsWith('ipfs://')) {
            imageUrl = `https://ipfs.io/ipfs/${imageUrl.replace('ipfs://', '')}`
          }
          // Handle data URLs
          else if (imageUrl.startsWith('data:')) {
            imageUrl = imageUrl
          }
          // Handle relative URLs
          else if (imageUrl.startsWith('/')) {
            imageUrl = `https://ipfs.io${imageUrl}`
          }
          // Handle other URLs
          else if (!imageUrl.startsWith('http')) {
            imageUrl = `https://ipfs.io/ipfs/${imageUrl}`
          }
          
          console.log('🖼️ Processed image URL:', imageUrl)
        }

        // Use a local placeholder if no image is available
        const placeholderImage = '/placeholder-nft.svg'

        const formattedNft = {
          contractAddress: nft.contract.address,
          tokenId: nft.tokenId,
          name: nft.title || nft.name || `#${nft.tokenId}`,
          image: imageUrl || placeholderImage,
          collection: nft.contract.name || 'Unknown Collection',
          chain: currentChain.name.toLowerCase(),
          tokenType: nft.tokenType,
          metadata: {
            description: nft.description || '',
            attributes: nft.rawMetadata?.attributes || [],
            externalUrl: nft.rawMetadata?.external_url || '',
            animationUrl: nft.rawMetadata?.animation_url || ''
          }
        }

        console.log('✅ Formatted NFT:', formattedNft)
        return formattedNft
      }))

      console.log('✅ Loaded NFTs:', formattedNFTs)
      setNfts(formattedNFTs)
    } catch (error) {
      console.error('Error loading NFTs:', error)
      showError('Failed to load NFTs')
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

  const value = {
    // Connection state
    isConnected,
    isConnecting,
    loading,
    address,
    
    // Chain info
    chainId,
    chain: chains[chainId] || { name: 'Unknown', symbol: 'ETH' },
    chains,
    
    // Functions
    connectWallet,
    disconnect: disconnectWallet,
    switchChain,
    switchToBase,
    
    // NFTs
    nfts,
    loadNFTs,
    
    // Mobile detection
    isMobile,
    isMetaMaskBrowser,
    
    // Connectors
    connectors,
    
    // Provider (for ethers.js compatibility)
    provider: window.ethereum ? new ethers.BrowserProvider(window.ethereum) : null,
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
} 