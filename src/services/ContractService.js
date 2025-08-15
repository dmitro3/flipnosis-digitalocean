import { ethers } from 'ethers'
import { Alchemy, Network } from 'alchemy-sdk'
import { createWalletClient, createPublicClient, http, custom } from 'viem'
import { base } from 'viem/chains'

// Contract configuration
const CONTRACT_ADDRESS = '0xF5fdE838AB5aa566AC7d1b9116523268F39CC6D0'

// Use Alchemy RPC endpoint directly
const ALCHEMY_RPC_URL = 'https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3'

// Clean Contract ABI - only what we need
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
    name: 'canStartGame',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'gameId', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'canDeposit',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'gameId', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }]
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
    name: 'safeTransferFrom',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' }
    ],
    outputs: []
  }
]

// Cache for ETH prices to reduce RPC calls
const priceCache = new Map()
const CACHE_DURATION = 30000 // 30 seconds

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
        console.error('❌ Missing wallet client or address')
        return { success: false, error: 'Wallet not connected' }
      }

      // Store wallet client and account
      this.walletClient = walletClient
      this.account = address

      // Create public client with Alchemy RPC
      this.publicClient = createPublicClient({
        chain: base,
        transport: http(ALCHEMY_RPC_URL)
      })

      // Create contract instance
      this.contract = {
        // View functions using public client
        getETHAmount: async (usdAmount) => {
          // Convert BigInt to number for cache key calculation
          const usdAmountNumber = Number(usdAmount) / 1000000
          const cacheKey = `eth_price_${Math.round(usdAmountNumber)}`
          const cached = priceCache.get(cacheKey)
          
          if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log('💰 Using cached ETH price')
            return cached.value
          }

          try {
            const result = await this.publicClient.readContract({
              address: this.contractAddress,
              abi: CONTRACT_ABI,
              functionName: 'getETHAmount',
              args: [usdAmount]
            })
            
            priceCache.set(cacheKey, { value: result, timestamp: Date.now() })
            return result
          } catch (error) {
            console.error('❌ Error getting ETH amount:', error)
            // Fallback calculation
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
        },
        canStartGame: async (gameId) => {
          return await this.publicClient.readContract({
            address: this.contractAddress,
            abi: CONTRACT_ABI,
            functionName: 'canStartGame',
            args: [gameId]
          })
        },
        canDeposit: async (gameId) => {
          return await this.publicClient.readContract({
            address: this.contractAddress,
            abi: CONTRACT_ABI,
            functionName: 'canDeposit',
            args: [gameId]
          })
        },
        // Write functions using wallet client
        payListingFee: async (value) => {
          return await this.walletClient.writeContract({
            address: this.contractAddress,
            abi: CONTRACT_ABI,
            functionName: 'payListingFee',
            args: [],
            value
          })
        },
        payFeeAndCreateGame: async (gameId, nftContract, tokenId, priceUSD, paymentToken, value) => {
          return await this.walletClient.writeContract({
            address: this.contractAddress,
            abi: CONTRACT_ABI,
            functionName: 'payFeeAndCreateGame',
            args: [gameId, nftContract, tokenId, priceUSD, paymentToken],
            value
          })
        },
        depositNFT: async (gameId) => {
          return await this.walletClient.writeContract({
            address: this.contractAddress,
            abi: CONTRACT_ABI,
            functionName: 'depositNFT',
            args: [gameId]
          })
        },
        depositETH: async (gameId, agreedPriceUSD, value) => {
          return await this.walletClient.writeContract({
            address: this.contractAddress,
            abi: CONTRACT_ABI,
            functionName: 'depositETH',
            args: [gameId, agreedPriceUSD],
            value
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
        '10': Network.OPT_MAINNET,
        '56': Network.BSC_MAINNET,
        '43114': Network.AVAX_MAINNET
      }

      const alchemyNetwork = chainToNetwork[chainIdStr]
      if (!alchemyNetwork) {
        console.warn('⚠️ Unsupported network for Alchemy:', chainIdStr)
        return
      }

      const apiKey = 'hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3'

      this.alchemy = new Alchemy({
        apiKey,
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

  isInitialized() {
    return this.initialized
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

  // Create a new game
  async createGame(gameId, nftContract, tokenId, priceUSD, paymentToken = 0) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      console.log('🎮 Creating game with params:', {
        gameId,
        nftContract,
        tokenId,
        priceUSD, // This is just for logging, not sent to contract
        paymentToken
      })

      // Get only the listing fee (currently $0)
      const listingFeeUSD = await this.contract.listingFeeUSD()
      const listingFeeETH = await this.contract.getETHAmount(listingFeeUSD)
      
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      
      // Only send the listing fee as value (currently $0)
      const value = BigInt(listingFeeETH.toString())
      
      console.log('💸 Transaction value (listing fee only):', ethers.formatEther(value))
      
      // Call contract - note: no price is sent to contract anymore
      // Force gas parameters to prevent MetaMask from using wrong values
      const hash = await this.contract.payFeeAndCreateGame(
        gameIdBytes32,
        nftContract,
        tokenId,
        priceUSD, // Keep for now but contract will ignore
        paymentToken,
        value,
        {
          gas: BigInt(250000), // Reduced gas limit for game creation
          maxFeePerGas: BigInt(20000000000), // 20 gwei max fee (reduced)
          maxPriorityFeePerGas: BigInt(1000000000) // 1 gwei priority fee
        }
      )
      
      console.log('📝 Game creation tx hash:', hash)
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

      if (error.message.includes('insufficient funds')) {
        return { success: false, error: 'Insufficient ETH balance for game creation' }
      } else if (error.message.includes('user rejected')) {
        return { success: false, error: 'Transaction was rejected by user' }
      } else {
        return { success: false, error: error.message }
      }
    }
  }

  // Backward compatibility method
  async payFeeAndCreateGame(gameId, nftContract, tokenId, priceUSD, paymentToken = 0) {
    return this.createGame(gameId, nftContract, tokenId, priceUSD, paymentToken)
  }

  // Convert game ID to bytes32
  getGameIdBytes32(gameId) {
    return ethers.id(gameId)
  }

  // Approve NFT for deposit
  async approveNFT(nftContract, tokenId) {
    if (!this.isReady()) {
      return { success: false, error: 'Wallet not connected or contract service not initialized.' }
    }

    try {
      // Check if already approved
      const approved = await this.publicClient.readContract({
        address: nftContract,
        abi: NFT_ABI,
        functionName: 'getApproved',
        args: [tokenId]
      })

      if (approved.toLowerCase() === this.contractAddress.toLowerCase()) {
        console.log('✅ NFT already approved')
        return { success: true, alreadyApproved: true }
      }

      // Approve NFT
      const hash = await this.walletClient.writeContract({
        address: nftContract,
        abi: NFT_ABI,
        functionName: 'approve',
        args: [this.contractAddress, tokenId]
      })

      console.log('🔐 NFT approval tx:', hash)

      // Wait for confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      console.log('✅ NFT approval confirmed')

      return { success: true, transactionHash: hash, receipt }
    } catch (error) {
      console.error('❌ Error approving NFT:', error)
      return { success: false, error: error.message }
    }
  }

  // Deposit NFT to game
  async depositNFT(gameId, nftContract = null, tokenId = null) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      
      // Add retry mechanism for canDeposit check due to potential race conditions
      let canDeposit = false
      let retryCount = 0
      const maxRetries = 3
      
      while (!canDeposit && retryCount < maxRetries) {
        try {
          canDeposit = await this.contract.canDeposit(gameIdBytes32)
          console.log(`🔍 Can deposit check result (attempt ${retryCount + 1}):`, canDeposit)
          
          if (!canDeposit && retryCount < maxRetries - 1) {
            console.log(`⏳ CanDeposit returned false, waiting 2 seconds before retry...`)
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        } catch (error) {
          console.error(`❌ Error calling canDeposit (attempt ${retryCount + 1}):`, error)
          canDeposit = false
          
          if (retryCount < maxRetries - 1) {
            console.log(`⏳ Error occurred, waiting 2 seconds before retry...`)
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        }
        retryCount++
      }

      if (!canDeposit) {
        // Get game details to check if game exists and is active
        const gameDetails = await this.getGameDetails(gameId)
        console.log('🔍 Game details when canDeposit is false:', gameDetails)
        
        // If the game exists and is not completed, try to proceed anyway
        if (gameDetails.success && 
            gameDetails.data.player1 !== '0x0000000000000000000000000000000000000000' && 
            !gameDetails.data.completed) {
          console.log('⚠️ CanDeposit returned false but game exists and is active, proceeding with deposit...')
          console.log('📊 Game state:', {
            player1: gameDetails.data.player1,
            player2: gameDetails.data.player2,
            completed: gameDetails.data.completed,
            depositTime: gameDetails.data.depositTime,
            player1Deposited: gameDetails.data.player1Deposited,
            player2Deposited: gameDetails.data.player2Deposited
          })
          
          // Check if deposit timeout has actually expired
          const currentBlock = await this.publicClient.getBlock()
          const currentTimestamp = currentBlock.timestamp
          const depositTime = BigInt(gameDetails.data.depositTime)
          const depositTimeout = BigInt(300) // 5 minutes in seconds
          const timeRemaining = depositTime + depositTimeout - BigInt(currentTimestamp)
          
          console.log('⏰ Time check:', {
            currentTimestamp: currentTimestamp.toString(),
            depositTime: depositTime.toString(),
            depositTimeout: depositTimeout.toString(),
            timeRemaining: timeRemaining.toString(),
            timeRemainingMinutes: (Number(timeRemaining) / 60).toFixed(2)
          })
          
          if (timeRemaining <= 0) {
            console.error('❌ Deposit timeout has actually expired')
            return { success: false, error: 'Deposit period has expired' }
          }
        } else {
          console.error('❌ Game details indicate deposit should not be allowed:', gameDetails)
          return { success: false, error: 'Deposit period has expired or game is not active' }
        }
      }

      // If NFT contract and token ID are provided, approve first
      if (nftContract && tokenId) {
        const approvalResult = await this.approveNFT(nftContract, tokenId)
        if (!approvalResult.success && !approvalResult.alreadyApproved) {
          return approvalResult
        }
      }

      // Final check: verify game exists before attempting deposit
      const finalGameCheck = await this.getGameDetails(gameId)
      if (!finalGameCheck.success || finalGameCheck.data.player1 === '0x0000000000000000000000000000000000000000') {
        console.error('❌ Final game check failed - game does not exist in contract')
        return { success: false, error: 'Game not found in contract' }
      }

      console.log('✅ Proceeding with NFT deposit...')
      const hash = await this.contract.depositNFT(gameIdBytes32)
      console.log('📦 NFT deposit tx:', hash)

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      console.log('✅ NFT deposit confirmed')

      return { success: true, transactionHash: hash, receipt }
    } catch (error) {
      console.error('❌ Error depositing NFT:', error)
      return { success: false, error: error.message }
    }
  }

  // Deposit ETH to game
  async depositETH(gameId, priceUSD) {
    console.log('🚀 depositETH called with gameId:', gameId, 'priceUSD:', priceUSD)
    
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      
      // Convert USD price to 6 decimals for contract
      const priceUSDWei = ethers.parseUnits(priceUSD.toString(), 6)
      
      // Get the ETH amount for this USD price (frontend calculation)
      const ethAmount = await this.contract.getETHAmount(priceUSDWei)
      
      console.log('💰 Deposit details:', {
        priceUSD: priceUSD,
        priceUSDWei: priceUSDWei.toString(),
        ethAmount: ethAmount.toString(),
        ethAmountFormatted: ethers.formatEther(ethAmount)
      })
      
      // Call depositETH without price validation - contract accepts any amount
      // Force gas parameters to prevent MetaMask from using wrong values
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'depositETH',
        args: [gameIdBytes32],
        value: ethAmount,
        gas: BigInt(150000), // Reduced gas limit
        maxFeePerGas: BigInt(20000000000), // 20 gwei max fee (reduced)
        maxPriorityFeePerGas: BigInt(1000000000) // 1 gwei priority fee
      })
      
      console.log('💰 ETH deposit tx:', hash)
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      console.log('✅ ETH deposit confirmed')

      return { success: true, transactionHash: hash, receipt }
    } catch (error) {
      console.error('❌ Error depositing ETH:', error)
      return { success: false, error: error.message }
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
        args: [gameInfo.nftContract, gameInfo.tokenId, recipient]
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
        functionName: 'emergencyWithdrawETH'
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
        args: [nftContracts, tokenIds, recipients]
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

  getCurrentClients() {
    return {
      public: this.publicClient,
      walletClient: this.walletClient
    }
  }
}

// Export singleton instance
const contractService = new ContractService()
export default contractService 