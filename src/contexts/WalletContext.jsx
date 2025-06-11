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
  const [isMobile, setIsMobile] = useState(false)
  const [isMetaMaskBrowser, setIsMetaMaskBrowser] = useState(false)

  // Detect mobile and MetaMask browser
  useEffect(() => {
    const detectMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(mobile)
      
      // Check if we're in MetaMask's in-app browser
      const isMetaMaskBrowser = window.ethereum && window.ethereum.isMetaMask && mobile
      setIsMetaMaskBrowser(isMetaMaskBrowser)
      
      console.log('📱 Device Detection:', { mobile, isMetaMaskBrowser })
    }
    
    detectMobile()
  }, [])

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

  // Mobile-specific wallet connection
  const connectMobileWallet = async () => {
    console.log('📱 Attempting mobile wallet connection...')
    
    // Check if MetaMask is installed
    if (!window.ethereum) {
      // If not in MetaMask browser, redirect to MetaMask
      const currentUrl = window.location.href
      const metamaskUrl = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`
      
      console.log('🔗 Redirecting to MetaMask:', metamaskUrl)
      window.location.href = metamaskUrl
      return false
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      console.log('✅ Mobile wallet connected:', accounts[0])
      return await setupProvider(accounts[0])
      
    } catch (error) {
      console.error('❌ Mobile wallet connection failed:', error)
      throw error
    }
  }

  // Desktop wallet connection
  const connectDesktopWallet = async (selectedChain = null) => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask not found. Please install MetaMask.')
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      return await setupProvider(accounts[0], selectedChain)
      
    } catch (error) {
      console.error('❌ Desktop wallet connection failed:', error)
      throw error
    }
  }

  // Unified provider setup
  const setupProvider = async (account, selectedChain = null) => {
    try {
      // Get current chain ID
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      const currentChainId = parseInt(chainId, 16)
      
      // Find the chain by ID
      const currentChain = Object.entries(chains).find(([_, config]) => config.id === currentChainId)?.[0]
      console.log('Current chain ID:', currentChainId, 'Mapped to chain:', currentChain)
      
      // Handle chain switching if needed
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
        setChain('ethereum')
      }

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const address = await signer.getAddress()

      setProvider(provider)
      setAddress(address)
      setIsConnected(true)

      console.log('✅ Wallet connected successfully:', { address, chain: currentChain || 'ethereum' })
      return true

    } catch (error) {
      console.error('❌ Provider setup failed:', error)
      throw error
    }
  }

  // Main connect wallet function
  const connectWallet = async (selectedChain = null) => {
    setLoading(true)
    try {
      if (isMobile) {
        return await connectMobileWallet()
      } else {
        return await connectDesktopWallet(selectedChain)
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Check for existing connection on load
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' })
          if (accounts.length > 0) {
            console.log('🔄 Reconnecting to existing wallet...')
            await setupProvider(accounts[0])
          }
        } catch (error) {
          console.error('❌ Failed to reconnect:', error)
        }
      }
    }

    checkConnection()
  }, [])

  // Listen for account/chain changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          setIsConnected(false)
          setAddress('')
          setProvider(null)
        } else {
          setupProvider(accounts[0])
        }
      }

      const handleChainChanged = (chainId) => {
        const newChainId = parseInt(chainId, 16)
        const newChain = Object.entries(chains).find(([_, config]) => config.id === newChainId)?.[0]
        if (newChain) {
          setChain(newChain)
        }
      }

      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  // Disconnect wallet
  const disconnectWallet = () => {
    setIsConnected(false)
    setAddress('')
    setProvider(null)
    setNfts([])
    localStorage.removeItem('connectedWallet')
  }

  // Your existing fetchNFTs function remains the same
  const fetchNFTs = async () => {
    if (!isConnected || !address) return []
    
    setLoading(true)
    try {
      // Your existing NFT fetching logic here
      console.log('🎨 Fetching NFTs for:', { chain, address })
      // ... existing implementation
      return []
    } catch (error) {
      console.error('❌ Error fetching NFTs:', error)
      return []
    } finally {
      setLoading(false)
    }
  }

  const value = {
    isConnected,
    address,
    chain,
    provider,
    nfts,
    loading,
    chains,
    isMobile,
    isMetaMaskBrowser,
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