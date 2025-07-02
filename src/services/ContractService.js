import { createPublicClient, createWalletClient, custom, http } from 'viem'
import { base, mainnet, bsc, avalanche, polygon } from 'viem/chains'

// Contract ABI - Essential functions only
const CONTRACT_ABI = [
  // Create game
  {
    name: 'createGame',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{
      name: 'params',
      type: 'tuple',
      components: [
        { name: 'nftContract', type: 'address' },
        { name: 'tokenId', type: 'uint256' },
        { name: 'priceUSD', type: 'uint256' },
        { name: 'acceptedToken', type: 'uint8' },
        { name: 'maxRounds', type: 'uint8' },
        { name: 'gameType', type: 'uint8' },
        { name: 'authInfo', type: 'string' }
      ]
    }],
    outputs: []
  },
  // Join Game
  {
    name: 'joinGame',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{
      name: 'params',
      type: 'tuple',
      components: [
        { name: 'gameId', type: 'uint256' },
        { name: 'coinChoice', type: 'uint8' },
        { name: 'roleChoice', type: 'uint8' },
        { name: 'paymentToken', type: 'uint8' },
        { name: 'challengerNFTContract', type: 'address' },
        { name: 'challengerTokenId', type: 'uint256' }
      ]
    }],
    outputs: []
  },
  // Flip coin
  {
    name: 'flipCoin',
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
          { name: 'creatorRole', type: 'uint8' },
          { name: 'joinerRole', type: 'uint8' },
          { name: 'joinerChoice', type: 'uint8' },
          { name: 'authInfo', type: 'string' }
        ]
      },
      {
        name: 'payment',
        type: 'tuple',
        components: [
          { name: 'priceUSD', type: 'uint256' },
          { name: 'acceptedToken', type: 'uint8' },
          { name: 'totalPaid', type: 'uint256' },
          { name: 'paymentTokenUsed', type: 'uint8' },
          { name: 'listingFeePaid', type: 'uint256' },
          { name: 'platformFeeCollected', type: 'uint256' }
        ]
      },
      {
        name: 'gameState',
        type: 'tuple',
        components: [
          { name: 'createdAt', type: 'uint256' },
          { name: 'expiresAt', type: 'uint256' },
          { name: 'maxRounds', type: 'uint8' },
          { name: 'currentRound', type: 'uint8' },
          { name: 'creatorWins', type: 'uint8' },
          { name: 'joinerWins', type: 'uint8' },
          { name: 'winner', type: 'address' },
          { name: 'lastActionTime', type: 'uint256' },
          { name: 'countdownEndTime', type: 'uint256' }
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

// Chain configurations
const CHAIN_CONFIGS = {
  base: {
    chain: base,
    contractAddress: '0xBFD8912ded5830e43E008CCCEA822A6B0174C480',
    rpcUrl: 'https://mainnet.base.org'
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
      transport: http(config.rpcUrl)
    })

    console.log(`✅ Contract service initialized for ${chainName}`)
    console.log(`📍 Contract address: ${this.contractAddress}`)
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
    if (!this.walletClient || !this.publicClient) {
      throw new Error('Wallet not connected')
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
      const { walletClient, publicClient } = this.getCurrentClients()
      const account = walletClient.account.address

      console.log('🎮 Creating game with params:', {
        nftContract: params.nftContract,
        tokenId: params.tokenId,
        priceUSD: params.priceUSD,
        account: account
      })

      // Verify NFT ownership first
      console.log('🔍 Verifying NFT ownership...')
      try {
        const owner = await publicClient.readContract({
          address: params.nftContract,
          abi: NFT_ABI,
          functionName: 'ownerOf',
          args: [BigInt(params.tokenId)]
        })
        
        if (owner.toLowerCase() !== account.toLowerCase()) {
          throw new Error(`You don't own this NFT. Owner: ${owner}, Your address: ${account}`)
        }
        
        console.log('✅ NFT ownership verified')
      } catch (ownershipError) {
        console.error('❌ NFT ownership check failed:', ownershipError)
        throw new Error('Failed to verify NFT ownership: ' + ownershipError.message)
      }

      // First approve the NFT
      console.log('🔐 Approving NFT for transfer...')
      const approvalResult = await this.approveNFT(params.nftContract, params.tokenId)
      if (!approvalResult.success && !approvalResult.alreadyApproved) {
        throw new Error('Failed to approve NFT: ' + approvalResult.error)
      }

      // Get listing fee amount in ETH with retry logic for rate limits
      let listingFeeUSD, ethAmount
      try {
        listingFeeUSD = await publicClient.readContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'listingFeeUSD'
        })

        // Add small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500))

        ethAmount = await publicClient.readContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'getETHAmount',
          args: [listingFeeUSD]
        })
      } catch (rateLimitError) {
        if (rateLimitError.message.includes('rate limit')) {
          console.log('⚠️ Rate limit hit, waiting 2 seconds...')
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          // Retry once
          listingFeeUSD = await publicClient.readContract({
            address: this.contractAddress,
            abi: CONTRACT_ABI,
            functionName: 'listingFeeUSD'
          })

          ethAmount = await publicClient.readContract({
            address: this.contractAddress,
            abi: CONTRACT_ABI,
            functionName: 'getETHAmount',
            args: [listingFeeUSD]
          })
        } else {
          throw rateLimitError
        }
      }

      console.log(`💰 Listing fee: ${ethAmount} ETH`)

      // Create game parameters
      const gameParams = {
        nftContract: params.nftContract,
        tokenId: BigInt(params.tokenId),
        priceUSD: BigInt(Math.floor(params.priceUSD * 1000000)), // Convert to 6 decimals
        acceptedToken: params.acceptedToken || 0, // 0 = ETH, 1 = USDC
        maxRounds: params.maxRounds || 5,
        gameType: params.gameType || 0, // 0 = NFTvsCrypto, 1 = NFTvsNFT
        authInfo: params.authInfo || ''
      }

      console.log('🎮 Game parameters:', gameParams)

      // Create the game
      console.log('🎮 Creating game on blockchain...')
      const { request } = await publicClient.simulateContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'createGame',
        args: [gameParams],
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

      const { payment } = gameDetails.data
      const paymentToken = params.paymentToken || 0 // Default to ETH

      // Calculate ETH amount if paying with ETH
      let value = 0n
      if (paymentToken === 0) {
        // ETH payment
        value = await publicClient.readContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'getETHAmount',
          args: [payment.priceUSD]
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

      // Join game parameters
      const joinParams = {
        gameId: BigInt(params.gameId),
        coinChoice: params.coinChoice || 0, // 0 = HEADS, 1 = TAILS
        roleChoice: params.roleChoice || 1, // 1 = CHOOSER
        paymentToken: paymentToken,
        challengerNFTContract: params.challengerNFTContract || '0x0000000000000000000000000000000000000000',
        challengerTokenId: params.challengerTokenId ? BigInt(params.challengerTokenId) : 0n
      }

      // Join the game
      console.log('🎮 Joining game on blockchain...')
      const { request } = await publicClient.simulateContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'joinGame',
        args: [joinParams],
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

  // Flip the coin
  async flipCoin(params) {
    try {
      const { walletClient, publicClient } = this.getCurrentClients()
      const account = walletClient.account.address

      const gameId = BigInt(params.gameId)
      const power = params.power || 50 // Default power

      console.log('🪙 Flipping coin...')
      const { request } = await publicClient.simulateContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'flipCoin',
        args: [gameId, power],
        account
      })

      const hash = await walletClient.writeContract(request)
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      // Get updated game details
      const gameDetails = await this.getGameDetails(params.gameId)

      return {
        success: true,
        transactionHash: hash,
        receipt,
        gameDetails: gameDetails.data
      }
    } catch (error) {
      console.error('Error flipping coin:', error)
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
          payment: result[1],
          gameState: result[2]
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