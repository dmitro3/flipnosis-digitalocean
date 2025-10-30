const ethers = require('ethers')

class BlockchainService {
  constructor(rpcUrl, contractAddress, contractOwnerKey) {
    this.rpcUrl = rpcUrl
    this.contractAddress = contractAddress
    this.contractOwnerKey = contractOwnerKey
    
    try {
      this.provider = new ethers.JsonRpcProvider(rpcUrl)
      this.contractOwnerWallet = contractOwnerKey ? new ethers.Wallet(contractOwnerKey, this.provider) : null
    } catch (error) {
      console.error('❌ Error initializing blockchain service:', error.message)
      this.provider = null
      this.contractOwnerWallet = null
    }
    
    // Updated ABI for simplified contract + Battle Royale
    this.CONTRACT_ABI = [
      "function depositNFT(bytes32 gameId, address nftContract, uint256 tokenId)",
      "function depositETH(bytes32 gameId) payable",
      "function depositUSDC(bytes32 gameId, uint256 amount)",
      "function completeGame(bytes32 gameId, address winner)",
      "function isGameReady(bytes32 gameId) view returns (bool)",
      "function getGameParticipants(bytes32 gameId) view returns (address nftPlayer, address cryptoPlayer)",
      "function reclaimNFT(bytes32 gameId)",
      "function reclaimCrypto(bytes32 gameId)",
      "function nftDeposits(bytes32) view returns (address depositor, address nftContract, uint256 tokenId, bool claimed, uint256 depositTime)",
      "function ethDeposits(bytes32) view returns (address depositor, uint256 amount, bool claimed, uint256 depositTime)",
      "function usdcDeposits(bytes32) view returns (address depositor, uint256 amount, bool claimed, uint256 depositTime)",
      "function gameResults(bytes32) view returns (address winner, bool completed, uint256 completionTime)",
      // Battle Royale
      "function createBattleRoyale(bytes32 gameId, address nftContract, uint256 tokenId, uint256 entryFee, uint256 serviceFee, bool isUnder20, uint256 minUnder20Wei)",
      "function joinBattleRoyale(bytes32 gameId) payable",
      "function completeBattleRoyale(bytes32 gameId, address winner)",
      "function completeBattleRoyaleEarly(bytes32 gameId, address winner)",
      "function withdrawCreatorFunds(bytes32 gameId)",
      "function withdrawWinnerNFT(bytes32 gameId)",
      "function getBattleRoyaleGame(bytes32 gameId) view returns (tuple(address creator,address nftContract,uint256 tokenId,uint256 entryFee,uint256 serviceFee,uint8 maxPlayers,uint8 currentPlayers,address winner,bool completed,bool creatorPaid,bool nftClaimed,uint256 totalPool,uint256 createdAt,bool isUnder20,uint256 minUnder20Wei))",
      "function battleRoyaleEntries(bytes32 gameId, address player) view returns (bool)",
      "event NFTDeposited(bytes32 indexed gameId, address indexed depositor, address nftContract, uint256 tokenId)",
      "event ETHDeposited(bytes32 indexed gameId, address indexed depositor, uint256 amount)",
      "event USDCDeposited(bytes32 indexed gameId, address indexed depositor, uint256 amount)",
      "event GameReady(bytes32 indexed gameId, address nftDepositor, address cryptoDepositor)",
      "event GameCompleted(bytes32 indexed gameId, address indexed winner)"
    ]
  }

  hasOwnerWallet() {
    return !!this.contractOwnerWallet
  }

  /**
   * Check if game is ready (both assets deposited)
   */
  async isGameReady(gameId) {
    if (!this.contractOwnerWallet) return { success: false, error: 'Contract wallet not configured' }
    
    try {
      const contract = new ethers.Contract(this.contractAddress, this.CONTRACT_ABI, this.contractOwnerWallet)
      const gameIdBytes32 = ethers.id(gameId)
      
      const isReady = await contract.isGameReady(gameIdBytes32)
      console.log(`🎮 Game ${gameId} ready status:`, isReady)
      
      return { success: true, isReady }
    } catch (error) {
      console.warn('⚠️ Error checking game ready status (this is often due to contract state sync issues):', error.message)
      // Return a more graceful response - don't treat this as a complete failure
      return { success: false, error: error.message, isReady: false, verificationFailed: true }
    }
  }

  /**
   * Get game participants
   */
  async getGameParticipants(gameId) {
    if (!this.contractOwnerWallet) return { success: false, error: 'Contract wallet not configured' }
    
    try {
      const contract = new ethers.Contract(this.contractAddress, this.CONTRACT_ABI, this.contractOwnerWallet)
      const gameIdBytes32 = ethers.id(gameId)
      
      const [nftPlayer, cryptoPlayer] = await contract.getGameParticipants(gameIdBytes32)
      console.log(`🎮 Game ${gameId} participants:`, { nftPlayer, cryptoPlayer })
      
      return { success: true, nftPlayer, cryptoPlayer }
    } catch (error) {
      console.error('❌ Error getting game participants:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get detailed game state
   */
  async getGameState(gameId) {
    if (!this.contractOwnerWallet) return { success: false, error: 'Contract wallet not configured' }
    
    try {
      const contract = new ethers.Contract(this.contractAddress, this.CONTRACT_ABI, this.contractOwnerWallet)
      const gameIdBytes32 = ethers.id(gameId)
      
      // Get all deposit info
      const nftDeposit = await contract.nftDeposits(gameIdBytes32)
      const ethDeposit = await contract.ethDeposits(gameIdBytes32)
      const usdcDeposit = await contract.usdcDeposits(gameIdBytes32)
      const gameResult = await contract.gameResults(gameIdBytes32)
      
      const gameState = {
        nftDeposit: {
          depositor: nftDeposit.depositor,
          nftContract: nftDeposit.nftContract,
          tokenId: nftDeposit.tokenId.toString(),
          claimed: nftDeposit.claimed,
          depositTime: nftDeposit.depositTime.toString(),
          hasDeposit: nftDeposit.depositor !== '0x0000000000000000000000000000000000000000'
        },
        ethDeposit: {
          depositor: ethDeposit.depositor,
          amount: ethDeposit.amount.toString(),
          claimed: ethDeposit.claimed,
          depositTime: ethDeposit.depositTime.toString(),
          hasDeposit: ethDeposit.depositor !== '0x0000000000000000000000000000000000000000'
        },
        usdcDeposit: {
          depositor: usdcDeposit.depositor,
          amount: usdcDeposit.amount.toString(),
          claimed: usdcDeposit.claimed,
          depositTime: usdcDeposit.depositTime.toString(),
          hasDeposit: usdcDeposit.depositor !== '0x0000000000000000000000000000000000000000'
        },
        gameResult: {
          winner: gameResult.winner,
          completed: gameResult.completed,
          completionTime: gameResult.completionTime.toString()
        },
        isReady: false
      }
      
      // Check if game is ready
      gameState.isReady = gameState.nftDeposit.hasDeposit && 
                         (gameState.ethDeposit.hasDeposit || gameState.usdcDeposit.hasDeposit) &&
                         !gameState.gameResult.completed
      
      console.log(`🎮 Game ${gameId} full state:`, gameState)
      return { success: true, gameState }
    } catch (error) {
      console.error('❌ Error getting game state:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Complete game and declare winner (called by backend)
   */
  async completeGameOnChain(gameId, winner) {
    console.log('🏆 Completing game on blockchain:', { gameId, winner })
    
    if (!this.contractOwnerWallet) {
      console.error('❌ Contract owner wallet not configured')
      return { success: false, error: 'Contract wallet not configured' }
    }
    
    try {
      const contract = new ethers.Contract(this.contractAddress, this.CONTRACT_ABI, this.contractOwnerWallet)
      const gameIdBytes32 = ethers.id(gameId)
      
      // Verify game is ready before completing
      const isReady = await contract.isGameReady(gameIdBytes32)
      if (!isReady) {
        return { success: false, error: 'Game is not ready to complete' }
      }
      
      // Get participants to verify winner
      const [nftPlayer, cryptoPlayer] = await contract.getGameParticipants(gameIdBytes32)
      if (winner !== nftPlayer && winner !== cryptoPlayer) {
        return { success: false, error: 'Winner must be one of the game participants' }
      }
      
      console.log('🏆 Calling completeGame:', {
        gameIdBytes32,
        winner,
        participants: { nftPlayer, cryptoPlayer }
      })
      
      const tx = await contract.completeGame(gameIdBytes32, winner)
      
      console.log('⏳ Waiting for transaction confirmation:', tx.hash)
      await tx.wait()
      console.log('✅ Game completed on chain')
      return { success: true, transactionHash: tx.hash }
    } catch (error) {
      console.error('❌ Failed to complete game on chain:', error)
      return { success: false, error: error.message || 'Blockchain transaction failed' }
    }
  }

  // (Reverted) No server-side auto-create; creation occurs via frontend wallet

  /**
   * Complete Battle Royale (owner-only) and set winner
   * Automatically chooses the correct function based on player count
   */
  async completeBattleRoyaleOnChain(gameId, winner) {
    console.log('🏆 Completing Battle Royale on blockchain:', { gameId, winner })
    if (!this.contractOwnerWallet) {
      return { success: false, error: 'Contract wallet not configured' }
    }

    try {
      const contract = new ethers.Contract(this.contractAddress, this.CONTRACT_ABI, this.contractOwnerWallet)
      const gameIdBytes32 = ethers.id(gameId)

      // Get game state to check player count
      console.log('🔍 Checking game state to determine completion method...')
      const brGame = await contract.getBattleRoyaleGame(gameIdBytes32)
      
      if (!brGame || brGame.creator === ethers.ZeroAddress) {
        return { success: false, error: 'Battle Royale game does not exist' }
      }

      const currentPlayers = Number(brGame.currentPlayers)
      const maxPlayers = Number(brGame.maxPlayers)
      
      console.log(`📊 Game state: ${currentPlayers}/${maxPlayers} players`)

      // Verify winner is a participant
      const isParticipant = await contract.battleRoyaleEntries(gameIdBytes32, winner)
      if (!isParticipant) {
        return { success: false, error: 'Winner must be a game participant' }
      }

      // Choose the right completion function based on player count
      let tx
      let methodUsed

      if (currentPlayers === maxPlayers) {
        // Full game - use completeBattleRoyale
        console.log(`✅ Using completeBattleRoyale (full game with ${currentPlayers} players)`)
        methodUsed = 'completeBattleRoyale'
        tx = await contract.completeBattleRoyale(gameIdBytes32, winner)
      } else if (currentPlayers >= 2 && currentPlayers < maxPlayers) {
        // Partial game - use completeBattleRoyaleEarly
        console.log(`✅ Using completeBattleRoyaleEarly (partial game with ${currentPlayers} players)`)
        methodUsed = 'completeBattleRoyaleEarly'
        tx = await contract.completeBattleRoyaleEarly(gameIdBytes32, winner)
      } else {
        return { 
          success: false, 
          error: `Game cannot be completed: must have at least 2 players (currently ${currentPlayers})` 
        }
      }

      console.log(`⏳ Waiting for transaction confirmation: ${tx.hash}`)
      const receipt = await tx.wait()
      console.log(`✅ Game completed on-chain! Block: ${receipt.blockNumber}, Method: ${methodUsed}`)
      
      return { 
        success: true, 
        transactionHash: tx.hash, 
        blockNumber: receipt.blockNumber,
        methodUsed: methodUsed,
        playerCount: currentPlayers
      }
    } catch (error) {
      console.error('❌ Failed to complete Battle Royale on chain:', error)
      
      // Provide more helpful error messages
      let errorMessage = error.message || 'Blockchain transaction failed'
      if (error.reason) {
        errorMessage = error.reason
      } else if (error.error?.message) {
        errorMessage = error.error.message
      }
      
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Get Battle Royale game state from contract
   */
  async getBattleRoyaleGameState(gameId) {
    console.log('🔍 [BLOCKCHAIN] getBattleRoyaleGameState called for:', gameId)
    
    if (!this.provider) {
      console.error('❌ [BLOCKCHAIN] Provider not initialized')
      return { success: false, error: 'Provider not initialized' }
    }

    try {
      const contract = new ethers.Contract(this.contractAddress, this.CONTRACT_ABI, this.provider)
      const gameIdBytes32 = ethers.id(gameId)
      
      console.log('🔍 [BLOCKCHAIN] Converted gameId to bytes32:', {
        original: gameId,
        bytes32: gameIdBytes32,
        contractAddress: this.contractAddress
      })

      console.log('🔍 [BLOCKCHAIN] Calling contract.getBattleRoyaleGame...')
      const game = await contract.getBattleRoyaleGame(gameIdBytes32)
      
      console.log('🔍 [BLOCKCHAIN] Contract returned:', {
        creator: game.creator,
        nftContract: game.nftContract,
        tokenId: game.tokenId?.toString(),
        winner: game.winner,
        completed: game.completed,
        nftClaimed: game.nftClaimed,
        creatorPaid: game.creatorPaid,
        currentPlayers: game.currentPlayers?.toString(),
        totalPool: game.totalPool?.toString()
      })
      
      if (game.creator === ethers.ZeroAddress) {
        console.error('❌ [BLOCKCHAIN] Game does not exist - creator is zero address')
        return { success: false, error: 'Game does not exist on-chain' }
      }

      console.log('✅ [BLOCKCHAIN] Game exists on-chain!')
      
      return {
        success: true,
        gameState: {
          creator: game.creator,
          nftContract: game.nftContract,
          tokenId: game.tokenId?.toString(),
          winner: game.winner,
          completed: game.completed,
          nftClaimed: game.nftClaimed,
          creatorPaid: game.creatorPaid,
          currentPlayers: game.currentPlayers.toString(),
          maxPlayers: game.maxPlayers.toString(),
          entryFee: game.entryFee.toString(),
          totalPool: game.totalPool.toString()
        }
      }
    } catch (error) {
      console.error('❌ [BLOCKCHAIN] Error getting Battle Royale game state:', error)
      console.error('❌ [BLOCKCHAIN] Error details:', {
        message: error.message,
        code: error.code,
        data: error.data
      })
      return { success: false, error: error.message || 'Failed to get game state' }
    }
  }

  /**
   * Complete Battle Royale early with fewer players (owner-only)
   */
  async completeBattleRoyaleEarlyOnChain(gameId, winner) {
    console.log('🏆 Completing Battle Royale early on blockchain:', { gameId, winner })
    if (!this.contractOwnerWallet) {
      return { success: false, error: 'Contract wallet not configured' }
    }

    try {
      const contract = new ethers.Contract(this.contractAddress, this.CONTRACT_ABI, this.contractOwnerWallet)
      const gameIdBytes32 = ethers.id(gameId)

      // Optional sanity read
      try {
        const brGame = await contract.getBattleRoyaleGame(gameIdBytes32)
        if (!brGame || brGame.creator === ethers.ZeroAddress) {
          return { success: false, error: 'Battle Royale game does not exist' }
        }
      } catch {}

      const tx = await contract.completeBattleRoyaleEarly(gameIdBytes32, winner)
      await tx.wait()
      return { success: true, transactionHash: tx.hash }
    } catch (error) {
      console.error('❌ Failed to complete Battle Royale early on chain:', error)
      return { success: false, error: error.message || 'Blockchain transaction failed' }
    }
  }

  /**
   * Monitor game events
   */
  async setupEventListeners(callback) {
    if (!this.contractOwnerWallet || !this.provider) {
      console.log('⚠️ Blockchain event listeners not configured (missing wallet or provider)')
      return
    }
    
    try {
      const contract = new ethers.Contract(this.contractAddress, this.CONTRACT_ABI, this.provider)
      
      // Listen for GameReady events
      contract.on('GameReady', (gameId, nftDepositor, cryptoDepositor, event) => {
        console.log('🎮 GameReady event:', {
          gameId: gameId,
          nftDepositor,
          cryptoDepositor,
          blockNumber: event.blockNumber
        })
        
        callback({
          type: 'GameReady',
          gameId: gameId,
          nftDepositor,
          cryptoDepositor,
          event
        })
      })
      
      // Listen for GameCompleted events
      contract.on('GameCompleted', (gameId, winner, event) => {
        console.log('🏆 GameCompleted event:', {
          gameId: gameId,
          winner,
          blockNumber: event.blockNumber
        })
        
        callback({
          type: 'GameCompleted',
          gameId: gameId,
          winner,
          event
        })
      })
      
      console.log('👂 Event listeners set up successfully')
    } catch (error) {
      console.error('❌ Failed to set up event listeners:', error)
    }
  }

  // Withdrawal methods removed - users call the contract directly with their own wallets
  // The frontend ContractService handles withdrawals properly using user wallets
}

module.exports = { BlockchainService } 