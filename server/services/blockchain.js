const ethers = require('ethers')

class BlockchainService {
  constructor(rpcUrl, contractAddress, contractOwnerKey) {
    this.rpcUrl = rpcUrl
    this.contractAddress = contractAddress
    this.contractOwnerKey = contractOwnerKey
    this.provider = new ethers.JsonRpcProvider(rpcUrl)
    this.contractOwnerWallet = contractOwnerKey ? new ethers.Wallet(contractOwnerKey, this.provider) : null
    
    this.CONTRACT_ABI = [
      "function initializeGame(bytes32 gameId, address player1, address player2, address nftContract, uint256 tokenId, uint256 priceUSD, uint8 paymentToken)",
      "function completeGame(bytes32 gameId, address winner)",
      "function cancelGame(bytes32 gameId)"
    ]
  }

  hasOwnerWallet() {
    return !!this.contractOwnerWallet
  }

  async initializeGameOnChain(gameId, player1, player2, nftContract, tokenId, priceUSD) {
    console.log('🔗 Initializing game on blockchain:', { gameId, player1, player2, nftContract, tokenId, priceUSD })
    
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
        player2, 
        nftContract,
        tokenId,
        priceUSD: ethers.parseUnits(priceUSD.toString(), 6),
        paymentToken: 0 // 0 = ETH, 1 = USDC
      })
      
      // Try to estimate gas first
      try {
        const gasEstimate = await contract.initializeGame.estimateGas(
          gameIdBytes32,
          player1,
          player2,
          nftContract,
          tokenId,
          ethers.parseUnits(priceUSD.toString(), 6),
          0 // PaymentToken.ETH = 0, PaymentToken.USDC = 1
        )
        console.log('⛽ Gas estimate:', gasEstimate.toString())
      } catch (gasError) {
        console.error('❌ Gas estimation failed:', gasError)
        return { success: false, error: `Gas estimation failed: ${gasError.message}` }
      }
      
      const tx = await contract.initializeGame(
        gameIdBytes32,
        player1,
        player2,
        nftContract,
        tokenId,
        ethers.parseUnits(priceUSD.toString(), 6), // 6 decimals for USD
        0 // PaymentToken.ETH = 0, PaymentToken.USDC = 1
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

  async updateGameWithPlayer2(gameId, player2, priceUSD, paymentToken = 0) {
    console.log('🔗 Updating game with player 2 on blockchain:', { gameId, player2, priceUSD, paymentToken })
    
    if (!this.contractOwnerWallet) {
      console.error('❌ Contract owner wallet not configured')
      return { success: false, error: 'Contract wallet not configured' }
    }
    
    try {
      const contract = new ethers.Contract(this.contractAddress, this.CONTRACT_ABI, this.contractOwnerWallet)
      const gameIdBytes32 = ethers.id(gameId)
      
      // Add the ABI for the new function
      const updateABI = [
        "function updateGameWithPlayer2(bytes32 gameId, address player2, uint256 priceUSD, uint8 paymentToken)"
      ]
      const contractWithUpdate = new ethers.Contract(this.contractAddress, updateABI, this.contractOwnerWallet)
      
      console.log('🔗 Calling updateGameWithPlayer2:', {
        gameIdBytes32,
        player2,
        priceUSD: ethers.parseUnits(priceUSD.toString(), 6),
        paymentToken
      })
      
      const tx = await contractWithUpdate.updateGameWithPlayer2(
        gameIdBytes32,
        player2,
        ethers.parseUnits(priceUSD.toString(), 6),
        paymentToken
      )
      
      console.log('⏳ Waiting for transaction confirmation:', tx.hash)
      await tx.wait()
      console.log('✅ Game updated with player 2 on chain')
      return { success: true }
    } catch (error) {
      console.error('❌ Failed to update game on chain:', error)
      return { success: false, error: error.message || 'Blockchain transaction failed' }
    }
  }

  async getETHAmountForUSD(usdAmount) {
    console.log('🔗 Getting ETH amount from contract for USD:', usdAmount)
    
    if (!this.provider) {
      console.error('❌ Provider not configured')
      return { success: false, error: 'Provider not configured' }
    }
    
    try {
      const contract = new ethers.Contract(
        this.contractAddress,
        ["function getETHAmount(uint256) view returns (uint256)"],
        this.provider
      )
      
      const ethAmount = await contract.getETHAmount(
        ethers.parseUnits(usdAmount.toString(), 6)
      )
      
      console.log('✅ ETH amount from contract:', ethers.formatEther(ethAmount), 'ETH')
      return ethAmount
    } catch (error) {
      console.error('❌ Error getting ETH amount from contract:', error)
      // NO FALLBACK - fail properly instead of using wrong value
      throw new Error('Failed to get ETH price from contract. Please try again.')
    }
  }
}

module.exports = { BlockchainService } 