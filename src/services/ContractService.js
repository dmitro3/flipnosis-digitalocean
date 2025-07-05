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
  // View functions
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
    name: 'getETHAmount',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'usdAmount', type: 'uint256' }],
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
    name: 'nextGameId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
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

// Chain configurations with Alchemy endpoints for better reliability
const CHAIN_CONFIGS = {
  base: {
    chain: base,
    contractAddress: '0xb2d09A3A6E502287D0acdAC31328B01AADe35941', // Base contract address
    rpcUrls: [
      'https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5R3', // Primary Alchemy endpoint
      'https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5R3', // Backup Alchemy endpoint
      'https://base.blockpi.network/v1/rpc/public', // Fallback public endpoint
      'https://mainnet.base.org' // Secondary fallback
    ],
    currentRpcIndex: 0
  },
  ethereum: {
    chain: mainnet,
    contractAddress: '0x0000000000000000000000000000000000000000', // Deploy and add address
    rpcUrl: 'https://eth.llamarpc.com'
  },
  bnb: {
    chain: bsc,
    contractAddress: '0x0000000000000000000000000000000000000000', // Deploy and add address
    rpcUrl: 'https://bsc-dataseed.binance.org/'
  },
  avalanche: {
    chain: avalanche,
    contractAddress: '0x0000000000000000000000000000000000000000', // Deploy and add address
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc'
  },
  polygon: {
    chain: polygon,
    contractAddress: '0x0000000000000000000000000000000000000000', // Deploy and add address
    rpcUrl: 'https://polygon-rpc.com/'
  }
}

class ContractService {
  constructor() {
    this.walletClient = null
    this.publicClient = null
    this.currentChain = null
    this.contractAddress = null
    this.requestCount = 0
    this.lastRequestTime = 0
    this.rateLimitDelay = 200 // 200ms between requests (Alchemy has higher limits)
    this.maxRetries = 3
  }

  // Initialize with wallet and chain
  async init(chainName, walletClient, publicClient) {
    const config = CHAIN_CONFIGS[chainName.toLowerCase()]
    if (!config) {
      throw new Error(`Unsupported chain: ${chainName}`)
    }

    this.currentChain = chainName.toLowerCase()
    this.contractAddress = config.contractAddress
    this.walletClient = walletClient
    this.publicClient = publicClient || createPublicClient({
      chain: config.chain,
      transport: http(config.rpcUrls ? config.rpcUrls[0] : config.rpcUrl)
    })

    console.log(`✅ Contract service initialized for ${chainName}`)
    console.log(`📍 Contract address: ${this.contractAddress}`)
  }

  // Rate limiting helper
  async waitForRateLimit() {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest
      console.log(`⏳ Rate limiting: waiting ${waitTime}ms`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    this.lastRequestTime = Date.now()
    this.requestCount++
  }

  // Get current RPC URL with fallback
  getCurrentRpcUrl() {
    const config = CHAIN_CONFIGS[this.currentChain]
    if (!config || !config.rpcUrls) {
      return config?.rpcUrl || null
    }
    return config.rpcUrls[config.currentRpcIndex || 0]
  }

  // Switch to next RPC endpoint
  switchToNextRpc() {
    const config = CHAIN_CONFIGS[this.currentChain]
    if (!config || !config.rpcUrls) {
      return false
    }
    
    const currentIndex = config.currentRpcIndex || 0
    const nextIndex = (currentIndex + 1) % config.rpcUrls.length
    config.currentRpcIndex = nextIndex
    
    console.log(`🔄 Switching RPC from ${config.rpcUrls[currentIndex]} to ${config.rpcUrls[nextIndex]}`)
    
    // Recreate the public client with the new RPC URL
    if (this.publicClient) {
      this.publicClient = createPublicClient({
        chain: config.chain,
        transport: http(config.rpcUrls[nextIndex])
      })
      console.log(`✅ Recreated public client with new RPC: ${config.rpcUrls[nextIndex]}`)
    }
    
    return true
  }

  // Get current configuration
  getCurrentConfig() {
    if (!this.currentChain) {
      throw new Error('Contract service not initialized')
    }
    return CHAIN_CONFIGS[this.currentChain]
  }

  // Get current clients
  getCurrentClients() {
    if (!this.publicClient) {
      throw new Error('Public client not initialized')
    }
    
    // For read-only operations, we only need publicClient
    if (!this.walletClient) {
      return {
        walletClient: null,
        publicClient: this.publicClient
      }
    }
    
    return {
      walletClient: this.walletClient,
      publicClient: this.publicClient
    }
  }

  // Approve NFT for transfer
  async approveNFT(nftContract, tokenId) {
    try {
      const { walletClient, publicClient } = this.getCurrentClients()
      const account = walletClient.account.address

      console.log(`🔐 Checking NFT approval for contract: ${nftContract}, token: ${tokenId}`)
      console.log(`🎮 Game contract address: ${this.contractAddress}`)

      // First, let's check if the NFT contract is valid
      try {
        const contractCode = await publicClient.getBytecode({ address: nftContract })
        if (!contractCode || contractCode === '0x') {
          throw new Error('NFT contract does not exist or has no code')
        }
        console.log('✅ NFT contract exists and has code')
      } catch (codeError) {
        console.error('❌ NFT contract validation failed:', codeError.message)
        return {
          success: false,
          error: `Invalid NFT contract: ${codeError.message}`
        }
      }

      // Try to check if already approved, but handle errors gracefully
      let alreadyApproved = false
      try {
        // First check if approved for all
        const approvedForAll = await publicClient.readContract({
          address: nftContract,
          abi: NFT_ABI,
          functionName: 'isApprovedForAll',
          args: [account, this.contractAddress]
        })

        if (approvedForAll) {
          console.log('✅ NFT already approved for all')
          return { success: true, alreadyApproved: true, method: 'setApprovalForAll' }
        }

        // Then check individual token approval
        const approved = await publicClient.readContract({
          address: nftContract,
          abi: NFT_ABI,
          functionName: 'getApproved',
          args: [BigInt(tokenId)]
        })

        if (approved.toLowerCase() === this.contractAddress.toLowerCase()) {
          console.log('✅ NFT already approved')
          return { success: true, alreadyApproved: true, method: 'approve' }
        }
      } catch (checkError) {
        console.warn('⚠️ Could not check approval status, proceeding with approval:', checkError.message)
        // Continue with approval even if we can't check current status
      }

      // Try to approve NFT
      console.log('🔐 Approving NFT...')
      
      try {
        // First try individual token approval
        const { request } = await publicClient.simulateContract({
          address: nftContract,
          abi: NFT_ABI,
          functionName: 'approve',
          args: [this.contractAddress, BigInt(tokenId)],
          account
        })

        const hash = await walletClient.writeContract(request)
        const receipt = await publicClient.waitForTransactionReceipt({ hash })

        console.log('✅ NFT approval successful (individual token)')
        return {
          success: true,
          transactionHash: hash,
          receipt
        }
      } catch (approvalError) {
        console.warn('⚠️ Individual token approval failed, trying setApprovalForAll:', approvalError.message)
        
        // Try setApprovalForAll as fallback
        const { request } = await publicClient.simulateContract({
          address: nftContract,
          abi: NFT_ABI,
          functionName: 'setApprovalForAll',
          args: [this.contractAddress, true],
          account
        })

        const hash = await walletClient.writeContract(request)
        const receipt = await publicClient.waitForTransactionReceipt({ hash })

        console.log('✅ NFT approval successful (setApprovalForAll)')
        return {
          success: true,
          transactionHash: hash,
          receipt,
          method: 'setApprovalForAll'
        }
      }
    } catch (error) {
      console.error('❌ Error approving NFT:', error)
      
      // Provide more specific error messages
      let errorMessage = error.message
      if (error.message.includes('stack underflow')) {
        errorMessage = 'NFT contract does not support standard ERC721 approval. This NFT may not be compatible with the game.'
      } else if (error.message.includes('execution reverted')) {
        errorMessage = 'NFT approval failed. You may not own this NFT or it may not be transferable.'
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds to pay for NFT approval transaction.'
      }
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  // Create a new game
  async createGame(params) {
    try {
      await this.waitForRateLimit()
      
      const { walletClient, publicClient } = this.getCurrentClients()
      const account = walletClient.account.address

      console.log('🎮 Creating game with params:', {
        nftContract: params.nftContract,
        tokenId: params.tokenId,
        priceUSD: params.priceUSD,
        account: account
      })

      // Verify NFT ownership first with retry logic
      console.log('🔍 Verifying NFT ownership...')
      let owner
      let retryCount = 0
      
      while (retryCount < this.maxRetries) {
        try {
          owner = await publicClient.readContract({
            address: params.nftContract,
            abi: NFT_ABI,
            functionName: 'ownerOf',
            args: [BigInt(params.tokenId)]
          })
          break
        } catch (error) {
          retryCount++
          console.warn(`⚠️ NFT ownership check error (attempt ${retryCount}/${this.maxRetries}):`, error.message)
          
          if (error.message.includes('429') || error.message.includes('rate limit')) {
            this.switchToNextRpc()
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
          } else if (retryCount < this.maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 500 * retryCount))
          } else {
            throw new Error('Failed to verify NFT ownership: ' + error.message)
          }
        }
      }
      
      if (owner.toLowerCase() !== account.toLowerCase()) {
        throw new Error(`You don't own this NFT. Owner: ${owner}, Your address: ${account}`)
      }
      
      console.log('✅ NFT ownership verified')

      // First approve the NFT
      console.log('🔐 Approving NFT for transfer...')
      const approvalResult = await this.approveNFT(params.nftContract, params.tokenId)
      if (!approvalResult.success && !approvalResult.alreadyApproved) {
        throw new Error('Failed to approve NFT: ' + approvalResult.error)
      }

      // Get listing fee amount in ETH with retry logic for rate limits
      let listingFeeUSD, ethAmount
      const maxRetries = 3
      let feeRetryCount = 0
      
      while (feeRetryCount < maxRetries) {
        try {
          listingFeeUSD = await publicClient.readContract({
            address: this.contractAddress,
            abi: CONTRACT_ABI,
            functionName: 'listingFeeUSD'
          })

          // Add small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 1000))

          ethAmount = await publicClient.readContract({
            address: this.contractAddress,
            abi: CONTRACT_ABI,
            functionName: 'getETHAmount',
            args: [listingFeeUSD]
          })
          
          break // Success, exit retry loop
        } catch (rateLimitError) {
          feeRetryCount++
          if (rateLimitError.message.includes('rate limit') || rateLimitError.message.includes('429')) {
            console.log(`⚠️ Rate limit hit (attempt ${feeRetryCount}/${maxRetries}), waiting ${feeRetryCount} seconds...`)
            await new Promise(resolve => setTimeout(resolve, feeRetryCount * 1000))
            
            if (feeRetryCount >= maxRetries) {
              throw new Error('Network is busy. Please try again in a few seconds.')
            }
          } else {
            throw rateLimitError
          }
        }
      }

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

      // Create the game
      console.log('🎮 Creating game on blockchain...')
      const { request } = await publicClient.simulateContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'createGame',
        args: gameParams,
        account,
        value: ethAmount
      })

      const hash = await walletClient.writeContract(request)
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      // Get the game ID from the receipt
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
        errorMessage = 'Network is busy. Please try again in a few seconds.'
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
      const { walletClient, publicClient } = this.getCurrentClients()
      const account = walletClient.account.address

      // Get game details to determine payment amount
      const gameDetails = await this.getGameDetails(params.gameId)
      if (!gameDetails.success) {
        throw new Error('Failed to get game details')
      }

      const { game } = gameDetails.data
      const paymentToken = params.paymentToken || 0 // Default to ETH

      // Calculate ETH amount if paying with ETH
      let value = 0n
      if (paymentToken === 0) {
        // ETH payment
        value = await publicClient.readContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'getETHAmount',
          args: [game.priceUSD]
        })
        console.log(`💰 Payment amount: ${value} ETH`)
      }

      // For NFT vs NFT games, approve the challenger NFT
      if (params.challengerNFTContract && params.challengerTokenId) {
        console.log('🔐 Approving challenger NFT...')
        const approvalResult = await this.approveNFT(
          params.challengerNFTContract,
          params.challengerTokenId
        )
        if (!approvalResult.success && !approvalResult.alreadyApproved) {
          throw new Error('Failed to approve NFT: ' + approvalResult.error)
        }
      }

      // Join the game with correct parameters
      console.log('🎮 Joining game on blockchain...')
      const { request } = await publicClient.simulateContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'joinGame',
        args: [
          BigInt(params.gameId),
          paymentToken,
          params.challengerNFTContract || '0x0000000000000000000000000000000000000000',
          params.challengerTokenId ? BigInt(params.challengerTokenId) : 0n
        ],
        account,
        value
      })

      const hash = await walletClient.writeContract(request)
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      return {
        success: true,
        transactionHash: hash,
        receipt
      }
    } catch (error) {
      console.error('Error joining game:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Complete the game (called by frontend after determining winner)
  async completeGame(gameId, winner) {
    try {
      const { walletClient, publicClient } = this.getCurrentClients()
      const account = walletClient.account.address

      console.log('🏁 Completing game...')
      const { request } = await publicClient.simulateContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'completeGame',
        args: [BigInt(gameId), winner],
        account
      })

      const hash = await walletClient.writeContract(request)
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

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

  // Cancel a game
  async cancelGame(gameId) {
    try {
      const { walletClient, publicClient } = this.getCurrentClients()
      const account = walletClient.account.address

      console.log('❌ Cancelling game...')
      const { request } = await publicClient.simulateContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'cancelGame',
        args: [BigInt(gameId)],
        account
      })

      const hash = await walletClient.writeContract(request)
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      return {
        success: true,
        transactionHash: hash,
        receipt
      }
    } catch (error) {
      console.error('Error cancelling game:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Withdraw rewards (ETH and USDC)
  async withdrawRewards() {
    try {
      const { walletClient, publicClient } = this.getCurrentClients()
      const account = walletClient.account.address

      // Check if user has rewards to claim
      const [unclaimedETH, unclaimedUSDC] = await Promise.all([
        publicClient.readContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'unclaimedETH',
          args: [account]
        }),
        publicClient.readContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'unclaimedUSDC',
          args: [account]
        })
      ])

      if (unclaimedETH === 0n && unclaimedUSDC === 0n) {
        return {
          success: false,
          error: 'No rewards to claim'
        }
      }

      console.log('💰 Withdrawing rewards...')
      const { request } = await publicClient.simulateContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'withdrawRewards',
        account
      })

      const hash = await walletClient.writeContract(request)
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      return {
        success: true,
        transactionHash: hash,
        receipt,
        ethWithdrawn: unclaimedETH,
        usdcWithdrawn: unclaimedUSDC
      }
    } catch (error) {
      console.error('Error withdrawing rewards:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Withdraw NFT
  async withdrawNFT(nftContract, tokenId) {
    try {
      const { walletClient, publicClient } = this.getCurrentClients()
      const account = walletClient.account.address

      console.log('🖼️ Withdrawing NFT...')
      const { request } = await publicClient.simulateContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'withdrawNFT',
        args: [nftContract, BigInt(tokenId)],
        account
      })

      const hash = await walletClient.writeContract(request)
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      return {
        success: true,
        transactionHash: hash,
        receipt
      }
    } catch (error) {
      console.error('Error withdrawing NFT:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Get game details
  async getGameDetails(gameId) {
    try {
      const { publicClient } = this.getCurrentClients()

      const result = await publicClient.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'getGameDetails',
        args: [BigInt(gameId)]
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
      const { publicClient } = this.getCurrentClients()

      const [unclaimedETH, unclaimedUSDC] = await Promise.all([
        publicClient.readContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'unclaimedETH',
          args: [address]
        }),
        publicClient.readContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'unclaimedUSDC',
          args: [address]
        })
      ])

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

  // Test NFT contract compatibility
  async testNFTContract(nftContract, tokenId) {
    try {
      const { walletClient, publicClient } = this.getCurrentClients()
      const account = walletClient.account.address

      console.log(`🧪 Testing NFT contract: ${nftContract}, token: ${tokenId}`)

      const results = {
        contractExists: false,
        hasCode: false,
        supportsERC721: false,
        ownerCheck: false,
        approvalCheck: false,
        errors: []
      }

      // 1. Check if contract exists
      try {
        const code = await publicClient.getBytecode({ address: nftContract })
        results.contractExists = true
        results.hasCode = code && code !== '0x'
        console.log(`✅ Contract exists: ${results.contractExists}, Has code: ${results.hasCode}`)
      } catch (error) {
        results.errors.push(`Contract check failed: ${error.message}`)
      }

      // 2. Test ERC721 functions
      try {
        // Try to get owner
        const owner = await publicClient.readContract({
          address: nftContract,
          abi: NFT_ABI,
          functionName: 'ownerOf',
          args: [BigInt(tokenId)]
        })
        results.ownerCheck = true
        console.log(`✅ Owner check passed: ${owner}`)
      } catch (error) {
        results.errors.push(`Owner check failed: ${error.message}`)
      }

      // 3. Test approval functions
      try {
        const approved = await publicClient.readContract({
          address: nftContract,
          abi: NFT_ABI,
          functionName: 'getApproved',
          args: [BigInt(tokenId)]
        })
        results.approvalCheck = true
        console.log(`✅ Approval check passed: ${approved}`)
      } catch (error) {
        results.errors.push(`Approval check failed: ${error.message}`)
      }

      // 4. Test isApprovedForAll
      try {
        const approvedForAll = await publicClient.readContract({
          address: nftContract,
          abi: NFT_ABI,
          functionName: 'isApprovedForAll',
          args: [account, this.contractAddress]
        })
        console.log(`✅ isApprovedForAll check passed: ${approvedForAll}`)
      } catch (error) {
        results.errors.push(`isApprovedForAll check failed: ${error.message}`)
      }

      results.supportsERC721 = results.ownerCheck && results.approvalCheck

      return {
        success: true,
        results
      }
    } catch (error) {
      console.error('Error testing NFT contract:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Emergency function to find your NFT
  async findMyNFTs(nftContract, tokenId) {
    try {
      const { walletClient, publicClient } = this.getCurrentClients()
      const account = walletClient.account.address

      console.log(`🔍 Looking for NFT: ${nftContract}, tokenId: ${tokenId}`)

      // Check current owner
      const currentOwner = await publicClient.readContract({
        address: nftContract,
        abi: NFT_ABI,
        functionName: 'ownerOf',
        args: [BigInt(tokenId)]
      })

      console.log(`📍 Current owner: ${currentOwner}`)
      console.log(`📍 Your address: ${account}`)
      console.log(`📍 Game contract: ${this.contractAddress}`)

      if (currentOwner.toLowerCase() === account.toLowerCase()) {
        return {
          success: true,
          location: 'your_wallet',
          message: 'NFT is in your wallet'
        }
      } else if (currentOwner.toLowerCase() === this.contractAddress.toLowerCase()) {
        return {
          success: true,
          location: 'game_contract',
          message: 'NFT is in the game contract'
        }
      } else {
        return {
          success: true,
          location: 'other',
          message: `NFT is owned by: ${currentOwner}`
        }
      }
    } catch (error) {
      console.error('Error finding NFT:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Get user's active games with rate limiting and retry logic
  async getUserActiveGames(address) {
    try {
      await this.waitForRateLimit()
      
      const { publicClient } = this.getCurrentClients()
      console.log(`🎮 Looking for active games for address: ${address}`)

      // Get the next game ID with retry logic
      let nextGameId
      let retryCount = 0
      
      while (retryCount < this.maxRetries) {
        try {
          nextGameId = await publicClient.readContract({
            address: this.contractAddress,
            abi: CONTRACT_ABI,
            functionName: 'nextGameId'
          })
          break
        } catch (error) {
          retryCount++
          console.warn(`⚠️ RPC error (attempt ${retryCount}/${this.maxRetries}):`, error.message)
          
          if (error.message.includes('429') || error.message.includes('rate limit')) {
            // Switch RPC endpoint and wait longer
            this.switchToNextRpc()
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
          } else if (retryCount < this.maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 500 * retryCount))
          } else {
            throw error
          }
        }
      }

      if (!nextGameId) {
        console.warn('⚠️ Could not get nextGameId, returning empty array')
        return []
      }

      console.log(`📊 Total games created: ${nextGameId}`)

      // Get active games for the user with rate limiting
      const activeGames = []
      const maxGamesToCheck = Math.min(Number(nextGameId), 20) // Reduced to avoid rate limits

      for (let i = 1; i <= maxGamesToCheck; i++) {
        try {
          await this.waitForRateLimit() // Rate limit between each game check
          
          const gameDetails = await this.getGameDetails(i.toString())
          if (gameDetails.success) {
            const { game } = gameDetails.data
            // Check if user is creator or joiner and game is still active (state 0, 1, or 2)
            if ((game.creator.toLowerCase() === address.toLowerCase() || 
                 game.joiner.toLowerCase() === address.toLowerCase()) && 
                game.state < 3) { // 0=Created, 1=Joined, 2=InProgress, 3=Completed, 4=Expired, 5=Cancelled
              activeGames.push(i)
            }
          }
        } catch (error) {
          console.warn(`Could not get details for game ${i}:`, error.message)
          // Continue with next game instead of breaking
        }
      }

      console.log(`🎯 Found ${activeGames.length} active games for ${address}`)
      return activeGames
    } catch (error) {
      console.error('Error getting user active games:', error)
      // Return empty array instead of throwing error
      return []
    }
  }

  // Emergency function to get all games for an address
  async getMyGames(address) {
    try {
      const { publicClient } = this.getCurrentClients()

      console.log(`🎮 Looking for games for address: ${address}`)

      // This would require the contract to have a function to get user games
      // For now, let's try to get the next game ID to see how many games exist
      const nextGameId = await publicClient.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'nextGameId'
      })

      console.log(`📊 Total games created: ${nextGameId}`)

      // Try to get details for recent games
      const recentGames = []
      const maxGamesToCheck = 10

      for (let i = 1; i < Math.min(Number(nextGameId), maxGamesToCheck + 1); i++) {
        try {
          const gameDetails = await this.getGameDetails(i.toString())
          if (gameDetails.success) {
            const { game } = gameDetails.data
            if (game.creator.toLowerCase() === address.toLowerCase()) {
              recentGames.push({
                gameId: i,
                creator: game.creator,
                joiner: game.joiner,
                nftContract: game.nftContract,
                tokenId: game.tokenId.toString(),
                state: game.state
              })
            }
          }
        } catch (error) {
          console.warn(`Could not get details for game ${i}:`, error.message)
        }
      }

      return {
        success: true,
        totalGames: Number(nextGameId),
        myGames: recentGames
      }
    } catch (error) {
      console.error('Error getting my games:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Emergency function to cancel a game and recover NFT
  async emergencyCancelGame(gameId) {
    try {
      const { walletClient, publicClient } = this.getCurrentClients()
      const account = walletClient.account.address

      console.log(`🚨 Emergency cancelling game: ${gameId}`)

      // First check if you can cancel this game
      const gameDetails = await this.getGameDetails(gameId)
      if (!gameDetails.success) {
        throw new Error('Could not get game details')
      }

      const { game } = gameDetails.data
      if (game.creator.toLowerCase() !== account.toLowerCase()) {
        throw new Error('Only the game creator can cancel the game')
      }

      if (game.state !== 0) { // 0 = Created state
        throw new Error('Game is not in created state - cannot cancel')
      }

      // Cancel the game
      const { request } = await publicClient.simulateContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'cancelGame',
        args: [BigInt(gameId)],
        account
      })

      const hash = await walletClient.writeContract(request)
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      console.log(`✅ Game cancelled successfully: ${hash}`)

      return {
        success: true,
        transactionHash: hash,
        receipt,
        message: 'Game cancelled and NFT should be returned to your wallet'
      }
    } catch (error) {
      console.error('Error cancelling game:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

export default new ContractService()
export { CONTRACT_ABI } 