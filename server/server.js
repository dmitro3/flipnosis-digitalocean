// Simplified server.js for single server setup
const express = require('express')
const http = require('http')
const https = require('https')
const WebSocket = require('ws')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

// Import route handlers
const { createApiRoutes } = require('./routes/api')
const { initializeWebSocket, broadcastToRoom } = require('./handlers/unifiedWebSocket')
const { DatabaseService } = require('./services/database')
const { BlockchainService } = require('./services/blockchain')
const CleanupService = require('./services/cleanupService')

console.log('🚀 Starting CryptoFlipz Server...')

const app = express()
const server = http.createServer(app)

// ===== SERVER CONFIGURATION =====
const PORT = process.env.PORT || 3000
const HTTPS_PORT = process.env.HTTPS_PORT || 3001
const DATABASE_PATH = path.join(__dirname, 'flipz.db') // Local database file
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x6cB1E31F2A3df57A7265ED2eE26dcF8D02CE1B69'
const CONTRACT_OWNER_KEY = process.env.CONTRACT_OWNER_KEY || process.env.PRIVATE_KEY
const RPC_URL = process.env.RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3'

// SSL Configuration - try to load certificates, but don't fail if they don't exist
let sslOptions = null
try {
  sslOptions = {
    cert: fs.readFileSync('/etc/ssl/certs/selfsigned.crt'),
    key: fs.readFileSync('/etc/ssl/private/selfsigned.key')
  }
  console.log('✅ SSL certificates loaded')
} catch (error) {
  console.log('⚠️ SSL certificates not found, HTTPS/WSS will be disabled')
  sslOptions = null
}

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
  // Configure static file serving with proper MIME types
  app.use(express.static(distPath, {
    setHeaders: (res, path) => {
      if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
      } else if (path.endsWith('.mjs')) {
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
let dbService = null

async function initializeServices() {
  // Initialize database
  dbService = new DatabaseService(DATABASE_PATH)
  await dbService.initialize()

  // Initialize blockchain service
  const blockchainService = new BlockchainService(
    RPC_URL,
    CONTRACT_ADDRESS,
    CONTRACT_OWNER_KEY
  )

  // Set up blockchain event listeners
  blockchainService.setupEventListeners((event) => {
    console.log('🔔 Blockchain event received:', event.type, event)
    
    if (event.type === 'GameReady') {
      // Convert bytes32 gameId to string
      const gameId = event.gameId
      const nftDepositor = event.nftDepositor
      const cryptoDepositor = event.cryptoDepositor
      
      console.log('🎮 GameReady event - both deposits confirmed:', {
        gameId,
        nftDepositor,
        cryptoDepositor
      })
      
             // Find the game in our database and update status
       handleGameReady(gameId, nftDepositor, cryptoDepositor, dbService, { broadcastToRoom })
    }
  })

  // Initialize cleanup service
  const cleanupService = new CleanupService(dbService, blockchainService)
  cleanupService.start()

  // Initialize WebSocket handlers with database service
  initializeWebSocket(server, dbService)

  // Initialize API routes
  const apiRouter = createApiRoutes(dbService, blockchainService, { broadcastToRoom })
  app.use('/api', apiRouter)

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      server: 'single-server', 
      timestamp: new Date().toISOString(),
      database: DATABASE_PATH
    })
  })

  // Backup endpoint for admin panel
  app.get('/api/backup', async (req, res) => {
    try {
      const backup = await dbService.createBackup()
      res.json({ 
        success: true, 
        data: backup,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // Restore endpoint for admin panel
  app.post('/api/restore', async (req, res) => {
    try {
      await dbService.restoreBackup(req.body.data)
      res.json({ 
        success: true,
        message: 'Database restored successfully'
      })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  // Serve index.html for all other routes (SPA fallback)
  app.get('*', (req, res) => {
    // Don't intercept API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' })
    }
    
    // Don't intercept static assets (js, css, images, etc.)
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map)$/)) {
      return res.status(404).send('Static asset not found')
    }
    
    const indexPath = path.join(distPath, 'index.html')
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath)
    } else {
      res.status(404).send('Application not built - run npm run build')
    }
  })

  // Start timeout checker
  setInterval(async () => {
    try {
      const expiredGames = await dbService.getExpiredDepositGames()
      for (const game of expiredGames) {
        await handleGameTimeout(game, dbService, { broadcastToRoom })
      }
    } catch (error) {
      console.error('❌ Error checking timeouts:', error)
    }
  }, 5000)

  return { dbService, blockchainService }
}

// Handle game timeout
async function handleGameTimeout(game, dbService, { broadcastToRoom }) {
  try {
    console.log('⏰ Handling timeout for game:', game.id)
    
    await dbService.resetGameForNewOffers(game.id)
    
    if (game.offer_id) {
      await dbService.expireOffer(game.offer_id)
    }
    
    // Notify users via broadcast
    broadcastToRoom(`game_${game.id}`, {
      type: 'challenger_timeout',
      gameId: game.id,
      message: 'Challenger didn\'t deposit in time. Your listing is now open for new offers!'
    })
    
    console.log('✅ Game reset for new offers after timeout:', game.id)
  } catch (error) {
    console.error('❌ Error handling timeout:', error)
  }
}

// Handle GameReady event from blockchain (both deposits confirmed)
async function handleGameReady(gameId, nftDepositor, cryptoDepositor, dbService, { broadcastToRoom }) {
  try {
    console.log('🎮 Handling GameReady event:', { gameId, nftDepositor, cryptoDepositor })
    
    // Find the game in our database using the blockchain gameId
    const game = await dbService.getGameByBlockchainId(gameId)
    if (!game) {
      console.error('❌ Game not found in database for blockchain gameId:', gameId)
      return
    }
    
    console.log('📊 Found game in database:', game)
    
    // Use the original gameId (string) for our operations
    const originalGameId = game.id
    
    // Update game status to 'active' since both deposits are confirmed
    await dbService.updateGameStatus(originalGameId, 'active')
    
    // Get or create the GameRoom for this game
    const { gameRooms } = require('./handlers/unifiedWebSocket')
    let gameRoom = gameRooms.get(originalGameId)
    
    if (!gameRoom) {
      // Create new game room with the NFT depositor as creator
      const { GameRoom } = require('./handlers/unifiedWebSocket')
      gameRoom = new GameRoom(originalGameId, nftDepositor)
      gameRooms.set(originalGameId, gameRoom)
      console.log('🏠 Created new GameRoom for GameReady event:', originalGameId)
    }
    
    // Set up the game room with both players
    gameRoom.joiner = cryptoDepositor
    gameRoom.phase = 'locked'
    
    // Start the game
    gameRoom.startGame()
    
    console.log('🎯 Game room set up for GameReady event:', {
      gameId: originalGameId,
      creator: gameRoom.creator,
      joiner: gameRoom.joiner,
      phase: gameRoom.phase
    })
    
    // Broadcast the game ready event to all connected clients
    const roomId = `game_${originalGameId}`
    broadcastToRoom(roomId, {
      type: 'game_ready',
      gameId: originalGameId,
      nftDepositor,
      cryptoDepositor,
      message: 'Both deposits confirmed! Game is ready to start!'
    })
    
    console.log('✅ GameReady handled successfully for game:', originalGameId)
  } catch (error) {
    console.error('❌ Error handling GameReady event:', error)
  }
}

// ===== AUTOMATIC BACKUP =====
function startAutoBackup(dbService) {
  // Backup every 6 hours
  setInterval(async () => {
    try {
      const backupDir = path.join(__dirname, 'backups')
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true })
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupPath = path.join(backupDir, `backup-${timestamp}.json`)
      
      const backup = await dbService.createBackup()
      fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2))
      
      console.log(`✅ Auto-backup saved to ${backupPath}`)
      
      // Keep only last 7 days of backups
      const files = fs.readdirSync(backupDir)
      const now = Date.now()
      const sevenDays = 7 * 24 * 60 * 60 * 1000
      
      files.forEach(file => {
        const filePath = path.join(backupDir, file)
        const stats = fs.statSync(filePath)
        if (now - stats.mtime.getTime() > sevenDays) {
          fs.unlinkSync(filePath)
          console.log(`🗑️ Deleted old backup: ${file}`)
        }
      })
    } catch (error) {
      console.error('❌ Auto-backup failed:', error)
    }
  }, 6 * 60 * 60 * 1000) // Every 6 hours
}

// ===== SERVER STARTUP =====
initializeServices()
  .then(({ dbService, blockchainService }) => {
    // Start the servers
    async function startServer() {
      // Check port availability
      const checkPort = (port) => {
        return new Promise((resolve) => {
          const tester = http.createServer()
          tester.once('error', () => resolve(false))
          tester.once('listening', () => {
            tester.close()
            resolve(true)
          })
          tester.listen(port)
        })
      }
      
      // For production on port 80
      const isProduction = process.env.NODE_ENV === 'production'
      const httpPort = isProduction ? 80 : PORT
      
      // Check if HTTP port is available
      const httpPortAvailable = await checkPort(httpPort)
      if (!httpPortAvailable) {
        console.error(`⌛ Port ${httpPort} is already in use.`)
        console.error('💡 Try: sudo lsof -i :' + httpPort + ' or sudo netstat -tlnp | grep :' + httpPort)
        process.exit(1)
      }
      
      // HTTP Server
      server.listen(httpPort, '0.0.0.0', () => {
        console.log(`🎮 CryptoFlipz HTTP Server running on port ${httpPort}`)
        console.log(`🌐 WebSocket server ready on ws://`)
        console.log(`📊 Database: ${DATABASE_PATH}`)
        console.log(`📄 Contract: ${CONTRACT_ADDRESS}`)
        console.log(`🔑 Contract owner: ${blockchainService.hasOwnerWallet() ? 'Configured' : 'Not configured'}`)
        console.log(`💾 Auto-backup: Enabled (every 6 hours)`)
      })
      
      // HTTPS Server with WSS support - FIXED VERSION
      if (sslOptions && isProduction) {
        const httpsServer = https.createServer(sslOptions, app)
        
        // Initialize WebSocket for HTTPS server
        initializeWebSocket(httpsServer)
        
        // Listen on port 443 for HTTPS/WSS
        httpsServer.listen(443, '0.0.0.0', () => {
          console.log(`🔒 CryptoFlipz HTTPS Server running on port 443`)
          console.log(`🔐 WSS WebSocket server ready on wss://`)
        })
      } else if (!sslOptions && isProduction) {
        console.log('⚠️ Production mode but SSL certificates not found!')
        console.log('🔧 Generate SSL certificates with:')
        console.log('   sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \\')
        console.log('   -keyout /etc/ssl/private/selfsigned.key \\')
        console.log('   -out /etc/ssl/certs/selfsigned.crt')
      }
      
      // Start auto-backup
      startAutoBackup(dbService)
    }
    
    startServer().catch((error) => {
      console.error('❌ Failed to start server:', error)
      process.exit(1)
    })
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  })

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...')
  server.close(() => {
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('Shutting down gracefully...')
  server.close(() => {
    process.exit(0)
  })
})