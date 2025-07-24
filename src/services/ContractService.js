import { createPublicClient, createWalletClient, custom, http, parseEther, formatEther } from 'viem'
import { base } from 'viem/chains'

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
    name: 'canStartGame',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'gameId', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }]
  }
]

// NFT ABI for approvals
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

// Events
const EVENTS = {
  ListingFeePaid: 'ListingFeePaid',
  AssetsDeposited: 'AssetsDeposited',
  GameStarted: 'GameStarted',
  GameCompleted: 'GameCompleted',
  GameCancelled: 'GameCancelled',
  AssetsReclaimed: 'AssetsReclaimed'
}

class CleanContractService {
  constructor() {
    this.contractAddress = '0x807885ec42b9A727C4763d8F929f2ac132eDF6F0'
    this.publicClient = null
    this.walletClient = null
  }

  // Initialize with wallet
  async initialize(walletClient) {
    this.walletClient = walletClient
    this.publicClient = createPublicClient({
      chain: base,
      transport: http('https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3')
    })
    console.log('✅ Contract service initialized')
  }

  // Helper to check if clients are ready
  isReady() {
    return !!(this.publicClient && this.walletClient);
  }

  // Convert game ID to bytes32
  getGameIdBytes32(gameId) {
    // Use viem's keccak256 to create deterministic bytes32 from string
    const { keccak256, toHex } = require('viem')
    return keccak256(toHex(gameId))
  }

  // Patch all contract methods to check readiness
  async payListingFee() {
    if (!this.isReady()) {
      return { success: false, error: 'Wallet not connected or contract service not initialized.' };
    }
    try {
      // Get listing fee amount
      const listingFeeUSD = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'listingFeeUSD'
      })

      const listingFeeETH = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'getETHAmount',
        args: [listingFeeUSD]
      })

      console.log('💰 Listing fee:', formatEther(listingFeeETH), 'ETH')

      // Send transaction
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'payListingFee',
        account: this.walletClient.account,
        value: listingFeeETH
      })

      const hash = await this.walletClient.writeContract(request)
      console.log('📝 Listing fee tx:', hash)

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })

      return {
        success: true,
        transactionHash: hash,
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
      return { success: false, error: 'Wallet not connected or contract service not initialized.' };
    }
    try {
      // Check current approval
      const currentApproval = await this.publicClient.readContract({
        address: nftContract,
        abi: NFT_ABI,
        functionName: 'getApproved',
        args: [BigInt(tokenId)]
      })

      if (currentApproval?.toLowerCase() === this.contractAddress.toLowerCase()) {
        console.log('✅ NFT already approved')
        return { success: true, alreadyApproved: true }
      }

      // Approve
      const { request } = await this.publicClient.simulateContract({
        address: nftContract,
        abi: NFT_ABI,
        functionName: 'approve',
        args: [this.contractAddress, BigInt(tokenId)],
        account: this.walletClient.account
      })

      const hash = await this.walletClient.writeContract(request)
      console.log('🔐 NFT approval tx:', hash)

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })

      return {
        success: true,
        transactionHash: hash,
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
      return { success: false, error: 'Wallet not connected or contract service not initialized.' };
    }
    try {
      // First approve if needed
      const approvalResult = await this.approveNFT(nftContract, tokenId)
      if (!approvalResult.success && !approvalResult.alreadyApproved) {
        return approvalResult
      }

      const gameIdBytes32 = this.getGameIdBytes32(gameId)

      // Check if can deposit
      const canDeposit = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'canDeposit',
        args: [gameIdBytes32]
      })

      if (!canDeposit) {
        throw new Error('Cannot deposit - game expired or already completed')
      }

      // Deposit NFT
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'depositNFT',
        args: [gameIdBytes32],
        account: this.walletClient.account
      })

      const hash = await this.walletClient.writeContract(request)
      console.log('🎮 NFT deposit tx:', hash)

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })

      return {
        success: true,
        transactionHash: hash,
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
      return { success: false, error: 'Wallet not connected or contract service not initialized.' };
    }
    try {
      const gameIdBytes32 = this.getGameIdBytes32(gameId)

      // Check if can deposit
      const canDeposit = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'canDeposit',
        args: [gameIdBytes32]
      })

      if (!canDeposit) {
        throw new Error('Cannot deposit - game expired or already completed')
      }

      // Get ETH amount
      const priceIn6Decimals = BigInt(Math.floor(priceUSD * 1000000))
      const ethAmount = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'getETHAmount',
        args: [priceIn6Decimals]
      })

      console.log('💰 Depositing:', formatEther(ethAmount), 'ETH')

      // Deposit ETH
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'depositETH',
        args: [gameIdBytes32],
        account: this.walletClient.account,
        value: ethAmount
      })

      const hash = await this.walletClient.writeContract(request)
      console.log('💎 ETH deposit tx:', hash)

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })

      return {
        success: true,
        transactionHash: hash,
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
      return { success: false, error: 'Wallet not connected or contract service not initialized.' };
    }
    try {
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      // Check if can deposit
      const canDeposit = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'canDeposit',
        args: [gameIdBytes32]
      })
      if (!canDeposit) {
        throw new Error('Cannot deposit - game expired or already completed')
      }
      // Approve USDC if needed
      const ERC20_ABI = [
        { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [ { name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' } ], outputs: [] },
        { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [ { name: 'owner', type: 'address' }, { name: 'spender', type: 'address' } ], outputs: [ { name: '', type: 'uint256' } ] }
      ]
      const allowance = await this.publicClient.readContract({
        address: usdcTokenAddress,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [this.walletClient.account.address, this.contractAddress]
      })
      if (BigInt(allowance) < BigInt(usdcAmount)) {
        const { request } = await this.publicClient.simulateContract({
          address: usdcTokenAddress,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [this.contractAddress, usdcAmount],
          account: this.walletClient.account
        })
        await this.walletClient.writeContract(request)
      }
      // Deposit USDC
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'depositUSDC',
        args: [gameIdBytes32, usdcAmount],
        account: this.walletClient.account
      })
      const hash = await this.walletClient.writeContract(request)
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      return {
        success: true,
        transactionHash: hash,
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

  // Reclaim assets if timeout
  async reclaimAssets(gameId) {
    if (!this.isReady()) {
      return { success: false, error: 'Wallet not connected or contract service not initialized.' };
    }
    try {
      const gameIdBytes32 = this.getGameIdBytes32(gameId)

      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'reclaimAssets',
        args: [gameIdBytes32],
        account: this.walletClient.account
      })

      const hash = await this.walletClient.writeContract(request)
      console.log('♻️ Reclaim assets tx:', hash)

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })

      return {
        success: true,
        transactionHash: hash,
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

  // Get game state
  async getGameState(gameId) {
    if (!this.isReady()) {
      return { success: false, error: 'Wallet not connected or contract service not initialized.' };
    }
    try {
      const gameIdBytes32 = this.getGameIdBytes32(gameId)

      const game = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'games',
        args: [gameIdBytes32]
      })

      return {
        success: true,
        game: {
          player1: game[0],
          player2: game[1],
          nftContract: game[2],
          tokenId: game[3].toString(),
          ethAmount: game[4].toString(),
          depositTime: new Date(Number(game[5]) * 1000),
          player1Deposited: game[6],
          player2Deposited: game[7],
          completed: game[8],
          winner: game[9]
        }
      }
    } catch (error) {
      console.error('❌ Error getting game state:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Get ETH price for USD amount
  async getETHAmount(usdAmount) {
    if (!this.isReady()) {
      return { success: false, error: 'Wallet not connected or contract service not initialized.' };
    }
    try {
      const priceIn6Decimals = BigInt(Math.floor(usdAmount * 1000000))
      const ethAmount = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'getETHAmount',
        args: [priceIn6Decimals]
      })
      
      return {
        success: true,
        ethAmount: formatEther(ethAmount),
        ethAmountWei: ethAmount
      }
    } catch (error) {
      console.error('❌ Error getting ETH amount:', error)
      // Fallback calculation
      const ethPrice = 3000
      const ethAmount = usdAmount / ethPrice
      return {
        success: true,
        ethAmount: ethAmount.toFixed(18),
        ethAmountWei: parseEther(ethAmount.toFixed(18)),
        fallback: true
      }
    }
  }
}

export default new CleanContractService() 