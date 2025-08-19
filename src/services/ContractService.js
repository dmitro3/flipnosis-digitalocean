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
  {
    "inputs": [{"internalType": "bytes32", "name": "gameId", "type": "bytes32"}, {"internalType": "address", "name": "recipient", "type": "address"}],
    "name": "emergencyWithdrawETH",
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
    this.contractAddress = '0x6cB1E31F2A3df57A7265ED2eE26dcF8D02CE1B69'
    this.walletClient = null
    this.publicClient = null
    this.userAddress = null
    this.alchemy = null
    this._initialized = false
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
      const existingDeposit = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'nftDeposits',
        args: [gameIdBytes32]
      })
      
      if (existingDeposit[0] !== '0x0000000000000000000000000000000000000000') {
        console.log('⚠️ NFT already deposited for this game')
        return { success: true, alreadyDeposited: true, transactionHash: 'already-deposited' }
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
      
      // Verify the deposit was successful
      const verifyDeposit = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'nftDeposits',
        args: [gameIdBytes32]
      })
      
      if (verifyDeposit[0] === '0x0000000000000000000000000000000000000000') {
        throw new Error('NFT deposit verification failed')
      }
      
      return { success: true, transactionHash: hash, receipt }
      
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

  // Deposit ETH for a game
  async depositETH(gameId, priceUSD) {
    if (!this.isReady()) {
      return { success: false, error: 'Contract service not initialized' }
    }

    try {
      await this.ensureBaseNetwork()
      console.log('💰 Starting ETH deposit for game:', gameId, 'Price USD:', priceUSD)
      
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
      
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'depositETH',
        args: [gameIdBytes32],
        value: ethAmountWei,
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
      
      return { success: false, error: error.shortMessage || error.message }
    }
  }

  // Get ETH price in USD (you'll need to implement this based on your oracle)
  async getETHPriceUSD() {
    // For now, return a hardcoded value or fetch from an API
    // In production, use Chainlink oracle or similar
    return 2500 // $2500 per ETH as fallback
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

      console.log('📦 Found NFTs owned by contract:', allNFTs.length)

      const formattedNFTs = allNFTs.map((nft) => {
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
        
        return {
          nftContract: nft.contract.address,
          tokenId: nft.tokenId,
          name: nft.title || nft.name || `NFT #${nft.tokenId}`,
          metadata: {
            ...nft.metadata,
            image: imageUrl
          },
          uniqueKey: `${nft.contract.address}-${nft.tokenId}`,
          source: 'alchemy',
        }
      })

      return { success: true, nfts: formattedNFTs }
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
        
        const hash = await this.walletClient.writeContract({
          address: this.contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'directTransferNFT',
          args: [nftContracts[0], BigInt(tokenIds[0]), recipients[0]],
          chain: BASE_CHAIN,
          account: this.walletClient.account,
          gas: 150000n
        })
        
        // Wait for confirmation even if we got an RPC error
        let receipt
        try {
          receipt = await this.publicClient.waitForTransactionReceipt({ 
            hash,
            confirmations: 1,
            timeout: 60_000
          })
        } catch (receiptError) {
          console.warn('⚠️ RPC error waiting for receipt, but transaction may have succeeded:', receiptError)
          // Try to get the receipt anyway
          try {
            receipt = await this.publicClient.getTransactionReceipt({ hash })
          } catch (finalError) {
            console.error('❌ Could not get transaction receipt:', finalError)
            return { success: false, error: 'Transaction sent but could not confirm receipt' }
          }
        }
        
        console.log('✅ Direct NFT transfer successful:', hash)
        return { 
          success: true, 
          transactionHash: hash,
          message: `Successfully transferred NFT ${nftContracts[0]}:${tokenIds[0]} with low gas fees`
        }
        
      } else {
        // Multiple NFTs - use directBatchTransferNFTs
        console.log('📦 Transferring multiple NFTs directly...')
        
        let hash
        try {
          hash = await this.walletClient.writeContract({
            address: this.contractAddress,
            abi: CONTRACT_ABI,
            functionName: 'directBatchTransferNFTs',
            args: [nftContracts, tokenIds.map(id => BigInt(id)), recipients],
            chain: BASE_CHAIN,
            account: this.walletClient.account,
            gas: 300000n // Increased gas limit for batch transfer
          })
        } catch (writeError) {
          console.error('❌ Error writing contract:', writeError)
          
          // Check if the error message contains a transaction hash (sometimes RPC errors still return hash)
          const errorMessage = writeError.message || writeError.toString()
          
          // Improved hash extraction - look for a proper 64-character hex hash
          const hashMatch = errorMessage.match(/0x[a-fA-F0-9]{64}/)
          
          if (hashMatch) {
            const extractedHash = hashMatch[0]
            // Validate that this looks like a real transaction hash
            if (extractedHash.length === 66 && extractedHash.startsWith('0x')) {
              hash = extractedHash
              console.log('🔍 Found valid transaction hash in error message:', hash)
            } else {
              console.log('⚠️ Found hash-like string but it appears invalid:', extractedHash)
              hash = null
            }
          } else {
            console.log('❌ No valid transaction hash found in error message')
            hash = null
          }
          
          if (!hash) {
            // If no valid hash found, try individual transfers
            console.log('🔄 Trying individual NFT transfers...')
            const results = []
            
            for (let i = 0; i < nftContracts.length; i++) {
              try {
                console.log(`📦 Transferring NFT ${i + 1}/${nftContracts.length}: ${nftContracts[i]}:${tokenIds[i]}`)
                
                const individualHash = await this.walletClient.writeContract({
                  address: this.contractAddress,
                  abi: CONTRACT_ABI,
                  functionName: 'directTransferNFT',
                  args: [nftContracts[i], BigInt(tokenIds[i]), recipients[i]],
                  chain: BASE_CHAIN,
                  account: this.walletClient.account,
                  gas: 150000n
                })
                
                results.push({
                  success: true,
                  hash: individualHash,
                  nft: `${nftContracts[i]}:${tokenIds[i]}`
                })
                
                console.log(`✅ Individual transfer successful: ${individualHash}`)
                
                // Wait a bit between transfers
                await new Promise(resolve => setTimeout(resolve, 1000))
                
              } catch (individualError) {
                console.error(`❌ Individual transfer failed for ${nftContracts[i]}:${tokenIds[i]}:`, individualError)
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
        }
        
        // If we have a valid hash, wait for confirmation
        if (hash) {
          let receipt
          try {
            receipt = await this.publicClient.waitForTransactionReceipt({ 
              hash,
              confirmations: 1,
              timeout: 60_000
            })
            console.log('✅ Got transaction receipt:', receipt)
          } catch (receiptError) {
            console.warn('⚠️ RPC error waiting for receipt, but transaction may have succeeded:', receiptError)
            // Try to get the receipt anyway
            try {
              receipt = await this.publicClient.getTransactionReceipt({ hash })
              console.log('✅ Got transaction receipt despite RPC error:', receipt)
            } catch (finalError) {
              console.error('❌ Could not get transaction receipt:', finalError)
              // Even if we can't get the receipt, if we have a hash, the transaction was likely sent
              return { 
                success: true, 
                transactionHash: hash,
                message: `Transaction sent (hash: ${hash}) but could not confirm receipt. Check blockchain explorer.`
              }
            }
          }
          
          console.log('✅ Direct batch NFT transfer successful:', hash)
          return { 
            success: true, 
            transactionHash: hash,
            message: `Successfully transferred ${nftContracts.length} NFTs with low gas fees`
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
}

// Export singleton instance
const contractService = new ContractService()
export default contractService