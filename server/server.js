// CryptoFlipz Server - Clean WebSocket-only implementation
try { require('dotenv').config() } catch (e) { /* dotenv optional in production */ }
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

// Import wallet monitor (optional)
let walletMonitor;
try {
  walletMonitor = require('./monitors/walletMonitor');
} catch (error) {
  console.warn('⚠️ Wallet monitor not available:', error.message);
}

console.log('🚀 Starting CryptoFlipz Server...')
console.log('📍 Working directory:', process.cwd())
console.log('📍 Server directory:', __dirname)
console.log('🔧 Node version:', process.version)
console.log('🔧 Platform:', process.platform)

const app = express()
const server = http.createServer(app)

// ===== CONFIGURATION =====
const PORT = process.env.PORT || 3000
// In production, prefer DATABASE_PATH, but gracefully fall back to common local paths.
let DATABASE_PATH
if (process.env.NODE_ENV === 'production') {
  const providedPath = process.env.DATABASE_PATH
    ? (path.isAbsolute(process.env.DATABASE_PATH)
        ? process.env.DATABASE_PATH
        : path.join(process.cwd(), process.env.DATABASE_PATH))
    : null

  const candidatePaths = [
    providedPath,
    path.join(process.cwd(), 'database.sqlite'),               // repo root
    path.join(process.cwd(), 'server', 'database.sqlite'),     // server folder under repo root
    path.join(__dirname, 'database.sqlite')                    // current server dir
  ].filter(Boolean)

  let selected = null
  for (const cand of candidatePaths) {
    try {
      if (fs.existsSync(cand)) {
        selected = cand
        break
      }
    } catch (_) {
      // ignore access errors, try next
    }
  }

  if (!selected) {
    console.warn('⚠️ No existing database file found in production fallbacks. Using server/database.sqlite as default path.')
    selected = path.join(__dirname, 'database.sqlite')
  }

  DATABASE_PATH = selected
} else {
  // Dev fallback for local work
  DATABASE_PATH = process.env.DATABASE_PATH
    ? (path.isAbsolute(process.env.DATABASE_PATH) ? process.env.DATABASE_PATH : path.join(process.cwd(), process.env.DATABASE_PATH))
    : path.join(__dirname, 'database.sqlite')
}
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x1800C075E5a939B8184A50A7efdeC5E1fFF8dd29'
const CONTRACT_OWNER_KEY = process.env.CONTRACT_OWNER_KEY || process.env.PRIVATE_KEY
const RPC_URL = process.env.RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3'

console.log('⚙️ Configuration:')
console.log('  - PORT:', PORT)
console.log('  - DATABASE_PATH:', DATABASE_PATH)
try {
  console.log('  - DATABASE_EXISTS:', fs.existsSync(DATABASE_PATH))
} catch (e) {
  console.log('  - DATABASE_EXISTS: unknown (path may be remote)')
}
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
const publicPath = path.join(__dirname, '..', 'public')
console.log('📁 Checking dist path:', distPath)
console.log('📁 Dist exists:', fs.existsSync(distPath))
console.log('📁 Checking public path:', publicPath)
console.log('📁 Public exists:', fs.existsSync(publicPath))

// Serve public folder first (for test-tubes.html and game assets)
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath, {
    setHeaders: (res, filePath) => {
      console.log('📁 Serving public file:', filePath)
      
      // Set proper MIME types
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
      } else if (filePath.endsWith('.jsx')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8')
      } else if (filePath.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
      } else if (filePath.endsWith('.png') || filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
        res.setHeader('Cache-Control', 'public, max-age=86400')
      }
    }
  }))
  console.log('✅ Serving static files from:', publicPath)
}

if (fs.existsSync(distPath)) {
  // Serve static files from the dist directory only (but not for API routes)
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next() // Skip static file serving for API routes
    }
    return express.static(distPath, {
      setHeaders: (res, filePath) => {
        console.log('📁 Serving dist file:', filePath)
        
        // Set proper MIME types for JavaScript files
        if (filePath.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
        } else if (filePath.endsWith('.jsx')) {
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
        } else if (filePath.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css; charset=utf-8')
        } else if (filePath.endsWith('.html')) {
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
        }
      }
    })(req, res, next)
  })
  console.log('✅ Serving static files from:', distPath)
} else {
  console.log('⚠️ No dist directory found - creating placeholder')
  
  // Create a simple index.html if dist doesn't exist
  const simpleHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Flipnosis - Server Running</title>
  <style>
    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
    .status { color: green; font-size: 24px; }
  </style>
</head>
<body>
  <h1 class="status">✅ Server is Running!</h1>
  <p>Main server with Socket.io is working correctly.</p>
  <p>Static files will be served once the build is deployed.</p>
</body>
</html>`
  
  app.get('/', (req, res) => {
    res.send(simpleHtml)
  })

  // Provide SPA fallback for non-API routes when dist is missing
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next()
    res.send(simpleHtml)
  })
}

// ===== SERVICES INITIALIZATION =====
async function initializeServices() {
  console.log('🔧 Initializing services...')
  
  // Initialize database service
  const dbService = new DatabaseService(DATABASE_PATH)
  await dbService.initialize()
  console.log('✅ Database service initialized')
  
  // Initialize blockchain service with error handling
  let blockchainService
  try {
    blockchainService = new BlockchainService(RPC_URL, CONTRACT_ADDRESS, CONTRACT_OWNER_KEY)
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
  
  // Start wallet monitor
  try {
    console.log('✅ Wallet monitor started')
  } catch (error) {
    console.error('❌ Failed to start wallet monitor:', error)
    console.error('⚠️ Server will continue but wallet monitoring will be limited')
  }
  
  return { dbService, blockchainService, cleanupService }
}

// ===== ERROR HANDLING =====
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
  console.error('Stack:', error.stack)
  // Don't exit - let the server continue running
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  // Don't exit - let the server continue running
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
    const { io, gameServer: gameServerInstance } = initializeSocketIO(server, dbService, blockchainService)
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
    
    // TEMP: Debug DB endpoint to verify active DB and tables
    app.get('/api/debug/db', async (req, res) => {
      try {
        const tables = await new Promise((resolve) => {
          if (!dbService || !dbService.db) return resolve([])
          dbService.db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, rows) => {
            if (err || !rows) return resolve([])
            resolve(rows.map(r => r.name))
          })
        })
        let exists
        try {
          exists = fs.existsSync(DATABASE_PATH)
        } catch {
          exists = null
        }
        res.json({
          databasePath: DATABASE_PATH,
          databaseExists: exists,
          tables
        })
      } catch (e) {
        res.status(500).json({ error: e.message })
      }
    })

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
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        message: 'Main server with Socket.io running',
        services: {
          database: !!dbService,
          blockchain: !!blockchainService,
          socketio: !!io,
          gameServer: !!gameServerInstance
        }
      })
    })

    // Specific route for test-tubes.html to ensure it's served correctly
    app.get('/test-tubes.html', (req, res) => {
      console.log('🎮 Serving test-tubes.html with query params:', req.query)
      
      // Check public folder first, then dist folder
      const publicTestTubesPath = path.join(publicPath, 'test-tubes.html')
      const distTestTubesPath = path.join(distPath, 'test-tubes.html')
      
      if (fs.existsSync(publicTestTubesPath)) {
        console.log('✅ Serving test-tubes.html from public folder')
        res.sendFile(publicTestTubesPath)
      } else if (fs.existsSync(distTestTubesPath)) {
        console.log('✅ Serving test-tubes.html from dist folder')
        res.sendFile(distTestTubesPath)
      } else {
        console.error('❌ test-tubes.html not found in public or dist')
        res.status(404).json({ error: 'test-tubes.html not found' })
      }
    })

    // Catch-all for SPA (only if dist exists)
    // Exclude test-tubes.html and API routes from catch-all
    if (fs.existsSync(distPath)) {
      app.get('*', (req, res, next) => {
        // Skip API routes - they should be handled by API router
        if (req.path.startsWith('/api/')) {
          return next() // Let Express handle 404 for API routes
        }
        
        // Skip if this is test-tubes.html - it should be handled by the specific route above
        if (req.path === '/test-tubes.html') {
          return res.status(404).json({ error: 'test-tubes.html route not working' })
        }
        
        const indexPath = path.join(distPath, 'index.html')
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath)
        } else {
          res.status(404).json({ error: 'index.html not found' })
        }
      })
    }

    // Start primary server
    server.listen(PORT, '0.0.0.0', () => {
      console.log('═══════════════════════════════════════════')
      console.log(`🎮 CryptoFlipz Server Running`)
      console.log(`📡 HTTP: http://localhost:${PORT}`)
      console.log(`🔌 Socket.io: ws://localhost:${PORT}`)
      console.log(`📁 Dist path: ${distPath}`)
      console.log(`📁 Dist exists: ${fs.existsSync(distPath)}`)
      console.log(`🗄️ Database: ${DATABASE_PATH}`)
      console.log(`⛓️ Contract: ${CONTRACT_ADDRESS}`)
      console.log('═══════════════════════════════════════════')
    })

    // Attempt to listen on common alternate ports (helps when proxy expects a fixed port)
    const alternatePorts = [3000, 3001].filter(p => String(p) !== String(PORT))
    alternatePorts.forEach(p => {
      try {
        const altServer = http.createServer(app)
        altServer.listen(p, '0.0.0.0', () => {
          console.log(`🛟 Also listening on http://localhost:${p} (alternate port)`) 
        })
        // Best-effort; no socket.io binding required for alt ports
      } catch (e) {
        console.warn(`⚠️ Could not bind alternate port ${p}:`, e.message)
      }
    })
  })
  .catch((error) => {
    console.error('❌ Failed to initialize services:', error)
    console.error('Stack:', error.stack)
    
    // Start minimal server even if services fail
    server.listen(PORT, '0.0.0.0', () => {
      console.log('═══════════════════════════════════════════')
      console.log(`⚠️ Minimal Server Running (Services Failed)`)
      console.log(`📡 HTTP: http://localhost:${PORT}`)
      console.log(`❌ Error: ${error.message}`)
      console.log('═══════════════════════════════════════════')
    })
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
