const express = require('express')
const http = require('http')
const https = require('https')
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

// ===== CONFIGURATION =====
const PORT = process.env.PORT || 3001
const USE_HTTPS = process.env.USE_HTTPS === 'true' || fs.existsSync('/etc/ssl/private/selfsigned.key')
// Database configuration - always use remote database server
const DB_SERVER_IP = process.env.DB_SERVER_IP || '116.202.24.43'
const DATABASE_PATH = '/opt/flipnosis/app/server/flipz-clean.db' // Local path for synced database
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x3997F4720B3a515e82d54F30d7CF2993B014eeBE'
const CONTRACT_OWNER_KEY = process.env.CONTRACT_OWNER_KEY || process.env.PRIVATE_KEY
const RPC_URL = process.env.RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3'

// Create server based on SSL availability
let server
let wss

if (USE_HTTPS) {
  try {
    // Try to load SSL certificates
    const serverOptions = {
      key: fs.readFileSync('/etc/ssl/private/selfsigned.key'),
      cert: fs.readFileSync('/etc/ssl/certs/selfsigned.crt')
    }
    
    server = https.createServer(serverOptions, app)
    console.log('🔒 HTTPS server created with SSL certificates')
  } catch (error) {
    console.log('⚠️ SSL certificates not found, falling back to HTTP')
    server = http.createServer(app)
  }
} else {
  server = http.createServer(app)
  console.log('📡 HTTP server created (no SSL)')
}

// Create WebSocket server with proper configuration
wss = new WebSocket.Server({ 
  server,
  perMessageDeflate: false,
  clientTracking: true,
  // Handle verification for self-signed certificates
  verifyClient: (info, cb) => {
    // Always accept connections for now
    cb(true)
  }
})

// ===== MIDDLEWARE =====
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Add CSP headers with Chrome compatibility
app.use((req, res, next) => {
  const isChrome = req.headers['user-agent']?.includes('Chrome')
  
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
    )
  } else {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; " +
      "style-src 'self' 'unsafe-inline' https:; " +
      "font-src 'self' https:; " +
      "img-src 'self' data: https: blob:; " +
      "connect-src 'self' wss: ws: https: http:; " +
      "frame-src 'self'; " +
      "object-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self';"
    )
  }
  next()
})

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// ===== STATIC FILES =====
const possibleDistPaths = [
  path.join(__dirname, '..', 'dist'),
  path.join(__dirname, 'dist'),
  path.join(__dirname, '..'),
  path.join(process.cwd(), 'dist'),
  path.join(process.cwd(), '..', 'dist')
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
  console.log('⚠️ No dist directory found, serving from current directory')
  app.use(express.static(__dirname))
}

// ===== SERVICES INITIALIZATION =====
async function initializeServices() {
  // Ensure database is synced from remote server
  console.log('🔄 Checking database sync from remote server...')
  try {
    const { execSync } = require('child_process')
    execSync('/opt/flipnosis/app/scripts/db-sync.sh', { stdio: 'inherit' })
    console.log('✅ Database sync completed')
  } catch (error) {
    console.log('⚠️ Database sync failed, continuing with existing database:', error.message)
  }

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

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      server: 'clean-architecture', 
      timestamp: new Date().toISOString(),
      hasContractOwner: blockchainService.hasOwnerWallet(),
      ssl: USE_HTTPS,
      wsClients: wss.clients.size
    })
  })

  // Static file fallback
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' })
    }
    
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
  startTimeoutChecker(dbService, blockchainService, wsHandlers)

  return { dbService, blockchainService }
}

// Timeout checker function
function startTimeoutChecker(dbService, blockchainService, wsHandlers) {
  setInterval(async () => {
    try {
      const now = new Date().toISOString()
      const expiredGames = await dbService.getTimedOutGames('awaiting_deposit', now)
      
      for (const game of expiredGames) {
        await handleGameTimeout(game, dbService, wsHandlers)
      }
    } catch (error) {
      console.error('❌ Error checking timeouts:', error)
    }
  }, 5000) // Check every 5 seconds
}

// Handle game timeout
async function handleGameTimeout(game, dbService, wsHandlers) {
  try {
    console.log('⏰ Handling timeout for game:', game.id)
    
    // Reset the game
    await dbService.resetGameForNewOffers(game.id)
    
    // Clear the accepted offer
    if (game.offer_id) {
      await new Promise((resolve, reject) => {
        dbService.db.run(
          'UPDATE offers SET status = "expired" WHERE id = ?',
          [game.offer_id],
          function(err) {
            if (err) reject(err)
            else resolve()
          }
        )
      })
    }
    
    // Notify users
    wsHandlers.sendToUser(game.creator, {
      type: 'challenger_timeout',
      gameId: game.id,
      message: 'Challenger didn\'t deposit in time. Your listing is now open for new offers!'
    })
    
    if (game.challenger) {
      wsHandlers.sendToUser(game.challenger, {
        type: 'deposit_timeout',
        gameId: game.id,
        message: 'You missed the deposit deadline. The offer has expired.'
      })
    }
    
    // Broadcast to rooms
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
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🎮 CryptoFlipz Clean Server running on ${USE_HTTPS ? 'HTTPS' : 'HTTP'} port ${PORT}`)
      console.log(`🌐 WebSocket server ready (${USE_HTTPS ? 'WSS' : 'WS'})`)
      console.log(`📊 Database: ${DATABASE_PATH} (synced from ${DB_SERVER_IP})`)
      console.log(`📝 Contract: ${CONTRACT_ADDRESS}`)
      console.log(`🔑 Contract owner: ${blockchainService.hasOwnerWallet() ? 'Configured' : 'Not configured'}`)
      if (USE_HTTPS) {
        console.log(`🔒 SSL: Enabled`)
      }
    })
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  })

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})
  