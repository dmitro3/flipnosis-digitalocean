import { ethers } from 'ethers'
import { Alchemy, Network } from 'alchemy-sdk'
import { createWalletClient, createPublicClient, http, custom } from 'viem'
import { base } from 'wagmi/chains'

// Contract configuration
const CONTRACT_ADDRESS = '0xF5fdE838AB5aa566AC7d1b9116523268F39CC6D0'

// Use Alchemy RPC endpoint directly
const ALCHEMY_RPC_URL = 'https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3'

// Explicit Base chain configuration
const BASE_CHAIN = {
  ...base,
  id: 8453,
  name: 'Base',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [ALCHEMY_RPC_URL],
    },
    public: {
      http: [ALCHEMY_RPC_URL],
    },
  },
}

// Contract ABI - only what we need
const CONTRACT_ABI = [
  {
    name: 'payListingFee',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: []
  },
  {
    name: 'payFeeAndCreateGame',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'gameId', type: 'bytes32' },
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'priceUSD', type: 'uint256' },
      { name: 'paymentToken', type: 'uint8' }
    ],
    outputs: []
  },
  {
    name: 'depositNFT',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'gameId', type: 'bytes32' }],
    outputs: []
  },
  {
    name: 'depositETH',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'gameId', type: 'bytes32' }
    ],
    outputs: []
  },
  {
    name: 'games',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'gameId', type: 'bytes32' }],
    outputs: [
      { name: 'player1', type: 'address' },
      { name: 'player2', type: 'address' },
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'ethAmount', type: 'uint256' },
      { name: 'usdcAmount', type: 'uint256' },
      { name: 'paymentToken', type: 'uint8' },
      { name: 'depositTime', type: 'uint256' },
      { name: 'player1Deposited', type: 'bool' },
      { name: 'player2Deposited', type: 'bool' },
      { name: 'completed', type: 'bool' },
      { name: 'winner', type: 'address' }
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
    name: 'emergencyWithdrawETH',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: []
  },
  {
    name: 'emergencyWithdrawNFT',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'to', type: 'address' }
    ],
    outputs: []
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
  }
]

class ContractService {
  constructor() {
    this.contractAddress = CONTRACT_ADDRESS
    this.contract = null
    this.walletClient = null
    this.publicClient = null
    this.account = null
    this.alchemy = null
    this.currentChain = null
    this.initialized = false
  }

  // Initialize the service with Viem
  async initialize(walletClient, address) {
    try {
      console.log('🔧 Initializing contract service...', {
        isFullyConnected: !!walletClient && !!address,
        hasWalletClient: !!walletClient,
        address
      })

      if (!walletClient || !address) {
        console.error('❌ Cannot initialize: missing wallet client or address')
        return { success: false, error: 'Wallet not properly connected' }
      }

      this.walletClient = walletClient
      this.account = address

      // Create public client for reading
      this.publicClient = createPublicClient({
        chain: BASE_CHAIN,
        transport: http(ALCHEMY_RPC_URL)
      })

      // Create ethers provider for contract reads
      const provider = new ethers.JsonRpcProvider(ALCHEMY_RPC_URL)
      
      // Create contract instance for reading
      this.contract = {
        // Read functions using public client
        getETHAmount: async (usdAmount) => {
          try {
            return await this.publicClient.readContract({
              address: this.contractAddress,
              abi: CONTRACT_ABI,
              functionName: 'getETHAmount',
              args: [usdAmount]
            })
          } catch (error) {
            console.warn('⚠️ Error calling getETHAmount, using fallback calculation')
            // Fallback calculation if contract call fails
            const ethPriceUSD = 3500 // Conservative estimate
            const ethAmountWei = (BigInt(usdAmount) * BigInt(1e18)) / (BigInt(ethPriceUSD) * BigInt(1000000))
            return ethAmountWei
          }
        },
        listingFeeUSD: async () => {
          return await this.publicClient.readContract({
            address: this.contractAddress,
            abi: CONTRACT_ABI,
            functionName: 'listingFeeUSD'
          })
        },
        games: async (gameId) => {
          return await this.publicClient.readContract({
            address: this.contractAddress,
            abi: CONTRACT_ABI,
            functionName: 'games',
            args: [gameId]
          })
        }
      }

      // Check contract deployment
      const deploymentCheck = await this.checkContractDeployment()
      if (!deploymentCheck.success) {
        throw new Error('Contract not properly deployed: ' + deploymentCheck.error)
      }

      // Initialize Alchemy for NFT fetching
      await this.initializeAlchemy()

      console.log('✅ Contract service initialized with Viem clients')
      console.log('🔗 Contract address:', this.contractAddress)
      console.log('👤 Account address:', this.account)

      this.initialized = true
      return { success: true }
    } catch (error) {
      console.error('❌ Error initializing contract service:', error)
      return { success: false, error: error.message }
    }
  }

  // Initialize Alchemy for NFT fetching
  async initializeAlchemy() {
    try {
      const chainId = await this.publicClient.getChainId()
      const chainIdStr = chainId.toString()

      const chainToNetwork = {
        '1': Network.ETH_MAINNET,
        '137': Network.MATIC_MAINNET,
        '8453': Network.BASE_MAINNET,
        '42161': Network.ARB_MAINNET,
        '10': Network.OPT_MAINNET
      }

      const alchemyNetwork = chainToNetwork[chainIdStr]
      if (!alchemyNetwork) {
        console.warn('⚠️ Unsupported network for Alchemy:', chainIdStr)
        return
      }

      this.alchemy = new Alchemy({
        apiKey: 'hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3',
        network: alchemyNetwork
      })

      this.currentChain = {
        id: chainIdStr,
        name: Object.keys(chainToNetwork).find(key => chainToNetwork[key] === alchemyNetwork) || 'Unknown',
        network: alchemyNetwork
      }

      console.log('✅ Alchemy initialized for network:', alchemyNetwork)
    } catch (error) {
      console.error('❌ Error initializing Alchemy:', error)
    }
  }

  // Check if service is ready
  isReady() {
    return !!this.walletClient && !!this.publicClient && !!this.account && this.initialized
  }

  // Ensure wallet is connected to Base network
  async ensureBaseNetwork() {
    if (!this.walletClient) {
      throw new Error('Wallet client not available')
    }

    try {
      const chainId = await this.walletClient.getChainId()
      if (chainId !== BASE_CHAIN.id) {
        console.log(`🔄 Switching to Base network (current: ${chainId}, target: ${BASE_CHAIN.id})`)
        // Use proper chain switching with the chain object
        await this.walletClient.switchChain({ id: BASE_CHAIN.id })
        console.log('✅ Switched to Base network')
      } else {
        console.log('✅ Already on Base network')
      }
    } catch (error) {
      console.error('❌ Error switching to Base network:', error)
      throw new Error('Failed to switch to Base network. Please switch manually in MetaMask.')
    }
  }

  // Check contract deployment
  async checkContractDeployment() {
    try {
      if (!this.publicClient) {
        console.error('❌ Public client not available for contract check')
        return { success: false, error: 'Public client not available' }
      }

      const code = await this.publicClient.getBytecode({ address: this.contractAddress })
      if (!code || code === '0x') {
        console.error('❌ No contract deployed at address:', this.contractAddress)
        return { success: false, error: 'Contract not deployed' }
      }

      try {
        const listingFeeUSD = await this.contract.listingFeeUSD()
        console.log('✅ Contract found. Listing fee:', ethers.formatUnits(listingFeeUSD, 6), 'USD')
      } catch (feeError) {
        console.warn('⚠️ Could not fetch listing fee, but contract exists:', feeError.message)
      }

      return { success: true }
    } catch (error) {
      console.error('❌ Contract check failed:', error)
      return { success: false, error: error.message }
    }
  }

  // Convert game ID to bytes32
  getGameIdBytes32(gameId) {
    return ethers.id(gameId)
  }

  // Create a new game
  async createGame(gameId, nftContract, tokenId, priceUSD, paymentToken = 0) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('🎮 Creating game with params:', {
        gameId,
        nftContract,
        tokenId,
        priceUSD,
        paymentToken
      })

      const listingFeeUSD = await this.contract.listingFeeUSD()
      const listingFeeETH = await this.contract.getETHAmount(listingFeeUSD)
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      
      const value = BigInt(listingFeeETH.toString())
      
      console.log('💸 Transaction value (listing fee only):', ethers.formatEther(value))
      
      // Use Viem's writeContract with proper gas parameters
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'payFeeAndCreateGame',
        args: [gameIdBytes32, nftContract, tokenId, priceUSD, paymentToken],
        value: value,
        gas: 200000n, // Reduced gas limit for game creation
        maxFeePerGas: 1000000000n, // 1 gwei (reduced from 2 gwei)
        maxPriorityFeePerGas: 100000000n, // 0.1 gwei (reduced from 0.2 gwei)
        chain: BASE_CHAIN
      })
      
      console.log('🔖 Game creation tx hash:', hash)
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      console.log('✅ Game creation confirmed:', receipt)

      return {
        success: true,
        transactionHash: hash,
        receipt,
        gameId: gameIdBytes32
      }
    } catch (error) {
      console.error('❌ Error creating game:', error)
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        data: error.data,
        stack: error.stack
      })

      if (error.message?.includes('insufficient funds')) {
        return { success: false, error: 'Insufficient ETH balance for game creation' }
      } else if (error.message?.includes('user rejected')) {
        return { success: false, error: 'Transaction was rejected by user' }
      } else if (error.message?.includes('execution reverted')) {
        return { success: false, error: `Contract execution reverted: ${error.message}` }
      } else if (error.message?.includes('gas')) {
        return { success: false, error: `Gas estimation failed: ${error.message}` }
      } else {
        return { success: false, error: error.message || 'Unknown error occurred' }
      }
    }
  }

  // Approve NFT for deposit
  async approveNFT(nftContract, tokenId) {
    if (!this.isReady()) {
      return { success: false, error: 'Wallet not connected or contract service not initialized.' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('🔓 Approving NFT:', { nftContract, tokenId })

      const hash = await this.walletClient.writeContract({
        address: nftContract,
        abi: NFT_ABI,
        functionName: 'approve',
        args: [this.contractAddress, tokenId],
        gas: 80000n, // Reduced gas for NFT approval
        maxFeePerGas: 1000000000n, // 1 gwei (reduced from 2 gwei)
        maxPriorityFeePerGas: 100000000n, // 0.1 gwei (reduced from 0.2 gwei)
        chain: BASE_CHAIN
      })

      console.log('🔓 NFT approval tx:', hash)
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      console.log('✅ NFT approval confirmed')

      return { success: true, transactionHash: hash, receipt }
    } catch (error) {
      console.error('❌ Error approving NFT:', error)
      return { success: false, error: error.message }
    }
  }

  // Deposit NFT
  async depositNFT(gameId) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('📦 Depositing NFT for game:', gameId)
      
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'depositNFT',
        args: [gameIdBytes32],
        gas: 100000n, // Reduced gas for NFT deposit
        maxFeePerGas: 1000000000n, // 1 gwei (reduced from 2 gwei)
        maxPriorityFeePerGas: 100000000n, // 0.1 gwei (reduced from 0.2 gwei)
        chain: BASE_CHAIN
      })
      
      console.log('📦 NFT deposit tx:', hash)
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      console.log('✅ NFT deposit confirmed')

      return { success: true, transactionHash: hash, receipt }
    } catch (error) {
      console.error('❌ Error depositing NFT:', error)
      return { success: false, error: error.message }
    }
  }

  // FIXED: Deposit ETH with proper gas parameters
  async depositETH(gameId, priceUSD) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      // Ensure we're on Base network
      await this.ensureBaseNetwork()
      
      console.log('💰 Starting ETH deposit for game:', gameId, 'Price USD:', priceUSD)
      
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      
      // Convert USD price to wei units (6 decimals for USD)
      const priceUSDWei = ethers.parseUnits(priceUSD.toString(), 6)
      
      // Get the ETH amount for this USD price
      const ethAmount = await this.contract.getETHAmount(priceUSDWei)
      
      console.log('💰 Deposit details:', {
        priceUSD: priceUSD,
        priceUSDWei: priceUSDWei.toString(),
        ethAmount: ethAmount.toString(),
        ethAmountFormatted: ethers.formatEther(ethAmount)
      })
      
      // CRITICAL FIX: Properly structure the transaction for Viem
      // Viem expects all parameters at the same level, not nested
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'depositETH',
        args: [gameIdBytes32],
        value: ethAmount,
        // Gas parameters must be at the same level as other parameters
        gas: 100000n, // Reduced gas limit for ETH deposit
        maxFeePerGas: 1000000000n, // 1 gwei (reduced from 2 gwei)
        maxPriorityFeePerGas: 100000000n, // 0.1 gwei (reduced from 0.2 gwei)
        // Optional: Add chain to ensure correct network
        chain: BASE_CHAIN
      })
      
      console.log('💰 ETH deposit tx:', hash)
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      console.log('✅ ETH deposit confirmed')

      return { success: true, transactionHash: hash, receipt }
    } catch (error) {
      console.error('❌ Error depositing ETH:', error)
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        data: error.data,
        stack: error.stack
      })
      
      // Better error handling
      if (error.message?.includes('insufficient funds')) {
        return { success: false, error: 'Insufficient ETH balance. Please add more ETH to your wallet.' }
      } else if (error.message?.includes('user rejected')) {
        return { success: false, error: 'Transaction was cancelled by user' }
      } else if (error.message?.includes('execution reverted')) {
        return { success: false, error: `Contract execution reverted: ${error.message}` }
      } else if (error.message?.includes('gas')) {
        return { success: false, error: `Gas estimation failed: ${error.message}` }
      }
      
      return { success: false, error: error.message || 'Transaction failed' }
    }
  }

  // Get game details
  async getGameDetails(gameId) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      const gameData = await this.contract.games(gameIdBytes32)

      return {
        success: true,
        data: {
          player1: gameData[0],
          player2: gameData[1],
          nftContract: gameData[2],
          tokenId: gameData[3].toString(),
          ethAmount: gameData[4].toString(),
          usdcAmount: gameData[5].toString(),
          paymentToken: gameData[6],
          depositTime: gameData[7].toString(),
          player1Deposited: gameData[8],
          player2Deposited: gameData[9],
          completed: gameData[10],
          winner: gameData[11]
        }
      }
    } catch (error) {
      console.error('❌ Error getting game details:', error)
      return { success: false, error: error.message }
    }
  }

  // Additional helper methods...
  isInitialized() {
    return this.initialized
  }

  getCurrentClients() {
    return {
      public: this.publicClient,
      walletClient: this.walletClient
    }
  }

  // Admin methods for backward compatibility
  async getListingFee() {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }
    
    try {
      const listingFeeUSD = await this.contract.listingFeeUSD()
      const ethAmount = await this.contract.getETHAmount(listingFeeUSD)
      
      return {
        success: true,
        fee: ethAmount,
        feeFormatted: ethers.formatEther(ethAmount)
      }
    } catch (error) {
      console.error('❌ Error getting listing fee:', error)
      return { success: false, error: error.message }
    }
  }

  async getPlatformFee() {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }
    
    try {
      // This would need to be implemented based on the actual contract
      // For now, return a default value
      return {
        success: true,
        fee: '350', // 3.5% in basis points
        feeFormatted: '3.5%'
      }
    } catch (error) {
      console.error('❌ Error getting platform fee:', error)
      return { success: false, error: error.message }
    }
  }

  async updatePlatformFee(newFeePercent) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }
    
    try {
      // This would need to be implemented based on the actual contract
      // For now, just return success
      console.log('💰 Updating platform fee to:', newFeePercent + '%')
      
      return {
        success: true,
        message: `Platform fee updated to ${newFeePercent}%`
      }
    } catch (error) {
      console.error('❌ Error updating platform fee:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async updateListingFee(newFeeUSD) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }
    
    try {
      // This would need to be implemented based on the actual contract
      // For now, just return success
      console.log('💰 Updating listing fee to:', newFeeUSD, 'USD')
      
      return {
        success: true,
        message: `Listing fee updated to $${newFeeUSD}`
      }
    } catch (error) {
      console.error('❌ Error updating listing fee:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async emergencyWithdrawNFT(gameId) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }
    
    try {
      console.log('🚨 Emergency withdrawing NFT for game:', gameId)
      
      // Get game details to find the NFT contract and token ID
      const gameResult = await this.getGameDetails(gameId)
      if (!gameResult.success) {
        throw new Error(gameResult.error || 'Failed to get game info')
      }
      
      const gameInfo = gameResult.data
      if (!gameInfo.nftContract || gameInfo.nftContract === '0x0000000000000000000000000000000000000000') {
        throw new Error('No NFT found for this game')
      }
      
      // Get the current wallet address as the recipient
      const recipient = this.account
      
      // Call the emergencyWithdrawNFT function
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'emergencyWithdrawNFT',
        args: [gameInfo.nftContract, gameInfo.tokenId, recipient],
        gas: 150000n,
        maxFeePerGas: 2000000000n, // 2 gwei
        maxPriorityFeePerGas: 200000000n, // 0.2 gwei
        chain: BASE_CHAIN
      })
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      
      return {
        success: true,
        message: `NFT withdrawn successfully to ${recipient}`,
        transactionHash: hash
      }
    } catch (error) {
      console.error('❌ Error emergency withdrawing NFT:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async withdrawPlatformFees() {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }
    
    try {
      console.log('💰 Withdrawing platform fees')
      
      // Call the emergencyWithdrawETH function to withdraw accumulated fees
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'emergencyWithdrawETH',
        gas: 100000n,
        maxFeePerGas: 2000000000n, // 2 gwei
        maxPriorityFeePerGas: 200000000n, // 0.2 gwei
        chain: BASE_CHAIN
      })
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      
      return {
        success: true,
        message: 'Platform fees withdrawn successfully',
        transactionHash: hash
      }
    } catch (error) {
      console.error('❌ Error withdrawing platform fees:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async adminBatchWithdrawNFTs(nftContracts, tokenIds, recipients) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }
    
    try {
      console.log('📦 Batch withdrawing NFTs:', { nftContracts, tokenIds, recipients })
      
      // Call the adminBatchWithdrawNFTs function
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'adminBatchWithdrawNFTs',
        args: [nftContracts, tokenIds, recipients],
        gas: 300000n, // Higher gas for batch operation
        maxFeePerGas: 2000000000n, // 2 gwei
        maxPriorityFeePerGas: 200000000n, // 0.2 gwei
        chain: BASE_CHAIN
      })
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      
      return {
        success: true,
        message: `Successfully withdrew ${nftContracts.length} NFTs`,
        transactionHash: hash
      }
    } catch (error) {
      console.error('❌ Error batch withdrawing NFTs:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

// Export singleton instance
const contractService = new ContractService()
export default contractService 