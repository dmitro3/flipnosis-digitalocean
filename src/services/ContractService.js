import { createPublicClient, createWalletClient, custom, http, decodeEventLog, formatEther, parseEther } from 'viem'
import { base, mainnet, bsc, avalanche, polygon } from 'viem/chains'
import { Alchemy } from 'alchemy-sdk'

// Constants
const CONTRACT_ADDRESS = "0xba5ef026f35d1ac9f2ebB7FB047a50900Ec521A1"
const API_URL = 'https://cryptoflipz2-production.up.railway.app'

// Common error definitions for better error handling
const COMMON_ERRORS = [
  {
    name: 'InsufficientListingFee',
    type: 'error',
    inputs: []
  },
  {
    name: 'InvalidNFTContract',
    type: 'error',
    inputs: []
  },
  {
    name: 'InvalidPriceFeed',
    type: 'error',
    inputs: []
  },
  {
    name: 'GameNotAvailable',
    type: 'error',
    inputs: []
  },
  {
    name: 'CannotJoinOwnGame',
    type: 'error',
    inputs: []
  },
  {
    name: 'GameAlreadyJoined',
    type: 'error',
    inputs: []
  },
  {
    name: 'InsufficientETH',
    type: 'error',
    inputs: []
  }
]

// Contract ABI (keeping your existing ABI)
const CONTRACT_ABI = [
  // Error definitions
  ...COMMON_ERRORS,
  // Events
  {
    name: 'GameCreated',
    type: 'event',
    anonymous: false,
    inputs: [
      { indexed: true, name: 'gameId', type: 'uint256' },
      { indexed: true, name: 'creator', type: 'address' },
      { indexed: false, name: 'gameType', type: 'uint8' }
    ]
  },
  {
    name: 'GameJoined',
    type: 'event',
    anonymous: false,
    inputs: [
      { indexed: true, name: 'gameId', type: 'uint256' },
      { indexed: true, name: 'joiner', type: 'address' }
    ]
  },
  {
    name: 'GameCompleted',
    type: 'event',
    anonymous: false,
    inputs: [
      { indexed: true, name: 'gameId', type: 'uint256' },
      { indexed: true, name: 'winner', type: 'address' },
      { indexed: false, name: 'timestamp', type: 'uint256' }
    ]
  },
  {
    name: 'GameCancelled',
    type: 'event',
    anonymous: false,
    inputs: [
      { indexed: true, name: 'gameId', type: 'uint256' },
      { indexed: false, name: 'timestamp', type: 'uint256' }
    ]
  },
  {
    name: 'RoundPlayed',
    type: 'event',
    anonymous: false,
    inputs: [
      { indexed: true, name: 'gameId', type: 'uint256' },
      { indexed: false, name: 'round', type: 'uint256' },
      { indexed: false, name: 'result', type: 'uint256' },
      { indexed: false, name: 'roundWinner', type: 'address' }
    ]
  },
  // Functions
  {
    name: 'createGame',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'priceUSD', type: 'uint256' },
      { name: 'acceptedToken', type: 'uint8' },
      { name: 'gameType', type: 'uint8' },
      { name: 'coinType', type: 'string' },
      { name: 'headsImage', type: 'string' },
      { name: 'tailsImage', type: 'string' },
      { name: 'isCustom', type: 'bool' }
    ],
    outputs: []
  },
  {
    name: 'createAndStartGame',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'opponent', type: 'address' },
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'priceUSD', type: 'uint256' },
      { name: 'paymentToken', type: 'uint8' },
      { name: 'coinType', type: 'string' },
      { name: 'headsImage', type: 'string' },
      { name: 'tailsImage', type: 'string' },
      { name: 'isCustom', type: 'bool' }
    ],
    outputs: []
  },
  {
    name: 'joinGame',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'gameId', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'playRound',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'gameId', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'completeGame',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'winner', type: 'address' }
    ],
    outputs: []
  },

  {
    name: 'cancelGame',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'gameId', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'completeGame',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'winner', type: 'address' }
    ],
    outputs: []
  },
  {
    name: 'withdrawRewards',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: []
  },
  {
    name: 'withdrawNFT',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'depositNFTForGame',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'depositCryptoForGame',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'gameId', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'cancelGameWithRefund',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'gameId', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'emergencyWithdrawETH',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: []
  },
  {
    name: 'getETHAmount',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'usdAmount', type: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'uint256' }
    ]
  },
  {
    name: 'adminBatchWithdrawNFTs',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'nftContracts', type: 'address[]' },
      { name: 'tokenIds', type: 'uint256[]' },
      { name: 'recipients', type: 'address[]' }
    ],
    outputs: []
  },
  {
    name: 'nextGameId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'listingFeeUSD',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'platformFeeReceiver',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }]
  },
  {
    name: 'getPlatformFeeReceiver',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }]
  },
  {
    name: 'getETHAmount',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'usdAmount', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'getGameRoundDetails',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'gameId', type: 'uint256' }],
    outputs: [
      { name: 'creatorWins', type: 'uint256' },
      { name: 'joinerWins', type: 'uint256' },
      { name: 'currentRound', type: 'uint256' },
      { name: 'lastResult', type: 'uint256' }
    ]
  },
  {
    name: 'listingFeeUSD',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'platformFeePercent',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'getGameDetails',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'gameId', type: 'uint256' }],
    outputs: [
      { name: 'gameId_', type: 'uint256' },
      { name: 'creator_', type: 'address' },
      { name: 'joiner_', type: 'address' },
      { name: 'nftContract_', type: 'address' },
      { name: 'tokenId_', type: 'uint256' },
      { name: 'state_', type: 'uint8' },
      { name: 'gameType_', type: 'uint8' },
      { name: 'priceUSD_', type: 'uint256' },
      { name: 'paymentToken_', type: 'uint8' },
      { name: 'totalPaid_', type: 'uint256' },
      { name: 'winner_', type: 'address' },
      { name: 'createdAt_', type: 'uint256' },
      { name: 'creatorWins_', type: 'uint256' },
      { name: 'joinerWins_', type: 'uint256' },
      { name: 'currentRound_', type: 'uint256' },
      { name: 'lastFlipResult_', type: 'uint256' },
      { name: 'lastFlipHash_', type: 'bytes32' },
      { name: 'coinType_', type: 'string' },
      { name: 'headsImage_', type: 'string' },
      { name: 'tailsImage_', type: 'string' },
      { name: 'isCustom_', type: 'bool' }
    ]
  },
  {
    name: 'games',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'gameId', type: 'uint256' }],
    outputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'creator', type: 'address' },
      { name: 'joiner', type: 'address' },
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'state', type: 'uint8' },
      { name: 'gameType', type: 'uint8' },
      { name: 'priceUSD', type: 'uint256' },
      { name: 'paymentToken', type: 'uint8' },
      { name: 'totalPaid', type: 'uint256' },
      { name: 'winner', type: 'address' },
      { name: 'createdAt', type: 'uint256' },
      { name: 'expiresAt', type: 'uint256' }
    ]
  },
  {
    name: 'nftChallenges',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'gameId', type: 'uint256' }],
    outputs: [
      { name: 'challengerNFTContract', type: 'address' },
      { name: 'challengerTokenId', type: 'uint256' }
    ]
  },
  {
    name: 'unclaimedETH',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'address', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'unclaimedUSDC',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'address', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
]

// NFT ABI for approvals
const NFT_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'getApproved',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenId', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'address' }]
  },
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenId', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'address' }]
  }
]

// Alchemy API key
const ALCHEMY_API_KEY = 'hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3'

// Chain configurations with Alchemy endpoints for better reliability
const CHAIN_CONFIGS = {
  base: {
    chain: base,
    contractAddress: CONTRACT_ADDRESS,
    rpcUrls: [
      `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`, // Primary Alchemy endpoint
      'https://mainnet.base.org', // Secondary public endpoint
      'https://base.blockpi.network/v1/rpc/public' // Tertiary fallback
    ]
  },
  mainnet: {
    chain: mainnet,
            contractAddress: '0x0000000000000000000000000000000000000000', // Update with mainnet address when deployed
    rpcUrls: [
      `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      'https://cloudflare-eth.com',
      'https://eth.public-rpc.com'
    ]
  },
  polygon: {
    chain: polygon,
            contractAddress: '0x0000000000000000000000000000000000000000', // Update with polygon address when deployed
    rpcUrls: [
      `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      'https://polygon-rpc.com',
      'https://rpc-mainnet.matic.network'
    ]
  },
  bsc: {
    chain: bsc,
            contractAddress: '0x0000000000000000000000000000000000000000', // Update with BSC address when deployed
    rpcUrls: [
      'https://bsc-dataseed.binance.org',
      'https://bsc-dataseed1.defibit.io',
      'https://bsc-dataseed1.ninicoin.io'
    ]
  },
  avalanche: {
    chain: avalanche,
            contractAddress: '0x0000000000000000000000000000000000000000', // Update with Avalanche address when deployed
    rpcUrls: [
      'https://api.avax.network/ext/bc/C/rpc',
      'https://avalanche-c-chain.publicnode.com',
      'https://rpc.ankr.com/avalanche'
    ]
  }
}

class ContractService {
  constructor() {
    this.contract = null
    this.publicClient = null
    this.walletClient = null
    this.lastRequestTime = {} // FIX: Changed from number to object
    this.minRequestInterval = 1000 // 1 second between requests
    this.contractAddress = CONTRACT_ADDRESS
    this.contractABI = CONTRACT_ABI
    this.chainId = null
    this.alchemy = null
  }

  // Utility method to validate and parse game ID
  validateGameId(gameId) {
    if (!gameId) {
      throw new Error('Game ID is required')
    }

    // If it's already a BigInt, return it
    if (typeof gameId === 'bigint') {
      return gameId
    }

    // If it's a number, convert to BigInt
    if (typeof gameId === 'number') {
      return BigInt(gameId)
    }

    // If it's a string, try to extract numeric part
    if (typeof gameId === 'string') {
      // Remove any non-numeric characters and try to parse
      const numericPart = gameId.replace(/[^0-9]/g, '')
      
      if (!numericPart) {
        throw new Error(`Invalid game ID format: "${gameId}". Expected numeric value.`)
      }

      try {
        return BigInt(numericPart)
      } catch (error) {
        throw new Error(`Cannot convert game ID "${gameId}" to BigInt. Please provide a valid numeric game ID.`)
      }
    }

    throw new Error(`Invalid game ID type: ${typeof gameId}. Expected number, string, or BigInt.`)
  }

  // Initialize contract with clients
  async initializeClients(chainId, walletClient) {
    console.log('🔧 Initializing contract service with:', {
      chainId,
      hasWalletClient: !!walletClient,
      walletClientType: typeof walletClient,
      walletClientKeys: walletClient ? Object.keys(walletClient) : 'null'
    })
    
    if (!walletClient) {
      throw new Error('Wallet client is required')
    }
    
    // Validate wallet client has required properties
    if (!walletClient.account || !walletClient.account.address) {
      console.error('❌ Wallet client validation failed:', {
        hasAccount: !!walletClient.account,
        accountKeys: walletClient.account ? Object.keys(walletClient.account) : 'null'
      })
      throw new Error('Wallet client is not properly initialized')
    }
    
    // For Base network, use the working contract address
    if (chainId === 8453) {
      this.contractAddress = CONTRACT_ADDRESS
    } else {
      throw new Error(`Unsupported chain: ${chainId}`)
    }

    this.chainId = chainId
    this.walletClient = walletClient

    // Create public client for Base using Alchemy with fallbacks
    this.publicClient = createPublicClient({
      chain: base,
      transport: http('https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3', {
        retryCount: 3,
        retryDelay: 1000
      })
    })

    console.log('✅ Contract service initialized with working pattern', {
      contractAddress: this.contractAddress,
      chainId: this.chainId,
      walletAddress: this.walletClient.account.address
    })

    // Initialize Alchemy
    this.alchemy = new Alchemy({ 
      apiKey: import.meta.env.VITE_ALCHEMY_API_KEY || 'hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3',
      network: 'base-mainnet'
    })
  }

  // Get current clients
  getCurrentClients() {
    // ContractService state check - debug log removed to reduce spam
    
    if (!this.walletClient) {
      throw new Error('Wallet client not available. Please connect your wallet.')
    }
    
    // Additional validation to ensure wallet client is properly initialized
    if (!this.walletClient.account || !this.walletClient.account.address) {
      console.error('❌ Wallet client account validation failed:', {
        hasAccount: !!this.walletClient.account,
        accountType: typeof this.walletClient.account,
        accountKeys: this.walletClient.account ? Object.keys(this.walletClient.account) : 'null',
        accountAddress: this.walletClient.account?.address
      })
      throw new Error('Wallet client is not properly initialized. Please reconnect your wallet.')
    }
    
    return {
      walletClient: this.walletClient,
      public: this.publicClient
    }
  }

  // Check if service is initialized
  isInitialized() {
    const hasWalletClient = !!this.walletClient
    const hasPublicClient = !!this.publicClient
    const hasValidAccount = this.walletClient?.account?.address
    
    // Service initialization check - debug log removed to reduce spam
    
    return hasWalletClient && hasPublicClient && hasValidAccount
  }

  // Get current chain
  get currentChain() {
    return this.chainId
  }

  // Refresh wallet client (call this if wallet client becomes stale)
  async refreshWalletClient(newWalletClient) {
    if (!newWalletClient || !newWalletClient.account || !newWalletClient.account.address) {
      throw new Error('Invalid wallet client provided for refresh')
    }
    
    console.log('🔄 Refreshing wallet client:', {
      oldAddress: this.walletClient?.account?.address,
      newAddress: newWalletClient.account.address
    })
    
    this.walletClient = newWalletClient
    
    console.log('✅ Wallet client refreshed successfully')
  }

  // Rate limit protection with exponential backoff - FIXED
  async rateLimit(key) {
    const now = Date.now()
    const lastRequest = this.lastRequestTime[key] || 0
    const timeSinceLastRequest = now - lastRequest
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest
      console.log(`⏳ Rate limiting: waiting ${waitTime}ms before ${key}`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    this.lastRequestTime[key] = Date.now()
  }

  // Retry with exponential backoff
  async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        
        if (error.message.includes('rate limit') || error.message.includes('429')) {
          const delay = baseDelay * Math.pow(2, i) + Math.random() * 1000
          console.log(`⚠️ Rate limit hit, retrying in ${Math.round(delay)}ms (attempt ${i + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, delay))
        } else {
          throw error
        }
      }
    }
    
    throw lastError
  }

  // Create a new game
  async createGame(params) {
    try {
      console.log('🎮 Creating game with params:', params)
      
      if (!this.isInitialized()) {
        throw new Error('Contract service not initialized. Please connect your wallet.')
      }

      // Get the next game ID before creating the game
      const nextGameId = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: this.contractABI,
        functionName: 'nextGameId'
      })
      
      console.log('📊 Next game ID:', nextGameId.toString())

      // Get listing fee from contract
      const listingFeeUSD = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: this.contractABI,
        functionName: 'listingFeeUSD'
      })

      console.log('💵 Listing fee from contract:', listingFeeUSD.toString(), '(in 6 decimals)')

      // Get ETH amount for listing fee from contract
      let listingFeeETH
      try {
        listingFeeETH = await this.publicClient.readContract({
          address: this.contractAddress,
          abi: this.contractABI,
          functionName: 'getETHAmount',
          args: [listingFeeUSD]
        })
        console.log('💵 Listing fee in ETH from contract:', formatEther(listingFeeETH))
      } catch (error) {
        console.warn('⚠️ Contract getETHAmount failed, using fallback calculation:', error)
        // Fallback for local testing - use a fixed ETH price
        const ethPrice = 3000 // $3000 per ETH
        const listingFeeUSDDecimal = Number(listingFeeUSD) / 1000000 // Convert from 6 decimals
        const listingFeeInEth = listingFeeUSDDecimal / ethPrice
        // Convert to Wei ensuring no decimals by using parseEther
        listingFeeETH = parseEther(listingFeeInEth.toFixed(18))
        console.log('💵 Fallback listing fee:', formatEther(listingFeeETH), 'ETH')
      }

      // Check user's ETH balance
      const balance = await this.publicClient.getBalance({
        address: this.walletClient.account.address
      })
      
      console.log('💰 User ETH balance:', formatEther(balance))
      console.log('💵 Required listing fee:', formatEther(listingFeeETH))
      
      if (balance < listingFeeETH) {
        throw new Error(`Insufficient ETH balance. You have ${formatEther(balance)} ETH but need ${formatEther(listingFeeETH)} ETH for the listing fee.`)
      }

      // Check NFT approval before creating game
      console.log('🔍 Checking NFT approval...')
      const currentApproval = await this.publicClient.readContract({
        address: params.nftContract,
        abi: NFT_ABI,
        functionName: 'getApproved',
        args: [BigInt(params.tokenId)]
      })

      if (currentApproval?.toLowerCase() !== this.contractAddress.toLowerCase()) {
        throw new Error('NFT is not approved for the contract. Please approve the NFT first.')
      }

      // Prepare game creation parameters
      const gameParams = {
        nftContract: params.nftContract,
        tokenId: BigInt(params.tokenId),
        priceUSD: BigInt(Math.floor(params.priceUSD * 1000000)), // Convert to 6 decimals
        acceptedToken: params.acceptedToken || 0,
        gameType: params.gameType || 0,
        coinType: params.coinType || 'default',
        headsImage: params.headsImage || '',
        tailsImage: params.tailsImage || '',
        isCustom: params.isCustom || false
      }

      console.log('📝 Formatted game params:', gameParams)
      console.log('💰 Sending ETH value:', formatEther(listingFeeETH))

      // Simulate the transaction first
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: this.contractABI,
        functionName: 'createGame',
        args: [
          gameParams.nftContract,
          gameParams.tokenId,
          gameParams.priceUSD,
          gameParams.acceptedToken,
          gameParams.gameType,
          gameParams.coinType,
          gameParams.headsImage,
          gameParams.tailsImage,
          gameParams.isCustom
        ],
        account: this.walletClient.account,
        value: listingFeeETH // This is now guaranteed to be a BigInt
      })

      // Execute the transaction
      const hash = await this.walletClient.writeContract(request)
      
      console.log('🎯 Game creation transaction sent:', hash)

      // Wait for confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 1 
      })

      console.log('✅ Game creation confirmed:', receipt)

      // Get the actual game ID from the transaction receipt
      // Look for the GameCreated event in the logs
      let gameId = null
      if (receipt.logs && receipt.logs.length > 0) {
        for (const log of receipt.logs) {
          try {
            // Try to decode the log as a GameCreated event
            const decodedLog = decodeEventLog({
              abi: this.contractABI,
              data: log.data,
              topics: log.topics
            })
            
            if (decodedLog.eventName === 'GameCreated') {
              gameId = decodedLog.args.gameId.toString()
              console.log('🎮 Found GameCreated event with game ID:', gameId)
              break
            }
          } catch (decodeError) {
            // This log is not a GameCreated event, continue
            continue
          }
        }
      }
      
      // Fallback to the nextGameId if we couldn't find the event
      if (!gameId) {
        gameId = nextGameId.toString()
        console.log('⚠️ Could not find GameCreated event, using nextGameId as fallback:', gameId)
      }
      
      console.log('🎮 Game created with ID:', gameId)
      console.log('🎮 This ID should be saved as contract_game_id in the database')

      // Return the game ID for the frontend to save to database
      return {
        success: true,
        gameId,
        transactionHash: hash,
        receipt,
        listingFeeUSD: Number(listingFeeUSD) / 1000000
      }

    } catch (error) {
      console.error('❌ Error creating game:', error)
      
      // Better error messages
      let errorMessage = error.message || 'Failed to create game'
      
      if (error.message.includes('Invalid price feed')) {
        errorMessage = 'The price feed is not available. This often happens on localhost. Please try on a testnet or mainnet.'
      } else if (error.message.includes('Insufficient listing fee')) {
        errorMessage = 'Insufficient ETH sent for listing fee. This usually means the price feed is not working correctly.'
      }
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  // Approve NFT
  async approveNFT(nftContract, tokenId) {
    try {
      await this.rateLimit('approveNFT')
      
      const { walletClient, public: publicClient } = this.getCurrentClients()
      const account = walletClient.account.address

      // Check if already approved
      const currentApproval = await this.retryWithBackoff(async () => {
        await this.rateLimit('checkApproval')
        return await publicClient.readContract({
          address: nftContract,
          abi: NFT_ABI,
          functionName: 'getApproved',
          args: [BigInt(tokenId)]
        })
      })

      if (currentApproval?.toLowerCase() === this.contractAddress.toLowerCase()) {
        console.log('✅ NFT already approved')
        return { success: true, alreadyApproved: true }
      }

      // Check ownership
      const owner = await this.retryWithBackoff(async () => {
        await this.rateLimit('checkOwnership')
        return await publicClient.readContract({
          address: nftContract,
          abi: NFT_ABI,
          functionName: 'ownerOf',
          args: [BigInt(tokenId)]
        })
      })

      if (owner.toLowerCase() !== account.toLowerCase()) {
        throw new Error(`You don't own this NFT. Owner: ${owner}, Your address: ${account}`)
      }

      // Estimate gas for approval
      const gasEstimate = await this.retryWithBackoff(async () => {
        await this.rateLimit('estimateApprovalGas')
        return await publicClient.estimateContractGas({
          address: nftContract,
          abi: NFT_ABI,
          functionName: 'approve',
          args: [this.contractAddress, BigInt(tokenId)],
          account
        })
      })

      const gasLimit = gasEstimate * 120n / 100n
      const { maxFeePerGas, maxPriorityFeePerGas } = await this.getGasPrices()

      // Approve NFT
      console.log('🔐 Approving NFT...')
      const hash = await this.retryWithBackoff(async () => {
        await this.rateLimit('approveTx')
        return await walletClient.writeContract({
          address: nftContract,
          abi: NFT_ABI,
          functionName: 'approve',
          args: [this.contractAddress, BigInt(tokenId)],
          account,
          gas: gasLimit,
          maxFeePerGas,
          maxPriorityFeePerGas
        })
      })

      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 1
      })

      console.log('✅ NFT approved successfully')
      return {
        success: true,
        transactionHash: hash,
        receipt
      }
    } catch (error) {
      console.error('Error approving NFT:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Get game details
  async getGameDetails(gameId) {
    try {
      await this.rateLimit('getGameDetails')
      
      const { public: publicClient } = this.getCurrentClients()

      // Validate and parse game ID
      const validatedGameId = this.validateGameId(gameId)

      const result = await this.retryWithBackoff(async () => {
        return await publicClient.readContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'getGameDetails',
          args: [validatedGameId]
        })
      })

      // The new contract returns individual values, not a struct
      const [
        gameId_, creator_, joiner_, nftContract_, tokenId_, state_, gameType_,
        priceUSD_, paymentToken_, totalPaid_, winner_, createdAt_,
        creatorWins_, joinerWins_, currentRound_, lastFlipResult_, lastFlipHash_,
        coinType_, headsImage_, tailsImage_, isCustom_
      ] = result
      
      // Convert price from 6 decimals (e.g., 400000 = $0.40)
      const priceUSDInDecimals = Number(priceUSD_)
      const actualPriceUSD = priceUSDInDecimals / 1000000 // Convert from 6 decimals
      
      // Get the ETH amount for the game price with fallback
      let ethAmount = null
      try {
        ethAmount = await this.getETHAmount(actualPriceUSD)
      } catch (ethError) {
        console.warn('⚠️ Failed to get ETH amount from contract, using fallback:', ethError.message)
        // Fallback calculation
        const ethPrice = 3000 // Fixed price for fallback
        const ethAmountValue = actualPriceUSD / ethPrice
        ethAmount = {
          ethAmount: ethAmountValue.toFixed(18),
          ethAmountWei: parseEther(ethAmountValue.toFixed(18)),
          fallback: true
        }
      }
      
      // Reconstruct the game object
      const game = {
        gameId: gameId_,
        creator: creator_,
        joiner: joiner_,
        nftContract: nftContract_,
        tokenId: tokenId_,
        state: state_,
        gameType: gameType_,
        priceUSD: priceUSD_,
        paymentToken: paymentToken_,
        totalPaid: totalPaid_,
        winner: winner_,
        createdAt: createdAt_,
        creatorWins: creatorWins_,
        joinerWins: joinerWins_,
        currentRound: currentRound_,
        lastFlipResult: lastFlipResult_,
        lastFlipHash: lastFlipHash_,
        coinInfo: {
          coinType: coinType_,
          headsImage: headsImage_,
          tailsImage: tailsImage_,
          isCustom: isCustom_
        }
      }
      
      return {
        success: true,
        data: {
          game: game,
          nftChallenge: null, // No longer needed with new contract structure
          payment: {
            priceUSD: actualPriceUSD,
            priceETH: ethAmount.ethAmount
          }
        }
      }
    } catch (error) {
      console.error('Error getting game details:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Join game with exact Wei amount (immediate fix)
  async joinGameWithExactAmount(gameId, weiAmount, nftContract = null, tokenId = null) {
    try {
      console.log('🎮 Joining game with exact amount:', { gameId, weiAmount })
      
      if (!this.isInitialized()) {
        throw new Error('Contract service not initialized. Please connect your wallet.')
      }

      // Validate and parse game ID
      const validatedGameId = this.validateGameId(gameId)

      // Get game details from contract
      const gameDetails = await this.getGameDetails(validatedGameId)
      if (!gameDetails.success) {
        throw new Error('Failed to get game details: ' + gameDetails.error)
      }

      const { game } = gameDetails.data

      // Check if game is available
      if (game.state !== 0) {
        throw new Error('Game is not available for joining')
      }

      // Check if user is trying to join their own game
      if (game.creator.toLowerCase() === this.walletClient.account.address.toLowerCase()) {
        throw new Error('Cannot join your own game')
      }

      // Check if user already joined
      if (game.joiner && game.joiner.toLowerCase() === this.walletClient.account.address.toLowerCase()) {
        throw new Error('You have already joined this game')
      }

      // Get the exact amount required from the contract using Chainlink oracle
      const requiredAmount = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: this.contractABI,
        functionName: 'getETHAmount',
        args: [BigInt(game.priceUSD)]
      })

      console.log('💵 Contract calculated amount:', formatEther(requiredAmount))
      console.log('💵 Frontend amount:', formatEther(weiAmount))
      
      // Use the contract's calculated amount instead of the frontend amount
      const weiAmountBigInt = requiredAmount
      
      // Check user's ETH balance
      const balance = await this.publicClient.getBalance({
        address: this.walletClient.account.address
      })
      
      console.log('💰 User ETH balance:', formatEther(balance))
      console.log('💵 Required amount:', formatEther(weiAmountBigInt))
      
      if (balance < weiAmountBigInt) {
        throw new Error(`Insufficient ETH balance. You have ${formatEther(balance)} ETH but need ${formatEther(weiAmountBigInt)} ETH.`)
      }

      // Prepare join parameters
      const joinParams = {
        gameId: validatedGameId
      }

      console.log('📝 Join params:', joinParams)

      // Simulate the transaction first
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: this.contractABI,
        functionName: 'joinGame',
        args: [joinParams.gameId],
        account: this.walletClient.account,
        value: weiAmountBigInt
      })

      // Execute the transaction
      const hash = await this.walletClient.writeContract(request)
      
      console.log('🎯 Join game transaction sent:', hash)

      // Wait for confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 1 
      })

      console.log('✅ Join game confirmed:', receipt)

      return {
        success: true,
        transactionHash: hash,
        receipt
      }

    } catch (error) {
      console.error('❌ Error joining game:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Join game
  async joinGame(params) {
    try {
      console.log('🎮 Joining game with params:', params)
      
      if (!this.isInitialized()) {
        throw new Error('Contract service not initialized. Please connect your wallet.')
      }

      // Validate and parse game ID
      const validatedGameId = this.validateGameId(params.gameId)

      // Get game details first
      const gameDetails = await this.getGameDetails(validatedGameId)
      if (!gameDetails.success) {
        throw new Error('Failed to get game details: ' + gameDetails.error)
      }

      // Use the offer price that was accepted (params.priceUSD) or fallback to blockchain price
      const priceUSD = params.priceUSD || (Number(gameDetails.data.game.priceUSD_) / 1000000)
      
      // Convert USD to 6 decimals (contract expects price in 6 decimals, not cents)
      const priceIn6Decimals = Math.floor(priceUSD * 1000000)
      
      // Get the exact amount required from the contract using Chainlink oracle
      const requiredAmount = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: this.contractABI,
        functionName: 'getETHAmount',
        args: [BigInt(priceIn6Decimals)]
      })

      const priceInWei = requiredAmount
      
      console.log('💰 Game price from contract:', priceUSD, 'USD (', priceIn6Decimals, 'microdollars)')
      console.log('💰 Contract calculated ETH amount:', formatEther(requiredAmount))
      console.log('💰 Price in Wei:', priceInWei.toString())

      // Simulate the transaction with payment
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: this.contractABI,
        functionName: 'joinGame',
        args: [validatedGameId],
        value: priceInWei,
        account: this.walletClient.account
      })

      // Execute the transaction
      const hash = await this.walletClient.writeContract(request)
      
      console.log('🎯 Join game transaction sent:', hash)

      // Wait for confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 1 
      })

      console.log('✅ Join game confirmed:', receipt)

      // Update database - try to find game by contract_game_id first
      try {
        const API_URL = 'https://cryptoflipz2-production.up.railway.app'
        
        // First, try to find the database game by contract_game_id
        const findResponse = await fetch(`${API_URL}/api/games/by-contract/${validatedGameId}`)
        
        if (findResponse.ok) {
          const gameData = await findResponse.json()
          const dbGameId = gameData.id
          
          // Update the database game using the database ID
          const updateResponse = await fetch(`${API_URL}/api/games/${dbGameId}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              joiner: this.walletClient.account.address,
              transactionHash: hash
            })
          })

          if (!updateResponse.ok) {
            console.warn('Failed to update database after join:', await updateResponse.text())
          } else {
            console.log('✅ Database updated successfully')
          }
        } else {
          console.warn('Database game not found by contract_game_id, skipping database update')
          // This is normal for blockchain-only games that don't have database records
          // The game will still work on-chain
        }
      } catch (dbError) {
        console.error('Database update error:', dbError)
      }

      return {
        success: true,
        transactionHash: hash,
        receipt
      }

  } catch (error) {
    console.error('❌ Error joining game:', error)
    
    // Better error handling
    let errorMessage = error.message || 'Failed to join game'
    
    if (error.message.includes('insufficient funds')) {
      errorMessage = 'Insufficient funds to join game'
    } else if (error.message.includes('user rejected')) {
      errorMessage = 'Transaction cancelled'
    } else if (error.message.includes('already joined')) {
      errorMessage = 'This game already has a second player'
    }
    
    return {
      success: false,
      error: errorMessage
    }
  }
  }

  // Get optimized gas prices for Base
  async getGasPrices() {
    try {
      const { public: publicClient } = this.getCurrentClients()
      
      // Get current gas prices from the network
      const block = await publicClient.getBlock({ blockTag: 'latest' })
      const baseFee = block.baseFeePerGas || 0n
      
      // Base network typically has low gas prices
      // Set minimum values to ensure transaction goes through
      const minBaseFee = 100000000n // 0.1 gwei
      const minPriorityFee = 100000000n // 0.1 gwei
      
      // Calculate max fees with some buffer
      const maxPriorityFeePerGas = minPriorityFee
      const maxFeePerGas = (baseFee * 2n) + maxPriorityFeePerGas
      
      // Ensure minimum values
      const finalMaxFee = maxFeePerGas > minBaseFee ? maxFeePerGas : minBaseFee
      const finalPriorityFee = maxPriorityFeePerGas > minPriorityFee ? maxPriorityFeePerGas : minPriorityFee
      
      console.log('⛽ Gas prices:', {
        baseFee: baseFee.toString(),
        maxFeePerGas: finalMaxFee.toString(),
        maxPriorityFeePerGas: finalPriorityFee.toString()
      })
      
      return {
        maxFeePerGas: finalMaxFee,
        maxPriorityFeePerGas: finalPriorityFee
      }
    } catch (error) {
      console.error('Error getting gas prices:', error)
      // Return default values on error
      return {
        maxFeePerGas: 1000000000n, // 1 gwei
        maxPriorityFeePerGas: 100000000n // 0.1 gwei
      }
    }
  }

  // Get current ETH price from server
  async getCurrentEthPrice() {
    try {
      const response = await fetch('https://cryptoflipz2-production.up.railway.app/api/eth-price')
      const data = await response.json()
      return data.price || 3000 // fallback to $3000
    } catch (error) {
      console.error('Error getting ETH price:', error)
      return 3000 // fallback
    }
  }

  // Convert USD to ETH using current price
  async convertUSDToETH(priceUSD) {
    const ethPrice = await this.getCurrentEthPrice()
    return priceUSD / ethPrice
  }

  // Get ETH amount for USD price
  async getETHAmount(priceUSD) {
    try {
      if (!this.isInitialized()) {
        throw new Error('Contract service not initialized')
      }

      const { public: publicClient } = this.getCurrentClients()
      
      // Convert USD to 6 decimals (as used by the contract)
      const priceWith6Decimals = BigInt(Math.floor(priceUSD * 1000000))
      
      const ethAmount = await publicClient.readContract({
        address: this.contractAddress,
        abi: this.contractABI,
        functionName: 'getETHAmount',
        args: [priceWith6Decimals]
      })
      
      return ethAmount // Return the BigInt directly for use in transactions
    } catch (error) {
      console.error('Error getting ETH amount:', error)
      // Fallback calculation
      const ethPrice = 3000 // You should get this from an oracle
      const ethAmount = (priceUSD / ethPrice) * 1e18
      return BigInt(Math.floor(ethAmount))
    }
  }



  // Get NFT metadata (helper function)
  async getNFTMetadata(nftContract, tokenId) {
    try {
      console.log(`🔍 Fetching metadata for ${nftContract}:${tokenId}`)
      
      // Try to get metadata from Alchemy first
      if (this.alchemy) {
        try {
          const nft = await this.alchemy.nft.getNftMetadata(nftContract, tokenId.toString())
          console.log(`✅ Alchemy metadata for ${nftContract}:${tokenId}:`, nft)
          console.log(`🔍 Alchemy media array:`, nft.media)
          console.log(`🔍 Alchemy raw metadata:`, nft.rawMetadata)
          
          // Try multiple image sources from Alchemy response
          let imageUrl = ''
          if (nft.media && nft.media.length > 0) {
            imageUrl = nft.media[0].gateway || nft.media[0].raw || nft.media[0].thumbnail || ''
          }
          
          // Fallback to raw metadata if media is empty
          if (!imageUrl && nft.rawMetadata) {
            imageUrl = nft.rawMetadata.image || nft.rawMetadata.image_url || nft.rawMetadata.imageUrl || ''
          }
          
          return {
            name: nft.title || nft.name || `NFT #${tokenId}`,
            image: imageUrl,
            description: nft.description || '',
            attributes: nft.rawMetadata?.attributes || []
          }
        } catch (alchemyError) {
          console.warn(`Alchemy failed for ${nftContract}:${tokenId}:`, alchemyError)
        }
      }
      
      // Fallback: Try direct contract calls
      const { public: publicClient } = this.getCurrentClients()
      
      try {
        // Try to get tokenURI
        const tokenURI = await publicClient.readContract({
          address: nftContract,
          abi: [
            {
              inputs: [{ name: 'tokenId', type: 'uint256' }],
              name: 'tokenURI',
              outputs: [{ name: '', type: 'string' }],
              stateMutability: 'view',
              type: 'function'
            }
          ],
          functionName: 'tokenURI',
          args: [BigInt(tokenId)]
        })
        
        console.log(`📋 TokenURI for ${nftContract}:${tokenId}:`, tokenURI)
        
        if (tokenURI && tokenURI !== '') {
          // Fetch metadata from URI
          const response = await fetch(tokenURI)
          const metadata = await response.json()
          
          console.log(`📊 Raw metadata for ${nftContract}:${tokenId}:`, metadata)
          
          // Handle different image field formats and IPFS URLs
          let imageUrl = metadata.image || metadata.image_url || metadata.imageUrl || ''
          
          // Convert IPFS URLs to gateway URLs if needed
          if (imageUrl.startsWith('ipfs://')) {
            imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')
          }
          
          return {
            name: metadata.name || metadata.title || `NFT #${tokenId}`,
            image: imageUrl,
            description: metadata.description || '',
            attributes: metadata.attributes || []
          }
        }
      } catch (contractError) {
        console.warn(`Contract call failed for ${nftContract}:${tokenId}:`, contractError)
      }
      
      // Final fallback
      console.log(`⚠️ Using fallback metadata for ${nftContract}:${tokenId}`)
      return {
        name: `NFT #${tokenId}`,
        image: '',
        description: 'Metadata not available',
        attributes: []
      }
      
    } catch (error) {
      console.error(`❌ Error fetching NFT metadata for ${nftContract}:${tokenId}:`, error)
      return {
        name: `NFT #${tokenId}`,
        image: '',
        description: 'Error loading metadata',
        attributes: []
      }
    }
  }

  // Get game (for FlipGame component)
  async getGame(gameId) {
    try {
      const result = await this.getGameDetails(gameId)
      return {
        success: result.success,
        game: result.data?.game
      }
    } catch (error) {
      console.error('Error getting game:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Complete game
  async completeGame(gameId, winner) {
    try {
      await this.rateLimit('completeGame')
      
      const { walletClient, public: publicClient } = this.getCurrentClients()
      
      if (!walletClient) {
        throw new Error('Wallet client not available. Please connect your wallet.')
      }

      // Validate and parse game ID
      const validatedGameId = this.validateGameId(gameId)

      console.log('🏆 Completing game:', { gameId: validatedGameId, winner })

      const gasEstimate = await this.retryWithBackoff(async () => {
        await this.rateLimit('estimateCompleteGas')
        return await publicClient.estimateContractGas({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'completeGame',
          args: [validatedGameId, winner],
          account: walletClient.account.address
        })
      })

      const gasLimit = gasEstimate * 120n / 100n
      const { maxFeePerGas, maxPriorityFeePerGas } = await this.getGasPrices()

      const hash = await this.retryWithBackoff(async () => {
        await this.rateLimit('completeGameTx')
        return await walletClient.writeContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'completeGame',
          args: [validatedGameId, winner],
          account: walletClient.account.address,
          gas: gasLimit,
          maxFeePerGas,
          maxPriorityFeePerGas
        })
      })

      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 2
      })
      
      return {
        success: true,
        transactionHash: hash,
        receipt
      }
    } catch (error) {
      console.error('Error completing game:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // 3. Complete game with proof (NEW)
  async completeGameWithProof(gameId, gameData) {
    try {
      if (!this.isInitialized()) {
        throw new Error('Contract service not initialized')
      }

      console.log('🏆 Completing game on blockchain:', gameId)

      const { winner, creatorWins, joinerWins, rounds } = gameData

      // Create proof data
      const proofData = {
        creatorWins,
        joinerWins,
        rounds: rounds.map(r => ({
          result: r.result,
          winner: r.winner,
          seed: r.seed
        }))
      }

      // For now, we'll use the existing completeGame function
      // In production, you'd modify the contract to accept proof
      const result = await this.completeGame(gameId, winner)
      
      if (result.success) {
        console.log('✅ Game completed on blockchain')
      }
      
      return result
    } catch (error) {
      console.error('❌ Error completing game:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Cancel game
  async cancelGame(gameId) {
    try {
      await this.rateLimit('cancelGame')
      
      const { walletClient, public: publicClient } = this.getCurrentClients()
      
      if (!walletClient) {
        throw new Error('Wallet client not available. Please connect your wallet.')
      }

      // Validate and parse game ID
      const validatedGameId = this.validateGameId(gameId)

      console.log('❌ Cancelling game:', validatedGameId)

      const gasEstimate = await this.retryWithBackoff(async () => {
        await this.rateLimit('estimateCancelGas')
        return await publicClient.estimateContractGas({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'cancelGame',
          args: [validatedGameId],
          account: walletClient.account.address
        })
      })

      const gasLimit = gasEstimate * 120n / 100n
      const { maxFeePerGas, maxPriorityFeePerGas } = await this.getGasPrices()

      const hash = await this.retryWithBackoff(async () => {
        await this.rateLimit('cancelGameTx')
        return await walletClient.writeContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'cancelGame',
          args: [validatedGameId],
          account: walletClient.account.address,
          gas: gasLimit,
          maxFeePerGas,
          maxPriorityFeePerGas
        })
      })

      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 2
      })
      
      return {
        success: true,
        transactionHash: hash
      }
    } catch (error) {
      console.error('Error cancelling game:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Check unclaimed rewards
  async getUnclaimedRewards(address) {
    try {
      await this.rateLimit('getUnclaimedRewards')
      
      const { public: publicClient } = this.getCurrentClients()

      const [unclaimedETH, unclaimedUSDC] = await this.retryWithBackoff(async () => {
        await this.rateLimit('unclaimedETH')
        const eth = await publicClient.readContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'unclaimedETH',
          args: [address]
        })
        
        await this.rateLimit('unclaimedUSDC')
        const usdc = await publicClient.readContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'unclaimedUSDC',
          args: [address]
        })
        
        return [eth, usdc]
      })

      return {
        success: true,
        eth: formatEther(unclaimedETH),
        usdc: Number(unclaimedUSDC) / 1000000, // Convert from 6 decimals
        hasRewards: unclaimedETH > 0n || unclaimedUSDC > 0n
      }
    } catch (error) {
      console.error('Error checking unclaimed rewards:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Withdraw rewards
  async withdrawRewards() {
    try {
      await this.rateLimit('withdrawRewards')
      
      const { walletClient, public: publicClient } = this.getCurrentClients()
      
      if (!walletClient) {
        throw new Error('Wallet client not available')
      }

      console.log('💰 Withdrawing all rewards')

      const { request } = await publicClient.simulateContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'withdrawRewards',
        account: walletClient.account
      })

      const hash = await walletClient.writeContract(request)
      
      console.log('🎯 Withdraw transaction sent:', hash)

      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 1 
      })

      console.log('✅ Rewards withdrawn successfully:', receipt)

      return {
        success: true,
        transactionHash: hash
      }

    } catch (error) {
      console.error('❌ Error withdrawing rewards:', error)
      return {
        success: false,
        error: error.message || 'Failed to withdraw rewards'
      }
    }
  }

  // Add this method to play rounds
  async playRound(gameId) {
    try {
      await this.rateLimit('playRound')
      
      const { walletClient, public: publicClient } = this.getCurrentClients()
      
      if (!walletClient) {
        throw new Error('Wallet client not available')
      }

      // Validate and parse game ID
      const validatedGameId = this.validateGameId(gameId)

      console.log('🎲 Playing round for game:', validatedGameId)

      // Simulate first
      const { request } = await publicClient.simulateContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'playRound',
        args: [validatedGameId],
        account: walletClient.account
      })

      // Execute
      const hash = await walletClient.writeContract(request)
      
      console.log('🎯 Round play transaction sent:', hash)

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 1 
      })

      console.log('✅ Round played successfully:', receipt)

      // Get the round result from events
      const roundPlayedEvent = receipt.logs.find(log => {
        try {
          const decoded = decodeEventLog({
            abi: CONTRACT_ABI,
            data: log.data,
            topics: log.topics
          })
          return decoded.eventName === 'RoundPlayed'
        } catch {
          return false
        }
      })

      if (roundPlayedEvent) {
        const decoded = decodeEventLog({
          abi: CONTRACT_ABI,
          data: roundPlayedEvent.data,
          topics: roundPlayedEvent.topics
        })

        return {
          success: true,
          transactionHash: hash,
          round: Number(decoded.args.round),
          result: Number(decoded.args.result),
          roundWinner: decoded.args.roundWinner
        }
      }

      return {
        success: true,
        transactionHash: hash
      }

    } catch (error) {
      console.error('❌ Error playing round:', error)
      return {
        success: false,
        error: error.message || 'Failed to play round'
      }
    }
  }

  // Add this method to get round details
  async getGameRoundDetails(gameId) {
    try {
      const { publicClient } = this.getCurrentClients()
      
      // Validate and parse game ID
      const validatedGameId = this.validateGameId(gameId)
      
      const result = await publicClient.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'getGameRoundDetails',
        args: [validatedGameId]
      })

      return {
        success: true,
        data: {
          creatorWins: Number(result[0]),
          joinerWins: Number(result[1]),
          currentRound: Number(result[2]),
          lastResult: Number(result[3])
        }
      }
    } catch (error) {
      console.error('Error getting round details:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Withdraw platform fees (for platform fee receiver only)
  async withdrawPlatformFees() {
    try {
      await this.rateLimit('withdrawPlatformFees')
      
      const { walletClient, public: publicClient } = this.getCurrentClients()
      
      if (!walletClient) {
        throw new Error('Wallet client not available. Please connect your wallet.')
      }
      
      const account = walletClient.account.address

      // Check if caller is platform fee receiver
      const feeReceiver = await this.retryWithBackoff(async () => {
        await this.rateLimit('getPlatformFeeReceiver')
        return await publicClient.readContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'platformFeeReceiver'
        })
      })
      
      if (account.toLowerCase() !== feeReceiver.toLowerCase()) {
        throw new Error('Only platform fee receiver can withdraw fees')
      }

      console.log('💰 Withdrawing platform fees...')
      
      // Call withdrawRewards to get accumulated fees
      const gasEstimate = await this.retryWithBackoff(async () => {
        await this.rateLimit('estimateWithdrawPlatformFeesGas')
        return await publicClient.estimateContractGas({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'withdrawRewards',
          account
        })
      })

      const gasLimit = gasEstimate * 120n / 100n
      const { maxFeePerGas, maxPriorityFeePerGas } = await this.getGasPrices()

      const hash = await this.retryWithBackoff(async () => {
        await this.rateLimit('withdrawPlatformFeesTx')
        return await walletClient.writeContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'withdrawRewards',
          account,
          gas: gasLimit,
          maxFeePerGas,
          maxPriorityFeePerGas
        })
      })

      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 2
      })

      return {
        success: true,
        transactionHash: hash,
        receipt
      }
    } catch (error) {
      console.error('Error withdrawing platform fees:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Get user's active games
  async getUserActiveGames(address) {
    try {
      console.log('📊 Getting active games for:', address)
      return {
        success: true,
        games: [] // Return empty array to prevent "not iterable" error
      }
    } catch (error) {
      console.error('Error getting user games:', error)
      return {
        success: false,
        error: error.message,
        games: []
      }
    }
  }

  // Update platform fee
  async updatePlatformFee(newFeePercent) {
    try {
      await this.rateLimit('updatePlatformFee')
      
      const { walletClient, public: publicClient } = this.getCurrentClients()
      
      if (!walletClient) {
        throw new Error('Wallet client not available. Please connect your wallet.')
      }

      console.log('💰 Updating platform fee to:', newFeePercent, 'basis points')

      const gasEstimate = await this.retryWithBackoff(async () => {
        await this.rateLimit('estimateUpdatePlatformFeeGas')
        return await publicClient.estimateContractGas({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'setPlatformFee',
          args: [BigInt(newFeePercent)],
          account: walletClient.account.address
        })
      })

      const gasLimit = gasEstimate * 120n / 100n
      const { maxFeePerGas, maxPriorityFeePerGas } = await this.getGasPrices()

      const hash = await this.retryWithBackoff(async () => {
        await this.rateLimit('updatePlatformFeeTx')
        return await walletClient.writeContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'setPlatformFee',
          args: [BigInt(newFeePercent)],
          account: walletClient.account.address,
          gas: gasLimit,
          maxFeePerGas,
          maxPriorityFeePerGas
        })
      })

      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 2
      })

      return {
        success: true,
        transactionHash: hash,
        receipt
      }
    } catch (error) {
      console.error('Error updating platform fee:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Update listing fee
  async updateListingFee(newFeeUSD) {
    try {
      await this.rateLimit('updateListingFee')
      
      const { walletClient, public: publicClient } = this.getCurrentClients()
      
      if (!walletClient) {
        throw new Error('Wallet client not available. Please connect your wallet.')
      }

      console.log('💰 Updating listing fee to:', newFeeUSD, 'USD (6 decimals)')

      const gasEstimate = await this.retryWithBackoff(async () => {
        await this.rateLimit('estimateUpdateListingFeeGas')
        return await publicClient.estimateContractGas({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'setListingFee',
          args: [BigInt(newFeeUSD)],
          account: walletClient.account.address
        })
      })

      const gasLimit = gasEstimate * 120n / 100n
      const { maxFeePerGas, maxPriorityFeePerGas } = await this.getGasPrices()

      const hash = await this.retryWithBackoff(async () => {
        await this.rateLimit('updateListingFeeTx')
        return await walletClient.writeContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'setListingFee',
          args: [BigInt(newFeeUSD)],
          account: walletClient.account.address,
          gas: gasLimit,
          maxFeePerGas,
          maxPriorityFeePerGas
        })
      })

      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 2
      })

      return {
        success: true,
        transactionHash: hash,
        receipt
      }
    } catch (error) {
      console.error('Error updating listing fee:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Get listing fee from contract
  async getListingFee() {
    try {
      if (!this.isInitialized()) {
        throw new Error('Contract service not initialized. Please connect your wallet.')
      }

      const listingFeeUSD = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: this.contractABI,
        functionName: 'listingFeeUSD'
      })

      // Try to get the ETH equivalent
      let listingFeeETH = null
      let ethError = null
      
      try {
        listingFeeETH = await this.publicClient.readContract({
          address: this.contractAddress,
          abi: this.contractABI,
          functionName: 'getETHAmount',
          args: [listingFeeUSD]
        })
      } catch (error) {
        ethError = error.message
        console.warn('⚠️ Could not get ETH equivalent, using fallback:', error.message)
        
        // Fallback calculation
        const ethPrice = 3000
        const listingFeeUSDDecimal = Number(listingFeeUSD) / 1000000
        const listingFeeInEth = listingFeeUSDDecimal / ethPrice
        listingFeeETH = parseEther(listingFeeInEth.toFixed(18))
      }

      return {
        success: true,
        listingFeeUSD: listingFeeUSD.toString(),
        listingFeeUSDDecimal: Number(listingFeeUSD) / 1000000,
        listingFeeETH: listingFeeETH,
        listingFeeETHFormatted: formatEther(listingFeeETH),
        ethError
      }
    } catch (error) {
      console.error('❌ Error getting listing fee:', error)
      return {
        success: false,
        error: error.message || 'Failed to get listing fee'
      }
    }
  }

  // Get platform fee from contract
  async getPlatformFee() {
    try {
      if (!this.publicClient || !this.contractAddress) {
        throw new Error('Contract service not initialized')
      }

      const feePercent = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: this.contractABI,
        functionName: 'platformFeePercent'
      })

      // Convert from basis points (e.g., 350 = 3.5%)
      const feePercentage = Number(feePercent) / 100
      
      return {
        success: true,
        feePercent: Number(feePercent),
        feePercentage
      }
    } catch (error) {
      console.error('❌ Error getting platform fee:', error)
      return {
        success: false,
        error: error.message,
        feePercent: 350, // Default to 3.5%
        feePercentage: 3.5
      }
    }
  }



  // Debug method to test contract connectivity
  async debugContract() {
    try {
      if (!this.isInitialized()) {
        return {
          success: false,
          error: 'Contract service not initialized'
        }
      }

      const results = {}

      // Test 1: Get listing fee USD
      try {
        const listingFeeUSD = await this.publicClient.readContract({
          address: this.contractAddress,
          abi: this.contractABI,
          functionName: 'listingFeeUSD'
        })
        results.listingFeeUSD = listingFeeUSD.toString()
        results.listingFeeUSDDecimal = Number(listingFeeUSD) / 1000000
      } catch (error) {
        results.listingFeeUSDError = error.message
      }

      // Test 2: Get ETH amount (price feed)
      try {
        const testUSD = 200000n // $0.20
        const ethAmount = await this.publicClient.readContract({
          address: this.contractAddress,
          abi: this.contractABI,
          functionName: 'getETHAmount',
          args: [testUSD]
        })
        results.ethAmount = formatEther(ethAmount)
        results.priceFeedWorking = true
      } catch (error) {
        results.priceFeedError = error.message
        results.priceFeedWorking = false
      }

      // Test 3: Get user balance
      try {
        const balance = await this.publicClient.getBalance({
          address: this.walletClient.account.address
        })
        results.userBalance = formatEther(balance)
      } catch (error) {
        results.balanceError = error.message
      }

      // Test 4: Get next game ID
      try {
        const nextGameId = await this.publicClient.readContract({
          address: this.contractAddress,
          abi: this.contractABI,
          functionName: 'nextGameId'
        })
        results.nextGameId = nextGameId.toString()
      } catch (error) {
        results.nextGameIdError = error.message
      }

      return {
        success: true,
        results
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Create and start game instantly when both parties are ready
  async createAndStartGame(params) {
    try {
      const {
        opponent,
        nftContract,
        tokenId,
        priceUSD,
        paymentToken,
        coinType,
        headsImage,
        tailsImage,
        isCustom
      } = params

      const { walletClient, public: publicClient } = this.getCurrentClients()
      
      if (!walletClient) {
        throw new Error('Wallet client not available. Please connect your wallet.')
      }

      console.log('🎮 Creating and starting game:', params)

      // Calculate required ETH amount
      const priceInCents = Math.floor(priceUSD * 100)
      const ethAmount = await this.getETHAmount(priceInCents * 10000) // Convert to 6 decimals
      
      // Add listing fee
      const listingFee = await this.getListingFee()
      if (!listingFee.success) {
        throw new Error('Failed to get listing fee')
      }
      const totalETH = ethAmount.add(listingFee.listingFeeETH)

      // Call contract
      const gasEstimate = await this.retryWithBackoff(async () => {
        await this.rateLimit('estimateCreateAndStartGameGas')
        return await publicClient.estimateContractGas({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'createAndStartGame',
          args: [
            opponent,
            nftContract,
            BigInt(tokenId),
            BigInt(priceInCents * 10000), // Convert cents to 6 decimals
            paymentToken || 0, // 0 = ETH
            coinType || 'default',
            headsImage || '',
            tailsImage || '',
            isCustom || false
          ],
          account: walletClient.account.address,
          value: totalETH
        })
      })

      const gasLimit = gasEstimate * 120n / 100n
      const { maxFeePerGas, maxPriorityFeePerGas } = await this.getGasPrices()

      const hash = await this.retryWithBackoff(async () => {
        await this.rateLimit('createAndStartGameTx')
        return await walletClient.writeContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'createAndStartGame',
          args: [
            opponent,
            nftContract,
            BigInt(tokenId),
            BigInt(priceInCents * 10000), // Convert cents to 6 decimals
            paymentToken || 0, // 0 = ETH
            coinType || 'default',
            headsImage || '',
            tailsImage || '',
            isCustom || false
          ],
          account: walletClient.account.address,
          gas: gasLimit,
          maxFeePerGas,
          maxPriorityFeePerGas,
          value: totalETH
        })
      })

      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 2
      })
      
      // Extract game ID from events
      const event = receipt.events?.find(e => e.event === 'GameCreated')
      const gameId = event?.args?.gameId?.toString()

      return {
        success: true,
        gameId,
        transactionHash: hash
      }
    } catch (error) {
      console.error('❌ createAndStartGame error:', error)
      return {
        success: false,
        error: error.message || 'Failed to create and start game'
      }
    }
  }

  // Withdraw NFT
  async withdrawNFT(nftContract, tokenId) {
    try {
      await this.rateLimit('withdrawNFT')
      
      const { walletClient, public: publicClient } = this.getCurrentClients()
      
      if (!walletClient) {
        throw new Error('Wallet client not available. Please connect your wallet.')
      }

      console.log('🏆 Withdrawing NFT:', { nftContract, tokenId })

      const gasEstimate = await this.retryWithBackoff(async () => {
        await this.rateLimit('estimateWithdrawNFTGas')
        return await publicClient.estimateContractGas({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'withdrawNFT',
          args: [nftContract, BigInt(tokenId)],
          account: walletClient.account.address
        })
      })

      const gasLimit = gasEstimate * 120n / 100n
      const { maxFeePerGas, maxPriorityFeePerGas } = await this.getGasPrices()

      const hash = await this.retryWithBackoff(async () => {
        await this.rateLimit('withdrawNFTTx')
        return await walletClient.writeContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'withdrawNFT',
          args: [nftContract, BigInt(tokenId)],
          account: walletClient.account.address,
          gas: gasLimit,
          maxFeePerGas,
          maxPriorityFeePerGas
        })
      })

      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 2
      })
      
      return {
        success: true,
        transactionHash: hash
      }
    } catch (error) {
      console.error('Error withdrawing NFT:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Deposit NFT for a specific game
  async depositNFTForGame(gameId, nftContract, tokenId) {
    try {
      await this.rateLimit('depositNFTForGame')
      
      const { walletClient, public: publicClient } = this.getCurrentClients()
      
      if (!walletClient) {
        throw new Error('Wallet client not available. Please connect your wallet.')
      }

      // Validate and parse game ID
      const validatedGameId = this.validateGameId(gameId)

      console.log('🎮 Depositing NFT for game:', { gameId: validatedGameId, nftContract, tokenId })

      const gasEstimate = await this.retryWithBackoff(async () => {
        await this.rateLimit('estimateDepositNFTGas')
        return await publicClient.estimateContractGas({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'depositNFTForGame',
          args: [validatedGameId, nftContract, BigInt(tokenId)],
          account: walletClient.account.address
        })
      })

      const gasLimit = gasEstimate * 120n / 100n
      const { maxFeePerGas, maxPriorityFeePerGas } = await this.getGasPrices()

      const hash = await this.retryWithBackoff(async () => {
        await this.rateLimit('depositNFTTx')
        return await walletClient.writeContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'depositNFTForGame',
          args: [validatedGameId, nftContract, BigInt(tokenId)],
          account: walletClient.account.address,
          gas: gasLimit,
          maxFeePerGas,
          maxPriorityFeePerGas
        })
      })

      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 2
      })
      
      return {
        success: true,
        transactionHash: hash
      }
    } catch (error) {
      console.error('Failed to deposit NFT:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Create blockchain game and deposit NFT for games created from offers
  async createBlockchainGameFromOffer(params) {
    try {
      await this.rateLimit('createBlockchainGameFromOffer')
      
      const { walletClient, public: publicClient } = this.getCurrentClients()
      
      if (!walletClient) {
        throw new Error('Wallet client not available. Please connect your wallet.')
      }

      const {
        opponent,
        nftContract,
        tokenId,
        priceUSD,
        coinType = 'default',
        headsImage = '',
        tailsImage = '',
        isCustom = false
      } = params

      console.log('🎮 Creating blockchain game from offer:', params)

      // Check NFT approval
      const currentApproval = await this.publicClient.readContract({
        address: nftContract,
        abi: NFT_ABI,
        functionName: 'getApproved',
        args: [BigInt(tokenId)]
      })

      if (currentApproval?.toLowerCase() !== this.contractAddress.toLowerCase()) {
        throw new Error('NFT is not approved for the contract. Please approve the NFT first.')
      }

      // Convert USD to 6 decimals
      const priceIn6Decimals = BigInt(Math.floor(priceUSD * 1000000))

      // Get listing fee
      const listingFeeUSD = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: this.contractABI,
        functionName: 'listingFeeUSD'
      })

      const listingFeeETH = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: this.contractABI,
        functionName: 'getETHAmount',
        args: [listingFeeUSD]
      })

      // Get game amount in ETH
      const gameAmountETH = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: this.contractABI,
        functionName: 'getETHAmount',
        args: [priceIn6Decimals]
      })

      // Calculate platform fee
      const platformFeePercent = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: this.contractABI,
        functionName: 'platformFeePercent'
      })

      const platformFee = (gameAmountETH * platformFeePercent) / 10000n
      const totalRequired = listingFeeETH + gameAmountETH

      console.log('💰 Required amounts:', {
        listingFeeETH: formatEther(listingFeeETH),
        gameAmountETH: formatEther(gameAmountETH),
        platformFee: formatEther(platformFee),
        totalRequired: formatEther(totalRequired)
      })

      // Check user's ETH balance
      const balance = await this.publicClient.getBalance({
        address: this.walletClient.account.address
      })
      
      if (balance < totalRequired) {
        throw new Error(`Insufficient ETH balance. You have ${formatEther(balance)} ETH but need ${formatEther(totalRequired)} ETH.`)
      }

      // Create and start game
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: this.contractABI,
        functionName: 'createAndStartGame',
        args: [
          opponent,
          nftContract,
          BigInt(tokenId),
          priceIn6Decimals,
          0, // PaymentToken.ETH
          coinType,
          headsImage,
          tailsImage,
          isCustom
        ],
        account: this.walletClient.account.address,
        value: totalRequired
      })

      const hash = await this.walletClient.writeContract(request)
      
      console.log('🎯 Create and start game transaction sent:', hash)

      const receipt = await this.publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 1 
      })

      console.log('✅ Create and start game confirmed:', receipt)

      // Get the game ID from the event
      const gameCreatedEvent = receipt.logs.find(log => {
        try {
          const decoded = decodeEventLog({
            abi: this.contractABI,
            data: log.data,
            topics: log.topics
          })
          return decoded.eventName === 'GameCreated'
        } catch {
          return false
        }
      })

      let gameId = null
      if (gameCreatedEvent) {
        const decoded = decodeEventLog({
          abi: this.contractABI,
          data: gameCreatedEvent.data,
          topics: gameCreatedEvent.topics
        })
        gameId = decoded.args.gameId.toString()
      }

      return {
        success: true,
        gameId,
        transactionHash: hash,
        receipt
      }

    } catch (error) {
      console.error('❌ Error creating blockchain game from offer:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Deposit crypto for a specific game
  async depositCryptoForGame(gameId, options = {}) {
    try {
      await this.rateLimit('depositCryptoForGame')
      
      const { walletClient, public: publicClient } = this.getCurrentClients()
      
      if (!walletClient) {
        throw new Error('Wallet client not available. Please connect your wallet.')
      }

      // Validate and parse game ID
      const validatedGameId = this.validateGameId(gameId)

      console.log('💰 Depositing crypto for game:', { gameId: validatedGameId, value: options.value })

      const gasEstimate = await this.retryWithBackoff(async () => {
        await this.rateLimit('estimateDepositCryptoGas')
        return await publicClient.estimateContractGas({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'depositCryptoForGame',
          args: [validatedGameId],
          account: walletClient.account.address,
          value: options.value || 0n
        })
      })

      const gasLimit = gasEstimate * 120n / 100n
      const { maxFeePerGas, maxPriorityFeePerGas } = await this.getGasPrices()

      const hash = await this.retryWithBackoff(async () => {
        await this.rateLimit('depositCryptoTx')
        return await walletClient.writeContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'depositCryptoForGame',
          args: [validatedGameId],
          account: walletClient.account.address,
          gas: gasLimit,
          maxFeePerGas,
          maxPriorityFeePerGas,
          value: options.value || 0n
        })
      })

      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 2
      })
      
      return {
        success: true,
        transactionHash: hash
      }
    } catch (error) {
      console.error('Failed to deposit crypto:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Cancel game with refund
  async cancelGameWithRefund(gameId, requester) {
    try {
      await this.rateLimit('cancelGameWithRefund')
      
      const { walletClient, public: publicClient } = this.getCurrentClients()
      
      if (!walletClient) {
        throw new Error('Wallet client not available. Please connect your wallet.')
      }

      // Validate and parse game ID
      const validatedGameId = this.validateGameId(gameId)

      console.log('❌ Cancelling game with refund:', { gameId: validatedGameId, requester })

      const gasEstimate = await this.retryWithBackoff(async () => {
        await this.rateLimit('estimateCancelGameGas')
        return await publicClient.estimateContractGas({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'cancelGameWithRefund',
          args: [validatedGameId],
          account: walletClient.account.address
        })
      })

      const gasLimit = gasEstimate * 120n / 100n
      const { maxFeePerGas, maxPriorityFeePerGas } = await this.getGasPrices()

      const hash = await this.retryWithBackoff(async () => {
        await this.rateLimit('cancelGameTx')
        return await walletClient.writeContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'cancelGameWithRefund',
          args: [validatedGameId],
          account: walletClient.account.address,
          gas: gasLimit,
          maxFeePerGas,
          maxPriorityFeePerGas
        })
      })

      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 2
      })
      
      return {
        success: true,
        transactionHash: hash
      }
    } catch (error) {
      console.error('Failed to cancel game:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Withdraw ETH
  async withdrawETH() {
    try {
      await this.rateLimit('withdrawETH')
      
      const { walletClient, public: publicClient } = this.getCurrentClients()
      
      if (!walletClient) {
        throw new Error('Wallet client not available. Please connect your wallet.')
      }

      console.log('💸 Withdrawing ETH')

      const gasEstimate = await this.retryWithBackoff(async () => {
        await this.rateLimit('estimateWithdrawETHGas')
        return await publicClient.estimateContractGas({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'emergencyWithdrawETH',
          args: [],
          account: walletClient.account.address
        })
      })

      const gasLimit = gasEstimate * 120n / 100n
      const { maxFeePerGas, maxPriorityFeePerGas } = await this.getGasPrices()

      const hash = await this.retryWithBackoff(async () => {
        await this.rateLimit('withdrawETHTx')
        return await walletClient.writeContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'emergencyWithdrawETH',
          args: [],
          account: walletClient.account.address,
          gas: gasLimit,
          maxFeePerGas,
          maxPriorityFeePerGas
        })
      })

      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 2
      })
      
      return {
        success: true,
        transactionHash: hash
      }
    } catch (error) {
      console.error('Failed to withdraw ETH:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Get ETH amount for USD (updated version)
  async getETHAmount(usdAmount) {
    try {
      await this.rateLimit('getETHAmount')
      
      if (!this.publicClient) {
        throw new Error('Public client not available')
      }

      console.log('💱 Getting ETH amount for USD:', usdAmount)

      const ethAmount = await this.retryWithBackoff(async () => {
        await this.rateLimit('getETHAmountCall')
        return await this.publicClient.readContract({
          address: this.contractAddress,
          abi: this.contractABI,
          functionName: 'getETHAmount',
          args: [BigInt(usdAmount * 1e6)] // Convert to 6 decimals as expected by contract
        })
      })
      
      return ethAmount
    } catch (error) {
      console.error('Failed to get ETH amount:', error)
      throw error
    }
  }

  // Check if NFT is approved for the contract
  async isNFTApproved(nftContract, tokenId, operator, owner) {
    try {
      const { public: publicClient } = this.getCurrentClients()
      // Check getApproved first
      const approvedAddress = await publicClient.readContract({
        address: nftContract,
        abi: [
          {
            name: 'getApproved',
            type: 'function',
            inputs: [{ name: 'tokenId', type: 'uint256' }],
            outputs: [{ name: '', type: 'address' }],
            stateMutability: 'view'
          }
        ],
        functionName: 'getApproved',
        args: [BigInt(tokenId)]
      })
      if (approvedAddress && approvedAddress.toLowerCase() === operator.toLowerCase()) {
        return true
      }
      // Check isApprovedForAll
      const isApprovedForAll = await publicClient.readContract({
        address: nftContract,
        abi: [
          {
            name: 'isApprovedForAll',
            type: 'function',
            inputs: [
              { name: 'owner', type: 'address' },
              { name: 'operator', type: 'address' }
            ],
            outputs: [{ name: '', type: 'bool' }],
            stateMutability: 'view'
          }
        ],
        functionName: 'isApprovedForAll',
        args: [owner, operator]
      })
      return isApprovedForAll
    } catch (error) {
      console.error('Error checking NFT approval:', error)
      return false
    }
  }
}

export default new ContractService() 