const ethers = require('ethers')

class BlockchainService {
  constructor(rpcUrl, contractAddress, contractOwnerKey) {
    this.rpcUrl = rpcUrl
    this.contractAddress = contractAddress
    this.contractOwnerKey = contractOwnerKey
    this.provider = new ethers.JsonRpcProvider(rpcUrl)
    this.contractOwnerWallet = contractOwnerKey ? new ethers.Wallet(contractOwnerKey, this.provider) : null
    
    this.CONTRACT_ABI = [
      "function initializeGame(bytes32 gameId, address player1, address nftContract, uint256 tokenId)",
      "function setPlayer2(bytes32 gameId, address player2)",
      "function completeGame(bytes32 gameId, address winner)",
      "function cancelGame(bytes32 gameId)"
    ]
  }

  hasOwnerWallet() {
    return !!this.contractOwnerWallet
  }

  async initializeGameOnChain(gameId, player1, nftContract, tokenId) {
    console.log('🔗 Initializing game on blockchain:', { gameId, player1, nftContract, tokenId })
    
    if (!this.contractOwnerWallet) {
      console.error('❌ Contract owner wallet not configured')
      console.error('❌ Please check CONTRACT_OWNER_KEY or PRIVATE_KEY environment variable')
      return { success: false, error: 'Contract wallet not configured' }
    }
    
    if (!this.contractAddress) {
      console.error('❌ Contract address not configured')
      return { success: false, error: 'Contract address not configured' }
    }
    
    try {
      // Add network info
      const network = await this.provider.getNetwork()
      console.log('🌐 Connected to network:', {
        name: network.name,
        chainId: network.chainId,
        rpc: this.rpcUrl
      })
      
      // Check wallet balance
      const balance = await this.provider.getBalance(this.contractOwnerWallet.address)
      console.log('💰 Contract owner balance:', ethers.formatEther(balance), 'ETH')
      
      if (balance === 0n) {
        return { success: false, error: 'Contract owner wallet has no ETH for gas fees' }
      }
      
      const contract = new ethers.Contract(this.contractAddress, this.CONTRACT_ABI, this.contractOwnerWallet)
      const gameIdBytes32 = ethers.id(gameId)
      
      // Verify contract exists
      try {
        const code = await this.provider.getCode(this.contractAddress)
        if (code === '0x') {
          console.error('❌ No contract deployed at address:', this.contractAddress)
          return { success: false, error: 'Contract not found at specified address' }
        }
        console.log('✅ Contract found at address:', this.contractAddress)
      } catch (err) {
        console.error('❌ Error checking contract:', err)
        return { success: false, error: 'Failed to verify contract existence' }
      }
      
      console.log('🔗 Sending transaction to contract:', this.contractAddress)
      console.log('📝 Transaction parameters:', {
        gameIdBytes32,
        player1,
        nftContract,
        tokenId
      })
      
      // Try to estimate gas first
      try {
        const gasEstimate = await contract.initializeGame.estimateGas(
          gameIdBytes32,
          player1,
          nftContract,
          tokenId
        )
        console.log('⛽ Gas estimate:', gasEstimate.toString())
      } catch (gasError) {
        console.error('❌ Gas estimation failed:', gasError)
        return { success: false, error: `Gas estimation failed: ${gasError.message}` }
      }
      
      const tx = await contract.initializeGame(
        gameIdBytes32,
        player1,
        nftContract,
        tokenId
      )
      
      console.log('⏳ Waiting for transaction confirmation:', tx.hash)
      await tx.wait()
      console.log('✅ Game initialized on chain:', gameId)
      return { success: true }
    } catch (error) {
      console.error('❌ Failed to initialize game on chain:', error)
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        reason: error.reason
      })
      return { success: false, error: error.message || 'Blockchain transaction failed' }
    }
  }

  async completeGameOnChain(gameIdBytes32, winner) {
    if (!this.contractOwnerWallet) return
    
    try {
      const contract = new ethers.Contract(this.contractAddress, this.CONTRACT_ABI, this.contractOwnerWallet)
      const tx = await contract.completeGame(gameIdBytes32, winner)
      await tx.wait()
      console.log('✅ Game completed on chain')
    } catch (error) {
      console.error('❌ Failed to complete game on chain:', error)
    }
    }

  async setPlayer2OnChain(gameId, player2) {
    console.log('🔗 Setting player 2 on blockchain:', { gameId, player2 })
    
    if (!this.contractOwnerWallet) {
      console.error('❌ Contract owner wallet not configured')
      return { success: false, error: 'Contract wallet not configured' }
    }
    
    try {
      const contract = new ethers.Contract(this.contractAddress, this.CONTRACT_ABI, this.contractOwnerWallet)
      const gameIdBytes32 = ethers.id(gameId)
      
      console.log('🔗 Calling setPlayer2:', {
        gameIdBytes32,
        player2
      })
      
      const tx = await contract.setPlayer2(gameIdBytes32, player2)
      
      console.log('⏳ Waiting for transaction confirmation:', tx.hash)
      await tx.wait()
      console.log('✅ Player 2 set on chain')
      return { success: true }
    } catch (error) {
      console.error('❌ Failed to set player 2 on chain:', error)
      return { success: false, error: error.message || 'Blockchain transaction failed' }
    }
  }

}

module.exports = { BlockchainService } 