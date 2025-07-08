import { createPublicClient, createWalletClient, custom, http, decodeEventLog } from 'viem'
import { base, mainnet, bsc, avalanche, polygon } from 'viem/chains'
import { Alchemy } from 'alchemy-sdk'

// Constants
const CONTRACT_ADDRESS = "0xDA139B0285535dF163B8F59a98810af0F7655a61"
const API_URL = 'https://cryptoflipz2-production.up.railway.app'

// Contract ABI (keeping your existing ABI)
const CONTRACT_ABI = [
  // Events
  {
    name: 'GameCreated',
    type: 'event',
    anonymous: false,
    inputs: [
      { indexed: true, name: 'gameId', type: 'uint256' },
      { indexed: true, name: 'creator', type: 'address' },
      { indexed: true, name: 'nftContract', type: 'address' },
      { indexed: false, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'priceUSD', type: 'uint256' }
    ]
  },
  {
    name: 'GameJoined',
    type: 'event',
    anonymous: false,
    inputs: [
      { indexed: true, name: 'gameId', type: 'uint256' },
      { indexed: true, name: 'joiner', type: 'address' },
      { indexed: false, name: 'paymentToken', type: 'uint8' }
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
      { name: 'authInfo', type: 'string' }
    ],
    outputs: [{ name: 'gameId', type: 'uint256' }]
  },
  {
    name: 'joinGame',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'paymentToken', type: 'uint8' },
      { name: 'challengerNFTContract', type: 'address' },
      { name: 'challengerTokenId', type: 'uint256' }
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
    name: 'setFlipResult',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'flippedA', type: 'bool' },
      { name: 'flippedB', type: 'bool' },
      { name: 'power', type: 'uint8' }
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
    name: 'getGameDetails',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'gameId', type: 'uint256' }],
    outputs: [
      {
        name: 'game',
        type: 'tuple',
        components: [
          { name: 'gameId', type: 'uint256' },
          { name: 'creator', type: 'address' },
          { name: 'joiner', type: 'address' },
          { name: 'nftContract', type: 'address' },
          { name: 'tokenId', type: 'uint256' },
          { name: 'state', type: 'uint8' },
          { name: 'gameType', type: 'uint8' },
          { name: 'priceUSD', type: 'uint256' },
          { name: 'paymentToken', type: 'uint8' }
        ]
      },
      {
        name: 'nftChallenge',
        type: 'tuple',
        components: [
          { name: 'nftContract', type: 'address' },
          { name: 'tokenId', type: 'uint256' }
        ]
      }
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
      { name: 'paymentToken', type: 'uint8' }
    ]
  },
  {
    name: 'nftChallenges',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'gameId', type: 'uint256' }],
    outputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' }
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
    contractAddress: '0xDA139B0285535dF163B8F59a98810af0F7655a61',
    rpcUrls: [
      `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`, // Primary Alchemy endpoint
      'https://mainnet.base.org', // Secondary public endpoint
      'https://base.blockpi.network/v1/rpc/public' // Tertiary fallback
    ]
  },
  mainnet: {
    chain: mainnet,
    contractAddress: '0x0000000000000000000000000000000000000000', // Update with mainnet address
    rpcUrls: [
      `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      'https://cloudflare-eth.com',
      'https://eth.public-rpc.com'
    ]
  },
  polygon: {
    chain: polygon,
    contractAddress: '0x0000000000000000000000000000000000000000', // Update with polygon address
    rpcUrls: [
      `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      'https://polygon-rpc.com',
      'https://rpc-mainnet.matic.network'
    ]
  },
  bsc: {
    chain: bsc,
    contractAddress: '0x0000000000000000000000000000000000000000', // Update with BSC address
    rpcUrls: [
      'https://bsc-dataseed.binance.org',
      'https://bsc-dataseed1.defibit.io',
      'https://bsc-dataseed1.ninicoin.io'
    ]
  },
  avalanche: {
    chain: avalanche,
    contractAddress: '0x0000000000000000000000000000000000000000', // Update with Avalanche address
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
    this.chainId = null
    this.alchemy = null
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
    console.log('🔍 ContractService state check:', {
      hasWalletClient: !!this.walletClient,
      hasPublicClient: !!this.publicClient,
      walletClientType: typeof this.walletClient,
      walletClientKeys: this.walletClient ? Object.keys(this.walletClient) : 'null',
      hasAccount: !!this.walletClient?.account,
      accountKeys: this.walletClient?.account ? Object.keys(this.walletClient.account) : 'null',
      accountAddress: this.walletClient?.account?.address
    })
    
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
    
    console.log('🔍 Service initialization check:', {
      hasWalletClient,
      hasPublicClient,
      hasValidAccount,
      walletAddress: this.walletClient?.account?.address
    })
    
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
      await this.rateLimit('createGame')
      
      const { walletClient, public: publicClient } = this.getCurrentClients()
      
      if (!walletClient) {
        throw new Error('Wallet client not available. Please connect your wallet.')
      }
      
      const account = walletClient.account.address

      console.log('🎮 Creating game with params:', params)

      // First approve NFT transfer
      const approvalResult = await this.approveNFT(params.nftContract, params.tokenId)
      if (!approvalResult.success && !approvalResult.alreadyApproved) {
        throw new Error('Failed to approve NFT: ' + approvalResult.error)
      }

      // Convert price to USD with 6 decimals (e.g., $1.50 = 1500000)
      const priceUSDFormatted = Math.floor(params.priceUSD * 1000000)

      // Get listing fee from contract and convert to ETH
      const listingFeeUSD = await this.retryWithBackoff(async () => {
        await this.rateLimit('getListingFeeUSD')
        return await publicClient.readContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'listingFeeUSD'
        })
      })

      const listingFeeETH = await this.retryWithBackoff(async () => {
        await this.rateLimit('getListingFee')
        return await publicClient.readContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'getETHAmount',
          args: [listingFeeUSD]
        })
      })

      console.log('💰 Listing fee in ETH:', listingFeeETH.toString())

      // Estimate gas
      const gasEstimate = await this.retryWithBackoff(async () => {
        await this.rateLimit('estimateCreateGas')
        return await publicClient.estimateContractGas({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'createGame',
          args: [
            params.nftContract,
            BigInt(params.tokenId),
            BigInt(priceUSDFormatted),
            params.acceptedToken || 0,
            params.gameType || 0, // 0 = NFTvsCrypto, 1 = NFTvsNFT
            params.authInfo || ''
          ],
          account,
          value: listingFeeETH
        })
      })

      const gasLimit = gasEstimate * 120n / 100n
      const { maxFeePerGas, maxPriorityFeePerGas } = await this.getGasPrices()

      // Create the game
      console.log('📝 Creating game on blockchain with listing fee...')
      const hash = await this.retryWithBackoff(async () => {
        await this.rateLimit('createGameTx')
        return await walletClient.writeContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'createGame',
          args: [
            params.nftContract,
            BigInt(params.tokenId),
            BigInt(priceUSDFormatted),
            params.acceptedToken || 0,
            params.gameType || 0, // 0 = NFTvsCrypto, 1 = NFTvsNFT
            params.authInfo || ''
          ],
          account,
          value: listingFeeETH,
          gas: gasLimit,
          maxFeePerGas,
          maxPriorityFeePerGas
        })
      })

      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 2
      })

      // Extract game ID from event logs
      let gameId
      const event = receipt.logs.find(log => {
        try {
          const decoded = decodeEventLog({
            abi: CONTRACT_ABI,
            data: log.data,
            topics: log.topics
          })
          return decoded.eventName === 'GameCreated'
        } catch {
          return false
        }
      })

      if (event) {
        const decoded = decodeEventLog({
          abi: CONTRACT_ABI,
          data: event.data,
          topics: event.topics
        })
        gameId = decoded.args.gameId.toString()
      } else {
        // Fallback: get next game ID and subtract 1
        const nextId = await publicClient.readContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'nextGameId'
        })
        gameId = (nextId - 1n).toString()
      }

      console.log('✅ Game created with ID:', gameId)

      // Store in database
      try {
        const nftMetadata = await this.getNFTMetadata(params.nftContract, params.tokenId)
        
        const gameData = {
          creator: account,
          nft_contract: params.nftContract,
          nft_token_id: params.tokenId.toString(),
          nft_name: nftMetadata?.name || 'Unknown NFT',
          nft_image: nftMetadata?.image || '',
          price_usd: params.priceUSD,
          game_type: params.gameType === 1 ? 'nft-vs-nft' : 'nft-vs-crypto',
          status: 'waiting',
          transaction_hash: hash,
          contract_game_id: gameId,
          coin: params.coin ? JSON.stringify(params.coin) : null // Store coin data as JSON string
        }

        console.log('🪙 Storing coin data in database:', params.coin)
        console.log('🪙 Coin data as JSON string:', JSON.stringify(params.coin))

        await fetch(`${API_URL}/api/games`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gameData)
        })
        
        console.log('✅ Game stored in database with NFT metadata')
      } catch (dbError) {
        console.warn('⚠️ Could not store game in database:', dbError.message)
      }

      return {
        success: true,
        gameId: gameId,
        transactionHash: hash
      }
    } catch (error) {
      console.error('❌ Error creating game:', error)
      
      let errorMessage = error.message
      if (error.message.includes('WRONG_FROM')) {
        errorMessage = 'NFT approval failed. The NFT contract may have restrictions or you may not own this NFT.'
      } else if (error.message.includes('rate limit') || error.message.includes('429')) {
        errorMessage = 'Network is busy. Please wait 30 seconds and try again.'
      } else if (error.message.includes('execution reverted')) {
        errorMessage = 'Game creation failed. Please check your NFT ownership and try again.'
      } else if (error.message.includes('User denied') || error.message.includes('user rejected')) {
        errorMessage = 'Transaction was cancelled by user.'
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

      const result = await this.retryWithBackoff(async () => {
        return await publicClient.readContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'getGameDetails',
          args: [BigInt(gameId)]
        })
      })

      return {
        success: true,
        data: {
          game: result[0],
          nftChallenge: result[1]
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

  // Join game
  async joinGame(params) {
    try {
      await this.rateLimit('joinGame')
      
      // Check if service is properly initialized before proceeding
      if (!this.isInitialized()) {
        console.warn('⚠️ Contract service not properly initialized, attempting to reinitialize...')
        throw new Error('Contract service needs to be reinitialized. Please try again.')
      }
      
      // Try to get clients, with detailed error logging
      let walletClient, publicClient
      try {
        const clients = this.getCurrentClients()
        walletClient = clients.walletClient
        publicClient = clients.public
      } catch (clientError) {
        console.error('❌ Failed to get current clients:', clientError.message)
        throw new Error('Wallet client validation failed. Please reconnect your wallet.')
      }
      
      if (!walletClient) {
        throw new Error('Wallet client not available. Please connect your wallet.')
      }
      
      const account = walletClient.account.address
      console.log('🎮 Join game - wallet client validated:', {
        account,
        hasAccount: !!walletClient.account,
        accountAddress: walletClient.account?.address
      })

      console.log('🎮 Joining game with params:', params)

      // Get game details first with retry
      const gameDetails = await this.retryWithBackoff(async () => {
        // NOTE: Don't call rateLimit inside getGameDetails as it already does
        return await this.getGameDetails(params.gameId)
      })

      if (!gameDetails.success) {
        throw new Error('Failed to get game details: ' + gameDetails.error)
      }

      const game = gameDetails.data.game

      // Validate game state
      if (game.state !== 0) { // 0 = Created
        throw new Error('Game is not available for joining')
      }

      if (game.creator.toLowerCase() === account.toLowerCase()) {
        throw new Error('Cannot join your own game')
      }

      // Calculate payment amount (including platform fee)
      let paymentAmount = 0n
      if (params.paymentToken === 0) { // ETH payment
        // Get base ETH amount for the game price
        const baseAmount = await this.retryWithBackoff(async () => {
          await this.rateLimit('getETHAmountJoin')
          return await publicClient.readContract({
            address: this.contractAddress,
            abi: CONTRACT_ABI,
            functionName: 'getETHAmount',
            args: [game.priceUSD]
          })
        })
        
        // Get platform fee percentage
        const platformFeePercent = await this.retryWithBackoff(async () => {
          await this.rateLimit('getPlatformFeePercent')
          return await publicClient.readContract({
            address: this.contractAddress,
            abi: CONTRACT_ABI,
            functionName: 'platformFeePercent'
          })
        })
        
        // Calculate platform fee amount
        const platformFee = (baseAmount * platformFeePercent) / 10000n // basis points
        
        // Total amount = base amount + platform fee
        paymentAmount = baseAmount + platformFee
        
        console.log('💰 Payment calculation:', {
          gamePriceUSD: game.priceUSD.toString(),
          baseAmount: baseAmount.toString(),
          platformFeePercent: platformFeePercent.toString(),
          platformFee: platformFee.toString(),
          totalAmount: paymentAmount.toString()
        })
      }

      // Prepare join parameters
      const joinParams = [
        BigInt(params.gameId),
        params.paymentToken || 0,
        params.challengerNFTContract || '0x0000000000000000000000000000000000000000',
        BigInt(params.challengerTokenId || 0)
      ]

      // If NFT vs NFT, approve the challenger NFT
      if (game.gameType === 1 && params.challengerNFTContract) {
        const approvalResult = await this.approveNFT(
          params.challengerNFTContract,
          params.challengerTokenId
        )
        if (!approvalResult.success && !approvalResult.alreadyApproved) {
          throw new Error('Failed to approve challenger NFT: ' + approvalResult.error)
        }
      }

      // Estimate gas
      const gasEstimate = await this.retryWithBackoff(async () => {
        await this.rateLimit('estimateGasJoin')
        return await publicClient.estimateContractGas({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'joinGame',
          args: joinParams,
          account,
          value: paymentAmount
        })
      })

      const gasLimit = gasEstimate * 120n / 100n
      const { maxFeePerGas, maxPriorityFeePerGas } = await this.getGasPrices()

      // Join the game
      console.log('🎮 Joining game on blockchain...')
      const hash = await this.retryWithBackoff(async () => {
        await this.rateLimit('joinGameTx')
        return await walletClient.writeContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'joinGame',
          args: joinParams,
          account,
          value: paymentAmount,
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
      console.error('❌ Error joining game:', error)
      
      let errorMessage = error.message
      if (error.message.includes('rate limit')) {
        errorMessage = 'Network is busy. Please wait a moment and try again.'
      } else if (error.message.includes('execution reverted')) {
        errorMessage = 'Failed to join game. The game may no longer be available.'
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

  // Get ETH amount for USD price
  async getETHAmount(priceUSD) {
    try {
      await this.rateLimit('getETHAmount')
      
      const { public: publicClient } = this.getCurrentClients()
      
      return await this.retryWithBackoff(async () => {
        return await publicClient.readContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'getETHAmount',
          args: [priceUSD]
        })
      })
    } catch (error) {
      console.error('Error getting ETH amount:', error)
      throw error
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

      console.log('🏆 Completing game:', { gameId, winner })

      const gasEstimate = await this.retryWithBackoff(async () => {
        await this.rateLimit('estimateCompleteGas')
        return await publicClient.estimateContractGas({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'completeGame',
          args: [BigInt(gameId), winner],
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
          args: [BigInt(gameId), winner],
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

  // Cancel game
  async cancelGame(gameId) {
    try {
      await this.rateLimit('cancelGame')
      
      const { walletClient, public: publicClient } = this.getCurrentClients()
      
      if (!walletClient) {
        throw new Error('Wallet client not available. Please connect your wallet.')
      }

      console.log('❌ Cancelling game:', gameId)

      const gasEstimate = await this.retryWithBackoff(async () => {
        await this.rateLimit('estimateCancelGas')
        return await publicClient.estimateContractGas({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'cancelGame',
          args: [BigInt(gameId)],
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
          args: [BigInt(gameId)],
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
        eth: unclaimedETH,
        usdc: unclaimedUSDC
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
        throw new Error('Wallet client not available. Please connect your wallet.')
      }
      
      const account = walletClient.account.address

      console.log('🏆 Withdrawing rewards...')
      
      // Estimate gas
      const gasEstimate = await this.retryWithBackoff(async () => {
        await this.rateLimit('estimateWithdrawGas')
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
        await this.rateLimit('withdrawTx')
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
      console.error('Error withdrawing rewards:', error)
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
      await this.rateLimit('getListingFee')
      
      const { public: publicClient } = this.getCurrentClients()
      
      const listingFee = await this.retryWithBackoff(async () => {
        await this.rateLimit('readListingFee')
        return await publicClient.readContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'listingFeeUSD'
        })
      })

      return listingFee
    } catch (error) {
      console.error('Error getting listing fee:', error)
      throw error
    }
  }

  // Get platform fee from contract
  async getPlatformFee() {
    try {
      await this.rateLimit('getPlatformFee')
      
      const { public: publicClient } = this.getCurrentClients()
      
      const platformFee = await this.retryWithBackoff(async () => {
        await this.rateLimit('readPlatformFee')
        return await publicClient.readContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'platformFeePercent'
        })
      })

      return platformFee
    } catch (error) {
      console.error('Error getting platform fee:', error)
      throw error
    }
  }

  // Set flip result
  async setFlipResult(gameId, flippedA, flippedB, power) {
    try {
      await this.rateLimit('setFlipResult')
      
      const { walletClient, public: publicClient } = this.getCurrentClients()
      
      if (!walletClient) {
        throw new Error('Wallet client not available. Please connect your wallet.')
      }

      console.log('🎲 Setting flip result:', { gameId, flippedA, flippedB, power })

      const gasEstimate = await this.retryWithBackoff(async () => {
        await this.rateLimit('estimateFlipGas')
        return await publicClient.estimateContractGas({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'setFlipResult',
          args: [BigInt(gameId), flippedA, flippedB, power],
          account: walletClient.account.address
        })
      })

      const gasLimit = gasEstimate * 120n / 100n
      const { maxFeePerGas, maxPriorityFeePerGas } = await this.getGasPrices()

      const hash = await this.retryWithBackoff(async () => {
        await this.rateLimit('setFlipTx')
        return await walletClient.writeContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'setFlipResult',
          args: [BigInt(gameId), flippedA, flippedB, power],
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
      console.error('Error setting flip result:', error)
      return {
        success: false,
        error: error.message
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
}

export default new ContractService() 