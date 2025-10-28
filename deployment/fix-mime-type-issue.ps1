# Fix MIME Type Issue - Deploy to Hetzner Server
# This script fixes the JSX MIME type issue by updating server configuration

Write-Host "🔧 Fixing MIME Type Issue on Hetzner Server..." -ForegroundColor Green

# Server details
$SERVER_IP = "159.69.123.123"  # Replace with your actual Hetzner server IP
$SERVER_USER = "root"
$APP_PATH = "/opt/flipnosis/app"

Write-Host "📡 Connecting to server $SERVER_IP..." -ForegroundColor Yellow

# Create SSH connection
$sshCommand = @"
# Navigate to app directory
cd $APP_PATH

# Backup current server.js
echo "📦 Backing up current server.js..."
cp server/server.js server/server.js.backup.$(date +%Y%m%d_%H%M%S)

# Update server.js with MIME type fixes
echo "🔧 Updating server.js with MIME type fixes..."

# Create the updated server.js content
cat > server/server.js << 'EOF'
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
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0xd2a2d0A6a0a446c494EdD059680E0f819f9d480B'
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
console.log('📁 Checking dist path:', distPath)
console.log('📁 Dist exists:', fs.existsSync(distPath))

if (fs.existsSync(distPath)) {
  // Serve static files from the dist directory only
  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      console.log('📁 Serving static file:', filePath)
      
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
  }))
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
    if (fs.existsSync(distPath)) {
      app.get('/test-tubes.html', (req, res) => {
        console.log('🎮 Serving test-tubes.html with query params:', req.query)
        const testTubesPath = path.join(distPath, 'test-tubes.html')
        if (fs.existsSync(testTubesPath)) {
          res.sendFile(testTubesPath)
        } else {
          console.error('❌ test-tubes.html not found at:', testTubesPath)
          res.status(404).json({ error: 'test-tubes.html not found' })
        }
      })
    }

    // Catch-all for SPA (only if dist exists)
    // Exclude test-tubes.html from catch-all since it has its own route above
    if (fs.existsSync(distPath)) {
      app.get('*', (req, res) => {
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

    // Start server
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
EOF

echo "✅ Server.js updated with MIME type fixes"

# Update nginx configuration
echo "🔧 Updating nginx configuration..."

# Backup current nginx config
cp /etc/nginx/sites-available/flipnosis /etc/nginx/sites-available/flipnosis.backup.$(date +%Y%m%d_%H%M%S)

# Update nginx config with proper MIME types
cat > /etc/nginx/sites-available/flipnosis << 'EOF'
# Nginx configuration for Cloudflare Flexible SSL mode
# Cloudflare handles SSL termination and sends HTTP to your server

server {
    listen 80;
    server_name flipnosis.fun www.flipnosis.fun;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # CRITICAL: Socket.io WebSocket support with proper headers
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        
        # Essential WebSocket upgrade headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        
        # Timeout settings for long-lived connections
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        proxy_connect_timeout 60;
        
        # Disable caching for WebSocket connections
        proxy_cache_bypass $http_upgrade;
        proxy_no_cache $http_upgrade;
        
        # Buffer settings for WebSocket
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # API routes
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        proxy_connect_timeout 60;
        proxy_cache_bypass $http_upgrade;
        proxy_no_cache $http_upgrade;
    }

    # Serve static files directly from dist directory
    location /assets/ {
        alias /opt/flipnosis/app/dist/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        
        # Ensure proper MIME types for JavaScript files
        location ~* \.js$ {
            add_header Content-Type "application/javascript; charset=utf-8";
        }
        location ~* \.jsx$ {
            add_header Content-Type "application/javascript; charset=utf-8";
        }
        location ~* \.css$ {
            add_header Content-Type "text/css; charset=utf-8";
        }
    }

    # Serve other static files
    location ~* \.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webm|mp4|glb)$ {
        root /opt/flipnosis/app/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Main application - proxy to Node.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

echo "✅ Nginx configuration updated"

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    
    # Reload nginx
    echo "🔄 Reloading nginx..."
    systemctl reload nginx
    
    # Restart the application
    echo "🔄 Restarting application..."
    pm2 restart flipnosis-app
    
    echo "✅ MIME type fix deployed successfully!"
    echo "🌐 Your application should now work correctly at https://flipnosis.fun"
else
    echo "❌ Nginx configuration test failed!"
    echo "🔄 Restoring backup configuration..."
    cp /etc/nginx/sites-available/flipnosis.backup.$(date +%Y%m%d_%H%M%S) /etc/nginx/sites-available/flipnosis
    echo "⚠️ Please check the nginx configuration manually"
fi

echo "📊 Checking application status..."
pm2 status
"@

# Execute the SSH command
ssh $SERVER_USER@$SERVER_IP $sshCommand

Write-Host "✅ MIME Type Fix Deployment Complete!" -ForegroundColor Green
Write-Host "🌐 Your application should now work correctly at https://flipnosis.fun" -ForegroundColor Cyan
