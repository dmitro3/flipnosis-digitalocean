import { ethers } from 'ethers'
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
  // Direct NFT transfer functions (bypass game system)
  {
    "inputs": [{"internalType": "address", "name": "nftContract", "type": "address"}, {"internalType": "uint256", "name": "tokenId", "type": "uint256"}, {"internalType": "address", "name": "recipient", "type": "address"}],
    "name": "directTransferNFT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address[]", "name": "nftContracts", "type": "address[]"}, {"internalType": "uint256[]", "name": "tokenIds", "type": "uint256[]"}, {"internalType": "address[]", "name": "recipients", "type": "address[]"}],
    "name": "directBatchTransferNFTs",
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
    this.contractAddress = '0x6cB1E31F2A3df57A7265ED2eE26dcF8D02CE1B69'
    this.walletClient = null
    this.publicClient = null
    this.userAddress = null
    this.alchemy = null
    this._initialized = false
  }

  async initialize(walletClient, publicClient) {
    // Prevent double initialization
    if (this._initialized && this.walletClient === walletClient) {
      console.log('⚡ Contract service already initialized')
      return { success: true }
    }

    if (!walletClient || !publicClient) {
      console.error('❌ Missing required clients')
      return { success: false, error: 'Wallet or public client missing' }
    }

    try {
      this.walletClient = walletClient
      this.publicClient = publicClient
      this.userAddress = walletClient.account?.address

      if (!this.userAddress) {
        throw new Error('No address found in wallet client')
      }

      // Initialize Alchemy for NFT operations
      const apiKey = import.meta.env.VITE_ALCHEMY_API_KEY || 'hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3'
      this.alchemy = new Alchemy({
        apiKey,
        network: Network.BASE_MAINNET
      })

      this._initialized = true
      console.log('✅ Contract service initialized:', {
        contractAddress: this.contractAddress,
        userAddress: this.userAddress,
        chain: BASE_CHAIN.name
      })

      return { success: true }
    } catch (error) {
      console.error('❌ Contract service initialization failed:', error)
      this._initialized = false
      return { success: false, error: error.message }
    }
  }

  isReady() {
    return this._initialized && this.walletClient && this.publicClient && this.contractAddress
  }

  async ensureBaseNetwork() {
    try {
      const chainId = await this.walletClient.getChainId()
      if (chainId !== BASE_CHAIN.id) {
        await this.walletClient.switchChain({ id: BASE_CHAIN.id })
      }
    } catch (error) {
      console.error('Network switch error:', error)
      throw error
    }
  }

  getGameIdBytes32(gameId) {
    return ethers.id(gameId)
  }

  // Get live ETH price from Chainlink oracle on Base
  async getETHPriceUSD() {
    try {
      // Chainlink ETH/USD price feed on Base
      const priceFeedAddress = '0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70'
      
      const priceData = await this.publicClient.readContract({
        address: priceFeedAddress,
        abi: [{
          "inputs": [],
          "name": "latestRoundData",
          "outputs": [
            {"internalType": "uint80", "name": "roundId", "type": "uint80"},
            {"internalType": "int256", "name": "price", "type": "int256"},
            {"internalType": "uint256", "name": "startedAt", "type": "uint256"},
            {"internalType": "uint256", "name": "updatedAt", "type": "uint256"},
            {"internalType": "uint80", "name": "answeredInRound", "type": "uint80"}
          ],
          "stateMutability": "view",
          "type": "function"
        }],
        functionName: 'latestRoundData'
      })
      
      // Chainlink returns price with 8 decimals
      const ethPriceUSD = Number(priceData[1]) / 1e8
      
      console.log('💰 Live ETH price from Chainlink:', ethPriceUSD)
      return ethPriceUSD
      
    } catch (error) {
      console.error('❌ Error fetching ETH price, using fallback:', error)
      // Fallback to reasonable current price if oracle fails
      return 4200 // Updated fallback from 3500
    }
  }

  // Approve NFT for deposit - SIMPLIFIED VERSION
  async approveNFT(nftContract, tokenId) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('🔓 Approving NFT:', { nftContract, tokenId })

      // Let wagmi handle ALL gas estimation automatically
      const hash = await this.walletClient.writeContract({
        address: nftContract,
        abi: NFT_ABI,
        functionName: 'approve',
        args: [this.contractAddress, BigInt(tokenId)],
        chain: BASE_CHAIN,
        account: this.walletClient.account
        // NO gas configuration - let wagmi handle it
      })

      console.log('🔓 NFT approval tx:', hash)
      
      // Wait for confirmation with timeout
      const receipt = await this.publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 1,
        timeout: 60_000 // 60 second timeout
      })
      
      console.log('✅ NFT approval confirmed')
      return { success: true, transactionHash: hash, receipt }
      
    } catch (error) {
      console.error('❌ Error approving NFT:', error)
      
      // Better error messages
      if (error.message?.includes('User rejected')) {
        return { success: false, error: 'Transaction cancelled by user' }
      }
      if (error.message?.includes('insufficient funds')) {
        return { success: false, error: 'Insufficient funds for gas' }
      }
      
      return { success: false, error: error.shortMessage || error.message }
    }
  }

  // Deposit NFT for a game - SIMPLIFIED VERSION
  async depositNFT(gameId, nftContract, tokenId) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('📦 Depositing NFT for game:', { gameId, nftContract, tokenId })
      
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      
      // Let wagmi handle ALL gas estimation automatically
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'depositNFT',
        args: [gameIdBytes32, nftContract, BigInt(tokenId)],
        chain: BASE_CHAIN,
        account: this.walletClient.account
        // NO gas configuration - let wagmi handle it
      })
      
      console.log('📦 NFT deposit tx:', hash)
      
      const receipt = await this.publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 1,
        timeout: 60_000
      })
      
      console.log('✅ NFT deposit confirmed')
      return { success: true, transactionHash: hash, receipt }
      
    } catch (error) {
      console.error('❌ Error depositing NFT:', error)
      
      if (error.message?.includes('NFT already deposited')) {
        return { success: false, error: 'NFT already deposited for this game' }
      }
      if (error.message?.includes('User rejected')) {
        return { success: false, error: 'Transaction cancelled by user' }
      }
      
      return { success: false, error: error.shortMessage || error.message }
    }
  }

  // Deposit ETH for a game - SIMPLIFIED VERSION
  async depositETH(gameId, priceUSD) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('💰 Starting ETH deposit for game:', gameId, 'Price USD:', priceUSD)
      
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      
      // Convert USD price to ETH with live price from Chainlink
      const ethPriceUSD = await this.getETHPriceUSD()
      const ethAmount = parseFloat(priceUSD) / ethPriceUSD
      
      // Round to 6 decimal places to avoid precision issues
      const ethAmountRounded = Math.round(ethAmount * 1000000) / 1000000
      const ethAmountWei = ethers.parseEther(ethAmountRounded.toString())
      
      console.log('💰 Deposit details:', {
        priceUSD,
        ethPriceUSD,
        ethAmount,
        ethAmountRounded,
        ethAmountWei: ethAmountWei.toString(),
        gameIdBytes32
      })
      
      // Let wagmi handle ALL gas estimation automatically
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'depositETH',
        args: [gameIdBytes32],
        value: ethAmountWei,
        chain: BASE_CHAIN,
        account: this.walletClient.account
        // NO gas configuration - let wagmi handle it
      })
      
      console.log('💰 ETH deposit tx:', hash)
      
      const receipt = await this.publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 1,
        timeout: 60_000
      })
      
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
      if (error.message?.includes('User rejected')) {
        return { success: false, error: 'Transaction cancelled by user' }
      }
      
      return { success: false, error: error.shortMessage || error.message }
    }
  }

  // Create game - approve and deposit NFT
  async createGame(gameId, nftContract, tokenId, priceInMicrodollars, paymentType = 0) {
    console.log('🎮 Creating game (approve + deposit NFT):', {
      gameId,
      nftContract,
      tokenId,
      priceInMicrodollars,
      paymentType
    })
    
    try {
      // First approve the NFT
      const approvalResult = await this.approveNFT(nftContract, tokenId)
      if (!approvalResult.success) {
        return approvalResult
      }
      
      // Then deposit the NFT
      const depositResult = await this.depositNFT(gameId, nftContract, tokenId)
      return depositResult
      
    } catch (error) {
      console.error('❌ Error creating game:', error)
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
      
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'reclaimNFT',
        args: [gameIdBytes32],
        chain: BASE_CHAIN,
        account: this.walletClient.account
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
      
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'reclaimCrypto',
        args: [gameIdBytes32],
        chain: BASE_CHAIN,
        account: this.walletClient.account
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

  // Legacy method for compatibility
  async cancelGame(gameId) {
    console.log('🔄 Canceling game:', gameId)
    const nftResult = await this.reclaimNFT(gameId)
    if (!nftResult.success) {
      return await this.reclaimCrypto(gameId)
    }
    return nftResult
  }

  // Admin methods
  async emergencyWithdrawNFT(gameId, recipient) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('🚨 Emergency withdrawing NFT for game:', gameId, 'to recipient:', recipient)
      
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      
      // Check if NFT deposit exists and is valid
      try {
        const nftDepositData = await this.publicClient.readContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'nftDeposits',
          args: [gameIdBytes32]
        })
        console.log('🔍 NFT deposit data for game:', {
          gameId,
          gameIdBytes32,
          depositData: nftDepositData
        })
        
        // Parse the deposit data to understand the issue
        if (nftDepositData && Array.isArray(nftDepositData) && nftDepositData.length >= 4) {
          const [depositor, nftContract, tokenId, claimed] = nftDepositData
          console.log('🔍 Parsed NFT deposit details:', {
            depositor,
            nftContract,
            tokenId: tokenId?.toString(),
            claimed,
            depositorIsZero: depositor === '0x0000000000000000000000000000000000000000',
            alreadyClaimed: claimed === true
          })
          
          if (depositor === '0x0000000000000000000000000000000000000000') {
            console.error('❌ NFT deposit not found: depositor is zero address')
            return { success: false, error: 'NFT deposit not found in contract' }
          }
          
          if (claimed === true) {
            console.error('❌ NFT already claimed: cannot withdraw again')
            return { success: false, error: 'NFT already claimed/withdrawn' }
          }
        }
      } catch (e) {
        console.warn('⚠️ Could not read NFT deposit data:', e.message)
      }
      
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'emergencyWithdrawNFT',
        args: [gameIdBytes32, recipient],
        chain: BASE_CHAIN,
        account: this.walletClient.account,
        gas: 150000n  // Set reasonable gas limit slightly higher for emergency withdraw
      })
      
      console.log('🚨 Emergency NFT withdraw tx:', hash)
      const receipt = await this.publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 1,
        timeout: 60_000
      })
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
      
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'emergencyWithdrawETH',
        args: [gameIdBytes32, recipient],
        chain: BASE_CHAIN,
        account: this.walletClient.account
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

  async adminBatchWithdrawNFTs(nftContracts, tokenIds, recipients) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('📦 Using DIRECT NFT transfer (bypasses game system):', { nftContracts, tokenIds, recipients })
      
      // BULLETPROOF APPROACH: Use direct NFT transfer that bypasses the game system entirely
      // This works for ANY NFT owned by the contract, regardless of game state
      
      if (nftContracts.length === 1) {
        // Single NFT - use directTransferNFT
        console.log('📦 Transferring single NFT directly...')
        
        const hash = await this.walletClient.writeContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'directTransferNFT',
          args: [nftContracts[0], BigInt(tokenIds[0]), recipients[0]],
          chain: BASE_CHAIN,
          account: this.walletClient.account,
          gas: 150000n
        })
        
        const receipt = await this.publicClient.waitForTransactionReceipt({ 
          hash,
          confirmations: 1,
          timeout: 60_000
        })
        
        console.log('✅ Direct NFT transfer successful:', hash)
        return { 
          success: true, 
          transactionHash: hash,
          message: `Successfully transferred NFT ${nftContracts[0]}:${tokenIds[0]} with low gas fees`
        }
        
      } else {
        // Multiple NFTs - use directBatchTransferNFTs
        console.log('📦 Transferring multiple NFTs directly...')
        
        const hash = await this.walletClient.writeContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'directBatchTransferNFTs',
          args: [nftContracts, tokenIds.map(id => BigInt(id)), recipients],
          chain: BASE_CHAIN,
          account: this.walletClient.account,
          gas: 200000n
        })
        
        const receipt = await this.publicClient.waitForTransactionReceipt({ 
          hash,
          confirmations: 1,
          timeout: 60_000
        })
        
        console.log('✅ Direct batch NFT transfer successful:', hash)
        return { 
          success: true, 
          transactionHash: hash,
          message: `Successfully transferred ${nftContracts.length} NFTs with low gas fees`
        }
      }
      
    } catch (error) {
      console.error('❌ Error in direct NFT transfer:', error)
      return { success: false, error: error.message }
    }
  }

  // Helper method to find game IDs
  async findGameIdsOptimized(nftContracts, tokenIds) {
    const gameIds = []
    
    try {
      const response = await fetch('/api/admin/games')
      if (!response.ok) {
        console.warn('Could not fetch games from database')
        return []
      }
      
      const data = await response.json()
      const games = data.games || []
      
      console.log(`🔍 Searching ${games.length} games for NFT matches...`)
      
      for (let i = 0; i < nftContracts.length; i++) {
        const targetContract = nftContracts[i].toLowerCase()
        const targetTokenId = tokenIds[i].toString()
        
        let foundGameId = null
        
        for (const game of games) {
          if (game.nft_token_id && game.nft_token_id.toString() === targetTokenId) {
            if (!game.nft_contract || game.nft_contract.toLowerCase() === targetContract) {
              foundGameId = game.id.toString()
              console.log(`✅ Found NFT ${targetContract}:${targetTokenId} in game ${foundGameId}`)
              break
            }
          }
        }
        
        gameIds.push(foundGameId)
        
        if (!foundGameId) {
          console.warn(`⚠️ Could not find game ID for NFT ${targetContract}:${targetTokenId}`)
        }
      }
      
      return gameIds
    } catch (error) {
      console.error('❌ Error finding game IDs:', error)
      return []
    }
  }

  // Get NFTs owned by contract using Alchemy
  async getContractOwnedNFTs() {
    if (!this.alchemy || !this.contractAddress) {
      return { success: false, error: 'Alchemy not initialized' }
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

      const formattedNFTs = allNFTs.map((nft) => {
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
      console.error('❌ Error loading contract NFTs:', error)
      return { success: false, error: error.message }
    }
  }

  // Stub methods for compatibility
  async getListingFee() {
    return { success: true, fee: 0 }
  }

  async getPlatformFee() {
    return { success: true, fee: 3.5 }
  }

  async getGameDetails(gameId) {
    return await this.getGameState(gameId)
  }

  // Property getters for compatibility
  get currentChain() {
    return this.isReady() ? BASE_CHAIN : null
  }

  get isInitialized() {
    return this._initialized
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
  set contract(value) { this.contractAddress = value }
  get account() { return this.userAddress }
}

// Create singleton instance
const contractService = new ContractService()

export default contractService