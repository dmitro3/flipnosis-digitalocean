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
    if (!address) return []

    try {
      const chainConfig = chains[chain]
      console.log('Fetching NFTs for chain:', chain, 'with config:', chainConfig)
      
      const networkEndpoints = {
        ethereum: 'https://eth-mainnet.g.alchemy.com/v2',
        polygon: 'https://polygon-mainnet.g.alchemy.com/v2',
        arbitrum: 'https://arb-mainnet.g.alchemy.com/v2',
        bnb: 'https://bsc-mainnet.g.alchemy.com/v2',
        avalanche: 'https://avalanche-mainnet.g.alchemy.com/v2',
        base: 'https://base-mainnet.g.alchemy.com/v2'
      }

      const endpoint = networkEndpoints[chain]
      if (!endpoint) {
        console.error('No endpoint found for chain:', chain)
        return []
      }

      const apiKey = import.meta.env.VITE_ALCHEMY_API_KEY
      if (!apiKey) {
        console.error('Alchemy API key not found')
        return []
      }

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
        case 'bnb':
          network = Network.BNB_MAINNET
          break
        case 'avalanche':
          network = Network.AVAX_MAINNET
          break
        case 'base':
          network = Network.BASE_MAINNET
          break
        default:
          console.error('Unsupported network for Alchemy:', chain)
          return []
      }

      const settings = {
        apiKey: apiKey,
        network: network,
        maxRetries: 3
      }

      console.log('Using Alchemy settings:', { ...settings, apiKey: '***' })
      const alchemy = new Alchemy(settings)

      console.log('Fetching NFTs for address:', address)
      
      let response = await alchemy.nft.getNftsForOwner(address, {
        contractAddresses: [],
        withMetadata: true,
        withTokenUri: true,
        pageSize: 100
      })
      
      console.log('NFT response:', response)
      
      if (!response || !response.ownedNfts) {
        console.log('No NFTs found or invalid response format')
        return []
      }

      const mappedNFTs = await Promise.all(response.ownedNfts.map(async nft => {
        try {
          const name = nft.title || nft.rawMetadata?.name || `NFT #${nft.tokenId}`
          const description = nft.description || nft.rawMetadata?.description || ''
          
          // Basic spam filtering
          const spamIndicators = ['airdrop', 'free', 'claim', 'bit.ly']
          const isSpam = spamIndicators.some(indicator => 
            name.toLowerCase().includes(indicator) || description.toLowerCase().includes(indicator)
          )

          if (isSpam) {
            console.log('Filtered out spam NFT:', name)
            return null
          }

          // Get image URL with better fallbacks
          let imageUrl = ''

          // Try media array first
          if (nft.media && nft.media.length > 0) {
            const media = nft.media[0]
            imageUrl = media?.gateway || media?.raw || ''
          }

          // Try raw metadata if no media
          if (!imageUrl && nft.rawMetadata?.image) {
            imageUrl = nft.rawMetadata.image
          }

          // Try tokenUri gateway
          if (!imageUrl && nft.tokenUri?.gateway) {
            imageUrl = nft.tokenUri.gateway
          }

          // Convert IPFS URLs to HTTP
          if (imageUrl) {
            if (imageUrl.startsWith('ipfs://')) {
              const hash = imageUrl.replace('ipfs://', '')
              imageUrl = `https://ipfs.io/ipfs/${hash}`
            } else if (imageUrl.startsWith('ipfs/')) {
              const hash = imageUrl.replace('ipfs/', '')
              imageUrl = `https://ipfs.io/ipfs/${hash}`
            }
          }

          // Fallback to a working placeholder
          if (!imageUrl) {
            imageUrl = `https://picsum.photos/300/300?random=${nft.tokenId}`
          }

          console.log('Final image URL for', nft.tokenId, ':', imageUrl)

          const collection = nft.contract.name || nft.rawMetadata?.collection || 'Unknown Collection'
          const attributes = nft.rawMetadata?.attributes || []
          const tokenType = nft.tokenType || 'ERC721'
          const explorerUrl = `${chainConfig.explorer}/token/${nft.contract.address}?a=${nft.tokenId}`

          return {
            id: `${nft.contract.address}-${nft.tokenId}`,
            name,
            image: imageUrl,
            collection,
            tokenId: nft.tokenId,
            contractAddress: nft.contract.address,
            chain: chain,
            tokenType,
            explorerUrl,
            metadata: {
              description,
              attributes,
              raw: nft.rawMetadata || {}
            }
          }
        } catch (error) {
          console.error('Error mapping NFT:', error, nft)
          return null
        }
      }))
      
      const validNFTs = mappedNFTs.filter(Boolean)
      console.log('Final mapped NFTs:', validNFTs)
      return validNFTs

    } catch (error) {
      console.error('Error fetching NFTs:', error)
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