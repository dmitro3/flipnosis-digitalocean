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
  }
]

// ERC721 NFT ABI for approval
const NFT_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "from", "type": "address"}, {"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "transferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
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
      console.log('✅ Contract service initialized with address:', this.userAddress)
      return { success: true }
    } catch (error) {
      console.error('❌ Error initializing contract service:', error)
      return { success: false, error: error.message }
    }
  }

  isReady() {
    return this._initialized && this.walletClient && this.publicClient && this.userAddress
  }

  async ensureBaseNetwork() {
    const chainId = await this.walletClient.getChainId()
    if (chainId !== 8453) {
      throw new Error('Please switch to Base network')
    }
  }

  getGameIdBytes32(gameId) {
    // Convert string gameId to bytes32
    return ethers.encodeBytes32String(gameId.slice(0, 31))
  }

  // Approve NFT for transfer - FIXED VERSION
  async approveNFT(nftContract, tokenId) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('🔓 Approving NFT for transfer:', { nftContract, tokenId })
      
      // First check if we own the NFT
      const owner = await this.publicClient.readContract({
        address: nftContract,
        abi: NFT_ABI,
        functionName: 'ownerOf',
        args: [BigInt(tokenId)]
      })
      
      if (owner.toLowerCase() !== this.userAddress.toLowerCase()) {
        return { success: false, error: 'You do not own this NFT' }
      }
      
      // Approve the contract to transfer the NFT
      const hash = await this.walletClient.writeContract({
        address: nftContract,
        abi: NFT_ABI,
        functionName: 'approve',
        args: [this.contractAddress, BigInt(tokenId)], // Approve contract address, not tokenId
        chain: BASE_CHAIN,
        account: this.walletClient.account
      })

      console.log('🔓 NFT approval tx:', hash)
      
      const receipt = await this.publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 1,
        timeout: 60_000
      })
      
      console.log('✅ NFT approval confirmed')
      return { success: true, transactionHash: hash, receipt }
      
    } catch (error) {
      console.error('❌ Error approving NFT:', error)
      
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
      
      // Check if NFT is already deposited for this game
      const existingDeposit = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'nftDeposits',
        args: [gameIdBytes32]
      })
      
      if (existingDeposit[0] !== '0x0000000000000000000000000000000000000000') {
        console.log('⚠️ NFT already deposited for this game')
        return { success: true, alreadyDeposited: true, transactionHash: 'already-deposited' }
      }
      
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'depositNFT',
        args: [gameIdBytes32, nftContract, BigInt(tokenId)],
        chain: BASE_CHAIN,
        account: this.walletClient.account
      })
      
      console.log('📦 NFT deposit tx:', hash)
      
      const receipt = await this.publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 1,
        timeout: 60_000
      })
      
      console.log('✅ NFT deposit confirmed')
      
      // Verify the deposit was successful
      const verifyDeposit = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'nftDeposits',
        args: [gameIdBytes32]
      })
      
      if (verifyDeposit[0] === '0x0000000000000000000000000000000000000000') {
        throw new Error('NFT deposit verification failed')
      }
      
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

  // Deposit ETH for a game
  async depositETH(gameId, priceUSD) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('💰 Starting ETH deposit for game:', gameId, 'Price USD:', priceUSD)
      
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      
      // Get ETH price from Chainlink or use a fallback
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
      
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'depositETH',
        args: [gameIdBytes32],
        value: ethAmountWei,
        chain: BASE_CHAIN,
        account: this.walletClient.account
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

  // Get ETH price in USD (you'll need to implement this based on your oracle)
  async getETHPriceUSD() {
    // For now, return a hardcoded value or fetch from an API
    // In production, use Chainlink oracle or similar
    return 2500 // $2500 per ETH as fallback
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
}

// Export singleton instance
const contractService = new ContractService()
export default contractService