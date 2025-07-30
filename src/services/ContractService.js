import { ethers } from 'ethers'

// Contract configuration
const CONTRACT_ADDRESS = '0x807885ec42b9A727C4763d8F929f2ac132eDF6F0'

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
      
      console.log('✅ Contract service initialized with ethers.js')
      console.log('🔗 Contract address:', this.contractAddress)
      console.log('👤 Account address:', this.account)
      
      return { success: true }
    } catch (error) {
      console.error('❌ Error initializing contract service:', error)
      return { success: false, error: error.message }
    }
  }

  // Check if service is ready
  isReady() {
    return !!(this.provider && this.signer && this.contract && this.account)
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
      if (!canDeposit) {
        throw new Error('Cannot deposit - game expired or already completed')
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
      if (!canDeposit) {
        throw new Error('Cannot deposit - game expired or already completed')
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
      if (!canDeposit) {
        throw new Error('Cannot deposit - game expired or already completed')
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
          outputs: []
        },
        {
          name: 'allowance',
          type: 'function',
          stateMutability: 'view',
          inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' }
          ],
          outputs: [{ name: '', type: 'uint256' }]
        }
      ]

      // Create USDC contract instance
      const usdcContract = new ethers.Contract(usdcTokenAddress, ERC20_ABI, this.signer)
      
      // Check allowance
      const allowance = await usdcContract.allowance(this.account, this.contractAddress)
      
      if (allowance < usdcAmount) {
        // Approve USDC
        const approveTx = await usdcContract.approve(this.contractAddress, usdcAmount)
        await approveTx.wait()
      }

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
      const gameInfo = await this.contract.games(gameIdBytes32)
      
      return {
        success: true,
        gameInfo: {
          player1: gameInfo.player1,
          player2: gameInfo.player2,
          nftContract: gameInfo.nftContract,
          tokenId: gameInfo.tokenId.toString(),
          ethAmount: gameInfo.ethAmount.toString(),
          depositTime: gameInfo.depositTime.toString(),
          player1Deposited: gameInfo.player1Deposited,
          player2Deposited: gameInfo.player2Deposited,
          completed: gameInfo.completed,
          winner: gameInfo.winner
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
}

// Export singleton instance
const contractService = new CleanContractService()
export default contractService 