import { ethers } from 'ethers'
import { base } from 'viem/chains'
import { Alchemy, Network } from 'alchemy-sdk'

const BASE_CHAIN = base

// NFTFlipGame contract ABI - matching the deployed contract
const CONTRACT_ABI = [
  // Core deposit functions
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
  // Game state functions
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
  // View functions for deposits
  {
    "inputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "name": "nftDeposits",
    "outputs": [
      {"internalType": "address", "name": "depositor", "type": "address"}, 
      {"internalType": "address", "name": "nftContract", "type": "address"}, 
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"}, 
      {"internalType": "bool", "name": "claimed", "type": "bool"}, 
      {"internalType": "uint256", "name": "depositTime", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Admin emergency withdraw functions
  {
    "inputs": [{"internalType": "bytes32", "name": "gameId", "type": "bytes32"}, {"internalType": "address", "name": "recipient", "type": "address"}],
    "name": "emergencyWithdrawNFT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Battle Royale functions
  {
    "inputs": [
      {"internalType": "bytes32", "name": "gameId", "type": "bytes32"},
      {"internalType": "address", "name": "nftContract", "type": "address"},
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"internalType": "uint256", "name": "entryFee", "type": "uint256"},
      {"internalType": "uint256", "name": "serviceFee", "type": "uint256"},
      {"internalType": "bool", "name": "isUnder20", "type": "bool"},
      {"internalType": "uint256", "name": "minUnder20Wei", "type": "uint256"}
    ],
    "name": "createBattleRoyale",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Battle Royale games public mapping getter
  {
    "inputs": [
      {"internalType": "bytes32", "name": "", "type": "bytes32"}
    ],
    "name": "battleRoyaleGames",
    "outputs": [
      {"internalType": "address", "name": "creator", "type": "address"},
      {"internalType": "address", "name": "nftContract", "type": "address"},
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"internalType": "uint256", "name": "entryFee", "type": "uint256"},
      {"internalType": "uint256", "name": "serviceFee", "type": "uint256"},
      {"internalType": "uint8", "name": "maxPlayers", "type": "uint8"},
      {"internalType": "uint8", "name": "currentPlayers", "type": "uint8"},
      {"internalType": "address", "name": "winner", "type": "address"},
      {"internalType": "bool", "name": "completed", "type": "bool"},
      {"internalType": "bool", "name": "creatorPaid", "type": "bool"},
      {"internalType": "bool", "name": "nftClaimed", "type": "bool"},
      {"internalType": "uint256", "name": "totalPool", "type": "uint256"},
      {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
      {"internalType": "bool", "name": "isUnder20", "type": "bool"},
      {"internalType": "uint256", "name": "minUnder20Wei", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "gameId", "type": "bytes32"}],
    "name": "joinBattleRoyale",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "gameId", "type": "bytes32"},
      {"internalType": "address", "name": "winner", "type": "address"}
    ],
    "name": "completeBattleRoyale",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "gameId", "type": "bytes32"}],
    "name": "withdrawCreatorFunds",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "gameId", "type": "bytes32"}],
    "name": "withdrawWinnerNFT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "gameId", "type": "bytes32"}],
    "name": "reclaimBattleRoyaleNFT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "gameId", "type": "bytes32"}],
    "name": "cancelBattleRoyale",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "gameId", "type": "bytes32"}],
    "name": "withdrawBattleRoyaleEntry",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "gameId", "type": "bytes32"}, {"internalType": "address", "name": "player", "type": "address"}],
    "name": "canWithdrawEntry",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
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
    "inputs": [{"internalType": "bytes32", "name": "gameId", "type": "bytes32"}],
    "name": "withdrawWinnings",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Direct NFT transfer functions (bypass game system)
  {
    "inputs": [{"internalType": "address", "name": "nftContract", "type": "address"}, {"internalType": "uint256", "name": "tokenId", "type": "uint256"}, {"internalType": "address", "name": "recipient", "type": "address"}],
    "name": "directTransferNFT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address[]", "name": "nftContracts", "type": "address[]"}, {"internalType": "uint256[]", "name": "tokenIds", "type": "uint256[]"}, {"internalType": "address[]", "name": "recipients", "type": "address[]"}],
    "name": "directBatchTransferNFTs",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

// ERC721 NFT ABI for approval
const NFT_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "from", "type": "address"}, {"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "transferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
]

class ContractService {
  constructor() {
    this.contractAddress = '0xd76B12D50192492ebB56bD226127eE799658fF0a' // Battle Royale Contract V2 (current)
    this.walletClient = null
    this.publicClient = null
    this.userAddress = null
    this.alchemy = null
    this._initialized = false
    
    // Price caching for ETH/USD
    this.priceCache = { price: null, timestamp: 0 }
    this.cacheDuration = 30000 // 30 seconds
    
    // Force refresh price on page visibility change (user switches tabs back)
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.priceCache.timestamp > 0) {
          // If user comes back to tab and cache is older than 10 seconds, refresh
          const age = Date.now() - this.priceCache.timestamp
          if (age > 10000) {
            console.log('🔄 Page became visible, refreshing ETH price cache')
            this.priceCache.timestamp = 0 // Force refresh on next call
          }
        }
      })
    }
  }

  async initialize(walletClient, publicClient) {
    if (this._initialized && this.walletClient === walletClient) {
      console.log('⚡ Contract service already initialized')
      return { success: true }
    }

    if (!walletClient || !publicClient) {
      console.error('❌ Missing required clients')
      return { success: false, error: 'Wallet or public client missing' }
    }

    try {
      this.walletClient = walletClient
      this.publicClient = publicClient
      this.userAddress = walletClient.account?.address

      if (!this.userAddress) {
        throw new Error('No address found in wallet client')
      }

      // Initialize Alchemy for NFT operations
      const apiKey = import.meta.env.VITE_ALCHEMY_API_KEY || 'hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3'
      this.alchemy = new Alchemy({
        apiKey,
        network: Network.BASE_MAINNET
      })

      this._initialized = true
      console.log('✅ Contract service initialized with address:', this.userAddress)
      return { success: true }
    } catch (error) {
      console.error('❌ Error initializing contract service:', error)
      return { success: false, error: error.message }
    }
  }

  isReady() {
    return this._initialized && this.walletClient && this.publicClient && this.userAddress
  }

  async ensureBaseNetwork() {
    const chainId = await this.walletClient.getChainId()
    if (chainId !== 8453) {
      throw new Error('Please switch to Base network')
    }
  }

  getGameIdBytes32(gameId) {
    // Convert string gameId to bytes32
    return ethers.encodeBytes32String(gameId.slice(0, 31))
  }

  // Approve NFT for transfer - FIXED VERSION
  async approveNFT(nftContract, tokenId) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('🔓 Approving NFT for transfer:', { nftContract, tokenId })
      
      // First check if we own the NFT
      const owner = await this.publicClient.readContract({
        address: nftContract,
        abi: NFT_ABI,
        functionName: 'ownerOf',
        args: [BigInt(tokenId)]
      })
      
      if (owner.toLowerCase() !== this.userAddress.toLowerCase()) {
        return { success: false, error: 'You do not own this NFT' }
      }
      
      // Approve the contract to transfer the NFT
      const hash = await this.walletClient.writeContract({
        address: nftContract,
        abi: NFT_ABI,
        functionName: 'approve',
        args: [this.contractAddress, BigInt(tokenId)], // Approve contract address, not tokenId
        chain: BASE_CHAIN,
        account: this.walletClient.account
      })

      console.log('🔓 NFT approval tx:', hash)
      
      const receipt = await this.publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 1,
        timeout: 60_000
      })
      
      console.log('✅ NFT approval confirmed')
      return { success: true, transactionHash: hash, receipt }
      
    } catch (error) {
      console.error('❌ Error approving NFT:', error)
      
      if (error.message?.includes('User rejected')) {
        return { success: false, error: 'Transaction cancelled by user' }
      }
      if (error.message?.includes('insufficient funds')) {
        return { success: false, error: 'Insufficient funds for gas' }
      }
      
      return { success: false, error: error.shortMessage || error.message }
    }
  }

  // Deposit NFT for a game - SIMPLIFIED VERSION
  async depositNFT(gameId, nftContract, tokenId) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('📦 Depositing NFT for game:', { gameId, nftContract, tokenId })
      
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      
      // Check if NFT is already deposited for this game
      console.log('🔍 Checking existing deposit for game:', gameIdBytes32)
      
      try {
        const existingDeposit = await this.publicClient.readContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'nftDeposits',
          args: [gameIdBytes32]
        })
        
        console.log('🔍 Existing deposit data:', existingDeposit)
        
        if (existingDeposit && existingDeposit[0] && existingDeposit[0] !== '0x0000000000000000000000000000000000000000') {
          console.log('⚠️ NFT already deposited for this game by:', existingDeposit[0])
          return { success: true, alreadyDeposited: true, transactionHash: 'already-deposited' }
        }
      } catch (checkError) {
        console.log('⚠️ Could not check existing deposit:', checkError)
        console.log('⚠️ Continuing with deposit...')
      }
      
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'depositNFT',
        args: [gameIdBytes32, nftContract, BigInt(tokenId)],
        chain: BASE_CHAIN,
        account: this.walletClient.account
      })
      
      console.log('📦 NFT deposit tx:', hash)
      
      const receipt = await this.publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 1,
        timeout: 60_000
      })
      
      console.log('✅ NFT deposit confirmed')
      
      // Verify the deposit was successful - wait a bit more for contract state to update
      console.log('🔍 Verifying NFT deposit...')
      
      // Wait a bit more for contract state to update
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Initialize verification flag outside the try-catch block
      let isVerified = false
      
      try {
        const verifyDeposit = await this.publicClient.readContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'nftDeposits',
          args: [gameIdBytes32]
        })
        
        console.log('🔍 Verification result:', verifyDeposit)
        
        // Check if the deposit was recorded - handle both array and object formats
        if (Array.isArray(verifyDeposit)) {
          // If it's an array, check the first element (depositor address)
          isVerified = verifyDeposit[0] && verifyDeposit[0] !== '0x0000000000000000000000000000000000000000'
          console.log('🔍 Array format - depositor:', verifyDeposit[0])
        } else if (verifyDeposit && typeof verifyDeposit === 'object') {
          // If it's an object, check the depositor field
          isVerified = verifyDeposit.depositor && verifyDeposit.depositor !== '0x0000000000000000000000000000000000000000'
          console.log('🔍 Object format - depositor:', verifyDeposit.depositor)
        }
        
        if (isVerified) {
          console.log('✅ NFT deposit verified successfully')
        } else {
          console.log('⚠️ NFT deposit verification failed - but transaction succeeded')
          console.log('⚠️ This might be a contract state sync issue or ABI mismatch')
          
          // Try alternative verification using isGameReady
          try {
            console.log('🔍 Trying alternative verification with isGameReady...')
            const gameReady = await this.publicClient.readContract({
              address: this.contractAddress,
              abi: CONTRACT_ABI,
              functionName: 'isGameReady',
              args: [gameIdBytes32]
            })
            console.log('🔍 isGameReady result:', gameReady)
            
            if (gameReady) {
              console.log('✅ Alternative verification successful - game is ready!')
              isVerified = true
            }
          } catch (altVerificationError) {
            console.log('⚠️ Alternative verification also failed:', altVerificationError)
          }
        }
      } catch (verificationError) {
        console.log('⚠️ Verification failed with error:', verificationError)
        console.log('⚠️ But transaction succeeded, so continuing...')
      }
      
      // Return success even if verification fails - transaction succeeded
      // The transaction receipt proves the deposit was successful
      return { 
        success: true, 
        transactionHash: hash, 
        receipt,
        verified: isVerified,
        message: isVerified ? 'NFT deposit verified' : 'NFT deposit successful (verification pending)'
      }
      
    } catch (error) {
      console.error('❌ Error depositing NFT:', error)
      
      if (error.message?.includes('NFT already deposited')) {
        return { success: false, error: 'NFT already deposited for this game' }
      }
      if (error.message?.includes('User rejected')) {
        return { success: false, error: 'Transaction cancelled by user' }
      }
      
      return { success: false, error: error.shortMessage || error.message }
    }
  }

  // Create game - approve and deposit NFT
  async createGame(gameId, nftContract, tokenId, priceInMicrodollars, paymentType = 0) {
    console.log('🎮 Creating game (approve + deposit NFT):', {
      gameId,
      nftContract,
      tokenId,
      priceInMicrodollars,
      paymentType
    })
    
    try {
      // First approve the NFT
      const approvalResult = await this.approveNFT(nftContract, tokenId)
      if (!approvalResult.success) {
        return approvalResult
      }
      
      // Then deposit the NFT
      const depositResult = await this.depositNFT(gameId, nftContract, tokenId)
      return depositResult
      
    } catch (error) {
      console.error('❌ Error creating game:', error)
      return { success: false, error: error.message }
    }
  }

  // Check if user has sufficient balance for deposit
  async checkDepositBalance(priceUSD) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      // Get ETH price and calculate required amount
      const ethPriceUSD = await this.getETHPriceUSD()
      const ethAmount = parseFloat(priceUSD) / ethPriceUSD
      const ethAmountRounded = Math.round(ethAmount * 1000000) / 1000000
      const ethAmountWei = ethers.parseEther(ethAmountRounded.toString())
      
      // Get user's current balance
      const balance = await this.publicClient.getBalance({
        address: this.walletClient.account.address
      })
      
      // Estimate gas cost (use a dummy game ID for estimation)
      const dummyGameId = '0x' + '0'.repeat(64)
      const gasEstimate = await this.publicClient.estimateContractGas({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'depositETH',
        args: [dummyGameId],
        value: ethAmountWei,
        account: this.walletClient.account
      })
      
      // Get current gas price
      const gasPrice = await this.publicClient.getGasPrice()
      const gasCost = gasEstimate * gasPrice
      
      // Add 20% buffer to gas estimate
      const totalGasCost = BigInt(Math.floor(Number(gasCost) * 1.2))
      const totalRequired = ethAmountWei + totalGasCost
      
      console.log('💰 Balance check:', {
        balance: balance.toString(),
        ethAmount: ethAmountWei.toString(),
        gasCost: gasCost.toString(),
        totalGasCost: totalGasCost.toString(),
        totalRequired: totalRequired.toString(),
        sufficient: balance >= totalRequired
      })
      
      return {
        success: true,
        sufficient: balance >= totalRequired,
        balance: balance.toString(),
        required: totalRequired.toString(),
        shortfall: balance < totalRequired ? (totalRequired - balance).toString() : '0',
        ethAmount: ethAmountRounded,
        gasCost: ethers.formatEther(totalGasCost)
      }
    } catch (error) {
      console.error('❌ Error checking balance:', error)
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
      
      // Check balance first
      const balanceCheck = await this.checkDepositBalance(priceUSD)
      if (!balanceCheck.success) {
        return { success: false, error: 'Failed to check balance: ' + balanceCheck.error }
      }
      
      if (!balanceCheck.sufficient) {
        const shortfallEth = ethers.formatEther(balanceCheck.shortfall)
        const requiredEth = ethers.formatEther(balanceCheck.required)
        const currentEth = ethers.formatEther(balanceCheck.balance)
        
        return { 
          success: false, 
          error: `Insufficient funds. You need ${requiredEth} ETH (${priceUSD} USD + gas fees) but only have ${currentEth} ETH. You need ${shortfallEth} ETH more.`,
          insufficientFunds: true,
          balance: currentEth,
          required: requiredEth,
          shortfall: shortfallEth
        }
      }
      
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      
      // Get ETH price from Chainlink or use a fallback
      const ethPriceUSD = await this.getETHPriceUSD()
      const ethAmount = parseFloat(priceUSD) / ethPriceUSD
      
      // Round to 6 decimal places to avoid precision issues
      const ethAmountRounded = Math.round(ethAmount * 1000000) / 1000000
      const ethAmountWei = ethers.parseEther(ethAmountRounded.toString())
      
      console.log('💰 Deposit details:', {
        priceUSD,
        ethPriceUSD,
        ethAmount,
        ethAmountRounded,
        ethAmountWei: ethAmountWei.toString(),
        gameIdBytes32
      })
      
      // Estimate gas first to avoid high gas costs
      const gasEstimate = await this.publicClient.estimateContractGas({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'depositETH',
        args: [gameIdBytes32],
        value: ethAmountWei,
        account: this.walletClient.account
      })
      
      console.log('💰 Gas estimate:', gasEstimate.toString())
      
      // Add 20% buffer to gas estimate
      const gasLimit = BigInt(Math.floor(Number(gasEstimate) * 1.2))
      
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'depositETH',
        args: [gameIdBytes32],
        value: ethAmountWei,
        gas: gasLimit,
        chain: BASE_CHAIN,
        account: this.walletClient.account
      })
      
      console.log('💰 ETH deposit tx:', hash)
      
      const receipt = await this.publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 1,
        timeout: 60_000
      })
      
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
      if (error.message?.includes('User rejected')) {
        return { success: false, error: 'Transaction cancelled by user' }
      }
      
      // Check for insufficient funds error
      if (error.message?.includes('insufficient funds') || error.message?.includes('exceeds the balance')) {
        return { 
          success: false, 
          error: 'Insufficient funds. You need more ETH to cover the deposit amount and gas fees.',
          insufficientFunds: true
        }
      }
      
      return { success: false, error: error.shortMessage || error.message }
    }
  }

  // Get ETH price in USD from Chainlink API with caching
  async getETHPriceUSD() {
    const now = Date.now()
    
    // Use cached price if it's still fresh (within 30 seconds)
    if (this.priceCache.price && (now - this.priceCache.timestamp) < this.cacheDuration) {
      console.log('💰 Using cached ETH price:', this.priceCache.price)
      return this.priceCache.price
    }

    try {
      console.log('💰 Fetching fresh ETH price from Chainlink API...')
      
      // Fetch from CoinGecko (free, reliable, uses Chainlink data)
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      const price = data.ethereum.usd
      
      if (!price || price <= 0) {
        throw new Error('Invalid price data received')
      }
      
      // Cache the fresh price
      this.priceCache = { price, timestamp: now }
      
      console.log('✅ Fresh ETH price fetched and cached:', price)
      return price
      
    } catch (error) {
      console.error('❌ Failed to fetch ETH price:', error.message)
      
      // Use cached price as fallback if available
      if (this.priceCache.price) {
        console.log('🔄 Using cached ETH price as fallback:', this.priceCache.price)
        return this.priceCache.price
      }
      
      // No hardcoded fallback - fail cleanly rather than use stale data
      throw new Error('Unable to fetch ETH price and no cached price available. Please try again.')
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

  // ADMIN METHODS - Added back for admin panel functionality

  // Get NFTs owned by contract using Alchemy
  async getContractOwnedNFTs() {
    if (!this.alchemy || !this.contractAddress) {
      return { success: false, error: 'Alchemy not initialized' }
    }

    try {
      console.log('🔍 Loading NFTs owned by contract:', this.contractAddress)
      
      let allNFTs = []
      let pageKey = null
      
      do {
        const nftsForOwner = await this.alchemy.nft.getNftsForOwner(this.contractAddress, {
          omitMetadata: false,
          pageKey: pageKey
        })
        
        if (nftsForOwner.ownedNfts && nftsForOwner.ownedNfts.length > 0) {
          allNFTs = [...allNFTs, ...nftsForOwner.ownedNfts]
        }
        
        pageKey = nftsForOwner.pageKey
      } while (pageKey)

      console.log('📦 Found NFTs owned by contract (Alchemy):', allNFTs.length)

      // Verify ownership on-chain to filter out stale data
      const verifiedNFTs = []
      
      for (const nft of allNFTs) {
        try {
          console.log(`🔍 Verifying ownership of ${nft.contract.address}:${nft.tokenId}...`)
          
          // Check actual ownership on blockchain
          const actualOwner = await this.publicClient.readContract({
            address: nft.contract.address,
            abi: NFT_ABI,
            functionName: 'ownerOf',
            args: [BigInt(nft.tokenId)]
          })
          
          console.log(`🔍 Actual owner: ${actualOwner}, Contract: ${this.contractAddress}`)
          
          if (actualOwner.toLowerCase() === this.contractAddress.toLowerCase()) {
            console.log(`✅ Contract actually owns ${nft.contract.address}:${nft.tokenId}`)
            
            let imageUrl = ''
            if (nft.media && nft.media.length > 0) {
              imageUrl = nft.media[0].gateway || nft.media[0].raw || ''
            } else if (nft.image) {
              imageUrl = nft.image.originalUrl || nft.image.cachedUrl || ''
            }
            if (!imageUrl && nft.metadata && nft.metadata.image) {
              imageUrl = nft.metadata.image
            }
            if (imageUrl && imageUrl.startsWith('ipfs://')) {
              imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')
            }
            if (imageUrl && imageUrl.startsWith('http://')) {
              imageUrl = imageUrl.replace('http://', 'https://')
            }
            
            verifiedNFTs.push({
              nftContract: nft.contract.address,
              tokenId: nft.tokenId,
              name: nft.title || nft.name || `NFT #${nft.tokenId}`,
              metadata: {
                ...nft.metadata,
                image: imageUrl
              },
              uniqueKey: `${nft.contract.address}-${nft.tokenId}`,
              source: 'alchemy_verified',
            })
          } else {
            console.log(`❌ Contract does NOT own ${nft.contract.address}:${nft.tokenId} (stale Alchemy data)`)
          }
        } catch (verifyError) {
          console.warn(`⚠️ Could not verify ownership of ${nft.contract.address}:${nft.tokenId}:`, verifyError.message)
          // Skip this NFT if we can't verify ownership
        }
      }

      console.log('📦 Verified NFTs actually owned by contract:', verifiedNFTs.length)
      return { success: true, nfts: verifiedNFTs }
    } catch (error) {
      console.error('❌ Error loading contract NFTs:', error)
      return { success: false, error: error.message }
    }
  }

  // Check if service is initialized
  get isInitialized() {
    return this._initialized
  }

  // Property getters for compatibility
  get currentChain() {
    return this.isReady() ? BASE_CHAIN : null
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
  set contract(value) { this.contractAddress = value }
  get account() { return this.userAddress }

  // Stub methods for compatibility
  async getListingFee() {
    return { success: true, fee: 0 }
  }

  async getPlatformFee() {
    return { success: true, fee: 3.5 }
  }

  async getGameDetails(gameId) {
    return await this.isGameReady(gameId)
  }

  // Get detailed game state
  async getGameState(gameId) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      
      // Get NFT deposit info
      const nftDeposit = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'nftDeposits',
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
        }
      }
      
      console.log(`🎮 Game ${gameId} state:`, gameState)
      return { success: true, gameState }
    } catch (error) {
      console.error('❌ Error getting game state:', error)
      return { success: false, error: error.message }
    }
  }

  // ADMIN WITHDRAWAL METHODS - Added back for admin panel functionality

  // Admin batch withdraw NFTs
  async adminBatchWithdrawNFTs(nftContracts, tokenIds, recipients) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('📦 Using DIRECT NFT transfer (bypasses game system):', { nftContracts, tokenIds, recipients })
      
      // BULLETPROOF APPROACH: Use direct NFT transfer that bypasses the game system entirely
      // This works for ANY NFT owned by the contract, regardless of game state
      
      if (nftContracts.length === 1) {
        // Single NFT - use directTransferNFT
        console.log('📦 Transferring single NFT directly...')
        console.log('📦 Transfer details:', {
          nftContract: nftContracts[0],
          tokenId: tokenIds[0],
          recipient: recipients[0],
          contractAddress: this.contractAddress
        })
        
        let hash
        try {
          hash = await this.walletClient.writeContract({
            address: this.contractAddress,
            abi: CONTRACT_ABI,
            functionName: 'directTransferNFT',
            args: [nftContracts[0], BigInt(tokenIds[0]), recipients[0]],
            chain: BASE_CHAIN,
            account: this.walletClient.account,
            gas: 200000n // Increased gas limit
          })
          console.log('📦 Transaction hash received:', hash)
        } catch (writeError) {
          console.error('❌ Error writing contract transaction:', writeError)
          return { success: false, error: `Transaction failed: ${writeError.message}` }
        }
        
        // Wait for confirmation
        let receipt
        try {
          console.log('⏳ Waiting for transaction confirmation...')
          receipt = await this.publicClient.waitForTransactionReceipt({ 
            hash,
            confirmations: 1,
            timeout: 120_000 // Increased timeout
          })
          console.log('✅ Transaction confirmed:', receipt.status)
          
          if (receipt.status === 'reverted') {
            console.error('❌ Transaction was reverted!')
            return { success: false, error: 'Transaction was reverted by the contract' }
          }
          
        } catch (receiptError) {
          console.error('❌ Error waiting for receipt:', receiptError)
          return { success: false, error: `Transaction confirmation failed: ${receiptError.message}` }
        }
        
        console.log('✅ Direct NFT transfer successful:', hash)
        
        // Verify the transfer by checking the new owner
        try {
          console.log('🔍 Verifying NFT transfer...')
          await new Promise(resolve => setTimeout(resolve, 3000)) // Wait for state to update
          
          const newOwner = await this.publicClient.readContract({
            address: nftContracts[0],
            abi: NFT_ABI,
            functionName: 'ownerOf',
            args: [BigInt(tokenIds[0])]
          })
          
          console.log('🔍 NFT owner after transfer:', newOwner)
          console.log('🔍 Expected recipient:', recipients[0])
          
          if (newOwner.toLowerCase() === recipients[0].toLowerCase()) {
            console.log('✅ NFT transfer verified successfully!')
          } else {
            console.warn('⚠️ NFT transfer verification failed - owner mismatch')
          }
        } catch (verifyError) {
          console.warn('⚠️ Could not verify NFT transfer:', verifyError.message)
        }
        
        return { 
          success: true, 
          transactionHash: hash,
          receipt,
          message: `Successfully transferred NFT ${nftContracts[0]}:${tokenIds[0]}`
        }
        
      } else {
        // Multiple NFTs - use directBatchTransferNFTs
        console.log('📦 Transferring multiple NFTs directly...')
        
        let hash
        try {
          console.log('📦 Batch transfer details:', {
            nftContracts,
            tokenIds: tokenIds.map(id => BigInt(id)),
            recipients,
            contractAddress: this.contractAddress
          })
          
          hash = await this.walletClient.writeContract({
            address: this.contractAddress,
            abi: CONTRACT_ABI,
            functionName: 'directBatchTransferNFTs',
            args: [nftContracts, tokenIds.map(id => BigInt(id)), recipients],
            chain: BASE_CHAIN,
            account: this.walletClient.account,
            gas: 500000n // Increased gas limit for batch transfer
          })
          console.log('📦 Batch transaction hash received:', hash)
        } catch (writeError) {
          console.error('❌ Batch transfer failed:', writeError.message)
          
          // Check if this is an "internal error" - usually means the contract doesn't own the NFTs
          if (writeError.message.includes('internal error') || writeError.message.includes('InternalRpcError')) {
            console.log('🔄 Internal error detected - trying individual transfers as fallback...')
            
            const results = []
            
            for (let i = 0; i < nftContracts.length; i++) {
              try {
                console.log(`📦 Transferring NFT ${i + 1}/${nftContracts.length}: ${nftContracts[i]}:${tokenIds[i]}`)
                
                // First check if the contract actually owns this NFT
                const owner = await this.publicClient.readContract({
                  address: nftContracts[i],
                  abi: NFT_ABI,
                  functionName: 'ownerOf',
                  args: [BigInt(tokenIds[i])]
                })
                
                console.log(`🔍 NFT ${nftContracts[i]}:${tokenIds[i]} owner:`, owner)
                console.log(`🔍 Contract address:`, this.contractAddress)
                
                if (owner.toLowerCase() !== this.contractAddress.toLowerCase()) {
                  console.warn(`⚠️ Contract doesn't own NFT ${nftContracts[i]}:${tokenIds[i]} - skipping`)
                  results.push({
                    success: false,
                    error: 'Contract does not own this NFT',
                    nft: `${nftContracts[i]}:${tokenIds[i]}`
                  })
                  continue
                }
                
                const individualHash = await this.walletClient.writeContract({
                  address: this.contractAddress,
                  abi: CONTRACT_ABI,
                  functionName: 'directTransferNFT',
                  args: [nftContracts[i], BigInt(tokenIds[i]), recipients[i]],
                  chain: BASE_CHAIN,
                  account: this.walletClient.account,
                  gas: 200000n
                })
                
                // Wait for confirmation
                const receipt = await this.publicClient.waitForTransactionReceipt({ 
                  hash: individualHash,
                  confirmations: 1,
                  timeout: 60_000
                })
                
                if (receipt.status === 'reverted') {
                  console.error(`❌ Individual transfer reverted for ${nftContracts[i]}:${tokenIds[i]}`)
                  results.push({
                    success: false,
                    error: 'Transaction reverted',
                    nft: `${nftContracts[i]}:${tokenIds[i]}`
                  })
                } else {
                  results.push({
                    success: true,
                    hash: individualHash,
                    nft: `${nftContracts[i]}:${tokenIds[i]}`
                  })
                  console.log(`✅ Individual transfer successful: ${individualHash}`)
                }
                
                // Wait a bit between transfers
                await new Promise(resolve => setTimeout(resolve, 2000))
                
              } catch (individualError) {
                console.error(`❌ Individual transfer failed for ${nftContracts[i]}:${tokenIds[i]}:`, individualError.message)
                results.push({
                  success: false,
                  error: individualError.message,
                  nft: `${nftContracts[i]}:${tokenIds[i]}`
                })
              }
            }
            
            const successfulTransfers = results.filter(r => r.success)
            const failedTransfers = results.filter(r => !r.success)
            
            return {
              success: successfulTransfers.length > 0,
              message: `Individual transfers: ${successfulTransfers.length} successful, ${failedTransfers.length} failed`,
              results: results
            }
          }
          
          // For other types of errors, return the error
          return { success: false, error: `Batch transfer failed: ${writeError.message}` }
        }
        
        // If we have a valid hash, wait for confirmation
        if (hash) {
          let receipt
          try {
            console.log('⏳ Waiting for batch transaction confirmation...')
            receipt = await this.publicClient.waitForTransactionReceipt({ 
              hash,
              confirmations: 1,
              timeout: 120_000 // Increased timeout
            })
            console.log('✅ Batch transaction confirmed:', receipt.status)
            
            if (receipt.status === 'reverted') {
              console.error('❌ Batch transaction was reverted!')
              return { success: false, error: 'Batch transaction was reverted by the contract' }
            }
            
          } catch (receiptError) {
            console.error('❌ Error waiting for batch receipt:', receiptError)
            return { success: false, error: `Batch transaction confirmation failed: ${receiptError.message}` }
          }
          
          console.log('✅ Direct batch NFT transfer successful:', hash)
          return { 
            success: true, 
            transactionHash: hash,
            receipt,
            message: `Successfully transferred ${nftContracts.length} NFTs`
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error in direct NFT transfer:', error)
      
      // Check if this is an RPC error but we might have a transaction hash
      const errorMessage = error.message || error.toString()
      const hashMatch = errorMessage.match(/0x[a-fA-F0-9]{64}/)
      
      if (hashMatch) {
        const extractedHash = hashMatch[0]
        // Validate that this looks like a real transaction hash
        if (extractedHash.length === 66 && extractedHash.startsWith('0x')) {
          console.log('🔍 Found valid transaction hash in error, transaction may have succeeded:', extractedHash)
          return { 
            success: true, 
            transactionHash: extractedHash,
            message: `Transaction sent (hash: ${extractedHash}) but RPC returned error. Check blockchain explorer to confirm.`
          }
        } else {
          console.log('⚠️ Found hash-like string but it appears invalid:', extractedHash)
        }
      }
      
      return { success: false, error: error.message }
    }
  }

  // Emergency withdraw NFT for a specific game
  async emergencyWithdrawNFT(gameId, recipient) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('🚨 Emergency withdrawing NFT for game:', gameId, 'to recipient:', recipient)
      
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      
      // Check if NFT deposit exists and is valid
      try {
        const nftDepositData = await this.publicClient.readContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'nftDeposits',
          args: [gameIdBytes32]
        })
        console.log('🔍 NFT deposit data for game:', {
          gameId,
          gameIdBytes32,
          depositData: nftDepositData
        })
        
        // Parse the deposit data to understand the issue
        if (nftDepositData && Array.isArray(nftDepositData) && nftDepositData.length >= 4) {
          const [depositor, nftContract, tokenId, claimed] = nftDepositData
          console.log('🔍 Parsed NFT deposit details:', {
            depositor,
            nftContract,
            tokenId: tokenId?.toString(),
            claimed,
            depositorIsZero: depositor === '0x0000000000000000000000000000000000000000',
            alreadyClaimed: claimed === true
          })
          
          if (depositor === '0x0000000000000000000000000000000000000000') {
            console.error('❌ NFT deposit not found: depositor is zero address')
            return { success: false, error: 'NFT deposit not found in contract' }
          }
          
          if (claimed === true) {
            console.error('❌ NFT already claimed: cannot withdraw again')
            return { success: false, error: 'NFT already claimed/withdrawn' }
          }
        }
      } catch (e) {
        console.warn('⚠️ Could not read NFT deposit data:', e.message)
      }
      
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'emergencyWithdrawNFT',
        args: [gameIdBytes32, recipient],
        chain: BASE_CHAIN,
        account: this.walletClient.account,
        gas: 150000n  // Set reasonable gas limit slightly higher for emergency withdraw
      })
      
      console.log('🚨 Emergency NFT withdraw tx:', hash)
      const receipt = await this.publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 1,
        timeout: 60_000
      })
      console.log('✅ Emergency NFT withdraw confirmed')

      return { success: true, transactionHash: hash, receipt }
    } catch (error) {
      console.error('❌ Error emergency withdrawing NFT:', error)
      return { success: false, error: error.message }
    }
  }

  // Emergency withdraw ETH for a specific game
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
        chain: BASE_CHAIN,
        account: this.walletClient.account
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

  // Emergency withdraw USDC for a specific game
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
        chain: BASE_CHAIN,
        account: this.walletClient.account
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

  // Winner withdrawal function - calls the new contract withdrawWinnings function
  async withdrawWinnings(gameId) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('🏆 Winner withdrawing winnings for game:', gameId)
      
      const winnerAddress = this.walletClient.account.address
      console.log('🏆 Winner address:', winnerAddress)
      
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'withdrawWinnings',
        args: [gameIdBytes32],
        chain: BASE_CHAIN,
        account: this.walletClient.account
      })
      
      console.log('🏆 Winner withdrawal tx:', hash)
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      console.log('✅ Winner withdrawal confirmed')

      return { 
        success: true, 
        transactionHash: hash,
        receipt,
        message: 'Successfully withdrew both NFT and crypto!'
      }
      
    } catch (error) {
      console.error('❌ Error withdrawing winnings:', error)
      return { success: false, error: error.message }
    }
  }

  // Get ETH amount for a given USD amount
  async getETHAmount(usdAmount) {
    if (!this.isReady()) {
      throw new Error('Contract service not initialized')
    }

    try {
      const ethPriceUSD = await this.getETHPriceUSD()
      const ethAmount = parseFloat(usdAmount) / ethPriceUSD
      
      // Round to 6 decimal places to avoid precision issues
      const ethAmountRounded = Math.round(ethAmount * 1000000) / 1000000
      const ethAmountWei = ethers.parseEther(ethAmountRounded.toString())
      
      return ethAmountWei
    } catch (error) {
      console.error('❌ Error calculating ETH amount:', error)
      throw error
    }
  }

  // Helper method to find game IDs
  async findGameIdsOptimized(nftContracts, tokenIds) {
    const gameIds = []
    
    try {
      const response = await fetch('/api/admin/games')
      if (!response.ok) {
        console.warn('Could not fetch games from database')
        return []
      }
      
      const data = await response.json()
      const games = data.games || []
      
      console.log(`🔍 Searching ${games.length} games for NFT matches...`)
      
      for (let i = 0; i < nftContracts.length; i++) {
        const targetContract = nftContracts[i].toLowerCase()
        const targetTokenId = tokenIds[i].toString()
        
        let foundGameId = null
        
        for (const game of games) {
          if (game.nft_token_id && game.nft_token_id.toString() === targetTokenId) {
            if (!game.nft_contract || game.nft_contract.toLowerCase() === targetContract) {
              foundGameId = game.id.toString()
              console.log(`✅ Found NFT ${targetContract}:${targetTokenId} in game ${foundGameId}`)
              break
            }
          }
        }
        
        gameIds.push(foundGameId)
        
        if (!foundGameId) {
          console.warn(`⚠️ Could not find game ID for NFT ${targetContract}:${targetTokenId}`)
        }
      }
      
      return gameIds
    } catch (error) {
      console.error('❌ Error finding game IDs:', error)
      return []
    }
  }

  // ===== BATTLE ROYALE FUNCTIONS =====

  // Create Battle Royale game
  async createBattleRoyale(gameId, nftContract, tokenId, entryFee, serviceFee, isUnder20, minUnder20Wei) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('🏆 Creating Battle Royale game:', gameId)
      
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      
      // First approve NFT transfer
      console.log('🔐 Approving NFT transfer...')
      const approvalResult = await this.approveNFT(nftContract, tokenId)
      if (!approvalResult.success) {
        throw new Error('NFT approval failed: ' + approvalResult.error)
      }
      console.log('✅ NFT approval successful:', approvalResult.transactionHash)
      
      // Create Battle Royale on contract
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'createBattleRoyale',
        args: [gameIdBytes32, nftContract, BigInt(tokenId), BigInt(entryFee), BigInt(serviceFee), Boolean(isUnder20), BigInt(minUnder20Wei)],
        chain: BASE_CHAIN,
        account: this.walletClient.account
      })
      
      console.log('🏆 Battle Royale creation tx:', hash)
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      console.log('✅ Battle Royale created successfully')

      return { success: true, transactionHash: hash, receipt }
    } catch (error) {
      console.error('❌ Error creating Battle Royale:', error)
      return { success: false, error: error.message }
    }
  }

  // Join Battle Royale game
  async joinBattleRoyale(gameId, entryAmount) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('🎮 Joining Battle Royale game:', gameId)
      
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      const entryAmountWei = ethers.parseEther(entryAmount.toString())
      
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'joinBattleRoyale',
        args: [gameIdBytes32],
        value: entryAmountWei,
        chain: BASE_CHAIN,
        account: this.walletClient.account
      })
      
      console.log('🎮 Battle Royale join tx:', hash)
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      console.log('✅ Joined Battle Royale successfully')

      return { success: true, transactionHash: hash, receipt }
    } catch (error) {
      console.error('❌ Error joining Battle Royale:', error)
      return { success: false, error: error.message }
    }
  }

  // Complete Battle Royale (admin only)
  async completeBattleRoyale(gameId, winnerAddress) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('🏆 Completing Battle Royale game:', gameId, 'Winner:', winnerAddress)
      
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'completeBattleRoyale',
        args: [gameIdBytes32, winnerAddress],
        chain: BASE_CHAIN,
        account: this.walletClient.account
      })
      
      console.log('🏆 Battle Royale completion tx:', hash)
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      console.log('✅ Battle Royale completed successfully')

      return { success: true, transactionHash: hash, receipt }
    } catch (error) {
      console.error('❌ Error completing Battle Royale:', error)
      return { success: false, error: error.message }
    }
  }

  // Withdraw creator funds from Battle Royale
  async withdrawBattleRoyaleCreatorFunds(gameId) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('💰 Withdrawing Battle Royale creator funds for game:', gameId)
      
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'withdrawCreatorFunds',
        args: [gameIdBytes32],
        chain: BASE_CHAIN,
        account: this.walletClient.account
      })
      
      console.log('💰 Creator funds withdrawal tx:', hash)
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      console.log('✅ Creator funds withdrawn successfully')

      return { success: true, transactionHash: hash, receipt }
    } catch (error) {
      console.error('❌ Error withdrawing creator funds:', error)
      return { success: false, error: error.message }
    }
  }

  // Withdraw winner NFT from Battle Royale
  async withdrawBattleRoyaleWinnerNFT(gameId) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('🏆 Withdrawing Battle Royale winner NFT for game:', gameId)
      
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'withdrawWinnerNFT',
        args: [gameIdBytes32],
        chain: BASE_CHAIN,
        account: this.walletClient.account
      })
      
      console.log('🏆 Winner NFT withdrawal tx:', hash)
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      console.log('✅ Winner NFT withdrawn successfully')

      return { success: true, transactionHash: hash, receipt }
    } catch (error) {
      console.error('❌ Error withdrawing winner NFT:', error)
      return { success: false, error: error.message }
    }
  }

  // Reclaim NFT from cancelled Battle Royale (creator only)
  async reclaimBattleRoyaleNFT(gameId) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('🔙 Reclaiming NFT from cancelled Battle Royale game:', gameId)
      
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'reclaimBattleRoyaleNFT',
        args: [gameIdBytes32],
        chain: BASE_CHAIN,
        account: this.walletClient.account
      })
      
      console.log('🔙 NFT reclaim tx:', hash)
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      console.log('✅ NFT reclaimed successfully')

      return { success: true, transactionHash: hash, receipt }
    } catch (error) {
      console.error('❌ Error reclaiming NFT:', error)
      return { success: false, error: error.message }
    }
  }

  // Cancel Battle Royale game (creator only)
  async cancelBattleRoyale(gameId) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('❌ Cancelling Battle Royale game:', gameId)
      
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'cancelBattleRoyale',
        args: [gameIdBytes32],
        chain: BASE_CHAIN,
        account: this.walletClient.account
      })
      
      console.log('❌ Game cancellation tx:', hash)
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      console.log('✅ Game cancelled successfully')

      return { success: true, transactionHash: hash, receipt }
    } catch (error) {
      console.error('❌ Error cancelling game:', error)
      return { success: false, error: error.message }
    }
  }

  // Player withdraws their entry fee
  async withdrawBattleRoyaleEntry(gameId) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('💸 Withdrawing Battle Royale entry fee for game:', gameId)
      
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'withdrawBattleRoyaleEntry',
        args: [gameIdBytes32],
        chain: BASE_CHAIN,
        account: this.walletClient.account
      })
      
      console.log('💸 Entry withdrawal tx:', hash)
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      console.log('✅ Entry fee withdrawn successfully')

      return { success: true, transactionHash: hash, receipt }
    } catch (error) {
      console.error('❌ Error withdrawing entry:', error)
      return { success: false, error: error.message }
    }
  }

  // Check if player can withdraw entry (view function)
  async canWithdrawEntry(gameId, playerAddress) {
    if (!this.isReady()) {
      return { success: false, canWithdraw: false, error: 'Contract service not initialized' }
    }

    try {
      const gameIdBytes32 = this.getGameIdBytes32(gameId)
      
      const canWithdraw = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'canWithdrawEntry',
        args: [gameIdBytes32, playerAddress]
      })
      
      return { success: true, canWithdraw }
    } catch (error) {
      console.error('❌ Error checking withdraw eligibility:', error)
      return { success: false, canWithdraw: false, error: error.message }
    }
  }
}

// Export singleton instance
const contractService = new ContractService()
export default contractService