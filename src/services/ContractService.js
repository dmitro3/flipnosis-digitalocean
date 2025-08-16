import { ethers } from 'ethers'
import { createPublicClient, createWalletClient, custom, http } from 'viem'
import { base } from 'viem/chains'

const BASE_CHAIN = base

// Updated contract ABI for simplified contract
const CONTRACT_ABI = [
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
  {
    "inputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "name": "nftDeposits",
    "outputs": [{"internalType": "address", "name": "depositor", "type": "address"}, {"internalType": "address", "name": "nftContract", "type": "address"}, {"internalType": "uint256", "name": "tokenId", "type": "uint256"}, {"internalType": "bool", "name": "claimed", "type": "bool"}, {"internalType": "uint256", "name": "depositTime", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "name": "ethDeposits",
    "outputs": [{"internalType": "address", "name": "depositor", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}, {"internalType": "bool", "name": "claimed", "type": "bool"}, {"internalType": "uint256", "name": "depositTime", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
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
  {
    "inputs": [{"internalType": "bytes32[]", "name": "gameIds", "type": "bytes32[]"}, {"internalType": "address[]", "name": "recipients", "type": "address[]"}],
    "name": "adminBatchWithdrawNFTs",
    "outputs": [],
    "stateMutability": "nonpayable",
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
  }

  async initialize(walletClient, publicClient) {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected')
    }

    // Use the new contract address with admin functions
    this.contractAddress = '0x57841f045a343afD97452708bA316126A8EeAa27'

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

      console.log('✅ Contract service initialized:', {
        contractAddress: this.contractAddress,
        userAddress: this.userAddress,
        chain: BASE_CHAIN.name
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

  // Deposit NFT for a game
  async depositNFT(gameId, nftContract, tokenId) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('📦 Depositing NFT for game:', { gameId, nftContract, tokenId })
      
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      
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
        gas: gasEstimate
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
        chain: BASE_CHAIN
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
      
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'reclaimNFT',
        args: [gameIdBytes32],
        chain: BASE_CHAIN
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
        chain: BASE_CHAIN
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
      
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'emergencyWithdrawNFT',
        args: [gameIdBytes32, recipient],
        chain: BASE_CHAIN
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
      
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'emergencyWithdrawETH',
        args: [gameIdBytes32, recipient],
        chain: BASE_CHAIN
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
      
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'emergencyWithdrawUSDC',
        args: [gameIdBytes32, recipient],
        chain: BASE_CHAIN
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

  async adminBatchWithdrawNFTs(gameIds, recipients) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('📦 Admin batch withdrawing NFTs:', { gameIds, recipients })
      
      // Convert game IDs to bytes32
      const gameIdsBytes32 = gameIds.map(gameId => this.getGameIdBytes32(gameId))
      
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'adminBatchWithdrawNFTs',
        args: [gameIdsBytes32, recipients],
        chain: BASE_CHAIN
      })
      
      console.log('📦 Admin batch withdraw tx:', hash)
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      console.log('✅ Admin batch withdraw confirmed')

      return { success: true, transactionHash: hash, receipt }
    } catch (error) {
      console.error('❌ Error admin batch withdrawing NFTs:', error)
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
  get alchemy() { return null } // No Alchemy in new implementation

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