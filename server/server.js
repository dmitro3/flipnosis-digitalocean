const express = require('express')
const https = require('https')  // Change from http to https
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

// Add SSL certificate configuration
const serverOptions = {
  key: fs.readFileSync('/etc/ssl/private/selfsigned.key'),
  cert: fs.readFileSync('/etc/ssl/certs/selfsigned.crt')
}

// Create HTTPS server instead of HTTP
const server = https.createServer(serverOptions, app)
const wss = new WebSocket.Server({ server })

// ===== CONFIGURATION =====
const PORT = process.env.PORT || 3001
const DATABASE_PATH = process.env.DATABASE_PATH || '/opt/flipnosis/app/server/flipz-clean.db'
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x3997F4720B3a515e82d54F30d7CF2993B014eeBE'
const CONTRACT_OWNER_KEY = process.env.CONTRACT_OWNER_KEY || process.env.PRIVATE_KEY
const RPC_URL = process.env.RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3'

// ===== MIDDLEWARE =====
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Add CSP headers to allow eval() for React and other libraries
app.use((req, res, next) => {
  // Detect Chrome user agent
  const isChrome = req.headers['user-agent']?.includes('Chrome');
  
  if (isChrome) {
    // More permissive CSP for Chrome
    res.setHeader(
      'Content-Security-Policy',
      "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; " +
      "script-src * 'unsafe-inline' 'unsafe-eval'; " +
      "connect-src * wss: ws: https: http:; " +
      "img-src * data: blob: https:; " +
      "frame-src *; " +
      "style-src * 'unsafe-inline';"
    );
  } else {
    // Original CSP for other browsers
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; " +
      "style-src 'self' 'unsafe-inline' https:; " +
      "font-src 'self' https:; " +
      "img-src 'self' data: https: blob:; " +
      "connect-src 'self' wss: https: ws:; " +
      "frame-src 'self'; " +
      "object-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self';"
    );
  }
  next();
})

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// ===== STATIC FILES =====
// Try multiple possible locations for the dist directory
const possibleDistPaths = [
  path.join(__dirname, '..', 'dist'),           // ../dist (when running from server/)
  path.join(__dirname, 'dist'),                 // ./dist (when running from root)
  path.join(__dirname, '..'),                   // ../ (fallback to parent)
  path.join(process.cwd(), 'dist'),             // cwd/dist
  path.join(process.cwd(), '..', 'dist')        // cwd/../dist
]

let distPath = null
for (const testPath of possibleDistPaths) {
  if (fs.existsSync(testPath)) {
    distPath = testPath
    console.log('📁 Found dist directory at:', distPath)
    break
  }
}

if (distPath) {
  app.use(express.static(distPath))
  console.log('✅ Serving static files from:', distPath)
} else {
  console.log('⚠️  No dist directory found, serving from current directory')
  app.use(express.static(__dirname))
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

  // Static file fallback - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' })
    }
    
    // Try to find index.html in various locations
    const possibleIndexPaths = [
      path.join(distPath || '', 'index.html'),
      path.join(__dirname, 'dist', 'index.html'),
      path.join(__dirname, '..', 'index.html'),
      path.join(process.cwd(), 'dist', 'index.html'),
      path.join(process.cwd(), 'index.html')
    ]
    
    let indexPath = null
    for (const testPath of possibleIndexPaths) {
      if (fs.existsSync(testPath)) {
        indexPath = testPath
        break
      }
    }
    
    if (indexPath) {
      console.log('📄 Serving index.html from:', indexPath)
      res.sendFile(indexPath)
    } else {
      console.log('❌ No index.html found, serving 404')
      res.status(404).send('Not Found')
    }
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
      console.log(`🎮 CryptoFlipz Clean Server running on HTTPS port ${PORT}`)
      console.log(`🌐 WebSocket server ready (WSS)`)
      console.log(`📊 Database: ${DATABASE_PATH}`)
      console.log(`📝 Contract: ${CONTRACT_ADDRESS}`)
      console.log(`🔑 Contract owner: ${blockchainService.hasOwnerWallet() ? 'Configured' : 'Not configured'}`)
      console.log(`🔒 SSL Certificate: Self-signed certificate loaded`)
    })
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  })
  