import { createPublicClient, createWalletClient, custom, parseEther } from 'viem'
import { base } from 'viem/chains'

// Contract configuration
const CONTRACT_CONFIG = {
  // Contract address on Base network
  address: "0xcc55c4599e3deb5ce07d972b7b298723efb93384",
  
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
    this.publicClient = null
    this.walletClient = null
  }

  // Initialize contract with clients
  async init(publicClient, walletClient) {
    if (!publicClient || !walletClient) {
      throw new Error('Both publicClient and walletClient are required')
    }
    
    this.publicClient = publicClient
    this.walletClient = walletClient

    // Verify we're on Base network
    const chainId = await this.publicClient.getChainId()
    if (chainId !== base.id) {
      throw new Error(`Please connect to Base network. Current chain ID: ${chainId}`)
    }

    console.log('Connected to Base network')

    // Check if contract is deployed
    const code = await this.publicClient.getBytecode({ address: CONTRACT_CONFIG.address })
    if (!code || code === '0x') {
      throw new Error(`No contract deployed at address ${CONTRACT_CONFIG.address}`)
    }

    console.log('Contract code found at address:', CONTRACT_CONFIG.address)
  }

  // Create a new flip game
  async createGame(nftContract, tokenId, priceUSD, totalRounds, acceptedPayment, authInfo = '') {
    try {
      if (!this.walletClient) {
        throw new Error('Contract not initialized with wallet client')
      }

      // First approve NFT transfer
      const nftAbi = [
        {
          name: 'approve',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'tokenId', type: 'uint256' }
          ],
          outputs: [{ type: 'bool' }]
        }
      ]

      const approveTx = await this.walletClient.writeContract({
        address: nftContract,
        abi: nftAbi,
        functionName: 'approve',
        args: [CONTRACT_CONFIG.address, tokenId]
      })

      // Wait for approval transaction
      await this.publicClient.waitForTransactionReceipt({ hash: approveTx })

      // Convert price to USD with 6 decimals (e.g., $1.50 = 1500000)
      const priceUSDFormatted = Math.floor(priceUSD * 1000000)

      // Create the game using CreateGameParams struct
      const hash = await this.walletClient.writeContract({
        address: CONTRACT_CONFIG.address,
        abi: CONTRACT_CONFIG.abi,
        functionName: 'createGame',
        args: [{
          nftContract,
          tokenId,
          priceUSD: priceUSDFormatted,
          acceptedToken: acceptedPayment,
          maxRounds: totalRounds,
          authInfo
        }]
      })

      // Wait for transaction
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      
      // Get the game ID from the event
      const gameCreatedEvent = receipt.logs.find(log => 
        log.topics[0] === '0x' + CONTRACT_CONFIG.abi.find(abi => abi.name === 'GameCreated')?.hash
      )
      const gameId = gameCreatedEvent?.topics[1]

      return {
        success: true,
        gameId: gameId?.toString(),
        transactionHash: hash
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
      const hash = await this.walletClient.writeContract({
        address: CONTRACT_CONFIG.address,
        abi: CONTRACT_CONFIG.abi,
        functionName: 'joinGame',
        args: [gameId, choice]
      })

      await this.publicClient.waitForTransactionReceipt({ hash })
      
      return {
        success: true,
        transactionHash: hash
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
      const hash = await this.walletClient.writeContract({
        address: CONTRACT_CONFIG.address,
        abi: CONTRACT_CONFIG.abi,
        functionName: 'startCountdown',
        args: [gameId]
      })

      await this.publicClient.waitForTransactionReceipt({ hash })
      
      return {
        success: true,
        transactionHash: hash
      }
    } catch (error) {
      console.error('Error starting countdown:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Perform a flip
  async flip(gameId, power) {
    try {
      const hash = await this.walletClient.writeContract({
        address: CONTRACT_CONFIG.address,
        abi: CONTRACT_CONFIG.abi,
        functionName: 'flip',
        args: [gameId, power]
      })

      await this.publicClient.waitForTransactionReceipt({ hash })
      
      return {
        success: true,
        transactionHash: hash
      }
    } catch (error) {
      console.error('Error performing flip:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Claim winnings
  async claimWinnings(gameId) {
    try {
      const hash = await this.walletClient.writeContract({
        address: CONTRACT_CONFIG.address,
        abi: CONTRACT_CONFIG.abi,
        functionName: 'claimWinnings',
        args: [gameId]
      })

      await this.publicClient.waitForTransactionReceipt({ hash })
      
      return {
        success: true,
        transactionHash: hash
      }
    } catch (error) {
      console.error('Error claiming winnings:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Cancel game
  async cancelGame(gameId) {
    try {
      const hash = await this.walletClient.writeContract({
        address: CONTRACT_CONFIG.address,
        abi: CONTRACT_CONFIG.abi,
        functionName: 'cancelGame',
        args: [gameId]
      })

      await this.publicClient.waitForTransactionReceipt({ hash })
      
      return {
        success: true,
        transactionHash: hash
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
      const games = await this.publicClient.readContract({
        address: CONTRACT_CONFIG.address,
        abi: CONTRACT_CONFIG.abi,
        functionName: 'getUserGames',
        args: [userAddress]
      })
      
      return {
        success: true,
        games: games.map(id => id.toString())
      }
    } catch (error) {
      console.error('Error getting user games:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Get game details
  async getGame(gameId) {
    try {
      const [basic, progress] = await Promise.all([
        this.publicClient.readContract({
          address: CONTRACT_CONFIG.address,
          abi: CONTRACT_CONFIG.abi,
          functionName: 'getGameBasic',
          args: [gameId]
        }),
        this.publicClient.readContract({
          address: CONTRACT_CONFIG.address,
          abi: CONTRACT_CONFIG.abi,
          functionName: 'getGameProgress',
          args: [gameId]
        })
      ])

      return {
        success: true,
        game: {
          ...basic,
          ...progress
        }
      }
    } catch (error) {
      console.error('Error getting game:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Get game round details
  async getGameRound(gameId, round) {
    try {
      const roundData = await this.publicClient.readContract({
        address: CONTRACT_CONFIG.address,
        abi: CONTRACT_CONFIG.abi,
        functionName: 'getGameRound',
        args: [gameId, round]
      })
      
      return {
        success: true,
        round: roundData
      }
    } catch (error) {
      console.error('Error getting game round:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

export const contractService = new ContractService()
export default contractService 