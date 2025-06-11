import React, { createContext, useContext, useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Network, Alchemy } from 'alchemy-sdk'
import PaymentService from '../services/PaymentService'
import WalletConnectProvider from '@walletconnect/web3-provider'
import QRCodeModal from '@walletconnect/qrcode-modal'

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
  const [walletConnectProvider, setWalletConnectProvider] = useState(null)
  const [connectionType, setConnectionType] = useState(null) // 'metamask' or 'walletconnect'

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

  // Mobile detection
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  // Check if MetaMask is available
  const isMetaMaskAvailable = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'
  }

  // Check if we're in a mobile wallet's in-app browser
  const isInWalletBrowser = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    return userAgent.includes('metamask') || 
           userAgent.includes('trust') || 
           userAgent.includes('coinbase') ||
           userAgent.includes('imtoken') ||
           userAgent.includes('tokenpocket')
  }

  const connectWallet = async (selectedChain = null, preferredMethod = null) => {
    setLoading(true)
    try {
      // Determine connection method
      let method = preferredMethod
      if (!method) {
        if (isInWalletBrowser() || (!isMobile() && isMetaMaskAvailable())) {
          method = 'metamask'
        } else {
          method = 'walletconnect'
        }
      }

      console.log('🔌 Connecting with method:', method, 'Mobile:', isMobile(), 'MetaMask available:', isMetaMaskAvailable())

      if (method === 'metamask') {
        await connectMetaMask(selectedChain)
      } else {
        await connectWalletConnect(selectedChain)
      }
      
      return true
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const connectMetaMask = async (selectedChain = null) => {
    if (!isMetaMaskAvailable()) {
      // On mobile, try to open MetaMask app
      if (isMobile()) {
        const currentUrl = window.location.href
        const metamaskUrl = `https://metamask.app.link/dapp/${currentUrl.replace(/^https?:\/\//, '')}`
        window.open(metamaskUrl, '_blank')
        throw new Error('Please open this app in MetaMask mobile browser')
      }
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
      
      // Handle chain switching logic (same as before)
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
      setConnectionType('metamask')

      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)

    } catch (error) {
      console.error('MetaMask connection error:', error)
      throw error
    }
  }

  const connectWalletConnect = async (selectedChain = null) => {
    try {
      console.log('🔗 Initializing WalletConnect...')
      
      // Create WalletConnect provider
      const wcProvider = new WalletConnectProvider({
        rpc: {
          1: chains.ethereum.rpc,
          137: chains.polygon.rpc,
          42161: chains.arbitrum.rpc,
          56: chains.bnb.rpc,
          43114: chains.avalanche.rpc,
          8453: chains.base.rpc,
        },
        chainId: selectedChain ? chains[selectedChain].id : 1,
        qrcode: true,
        qrcodeModal: QRCodeModal,
      })

      // Enable session (triggers QR Code modal on desktop)
      await wcProvider.enable()
      
      console.log('✅ WalletConnect enabled')

      // Create ethers provider
      const provider = new ethers.BrowserProvider(wcProvider)
      const signer = await provider.getSigner()
      const address = await signer.getAddress()

      // Get current network
      const network = await provider.getNetwork()
      const chainId = Number(network.chainId)
      const currentChain = Object.entries(chains).find(([_, config]) => config.id === chainId)?.[0] || 'ethereum'

      setWalletConnectProvider(wcProvider)
      setProvider(provider)
      setAddress(address)
      setChain(currentChain)
      setIsConnected(true)
      setConnectionType('walletconnect')

      // Listen for WalletConnect events
      wcProvider.on('accountsChanged', (accounts) => {
        console.log('WC accounts changed:', accounts)
        if (accounts.length === 0) {
          disconnectWallet()
        } else {
          setAddress(accounts[0])
        }
      })

      wcProvider.on('chainChanged', (chainId) => {
        console.log('WC chain changed:', chainId)
        const newChain = Object.entries(chains).find(([_, config]) => config.id === chainId)?.[0]
        if (newChain) {
          setChain(newChain)
        }
      })

      wcProvider.on('disconnect', (code, reason) => {
        console.log('WC disconnected:', code, reason)
        disconnectWallet()
      })

    } catch (error) {
      console.error('WalletConnect connection error:', error)
      if (error.message.includes('User closed modal')) {
        throw new Error('Connection cancelled by user')
      }
      throw error
    }
  }

  const disconnectWallet = async () => {
    try {
      // Disconnect WalletConnect if it was used
      if (walletConnectProvider && connectionType === 'walletconnect') {
        await walletConnectProvider.disconnect()
        setWalletConnectProvider(null)
      }

      // Remove MetaMask listeners if they were added
      if (window.ethereum && connectionType === 'metamask') {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }

      // Reset state
      setIsConnected(false)
      setAddress('')
      setProvider(null)
      setNfts([])
      setChain('ethereum')
      setConnectionType(null)
      
      localStorage.removeItem('connectedWallet')
      localStorage.removeItem('walletconnect')
      
      console.log('✅ Wallet disconnected')
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
    }
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

      console.log('🔍 API Key found:', apiKey ? 'Yes' : 'No')

      if (!apiKey) {
        console.warn('⚠️ No Alchemy API key found, using fallback method')
        return []
      }

      // Map chain to Alchemy network
      const networkMap = {
        ethereum: Network.ETH_MAINNET,
        polygon: Network.MATIC_MAINNET,
        arbitrum: Network.ARB_MAINNET,
        base: Network.BASE_MAINNET,
      }

      const network = networkMap[chain]
      if (!network) {
        console.log(`⚠️ Chain ${chain} not supported by Alchemy, skipping NFT fetch`)
        return []
      }

      // Configure Alchemy
      const config = {
        apiKey,
        network
      }

      const alchemy = new Alchemy(config)
      console.log('🔍 Alchemy configured for network:', network)

      // Fetch NFTs
      const response = await alchemy.nft.getNftsForOwner(address, {
        excludeFilters: ['SPAM'],
        omitMetadata: false,
        pageSize: 100
      })

      console.log('📦 Raw Alchemy response:', response)

      if (!response?.ownedNfts) {
        console.log('❌ No ownedNfts in response')
        return []
      }

      // Process and map NFTs
      const mappedNFTs = response.ownedNfts
        .map((nft) => {
          try {
            const contractAddress = nft.contract?.address
            const tokenId = nft.tokenId
            
            if (!contractAddress || !tokenId) {
              console.log('⚠️ Skipping NFT missing contract address or tokenId:', nft)
              return null
            }

            // Get name with fallback
            const name = nft.title || 
                        nft.rawMetadata?.name || 
                        nft.contract?.name || 
                        `Token #${tokenId}`

            // Get collection name
            const collection = nft.contract?.name || 
                             nft.contract?.symbol || 
                             'Unknown Collection'

            // Get image with comprehensive fallback logic
            let imageUrl = null
            
            // Try multiple image sources
            const imageSources = [
              nft.media?.[0]?.gateway,
              nft.media?.[0]?.thumbnail,
              nft.media?.[0]?.raw,
              nft.rawMetadata?.image,
              nft.rawMetadata?.image_url,
              nft.rawMetadata?.imageUrl,
              nft.rawMetadata?.animation_url,
              nft.tokenUri?.gateway
            ]

            for (const source of imageSources) {
              if (source && typeof source === 'string' && source.trim()) {
                imageUrl = source.startsWith('ipfs://') 
                  ? `https://ipfs.io/ipfs/${source.slice(7)}`
                  : source
                break
              }
            }

            // Final fallback
            if (!imageUrl) {
              imageUrl = `https://via.placeholder.com/200x200/6366f1/ffffff?text=${encodeURIComponent(name.slice(0, 10))}`
            }

            console.log('✅ Processed NFT:', {
              name,
              collection,
              imageUrl: imageUrl?.substring(0, 100) + (imageUrl?.length > 100 ? '...' : ''),
              contractAddress,
              tokenId
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
      localStorage.setItem('connectedWallet', JSON.stringify({ 
        chain, 
        address, 
        connectionType 
      }))
    } else {
      localStorage.removeItem('connectedWallet')
    }
  }, [isConnected, chain, address, connectionType])

  // Auto-reconnect on page load
  useEffect(() => {
    const autoReconnect = async () => {
      try {
        const savedConnection = localStorage.getItem('connectedWallet')
        if (savedConnection) {
          const { connectionType: savedType } = JSON.parse(savedConnection)
          console.log('🔄 Auto-reconnecting with:', savedType)
          
          if (savedType === 'metamask' && isMetaMaskAvailable()) {
            await connectMetaMask()
          } else if (savedType === 'walletconnect') {
            // WalletConnect will auto-reconnect if session exists
            const wcStorage = localStorage.getItem('walletconnect')
            if (wcStorage) {
              await connectWalletConnect()
            }
          }
        }
      } catch (error) {
        console.log('Auto-reconnect failed:', error)
        localStorage.removeItem('connectedWallet')
      }
    }

    autoReconnect()
  }, [])

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
    user,
    connectionType,
    isMobile: isMobile(),
    isMetaMaskAvailable: isMetaMaskAvailable()
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
} 