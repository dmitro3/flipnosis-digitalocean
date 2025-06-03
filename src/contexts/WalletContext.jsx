import React, { createContext, useContext, useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Network, Alchemy } from 'alchemy-sdk'
import PaymentService from '../services/PaymentService'

const WalletContext = createContext()

export const useWallet = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

export const WalletProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState('')
  const [chain, setChain] = useState('ethereum')
  const [provider, setProvider] = useState(null)
  const [nfts, setNfts] = useState([])
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)

  // Chain configurations
  const chains = {
    ethereum: {
      name: 'Ethereum',
      id: 1,
      rpc: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
      explorer: 'https://etherscan.io',
      currency: 'ETH',
      icon: '🔵'
    },
    polygon: {
      name: 'Polygon',
      id: 137,
      rpc: 'https://polygon-rpc.com',
      explorer: 'https://polygonscan.com',
      currency: 'MATIC',
      icon: '🟣'
    },
    arbitrum: {
      name: 'Arbitrum',
      id: 42161,
      rpc: 'https://arb1.arbitrum.io/rpc',
      explorer: 'https://arbiscan.io',
      currency: 'ETH',
      icon: '🔷'
    },
    bnb: {
      name: 'BNB Chain',
      id: 56,
      rpc: 'https://bsc-dataseed1.binance.org',
      explorer: 'https://bscscan.com',
      currency: 'BNB',
      icon: '🟡'
    },
    avalanche: {
      name: 'Avalanche',
      id: 43114,
      rpc: 'https://api.avax.network/ext/bc/C/rpc',
      explorer: 'https://snowtrace.io',
      currency: 'AVAX',
      icon: '🔴'
    },
    base: {
      name: 'Base',
      id: 8453,
      rpc: 'https://mainnet.base.org',
      explorer: 'https://basescan.org',
      currency: 'ETH',
      icon: '🔵'
    }
  }

  const connectWallet = async (selectedChain = null) => {
    setLoading(true)
    try {
      await connectEVM(selectedChain)
      return true
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const connectEVM = async (selectedChain = null) => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask not found. Please install MetaMask.')
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      // Get current chain ID
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      const currentChainId = parseInt(chainId, 16)
      
      // Find the chain by ID
      const currentChain = Object.entries(chains).find(([_, config]) => config.id === currentChainId)?.[0]
      console.log('Current chain ID:', currentChainId, 'Mapped to chain:', currentChain)
      
      // If user specified a chain and we're not on it, try to switch
      if (selectedChain && selectedChain !== currentChain) {
        const chainConfig = chains[selectedChain]
        if (chainConfig) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${chainConfig.id.toString(16)}` }]
            })
            setChain(selectedChain)
          } catch (switchError) {
            // Chain doesn't exist, add it
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: `0x${chainConfig.id.toString(16)}`,
                  chainName: chainConfig.name,
                  rpcUrls: [chainConfig.rpc],
                  blockExplorerUrls: [chainConfig.explorer],
                  nativeCurrency: {
                    name: chainConfig.currency,
                    symbol: chainConfig.currency,
                    decimals: 18
                  }
                }]
              })
              setChain(selectedChain)
            } else {
              throw switchError
            }
          }
        }
      } else if (currentChain) {
        setChain(currentChain)
      } else {
        console.log('Unsupported chain detected, defaulting to Ethereum')
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x1' }]
          })
          setChain('ethereum')
        } catch (switchError) {
          console.error('Failed to switch to Ethereum:', switchError)
          setChain('ethereum')
        }
      }

      // Create provider and get signer
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const address = await signer.getAddress()

      setProvider(provider)
      setAddress(address)
      setIsConnected(true)

      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)

    } catch (error) {
      console.error('Connection error:', error)
      throw error
    }
  }

  const disconnectWallet = () => {
    setIsConnected(false)
    setAddress('')
    setProvider(null)
    setNfts([])
    setChain('ethereum')
    
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      window.ethereum.removeListener('chainChanged', handleChainChanged)
    }

    localStorage.removeItem('connectedWallet')
  }

  const handleAccountsChanged = (accounts) => {
    console.log('Accounts changed:', accounts)
    if (accounts.length === 0) {
      disconnectWallet()
    } else {
      setAddress(accounts[0])
    }
  }

  const handleChainChanged = async (chainId) => {
    console.log('Chain changed:', chainId)
    const newChainId = parseInt(chainId, 16)
    const newChain = Object.entries(chains).find(([_, config]) => config.id === newChainId)?.[0]
    
    if (!newChain) {
      console.log('Unsupported chain detected:', newChainId)
      setChain('ethereum')
      return
    }
    
    console.log('New chain detected:', newChain)
    setChain(newChain)
    if (isConnected) {
      await fetchNFTs()
    }
  }

  const fetchNFTs = async () => {
    if (!isConnected || !address) return

    setLoading(true)
    try {
      const fetchedNFTs = await fetchEVMNFTs()
      setNfts(fetchedNFTs)
    } catch (error) {
      console.error('Failed to fetch NFTs:', error)
      setNfts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchEVMNFTs = async () => {
    if (!address) {
      console.log('❌ No address provided for NFT fetching')
      return []
    }

    try {
      const chainConfig = chains[chain]
      console.log('🔍 Fetching NFTs for chain:', chain, 'address:', address)
      
      // Try multiple ways to get the API key
      const apiKey = import.meta.env.VITE_ALCHEMY_API_KEY || 
                     window.__VITE_ALCHEMY_API_KEY__ || 
                     'hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3' // Fallback to direct key

      console.log('🔍 API Key found:', apiKey ? 'Yes (' + apiKey.slice(0, 10) + '...)' : 'No')

      // Map chain to Alchemy network
      let network
      switch (chain) {
        case 'ethereum':
          network = Network.ETH_MAINNET
          break
        case 'polygon':
          network = Network.MATIC_MAINNET
          break
        case 'arbitrum':
          network = Network.ARB_MAINNET
          break
        case 'base':
          network = Network.BASE_MAINNET
          break
        default:
          console.error('❌ Unsupported network for Alchemy:', chain)
          return []
      }

      console.log('🔧 Using Alchemy network:', network)

      // Initialize Alchemy SDK
      const settings = {
        apiKey: apiKey,
        network: network,
        maxRetries: 3
      }

      console.log('🚀 Initializing Alchemy...')
      const alchemy = new Alchemy(settings)

      console.log('📡 Fetching NFTs for address:', address)
      
      // Use the correct method with proper options
      const nftResponse = await alchemy.nft.getNftsForOwner(address, {
        excludeFilters: ['SPAM'], // Filter out spam NFTs
        omitMetadata: false, // Include metadata
        pageSize: 100 // Get up to 100 NFTs
      })
      
      console.log('📊 NFT API Response:', {
        totalCount: nftResponse.totalCount,
        ownedNftsLength: nftResponse.ownedNfts?.length,
        pageKey: nftResponse.pageKey
      })
      
      if (!nftResponse || !nftResponse.ownedNfts) {
        console.log('⚠️ No NFTs found or invalid response format')
        return []
      }

      console.log('🎨 Processing', nftResponse.ownedNfts.length, 'NFTs...')

      // Process NFTs
      const mappedNFTs = nftResponse.ownedNfts
        .filter(nft => {
          // Basic validation
          if (!nft.contract?.address || nft.tokenId === undefined) {
            console.log('⚠️ Skipping NFT with missing contract or tokenId:', nft.contract?.address, nft.tokenId)
            return false
          }
          
          return true
        })
        .map(nft => {
          try {
            const name = nft.name || nft.title || `Token #${nft.tokenId}`
            
            // Get image URL with better fallbacks
            let imageUrl = ''
            
            // Try different image sources from Alchemy's response
            if (nft.image?.cachedUrl) {
              imageUrl = nft.image.cachedUrl
            } else if (nft.image?.thumbnailUrl) {
              imageUrl = nft.image.thumbnailUrl
            } else if (nft.image?.pngUrl) {
              imageUrl = nft.image.pngUrl
            } else if (nft.image?.originalUrl) {
              imageUrl = nft.image.originalUrl
            } else if (nft.rawMetadata?.image) {
              imageUrl = nft.rawMetadata.image
            } else if (nft.media && nft.media.length > 0) {
              imageUrl = nft.media[0]?.gateway || nft.media[0]?.raw || ''
            }

            // Convert IPFS URLs to HTTP
            if (imageUrl && imageUrl.startsWith('ipfs://')) {
              const hash = imageUrl.replace('ipfs://', '')
              imageUrl = `https://ipfs.io/ipfs/${hash}`
            }

            // Fallback to a working placeholder if no image
            if (!imageUrl) {
              imageUrl = `https://picsum.photos/300/300?random=${nft.tokenId}`
            }

            const collection = nft.contract?.name || nft.contract?.symbol || 'Unknown Collection'
            const contractAddress = nft.contract?.address
            const tokenId = nft.tokenId
            
            console.log('✅ Processed NFT:', {
              name,
              collection,
              contractAddress,
              tokenId,
              hasImage: !!imageUrl
            })

            return {
              id: `${contractAddress}-${tokenId}`,
              name,
              image: imageUrl,
              collection,
              tokenId: tokenId.toString(),
              contractAddress,
              chain: chain,
              tokenType: nft.contract?.tokenType || 'ERC721',
              metadata: {
                description: nft.description || nft.rawMetadata?.description || '',
                attributes: nft.rawMetadata?.attributes || [],
                raw: nft.rawMetadata || {}
              }
            }
          } catch (error) {
            console.error('❌ Error processing NFT:', error, nft)
            return null
          }
        })
        .filter(Boolean) // Remove null entries

      console.log('✅ Successfully mapped', mappedNFTs.length, 'NFTs')
      return mappedNFTs

    } catch (error) {
      console.error('❌ Error fetching NFTs:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        chain,
        address
      })
      return []
    }
  }

  // Fetch NFTs when wallet connects or chain changes
  useEffect(() => {
    if (isConnected) {
      fetchNFTs()
    }
  }, [isConnected, chain, address])

  // Save connection state
  useEffect(() => {
    if (isConnected) {
      localStorage.setItem('connectedWallet', JSON.stringify({ chain, address }))
    } else {
      localStorage.removeItem('connectedWallet')
    }
  }, [isConnected, chain, address])

  const value = {
    isConnected,
    address,
    chain,
    provider,
    nfts,
    loading,
    chains,
    connectWallet,
    disconnectWallet,
    fetchNFTs,
    setChain,
    user
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
} 