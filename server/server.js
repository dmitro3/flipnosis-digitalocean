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

console.log('🚀 Starting CryptoFlipz Server...')

const app = express()
const server = http.createServer(app)

// ===== CONFIGURATION =====
const PORT = process.env.PORT || 3000
const DATABASE_PATH = path.join(__dirname, 'flipz.db')
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x415BBd5933EaDc0570403c65114B7c5a1c7FADb7'
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
  // Initialize database
  const dbService = new DatabaseService(DATABASE_PATH)
  await dbService.initialize()
  console.log('✅ Database initialized')

  // Initialize blockchain service
  const blockchainService = new BlockchainService(
    RPC_URL,
    CONTRACT_ADDRESS,
    CONTRACT_OWNER_KEY
  )
  console.log('✅ Blockchain service initialized')

  // Initialize cleanup service
  const cleanupService = new CleanupService(dbService, blockchainService)
  cleanupService.start()
  console.log('✅ Cleanup service started')

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

// ===== SERVER STARTUP =====
initializeServices()
  .then(({ dbService, blockchainService, cleanupService }) => {
    // Initialize Socket.io server
    const io = initializeSocketIO(server, dbService)
    console.log('✅ Socket.io server initialized')
    
    // Handle any pending blockchain events
    if (global.pendingBlockchainEvents) {
      global.pendingBlockchainEvents.forEach(event => {
        io.to(`game_${event.gameId}`).emit('game_ready', event)
      })
      global.pendingBlockchainEvents = []
    }
    
    // Setup API routes
    const apiRouter = createApiRoutes(dbService, blockchainService, { io })
    app.use('/api', apiRouter)
    console.log('✅ API routes configured')
    
    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        socketio: 'active',
        database: 'connected',
        blockchain: blockchainService.hasOwnerWallet() ? 'ready' : 'view-only'
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