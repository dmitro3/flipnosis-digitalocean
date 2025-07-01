import { ethers } from 'ethers'
import { 
  createPublicClient, 
  createWalletClient, 
  custom, 
  parseEther,
  parseUnits,
  formatEther,
  formatUnits,
  keccak256,
  toHex
} from 'viem'
import { 
  base, 
  mainnet, 
  bsc, 
  avalanche, 
  polygon,
  arbitrum,
  optimism 
} from 'viem/chains'

// Chain configurations
export const SUPPORTED_CHAINS = {
  base: {
    chain: base,
    contractAddress: '0xBFD8912ded5830e43E008CCCEA822A6B0174C480', // Base contract address
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base USDC
    ethPriceFeed: '0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70', // Base ETH/USD
    usdcPriceFeed: '0x7e860098F58bBFC8648a4311b374B1D669a2bc6B', // Base USDC/USD
    blockExplorer: 'https://basescan.org'
  },
  ethereum: {
    chain: mainnet,
    contractAddress: '0x...',
    usdcAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    ethPriceFeed: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
    usdcPriceFeed: '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6',
    blockExplorer: 'https://etherscan.io'
  },
  bnb: {
    chain: bsc,
    contractAddress: '0x...',
    usdcAddress: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    ethPriceFeed: '0x9ef1B8c0E4F7dc8bF5719Ea496883DC6401d5b2e',
    usdcPriceFeed: '0x51597f405303C4377E36123cBc172b13269EA163',
    blockExplorer: 'https://bscscan.com'
  },
  avalanche: {
    chain: avalanche,
    contractAddress: '0x...',
    usdcAddress: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    ethPriceFeed: '0x976B3D034E162d8bD72D6b9C989d545b839003b0',
    usdcPriceFeed: '0xF096872672F44d6EBA71458D74fe67F9a77a23B9',
    blockExplorer: 'https://snowtrace.io'
  },
  polygon: {
    chain: polygon,
    contractAddress: '0x...',
    usdcAddress: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    ethPriceFeed: '0xF9680D99D6C9589e2a93a78A04A279e509205945',
    usdcPriceFeed: '0xfE4A8cc5b5B2366C1B58Bea3858e81843581b2F7',
    blockExplorer: 'https://polygonscan.com'
  }
}

// Contract ABI (simplified - include full ABI in production)
export const CONTRACT_ABI = [
  // Create Game
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
  {
    name: 'withdrawAllNFTs',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
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
        name: '',
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
        name: '',
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
        name: '',
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
    name: 'getUserActiveGames',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }]
  },
  {
    name: 'getUserUnclaimedNFTs',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'nftContract', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256[]' }]
  },
  {
    name: 'getETHAmount',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'usdAmount', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'getRequiredPaymentAmount',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'token', type: 'uint8' }
    ],
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
  },
  {
    name: 'getUserUnclaimedNFTs',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'nftContract', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256[]' }]
  },
  {
    name: 'getETHAmount',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'usdAmount', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'getRequiredPaymentAmount',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'token', type: 'uint8' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  }
]

// NFT ABI for approvals
const NFT_ABI = [
  'function approve(address to, uint256 tokenId)',
  'function setApprovalForAll(address operator, bool approved)',
  'function getApproved(uint256 tokenId) view returns (address)',
  'function isApprovedForAll(address owner, address operator) view returns (bool)'
]

// ERC20 ABI for USDC
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)'
]

// Enums matching contract
export const GameState = {
  Created: 0,
  Joined: 1,
  InProgress: 2,
  Completed: 3,
  Expired: 4,
  Cancelled: 5
}

export const GameType = {
  NFTvsCrypto: 0,
  NFTvsNFT: 1
}

export const PaymentToken = {
  ETH: 0,
  USDC: 1,
  NATIVE: 2
}

export const CoinSide = {
  HEADS: 0,
  TAILS: 1
}

export const PlayerRole = {
  FLIPPER: 0,
  CHOOSER: 1
}

class MultiChainContractService {
  constructor() {
    this.contracts = {}
    this.clients = {}
    this.currentChain = null
  }

  // Initialize for a specific chain
  async init(chainName, walletClient, publicClient) {
    if (!SUPPORTED_CHAINS[chainName]) {
      throw new Error(`Unsupported chain: ${chainName}`)
    }

    const config = SUPPORTED_CHAINS[chainName]
    
    // Store clients
    this.clients[chainName] = {
      wallet: walletClient,
      public: publicClient
    }

    // Initialize contract
    this.contracts[chainName] = {
      address: config.contractAddress,
      config: config
    }

    this.currentChain = chainName
    
    // Verify contract deployment
    const code = await publicClient.getBytecode({ 
      address: config.contractAddress 
    })
    
    if (!code || code === '0x') {
      throw new Error(`No contract deployed on ${chainName}`)
    }

    console.log(`✅ Connected to ${chainName} contract at ${config.contractAddress}`)
  }

  // Switch active chain
  switchChain(chainName) {
    if (!this.contracts[chainName]) {
      throw new Error(`Chain ${chainName} not initialized`)
    }
    this.currentChain = chainName
  }

  // Get current contract config
  getCurrentConfig() {
    if (!this.currentChain) throw new Error('No chain selected')
    const contractData = this.contracts[this.currentChain]
    if (!contractData) throw new Error(`Chain ${this.currentChain} not initialized`)
    return contractData
  }

  // Check if service is initialized
  isInitialized() {
    return this.currentChain && this.clients[this.currentChain] && this.contracts[this.currentChain]
  }

  // Get current clients
  getCurrentClients() {
    console.log('🔍 getCurrentClients called')
    console.log('🔍 this.currentChain:', this.currentChain)
    console.log('🔍 this.clients:', this.clients)
    
    if (!this.currentChain) {
      console.log('❌ No current chain')
      throw new Error('No chain selected. Please initialize the contract service first.')
    }
    
    const clients = this.clients[this.currentChain]
    console.log('🔍 clients for current chain:', clients)
    
    if (!clients || !clients.wallet || !clients.public) {
      console.log('❌ Clients not properly initialized')
      console.log('🔍 clients object:', clients)
      console.log('🔍 has wallet:', !!clients?.wallet)
      console.log('🔍 has public:', !!clients?.public)
      throw new Error('Clients not properly initialized. Please reconnect your wallet.')
    }
    
    console.log('✅ Clients retrieved successfully')
    return clients
  }

  // Create a new game
  async createGame(params) {
    try {
      const { walletClient, publicClient } = this.getCurrentClients()
      const config = this.getCurrentConfig()
      
      // Prepare game parameters for contract
      const createGameParams = {
        nftContract: params.nftContract,
        tokenId: params.tokenId,
        priceUSD: Math.round(params.priceUSD * 1000000), // Convert to 6 decimals
        acceptedToken: params.acceptedToken || 0, // 0 = ETH, 1 = USDC
        maxRounds: params.maxRounds || 5,
        gameType: params.gameType || 0, // 0 = NFTvsCrypto, 1 = NFTvsNFT
        authInfo: params.authInfo || ""
      }
      
      // Calculate listing fee in ETH
      const listingFeeETH = await this.getETHAmount(200000) // $0.20 in 6 decimals
      
      // Create transaction
      const { request } = await publicClient.simulateContract({
        address: config.address,
        abi: CONTRACT_ABI,
        functionName: 'createGame',
        args: [createGameParams],
        value: listingFeeETH,
        account: await walletClient.account.address,
      })
      
      const hash = await walletClient.writeContract(request)
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      
      // Extract game ID from events
      const gameId = this.extractGameIdFromReceipt(receipt)
      
      return {
        success: true,
        gameId,
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
      const config = this.getCurrentConfig()
      
      // Get required payment amount
      const requiredAmount = await this.getRequiredPaymentAmount(params.gameId, params.paymentToken)
      
      // Prepare join parameters
      const joinParams = {
        gameId: params.gameId,
        coinChoice: params.coinChoice, // 0 = HEADS, 1 = TAILS
        roleChoice: params.roleChoice, // 0 = FLIPPER, 1 = CHOOSER
        paymentToken: params.paymentToken, // 0 = ETH, 1 = USDC
        challengerNFTContract: params.challengerNFTContract || "0x0000000000000000000000000000000000000000",
        challengerTokenId: params.challengerTokenId || 0
      }
      
      // Create transaction
      const { request } = await publicClient.simulateContract({
        address: config.address,
        abi: CONTRACT_ABI,
        functionName: 'joinGame',
        args: [joinParams],
        value: requiredAmount,
        account: await walletClient.account.address,
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
  async flipCoin(gameId, power) {
    try {
      const { walletClient, publicClient } = this.getCurrentClients()
      const config = this.getCurrentConfig()
      
      // Create transaction
      const { request } = await publicClient.simulateContract({
        address: config.address,
        abi: CONTRACT_ABI,
        functionName: 'flipCoin',
        args: [gameId, power],
        account: await walletClient.account.address,
      })
      
      const hash = await walletClient.writeContract(request)
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      
      return {
        success: true,
        transactionHash: hash,
        receipt
      }
    } catch (error) {
      console.error('Error flipping coin:', error)
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
      const config = this.getCurrentConfig()
      
      // Create transaction
      const { request } = await publicClient.simulateContract({
        address: config.address,
        abi: CONTRACT_ABI,
        functionName: 'withdrawRewards',
        account: await walletClient.account.address,
      })
      
      const hash = await walletClient.writeContract(request)
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      
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

  // Withdraw specific NFT
  async withdrawNFT(nftContract, tokenId) {
    try {
      const { walletClient, publicClient } = this.getCurrentClients()
      const config = this.getCurrentConfig()
      
      // Create transaction
      const { request } = await publicClient.simulateContract({
        address: config.address,
        abi: CONTRACT_ABI,
        functionName: 'withdrawNFT',
        args: [nftContract, tokenId],
        account: await walletClient.account.address,
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

  // Get ETH amount for USD value
  async getETHAmount(usdAmount) {
    try {
      console.log('🔍 getETHAmount called with usdAmount:', usdAmount)
      
      const clients = this.getCurrentClients()
      console.log('🔍 Clients retrieved in getETHAmount:', { 
        hasWallet: !!clients.wallet, 
        hasPublic: !!clients.public,
        walletType: typeof clients.wallet,
        publicType: typeof clients.public
      })
      
      if (!clients.public) {
        throw new Error('Public client is undefined in getETHAmount')
      }
      
      // Use clients.public directly instead of destructuring
      const publicClient = clients.public
      console.log('🔍 publicClient after assignment:', { 
        hasPublicClient: !!publicClient,
        publicClientType: typeof publicClient,
        hasReadContract: publicClient && typeof publicClient.readContract === 'function'
      })
      
      const config = this.getCurrentConfig()
      console.log('🔍 Config retrieved:', { address: config.address })
      
      const amount = await publicClient.readContract({
        address: config.address,
        abi: CONTRACT_ABI,
        functionName: 'getETHAmount',
        args: [Math.round(usdAmount)], // USD amount should already be in 6 decimals
      })
      
      console.log('🔍 getETHAmount result:', amount)
      return amount
    } catch (error) {
      console.error('Error getting ETH amount:', error)
      throw error
    }
  }

  // Get required payment amount for joining
  async getRequiredPaymentAmount(gameId, token) {
    try {
      const { publicClient } = this.getCurrentClients()
      const config = this.getCurrentConfig()
      
      const amount = await publicClient.readContract({
        address: config.address,
        abi: CONTRACT_ABI,
        functionName: 'getRequiredPaymentAmount',
        args: [gameId, token],
      })
      
      return amount
    } catch (error) {
      console.error('Error getting required payment amount:', error)
      throw error
    }
  }

  // View functions
  async getGameDetails(gameId) {
    try {
      const { publicClient } = this.getCurrentClients()
      const config = this.getCurrentConfig()

      const details = await publicClient.readContract({
        address: config.address,
        abi: CONTRACT_ABI,
        functionName: 'getGameDetails',
        args: [gameId]
      })

      return {
        success: true,
        core: details[0],
        financials: details[1],
        progress: details[2]
      }
    } catch (error) {
      console.error('Error getting game details:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async getUserActiveGames(userAddress) {
    try {
      const { publicClient } = this.getCurrentClients()
      const config = this.getCurrentConfig()

      const games = await publicClient.readContract({
        address: config.address,
        abi: CONTRACT_ABI,
        functionName: 'getUserActiveGames',
        args: [userAddress]
      })

      return {
        success: true,
        games: games.map(id => id.toString())
      }
    } catch (error) {
      console.error('Error getting user active games:', error)
      return {
        success: false,
        error: error.message,
        games: []
      }
    }
  }

  async getUnclaimedRewards(userAddress) {
    try {
      const { publicClient } = this.getCurrentClients()
      const config = this.getCurrentConfig()

      const [eth, usdc] = await Promise.all([
        publicClient.readContract({
          address: config.address,
          abi: CONTRACT_ABI,
          functionName: 'unclaimedETH',
          args: [userAddress]
        }),
        publicClient.readContract({
          address: config.address,
          abi: CONTRACT_ABI,
          functionName: 'unclaimedUSDC',
          args: [userAddress]
        })
      ])

      return {
        success: true,
        eth: formatEther(eth),
        usdc: formatUnits(usdc, 6)
      }
    } catch (error) {
      console.error('Error getting unclaimed rewards:', error)
      return {
        success: false,
        error: error.message,
        eth: '0',
        usdc: '0'
      }
    }
  }

  async getUserUnclaimedNFTs(userAddress, nftContract) {
    try {
      const { publicClient } = this.getCurrentClients()
      const config = this.getCurrentConfig()

      const nfts = await publicClient.readContract({
        address: config.address,
        abi: CONTRACT_ABI,
        functionName: 'getUserUnclaimedNFTs',
        args: [userAddress, nftContract]
      })

      return {
        success: true,
        nfts: nfts.map(id => id.toString())
      }
    } catch (error) {
      console.error('Error getting user unclaimed NFTs:', error)
      return {
        success: false,
        error: error.message,
        nfts: []
      }
    }
  }

  // Get game by ID (uses getGameDetails)
  async getGame(gameId) {
    try {
      const { publicClient } = this.getCurrentClients()
      const config = this.getCurrentConfig()

      // Get game details using the existing function
      const details = await publicClient.readContract({
        address: config.address,
        abi: CONTRACT_ABI,
        functionName: 'getGameDetails',
        args: [gameId]
      })

      // Combine the data from the three returned tuples
      const [core, financials, progress] = details
      
      const game = {
        gameId: core.gameId,
        creator: core.creator,
        joiner: core.joiner,
        nftContract: core.nftContract,
        tokenId: core.tokenId,
        state: core.state,
        gameType: core.gameType,
        creatorRole: core.creatorRole,
        joinerRole: core.joinerRole,
        joinerChoice: core.joinerChoice,
        priceUSD: financials.priceUSD,
        acceptedToken: financials.acceptedToken,
        totalPaid: financials.totalPaid,
        paymentTokenUsed: financials.paymentTokenUsed,
        listingFeePaid: financials.listingFeePaid,
        platformFeeCollected: financials.platformFeeCollected,
        createdAt: progress.createdAt,
        expiresAt: progress.expiresAt,
        maxRounds: progress.maxRounds,
        currentRound: progress.currentRound,
        creatorWins: progress.creatorWins,
        joinerWins: progress.joinerWins,
        winner: progress.winner,
        lastActionTime: progress.lastActionTime,
        countdownEndTime: progress.countdownEndTime
      }

      return {
        success: true,
        game
      }
    } catch (error) {
      console.error('Error getting game:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Helper to extract game ID from receipt
  extractGameIdFromReceipt(receipt) {
    // Find GameCreated event
    const gameCreatedEvent = receipt.logs.find(log => {
      // Match event signature for GameCreated
      const eventSignature = keccak256(toHex('GameCreated(uint256,address,uint8)'))
      return log.topics[0] === eventSignature
    })

    if (gameCreatedEvent) {
      // Game ID is the first indexed parameter
      return BigInt(gameCreatedEvent.topics[1]).toString()
    }

    throw new Error('Game ID not found in receipt')
  }

  // Get block explorer link
  getExplorerLink(hash, type = 'tx') {
    const config = this.getCurrentConfig()
    const baseUrl = config.config.blockExplorer
    
    switch (type) {
      case 'tx':
        return `${baseUrl}/tx/${hash}`
      case 'address':
        return `${baseUrl}/address/${hash}`
      case 'token':
        return `${baseUrl}/token/${hash}`
      default:
        return baseUrl
    }
  }
}

// Export singleton instance
export const contractService = new MultiChainContractService()
export default contractService

// Export the class for direct instantiation
export { MultiChainContractService } 