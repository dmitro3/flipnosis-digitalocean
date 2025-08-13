// Updated server.js for PostgreSQL + Redis
const express = require('express')
const http = require('http')
const https = require('https')
const WebSocket = require('ws')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

// Import new database service
const DatabaseService = require('./server/services/database-postgresql')

console.log('🚀 Starting CryptoFlipz PostgreSQL Server...')

const app = express()

// ===== CONFIGURATION =====
const PORT = process.env.PORT || 3001
const USE_HTTPS = process.env.USE_HTTPS === 'true' || fs.existsSync('/etc/ssl/private/selfsigned.key')

// Database configuration - PostgreSQL + Redis
const DB_SERVER_IP = process.env.DB_SERVER_IP || '116.202.24.43'
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x3997F4720B3a515e82d54F30d7CF2993B014eeBE'
const CONTRACT_OWNER_KEY = process.env.CONTRACT_OWNER_KEY || process.env.PRIVATE_KEY
const RPC_URL = process.env.RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3'

// Initialize database service
const dbService = new DatabaseService()

// Create server based on SSL availability
let server
let wss

if (USE_HTTPS) {
  try {
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

// Create WebSocket server
wss = new WebSocket.Server({ 
  server,
  perMessageDeflate: false,
  clientTracking: true,
  verifyClient: (info, cb) => {
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

// Add CSP headers
app.use((req, res, next) => {
  const isChrome = req.headers['user-agent']?.includes('Chrome')
  
  if (isChrome) {
    res.setHeader(
      'Content-Security-Policy',
      "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; " +
      "script-src * 'unsafe-inline' 'unsafe-eval'; " +
      "connect-src * wss: ws: https: http:; " +
      "img-src * data: blob: https:; " +
      "frame-src *; " +
      "style-src * 'unsafe-inline';"
    )
  }
  next()
})

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// ===== STATIC FILES =====
app.use(express.static(path.join(__dirname, 'dist')))

// ===== HEALTH CHECK =====
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await dbService.healthCheck()
    res.json({
      status: 'healthy',
      database: dbHealth,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    })
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

// ===== API ROUTES =====
app.get('/api/games', async (req, res) => {
  try {
    const chain = req.query.chain || 'base'
    const games = await dbService.getActiveGames(chain)
    res.json(games)
  } catch (error) {
    console.error('Error getting games:', error)
    res.status(500).json({ error: 'Failed to get games' })
  }
})

app.get('/api/games/:id', async (req, res) => {
  try {
    const game = await dbService.getGameById(req.params.id)
    if (game) {
      res.json(game)
    } else {
      res.status(404).json({ error: 'Game not found' })
    }
  } catch (error) {
    console.error('Error getting game:', error)
    res.status(500).json({ error: 'Failed to get game' })
  }
})

app.post('/api/games', async (req, res) => {
  try {
    const game = await dbService.createGame(req.body)
    res.json(game)
  } catch (error) {
    console.error('Error creating game:', error)
    res.status(500).json({ error: 'Failed to create game' })
  }
})

app.put('/api/games/:id/status', async (req, res) => {
  try {
    const game = await dbService.updateGameStatus(req.params.id, req.body.status, req.body.additionalData)
    if (game) {
      res.json(game)
    } else {
      res.status(404).json({ error: 'Game not found' })
    }
  } catch (error) {
    console.error('Error updating game:', error)
    res.status(500).json({ error: 'Failed to update game' })
  }
})

// Chat routes
app.post('/api/chat', async (req, res) => {
  try {
    const { roomId, senderAddress, message, messageType, messageData } = req.body
    const chatMessage = await dbService.saveChatMessage(roomId, senderAddress, message, messageType, messageData)
    res.json(chatMessage)
  } catch (error) {
    console.error('Error saving chat message:', error)
    res.status(500).json({ error: 'Failed to save chat message' })
  }
})

app.get('/api/chat/:roomId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50
    const messages = await dbService.getChatHistory(req.params.roomId, limit)
    res.json(messages)
  } catch (error) {
    console.error('Error getting chat history:', error)
    res.status(500).json({ error: 'Failed to get chat history' })
  }
})

// Profile routes
app.get('/api/profiles/:address', async (req, res) => {
  try {
    const profile = await dbService.getUserProfile(req.params.address)
    if (profile) {
      res.json(profile)
    } else {
      res.status(404).json({ error: 'Profile not found' })
    }
  } catch (error) {
    console.error('Error getting profile:', error)
    res.status(500).json({ error: 'Failed to get profile' })
  }
})

app.post('/api/profiles', async (req, res) => {
  try {
    const profile = await dbService.createOrUpdateProfile(req.body)
    res.json(profile)
  } catch (error) {
    console.error('Error creating/updating profile:', error)
    res.status(500).json({ error: 'Failed to create/update profile' })
  }
})

// Offers routes
app.post('/api/offers', async (req, res) => {
  try {
    const offer = await dbService.createOffer(req.body)
    res.json(offer)
  } catch (error) {
    console.error('Error creating offer:', error)
    res.status(500).json({ error: 'Failed to create offer' })
  }
})

app.get('/api/offers/:listingId', async (req, res) => {
  try {
    const offers = await dbService.getOffersForListing(req.params.listingId)
    res.json(offers)
  } catch (error) {
    console.error('Error getting offers:', error)
    res.status(500).json({ error: 'Failed to get offers' })
  }
})

// Notifications routes
app.post('/api/notifications', async (req, res) => {
  try {
    const notification = await dbService.createNotification(req.body)
    res.json(notification)
  } catch (error) {
    console.error('Error creating notification:', error)
    res.status(500).json({ error: 'Failed to create notification' })
  }
})

app.get('/api/notifications/:address', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20
    const notifications = await dbService.getUserNotifications(req.params.address, limit)
    res.json(notifications)
  } catch (error) {
    console.error('Error getting notifications:', error)
    res.status(500).json({ error: 'Failed to get notifications' })
  }
})

// ===== WEBSOCKET HANDLERS =====
wss.on('connection', async (socket) => {
  console.log('🔌 New WebSocket connection')
  
  socket.id = Math.random().toString(36).substr(2, 9)
  
  socket.on('message', async (message) => {
    try {
      const data = JSON.parse(message)
      
      switch (data.type) {
        case 'join_room':
          await dbService.joinRoom(socket, data.roomId, data.address)
          socket.send(JSON.stringify({ type: 'joined_room', roomId: data.roomId }))
          break
          
        case 'chat_message':
          const chatMessage = await dbService.saveChatMessage(
            data.roomId,
            data.senderAddress,
            data.message,
            data.messageType,
            data.messageData
          )
          socket.send(JSON.stringify({ type: 'chat_sent', message: chatMessage }))
          break
          
        case 'leave_room':
          await dbService.leaveRoom(socket)
          socket.send(JSON.stringify({ type: 'left_room' }))
          break
          
        default:
          console.log('Unknown message type:', data.type)
      }
    } catch (error) {
      console.error('WebSocket message error:', error)
      socket.send(JSON.stringify({ type: 'error', message: 'Internal server error' }))
    }
  })
  
  socket.on('close', async () => {
    console.log('🔌 WebSocket connection closed')
    await dbService.leaveRoom(socket)
  })
  
  socket.on('error', (error) => {
    console.error('WebSocket error:', error)
  })
})

// ===== STARTUP =====
async function startServer() {
  try {
    // Initialize database
    const dbInitialized = await dbService.initialize()
    if (!dbInitialized) {
      console.error('❌ Failed to initialize database')
      process.exit(1)
    }
    
    // Start server
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`)
      console.log(`🌐 Health check: http://localhost:${PORT}/health`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...')
  await dbService.close()
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...')
  await dbService.close()
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})

// Start the server
startServer()
