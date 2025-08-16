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
const { createWebSocketHandlers } = require('./handlers/websocket')
const { DatabaseService } = require('./services/database')
const { BlockchainService } = require('./services/blockchain')

console.log('🚀 Starting CryptoFlipz Server...')

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

// ===== SERVER CONFIGURATION =====
const PORT = process.env.PORT || 3000
const HTTPS_PORT = process.env.HTTPS_PORT || 3001
const DATABASE_PATH = path.join(__dirname, 'flipz.db') // Local database file
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x6527c1e6b12cd0F6d354B15CF7935Dc5516DEcaf'
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
  app.use(express.static(distPath))
  console.log('✅ Serving static files from:', distPath)
} else {
  console.log('⚠️ No dist directory found')
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

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      server: 'single-server', 
      timestamp: new Date().toISOString(),
      wsClients: wss.clients.size,
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

  // Serve index.html for all other routes
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' })
    }
    
    const indexPath = path.join(distPath, 'index.html')
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath)
    } else {
      res.status(404).send('Not Found')
    }
  })

  // Start timeout checker
  setInterval(async () => {
    try {
      const expiredGames = await dbService.getExpiredDepositGames()
      for (const game of expiredGames) {
        await handleGameTimeout(game, dbService, wsHandlers)
      }
    } catch (error) {
      console.error('❌ Error checking timeouts:', error)
    }
  }, 5000)

  return { dbService, blockchainService }
}

// Handle game timeout
async function handleGameTimeout(game, dbService, wsHandlers) {
  try {
    console.log('⏰ Handling timeout for game:', game.id)
    
    await dbService.resetGameForNewOffers(game.id)
    
    if (game.offer_id) {
      await dbService.expireOffer(game.offer_id)
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
    
    console.log('✅ Game reset for new offers after timeout:', game.id)
  } catch (error) {
    console.error('❌ Error handling timeout:', error)
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
    // Check if ports are already in use
    const net = require('net')
    
    function checkPort(port) {
      return new Promise((resolve) => {
        const tester = net.createServer()
        tester.once('error', () => resolve(false))
        tester.once('listening', () => {
          tester.close()
          resolve(true)
        })
        tester.listen(port)
      })
    }
    
    async function startServer() {
      // Check if port 80 is available
      const port80Available = await checkPort(80)
      if (!port80Available) {
        console.error('❌ Port 80 is already in use. Please stop the process using port 80 first.')
        console.error('💡 Try: sudo lsof -i :80 or sudo netstat -tlnp | grep :80')
        process.exit(1)
      }
      
      // Check if port 443 is available (if we're using HTTPS)
      if (sslOptions) {
        const port443Available = await checkPort(443)
        if (!port443Available) {
          console.error('❌ Port 443 is already in use. Please stop the process using port 443 first.')
          console.error('💡 Try: sudo lsof -i :443 or sudo netstat -tlnp | grep :443')
          process.exit(1)
        }
      }
      
      // HTTP Server (port 80)
      server.listen(PORT, '0.0.0.0', () => {
        console.log(`🎮 CryptoFlipz HTTP Server running on port ${PORT}`)
        console.log(`🌐 WebSocket server ready`)
        console.log(`📊 Database: ${DATABASE_PATH}`)
        console.log(`📝 Contract: ${CONTRACT_ADDRESS}`)
        console.log(`🔑 Contract owner: ${blockchainService.hasOwnerWallet() ? 'Configured' : 'Not configured'}`)
        console.log(`💾 Auto-backup: Enabled (every 6 hours)`)
      })
      
      // HTTPS Server (port 443) for WSS support - only if SSL certificates exist
      if (sslOptions) {
        console.log('⚠️ HTTPS/WSS server temporarily disabled to avoid port conflicts')
        // const httpsServer = https.createServer(sslOptions, app)
        // const httpsWss = new WebSocket.Server({ server: httpsServer })
        
        // // Initialize WebSocket handlers for HTTPS
        // const httpsWsHandlers = createWebSocketHandlers(httpsWss, dbService, blockchainService)
        
        // httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
        //   console.log(`🔒 CryptoFlipz HTTPS Server running on port ${HTTPS_PORT}`)
        //   console.log(`🔐 WSS WebSocket server ready`)
        // })
      } else {
        console.log('⚠️ HTTPS/WSS server not started - SSL certificates not found')
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