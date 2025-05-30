import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { ethers } from 'ethers'
import { Network, Alchemy } from 'alchemy-sdk'
import ContractService from '../services/ContractService'
import FirebaseService from '../services/FirebaseService'
import SyncService from '../services/SyncService'
import SettingsService from '../services/SettingsService'
import { signInAnonymously } from 'firebase/auth'
import { auth } from '../services/firebase'

const WalletContext = createContext()

export const useWallet = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

export const WalletProvider = ({ children }) => {
  const initRef = useRef(false)
  
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState('')
  const [chain, setChain] = useState('ethereum')
  const [provider, setProvider] = useState(null)
  const [nfts, setNfts] = useState([])
  const [loading, setLoading] = useState(false)
  const [isListing, setIsListing] = useState(false)
  const [listingError, setListingError] = useState(null)
  const [firebaseService, setFirebaseService] = useState(null)
  const [syncService, setSyncService] = useState(null)
  const [settingsService, setSettingsService] = useState(null)
  const [user, setUser] = useState(null)

  // Chain configurations - Removed Base for now, kept other major chains
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
        // We're on a supported chain, use it
        setChain(currentChain)
      } else {
        // We're on an unsupported chain, default to Ethereum mainnet
        console.log('Unsupported chain detected, defaulting to Ethereum')
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x1' }] // Ethereum mainnet
          })
          setChain('ethereum')
        } catch (switchError) {
          console.error('Failed to switch to Ethereum:', switchError)
          // If we can't switch, just use whatever chain we're on
          setChain('ethereum') // Default fallback
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
    setChain('ethereum') // Reset to ethereum default
    
    // Remove event listeners
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      window.ethereum.removeListener('chainChanged', handleChainChanged)
    }

    // Clear saved wallet data
    localStorage.removeItem('connectedWallet')
  }

  const handleAccountsChanged = (accounts) => {
    console.log('Accounts changed:', accounts)
    if (accounts.length === 0) {
      disconnectWallet()
    } else {
      setAddress(accounts[0])
      // Don't auto-reconnect when account changes, just update address
    }
  }

  const handleChainChanged = async (chainId) => {
    console.log('Chain changed:', chainId)
    const newChainId = parseInt(chainId, 16)
    const newChain = Object.entries(chains).find(([_, config]) => config.id === newChainId)?.[0]
    
    if (!newChain) {
      console.log('Unsupported chain detected:', newChainId)
      // Don't disconnect, just set to ethereum as fallback
      setChain('ethereum')
      return
    }
    
    console.log('New chain detected:', newChain)
    setChain(newChain)
    // Fetch NFTs for the new chain
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

      // Configure network based on chain
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

      // Get NFTs for the address with metadata
      console.log('Fetching NFTs for address:', address)
      
      // First try to get NFTs using the standard method
      let response = await alchemy.nft.getNftsForOwner(address, {
        contractAddresses: [], // Empty array means all contracts
        withMetadata: true,
        withTokenUri: true,
        pageSize: 100 // Increase page size to get more NFTs
      })
      
      console.log('Initial NFT response:', response)

      // If no NFTs found and we're on Base, try alternative method
      if ((!response.ownedNfts || response.ownedNfts.length === 0) && chain === 'base') {
        console.log('No NFTs found with standard method, trying alternative method for Base')
        
        // Try to get NFTs using the getNftsForContract method for known Base NFT contracts
        const baseContracts = [
          '0x0000000000c2d145a2526bD8C716263bFeBe1A72', // Rock Punks
          // Add other known Base NFT contracts here
        ]

        const nftPromises = baseContracts.map(async (contractAddress) => {
          try {
            const nfts = await alchemy.nft.getNftsForContract(contractAddress, {
              withMetadata: true,
              withTokenUri: true
            })
            return nfts.nfts
          } catch (error) {
            console.error(`Error fetching NFTs for contract ${contractAddress}:`, error)
            return []
          }
        })

        const allNfts = await Promise.all(nftPromises)
        const flattenedNfts = allNfts.flat()

        // Filter NFTs that belong to the user
        const userNfts = flattenedNfts.filter(nft => {
          try {
            return nft.owners?.includes(address.toLowerCase())
          } catch (error) {
            console.error('Error checking NFT ownership:', error)
            return false
          }
        })

        response = {
          ownedNfts: userNfts,
          totalCount: userNfts.length
        }
      }

      console.log('Final NFT response:', response)
      
      if (!response || !response.ownedNfts) {
        console.log('No NFTs found or invalid response format')
        return []
      }

      // Helper function to get tokenURI directly from contract
      const getTokenURIFromContract = async (contractAddress, tokenId) => {
        try {
          // Try different tokenURI function signatures
          const tokenURIFunctions = [
            // Standard ERC721 tokenURI
            ["function tokenURI(uint256 tokenId) view returns (string memory)"],
            // Some contracts use uri instead
            ["function uri(uint256 tokenId) view returns (string memory)"],
            // Some contracts use tokenURI with different return type
            ["function tokenURI(uint256 tokenId) view returns (string)"],
            // Some contracts use tokenURI with bytes return type
            ["function tokenURI(uint256 tokenId) view returns (bytes memory)"]
          ]

          const provider = new ethers.JsonRpcProvider(chainConfig.rpc)
          
          // Try each function signature
          for (const abi of tokenURIFunctions) {
            try {
              const contract = new ethers.Contract(contractAddress, abi, provider)
              const tokenURI = await contract.tokenURI(tokenId)
              
              if (tokenURI) {
                console.log('Direct tokenURI from contract:', tokenURI)
                
                // If it's an IPFS URL, convert it
                if (tokenURI.startsWith('ipfs://')) {
                  const ipfsHash = tokenURI.replace('ipfs://', '')
                  return `https://ipfs.io/ipfs/${ipfsHash}`
                }
                
                return tokenURI
              }
            } catch (innerError) {
              // Continue to next function signature
              continue
            }
          }

          // If we get here, none of the functions worked
          console.log('No valid tokenURI function found for contract:', contractAddress)
          return null
        } catch (error) {
          console.error('Error getting tokenURI from contract:', error)
          return null
        }
      }

      const mappedNFTs = await Promise.all(response.ownedNfts.map(async nft => {
        try {
          // Debug raw NFT data
          console.log('Raw NFT data:', {
            contract: nft.contract,
            tokenId: nft.tokenId,
            media: nft.media,
            rawMetadata: nft.rawMetadata,
            tokenUri: nft.tokenUri
          })

          // Check for spam/scam NFTs
          const name = nft.title || nft.rawMetadata?.name || `NFT #${nft.tokenId}`
          const description = nft.description || nft.rawMetadata?.description || ''
          
          // Common spam indicators
          const spamIndicators = [
            'airdrop',
            'reward',
            'free',
            'claim',
            'gift',
            'bit.ly',
            'tpepe',
            'webeth',
            'vip',
            'usdt',
            'eth',
            'btc',
            'crypto',
            'token',
            'coin',
            'presale',
            'whitelist',
            'mint',
            'drop',
            'giveaway'
          ]

          // Only filter obvious spam (be much less aggressive)
          const isObviousSpam = spamIndicators.some(indicator => {
            const lowerName = name.toLowerCase()
            const lowerDesc = description.toLowerCase()
            
            // Only filter if it contains multiple spam indicators or obvious spam phrases
            return (lowerName.includes('airdrop') && lowerName.includes('claim')) ||
                   (lowerName.includes('free') && (lowerName.includes('token') || lowerName.includes('reward'))) ||
                   lowerName.includes('bit.ly') ||
                   lowerDesc.includes('claim your reward')
          })

          if (isObviousSpam) {
            console.log('Filtered out obvious spam NFT:', name)
            return null
          }

          // Get image URL with multiple fallbacks
          let imageUrl = ''
          let metadata = null
          
          // Try to get tokenURI directly from contract first
          const directTokenURI = await getTokenURIFromContract(nft.contract.address, nft.tokenId)
          if (directTokenURI) {
            try {
              console.log('Fetching metadata from direct tokenURI:', directTokenURI)
              const response = await fetch(directTokenURI)
              metadata = await response.json()
              console.log('Direct metadata response:', metadata)
              
              if (metadata.image) {
                imageUrl = metadata.image
                console.log('Found image in direct metadata:', imageUrl)
              }
            } catch (error) {
              console.error('Error fetching direct metadata:', error)
            }
          }
          
          // If no image found, try other methods
          if (!imageUrl) {
            // Try media array
            if (nft.media && nft.media.length > 0) {
              imageUrl = nft.media[0]?.gateway || nft.media[0]?.raw || ''
              console.log('Found image in media array:', imageUrl)
            }
            
            // Try raw metadata image
            if (!imageUrl && nft.rawMetadata?.image) {
              imageUrl = nft.rawMetadata.image
              console.log('Found image in raw metadata:', imageUrl)
            }
            
            // Try token URI metadata
            if (!imageUrl && nft.tokenUri?.gateway) {
              imageUrl = nft.tokenUri.gateway
              console.log('Found image in token URI:', imageUrl)
            }

            // Try Alchemy metadata
            if (!imageUrl) {
              try {
                console.log('Fetching additional metadata for:', nft.contract.address, nft.tokenId)
                const alchemyMetadata = await alchemy.nft.getNftMetadata(
                  nft.contract.address,
                  nft.tokenId
                )
                console.log('Additional metadata response:', alchemyMetadata)
                
                if (alchemyMetadata.media && alchemyMetadata.media.length > 0) {
                  imageUrl = alchemyMetadata.media[0]?.gateway || alchemyMetadata.media[0]?.raw || ''
                  console.log('Found image in additional metadata media:', imageUrl)
                }
                if (!imageUrl && alchemyMetadata.rawMetadata?.image) {
                  imageUrl = alchemyMetadata.rawMetadata.image
                  console.log('Found image in additional metadata raw:', imageUrl)
                }
              } catch (error) {
                console.error('Error fetching additional metadata:', error)
              }
            }
          }

          // Clean up image URL if it's IPFS
          if (imageUrl.startsWith('ipfs://')) {
            const imageHash = imageUrl.replace('ipfs://', '')
            imageUrl = `https://ipfs.io/ipfs/${imageHash}`
            console.log('Converted IPFS URL:', imageUrl)
          }

          // Get collection name with fallbacks
          const collection = nft.contract.name || 
                           nft.rawMetadata?.collection || 
                           'Unknown Collection'

          // Get attributes with fallbacks
          const attributes = metadata?.attributes || nft.rawMetadata?.attributes || []

          // Get token type
          const tokenType = nft.tokenType || 'ERC721'

          // Get token standard
          const tokenStandard = nft.contract.tokenType || 'ERC721'

          // Generate explorer URL
          const explorerUrl = `${chainConfig.explorer}/token/${nft.contract.address}?a=${nft.tokenId}`

          // Log the NFT details for debugging
          console.log('Processed NFT:', {
            name,
            collection,
            tokenId: nft.tokenId,
            imageUrl,
            contractAddress: nft.contract.address,
            explorerUrl,
            metadata: {
              description,
              attributes,
              raw: metadata || nft.rawMetadata || {},
              directTokenURI
            }
          })

          return {
            id: `${nft.contract.address}-${nft.tokenId}`,
            name,
            image: imageUrl,
            collection,
            tokenId: nft.tokenId,
            contractAddress: nft.contract.address,
            chain: chain,
            tokenType,
            tokenStandard,
            explorerUrl,
            metadata: {
              description,
              attributes,
              raw: metadata || nft.rawMetadata || {},
              directTokenURI
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

  // Don't auto-connect on page load for now - let user explicitly connect
  useEffect(() => {
    // Remove auto-connect logic for now
    const savedWallet = localStorage.getItem('connectedWallet')
    if (savedWallet) {
      // Clear old saved data since we changed the chain structure
      localStorage.removeItem('connectedWallet')
    }
  }, [])

  // Save connection state when connected
  useEffect(() => {
    if (isConnected) {
      localStorage.setItem('connectedWallet', JSON.stringify({ chain, address }))
    } else {
      localStorage.removeItem('connectedWallet')
    }
  }, [isConnected, chain, address])

  // Fetch NFTs when wallet connects or chain changes
  useEffect(() => {
    if (isConnected) {
      fetchNFTs()
    }
  }, [isConnected, chain, address])

  // Update the Firebase initialization useEffect
  useEffect(() => {
    if (initRef.current) return
    
    console.log('🔥 Initializing Firebase services...')
    try {
      const firebase = new FirebaseService()
      const sync = new SyncService()
      const settings = new SettingsService()
      
      setFirebaseService(firebase)
      setSyncService(sync)
      setSettingsService(settings)
      initRef.current = true
      console.log('✅ Firebase services initialized successfully')
    } catch (error) {
      console.error('❌ Error initializing Firebase services:', error)
    }
  }, [])

  // Create or update user when wallet connects
  useEffect(() => {
    const handleUserAuth = async () => {
      if (isConnected && address && firebaseService) {
        try {
          await firebaseService.createOrUpdateUser(address, {
            chain: chain,
            lastConnectedChain: chain
          })
          
          const userResult = await firebaseService.getUser(address)
          if (userResult.success) {
            setUser(userResult.user)
          }
        } catch (error) {
          console.error('Error handling user auth:', error)
        }
      }
    }

    handleUserAuth()
  }, [isConnected, address, chain, firebaseService])

  // Firebase Authentication
  useEffect(() => {
    const authenticateUser = async () => {
      if (isConnected && address) {
        try {
          // Sign in anonymously to Firebase
          await signInAnonymously(auth)
          console.log('Firebase authentication successful')
        } catch (error) {
          console.error('Firebase authentication failed:', error)
        }
      }
    }

    authenticateUser()
  }, [isConnected, address])

  // Replace the listNFT function
  const listNFT = async (nftContract, tokenId, priceUSD, totalRounds, acceptedPayment) => {
    try {
      if (!isConnected || !provider || !firebaseService || !settingsService) {
        throw new Error('Please connect your wallet first')
      }

      setIsListing(true)
      setListingError(null)

      // Find the NFT in user's collection
      const selectedNFT = nfts.find(nft => 
        nft.contractAddress === nftContract && nft.tokenId === tokenId
      )

      if (!selectedNFT) {
        throw new Error('NFT not found in your collection')
      }

      console.log('🎮 Creating game for NFT:', selectedNFT)

      // Check for duplicate listing
      console.log('🔍 Checking for duplicate listings...')
      const duplicateCheck = await firebaseService.checkDuplicateListing(
        nftContract, 
        tokenId, 
        address
      )

      if (duplicateCheck.isDuplicate) {
        throw new Error(`This NFT is already listed! Game ID: ${duplicateCheck.existingGameId}`)
      }

      // Get listing fee
      const listingFeeUSD = settingsService.getListingFeeUSD()
      const feeRecipient = settingsService.getFeeRecipient()
      
      console.log(`💵 Listing fee: $${listingFeeUSD}`)

      // Calculate ETH fee amount
      const feeCalculation = settingsService.calculateETHFee(listingFeeUSD)
      if (!feeCalculation.success) {
        throw new Error('Failed to calculate listing fee')
      }

      const feeAmountETH = feeCalculation.ethAmount
      console.log(`⛽ Listing fee in ETH: ${feeAmountETH} ETH`)

      // Send ETH listing fee
      console.log('💸 Processing listing fee payment...')
      const signer = await provider.getSigner()

      const feeAmountWei = ethers.parseEther(feeAmountETH.toString())

      // Get current gas prices and configure properly
      const feeData = await provider.getFeeData()
      const txConfig = {
        to: feeRecipient,
        value: feeAmountWei,
        gasLimit: 21000 // Standard ETH transfer
      }

      // Configure gas fees properly
      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        const maxPriorityFee = feeData.maxPriorityFeePerGas
        const baseFee = feeData.maxFeePerGas - maxPriorityFee
        
        const adjustedMaxPriorityFee = maxPriorityFee * 110n / 100n
        const adjustedMaxFee = baseFee + adjustedMaxPriorityFee
        
        txConfig.maxFeePerGas = adjustedMaxFee
        txConfig.maxPriorityFeePerGas = adjustedMaxPriorityFee
        
        console.log('⛽ Using EIP-1559 fees for listing:', {
          maxFeePerGas: adjustedMaxFee.toString(),
          maxPriorityFeePerGas: adjustedMaxPriorityFee.toString()
        })
      } else if (feeData.gasPrice) {
        txConfig.gasPrice = feeData.gasPrice * 110n / 100n
        console.log('⛽ Using legacy gas price for listing:', txConfig.gasPrice.toString())
      }

      const feeTx = await signer.sendTransaction(txConfig)

      console.log('⏳ Waiting for fee transaction confirmation...')
      const feeReceipt = await feeTx.wait()
      console.log('✅ Listing fee paid:', feeReceipt.hash)

      // Create game in Firebase
      const gameData = {
        creator: address,
        joiner: null,
        
        // NFT Info
        nft: {
          contractAddress: nftContract,
          tokenId: tokenId,
          name: selectedNFT.name,
          image: selectedNFT.image,
          collection: selectedNFT.collection,
          chain: chain
        },
        
        // Game Settings
        price: priceUSD,
        priceUSD: priceUSD,
        currency: 'USD',
        rounds: totalRounds,
        
        // State
        status: 'waiting',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        
        // Game Progress
        currentRound: 0,
        creatorWins: 0,
        joinerWins: 0,
        winner: null,
        
        // Contract sync
        onChain: false,
        contractGameId: null,
        contractAddress: null,
        
        // Fee info
        listingFee: {
          amountUSD: listingFeeUSD,
          amountETH: feeAmountETH,
          transactionHash: feeReceipt.hash,
          paidAt: new Date()
        }
      }

      console.log('💾 Saving game to Firebase:', gameData)
      const result = await firebaseService.createGame(gameData)

      if (!result.success) {
        throw new Error(result.error || 'Failed to create game in database')
      }

      console.log('✅ Game created in Firebase with ID:', result.gameId)

      // Record the listing fee transaction
      await firebaseService.createListingFeeTransaction(
        result.gameId,
        address,
        feeAmountETH,
        feeReceipt.hash
      )

      // Try to refresh NFTs
      try {
        console.log('🔄 Refreshing NFTs...')
        await fetchNFTs()
        console.log('✅ NFTs refreshed successfully')
      } catch (nftError) {
        console.warn('⚠️ NFT refresh failed:', nftError)
      }

      return {
        success: true,
        gameId: result.gameId,
        message: `Game created successfully! Listing fee of $${listingFeeUSD} paid. Players can now make offers.`
      }
    } catch (error) {
      console.error('❌ Error listing NFT:', error)
      setListingError(error.message)
      return {
        success: false,
        error: error.message
      }
    } finally {
      setIsListing(false)
    }
  }

  const delistNFT = async (gameId) => {
    try {
      if (!isConnected || !provider || !firebaseService) {
        throw new Error('Please connect your wallet first')
      }

      // Get game data
      const gameResult = await firebaseService.getGame(gameId)
      if (!gameResult.success) {
        throw new Error('Game not found')
      }

      const game = gameResult.game

      // Verify ownership
      if (game.creator !== address) {
        throw new Error('Only the game creator can delist this NFT')
      }

      // Verify game state
      if (game.status !== 'waiting') {
        throw new Error('Can only delist games that are in waiting state')
      }

      // Update game status in Firebase
      const updateResult = await firebaseService.updateGame(gameId, {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy: address
      })

      if (!updateResult.success) {
        throw new Error('Failed to update game status')
      }

      // Try to refresh NFTs
      try {
        await fetchNFTs()
      } catch (nftError) {
        console.warn('NFT refresh failed:', nftError)
      }

      return {
        success: true,
        message: 'Game delisted successfully'
      }
    } catch (error) {
      console.error('Error delisting NFT:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  const value = {
    isConnected,
    address,
    chain,
    provider,
    nfts,
    loading,
    isListing,
    listingError,
    chains,
    connectWallet,
    disconnectWallet,
    fetchNFTs,
    listNFT,
    delistNFT,
    setChain,
    firebaseService,
    syncService,
    settingsService,
    user
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
} 