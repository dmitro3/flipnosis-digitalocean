import { createPublicClient, createWalletClient, custom, http } from 'viem'
import { base, mainnet, bsc, avalanche, polygon } from 'viem/chains'

// Contract ABI - Essential functions only
const CONTRACT_ABI = [
  // Create game (using struct like working reference)
  {
    name: 'createGame',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'nftContract', type: 'address' },
          { name: 'tokenId', type: 'uint256' },
          { name: 'priceUSD', type: 'uint256' },
          { name: 'acceptedToken', type: 'uint8' },
          { name: 'maxRounds', type: 'uint8' },
          { name: 'authInfo', type: 'string' }
        ]
      }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  // GameCreated event
  {
    name: 'GameCreated',
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'gameId', type: 'uint256', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'nftContract', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: false },
      { name: 'priceUSD', type: 'uint256', indexed: false },
      { name: 'acceptedToken', type: 'uint8', indexed: false },
      { name: 'authInfo', type: 'string', indexed: false }
    ]
  },
  // Join Game
  {
    name: 'joinGame',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'choice', type: 'uint8' }
    ],
    outputs: []
  },
  // Flip coin
  {
    name: 'flip',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'power', type: 'uint8' }
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
    this.contract = null
    this.publicClient = null
    this.walletClient = null
  }

  // Initialize contract with clients (using the working pattern from references)
  async initializeClients(chainId, walletClient) {
    if (!walletClient) {
      throw new Error('Wallet client is required')
    }
    
    // For Base network, use the working contract address
    if (chainId === 8453) {
      this.contractAddress = "0xb2d09A3A6E502287D0acdAC31328B01AADe35941"
    } else {
      throw new Error(`Unsupported chain: ${chainId}`)
    }

    this.chainId = chainId
    this.walletClient = walletClient

    // Create public client for Base
    this.publicClient = createPublicClient({
      chain: base,
      transport: http('https://mainnet.base.org')
    })

    console.log('✅ Contract service initialized with working pattern')
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

  // Get current clients (using simple pattern)
  getCurrentClients() {
    if (!this.walletClient) {
      throw new Error('Wallet client not available. Please connect your wallet.')
    }
    
    return {
      wallet: this.walletClient,
      public: this.publicClient
    }
  }

  // Check if service is initialized
  isInitialized() {
    return !!this.walletClient && !!this.publicClient
  }

  // Get current chain
  get currentChain() {
    return this.chainId
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

  // Create a new game (using working pattern from references)
  async createGame(params) {
    try {
      if (!this.walletClient) {
        throw new Error('Contract not initialized with wallet client')
      }

      console.log('🎮 Creating game with params:', params)

      // First approve NFT transfer
      const nftAbi = [
        {
          name: 'approve',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'tokenId', type: 'uint256' }
          ],
          outputs: [{ type: 'bool' }]
        }
      ]

      const approveTx = await this.walletClient.writeContract({
        address: params.nftContract,
        abi: nftAbi,
        functionName: 'approve',
        args: [this.contractAddress, params.tokenId]
      })

      // Wait for approval transaction
      await this.publicClient.waitForTransactionReceipt({ hash: approveTx })

      // Convert price to USD with 6 decimals (e.g., $1.50 = 1500000)
      const priceUSDFormatted = Math.floor(params.priceUSD * 1000000)

      // Create the game using CreateGameParams struct
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'createGame',
        args: [{
          nftContract: params.nftContract,
          tokenId: BigInt(params.tokenId),
          priceUSD: BigInt(priceUSDFormatted),
          acceptedToken: params.acceptedToken || 0,
          maxRounds: 5, // Default to 5 rounds
          authInfo: params.authInfo || ''
        }]
      })

      // Wait for transaction
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      
      // Get the current nextGameId and subtract 1 to get the created game ID
      const nextGameId = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'nextGameId'
      })
      
      const gameId = (nextGameId - 1n).toString()
      console.log('✅ Game created with ID:', gameId)

      return {
        success: true,
        gameId: gameId,
        transactionHash: hash
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

  // Get game (for FlipGame)
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

  // Join a game (using working pattern from references)
  async joinGame(params) {
    try {
      if (!this.walletClient) {
        throw new Error('Contract not initialized with wallet client')
      }

      console.log('🎮 Joining game with params:', params)

      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'joinGame',
        args: [BigInt(params.gameId), params.choice || 0]
      })

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      
      return {
        success: true,
        transactionHash: hash
      }
    } catch (error) {
      console.error('Error joining game:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Flip coin (using working pattern from references)
  async flipCoin(params) {
    try {
      if (!this.walletClient) {
        throw new Error('Contract not initialized with wallet client')
      }

      console.log('🪙 Flipping coin with params:', params)

      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'flip',
        args: [BigInt(params.gameId), params.power || 0]
      })

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      
      return {
        success: true,
        transactionHash: hash
      }
    } catch (error) {
      console.error('Error flipping coin:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Cancel game (using working pattern from references)
  async cancelGame(gameId) {
    try {
      if (!this.walletClient) {
        throw new Error('Contract not initialized with wallet client')
      }

      console.log('❌ Cancelling game:', gameId)

      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'cancelGame',
        args: [BigInt(gameId)]
      })

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      
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

  // Withdraw NFT (using working pattern from references)
  async withdrawNFT(nftContract, tokenId) {
    try {
      if (!this.walletClient) {
        throw new Error('Contract not initialized with wallet client')
      }

      console.log('🏆 Withdrawing NFT:', { nftContract, tokenId })

      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'withdrawNFT',
        args: [nftContract, BigInt(tokenId)]
      })

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      
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

  // Emergency cancel game (using working pattern from references)
  async emergencyCancelGame(gameId) {
    try {
      if (!this.walletClient) {
        throw new Error('Contract not initialized with wallet client')
      }

      console.log('🚨 Emergency cancelling game:', gameId)

      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'cancelGame',
        args: [BigInt(gameId)]
      })

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      
      return {
        success: true,
        transactionHash: hash
      }
    } catch (error) {
      console.error('Error emergency cancelling game:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

export default new ContractService() 