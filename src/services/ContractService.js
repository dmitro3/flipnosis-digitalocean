import { createPublicClient, createWalletClient, custom, http, parseEther, formatEther } from 'viem'
import { base, baseSepolia } from 'viem/chains'

// Simplified ABI - only what we need
const CONTRACT_ABI = [
  {
    name: 'createGame',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'weiAmount', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'joinGame',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'gameId', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'completeGame',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'winner', type: 'address' }
    ],
    outputs: []
  },
  {
    name: 'games',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'creator', type: 'address' },
      { name: 'joiner', type: 'address' },
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'weiAmount', type: 'uint256' },
      { name: 'completed', type: 'bool' },
      { name: 'winner', type: 'address' }
    ]
  },
  {
    name: 'nextGameId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  }
]

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

class ContractService {
  constructor() {
    this.contractAddress = '0x7856209e475DfbE42dAf1303268D8aec72B567b7' // New deployed contract
    this.walletClient = null
    this.publicClient = null
    this.chainId = null
  }

  async initializeClients(chainId, walletClient) {
    this.chainId = chainId
    this.walletClient = walletClient
    
    const chain = chainId === 8453 ? base : baseSepolia
    this.publicClient = createPublicClient({
      chain,
      transport: http()
    })
    
    console.log('✅ Contract service initialized')
  }

  isInitialized() {
    return !!(this.walletClient && this.publicClient)
  }

  // Convert USD to Wei using server price
  async convertUSDToWei(priceUSD) {
    const response = await fetch('https://cryptoflipz2-production.up.railway.app/api/calculate-wei-price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceUSD })
    })
    
    if (!response.ok) {
      throw new Error('Failed to convert price')
    }
    
    const data = await response.json()
    return data.weiAmount
  }

  // Approve NFT
  async approveNFT(nftContract, tokenId) {
    try {
      const account = this.walletClient.account.address

      // Check if already approved
      const currentApproval = await this.publicClient.readContract({
        address: nftContract,
        abi: NFT_ABI,
        functionName: 'getApproved',
        args: [BigInt(tokenId)]
      })

      if (currentApproval?.toLowerCase() === this.contractAddress.toLowerCase()) {
        return { success: true, alreadyApproved: true }
      }

      // Approve
      const { request } = await this.publicClient.simulateContract({
        address: nftContract,
        abi: NFT_ABI,
        functionName: 'approve',
        args: [this.contractAddress, BigInt(tokenId)],
        account
      })

      const hash = await this.walletClient.writeContract(request)
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })

      return { success: true, hash, receipt }
    } catch (error) {
      console.error('Error approving NFT:', error)
      return { success: false, error: error.message }
    }
  }

  // Create game with Wei amount
  async createGame(params) {
    try {
      if (!this.isInitialized()) {
        throw new Error('Contract service not initialized')
      }

      // Get next game ID
      const nextGameId = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'nextGameId'
      })

      // Convert USD to Wei
      const weiAmount = await this.convertUSDToWei(params.priceUSD)
      console.log('💰 Game price:', params.priceUSD, 'USD =', weiAmount, 'Wei')

      // Create game
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'createGame',
        args: [
          params.nftContract,
          BigInt(params.tokenId),
          BigInt(weiAmount)
        ],
        account: this.walletClient.account
      })

      const hash = await this.walletClient.writeContract(request)
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })

      // Save to database
      const gameId = nextGameId.toString()
      const API_URL = 'https://cryptoflipz2-production.up.railway.app'
      await fetch(`${API_URL}/api/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: gameId,
          creator: this.walletClient.account.address,
          nft_contract: params.nftContract,
          nft_token_id: params.tokenId.toString(),
          price_usd: params.priceUSD,
          price_wei: weiAmount,
          coin: params.coin,
          transaction_hash: hash
        })
      })

      return { success: true, gameId, hash }
    } catch (error) {
      console.error('Error creating game:', error)
      return { success: false, error: error.message }
    }
  }

  // Join game with exact Wei amount
  async joinGame(gameId) {
    try {
      if (!this.isInitialized()) {
        throw new Error('Contract service not initialized')
      }

      // Get game details to find required Wei amount
      const game = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'games',
        args: [BigInt(gameId)]
      })

      const weiAmount = game[4] // weiAmount is the 5th element
      console.log('💰 Joining game with:', formatEther(weiAmount), 'ETH')

      // Join game
      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'joinGame',
        args: [BigInt(gameId)],
        value: weiAmount,
        account: this.walletClient.account
      })

      const hash = await this.walletClient.writeContract(request)
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })

      return { success: true, hash, receipt }
    } catch (error) {
      console.error('Error joining game:', error)
      return { success: false, error: error.message }
    }
  }

  // Complete game
  async completeGame(gameId, winner) {
    try {
      if (!this.isInitialized()) {
        throw new Error('Contract service not initialized')
      }

      const { request } = await this.publicClient.simulateContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'completeGame',
        args: [BigInt(gameId), winner],
        account: this.walletClient.account
      })

      const hash = await this.walletClient.writeContract(request)
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })

      return { success: true, hash, receipt }
    } catch (error) {
      console.error('Error completing game:', error)
      return { success: false, error: error.message }
    }
  }

  // Get game details
  async getGame(gameId) {
    try {
      const game = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'games',
        args: [BigInt(gameId)]
      })

      return {
        success: true,
        game: {
          creator: game[0],
          joiner: game[1],
          nftContract: game[2],
          tokenId: game[3].toString(),
          weiAmount: game[4].toString(),
          completed: game[5],
          winner: game[6]
        }
      }
    } catch (error) {
      console.error('Error getting game:', error)
      return { success: false, error: error.message }
    }
  }
}

export default new ContractService() 