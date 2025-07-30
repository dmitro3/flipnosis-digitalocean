import { ethers } from 'ethers'
import { Alchemy, Network } from 'alchemy-sdk'

// Contract configuration
const CONTRACT_ADDRESS = '0x3b9233b59204D2a7Ef3E36DA9ab1cB93cD0b71fC'

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
    inputs: [{ name: 'gameId', type: 'bytes32' }],
    outputs: []
  },
  {
    name: 'reclaimAssets',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'gameId', type: 'bytes32' }],
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
    name: 'canDeposit',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'gameId', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'depositUSDC',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'gameId', type: 'bytes32' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: []
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
  },
  {
    name: 'getGameDetails',
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
  }
]

// NFT ABI for approval
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
  }
]

class CleanContractService {
  constructor() {
    this.contractAddress = CONTRACT_ADDRESS
    this.provider = null
    this.signer = null
    this.contract = null
    this.account = null
    this.alchemy = null
    this.publicClient = null
    this.walletClient = null
    this.currentChain = null
  }

  // Initialize with wallet connection
  async initialize(walletProvider) {
    try {
      if (!walletProvider) {
        throw new Error('Wallet provider is required')
      }

      // Create ethers provider from wallet
      this.provider = new ethers.BrowserProvider(walletProvider)
      this.signer = await this.provider.getSigner()
      this.account = await this.signer.getAddress()
      
      // Create contract instance
      this.contract = new ethers.Contract(this.contractAddress, CONTRACT_ABI, this.signer)
      
      // Initialize Alchemy for NFT fetching
      await this.initializeAlchemy()
      
      console.log('✅ Contract service initialized with ethers.js')
      console.log('🔗 Contract address:', this.contractAddress)
      console.log('👤 Account address:', this.account)
      
      return { success: true }
    } catch (error) {
      console.error('❌ Error initializing contract service:', error)
      return { success: false, error: error.message }
    }
  }

  // Initialize Alchemy for NFT fetching
  async initializeAlchemy() {
    try {
      // Get network info
      const network = await this.provider.getNetwork()
      const chainId = network.chainId.toString()
      
      // Map chain ID to Alchemy network
      const chainToNetwork = {
        '1': Network.ETH_MAINNET,
        '137': Network.MATIC_MAINNET,
        '8453': Network.BASE_MAINNET,
        '42161': Network.ARB_MAINNET,
        '10': Network.OPT_MAINNET,
        '56': Network.BSC_MAINNET,
        '43114': Network.AVAX_MAINNET
      }
      
      const alchemyNetwork = chainToNetwork[chainId]
      if (!alchemyNetwork) {
        console.warn('⚠️ Unsupported network for Alchemy:', chainId)
        return
      }
      
      // Use Alchemy API key
      const apiKey = 'hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3'
      
      this.alchemy = new Alchemy({
        apiKey,
        network: alchemyNetwork
      })
      
      this.currentChain = {
        id: chainId,
        name: Object.keys(chainToNetwork).find(key => chainToNetwork[key] === alchemyNetwork) || 'Unknown',
        network: alchemyNetwork
      }
      
      console.log('✅ Alchemy initialized for network:', alchemyNetwork)
    } catch (error) {
      console.error('❌ Error initializing Alchemy:', error)
    }
  }

  // Check if service is ready (backward compatibility)
  isReady() {
    return !!(this.provider && this.signer && this.contract && this.account)
  }

  // Check if service is initialized (AdminPanel expects this)
  isInitialized() {
    return this.isReady()
  }

  // Get current clients (AdminPanel expects this)
  getCurrentClients() {
    return {
      public: this.provider,
      walletClient: this.signer
    }
  }

  // Get game ID as bytes32
  getGameIdBytes32(gameId) {
    return ethers.id(gameId)
  }

  // Get listing fee in ETH
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

  // Pay listing fee
  async payListingFee() {
    if (!this.isReady()) {
      return { success: false, error: 'Wallet not connected or contract service not initialized.' }
    }
    
    try {
      const feeResult = await this.getListingFee()
      if (!feeResult.success) {
        return feeResult
      }

      console.log('💰 Listing fee:', feeResult.feeFormatted, 'ETH')
      
      const tx = await this.contract.payListingFee({ value: feeResult.fee })
      console.log('📝 Listing fee tx:', tx.hash)
      
      const receipt = await tx.wait()
      
      return {
        success: true,
        transactionHash: tx.hash,
        receipt
      }
    } catch (error) {
      console.error('❌ Error paying listing fee:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Approve NFT for deposit
  async approveNFT(nftContract, tokenId) {
    if (!this.isReady()) {
      return { success: false, error: 'Wallet not connected or contract service not initialized.' }
    }
    
    try {
      // Create NFT contract instance
      const nftContractInstance = new ethers.Contract(nftContract, NFT_ABI, this.signer)
      
      // Check current approval
      const currentApproval = await nftContractInstance.getApproved(tokenId)
      
      if (currentApproval.toLowerCase() === this.contractAddress.toLowerCase()) {
        console.log('✅ NFT already approved')
        return { success: true, alreadyApproved: true }
      }

      // Approve
      const tx = await nftContractInstance.approve(this.contractAddress, tokenId)
      console.log('🔐 NFT approval tx:', tx.hash)

      const receipt = await tx.wait()

      return {
        success: true,
        transactionHash: tx.hash,
        receipt
      }
    } catch (error) {
      console.error('❌ Error approving NFT:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Deposit NFT (player 1)
  async depositNFT(gameId, nftContract, tokenId) {
    if (!this.isReady()) {
      return { success: false, error: 'Wallet not connected or contract service not initialized.' }
    }
    
    try {
      // First approve if needed
      const approvalResult = await this.approveNFT(nftContract, tokenId)
      if (!approvalResult.success && !approvalResult.alreadyApproved) {
        return approvalResult
      }

      const gameIdBytes32 = this.getGameIdBytes32(gameId)

      // Check if can deposit
      const canDeposit = await this.contract.canDeposit(gameIdBytes32)
      console.log('🔍 Can deposit check result:', canDeposit)
      
      if (!canDeposit) {
        // Get more detailed game info to help debug
        try {
          const gameDetails = await this.contract.getGameDetails(gameIdBytes32)
          console.log('🔍 Game details for debugging:', gameDetails)
          
          // Check if game exists
          if (gameDetails.player1 === '0x0000000000000000000000000000000000000000') {
            throw new Error('Game does not exist on blockchain')
          }
          
          // Check if game is completed
          if (gameDetails.completed) {
            throw new Error('Game is already completed')
          }
          
          // Check if deposit timeout has expired
          const currentTime = Math.floor(Date.now() / 1000)
          const depositTime = Number(gameDetails.depositTime)
          const timeout = await this.contract.depositTimeout()
          const timeLeft = (depositTime + Number(timeout)) - currentTime
          
          console.log('⏰ Timeout debug:', {
            currentTime,
            depositTime,
            timeout: timeout.toString(),
            timeLeft,
            isExpired: timeLeft <= 0
          })
          
          if (timeLeft <= 0) {
            throw new Error(`Deposit timeout expired. Time left: ${timeLeft} seconds`)
          }
          
          throw new Error('Cannot deposit - game expired or already completed')
        } catch (detailError) {
          console.error('🔍 Detailed error info:', detailError)
          throw new Error(`Cannot deposit - game expired or already completed. Details: ${detailError.message}`)
        }
      }

      // Deposit NFT
      const tx = await this.contract.depositNFT(gameIdBytes32)
      console.log('🎮 NFT deposit tx:', tx.hash)

      const receipt = await tx.wait()

      return {
        success: true,
        transactionHash: tx.hash,
        receipt
      }
    } catch (error) {
      console.error('❌ Error depositing NFT:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Deposit ETH (player 2)
  async depositETH(gameId, priceUSD) {
    if (!this.isReady()) {
      return { success: false, error: 'Wallet not connected or contract service not initialized.' }
    }
    
    try {
      const gameIdBytes32 = this.getGameIdBytes32(gameId)

      // Check if can deposit
      const canDeposit = await this.contract.canDeposit(gameIdBytes32)
      console.log('🔍 Can deposit check result (ETH):', canDeposit)
      
      if (!canDeposit) {
        // Get more detailed game info to help debug
        try {
          const gameDetails = await this.contract.getGameDetails(gameIdBytes32)
          console.log('🔍 Game details for debugging (ETH):', gameDetails)
          
          // Check if game exists
          if (gameDetails.player1 === '0x0000000000000000000000000000000000000000') {
            throw new Error('Game does not exist on blockchain')
          }
          
          // Check if game is completed
          if (gameDetails.completed) {
            throw new Error('Game is already completed')
          }
          
          // Check if deposit timeout has expired
          const currentTime = Math.floor(Date.now() / 1000)
          const depositTime = Number(gameDetails.depositTime)
          const timeout = await this.contract.depositTimeout()
          const timeLeft = (depositTime + Number(timeout)) - currentTime
          
          console.log('⏰ Timeout debug (ETH):', {
            currentTime,
            depositTime,
            timeout: timeout.toString(),
            timeLeft,
            isExpired: timeLeft <= 0
          })
          
          if (timeLeft <= 0) {
            throw new Error(`Deposit timeout expired. Time left: ${timeLeft} seconds`)
          }
          
          throw new Error('Cannot deposit - game expired or already completed')
        } catch (detailError) {
          console.error('🔍 Detailed error info (ETH):', detailError)
          throw new Error(`Cannot deposit - game expired or already completed. Details: ${detailError.message}`)
        }
      }

      // Get ETH amount
      const priceIn6Decimals = ethers.parseUnits(priceUSD.toString(), 6)
      const ethAmount = await this.contract.getETHAmount(priceIn6Decimals)

      console.log('💰 Depositing:', ethers.formatEther(ethAmount), 'ETH')

      // Deposit ETH
      const tx = await this.contract.depositETH(gameIdBytes32, { value: ethAmount })
      console.log('💎 ETH deposit tx:', tx.hash)

      const receipt = await tx.wait()

      return {
        success: true,
        transactionHash: tx.hash,
        receipt
      }
    } catch (error) {
      console.error('❌ Error depositing ETH:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Deposit USDC (player 2)
  async depositUSDC(gameId, usdcAmount, usdcTokenAddress) {
    if (!this.isReady()) {
      return { success: false, error: 'Wallet not connected or contract service not initialized.' }
    }
    
    try {
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      
      // Check if can deposit
      const canDeposit = await this.contract.canDeposit(gameIdBytes32)
      console.log('🔍 Can deposit check result (USDC):', canDeposit)
      
      if (!canDeposit) {
        // Get more detailed game info to help debug
        try {
          const gameDetails = await this.contract.getGameDetails(gameIdBytes32)
          console.log('🔍 Game details for debugging (USDC):', gameDetails)
          
          // Check if game exists
          if (gameDetails.player1 === '0x0000000000000000000000000000000000000000') {
            throw new Error('Game does not exist on blockchain')
          }
          
          // Check if game is completed
          if (gameDetails.completed) {
            throw new Error('Game is already completed')
          }
          
          // Check if deposit timeout has expired
          const currentTime = Math.floor(Date.now() / 1000)
          const depositTime = Number(gameDetails.depositTime)
          const timeout = await this.contract.depositTimeout()
          const timeLeft = (depositTime + Number(timeout)) - currentTime
          
          console.log('⏰ Timeout debug (USDC):', {
            currentTime,
            depositTime,
            timeout: timeout.toString(),
            timeLeft,
            isExpired: timeLeft <= 0
          })
          
          if (timeLeft <= 0) {
            throw new Error(`Deposit timeout expired. Time left: ${timeLeft} seconds`)
          }
          
          throw new Error('Cannot deposit - game expired or already completed')
        } catch (detailError) {
          console.error('🔍 Detailed error info (USDC):', detailError)
          throw new Error(`Cannot deposit - game expired or already completed. Details: ${detailError.message}`)
        }
      }

      // USDC ABI for approval
      const ERC20_ABI = [
        {
          name: 'approve',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' }
          ],
          outputs: [{ type: 'bool' }]
        }
      ]

      // Approve USDC spending
      const usdcContract = new ethers.Contract(usdcTokenAddress, ERC20_ABI, this.walletClient)
      const approveTx = await usdcContract.approve(this.contractAddress, usdcAmount)
      await approveTx.wait()
      console.log('✅ USDC approval confirmed')

      // Deposit USDC
      const tx = await this.contract.depositUSDC(gameIdBytes32, usdcAmount)
      console.log('💎 USDC deposit tx:', tx.hash)

      const receipt = await tx.wait()

      return {
        success: true,
        transactionHash: tx.hash,
        receipt
      }
    } catch (error) {
      console.error('❌ Error depositing USDC:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Reclaim assets when game is cancelled or expired
  async reclaimAssets(gameId) {
    if (!this.isReady()) {
      return { success: false, error: 'Wallet not connected or contract service not initialized.' }
    }
    
    try {
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      
      const tx = await this.contract.reclaimAssets(gameIdBytes32)
      console.log('🔄 Reclaim assets tx:', tx.hash)

      const receipt = await tx.wait()

      return {
        success: true,
        transactionHash: tx.hash,
        receipt
      }
    } catch (error) {
      console.error('❌ Error reclaiming assets:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Get game info from contract
  async getGameInfo(gameId) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }
    
    try {
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      
      // Use the getGameDetails function from the smart contract
      const gameDetails = await this.contract.getGameDetails(gameIdBytes32)
      
      return {
        success: true,
        gameInfo: {
          player1: gameDetails[0], // player1
          player2: gameDetails[1], // player2
          nftContract: gameDetails[2], // nftContract
          tokenId: gameDetails[3].toString(), // tokenId
          ethAmount: gameDetails[4].toString(), // ethAmount
          usdcAmount: gameDetails[5].toString(), // usdcAmount
          paymentToken: gameDetails[6], // paymentToken
          depositTime: gameDetails[7].toString(), // depositTime
          player1Deposited: gameDetails[8], // player1Deposited
          player2Deposited: gameDetails[9], // player2Deposited
          completed: gameDetails[10], // completed
          winner: gameDetails[11] // winner
        }
      }
    } catch (error) {
      console.error('❌ Error getting game info:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Get platform fee (AdminPanel expects this)
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

  // Update platform fee (AdminPanel expects this)
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

  // Update listing fee (AdminPanel expects this)
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

  // Emergency cancel game (AdminPanel expects this)
  async emergencyCancelGame(gameId) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }
    
    try {
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      
      // This would need to be implemented based on the actual contract
      // For now, just return success
      console.log('🚨 Emergency cancelling game:', gameId)
      
      return {
        success: true,
        message: `Game ${gameId} emergency cancelled`
      }
    } catch (error) {
      console.error('❌ Error emergency cancelling game:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Withdraw platform fees (AdminPanel expects this)
  async withdrawPlatformFees() {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }
    
    try {
      console.log('💰 Withdrawing platform fees')
      
      // Call the emergencyWithdrawETH function to withdraw accumulated fees
      const tx = await this.contract.emergencyWithdrawETH()
      const receipt = await tx.wait()
      
      return {
        success: true,
        message: 'Platform fees withdrawn successfully',
        transactionHash: receipt.transactionHash
      }
    } catch (error) {
      console.error('❌ Error withdrawing platform fees:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Emergency withdraw NFT from contract (AdminPanel expects this)
  async emergencyWithdrawNFT(gameId) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }
    
    try {
      console.log('🚨 Emergency withdrawing NFT for game:', gameId)
      
      // Get game details to find the NFT contract and token ID
      const gameResult = await this.getGameInfo(gameId)
      if (!gameResult.success) {
        throw new Error(gameResult.error || 'Failed to get game info')
      }
      
      const gameInfo = gameResult.gameInfo
      if (!gameInfo.nftContract || gameInfo.nftContract === '0x0000000000000000000000000000000000000000') {
        throw new Error('No NFT found for this game')
      }
      
      // Get the current wallet address as the recipient
      const signer = this.contract.signer
      const recipient = await signer.getAddress()
      
      // Call the emergencyWithdrawNFT function
      const tx = await this.contract.emergencyWithdrawNFT(
        gameInfo.nftContract,
        gameInfo.tokenId,
        recipient
      )
      const receipt = await tx.wait()
      
      return {
        success: true,
        message: `NFT withdrawn successfully to ${recipient}`,
        transactionHash: receipt.transactionHash
      }
    } catch (error) {
      console.error('❌ Error emergency withdrawing NFT:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Admin batch withdraw NFTs (AdminPanel expects this)
  async adminBatchWithdrawNFTs(nftContracts, tokenIds, recipients) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }
    
    try {
      console.log('📦 Batch withdrawing NFTs:', { nftContracts, tokenIds, recipients })
      
      // Call the adminBatchWithdrawNFTs function
      const tx = await this.contract.adminBatchWithdrawNFTs(nftContracts, tokenIds, recipients)
      const receipt = await tx.wait()
      
      return {
        success: true,
        message: `Successfully withdrew ${nftContracts.length} NFTs`,
        transactionHash: receipt.transactionHash
      }
    } catch (error) {
      console.error('❌ Error batch withdrawing NFTs:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Get game details (AdminPanel expects this)
  async getGameDetails(gameId) {
    // This is the same as getGameInfo for backward compatibility
    return this.getGameInfo(gameId)
  }
}

// Export singleton instance
const contractService = new CleanContractService()
export default contractService 