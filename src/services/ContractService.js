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
          { name: 'joinerChoice', type: 'uint8' }
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

      // First approve the NFT
      console.log('🔐 Approving NFT for transfer...')
      const approvalResult = await this.approveNFT(params.nftContract, params.tokenId)
      if (!approvalResult.success && !approvalResult.alreadyApproved) {
        throw new Error('Failed to approve NFT: ' + approvalResult.error)
      }

      // Get listing fee amount in ETH
      const listingFeeUSD = await publicClient.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'listingFeeUSD'
      })

      const ethAmount = await publicClient.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'getETHAmount',
        args: [listingFeeUSD]
      })

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
      console.error('Error creating game:', error)
      return {
        success: false,
        error: error.message
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
}

export default new ContractService()
export { CONTRACT_ABI } 