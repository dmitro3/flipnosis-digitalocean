import { createPublicClient, createWalletClient, custom, http } from 'viem'
import { base, mainnet, bsc, avalanche, polygon } from 'viem/chains'

// Contract ABI - Essential functions only
const CONTRACT_ABI = [
  // Create game
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
    outputs: []
  },
  // Join Game
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
  // Complete game
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
  // Cancel game
  {
    name: 'cancelGame',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'gameId', type: 'uint256' }],
    outputs: []
  },
  // Withdraw functions
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
  // Read functions
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
          { name: 'paymentToken', type: 'uint8' },
          { name: 'totalPaid', type: 'uint256' },
          { name: 'winner', type: 'address' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'expiresAt', type: 'uint256' }
        ]
      },
      {
        name: 'nftChallenge',
        type: 'tuple',
        components: [
          { name: 'challengerNFTContract', type: 'address' },
          { name: 'challengerTokenId', type: 'uint256' }
        ]
      }
    ]
  },
  {
    name: 'unclaimedETH',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'unclaimedUSDC',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
]

// NFT Contract ABI for approvals
const NFT_ABI = [
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }]
  },
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
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }]
  },
  {
    name: 'setApprovalForAll',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' }
    ],
    outputs: []
  },
  {
    name: 'isApprovedForAll',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'operator', type: 'address' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
]

// Alchemy API key
const ALCHEMY_API_KEY = process.env.VITE_ALCHEMY_API_KEY || 'hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3'

// Chain configurations with Alchemy endpoints for better reliability
const CHAIN_CONFIGS = {
  base: {
    chain: base,
    contractAddress: '0xb2d09A3A6E502287D0acdAC31328B01AADe35941',
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
    this.contractAddress = null
    this.chainId = null
    this.clients = {}
    this.rateLimitRetries = {}
    this.lastRequestTime = {}
    this.minRequestInterval = 500 // Minimum ms between requests
  }

  // Initialize clients for a specific chain
  async initializeClients(chainId, walletClient = null) {
    const config = CHAIN_CONFIGS[this.getChainName(chainId)]
    if (!config) {
      throw new Error(`Unsupported chain: ${chainId}`)
    }

    this.chainId = chainId
    this.contractAddress = config.contractAddress

    // Create public client with multiple RPC endpoints for fallback
    const publicClient = createPublicClient({
      chain: config.chain,
      transport: http(config.rpcUrls[0], {
        retryCount: 3,
        retryDelay: 1000,
        timeout: 30000,
        batch: {
          multicall: {
            batchSize: 50,
            wait: 100
          }
        }
      })
    })

    // Store clients
    this.clients[chainId] = {
      public: publicClient,
      wallet: walletClient
    }

    console.log(`✅ Initialized clients for chain ${chainId} with Alchemy RPC`)
    return this.clients[chainId]
  }

  // Get chain name from ID
  getChainName(chainId) {
    const chainMap = {
      1: 'mainnet',
      56: 'bsc',
      137: 'polygon',
      8453: 'base',
      43114: 'avalanche'
    }
    return chainMap[chainId] || 'unknown'
  }

  // Get current clients
  getCurrentClients() {
    if (!this.chainId || !this.clients[this.chainId]) {
      throw new Error('Contract service not initialized. Please connect wallet.')
    }
    return this.clients[this.chainId]
  }

  // Rate limit protection with exponential backoff
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

      // First approve the NFT
      console.log('🔐 Approving NFT for transfer...')
      const approvalResult = await this.approveNFT(params.nftContract, params.tokenId)
      if (!approvalResult.success && !approvalResult.alreadyApproved) {
        throw new Error('Failed to approve NFT: ' + approvalResult.error)
      }

      // Get listing fee with retry logic
      const { listingFeeUSD, ethAmount } = await this.retryWithBackoff(async () => {
        await this.rateLimit('getListingFee')
        
        const listingFeeUSD = await publicClient.readContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'listingFeeUSD'
        })

        await this.rateLimit('getETHAmount')
        
        const ethAmount = await publicClient.readContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'getETHAmount',
          args: [listingFeeUSD]
        })
        
        return { listingFeeUSD, ethAmount }
      })

      console.log(`💰 Listing fee: ${ethAmount} ETH`)

      // Create game parameters
      const gameParams = [
        params.nftContract,
        BigInt(params.tokenId),
        BigInt(Math.floor(params.priceUSD * 1000000)), // Convert to 6 decimals
        params.acceptedToken || 0, // 0 = ETH, 1 = USDC
        params.gameType || 0, // 0 = NFTvsCrypto, 1 = NFTvsNFT
        params.authInfo || ''
      ]

      console.log('🎮 Game parameters:', gameParams)

      // Estimate gas with proper gas prices for Base
      const gasEstimate = await this.retryWithBackoff(async () => {
        await this.rateLimit('estimateGas')
        
        return await publicClient.estimateContractGas({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'createGame',
          args: gameParams,
          account,
          value: ethAmount
        })
      })

      // Add 20% buffer to gas estimate
      const gasLimit = gasEstimate * 120n / 100n

      // Get current gas prices with Base-specific values
      const { maxFeePerGas, maxPriorityFeePerGas } = await this.getGasPrices()

      // Create the game with proper gas settings
      console.log('🎮 Creating game on blockchain...')
      const hash = await this.retryWithBackoff(async () => {
        await this.rateLimit('createGameTx')
        
        return await walletClient.writeContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'createGame',
          args: gameParams,
          account,
          value: ethAmount,
          gas: gasLimit,
          maxFeePerGas,
          maxPriorityFeePerGas
        })
      })

      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 2 // Wait for 2 confirmations for safety
      })

      // Get the game ID from the receipt
      await this.rateLimit('getNextGameId')
      const nextGameId = await publicClient.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'nextGameId'
      })
      const gameId = Number(nextGameId) - 1

      return {
        success: true,
        gameId: gameId.toString(),
        transactionHash: hash,
        receipt
      }
    } catch (error) {
      console.error('❌ Error creating game:', error)
      
      // Provide more specific error messages
      let errorMessage = error.message
      if (error.message.includes('WRONG_FROM')) {
        errorMessage = 'NFT approval failed. The NFT contract may have restrictions or you may not own this NFT.'
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Network is busy. Please wait a moment and try again.'
      } else if (error.message.includes('execution reverted')) {
        errorMessage = 'Game creation failed. Please check your NFT ownership and try again.'
      }
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  // Join an existing game
  async joinGame(params) {
    try {
      await this.rateLimit('joinGame')
      
      const { walletClient, public: publicClient } = this.getCurrentClients()
      
      if (!walletClient) {
        throw new Error('Wallet client not available. Please connect your wallet.')
      }
      
      const account = walletClient.account.address

      console.log('🎮 Joining game with params:', params)

      // Get game details first with retry
      const gameDetails = await this.retryWithBackoff(async () => {
        await this.rateLimit('getGameDetails')
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

      // Calculate payment amount
      let paymentAmount = 0n
      if (params.paymentToken === 0) { // ETH payment
        paymentAmount = await this.retryWithBackoff(async () => {
          await this.rateLimit('getETHAmountJoin')
          return await publicClient.readContract({
            address: this.contractAddress,
            abi: CONTRACT_ABI,
            functionName: 'getETHAmount',
            args: [game.priceUSD]
          })
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
      console.warn('Failed to get gas prices, using defaults:', error)
      // Fallback gas prices for Base
      return {
        maxFeePerGas: 200000000n, // 0.2 gwei
        maxPriorityFeePerGas: 100000000n // 0.1 gwei
      }
    }
  }

  // Approve NFT for transfer
  async approveNFT(nftContract, tokenId) {
    try {
      await this.rateLimit('approveNFT')
      
      const { walletClient, public: publicClient } = this.getCurrentClients()
      
      if (!walletClient) {
        throw new Error('Wallet client not available')
      }

      const account = walletClient.account.address

      // Check current approval with retry
      const currentApproval = await this.retryWithBackoff(async () => {
        await this.rateLimit('getApproved')
        return await publicClient.readContract({
          address: nftContract,
          abi: NFT_ABI,
          functionName: 'getApproved',
          args: [BigInt(tokenId)]
        })
      })

      if (currentApproval.toLowerCase() === this.contractAddress.toLowerCase()) {
        console.log('✅ NFT already approved')
        return { success: true, alreadyApproved: true }
      }

      // Check ownership
      const owner = await this.retryWithBackoff(async () => {
        await this.rateLimit('ownerOf')
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

  // Get user's active games (for ProfileWithNotifications)
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
}

export default new ContractService() 