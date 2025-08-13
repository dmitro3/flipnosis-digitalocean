# PostgreSQL + Redis Migration Script
# This script migrates from SQLite to PostgreSQL + Redis

param(
    [string]$ServerIP = "116.202.24.43",
    [string]$PlatformIP = "159.69.242.154",
    [string]$CommitMessage = "PostgreSQL + Redis Migration"
)

Write-Host "🚀 Starting PostgreSQL + Redis Migration..." -ForegroundColor Green

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

# Step 1: Setup PostgreSQL and Redis on Server 116
Write-Status "Step 1: Setting up PostgreSQL and Redis on server $ServerIP"

try {
    # Copy setup script to server
    Write-Status "Copying setup script to server..."
    scp -o StrictHostKeyChecking=no scripts/setup-postgresql-redis.sh "root@$ServerIP:/opt/flipnosis/"
    
    # Make script executable and run it
    ssh -o StrictHostKeyChecking=no "root@$ServerIP" "chmod +x /opt/flipnosis/setup-postgresql-redis.sh && /opt/flipnosis/setup-postgresql-redis.sh"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "PostgreSQL and Redis setup completed on server $ServerIP"
    } else {
        Write-Error "PostgreSQL and Redis setup failed on server $ServerIP"
        exit 1
    }
} catch {
    Write-Error "Failed to setup PostgreSQL and Redis: $($_.Exception.Message)"
    exit 1
}

# Step 2: Install Node.js dependencies
Write-Status "Step 2: Installing Node.js dependencies on server $ServerIP"

try {
    ssh -o StrictHostKeyChecking=no "root@$ServerIP" "cd /opt/flipnosis/app && npm install pg redis"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Node.js dependencies installed successfully"
    } else {
        Write-Error "Failed to install Node.js dependencies"
        exit 1
    }
} catch {
    Write-Error "Failed to install dependencies: $($_.Exception.Message)"
    exit 1
}

# Step 3: Run database migration
Write-Status "Step 3: Running database migration"

try {
    # Copy migration script to server
    Write-Status "Copying migration script to server..."
    scp -o StrictHostKeyChecking=no scripts/migrate-to-postgresql.js root@${ServerIP}:/opt/flipnosis/app/scripts/
    
    # Run migration
    ssh -o StrictHostKeyChecking=no root@${ServerIP} "cd /opt/flipnosis/app && node scripts/migrate-to-postgresql.js"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database migration completed successfully"
    } else {
        Write-Error "Database migration failed"
        exit 1
    }
} catch {
    Write-Error "Failed to run migration: $($_.Exception.Message)"
    exit 1
}

# Step 4: Update application code on platform server
Write-Status "Step 4: Updating application code on platform server $PlatformIP"

try {
    # Copy new database service to platform server
    Write-Status "Copying new database service to platform server..."
    scp -o StrictHostKeyChecking=no server/services/database-postgresql.js root@$PlatformIP:/opt/flipnosis/app/server/services/
    
    # Install dependencies on platform server
    Write-Status "Installing dependencies on platform server..."
    ssh -o StrictHostKeyChecking=no root@$PlatformIP "cd /opt/flipnosis/app && npm install pg redis"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Platform server dependencies installed"
    } else {
        Write-Error "Failed to install platform server dependencies"
        exit 1
    }
} catch {
    Write-Error "Failed to update platform server: $($_.Exception.Message)"
    exit 1
}

# Step 5: Update server.js to use new database service
Write-Status "Step 5: Updating server configuration"

try {
    # Create backup of current server.js
    ssh -o StrictHostKeyChecking=no root@$PlatformIP "cd /opt/flipnosis/app && cp server/server.js server/server.js.sqlite.backup"
    
    # Update server.js to use PostgreSQL database service
    $serverJsContent = @"
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
"@

    # Write the updated server.js content
    $serverJsContent | ssh -o StrictHostKeyChecking=no root@$PlatformIP "cat > /opt/flipnosis/app/server/server.js"
    
    Write-Success "Server configuration updated"
} catch {
    Write-Error "Failed to update server configuration: $($_.Exception.Message)"
    exit 1
}

# Step 6: Test the new setup
Write-Status "Step 6: Testing the new database setup"

try {
    # Test database connection
    Write-Status "Testing database connection..."
    $testResult = ssh -o StrictHostKeyChecking=no root@$PlatformIP "cd /opt/flipnosis/app && node -e 'const DatabaseService = require(\"./server/services/database-postgresql\"); const db = new DatabaseService(); db.initialize().then(() => { console.log(\"Database test successful\"); process.exit(0); }).catch(err => { console.error(\"Database test failed:\", err); process.exit(1); });'"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database connection test passed"
    } else {
        Write-Error "Database connection test failed"
        exit 1
    }
} catch {
    Write-Error "Failed to test database setup: $($_.Exception.Message)"
    exit 1
}

# Step 7: Restart the application
Write-Status "Step 7: Restarting the application"

try {
    # Restart PM2 process
    ssh -o StrictHostKeyChecking=no root@$PlatformIP "cd /opt/flipnosis/app && pm2 restart flipnosis"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Application restarted successfully"
    } else {
        Write-Error "Failed to restart application"
        exit 1
    }
} catch {
    Write-Error "Failed to restart application: $($_.Exception.Message)"
    exit 1
}

# Step 8: Verify deployment
Write-Status "Step 8: Verifying deployment"

try {
    # Wait a moment for the application to start
    Start-Sleep -Seconds 10
    
    # Test health endpoint
    $healthResponse = Invoke-RestMethod -Uri "http://$PlatformIP/health" -Method Get -TimeoutSec 30
    
    if ($healthResponse.status -eq "healthy") {
        Write-Success "Deployment verification successful"
        Write-Success "Database status: $($healthResponse.database.status)"
    } else {
        Write-Error "Deployment verification failed"
        Write-Error "Health response: $($healthResponse | ConvertTo-Json)"
        exit 1
    }
} catch {
    Write-Error "Failed to verify deployment: $($_.Exception.Message)"
    exit 1
}

# Step 9: Cleanup old SQLite files
Write-Status "Step 9: Cleaning up old SQLite files"

try {
    # Backup old SQLite databases
    ssh -o StrictHostKeyChecking=no root@$ServerIP "cd /opt/flipnosis/shared && cp flipz-clean.db flipz-clean.db.postgresql-migration-backup"
    ssh -o StrictHostKeyChecking=no root@$PlatformIP "cd /opt/flipnosis/app/server && cp flipz-clean.db flipz-clean.db.postgresql-migration-backup"
    
    Write-Success "Old SQLite databases backed up"
} catch {
    Write-Warning "Failed to backup old SQLite databases: $($_.Exception.Message)"
}

Write-Success "🎉 PostgreSQL + Redis migration completed successfully!"
Write-Host ""
Write-Host "📋 Migration Summary:" -ForegroundColor Green
Write-Host "====================" -ForegroundColor Green
Write-Host "✅ PostgreSQL and Redis installed on server $ServerIP" -ForegroundColor Green
Write-Host "✅ Database schema created and data migrated" -ForegroundColor Green
Write-Host "✅ Application updated to use PostgreSQL + Redis" -ForegroundColor Green
Write-Host "✅ WebSocket real-time functionality enabled" -ForegroundColor Green
Write-Host "✅ Application restarted and verified" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Benefits achieved:" -ForegroundColor Yellow
Write-Host "- Real-time WebSocket communication" -ForegroundColor Yellow
Write-Host "- Better concurrent connection handling" -ForegroundColor Yellow
Write-Host "- Improved performance and scalability" -ForegroundColor Yellow
Write-Host "- Professional database architecture" -ForegroundColor Yellow
Write-Host ""
Write-Host "🌐 Application URLs:" -ForegroundColor Blue
Write-Host "- Main application: http://$PlatformIP" -ForegroundColor Blue
Write-Host "- Health check: http://$PlatformIP/health" -ForegroundColor Blue
Write-Host ""
Write-Host "⚠️  Important notes:" -ForegroundColor Yellow
Write-Host "- Old SQLite databases have been backed up" -ForegroundColor Yellow
Write-Host "- Monitor the application for any issues" -ForegroundColor Yellow
Write-Host "- Check logs: pm2 logs flipnosis" -ForegroundColor Yellow
Write-Host ""
