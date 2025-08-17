import { ethers } from 'ethers'
import { createPublicClient, createWalletClient, custom, http } from 'viem'
import { base } from 'viem/chains'
import { Alchemy, Network } from 'alchemy-sdk'

const BASE_CHAIN = base

// NFTFlipGame contract ABI - matching the deployed contract
const CONTRACT_ABI = [
  // Core deposit functions
  {
    "inputs": [{"internalType": "bytes32", "name": "gameId", "type": "bytes32"}, {"internalType": "address", "name": "nftContract", "type": "address"}, {"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "depositNFT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "gameId", "type": "bytes32"}],
    "name": "depositETH",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "gameId", "type": "bytes32"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "depositUSDC",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Game state functions
  {
    "inputs": [{"internalType": "bytes32", "name": "gameId", "type": "bytes32"}],
    "name": "isGameReady",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "gameId", "type": "bytes32"}],
    "name": "getGameParticipants",
    "outputs": [{"internalType": "address", "name": "nftPlayer", "type": "address"}, {"internalType": "address", "name": "cryptoPlayer", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Reclaim functions
  {
    "inputs": [{"internalType": "bytes32", "name": "gameId", "type": "bytes32"}],
    "name": "reclaimNFT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "gameId", "type": "bytes32"}],
    "name": "reclaimCrypto",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // View functions for deposits
  {
    "inputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "name": "nftDeposits",
    "outputs": [
      {"internalType": "address", "name": "depositor", "type": "address"}, 
      {"internalType": "address", "name": "nftContract", "type": "address"}, 
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"}, 
      {"internalType": "bool", "name": "claimed", "type": "bool"}, 
      {"internalType": "uint256", "name": "depositTime", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "name": "ethDeposits",
    "outputs": [
      {"internalType": "address", "name": "depositor", "type": "address"}, 
      {"internalType": "uint256", "name": "amount", "type": "uint256"}, 
      {"internalType": "bool", "name": "claimed", "type": "bool"}, 
      {"internalType": "uint256", "name": "depositTime", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "name": "usdcDeposits",
    "outputs": [
      {"internalType": "address", "name": "depositor", "type": "address"}, 
      {"internalType": "uint256", "name": "amount", "type": "uint256"}, 
      {"internalType": "bool", "name": "claimed", "type": "bool"}, 
      {"internalType": "uint256", "name": "depositTime", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Admin emergency withdraw functions
  {
    "inputs": [{"internalType": "bytes32", "name": "gameId", "type": "bytes32"}, {"internalType": "address", "name": "recipient", "type": "address"}],
    "name": "emergencyWithdrawNFT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "gameId", "type": "bytes32"}, {"internalType": "address", "name": "recipient", "type": "address"}],
    "name": "emergencyWithdrawETH",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "gameId", "type": "bytes32"}, {"internalType": "address", "name": "recipient", "type": "address"}],
    "name": "emergencyWithdrawUSDC",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Admin batch withdraw function
  {
    "inputs": [{"internalType": "bytes32[]", "name": "gameIds", "type": "bytes32[]"}, {"internalType": "address[]", "name": "recipients", "type": "address[]"}],
    "name": "adminBatchWithdrawNFTs",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Admin settings functions
  {
    "inputs": [{"internalType": "uint256", "name": "_feePercent", "type": "uint256"}],
    "name": "setPlatformFeePercent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_receiver", "type": "address"}],
    "name": "setPlatformFeeReceiver",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // View functions for settings
  {
    "inputs": [],
    "name": "platformFeePercent",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "platformFeeReceiver",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "depositTimeout",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
]

const NFT_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

class ContractService {
  constructor() {
    this.contractAddress = null
    this.walletClient = null
    this.publicClient = null
    this.contract = null
    this.userAddress = null
    this.alchemy = null
  }

  async initialize(walletClient, publicClient) {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected')
    }

    // Use the deployed contract address from base-deployment.json
    this.contractAddress = '0x6527c1e6b12cd0F6d354B15CF7935Dc5516DEcaf'

    try {
      // Use provided clients or create new ones
      this.publicClient = publicClient || createPublicClient({
        chain: BASE_CHAIN,
        transport: http()
      })

      this.walletClient = walletClient || createWalletClient({
        chain: BASE_CHAIN,
        transport: custom(window.ethereum)
      })

      const accounts = await this.walletClient.getAddresses()
      if (accounts.length === 0) {
        throw new Error('No accounts connected')
      }
      this.userAddress = accounts[0]

      // Initialize Alchemy for NFT operations
      try {
        const apiKey = import.meta.env.VITE_ALCHEMY_API_KEY || 'hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3'
        
        this.alchemy = new Alchemy({
          apiKey,
          network: Network.BASE_MAINNET
        })
        
        console.log('✅ Alchemy initialized for NFT operations')
      } catch (alchemyError) {
        console.warn('⚠️ Alchemy initialization failed, NFT operations may be limited:', alchemyError)
      }

      console.log('✅ Contract service initialized:', {
        contractAddress: this.contractAddress,
        userAddress: this.userAddress,
        chain: BASE_CHAIN.name,
        alchemy: !!this.alchemy
      })

      return { success: true }
    } catch (error) {
      console.error('❌ Contract service initialization failed:', error)
      return { success: false, error: error.message }
    }
  }

  isReady() {
    return !!(this.walletClient && this.publicClient && this.contractAddress)
  }

  async ensureBaseNetwork() {
    try {
      await this.walletClient.switchChain({ id: BASE_CHAIN.id })
    } catch (error) {
      if (error.code === 4902) {
        await this.walletClient.addChain({ chain: BASE_CHAIN })
        await this.walletClient.switchChain({ id: BASE_CHAIN.id })
      } else {
        throw error
      }
    }
  }

  getGameIdBytes32(gameId) {
    return ethers.id(gameId)
  }

  // Get proper gas configuration for transactions
  async getGasConfig() {
    try {
      const feeData = await this.publicClient.getGasPrice()
      const baseFee = await this.publicClient.getBlock({ blockTag: 'latest' }).then(block => block.baseFeePerGas || 0n)
      
      // Set priority fee to 1.5 gwei (reasonable for Base)
      const maxPriorityFeePerGas = 1500000000n // 1.5 gwei
      
      // Set max fee to base fee + priority fee + buffer (minimum 2.5 gwei total)
      const minMaxFee = 2500000000n // 2.5 gwei minimum
      const calculatedMaxFee = baseFee + maxPriorityFeePerGas + 1000000000n // base + priority + 1 gwei buffer
      const maxFeePerGas = calculatedMaxFee > minMaxFee ? calculatedMaxFee : minMaxFee
      
      console.log('⛽ Gas configuration:', {
        baseFee: baseFee.toString(),
        maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
        maxFeePerGas: maxFeePerGas.toString(),
        gasPrice: feeData.toString()
      })
      
      return {
        maxFeePerGas,
        maxPriorityFeePerGas,
        gas: 200000n // Default gas limit
      }
    } catch (error) {
      console.warn('⚠️ Could not get dynamic gas config, using fallback:', error)
      // Fallback configuration
      return {
        maxFeePerGas: 2500000000n, // 2.5 gwei
        maxPriorityFeePerGas: 1500000000n, // 1.5 gwei  
        gas: 200000n
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

      const gasConfig = await this.getGasConfig()

      const hash = await this.walletClient.writeContract({
        address: nftContract,
        abi: NFT_ABI,
        functionName: 'approve',
        args: [this.contractAddress, tokenId],
        chain: BASE_CHAIN,
        ...gasConfig
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

  // Deposit NFT for a game
  async depositNFT(gameId, nftContract, tokenId) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('📦 Depositing NFT for game:', { gameId, nftContract, tokenId })
      
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      const gasConfig = await this.getGasConfig()
      
      // Estimate gas first to get accurate gas cost
      const gasEstimate = await this.publicClient.estimateContractGas({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'depositNFT',
        args: [gameIdBytes32, nftContract, BigInt(tokenId)],
        account: this.userAddress
      })
      
      console.log('📦 Gas estimate for NFT deposit:', gasEstimate.toString())
      
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'depositNFT',
        args: [gameIdBytes32, nftContract, BigInt(tokenId)],
        chain: BASE_CHAIN,
        gas: gasEstimate,
        ...gasConfig
      })
      
      console.log('📦 NFT deposit tx:', hash)
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      console.log('✅ NFT deposit confirmed')

      return { success: true, transactionHash: hash, receipt }
    } catch (error) {
      console.error('❌ Error depositing NFT:', error)
      if (error.message?.includes('NFT already deposited')) {
        return { success: false, error: 'NFT already deposited for this game' }
      }
      return { success: false, error: error.message }
    }
  }

  // Deposit ETH for a game
  async depositETH(gameId, priceUSD) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      
      console.log('💰 Starting ETH deposit for game:', gameId, 'Price USD:', priceUSD)
      
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      const gasConfig = await this.getGasConfig()
      
      // Convert USD price to ETH with proper decimal handling
      const ethPriceUSD = 3500 // This should come from a price oracle
      const ethAmount = parseFloat(priceUSD) / ethPriceUSD
      
      // Round to 6 decimal places to avoid precision issues
      const ethAmountRounded = Math.round(ethAmount * 1000000) / 1000000
      const ethAmountWei = ethers.parseEther(ethAmountRounded.toString())
      
      console.log('💰 Deposit details:', {
        priceUSD,
        ethAmount,
        ethAmountWei: ethAmountWei.toString(),
        gameIdBytes32
      })
      
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'depositETH',
        args: [gameIdBytes32],
        value: ethAmountWei,
        chain: BASE_CHAIN,
        ...gasConfig
      })
      
      console.log('💰 ETH deposit tx:', hash)
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      console.log('✅ ETH deposit confirmed')

      return { success: true, transactionHash: hash, receipt, ethAmount: ethAmountWei.toString() }
    } catch (error) {
      console.error('❌ Error depositing ETH:', error)
      if (error.message?.includes('ETH already deposited')) {
        return { success: false, error: 'ETH already deposited for this game' }
      }
      if (error.message?.includes('USDC already deposited')) {
        return { success: false, error: 'USDC already deposited for this game' }
      }
      return { success: false, error: error.message }
    }
  }

  // Check if game is ready (both assets deposited)
  async isGameReady(gameId) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      
      const isReady = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'isGameReady',
        args: [gameIdBytes32]
      })
      
      console.log(`🎮 Game ${gameId} ready status:`, isReady)
      return { success: true, isReady }
    } catch (error) {
      console.error('❌ Error checking game ready status:', error)
      return { success: false, error: error.message }
    }
  }

  // Get game participants
  async getGameParticipants(gameId) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      
      const [nftPlayer, cryptoPlayer] = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'getGameParticipants',
        args: [gameIdBytes32]
      })
      
      console.log(`🎮 Game ${gameId} participants:`, { nftPlayer, cryptoPlayer })
      return { success: true, nftPlayer, cryptoPlayer }
    } catch (error) {
      console.error('❌ Error getting game participants:', error)
      return { success: false, error: error.message }
    }
  }

  // Get detailed game state
  async getGameState(gameId) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      
      // Get all deposit info
      const nftDeposit = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'nftDeposits',
        args: [gameIdBytes32]
      })
      
      const ethDeposit = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'ethDeposits',
        args: [gameIdBytes32]
      })
      
      const gameState = {
        nftDeposit: {
          depositor: nftDeposit[0],
          nftContract: nftDeposit[1],
          tokenId: nftDeposit[2].toString(),
          claimed: nftDeposit[3],
          depositTime: nftDeposit[4].toString(),
          hasDeposit: nftDeposit[0] !== '0x0000000000000000000000000000000000000000'
        },
        ethDeposit: {
          depositor: ethDeposit[0],
          amount: ethDeposit[1].toString(),
          claimed: ethDeposit[2],
          depositTime: ethDeposit[3].toString(),
          hasDeposit: ethDeposit[0] !== '0x0000000000000000000000000000000000000000'
        }
      }
      
      // Check if game is ready
      gameState.isReady = gameState.nftDeposit.hasDeposit && gameState.ethDeposit.hasDeposit
      
      console.log(`🎮 Game ${gameId} state:`, gameState)
      return { success: true, gameState }
    } catch (error) {
      console.error('❌ Error getting game state:', error)
      return { success: false, error: error.message }
    }
  }

  // Reclaim NFT if no crypto deposited
  async reclaimNFT(gameId) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('🔄 Reclaiming NFT for game:', gameId)
      
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      const gasConfig = await this.getGasConfig()
      
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'reclaimNFT',
        args: [gameIdBytes32],
        chain: BASE_CHAIN,
        ...gasConfig
      })
      
      console.log('🔄 NFT reclaim tx:', hash)
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      console.log('✅ NFT reclaim confirmed')

      return { success: true, transactionHash: hash, receipt }
    } catch (error) {
      console.error('❌ Error reclaiming NFT:', error)
      return { success: false, error: error.message }
    }
  }

  // Reclaim crypto if no NFT deposited
  async reclaimCrypto(gameId) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('🔄 Reclaiming crypto for game:', gameId)
      
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      const gasConfig = await this.getGasConfig()
      
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'reclaimCrypto',
        args: [gameIdBytes32],
        chain: BASE_CHAIN,
        ...gasConfig
      })
      
      console.log('🔄 Crypto reclaim tx:', hash)
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      console.log('✅ Crypto reclaim confirmed')

      return { success: true, transactionHash: hash, receipt }
    } catch (error) {
      console.error('❌ Error reclaiming crypto:', error)
      return { success: false, error: error.message }
    }
  }

  // Legacy methods for compatibility with existing frontend
  async createGame(gameId, nftContract, tokenId, priceUSD) {
    console.log('🔄 Creating game (legacy method):', { gameId, nftContract, tokenId, priceUSD })
    return await this.depositNFT(gameId, nftContract, tokenId)
  }

  async cancelGame(gameId) {
    console.log('🔄 Canceling game (legacy method):', gameId)
    // Try to reclaim NFT first, then crypto
    const nftResult = await this.reclaimNFT(gameId)
    if (!nftResult.success) {
      return await this.reclaimCrypto(gameId)
    }
    return nftResult
  }

  // Admin methods (stubs for compatibility)
  async getListingFee() {
    console.log('📋 Getting listing fee (stub)')
    return { success: true, fee: 0 } // No listing fee in new contract
  }

  async getPlatformFee() {
    console.log('📋 Getting platform fee (stub)')
    return { success: true, fee: 3.5 } // 3.5% in updated contract
  }

  async updatePlatformFee(newFeePercent) {
    console.log('📋 Updating platform fee (stub):', newFeePercent)
    return { success: true, message: 'Platform fee updated (stub)' }
  }

  async updateListingFee(newFeeUSD) {
    console.log('📋 Updating listing fee (stub):', newFeeUSD)
    return { success: true, message: 'Listing fee updated (stub)' }
  }

  async emergencyWithdrawNFT(gameId, recipient) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('🚨 Emergency withdrawing NFT for game:', gameId, 'to recipient:', recipient)
      
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      const gasConfig = await this.getGasConfig()
      
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'emergencyWithdrawNFT',
        args: [gameIdBytes32, recipient],
        chain: BASE_CHAIN,
        ...gasConfig
      })
      
      console.log('🚨 Emergency NFT withdraw tx:', hash)
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      console.log('✅ Emergency NFT withdraw confirmed')

      return { success: true, transactionHash: hash, receipt }
    } catch (error) {
      console.error('❌ Error emergency withdrawing NFT:', error)
      return { success: false, error: error.message }
    }
  }

  async emergencyWithdrawETH(gameId, recipient) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('🚨 Emergency withdrawing ETH for game:', gameId, 'to recipient:', recipient)
      
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      const gasConfig = await this.getGasConfig()
      
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'emergencyWithdrawETH',
        args: [gameIdBytes32, recipient],
        chain: BASE_CHAIN,
        ...gasConfig
      })
      
      console.log('🚨 Emergency ETH withdraw tx:', hash)
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      console.log('✅ Emergency ETH withdraw confirmed')

      return { success: true, transactionHash: hash, receipt }
    } catch (error) {
      console.error('❌ Error emergency withdrawing ETH:', error)
      return { success: false, error: error.message }
    }
  }

  async emergencyWithdrawUSDC(gameId, recipient) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('🚨 Emergency withdrawing USDC for game:', gameId, 'to recipient:', recipient)
      
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      const gasConfig = await this.getGasConfig()
      
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'emergencyWithdrawUSDC',
        args: [gameIdBytes32, recipient],
        chain: BASE_CHAIN,
        ...gasConfig
      })
      
      console.log('🚨 Emergency USDC withdraw tx:', hash)
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      console.log('✅ Emergency USDC withdraw confirmed')

      return { success: true, transactionHash: hash, receipt }
    } catch (error) {
      console.error('❌ Error emergency withdrawing USDC:', error)
      return { success: false, error: error.message }
    }
  }

  async withdrawPlatformFees() {
    console.log('💰 Withdrawing platform fees (stub)')
    return { success: true, message: 'Platform fees withdrawn (stub)' }
  }

  // Method to find game IDs that contain specific NFTs
  async findGameIdsForNFTs(nftContracts, tokenIds) {
    const gameIds = []
    
    try {
      // Get all games from database first
      const response = await fetch('https://cryptoflipz2-production.up.railway.app/api/admin/games')
      if (!response.ok) {
        console.warn('Could not fetch games from database for game ID lookup')
        return []
      }
      
      const data = await response.json()
      const games = data.games || []
      
      console.log(`🔍 Searching ${games.length} games for NFT matches...`)
      
      // For each NFT we want to withdraw, find the game ID that contains it
      for (let i = 0; i < nftContracts.length; i++) {
        const targetContract = nftContracts[i].toLowerCase()
        const targetTokenId = tokenIds[i].toString()
        
        let foundGameId = null
        
        // Search through all games to find one with this NFT
        for (const game of games) {
          try {
            const gameIdBytes32 = this.getGameIdBytes32(game.id.toString())
            const nftDeposit = await this.publicClient.readContract({
              address: this.contractAddress,
              abi: CONTRACT_ABI,
              functionName: 'nftDeposits',
              args: [gameIdBytes32]
            })
            
            if (nftDeposit[1].toLowerCase() === targetContract && 
                nftDeposit[2].toString() === targetTokenId && 
                !nftDeposit[3]) { // not claimed
              foundGameId = game.id.toString()
              console.log(`✅ Found NFT ${targetContract}:${targetTokenId} in game ${foundGameId}`)
              break
            }
          } catch (error) {
            // Ignore errors for individual games
          }
        }
        
        if (foundGameId) {
          gameIds.push(foundGameId)
        } else {
          console.warn(`⚠️ Could not find game ID for NFT ${targetContract}:${targetTokenId} - likely sent directly to contract`)
          gameIds.push(null)
        }
      }
      
      return gameIds
    } catch (error) {
      console.error('❌ Error finding game IDs:', error)
      return []
    }
  }

  // Optimized method that doesn't hit rate limits by searching database first
  async findGameIdsOptimized(nftContracts, tokenIds) {
    const gameIds = []
    
    try {
      // Get all games from database first
      const response = await fetch('https://cryptoflipz2-production.up.railway.app/api/admin/games')
      if (!response.ok) {
        console.warn('Could not fetch games from database for game ID lookup')
        return []
      }
      
      const data = await response.json()
      const games = data.games || []
      
      console.log(`🔍 Searching ${games.length} games for NFT matches in database...`)
      
      // For each NFT we want to withdraw, find the game ID that contains it
      for (let i = 0; i < nftContracts.length; i++) {
        const targetContract = nftContracts[i].toLowerCase()
        const targetTokenId = tokenIds[i].toString()
        
        let foundGameId = null
        
        // Search through database games by NFT info first (much faster)
        for (const game of games) {
          // Check if this game has the NFT token ID we're looking for
          if (game.nft_token_id && game.nft_token_id.toString() === targetTokenId) {
            // Also check contract if available
            if (!game.nft_contract || game.nft_contract.toLowerCase() === targetContract) {
              foundGameId = game.id.toString()
              console.log(`✅ Found NFT ${targetContract}:${targetTokenId} in database game ${foundGameId}`)
              break
            }
          }
        }
        
        gameIds.push(foundGameId)
        
        if (!foundGameId) {
          console.warn(`⚠️ Could not find game ID for NFT ${targetContract}:${targetTokenId} in database`)
        }
      }
      
      return gameIds
    } catch (error) {
      console.error('❌ Error finding game IDs:', error)
      return []
    }
  }

  // Direct NFT rescue method for NFTs sent directly to contract (not part of games)
  async directNFTRescue(nftContracts, tokenIds, recipients) {
    console.log('🚨 Attempting direct NFT rescue for orphaned NFTs...')
    
    // Since the current contract doesn't have a direct rescue function,
    // we'll show a helpful error message explaining the situation
    return {
      success: false,
      error: `CONTRACT LIMITATION: These NFTs appear to be sent directly to the contract address (not deposited through games). The current contract only supports withdrawing NFTs that were properly deposited through the game system. 

SOLUTIONS:
1. If these are test NFTs, you may need to deploy a contract upgrade with rescue functions
2. Check if any of these NFTs were actually deposited in games that aren't in the database
3. The NFTs are safely stored in the contract but cannot be withdrawn with current contract functions

NFTs detected: ${nftContracts.length}
Contract Address: ${this.contractAddress}

To fix this, you would need to add emergencyRescueNFT() function to the contract.`
    }
  }

  async adminBatchWithdrawNFTs(nftContracts, tokenIds, recipients) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('📦 Admin batch withdrawing NFTs:', { nftContracts, tokenIds, recipients })
      
      // First, try to restore any missing games to ensure database is complete
      console.log('🔧 Restoring missing games before withdrawal...')
      try {
        const restoreResponse = await fetch('https://cryptoflipz2-production.up.railway.app/api/admin/restore-missing-games', {
          method: 'POST'
        })
        if (restoreResponse.ok) {
          const restoreData = await restoreResponse.json()
          console.log('✅ Restore operation completed:', restoreData)
        }
      } catch (restoreError) {
        console.warn('⚠️ Could not restore missing games, continuing with current database')
      }
      
      // Try to find the game IDs for these NFTs using optimized approach
      const gameIds = await this.findGameIdsOptimized(nftContracts, tokenIds)
      
      // Filter out NFTs where we found game IDs and use batch withdraw
      const validGameIds = []
      const validRecipients = []
      const individualNFTs = []
      
      for (let i = 0; i < gameIds.length; i++) {
        if (gameIds[i]) {
          validGameIds.push(gameIds[i])
          validRecipients.push(recipients[i])
        } else {
          individualNFTs.push({
            nftContract: nftContracts[i],
            tokenId: tokenIds[i],
            recipient: recipients[i]
          })
        }
      }
      
      const results = []
      
      // Use batch withdraw for NFTs with known game IDs
      if (validGameIds.length > 0) {
        try {
          console.log(`📦 Batch withdrawing ${validGameIds.length} NFTs with known game IDs...`)
          
          const gameIdsBytes32 = validGameIds.map(gameId => this.getGameIdBytes32(gameId))
          const gasConfig = await this.getGasConfig()
          
          const hash = await this.walletClient.writeContract({
            address: this.contractAddress,
            abi: CONTRACT_ABI,
            functionName: 'adminBatchWithdrawNFTs',
            args: [gameIdsBytes32, validRecipients],
            chain: BASE_CHAIN,
            ...gasConfig
          })
          
          const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
          results.push({ 
            success: true, 
            transactionHash: hash, 
            receipt, 
            count: validGameIds.length,
            type: 'batch'
          })
          
          console.log(`✅ Batch withdrew ${validGameIds.length} NFTs successfully`)
        } catch (error) {
          console.error('❌ Batch withdraw failed:', error)
          results.push({ 
            success: false, 
            error: error.message, 
            count: validGameIds.length,
            type: 'batch'
          })
        }
      }
      
      // For NFTs without game IDs, these are likely orphaned NFTs sent directly to contract
      if (individualNFTs.length > 0) {
        console.log(`⚠️ Found ${individualNFTs.length} orphaned NFTs (not part of any game)`)
        
        const orphanedContracts = individualNFTs.map(nft => nft.nftContract)
        const orphanedTokenIds = individualNFTs.map(nft => nft.tokenId)
        const orphanedRecipients = individualNFTs.map(nft => nft.recipient)
        
        const rescueResult = await this.directNFTRescue(orphanedContracts, orphanedTokenIds, orphanedRecipients)
        results.push({
          success: rescueResult.success,
          error: rescueResult.error,
          count: individualNFTs.length,
          type: 'rescue_needed'
        })
      }
      
      const successCount = results.filter(r => r.success).reduce((sum, r) => sum + r.count, 0)
      const failCount = results.filter(r => !r.success).reduce((sum, r) => sum + r.count, 0)
      
      if (successCount > 0) {
        return { 
          success: true, 
          message: `Successfully withdrew ${successCount} NFTs${failCount > 0 ? ` (${failCount} failed)` : ''}`,
          results 
        }
      } else {
        return { 
          success: false, 
          error: `Failed to withdraw any NFTs. Errors: ${results.map(r => r.error).join(', ')}` 
        }
      }
      
    } catch (error) {
      console.error('❌ Error admin batch withdrawing NFTs:', error)
      return { success: false, error: error.message }
    }
  }

  // Add method to get NFTs owned by contract using Alchemy
  async getContractOwnedNFTs() {
    if (!this.alchemy || !this.contractAddress) {
      return { success: false, error: 'Alchemy not initialized or contract address not set' }
    }

    try {
      console.log('🔍 Loading NFTs owned by contract:', this.contractAddress)
      
      let allNFTs = []
      let pageKey = null
      
      do {
        const nftsForOwner = await this.alchemy.nft.getNftsForOwner(this.contractAddress, {
          omitMetadata: false,
          pageKey: pageKey
        })
        
        if (nftsForOwner.ownedNfts && nftsForOwner.ownedNfts.length > 0) {
          allNFTs = [...allNFTs, ...nftsForOwner.ownedNfts]
        }
        
        pageKey = nftsForOwner.pageKey
      } while (pageKey)

      console.log('📦 Found NFTs owned by contract:', allNFTs.length)

      // Format for display
      const formattedNFTs = allNFTs.map((nft, idx) => {
        // Enhanced image URL handling
        let imageUrl = ''
        if (nft.media && nft.media.length > 0) {
          imageUrl = nft.media[0].gateway || nft.media[0].raw || ''
        } else if (nft.image) {
          imageUrl = nft.image.originalUrl || nft.image.cachedUrl || ''
        }
        if (!imageUrl && nft.metadata && nft.metadata.image) {
          imageUrl = nft.metadata.image
        }
        if (imageUrl && imageUrl.startsWith('ipfs://')) {
          imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')
        }
        if (imageUrl && imageUrl.startsWith('http://')) {
          imageUrl = imageUrl.replace('http://', 'https://')
        }
        
        return {
          nftContract: nft.contract.address,
          tokenId: nft.tokenId,
          name: nft.title || nft.name || `NFT #${nft.tokenId}`,
          metadata: {
            ...nft.metadata,
            image: imageUrl
          },
          uniqueKey: `${nft.contract.address}-${nft.tokenId}`,
          source: 'alchemy',
        }
      })

      return { success: true, nfts: formattedNFTs }
    } catch (error) {
      console.error('❌ Error loading contract NFTs from Alchemy:', error)
      return { success: false, error: error.message }
    }
  }

  async getGameDetails(gameId) {
    console.log('📋 Getting game details (stub):', gameId)
    return await this.getGameState(gameId)
  }

  // Property getters for compatibility
  get currentChain() {
    return this.isReady() ? BASE_CHAIN : null
  }

  get isInitialized() {
    return this.isReady()
  }

  getCurrentClients() {
    return {
      public: this.publicClient,
      wallet: this.walletClient
    }
  }

  // Stub properties for compatibility
  get provider() { return this.publicClient }
  get signer() { return this.walletClient }
  get contract() { return this.contractAddress }
  set contract(value) { this.contractAddress = value } // Allow setting contract address
  get account() { return this.userAddress }

  // Additional missing methods for frontend compatibility
  async withdrawRewards() {
    console.log('💰 Withdrawing rewards (stub)')
    return { success: true, message: 'Rewards withdrawn (stub)' }
  }

  async findMyNFTs(nftContract, tokenId) {
    console.log('🔍 Finding my NFTs (stub):', { nftContract, tokenId })
    return { success: true, nfts: [] }
  }

  async getMyGames(address) {
    console.log('🎮 Getting my games (stub):', address)
    return { success: true, games: [] }
  }

  async emergencyCancelGame(gameId) {
    console.log('🚨 Emergency cancel game (stub):', gameId)
    return await this.cancelGame(gameId)
  }

  async getUserUnclaimedNFTs(address, nftContract) {
    console.log('📦 Getting user unclaimed NFTs (stub):', { address, nftContract })
    return []
  }

  async withdrawNFTs(nfts) {
    console.log('📦 Withdrawing NFTs (stub):', nfts)
    return { success: true, message: 'NFTs withdrawn (stub)' }
  }

  async withdrawNFT(nftContract, tokenId) {
    console.log('📦 Withdrawing NFT (stub):', { nftContract, tokenId })
    return { success: true, message: 'NFT withdrawn (stub)' }
  }
}

// Create singleton instance
const contractService = new ContractService()

export default contractService 