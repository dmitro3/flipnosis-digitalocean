const sqlite3 = require('sqlite3').verbose()
const { createPublicClient, http } = require('viem')
const { base } = require('viem/chains')
const path = require('path')

// Contract configuration
const CONTRACT_ADDRESS = "0x3997F4720B3a515e82d54F30d7CF2993B014EeBE"
const CONTRACT_ABI = [
  {
    name: 'getGameDetails',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'gameId', type: 'uint256' }],
    outputs: [
      { name: 'gameId_', type: 'uint256' },
      { name: 'creator_', type: 'address' },
      { name: 'joiner_', type: 'address' },
      { name: 'nftContract_', type: 'address' },
      { name: 'tokenId_', type: 'uint256' },
      { name: 'state_', type: 'uint8' },
      { name: 'gameType_', type: 'uint8' },
      { name: 'price_', type: 'uint256' }
    ]
  },
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }]
  }
]

// ERC721 ABI for NFT checks
const ERC721_ABI = [
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }]
  },
  {
    name: 'isApprovedForAll',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'operator', type: 'address' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'getApproved',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }]
  }
]

class DiagnosticChecker {
  constructor() {
    this.db = null
    this.client = createPublicClient({
      chain: base,
      transport: http('https://mainnet.base.org')
    })
    this.issues = []
    this.stats = {
      totalListings: 0,
      totalGames: 0,
      listingsWithContractId: 0,
      gamesWithContractId: 0,
      blockchainGamesExist: 0,
      nftsInContract: 0,
      nftsApproved: 0,
      issues: 0
    }
  }

  async initialize() {
    console.log('🔍 Starting diagnostic check...')
    console.log('📅', new Date().toISOString())
    
    // Open database
    const dbPath = path.join(__dirname, '..', 'server', 'games.db')
    this.db = new sqlite3.Database(dbPath)
    
    // Check if contract_game_id column exists
    await this.checkDatabaseSchema()
    
    console.log('✅ Database opened successfully')
  }

  async checkDatabaseSchema() {
    return new Promise((resolve, reject) => {
      this.db.all("PRAGMA table_info(game_listings)", [], (err, columns) => {
        if (err) {
          console.error('❌ Error checking database schema:', err)
          reject(err)
          return
        }
        
        const columnNames = columns.map(col => col.name)
        console.log('📋 Current columns:', columnNames.join(', '))
        
        const missingColumns = []
        
        // Check for required columns
        if (!columnNames.includes('contract_game_id')) {
          missingColumns.push('contract_game_id')
        }
        if (!columnNames.includes('transaction_hash')) {
          missingColumns.push('transaction_hash')
        }
        
        if (missingColumns.length > 0) {
          console.log('⚠️ Database schema is outdated - missing columns:', missingColumns.join(', '))
          console.log('🔄 Attempting to add missing columns...')
          
          const addColumnPromises = missingColumns.map(column => {
            return new Promise((resolve, reject) => {
              this.db.run(`ALTER TABLE game_listings ADD COLUMN ${column} TEXT`, (err) => {
                if (err) {
                  console.error(`❌ Failed to add ${column} column:`, err)
                  reject(err)
                } else {
                  console.log(`✅ Successfully added ${column} column`)
                  resolve()
                }
              })
            })
          })
          
          Promise.all(addColumnPromises)
            .then(() => resolve())
            .catch(reject)
        } else {
          console.log('✅ Database schema is up to date')
          resolve()
        }
      })
    })
  }

  async checkListings() {
    console.log('\n📋 Checking listings...')
    
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          id, 
          creator, 
          nft_contract, 
          nft_token_id, 
          nft_name,
          asking_price,
          contract_game_id,
          transaction_hash,
          status,
          created_at
        FROM game_listings 
        ORDER BY created_at DESC
      `, [], async (err, listings) => {
        if (err) {
          console.error('❌ Error fetching listings:', err)
          reject(err)
          return
        }

        this.stats.totalListings = listings.length
        console.log(`📊 Found ${listings.length} listings`)

        for (const listing of listings) {
          console.log(`\n🔍 Checking listing ${listing.id}:`)
          console.log(`   Creator: ${listing.creator}`)
          console.log(`   NFT: ${listing.nft_contract} #${listing.nft_token_id}`)
          console.log(`   Status: ${listing.status}`)
          console.log(`   Contract Game ID: ${listing.contract_game_id || 'NOT SET'}`)

          if (listing.contract_game_id) {
            this.stats.listingsWithContractId++
            await this.checkBlockchainGame(listing.contract_game_id, listing)
          } else {
            this.issues.push({
              type: 'missing_contract_game_id',
              listing: listing.id,
              message: 'Listing has no contract_game_id'
            })
            this.stats.issues++
          }
        }

        resolve()
      })
    })
  }

  async checkGames() {
    console.log('\n🎮 Checking games...')
    
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          id, 
          creator, 
          joiner, 
          nft_contract, 
          nft_token_id, 
          contract_game_id,
          status,
          created_at
        FROM games 
        ORDER BY created_at DESC
      `, [], async (err, games) => {
        if (err) {
          console.error('❌ Error fetching games:', err)
          reject(err)
          return
        }

        this.stats.totalGames = games.length
        console.log(`📊 Found ${games.length} games`)

        for (const game of games) {
          console.log(`\n🔍 Checking game ${game.id}:`)
          console.log(`   Creator: ${game.creator}`)
          console.log(`   Joiner: ${game.joiner}`)
          console.log(`   NFT: ${game.nft_contract} #${game.nft_token_id}`)
          console.log(`   Status: ${game.status}`)
          console.log(`   Contract Game ID: ${game.contract_game_id || 'NOT SET'}`)

          if (game.contract_game_id) {
            this.stats.gamesWithContractId++
            await this.checkBlockchainGame(game.contract_game_id, game)
          } else {
            this.issues.push({
              type: 'missing_contract_game_id',
              game: game.id,
              message: 'Game has no contract_game_id'
            })
            this.stats.issues++
          }
        }

        resolve()
      })
    })
  }

  async checkBlockchainGame(contractGameId, item) {
    try {
      console.log(`   🔗 Checking blockchain game ${contractGameId}...`)
      
      // Check if game exists on blockchain
      const gameDetails = await this.client.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getGameDetails',
        args: [BigInt(contractGameId)]
      })

      if (gameDetails) {
        this.stats.blockchainGamesExist++
        console.log(`   ✅ Blockchain game exists`)
        console.log(`   📋 Game details:`, {
          gameId: gameDetails[0].toString(),
          creator: gameDetails[1],
          joiner: gameDetails[2],
          nftContract: gameDetails[3],
          tokenId: gameDetails[4].toString(),
          state: gameDetails[5].toString(),
          gameType: gameDetails[6].toString(),
          price: gameDetails[7].toString()
        })

        // Check if NFT is owned by contract
        await this.checkNFTOwnership(gameDetails[3], gameDetails[4], contractGameId)
        
        // Check if NFT is approved for contract
        await this.checkNFTApproval(gameDetails[3], gameDetails[4], contractGameId)
      }
    } catch (error) {
      console.log(`   ❌ Blockchain game does not exist or error:`, error.message)
      this.issues.push({
        type: 'blockchain_game_missing',
        contractGameId,
        item: item.id,
        message: `Blockchain game ${contractGameId} does not exist`
      })
      this.stats.issues++
    }
  }

  async checkNFTOwnership(nftContract, tokenId, contractGameId) {
    try {
      const owner = await this.client.readContract({
        address: nftContract,
        abi: ERC721_ABI,
        functionName: 'ownerOf',
        args: [BigInt(tokenId)]
      })

      if (owner.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()) {
        this.stats.nftsInContract++
        console.log(`   ✅ NFT is owned by contract`)
      } else {
        console.log(`   ❌ NFT is NOT owned by contract. Owner: ${owner}`)
        this.issues.push({
          type: 'nft_not_in_contract',
          nftContract,
          tokenId: tokenId.toString(),
          contractGameId,
          owner,
          message: `NFT ${nftContract} #${tokenId} is not owned by contract`
        })
        this.stats.issues++
      }
    } catch (error) {
      console.log(`   ❌ Error checking NFT ownership:`, error.message)
      this.issues.push({
        type: 'nft_ownership_error',
        nftContract,
        tokenId: tokenId.toString(),
        contractGameId,
        message: `Error checking NFT ownership: ${error.message}`
      })
      this.stats.issues++
    }
  }

  async checkNFTApproval(nftContract, tokenId, contractGameId) {
    try {
      const approved = await this.client.readContract({
        address: nftContract,
        abi: ERC721_ABI,
        functionName: 'getApproved',
        args: [BigInt(tokenId)]
      })

      if (approved.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()) {
        this.stats.nftsApproved++
        console.log(`   ✅ NFT is approved for contract`)
      } else {
        console.log(`   ⚠️ NFT is NOT approved for contract. Approved: ${approved}`)
        this.issues.push({
          type: 'nft_not_approved',
          nftContract,
          tokenId: tokenId.toString(),
          contractGameId,
          approved,
          message: `NFT ${nftContract} #${tokenId} is not approved for contract`
        })
        this.stats.issues++
      }
    } catch (error) {
      console.log(`   ❌ Error checking NFT approval:`, error.message)
      this.issues.push({
        type: 'nft_approval_error',
        nftContract,
        tokenId: tokenId.toString(),
        contractGameId,
        message: `Error checking NFT approval: ${error.message}`
      })
      this.stats.issues++
    }
  }

  async checkContractState() {
    console.log('\n📋 Checking contract state...')
    
    try {
      // Check if contract is deployed and accessible
      const code = await this.client.getBytecode({ address: CONTRACT_ADDRESS })
      if (code) {
        console.log(`✅ Contract is deployed and accessible at ${CONTRACT_ADDRESS}`)
      } else {
        console.log(`❌ Contract not found at ${CONTRACT_ADDRESS}`)
      }
    } catch (error) {
      console.log(`❌ Error checking contract state:`, error.message)
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60))
    console.log('📊 DIAGNOSTIC SUMMARY')
    console.log('='.repeat(60))
    
    console.log(`📋 Total Listings: ${this.stats.totalListings}`)
    console.log(`🎮 Total Games: ${this.stats.totalGames}`)
    console.log(`🔗 Listings with Contract ID: ${this.stats.listingsWithContractId}`)
    console.log(`🔗 Games with Contract ID: ${this.stats.gamesWithContractId}`)
    console.log(`✅ Blockchain Games Exist: ${this.stats.blockchainGamesExist}`)
    console.log(`💎 NFTs in Contract: ${this.stats.nftsInContract}`)
    console.log(`✅ NFTs Approved: ${this.stats.nftsApproved}`)
    console.log(`❌ Issues Found: ${this.stats.issues}`)

    if (this.issues.length > 0) {
      console.log('\n🚨 ISSUES FOUND:')
      console.log('-'.repeat(40))
      this.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.type}: ${issue.message}`)
        if (issue.contractGameId) console.log(`   Contract Game ID: ${issue.contractGameId}`)
        if (issue.nftContract) console.log(`   NFT: ${issue.nftContract} #${issue.tokenId}`)
      })
    } else {
      console.log('\n✅ No issues found! All systems operational.')
    }
  }

  async run() {
    try {
      await this.initialize()
      await this.checkListings()
      await this.checkGames()
      await this.checkContractState()
      this.printSummary()
    } catch (error) {
      console.error('❌ Diagnostic check failed:', error)
    } finally {
      if (this.db) {
        this.db.close()
      }
    }
  }
}

async function main() {
  const checker = new DiagnosticChecker()
  await checker.run()
}

main().catch(console.error) 