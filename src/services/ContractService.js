import { ethers } from 'ethers'

// Contract configuration
const CONTRACT_CONFIG = {
  // Contract address on Base network
  address: "0xcc55c4599e3deb5ce07d972b7b298723efb93384",
  
  // Base network configuration
  chainId: 8453,
  rpcUrl: "https://mainnet.base.org",
  
  // Contract ABI (exact function signatures from contract)
  abi: [
    // Core game functions
    "function createGame(tuple(address nftContract, uint256 tokenId, uint256 priceUSD, uint8 acceptedToken, uint8 maxRounds, string authInfo) params) external returns (uint256)",
    "function joinGame(uint256 gameId, uint8 choice) external",
    "function startCountdown(uint256 gameId) external",
    "function flip(uint256 gameId, uint8 power) external",
    "function cancelGame(uint256 gameId) external",
    "function claimWinnings(uint256 gameId) external",
    
    // View functions
    "function getUserGames(address user) external view returns (uint256[])",
    "function getGameBasic(uint256 gameId) external view returns (uint256 gameId, address creator, address joiner, address nftContract, uint256 tokenId, uint256 priceUSD, uint8 acceptedToken, uint8 state, string memory authInfo)",
    "function getGameProgress(uint256 gameId) external view returns (uint256 createdAt, uint256 expiresAt, uint8 maxRounds, uint8 currentRound, uint8 creatorWins, uint8 joinerWins, address winner, uint256 lastActionTime, uint256 countdownEndTime)",
    "function getGameRound(uint256 gameId, uint8 round) external view returns (uint8 result, uint8 power, bool completed, address flipper)",
    
    // Emergency functions
    "function emergencyWithdraw(address token, uint256 amount) external",
    "function emergencyWithdrawNFT(address nftContract, uint256 tokenId) external",
    
    // Events
    "event GameCreated(uint256 indexed gameId, address indexed creator, address indexed nftContract, uint256 tokenId, uint256 priceUSD, uint8 acceptedToken, string authInfo)",
    "event GameJoined(uint256 indexed gameId, address indexed joiner, uint8 choice)",
    "event FlipResultEvent(uint256 indexed gameId, uint8 round, uint8 result, uint8 power, address flipper)",
    "event GameCompleted(uint256 indexed gameId, address indexed winner, uint256 winnings, uint256 platformFee)",
    "event TurnStarted(uint256 indexed gameId, uint8 round, address flipper)",
    "event CountdownStarted(uint256 indexed gameId, uint8 round, uint256 endTime)",
    "event GameCancelled(uint256 indexed gameId, address indexed creator)",
    "event WinningsClaimed(uint256 indexed gameId, address indexed winner, uint256 winnings, uint256 platformFee)"
  ]
}

// Payment token enum (matching contract)
export const PaymentToken = {
  ETH: 0,
  USDC: 1,
  NATIVE: 2
}

// Game state enum (matching contract)
export const GameState = {
  Created: 0,
  Joined: 1,
  InProgress: 2,
  Completed: 3,
  Expired: 4,
  Cancelled: 5
}

// Coin side enum (matching contract)
export const CoinSide = {
  HEADS: 0,
  TAILS: 1
}

class ContractService {
  constructor() {
    this.contract = null
    this.provider = null
    this.signer = null
  }

  // Initialize contract with provider
  async init(provider) {
    if (!provider) {
      throw new Error('Provider is required')
    }
    
    this.provider = provider
    this.signer = await provider.getSigner()
    
    if (!this.signer) {
      throw new Error('Failed to get signer from provider')
    }

    // Get network info
    const network = await provider.getNetwork()
    console.log('Connected to network:', network)

    // Verify we're on Base network (either mainnet or testnet)
    const baseChainIds = [8453, 84531] // Base mainnet and testnet
    if (!baseChainIds.includes(Number(network.chainId))) {
      throw new Error(`Please connect to Base network. Current network: ${network.name} (Chain ID: ${network.chainId})`)
    }

    console.log('Connected to Base network:', network.name)

    // Check if contract is deployed
    const code = await provider.getCode(CONTRACT_CONFIG.address)
    if (code === '0x' || code === '') {
      throw new Error(`No contract deployed at address ${CONTRACT_CONFIG.address} on ${network.name}`)
    }

    console.log('Contract code found at address:', CONTRACT_CONFIG.address)

    // Initialize contract
    this.contract = new ethers.Contract(
      CONTRACT_CONFIG.address,
      CONTRACT_CONFIG.abi,
      this.signer
    )

    console.log('Contract initialized successfully')
  }

  // Create a new flip game
  async createGame(nftContract, tokenId, priceUSD, totalRounds, acceptedPayment, authInfo = '') {
    try {
      if (!this.signer) {
        throw new Error('Contract not initialized with signer')
      }

      // First approve NFT transfer
      const nftContractInstance = new ethers.Contract(
        nftContract,
        ["function approve(address to, uint256 tokenId) external"],
        this.signer
      )
      
      const approveTx = await nftContractInstance.approve(CONTRACT_CONFIG.address, tokenId)
      await approveTx.wait()

      // Convert price to USD with 6 decimals (e.g., $1.50 = 1500000)
      const priceUSDFormatted = Math.floor(priceUSD * 1000000)

      // Create the game using CreateGameParams struct
      const tx = await this.contract.createGame({
        nftContract,
        tokenId,
        priceUSD: priceUSDFormatted,
        acceptedToken: acceptedPayment,
        maxRounds: totalRounds,
        authInfo
      })

      const receipt = await tx.wait()
      
      // Get the game ID from the event
      const gameCreatedEvent = receipt.events?.find(e => e.event === 'GameCreated')
      const gameId = gameCreatedEvent?.args?.gameId

      return {
        success: true,
        gameId: gameId?.toString(),
        transactionHash: tx.hash
      }
    } catch (error) {
      console.error('Error creating game:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Join a game
  async joinGame(gameId, choice) {
    try {
      const tx = await this.contract.joinGame(gameId, choice)
      await tx.wait()
      
      return {
        success: true,
        transactionHash: tx.hash
      }
    } catch (error) {
      console.error('Error joining game:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Start countdown for a flip
  async startCountdown(gameId) {
    try {
      const tx = await this.contract.startCountdown(gameId)
      await tx.wait()
      
      return {
        success: true,
        transactionHash: tx.hash
      }
    } catch (error) {
      console.error('Error starting countdown:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Execute a flip with power
  async flip(gameId, power) {
    try {
      const tx = await this.contract.flip(gameId, power)
      await tx.wait()
      
      return {
        success: true,
        transactionHash: tx.hash
      }
    } catch (error) {
      console.error('Error executing flip:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Claim winnings
  async claimWinnings(gameId) {
    try {
      const tx = await this.contract.claimWinnings(gameId)
      const receipt = await tx.wait()
      
      // Get the claim event
      const claimEvent = receipt.events?.find(e => e.event === 'WinningsClaimed')
      
      return {
        success: true,
        transactionHash: tx.hash,
        winnings: claimEvent?.args?.winnings.toString(),
        platformFee: claimEvent?.args?.platformFee.toString()
      }
    } catch (error) {
      console.error('Error claiming winnings:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Cancel a game
  async cancelGame(gameId) {
    try {
      const tx = await this.contract.cancelGame(gameId)
      await tx.wait()
      
      return {
        success: true,
        transactionHash: tx.hash
      }
    } catch (error) {
      console.error('Error cancelling game:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Get user's games
  async getUserGames(userAddress) {
    try {
      const games = await this.contract.getUserGames(userAddress)
      return games.map(id => id.toString())
    } catch (error) {
      console.error('Error getting user games:', error)
      return []
    }
  }

  // Get game details
  async getGame(gameId) {
    try {
      const [basic, progress] = await Promise.all([
        this.contract.getGameBasic(gameId),
        this.contract.getGameProgress(gameId)
      ])
      
      return {
        gameId: basic.gameId.toString(),
        creator: basic.creator,
        joiner: basic.joiner,
        nftContract: basic.nftContract,
        tokenId: basic.tokenId.toString(),
        priceUSD: basic.priceUSD.toString(),
        acceptedToken: basic.acceptedToken,
        state: basic.state,
        authInfo: basic.authInfo,
        createdAt: progress.createdAt.toString(),
        expiresAt: progress.expiresAt.toString(),
        maxRounds: progress.maxRounds,
        currentRound: progress.currentRound,
        creatorWins: progress.creatorWins,
        joinerWins: progress.joinerWins,
        winner: progress.winner,
        lastActionTime: progress.lastActionTime.toString(),
        countdownEndTime: progress.countdownEndTime.toString()
      }
    } catch (error) {
      console.error('Error getting game:', error)
      return null
    }
  }

  // Get round details
  async getGameRound(gameId, round) {
    try {
      const roundData = await this.contract.getGameRound(gameId, round)
      return {
        result: roundData.result,
        power: roundData.power,
        completed: roundData.completed,
        flipper: roundData.flipper
      }
    } catch (error) {
      console.error('Error getting game round:', error)
      return null
    }
  }

  // Subscribe to contract events
  subscribeToEvents(callbacks) {
    if (!this.contract) {
      throw new Error('Contract not initialized')
    }

    const filters = {
      gameCreated: this.contract.filters.GameCreated(),
      gameJoined: this.contract.filters.GameJoined(),
      flipResult: this.contract.filters.FlipResultEvent(),
      gameCompleted: this.contract.filters.GameCompleted(),
      turnStarted: this.contract.filters.TurnStarted(),
      countdownStarted: this.contract.filters.CountdownStarted(),
      gameCancelled: this.contract.filters.GameCancelled(),
      winningsClaimed: this.contract.filters.WinningsClaimed()
    }

    const subscriptions = {}

    // Subscribe to each event
    Object.entries(filters).forEach(([eventName, filter]) => {
      if (callbacks[eventName]) {
        subscriptions[eventName] = this.contract.on(filter, (...args) => {
          callbacks[eventName](...args)
        })
      }
    })

    return subscriptions
  }

  // Unsubscribe from all events
  unsubscribeFromEvents(subscriptions) {
    if (!subscriptions) return

    Object.values(subscriptions).forEach(subscription => {
      subscription.removeAllListeners()
    })
  }
}

// Create and export a singleton instance
export const contractService = new ContractService()

// Also export the class for testing purposes
export { ContractService } 