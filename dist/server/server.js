const express = require('express')
const http = require('http')
const WebSocket = require('ws')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

// Import route handlers
const { createApiRoutes } = require('./routes/api')
const { createWebSocketHandlers } = require('./handlers/websocket')
const { DatabaseService } = require('./services/database')
const { BlockchainService } = require('./services/blockchain')

console.log('🚀 Starting CryptoFlipz Clean Server...')

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

// ===== CONFIGURATION =====
const PORT = process.env.PORT || 3001
const DATABASE_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'flipz-clean.db')
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x3997F4720B3a515e82d54F30d7CF2993B014EeBE'
const CONTRACT_OWNER_KEY = process.env.CONTRACT_OWNER_KEY || process.env.PRIVATE_KEY
const RPC_URL = process.env.RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3'

// ===== MIDDLEWARE =====
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// ===== STATIC FILES =====
const distPath = path.join(__dirname, '..', 'dist')
console.log('🔍 Checking for dist directory at:', distPath)
console.log('🔍 Current directory (__dirname):', __dirname)

if (fs.existsSync(distPath)) {
  console.log('📁 Serving static files from:', distPath)
  app.use(express.static(distPath))
} else {
  console.log('⚠️  Dist directory not found at:', distPath)
  // Fallback to parent directory
  const fallbackPath = path.join(__dirname, '..')
  console.log('📁 Falling back to:', fallbackPath)
  app.use(express.static(fallbackPath))
}

// ===== SERVICES INITIALIZATION =====
async function initializeServices() {
  // Initialize database
  const dbService = new DatabaseService(DATABASE_PATH)
  await dbService.initialize()

  // Initialize blockchain service
  const blockchainService = new BlockchainService(
    RPC_URL,
    CONTRACT_ADDRESS,
    CONTRACT_OWNER_KEY
  )

  // Initialize WebSocket handlers
  const wsHandlers = createWebSocketHandlers(wss, dbService, blockchainService)

  // Initialize API routes
  const apiRouter = createApiRoutes(dbService, blockchainService, wsHandlers)
  app.use('/api', apiRouter)

  // Health check
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      server: 'clean-architecture', 
      timestamp: new Date().toISOString(),
      hasContractOwner: blockchainService.hasOwnerWallet() 
    })
  })

  // Static file fallback
  app.get('*', (req, res) => {
    const indexPath = path.join(distPath, 'index.html')
    console.log('📄 Serving index.html from:', indexPath)
    res.sendFile(indexPath)
  })

  // Start timeout checker
  startTimeoutChecker(dbService, wsHandlers)

  return { dbService, blockchainService, wsHandlers }
}

// ===== TIMEOUT CHECKER =====
function startTimeoutChecker(dbService, wsHandlers) {
  setInterval(async () => {
    const now = new Date().toISOString()
    try {
      // Handle old flow timeouts
      const oldFlowGames = await dbService.getTimedOutGames('waiting_deposits', now)
      for (const game of oldFlowGames) {
        await handleOldFlowTimeout(game, dbService, wsHandlers)
      }

      // Handle new flow timeouts
      const newFlowGames = await dbService.getTimedOutGames('waiting_challenger_deposit', now)
      for (const game of newFlowGames) {
        await handleNewFlowTimeout(game, dbService, wsHandlers)
      }
      
      // Handle listings that timeout (awaiting_offer status)
      const awaitingOfferGames = await dbService.getTimedOutGames('awaiting_offer', now)
      for (const game of awaitingOfferGames) {
        // These are listings where NFT was deposited but no offer came in reasonable time
        // You might want to allow creator to reclaim NFT after 24 hours
        console.log('⏰ Listing timeout check:', game.id)
        // Optionally implement a longer timeout for these
      }
    } catch (error) {
      console.error('❌ Error in timeout checker:', error)
    }
  }, 10000) // Check every 10 seconds
}

async function handleOldFlowTimeout(game, dbService, wsHandlers) {
  console.log('⏰ Timeout for old flow game:', game.id)
  if (game.creator_deposited && !game.challenger_deposited) {
    console.log('🎯 Moving timed-out NFT to ready state for future games:', game.nft_name)
    try {
      await dbService.moveNFTToReady(game)
      wsHandlers.sendToUser(game.creator, {
        type: 'nft_moved_to_ready',
        nft_name: game.nft_name,
        message: 'Your NFT is ready for the next game - no need to deposit again!'
      })
    } catch (error) {
      console.error('❌ Error moving NFT to ready state:', error)
    }
  }
  await dbService.cancelGame(game.id)
  wsHandlers.broadcastToRoom(game.id, {
    type: 'game_cancelled',
    reason: 'deposit_timeout',
    creator_deposited: game.creator_deposited,
    nft_moved_to_ready: game.creator_deposited && !game.challenger_deposited
  })
  if (!game.creator_deposited && !game.challenger_deposited) {
    await dbService.updateListingStatus(game.listing_id, 'open')
  }
}

async function handleNewFlowTimeout(game, dbService, wsHandlers) {
  console.log('⏰ Timeout for challenger deposit:', game.id)
  
  try {
    // Reset game to allow new offers
    await dbService.resetGameForNewOffers(game)
    
    // Reopen the listing
    await dbService.updateListingStatus(game.listing_id, 'open')
    
    // Reject the timed-out offer
    if (game.offer_id) {
      await new Promise((resolve, reject) => {
        dbService.getDatabase().run(
          'UPDATE offers SET status = "timeout" WHERE id = ?',
          [game.offer_id],
          function(err) {
            if (err) reject(err)
            else resolve()
          }
        )
      })
    }
    
    // Notify creator
    wsHandlers.sendToUser(game.creator, {
      type: 'challenger_timeout',
      gameId: game.id,
      message: 'Challenger didn\'t deposit in time. Your listing is now open for new offers!'
    })
    
    // Notify challenger
    if (game.challenger) {
      wsHandlers.sendToUser(game.challenger, {
        type: 'deposit_timeout',
        gameId: game.id,
        message: 'You missed the deposit deadline. The offer has expired.'
      })
    }
    
    // Broadcast to both rooms
    wsHandlers.broadcastToRoom(game.id, {
      type: 'game_timeout',
      reason: 'challenger_deposit_timeout',
      gameId: game.id
    })
    
    wsHandlers.broadcastToRoom(game.listing_id, {
      type: 'listing_reopened',
      listingId: game.listing_id,
      reason: 'challenger_timeout'
    })
    
    console.log('✅ Game reset for new offers after timeout:', game.id)
  } catch (error) {
    console.error('❌ Error handling timeout:', error)
  }
}

// ===== SERVER STARTUP =====
initializeServices()
  .then(({ dbService, blockchainService }) => {
    server.listen(PORT, () => {
      console.log(`🎮 CryptoFlipz Clean Server running on port ${PORT}`)
      console.log(`🌐 WebSocket server ready`)
      console.log(`📊 Database: ${DATABASE_PATH}`)
      console.log(`📝 Contract: ${CONTRACT_ADDRESS}`)
      console.log(`🔑 Contract owner: ${blockchainService.hasOwnerWallet() ? 'Configured' : 'Not configured'}`)
    })
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  })
  