// CryptoFlipz Server - Clean WebSocket-only implementation
const express = require('express')
const http = require('http')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

// Import services
const { createApiRoutes } = require('./routes/api')
const { initializeSocketIO } = require('./handlers/server-socketio')
const { DatabaseService } = require('./services/database')
const { BlockchainService } = require('./services/blockchain')
const CleanupService = require('./services/cleanupService')
// const { errorHandler, notFoundHandler } = require('./middleware/error-handler') // Temporarily disabled

console.log('🚀 Starting CryptoFlipz Server...')
console.log('📍 Working directory:', process.cwd())
console.log('📍 Server directory:', __dirname)
console.log('🔧 Node version:', process.version)
console.log('🔧 Platform:', process.platform)

const app = express()
const server = http.createServer(app)

// ===== CONFIGURATION =====
const PORT = process.env.PORT || 3000
const DATABASE_PATH = path.join(__dirname, 'flipz.db')
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0xDE5B1D7Aa9913089710184da2Ba6980D661FDedb'
const CONTRACT_OWNER_KEY = process.env.CONTRACT_OWNER_KEY || process.env.PRIVATE_KEY
const RPC_URL = process.env.RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3'

console.log('⚙️ Configuration:')
console.log('  - PORT:', PORT)
console.log('  - DATABASE_PATH:', DATABASE_PATH)
console.log('  - DATABASE_EXISTS:', fs.existsSync(DATABASE_PATH))
console.log('  - CONTRACT_ADDRESS:', CONTRACT_ADDRESS)
console.log('  - HAS_PRIVATE_KEY:', !!CONTRACT_OWNER_KEY)
console.log('  - RPC_URL:', RPC_URL ? RPC_URL.substring(0, 50) + '...' : 'NOT SET')

// ===== MIDDLEWARE =====
app.use(cors({
  origin: ['https://flipnosis.fun', 'https://www.flipnosis.fun', 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Access-Control-Allow-Origin']
}))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// ===== STATIC FILES =====
const distPath = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, {
    setHeaders: (res, path) => {
      if (path.endsWith('.js') || path.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
      } else if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8')
      }
    }
  }))
  console.log('✅ Serving static files from:', distPath)
} else {
  console.log('⚠️ No dist directory found')
}

// ===== SERVICES INITIALIZATION =====
async function initializeServices() {
  // Initialize database with error handling
  let dbService
  try {
    dbService = new DatabaseService(DATABASE_PATH)
    await dbService.initialize()
    console.log('✅ Database initialized')
  } catch (error) {
    console.error('❌ Failed to initialize database:', error)
    console.error('⚠️ Server will continue but database functionality will be limited')
    // Create a minimal dbService to prevent crashes
    dbService = {
      db: null,
      initialize: async () => {},
      getDatabase: () => null
    }
  }

  // Initialize blockchain service with error handling
  let blockchainService
  try {
    blockchainService = new BlockchainService(
      RPC_URL,
      CONTRACT_ADDRESS,
      CONTRACT_OWNER_KEY
    )
    console.log('✅ Blockchain service initialized')
  } catch (error) {
    console.error('❌ Failed to initialize blockchain service:', error)
    console.error('⚠️ Server will continue but blockchain functionality will be limited')
    blockchainService = {
      hasOwnerWallet: () => false,
      setupEventListeners: () => {}
    }
  }

  // Initialize cleanup service with error handling
  let cleanupService
  try {
    cleanupService = new CleanupService(dbService, blockchainService)
    cleanupService.start()
    console.log('✅ Cleanup service started')
  } catch (error) {
    console.error('❌ Failed to start cleanup service:', error)
    console.error('⚠️ Server will continue but cleanup functionality will be limited')
    cleanupService = { start: () => {}, stop: () => {} }
  }

  // Setup blockchain event listeners
  blockchainService.setupEventListeners((event) => {
    console.log('🔔 Blockchain event received:', event.type, event)
    
    // Handle blockchain events and broadcast via Socket.io
    // Note: We'll need to pass the io instance to this function
    // For now, we'll handle this in the main initialization
    
    if (event.type === 'GameReady') {
      const gameId = event.gameId
      console.log('🎮 GameReady - both deposits confirmed on-chain')
      
      // Store the event for later broadcasting when Socket.io is initialized
      global.pendingBlockchainEvents = global.pendingBlockchainEvents || []
      global.pendingBlockchainEvents.push({
        type: 'game_ready',
        gameId,
        message: 'Both deposits confirmed on blockchain! Game starting...',
        nftDepositor: event.nftDepositor,
        cryptoDepositor: event.cryptoDepositor
      })
    }
  })

  return { dbService, blockchainService, cleanupService }
}

// ===== GLOBAL ERROR HANDLERS =====
// Prevent server crashes from unhandled errors
process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION:', error)
  console.error('Stack trace:', error.stack)
  // Log memory usage when crash occurs
  const memUsage = process.memoryUsage()
  console.error('💾 Memory at crash:', {
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
    rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB'
  })
  // Don't exit - keep server running
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED PROMISE REJECTION:', reason)
  console.error('Promise:', promise)
  // Don't exit - keep server running
})

// Memory monitoring - log warnings at high usage
setInterval(() => {
  const memUsage = process.memoryUsage()
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024)
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024)
  
  if (heapUsedMB > 800) {
    console.warn(`⚠️ High memory usage: ${heapUsedMB} MB / ${heapTotalMB} MB`)
    if (global.gc) {
      console.log('🧹 Running garbage collection...')
      global.gc()
    }
  }
}, 60000) // Check every minute

// ===== SERVER STARTUP =====
initializeServices()
  .then(({ dbService, blockchainService, cleanupService }) => {
    // Initialize Socket.io server
    const { io, gameServer: gameServerInstance } = initializeSocketIO(server, dbService)
    console.log('✅ Socket.io server initialized')

    // Make gameServer available globally for API routes
    global.gameServer = gameServerInstance
    
    // Handle any pending blockchain events
    if (global.pendingBlockchainEvents) {
      global.pendingBlockchainEvents.forEach(event => {
        io.to(`game_${event.gameId}`).emit('game_ready', event)
      })
      global.pendingBlockchainEvents = []
    }
    
    // Setup API routes - pass gameServerInstance with error handling
    try {
      const apiRouter = createApiRoutes(dbService, blockchainService, gameServerInstance)
      app.use('/api', apiRouter)
      console.log('✅ API routes configured')
    } catch (error) {
      console.error('❌ Error setting up API routes:', error)
      console.error('⚠️ Server will continue but API routes may be limited')
    }
    
    // Health check endpoint
    app.get('/health', (req, res) => {
      const memUsage = process.memoryUsage()
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        socketio: 'active',
        database: dbService && dbService.db ? 'connected' : 'disconnected',
        blockchain: blockchainService.hasOwnerWallet() ? 'ready' : 'view-only',
        memory: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
          rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB'
        }
      })
    })
    
    // Process info endpoint for debugging
    app.get('/api/process-info', (req, res) => {
      const memUsage = process.memoryUsage()
      res.json({
        pid: process.pid,
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        cpuUsage: process.cpuUsage(),
        memory: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
          external: Math.round(memUsage.external / 1024 / 1024) + ' MB',
          rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB'
        },
        env: {
          NODE_ENV: process.env.NODE_ENV,
          PORT: process.env.PORT,
          hasPrivateKey: !!process.env.CONTRACT_OWNER_KEY || !!process.env.PRIVATE_KEY
        }
      })
    })
    
    // Catch-all route for SPA
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html')
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath)
      } else {
        res.status(404).json({ error: 'Frontend not built. Run: npm run build' })
      }
    })
    
    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('❌ Server error:', err)
      
      // Handle JSON parsing errors specifically
      if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('❌ JSON parsing error:', err.message)
        return res.status(400).json({ error: 'Invalid JSON', message: err.message })
      }
      
      res.status(500).json({
        error: 'Internal server error',
        message: err.message
      })
    })
    
    // Start HTTP server
    server.listen(PORT, '0.0.0.0', () => {
      console.log('═══════════════════════════════════════════')
      console.log(`🎮 CryptoFlipz Server Running`)
      console.log(`📡 HTTP: http://localhost:${PORT}`)
      console.log(`🔌 Socket.io: http://localhost:${PORT}`)
      console.log(`📊 Database: ${DATABASE_PATH}`)
      console.log(`🔗 Blockchain: ${CONTRACT_ADDRESS}`)
      console.log(`🔑 Mode: ${blockchainService.hasOwnerWallet() ? 'Full (can write)' : 'View-only (read only)'}`)
      console.log('═══════════════════════════════════════════')
    })
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('📛 SIGTERM received, shutting down gracefully...')
      server.close(() => {
        console.log('✅ Server closed')
        process.exit(0)
      })
    })
    
    process.on('SIGINT', () => {
      console.log('📛 SIGINT received, shutting down gracefully...')
      server.close(() => {
        console.log('✅ Server closed')
        process.exit(0)
      })
    })
  })
  .catch(error => {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  })