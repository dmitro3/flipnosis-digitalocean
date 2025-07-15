const express = require('express')
const http = require('http')
const WebSocket = require('ws')
const cors = require('cors')
const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')
const fetch = require('node-fetch')
const crypto = require('crypto')
const { verifyMessage } = require('viem')

console.log('🚀 Starting FLIPNOSIS server...')

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

// Session management
const activeSessions = new Map()
const gameRooms = new Map() // gameId -> Set of socket IDs
const gameViewers = new Map() // gameId -> Set of socket IDs for viewers

// Helper to generate session ID
function generateSessionId() {
  return crypto.randomBytes(32).toString('hex')
}

// Helper to verify signatures
async function verifySignature(address, message, signature) {
  try {
    const recovered = await verifyMessage({
      address,
      message,
      signature,
    })
    return recovered.toLowerCase() === address.toLowerCase()
  } catch (error) {
    console.error('Signature verification failed:', error)
    return false
  }
}

// Railway health check endpoint
app.get('/health', (req, res) => {
  console.log(`❤️ Health check at ${new Date().toISOString()}`)
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: process.env.PORT,
    host: '0.0.0.0'
  })
})

// CORS configuration for production
app.use(cors({
  origin: true, // Allow all origins in production
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Serve static files from the dist directory (built frontend)
const distPath = path.join(__dirname, '..')
if (fs.existsSync(distPath)) {
  console.log('📁 Serving static files from:', distPath)
  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      // Set correct MIME types for JavaScript files
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript')
      } else if (filePath.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript')
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css')
      } else if (filePath.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html')
      }
    }
  }))
} else {
  console.log('⚠️ Dist directory not found, skipping static file serving')
}

// Serve static files from the public directory
const publicPath = path.join(__dirname, '..', '..', 'public')
if (fs.existsSync(publicPath)) {
  console.log('📁 Serving public files from:', publicPath)
  app.use('/public', express.static(publicPath))
}

// Database setup
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'games.db')
console.log('🗄️ Database path:', dbPath)

// Alchemy configuration
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || 'hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3'
const ALCHEMY_BASE_URL = `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`

// Helper function to fetch NFT metadata from Alchemy
async function fetchNFTMetadataFromAlchemy(contractAddress, tokenId, chain = 'base') {
  try {
    console.log('🔍 Fetching NFT metadata from Alchemy:', { contractAddress, tokenId, chain })
    
    const url = `${ALCHEMY_BASE_URL}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Alchemy API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Extract image URL with fallbacks
    let imageUrl = ''
    if (data.media && data.media.length > 0) {
      imageUrl = data.media[0].gateway || data.media[0].raw || ''
    }
    if (!imageUrl && data.rawMetadata) {
      imageUrl = data.rawMetadata.image || data.rawMetadata.image_url || data.rawMetadata.imageUrl || ''
    }
    if (imageUrl && imageUrl.startsWith('ipfs://')) {
      imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')
    }
    
    const metadata = {
      name: data.title || data.name || `NFT #${tokenId}`,
      image_url: imageUrl,
      collection_name: data.contract?.name || 'Unknown Collection',
      description: data.description || '',
      attributes: JSON.stringify(data.attributes || []),
      token_type: data.tokenType || 'ERC721'
    }
    
    console.log('✅ NFT metadata fetched:', metadata)
    return metadata
    
  } catch (error) {
    console.error('❌ Error fetching NFT metadata from Alchemy:', error)
    return null
  }
}

// Helper function to get or fetch NFT metadata with caching
async function getNFTMetadataWithCache(contractAddress, tokenId, chain = 'base') {
  return new Promise((resolve, reject) => {
    // First check cache
    db.get(
      `SELECT * FROM nft_metadata_cache 
       WHERE contract_address = ? AND token_id = ? AND chain = ?`,
      [contractAddress, tokenId, chain],
      async (err, cached) => {
        if (err) {
          console.error('❌ Cache lookup error:', err)
          return reject(err)
        }
        
        // If cached and less than 7 days old, return it
        if (cached) {
          const cacheAge = Date.now() - new Date(cached.fetched_at).getTime()
          const sevenDays = 7 * 24 * 60 * 60 * 1000
          
          if (cacheAge < sevenDays) {
            console.log('✅ Returning cached NFT metadata')
            return resolve(cached)
          }
        }
        
        // Fetch fresh data from Alchemy
        const metadata = await fetchNFTMetadataFromAlchemy(contractAddress, tokenId, chain)
        
        if (!metadata) {
          // Return cached data even if old, or empty data
          return resolve(cached || {
            name: `NFT #${tokenId}`,
            image_url: '',
            collection_name: 'Unknown Collection',
            description: '',
            attributes: '[]',
            token_type: 'ERC721'
          })
        }
        
        // Store in cache
        db.run(
          `INSERT OR REPLACE INTO nft_metadata_cache 
           (contract_address, token_id, chain, name, image_url, collection_name, 
            description, attributes, token_type, fetched_at, last_updated)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            contractAddress, tokenId, chain,
            metadata.name, metadata.image_url, metadata.collection_name,
            metadata.description, metadata.attributes, metadata.token_type
          ],
          (err) => {
            if (err) {
              console.error('❌ Error caching NFT metadata:', err)
            } else {
              console.log('✅ NFT metadata cached successfully')
            }
          }
        )
        
        resolve(metadata)
      }
    )
  })
}

// Test route
app.get('/test', (req, res) => {
  console.log('🧪 Test route hit!')
  res.json({ 
    message: 'Server is working!',
    timestamp: new Date().toISOString(),
    cors: 'enabled'
  })
})

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('❤️ Health check at', new Date().toISOString())
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    cors: 'enabled'
  })
})

// Initialize database
function initializeDatabase() {
  return new Promise((resolve, reject) => {
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err)
        reject(err)
        return
      }
      console.log('✅ Connected to SQLite database')
      
      // Create tables
  db.serialize(() => {
        // Games table - enhanced with all fields
        db.run(`
          CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
            contract_game_id TEXT UNIQUE,
            creator TEXT,
      joiner TEXT,
            nft_contract TEXT,
            nft_token_id TEXT,
      nft_name TEXT,
      nft_image TEXT,
      nft_collection TEXT,
            price_usd REAL,
      status TEXT DEFAULT 'waiting',
      winner TEXT,
      creator_wins INTEGER DEFAULT 0,
      joiner_wins INTEGER DEFAULT 0,
            current_round INTEGER DEFAULT 0,
            game_type TEXT DEFAULT 'nft-vs-crypto',
      coin TEXT,
      transaction_hash TEXT,
            nft_chain TEXT DEFAULT 'base',
            listing_fee_usd REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
      if (err) {
        console.error('❌ Error creating games table:', err)
      } else {
        console.log('✅ Games table ready')
      }
    })

    // NFT metadata cache table
        db.run(`
          CREATE TABLE IF NOT EXISTS nft_metadata_cache (
            contract_address TEXT,
            token_id TEXT,
            chain TEXT,
      name TEXT,
      image_url TEXT,
      collection_name TEXT,
      description TEXT,
      attributes TEXT,
            token_type TEXT,
            fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (contract_address, token_id, chain)
          )
        `, (err) => {
      if (err) {
        console.error('❌ Error creating nft_metadata_cache table:', err)
      } else {
        console.log('✅ NFT metadata cache table ready')
      }
    })

// Add after the existing table creation code (around line 200)

// Game listings table (games not yet on blockchain)
db.run(`
  CREATE TABLE IF NOT EXISTS game_listings (
    id TEXT PRIMARY KEY,
    creator TEXT NOT NULL,
    nft_contract TEXT NOT NULL,
    nft_token_id TEXT NOT NULL,
    nft_name TEXT,
    nft_image TEXT,
    nft_collection TEXT,
    nft_chain TEXT DEFAULT 'base',
    asking_price REAL NOT NULL,
    accepts_offers BOOLEAN DEFAULT true,
    min_offer_price REAL,
    coin TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error('❌ Error creating game_listings table:', err)
  } else {
    console.log('✅ Game listings table ready')
  }
})

// Offers table
db.run(`
  CREATE TABLE IF NOT EXISTS offers (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL,
    offerer_address TEXT NOT NULL,
    offerer_name TEXT,
    offer_price REAL NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES game_listings(id)
  )
`, (err) => {
  if (err) {
    console.error('❌ Error creating offers table:', err)
  } else {
    console.log('✅ Offers table ready')
  }
})

// Notifications table
db.run(`
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_address TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error('❌ Error creating notifications table:', err)
  } else {
    console.log('✅ Notifications table ready')
  }
})

// User presence table for online status
db.run(`
  CREATE TABLE IF NOT EXISTS user_presence (
    address TEXT PRIMARY KEY,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_online BOOLEAN DEFAULT true,
    socket_id TEXT
  )
`, (err) => {
  if (err) {
    console.error('❌ Error creating user_presence table:', err)
  } else {
    console.log('✅ User presence table ready')
  }
})
      })
      
      resolve(db)
    })
  })
}

// Global database instance
let db

// Initialize database and start server
initializeDatabase()
  .then((database) => {
    db = database
    console.log('✅ Database initialized successfully')
    
    // Start server
    const PORT = process.env.PORT || 3001
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`)
    })
  })
  .catch((error) => {
    console.error('❌ Failed to initialize database:', error)
    process.exit(1)
  })

// Update the existing WebSocket connection handler
wss.on('connection', (socket) => {
  socket.id = generateSessionId()
  console.log('🔌 New connection:', socket.id)
  
  // Initialize socket properties
  socket.authenticated = false
  socket.gameId = null
  socket.address = null
  socket.sessionId = null
  
  socket.on('message', async (message) => {
    try {
      const data = JSON.parse(message)
      console.log('📡 Received:', data.type, 'from', socket.authenticated ? socket.address : 'unauthenticated')
      
      // Handle authentication first
      if (data.type === 'authenticate_session') {
        await handleSessionAuth(socket, data)
        return
      }
      
      // Handle listing-specific messages that don't require full authentication
      if (data.type === 'subscribe_listing_chat' || data.type === 'join_listing') {
        socket.listingId = data.listingId
        socket.listingAddress = data.address || 'anonymous'
        
        // Track viewers
        if (!listingViewers.has(data.listingId)) {
          listingViewers.set(data.listingId, new Set())
        }
        listingViewers.get(data.listingId).add(socket.id)
        
        // Broadcast viewer count
        broadcastToListing(data.listingId, {
          type: 'viewer_joined',
          viewerCount: listingViewers.get(data.listingId).size
        })
        
        console.log(`👥 Viewer joined listing ${data.listingId}, total: ${listingViewers.get(data.listingId).size}`)
        return
      }
      
      // Handle game-specific messages that don't require full authentication
      if (data.type === 'subscribe_game_chat' || data.type === 'join_game') {
        socket.gameId = data.gameId
        socket.gameAddress = data.address || 'anonymous'
        
        // Track game viewers
        if (!gameViewers.has(data.gameId)) {
          gameViewers.set(data.gameId, new Set())
        }
        gameViewers.get(data.gameId).add(socket.id)
        
        // Broadcast viewer count
        broadcastToGameViewers(data.gameId, {
          type: 'viewer_joined',
          viewerCount: gameViewers.get(data.gameId).size
        })
        
        console.log(`👥 Viewer joined game ${data.gameId}, total: ${gameViewers.get(data.gameId).size}`)
        return
      }
      
      if (data.type === 'listing_chat') {
        if (!socket.listingId) {
          console.log('❌ Chat message without listing subscription')
          return
        }
        
        // Broadcast chat message to all viewers
        broadcastToListing(socket.listingId, {
          type: 'listing_chat_message',
          listingId: socket.listingId,
          address: socket.listingAddress,
          message: data.message,
          timestamp: Date.now()
        })
        return
      }
      
      if (data.type === 'game_chat') {
        if (!socket.gameId) {
          console.log('❌ Game chat message without game subscription')
          return
        }
        
        // Broadcast chat message to all game viewers
        broadcastToGameViewers(socket.gameId, {
          type: 'game_chat_message',
          gameId: socket.gameId,
          address: socket.gameAddress,
          message: data.message,
          timestamp: Date.now()
        })
        return
      }
      
      if (data.type === 'leave_listing') {
        if (socket.listingId && listingViewers.has(socket.listingId)) {
          listingViewers.get(socket.listingId).delete(socket.id)
          // Broadcast viewer left
          broadcastToListing(socket.listingId, {
            type: 'viewer_left',
            viewerCount: listingViewers.get(socket.listingId).size
          })
          // Clean up empty listings
          if (listingViewers.get(socket.listingId).size === 0) {
            listingViewers.delete(socket.listingId)
          }
        }
        socket.listingId = null
        socket.listingAddress = null
        return
      }
      
      if (data.type === 'leave_game') {
        if (socket.gameId && gameViewers.has(socket.gameId)) {
          gameViewers.get(socket.gameId).delete(socket.id)
          // Broadcast viewer left
          broadcastToGameViewers(socket.gameId, {
            type: 'viewer_left',
            viewerCount: gameViewers.get(socket.gameId).size
          })
          // Clean up empty games
          if (gameViewers.get(socket.gameId).size === 0) {
            gameViewers.delete(socket.gameId)
          }
        }
        socket.gameId = null
        socket.gameAddress = null
        return
      }
      
      // Add presence update
      if (data.type === 'update_presence' && socket.authenticated) {
        db.run(
          `INSERT OR REPLACE INTO user_presence (address, last_seen, is_online, socket_id) 
           VALUES (?, CURRENT_TIMESTAMP, true, ?)`,
          [socket.address, socket.id]
        )
        return
      }
      
      // Handle dashboard-specific messages
      if (data.type === 'subscribe_dashboard' && socket.authenticated) {
        socket.isDashboard = true
        socket.dashboardAddress = data.address
        return
      }
      
      // All other messages require authentication
      if (!socket.authenticated) {
        socket.send(JSON.stringify({
          type: 'error',
          message: 'Not authenticated. Please sign in first.'
        }))
        return
      }
      
      // Route authenticated messages
      switch (data.type) {
        case 'player_choice':
          handlePlayerChoice(socket, data)
          break
          
        case 'start_charging':
          handleStartCharging(socket, data)
          break
          
        case 'stop_charging':
          handleStopCharging(socket, data)
          break
          
        case 'chat_message':
          handleChatMessage(socket, data)
          break
          
        case 'dashboard_chat':
          handleDashboardChat(socket, data)
          break
          
        case 'request_game_state':
          sendGameState(socket)
          break
          
        case 'join_asset_loading': {
          socket.assetGameId = data.gameId
          socket.assetAddress = data.address
          
          // Join asset loading room
          if (!assetLoadingRooms.has(data.gameId)) {
            assetLoadingRooms.set(data.gameId, new Set())
          }
          assetLoadingRooms.get(data.gameId).add(socket.id)
          break
        }
        case 'asset_loaded': {
          // Broadcast to all in asset loading room
          broadcastToAssetRoom(data.gameId, {
            type: data.assetType === 'nft' ? 'nft_loaded' : 'crypto_loaded',
            gameId: data.gameId,
            loadedBy: socket.assetAddress
          })
          break
        }
        case 'game_cancelled': {
          broadcastToAssetRoom(data.gameId, {
            type: 'game_cancelled',
            gameId: data.gameId,
            cancelledBy: data.cancelledBy
          })
          break
        }
        default:
          console.log('❓ Unknown message type:', data.type)
      }
    } catch (error) {
      console.error('❌ Error handling WebSocket message:', error)
    }
  })
  
  socket.on('close', () => {
    console.log('🔌 Connection closed:', socket.id)
    handleDisconnect(socket)
  })
  
  socket.on('error', (error) => {
    console.error('❌ WebSocket error:', error)
    handleDisconnect(socket)
  })
})

// Add new dashboard chat handler
function handleDashboardChat(socket, data) {
  const { listingId, message } = data
  
  // Store message in database if needed
  
  // Broadcast to all users watching this listing
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && 
        client.isDashboard && 
        client.dashboardListingId === listingId) {
      client.send(JSON.stringify({
        type: 'dashboard_chat_message',
        listingId,
        address: socket.address,
        message,
        timestamp: Date.now()
      }))
    }
  })
}

// Game state storage (in-memory for now, could be moved to database)
const gameStates = new Map()

// New authentication handler
async function handleSessionAuth(socket, data) {
  const { gameId, address, signature, timestamp } = data
  
  // Verify timestamp is recent (within 5 minutes)
  const now = Date.now()
  if (Math.abs(now - timestamp) > 5 * 60 * 1000) {
    socket.send(JSON.stringify({
      type: 'auth_failed',
      error: 'Signature expired'
    }))
    return
  }
  
  // Verify signature
  const message = `Join Flip Game #${gameId} at ${timestamp}`
  const isValid = await verifySignature(address, message, signature)
  
  if (!isValid) {
    socket.send(JSON.stringify({
      type: 'auth_failed',
      error: 'Invalid signature'
    }))
    return
  }
  
  // Check if player belongs to this game
  db.get('SELECT * FROM games WHERE id = ? AND (creator = ? OR joiner = ?)', 
    [gameId, address, address], 
    (err, game) => {
      if (err || !game) {
        socket.send(JSON.stringify({
          type: 'auth_failed',
          error: 'Not a participant in this game'
        }))
        return
      }
      
      // Create session
      socket.authenticated = true
      socket.gameId = gameId
      socket.address = address
      socket.sessionId = generateSessionId()
      socket.isCreator = game.creator === address
      
      // Add to game room
      if (!gameRooms.has(gameId)) {
        gameRooms.set(gameId, new Set())
      }
      gameRooms.get(gameId).add(socket.id)
      
      // Store session
      activeSessions.set(socket.sessionId, {
        socketId: socket.id,
        address,
        gameId,
        isCreator: socket.isCreator,
        connectedAt: now
      })
      
      console.log(`✅ Authenticated ${address} for game ${gameId}`)
      
      // Send success response with game state
      socket.send(JSON.stringify({
        type: 'session_established',
        sessionId: socket.sessionId,
        gameId,
        address,
        isCreator: socket.isCreator
      }))
      
      // Send current game state
      sendGameState(socket)
      
      // Notify other player
      broadcastToGame(gameId, {
        type: 'player_connected',
        address,
        isCreator: socket.isCreator
      }, socket.id)
    }
  )
}

// Handle disconnect
function handleDisconnect(socket) {
  if (socket.sessionId) {
    activeSessions.delete(socket.sessionId)
  }
  
  if (socket.gameId && gameRooms.has(socket.gameId)) {
    gameRooms.get(socket.gameId).delete(socket.id)
    
    // Notify other player
    broadcastToGame(socket.gameId, {
      type: 'player_disconnected',
      address: socket.address,
      isCreator: socket.isCreator
    }, socket.id)
  }
  
  // Clean up listing viewers
  if (socket.listingId && listingViewers.has(socket.listingId)) {
    listingViewers.get(socket.listingId).delete(socket.id)
    // Broadcast viewer left
    broadcastToListing(socket.listingId, {
      type: 'viewer_left',
      viewerCount: listingViewers.get(socket.listingId).size
    })
    // Clean up empty listings
    if (listingViewers.get(socket.listingId).size === 0) {
      listingViewers.delete(socket.listingId)
    }
  }
  
  // Clean up game viewers
  if (socket.gameId && gameViewers.has(socket.gameId)) {
    gameViewers.get(socket.gameId).delete(socket.id)
    // Broadcast viewer left
    broadcastToGameViewers(socket.gameId, {
      type: 'viewer_left',
      viewerCount: gameViewers.get(socket.gameId).size
    })
    // Clean up empty games
    if (gameViewers.get(socket.gameId).size === 0) {
      gameViewers.delete(socket.gameId)
    }
  }
  
  // Clean up asset loading rooms
  if (socket.assetGameId && assetLoadingRooms.has(socket.assetGameId)) {
    assetLoadingRooms.get(socket.assetGameId).delete(socket.id)
    // Clean up empty rooms
    if (assetLoadingRooms.get(socket.assetGameId).size === 0) {
      assetLoadingRooms.delete(socket.assetGameId)
    }
  }
}

// Updated broadcast function
function broadcastToGame(gameId, message, excludeSocketId = null) {
  const room = gameRooms.get(gameId)
  if (!room) return
  
  let sentCount = 0
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && 
        room.has(client.id) && 
        client.id !== excludeSocketId) {
      client.send(JSON.stringify(message))
      sentCount++
    }
  })
  
  console.log(`📡 Broadcasted ${message.type} to ${sentCount} clients in game ${gameId}`)
}

// Broadcast to game viewers (non-participants)
function broadcastToGameViewers(gameId, message, excludeSocketId = null) {
  const viewers = gameViewers.get(gameId)
  if (!viewers) return
  
  let sentCount = 0
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && 
        viewers.has(client.id) && 
        client.id !== excludeSocketId) {
      client.send(JSON.stringify(message))
      sentCount++
    }
  })
  
  console.log(`📡 Broadcasted ${message.type} to ${sentCount} viewers in game ${gameId}`)
}

// Send game state to specific socket
function sendGameState(socket) {
  const gameState = gameStates.get(socket.gameId)
  if (!gameState) {
    // Initialize if not exists
    initializeGameState(socket.gameId)
    return
  }
  
  socket.send(JSON.stringify({
    type: 'game_state',
    ...gameState,
    yourAddress: socket.address,
    isYourTurn: gameState.currentPlayer === socket.address
  }))
}

// Add chat message handler
function handleChatMessage(socket, data) {
  const { message } = data
  
  broadcastToGame(socket.gameId, {
    type: 'chat_message',
    address: socket.address,
    isCreator: socket.isCreator,
    message: message,
    timestamp: Date.now()
  })
}

// WebSocket message handlers
function handlePlayerConnect(socket, data) {
  const { gameId, address } = data
  
  if (!gameId || !address) {
    console.error('❌ connect_to_game: Missing gameId or address')
    return
  }
  
  console.log(`🎮 Player ${address} connecting to game ${gameId}`)
  
  // Check if this player can join the game
  db.get('SELECT creator, joiner, status FROM games WHERE id = ?', [gameId], (err, game) => {
    if (err) {
      console.error('❌ Error checking game for join:', err)
      return
    }
    
    if (!game) {
      console.error(`❌ Game ${gameId} not found`)
      return
    }
    
    console.log(`📊 Game ${gameId} status: ${game.status}, creator: ${game.creator}, joiner: ${game.joiner}`)
    
    // If game is waiting and this is not the creator, they can join
    if (game.status === 'waiting' && game.creator !== address && !game.joiner) {
      console.log(`✅ Player ${address} joining game ${gameId}`)
      
      // Update game with joiner
      db.run(
        `UPDATE games SET joiner = ?, status = 'joined', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'waiting'`,
        [address, gameId],
        function(err) {
          if (err) {
            console.error('❌ Error updating game with joiner:', err)
            return
          }
          
          if (this.changes === 0) {
            console.warn(`⚠️ Game ${gameId} not found or already has a joiner`)
            return
          }
          
          console.log(`✅ Player ${address} joined game ${gameId} successfully`)
          
          // Broadcast player joined to all clients in the game
          broadcastToGame(gameId, {
            type: 'player_joined',
            gameId: gameId,
            joiner: address,
            timestamp: Date.now()
          })
          
          // Also broadcast to both players to exit lobby
          console.log('🎮 Broadcasting game ready to creator:', game.creator)
          broadcastToUser(game.creator, {
            type: 'game_ready',
            gameId: gameId,
            message: 'Game is ready! Both players can now enter the game.'
          })
          console.log('🎮 Broadcasting game ready to joiner:', address)
          broadcastToUser(address, {
            type: 'game_ready',
            gameId: gameId,
            message: 'Game is ready! Both players can now enter the game.'
          })
          
          // Initialize server-side game state for real-time coordination
          const gameState = {
            phase: 'choosing',
            currentPlayer: game.creator,
            creatorChoice: null,
            joinerChoice: null,
            creatorPower: 0,
            joinerPower: 0,
            turnTimeLeft: 30,
            round: 1,
            creatorWins: 0,
            joinerWins: 0
          }
          gameStates.set(gameId, gameState)
          
          // Broadcast initial game state to all players
          broadcastToGame(gameId, {
            type: 'game_state',
            gameId: gameId,
            phase: 'choosing',
            currentPlayer: game.creator,
            creatorChoice: null,
            joinerChoice: null,
            turnTimeLeft: 30,
            round: 1
          })
          
          console.log('✅ Player joined - game state initialized for real-time coordination')
        }
      )
    } else if (game.creator === address || game.joiner === address) {
      // This is one of the players, just acknowledge connection
      console.log(`✅ Player ${address} reconnected to game ${gameId}`)
      
      // Send current game state
      broadcastToGame(gameId, {
        type: 'player_reconnected',
        gameId: gameId,
        player: address,
        timestamp: Date.now()
      })
    } else {
      console.log(`⚠️ Player ${address} cannot join game ${gameId} (status: ${game.status})`)
    }
  })
}

function handleStartGame(socket, data) {
  const { gameId } = data
  
  if (!gameId) {
    console.error('❌ start_game: Missing gameId')
    return
  }
  
  console.log(`🎮 Starting game ${gameId} via WebSocket`)
  
  // First check current game status
  db.get('SELECT status FROM games WHERE id = ?', [gameId], (err, game) => {
    if (err) {
      console.error('❌ Error checking game status:', err)
      return
    }
    
    if (!game) {
      console.error(`❌ Game ${gameId} not found`)
      return
    }
    
    console.log(`📊 Current game status: ${game.status}`)
    
    if (game.status !== 'joined') {
      console.warn(`⚠️ Game ${gameId} is not in 'joined' status (current: ${game.status})`)
      return
    }
    
    // Update game status in database
    db.run(
      `UPDATE games SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'joined'`,
      [gameId],
      function(err) {
        if (err) {
          console.error('❌ Error starting game in database:', err)
          return
        }
        
        if (this.changes === 0) {
          console.warn(`⚠️ Game ${gameId} not found or not ready to start`)
          return
        }
        
        console.log(`✅ Game ${gameId} started successfully (${this.changes} rows updated)`)
        
        // Broadcast game started to all clients in the game
        broadcastToGame(gameId, {
          type: 'game_started',
          gameId: gameId,
          timestamp: Date.now()
        })
        
        // Initialize game state for the first round
        setTimeout(() => {
          initializeGameState(gameId)
        }, 1000)
      }
    )
  })
}

function handleStartCharging(socket, data) {
  const { gameId, address } = data
  
  if (!gameId || !address) {
    console.error('❌ start_charging: Missing gameId or address')
    return
  }
  
  console.log(`⚡ Player ${address} started charging in game ${gameId}`)
  
  // Broadcast charging start to all players in the game
  broadcastToGame(gameId, {
    type: 'charging_started',
    gameId: gameId,
    player: address,
    timestamp: Date.now()
  })
}

function handleStopCharging(socket, data) {
  const { gameId, address } = data
  
  if (!gameId || !address) {
    console.error('❌ stop_charging: Missing gameId or address')
    return
  }
  
  console.log(`🪙 Player ${address} stopped charging in game ${gameId}`)
  
  // Broadcast charging stop to all players in the game
  broadcastToGame(gameId, {
    type: 'charging_stopped',
    gameId: gameId,
    player: address,
    timestamp: Date.now()
  })
}

// Updated player choice handler - no signature needed!
function handlePlayerChoice(socket, data) {
  const { choice } = data
  const gameId = socket.gameId
  const address = socket.address
  
  console.log(`🎯 Player ${address} chose ${choice} in game ${gameId}`)
  
  // Get or create game state
  let gameState = gameStates.get(gameId)
  if (!gameState) {
    console.error('❌ No game state found')
    return
  }
  
  // Update choice based on player
  if (socket.isCreator) {
    gameState.creatorChoice = choice
  } else {
    gameState.joinerChoice = choice
  }
  
  // Broadcast the choice immediately
  broadcastToGame(gameId, {
    type: 'player_choice_made',
    player: address,
    isCreator: socket.isCreator,
    choice: choice
  })
  
  // Check if both players have chosen
  if (gameState.creatorChoice && gameState.joinerChoice) {
    console.log('🎮 Both players have chosen - ready to flip!')
    
    gameState.phase = 'round_active'
    gameState.bothChosen = true
    
    broadcastToGame(gameId, {
      type: 'both_players_ready',
      creatorChoice: gameState.creatorChoice,
      joinerChoice: gameState.joinerChoice,
      phase: 'round_active'
    })
  }
}

function processPlayerChoice(gameId, address, choice, gameState, gameData) {
  // Determine if this is creator or joiner
  let isCreator = false
  if (gameData) {
    isCreator = address === gameData.creator
  } else {
    // Get from database if not provided
    db.get('SELECT creator FROM games WHERE id = ?', [gameId], (err, game) => {
      if (err || !game) {
        console.error('❌ Error getting game data:', err)
        return
      }
      isCreator = address === game.creator
      processPlayerChoice(gameId, address, choice, gameState, game)
    })
    return
  }
  
  // Update the appropriate choice
  if (isCreator) {
    gameState.creatorChoice = choice
  } else {
    gameState.joinerChoice = choice
  }
  
  console.log(`📊 Game state after choice:`, {
    creatorChoice: gameState.creatorChoice,
    joinerChoice: gameState.joinerChoice,
    phase: gameState.phase
  })
  
  // Broadcast the choice to all players
  broadcastToGame(gameId, {
    type: 'player_choice',
    gameId: gameId,
    player: address,
    choice: choice,
    isCreator: isCreator,
    timestamp: Date.now()
  })
  
  // Check if both players have made their choices
  if (gameState.creatorChoice && gameState.joinerChoice) {
    console.log('🎮 Both players have chosen - starting round!')
    
    // Transition to round_active phase
    gameState.phase = 'round_active'
    gameState.turnTimeLeft = 30
    gameState.currentPlayer = gameData.creator // Creator goes first
    
    // Broadcast updated game state
    broadcastToGame(gameId, {
      type: 'game_state',
      gameId: gameId,
      phase: 'round_active',
      currentPlayer: gameState.currentPlayer,
      creatorChoice: gameState.creatorChoice,
      joinerChoice: gameState.joinerChoice,
      turnTimeLeft: gameState.turnTimeLeft,
      round: gameState.round
    })
    
    // Start the timer
    startGameTimer(gameId, gameState)
  }
}

// Initialize game state when both players connected
function initializeGameState(gameId) {
  db.get('SELECT * FROM games WHERE id = ?', [gameId], (err, game) => {
    if (err || !game) return
    
    const gameState = {
      gameId,
      phase: 'choosing',
      currentRound: 1,
      creatorChoice: null,
      joinerChoice: null,
      creatorPower: 0,
      joinerPower: 0,
      creatorWins: game.creator_wins || 0,
      joinerWins: game.joiner_wins || 0,
      rounds: [],
      creator: game.creator,
      joiner: game.joiner,
      coin: game.coin ? JSON.parse(game.coin) : null,
      bothChosen: false
    }
    
    gameStates.set(gameId, gameState)
    
    // Send initial state to all connected players
    broadcastToGame(gameId, {
      type: 'game_state',
      ...gameState
    })
  })
}

function startGameTimer(gameId, gameState) {
  console.log(`⏰ Starting timer for game ${gameId}`)
  
  const timer = setInterval(() => {
    gameState.turnTimeLeft--
    
    // Broadcast timer update
    broadcastToGame(gameId, {
      type: 'timer_update',
      gameId: gameId,
      turnTimeLeft: gameState.turnTimeLeft
    })
    
    // Auto-flip when timer reaches 0
    if (gameState.turnTimeLeft <= 0) {
      clearInterval(timer)
      console.log(`⏰ Timer expired for game ${gameId} - auto-flipping`)
      
      // Auto-flip with 0 power
      handleAutoFlip(gameId, gameState)
    }
  }, 1000)
  
  // Store timer reference for cleanup
  gameState.timer = timer
}

function handleAutoFlip(gameId, gameState) {
  console.log(`🎲 Auto-flipping for game ${gameId}`)
  
  // Generate random result (0 = heads, 1 = tails)
  const result = Math.floor(Math.random() * 2)
  const winner = result === 0 ? 'heads' : 'tails'
  
  // Determine round winner
  let roundWinner = null
  if (gameState.creatorChoice === winner) {
    roundWinner = 'creator'
    gameState.creatorWins++
  } else {
    roundWinner = 'joiner'
    gameState.joinerWins++
  }
  
  // Broadcast round result
  broadcastToGame(gameId, {
    type: 'round_result',
    gameId: gameId,
    result: result,
    winner: winner,
    roundWinner: roundWinner,
    creatorWins: gameState.creatorWins,
    joinerWins: gameState.joinerWins,
    round: gameState.round
  })
  
  // Check if game is complete (best of 5)
  if (gameState.creatorWins >= 3 || gameState.joinerWins >= 3) {
    const gameWinner = gameState.creatorWins >= 3 ? 'creator' : 'joiner'
    console.log(`🏆 Game ${gameId} completed! Winner: ${gameWinner}`)
    
    // Broadcast game completion
    broadcastToGame(gameId, {
      type: 'game_completed',
      gameId: gameId,
      winner: gameWinner,
      creatorWins: gameState.creatorWins,
      joinerWins: gameState.joinerWins
    })
    
    // Clean up game state
    gameStates.delete(gameId)
  } else {
    // Start next round
    gameState.round++
    gameState.phase = 'choosing'
    gameState.creatorChoice = null
    gameState.joinerChoice = null
    gameState.turnTimeLeft = 30
    gameState.currentPlayer = gameState.currentPlayer === 'creator' ? 'joiner' : 'creator'
    
    // Broadcast next round state
    broadcastToGame(gameId, {
      type: 'game_state',
      gameId: gameId,
      phase: 'choosing',
      currentPlayer: gameState.currentPlayer,
      creatorChoice: null,
      joinerChoice: null,
      turnTimeLeft: 30,
      round: gameState.round,
      creatorWins: gameState.creatorWins,
      joinerWins: gameState.joinerWins
    })
  }
}

function broadcastToGame(gameId, message) {
  let sentCount = 0
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client.gameId === gameId) {
      client.send(JSON.stringify(message))
      sentCount++
    }
  })
  console.log(`📡 Broadcasted ${message.type} to ${sentCount} clients in game ${gameId}`)
}

// ===== API ENDPOINTS =====

// Get all available games
app.get('/api/games', async (req, res) => {
  try {
    const { status, chain, game_type } = req.query
    
    let query = 'SELECT * FROM games WHERE 1=1'
    const params = []
    
    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }
    
    if (chain) {
      query += ' AND nft_chain = ?'
      params.push(chain)
    }
    
    if (game_type) {
      query += ' AND game_type = ?'
      params.push(game_type)
    }
    
    // Show all games by default (waiting, joined, active, completed)
    // Only hide cancelled games by default
    if (!status) {
      query += ' AND status != "cancelled"'
    }
    
    query += ' ORDER BY created_at DESC'
    
    db.all(query, params, (err, games) => {
      if (err) {
        console.error('❌ Error fetching games:', err)
        return res.status(500).json({ error: err.message })
      }
      
      // Parse coin data for each game
      const gamesWithParsedCoin = games.map(game => {
        if (game.coin && typeof game.coin === 'string') {
          try {
            game.coin = JSON.parse(game.coin)
          } catch (e) {
            console.warn('Could not parse coin data for game:', game.id)
          }
        }
        return game
      })
      
      res.json(gamesWithParsedCoin)
    })
  } catch (error) {
    console.error('❌ Error fetching games:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get specific game
app.get('/api/games/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params
    
    db.get('SELECT * FROM games WHERE id = ?', [gameId], (err, game) => {
      if (err || !game) {
        return res.status(404).json({ error: 'Game not found' })
      }
      
      // Parse coin data if it's a string
      if (game.coin && typeof game.coin === 'string') {
        try {
          game.coin = JSON.parse(game.coin)
        } catch (e) {
          console.warn('Could not parse coin data for game:', game.id)
        }
      }
      
      res.json(game)
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// NFT metadata endpoint
app.get('/api/nft-metadata/:chain/:contract/:tokenId', async (req, res) => {
  try {
    const { chain, contract, tokenId } = req.params
    
    const metadata = await getNFTMetadataWithCache(contract, tokenId, chain)
    
    if (!metadata) {
      return res.status(404).json({ error: 'NFT metadata not found' })
    }
    
    res.json(metadata)
  } catch (error) {
    console.error('❌ Error fetching NFT metadata:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update game in database
app.post('/api/games/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params
    const updates = req.body
    
    const setClause = Object.keys(updates)
      .filter(key => key !== 'id')
      .map(key => `${key} = ?`)
      .join(', ')
    
    const values = Object.keys(updates)
      .filter(key => key !== 'id')
      .map(key => updates[key])
    
    values.push(gameId)
    
    db.run(
      `UPDATE games SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values,
      function(err) {
        if (err) {
          console.error('❌ Error updating game:', err)
          return res.status(500).json({ error: err.message })
        }
        
        res.json({ success: true, changes: this.changes })
      }
    )
  } catch (error) {
    console.error('❌ Error updating game:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create game in database
app.post('/api/games', async (req, res) => {
  try {
    const gameData = req.body
    
    // Convert coin data to JSON string if it's an object
    const coinData = gameData.coin ? JSON.stringify(gameData.coin) : null
    
    // Fetch NFT metadata if not provided
    let nftName = gameData.nft_name
    let nftImage = gameData.nft_image
    let nftCollection = gameData.nft_collection
    
    if (!nftName || !nftImage || !nftCollection) {
      console.log('🔍 Fetching NFT metadata for game creation:', {
        contract: gameData.nft_contract,
        tokenId: gameData.nft_token_id,
        chain: gameData.nft_chain || 'base'
      })
      
      try {
        const metadata = await getNFTMetadataWithCache(
          gameData.nft_contract, 
          gameData.nft_token_id, 
          gameData.nft_chain || 'base'
        )
        
        if (metadata) {
          nftName = nftName || metadata.name
          nftImage = nftImage || metadata.image_url
          nftCollection = nftCollection || metadata.collection_name
          
          console.log('✅ NFT metadata fetched for game creation:', {
            name: nftName,
            image: nftImage?.substring(0, 50) + '...',
            collection: nftCollection
          })
        }
      } catch (metadataError) {
        console.warn('⚠️ Failed to fetch NFT metadata for game creation:', metadataError)
        // Continue with default values
      }
    }
    
    db.run(
      `INSERT INTO games (
        id, contract_game_id, creator, joiner, nft_contract, nft_token_id,
        nft_name, nft_image, nft_collection, price_usd, status, winner, 
        creator_wins, joiner_wins, current_round, game_type, coin, 
        transaction_hash, nft_chain, listing_fee_usd
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        gameData.id,
        gameData.contract_game_id,
        gameData.creator,
        gameData.joiner || null,
        gameData.nft_contract,
        gameData.nft_token_id,
        nftName || `NFT #${gameData.nft_token_id}`,
        nftImage || '/placeholder-nft.svg',
        nftCollection || 'Unknown Collection',
        gameData.price_usd,
        gameData.status || 'waiting',
        gameData.winner || null,
        gameData.creator_wins || 0,
        gameData.joiner_wins || 0,
        gameData.current_round || 0,
        gameData.game_type || 'nft-vs-crypto',
        coinData,
        gameData.transaction_hash || null,
        gameData.nft_chain || 'base',
        gameData.listing_fee_usd || null
      ],
      function(err) {
        if (err) {
          console.error('❌ Error creating game:', err)
          return res.status(500).json({ error: err.message })
        }
        
        console.log('✅ Game created successfully with NFT metadata:', {
          id: gameData.id,
          nftName,
          nftImage: nftImage?.substring(0, 50) + '...',
          nftCollection
        })
        
        res.json({ success: true, id: gameData.id })
      }
    )
  } catch (error) {
    console.error('❌ Error creating game:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get join price for a game
app.get('/api/games/:gameId/join-price', async (req, res) => {
  try {
    const { gameId } = req.params
    
    db.get('SELECT price_usd, game_type FROM games WHERE id = ?', [gameId], async (err, game) => {
      if (err || !game) {
        return res.status(404).json({ error: 'Game not found' })
      }
      
      // For now, return a simple calculation
      // In production, you'd want to get the actual ETH price from a price feed
      const priceUSD = game.price_usd || 0
      const ethPrice = 3000 // $3000 per ETH (you should use a real price feed)
      const weiAmount = Math.floor((priceUSD / ethPrice) * 1e18)
      
      res.json({ 
        weiAmount: weiAmount.toString(),
        priceUSD: priceUSD,
        ethPrice: ethPrice
      })
    })
  } catch (error) {
    console.error('❌ Error getting join price:', error)
    res.status(500).json({ error: error.message })
  }
})

// Join game (update database when someone joins)
app.post('/api/games/:gameId/join', async (req, res) => {
  try {
    const { gameId } = req.params
    const { joiner, transactionHash } = req.body
    
    if (!joiner) {
      return res.status(400).json({ error: 'Joiner address is required' })
    }
    
    console.log(`🎮 Attempting to join game ${gameId} with joiner ${joiner}`)
    db.run(
      `UPDATE games SET 
       joiner = ?, 
       status = 'joined', 
       updated_at = CURRENT_TIMESTAMP,
       transaction_hash = COALESCE(?, transaction_hash)
       WHERE id = ? AND (status = 'waiting' OR status = 'pending')`,
      [joiner, transactionHash, gameId],
      function(err) {
        if (err) {
          console.error('❌ Error joining game:', err)
          return res.status(500).json({ error: err.message })
        }
        
        console.log(`📊 Database update result: ${this.changes} rows changed`)
        
        if (this.changes === 0) {
          console.log(`⚠️ No rows updated - game not found or already joined`)
          return res.status(404).json({ error: 'Game not found or already joined' })
        }
        
        console.log(`✅ Player ${joiner} joined game ${gameId}`)
        
        // Notify all clients in the game room
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'game_joined',
              gameId: gameId,
              joiner: joiner
            }))
          }
        })
        
        res.json({ success: true, changes: this.changes })
      }
    )
  } catch (error) {
    console.error('❌ Error joining game:', error)
    res.status(500).json({ error: error.message })
  }
})

// Start game (change status from joined to active)
app.post('/api/games/:gameId/start', async (req, res) => {
  try {
    const { gameId } = req.params
    
    db.run(
      `UPDATE games SET 
       status = 'active', 
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'joined'`,
      [gameId],
      function(err) {
        if (err) {
          console.error('❌ Error starting game:', err)
          return res.status(500).json({ error: err.message })
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Game not found or not ready to start' })
        }
        
        console.log(`🎮 Game ${gameId} started`)
        
        // Notify all clients in the game room
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'game_started',
              gameId: gameId
            }))
          }
        })
        
        res.json({ success: true, changes: this.changes })
      }
    )
  } catch (error) {
    console.error('❌ Error starting game:', error)
    res.status(500).json({ error: error.message })
  }
})

// Sync games from blockchain to database
app.post('/api/sync-games', async (req, res) => {
  try {
    console.log('🔄 Starting blockchain to database sync...')
    
    // This would require contract integration
    // For now, just return success
    res.json({ 
      success: true, 
      message: 'Sync endpoint ready - implement contract integration' 
    })
  } catch (error) {
    console.error('❌ Error syncing games:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get games by creator
app.get('/api/games/creator/:address', async (req, res) => {
  try {
    const { address } = req.params
    
    db.all('SELECT * FROM games WHERE creator = ? ORDER BY created_at DESC', [address], (err, games) => {
      if (err) {
        console.error('❌ Error fetching creator games:', err)
        return res.status(500).json({ error: err.message })
      }
      
      // Parse coin data for each game
      const gamesWithParsedCoin = games.map(game => {
        if (game.coin && typeof game.coin === 'string') {
          try {
            game.coin = JSON.parse(game.coin)
          } catch (e) {
            console.warn('Could not parse coin data for game:', game.id)
            game.coin = null
          }
        }
        return game
      })
      
      res.json(gamesWithParsedCoin)
    })
  } catch (error) {
    console.error('❌ Error fetching creator games:', error)
    res.status(500).json({ error: error.message })
  }
})

// ===== ADMIN ENDPOINTS =====

// Get all games for admin panel
app.get('/api/admin/games', async (req, res) => {
  try {
    db.all('SELECT * FROM games ORDER BY created_at DESC', [], (err, games) => {
      if (err) {
        console.error('❌ Error fetching admin games:', err)
        return res.status(500).json({ error: err.message })
      }
      
      // Parse coin data for each game
      const gamesWithParsedCoin = games.map(game => {
        if (game.coin && typeof game.coin === 'string') {
          try {
            game.coin = JSON.parse(game.coin)
          } catch (e) {
            console.warn('Could not parse coin data for game:', game.id)
            game.coin = null
          }
        }
        return game
      })
      
      // Get stats
      const totalGames = games.length
      const activeGames = games.filter(g => g.status === 'waiting' || g.status === 'joined' || g.status === 'active').length
      const completedGames = games.filter(g => g.status === 'completed').length
      const cancelledGames = games.filter(g => g.status === 'cancelled').length
      
      res.json({
        games: gamesWithParsedCoin,
        stats: {
          totalGames,
          activeGames,
          completedGames,
          cancelledGames
        }
      })
    })
  } catch (error) {
    console.error('❌ Error fetching admin games:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update game status (admin)
app.patch('/api/admin/games/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params
    const updates = req.body
    
    const setClause = Object.keys(updates)
      .filter(key => key !== 'id')
      .map(key => `${key} = ?`)
      .join(', ')
    
    const values = Object.keys(updates)
      .filter(key => key !== 'id')
      .map(key => updates[key])
    
    values.push(gameId)
    
    db.run(
      `UPDATE games SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values,
      function(err) {
        if (err) {
          console.error('❌ Error updating admin game:', err)
          return res.status(500).json({ error: err.message })
        }
        
        res.json({ success: true, changes: this.changes })
      }
    )
  } catch (error) {
    console.error('❌ Error updating admin game:', error)
    res.status(500).json({ error: error.message })
  }
})

// Cancel game (admin)
app.put('/api/admin/games/:gameId/cancel', async (req, res) => {
  try {
    const { gameId } = req.params
    
    db.run(
      'UPDATE games SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [gameId],
      function(err) {
        if (err) {
          console.error('❌ Error cancelling game:', err)
          return res.status(500).json({ error: err.message })
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Game not found' })
        }
        
        console.log(`✅ Game ${gameId} cancelled by admin`)
        res.json({ success: true, changes: this.changes })
      }
    )
  } catch (error) {
    console.error('❌ Error cancelling game:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete game (admin)
app.delete('/api/admin/games/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params
    
    db.run('DELETE FROM games WHERE id = ?', [gameId], function(err) {
      if (err) {
        console.error('❌ Error deleting game:', err)
        return res.status(500).json({ error: err.message })
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Game not found' })
      }
      
      console.log(`🗑️ Game ${gameId} deleted by admin`)
      res.json({ success: true, changes: this.changes })
    })
  } catch (error) {
    console.error('❌ Error deleting game:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete all games (admin)
app.delete('/api/admin/games', async (req, res) => {
  try {
    db.run('DELETE FROM games', [], function(err) {
      if (err) {
        console.error('❌ Error deleting all games:', err)
        return res.status(500).json({ error: err.message })
      }
      
      console.log(`🗑️ All games deleted by admin (${this.changes} games)`)
      res.json({ success: true, changes: this.changes })
    })
  } catch (error) {
    console.error('❌ Error deleting all games:', error)
    res.status(500).json({ error: error.message })
  }
})

// Pause all games (admin)
app.post('/api/admin/pause-all', async (req, res) => {
  try {
    db.run(
      'UPDATE games SET status = "paused", updated_at = CURRENT_TIMESTAMP WHERE status = "waiting"',
      [],
      function(err) {
        if (err) {
          console.error('❌ Error pausing all games:', err)
          return res.status(500).json({ error: err.message })
        }
        
        console.log(`⏸️ All waiting games paused by admin (${this.changes} games)`)
        res.json({ success: true, changes: this.changes })
      }
    )
  } catch (error) {
    console.error('❌ Error pausing all games:', error)
    res.status(500).json({ error: error.message })
  }
})

// Sync game status from contract to database
app.post('/api/admin/sync-game-status/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params
    const { contractState } = req.body
    
    // Map contract state to database status
    let dbStatus = 'waiting'
    switch (Number(contractState)) {
      case 0: dbStatus = 'waiting'; break
      case 1: dbStatus = 'joined'; break
      case 2: dbStatus = 'active'; break
      case 3: dbStatus = 'completed'; break
      case 4: dbStatus = 'cancelled'; break
      default: dbStatus = 'waiting'
    }
    
    db.run(
      'UPDATE games SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [dbStatus, gameId],
      function(err) {
        if (err) {
          console.error('❌ Error syncing game status:', err)
          return res.status(500).json({ error: err.message })
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Game not found' })
        }
        
        console.log(`🔄 Game ${gameId} status synced to ${dbStatus}`)
        res.json({ success: true, changes: this.changes, newStatus: dbStatus })
      }
    )
  } catch (error) {
    console.error('❌ Error syncing game status:', error)
    res.status(500).json({ error: error.message })
  }
})

// Sync all cancelled games from contract to database
app.post('/api/admin/sync-cancelled-games', async (req, res) => {
  try {
    // This would require contract integration to get all games and their states
    // For now, we'll just update any games that should be cancelled based on business logic
    
    db.run(
      `UPDATE games SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
       WHERE status = 'waiting' AND 
       (joiner IS NULL OR joiner = '') AND 
       created_at < datetime('now', '-24 hours')`,
      [],
      function(err) {
        if (err) {
          console.error('❌ Error syncing cancelled games:', err)
          return res.status(500).json({ error: err.message })
        }
        
        console.log(`🔄 Synced ${this.changes} expired games to cancelled status`)
        res.json({ success: true, changes: this.changes })
      }
    )
  } catch (error) {
    console.error('❌ Error syncing cancelled games:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update NFT metadata for all games that are missing it
app.post('/api/admin/update-all-nft-metadata', async (req, res) => {
  try {
    console.log('🔄 Starting bulk NFT metadata update...')
    
    // Get all games that are missing NFT metadata
    db.all(
      `SELECT id, nft_contract, nft_token_id, nft_chain 
       FROM games 
       WHERE (nft_name IS NULL OR nft_name = '' OR nft_image IS NULL OR nft_image = '' OR nft_collection IS NULL OR nft_collection = '')
       AND nft_contract IS NOT NULL AND nft_token_id IS NOT NULL`,
      [],
      async (err, games) => {
        if (err) {
          console.error('❌ Error fetching games for metadata update:', err)
          return res.status(500).json({ error: err.message })
        }
        
        console.log(`🔍 Found ${games.length} games missing NFT metadata`)
        
        let updatedCount = 0
        let errorCount = 0
        
        // Process each game
        for (const game of games) {
          try {
            console.log(`🔍 Updating metadata for game ${game.id}:`, {
              contract: game.nft_contract,
              tokenId: game.nft_token_id,
              chain: game.nft_chain || 'base'
            })
            
            const metadata = await getNFTMetadataWithCache(
              game.nft_contract,
              game.nft_token_id,
              game.nft_chain || 'base'
            )
            
            if (metadata) {
              // Update the game with the fetched metadata
              await new Promise((resolve, reject) => {
                db.run(
                  `UPDATE games SET 
                   nft_name = ?, 
                   nft_image = ?, 
                   nft_collection = ?,
                   updated_at = CURRENT_TIMESTAMP 
                   WHERE id = ?`,
                  [
                    metadata.name,
                    metadata.image_url,
                    metadata.collection_name,
                    game.id
                  ],
                  function(err) {
                    if (err) {
                      console.error(`❌ Error updating metadata for game ${game.id}:`, err)
                      errorCount++
                      reject(err)
                    } else {
                      console.log(`✅ Updated metadata for game ${game.id}:`, {
                        name: metadata.name,
                        image: metadata.image_url?.substring(0, 50) + '...',
                        collection: metadata.collection_name
                      })
                      updatedCount++
                      resolve()
                    }
                  }
                )
              })
            } else {
              console.warn(`⚠️ No metadata found for game ${game.id}`)
              errorCount++
            }
            
            // Small delay to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 100))
            
          } catch (gameError) {
            console.error(`❌ Error processing game ${game.id}:`, gameError)
            errorCount++
          }
        }
        
        console.log(`✅ Bulk NFT metadata update completed:`, {
          total: games.length,
          updated: updatedCount,
          errors: errorCount
        })
        
        res.json({ 
          success: true, 
          total: games.length,
          updated: updatedCount,
          errors: errorCount
        })
      }
    )
  } catch (error) {
    console.error('❌ Error in bulk NFT metadata update:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get user profile by address
app.get('/api/profile/:address', async (req, res) => {
  try {
    const { address } = req.params
    
    if (!address || address === '0x0000000000000000000000000000000000000000') {
      return res.json({
        address: address || '0x0000000000000000000000000000000000000000',
        games_created: 0,
        games_joined: 0,
        games_won: 0,
        total_volume: 0,
        nfts_owned: []
      })
    }
    
    // Get user's games
    db.all(
      `SELECT * FROM games WHERE creator = ? OR joiner = ?`,
      [address, address],
      (err, games) => {
        if (err) {
          console.error('❌ Error fetching user profile:', err)
          return res.status(500).json({ error: err.message })
        }
        
        const gamesCreated = games.filter(g => g.creator === address).length
        const gamesJoined = games.filter(g => g.joiner === address).length
        const gamesWon = games.filter(g => g.winner === address).length
        
        // Calculate total volume (simplified - just count games)
        const totalVolume = games.length
        
        // For now, return basic profile data
        // In a real app, you'd want to track NFTs owned, etc.
        res.json({
          address,
          games_created: gamesCreated,
          games_joined: gamesJoined,
          games_won: gamesWon,
          total_volume: totalVolume,
          nfts_owned: [] // Would need to track this separately
        })
      }
    )
  } catch (error) {
    console.error('❌ Error fetching user profile:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update game status (for frontend)
app.patch('/api/games/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params
    const updates = req.body
    
    // Only allow certain fields to be updated
    const allowedFields = ['status', 'winner', 'creator_wins', 'joiner_wins', 'current_round']
    const filteredUpdates = {}
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key]
      }
    })
    
    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }
    
    const setClause = Object.keys(filteredUpdates)
      .map(key => `${key} = ?`)
      .join(', ')
    
    const values = Object.keys(filteredUpdates)
      .map(key => filteredUpdates[key])
    
    values.push(gameId)
    
    db.run(
      `UPDATE games SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values,
      function(err) {
        if (err) {
          console.error('❌ Error updating game:', err)
          return res.status(500).json({ error: err.message })
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Game not found' })
        }
        
        console.log(`✅ Game ${gameId} updated:`, filteredUpdates)
        res.json({ success: true, changes: this.changes })
      }
    )
  } catch (error) {
    console.error('❌ Error updating game:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update NFT metadata for a game
app.post('/api/games/:gameId/update-nft-metadata', async (req, res) => {
  try {
    const { gameId } = req.params
    
    // First get the game to find the NFT details
    db.get('SELECT nft_contract, nft_token_id, nft_chain FROM games WHERE id = ?', [gameId], async (err, game) => {
      if (err) {
        console.error('❌ Error fetching game for metadata update:', err)
        return res.status(500).json({ error: err.message })
      }
      
      if (!game) {
        return res.status(404).json({ error: 'Game not found' })
      }
      
      try {
        console.log('🔍 Updating NFT metadata for game:', gameId, {
          contract: game.nft_contract,
          tokenId: game.nft_token_id,
          chain: game.nft_chain || 'base'
        })
        
        const metadata = await getNFTMetadataWithCache(
          game.nft_contract,
          game.nft_token_id,
          game.nft_chain || 'base'
        )
        
        if (!metadata) {
          return res.status(404).json({ error: 'NFT metadata not found' })
        }
        
        // Update the game with the fetched metadata
        db.run(
          `UPDATE games SET 
           nft_name = ?, 
           nft_image = ?, 
           nft_collection = ?,
           updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [
            metadata.name,
            metadata.image_url,
            metadata.collection_name,
            gameId
          ],
          function(err) {
            if (err) {
              console.error('❌ Error updating game metadata:', err)
              return res.status(500).json({ error: err.message })
            }
            
            console.log('✅ NFT metadata updated for game:', gameId, {
              name: metadata.name,
              image: metadata.image_url?.substring(0, 50) + '...',
              collection: metadata.collection_name
            })
            
            res.json({ 
              success: true, 
              changes: this.changes,
              metadata: {
                name: metadata.name,
                image: metadata.image_url,
                collection: metadata.collection_name
              }
            })
          }
        )
      } catch (metadataError) {
        console.error('❌ Error fetching NFT metadata:', metadataError)
        res.status(500).json({ error: 'Failed to fetch NFT metadata' })
      }
    })
  } catch (error) {
    console.error('❌ Error updating NFT metadata:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update contract game ID
app.post('/api/games/:gameId/update-contract-id', async (req, res) => {
  try {
    const { gameId } = req.params
    const { contract_game_id } = req.body
    
    db.run(
      'UPDATE games SET contract_game_id = ? WHERE id = ?',
      [contract_game_id, gameId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message })
        }
        res.json({ success: true })
      }
    )
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ===== GAME LISTINGS ENDPOINTS =====

// Create a new game listing (no blockchain interaction)
app.post('/api/listings', async (req, res) => {
  try {
    const {
      creator,
      nft_contract,
      nft_token_id,
      nft_name,
      nft_image,
      nft_collection,
      nft_chain,
      asking_price,
      accepts_offers,
      min_offer_price,
      coin
    } = req.body

    const listingId = `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Fetch NFT metadata if not provided
    let finalNftName = nft_name
    let finalNftImage = nft_image
    let finalNftCollection = nft_collection
    
    if (!finalNftName || !finalNftImage || !finalNftCollection) {
      const metadata = await getNFTMetadataWithCache(nft_contract, nft_token_id, nft_chain || 'base')
      if (metadata) {
        finalNftName = finalNftName || metadata.name
        finalNftImage = finalNftImage || metadata.image_url
        finalNftCollection = finalNftCollection || metadata.collection_name
      }
    }
    
    const coinData = coin ? JSON.stringify(coin) : null
    
    db.run(
      `INSERT INTO game_listings (
        id, creator, nft_contract, nft_token_id, nft_name, nft_image, 
        nft_collection, nft_chain, asking_price, accepts_offers, 
        min_offer_price, coin, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        listingId, creator, nft_contract, nft_token_id, finalNftName, finalNftImage,
        finalNftCollection, nft_chain || 'base', asking_price, accepts_offers ? 1 : 0,
        min_offer_price || asking_price * 0.8, coinData, 'active'
      ],
      function(err) {
        if (err) {
          console.error('❌ Error creating listing:', err)
          return res.status(500).json({ error: err.message })
        }
        
        console.log('✅ Game listing created:', listingId)
        
        // Create notification for creator
        createNotification(creator, 'listing_created', 'Listing Created', 
          `Your ${finalNftName} listing is now active!`, 
          JSON.stringify({ listingId }))
        
        res.json({ success: true, listingId })
      }
    )
  } catch (error) {
    console.error('❌ Error creating listing:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get all active listings
app.get('/api/listings', async (req, res) => {
  try {
    const { creator, status, chain } = req.query
    
    let query = 'SELECT * FROM game_listings WHERE 1=1'
    const params = []
    
    if (creator) {
      query += ' AND creator = ?'
      params.push(creator)
    }
    
    if (status) {
      query += ' AND status = ?'
      params.push(status)
    } else {
      // Default to active listings
      query += ' AND status = "active"'
    }
    
    if (chain) {
      query += ' AND nft_chain = ?'
      params.push(chain)
    }
    
    query += ' ORDER BY created_at DESC'
    
    db.all(query, params, (err, listings) => {
      if (err) {
        console.error('❌ Error fetching listings:', err)
        return res.status(500).json({ error: err.message })
      }
      
      // Parse coin data for each listing
      const listingsWithParsedCoin = listings.map(listing => {
        if (listing.coin && typeof listing.coin === 'string') {
          try {
            listing.coin = JSON.parse(listing.coin)
          } catch (e) {
            console.warn('Could not parse coin data for listing:', listing.id)
          }
        }
        return listing
      })
      
      res.json(listingsWithParsedCoin)
    })
  } catch (error) {
    console.error('❌ Error fetching listings:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get specific listing with offers
app.get('/api/listings/:listingId', async (req, res) => {
  try {
    const { listingId } = req.params
    
    console.log('🔍 Fetching listing:', listingId)
    
    db.get('SELECT * FROM game_listings WHERE id = ?', [listingId], (err, listing) => {
      if (err || !listing) {
        console.log('❌ Listing not found:', listingId)
        return res.status(404).json({ error: 'Listing not found' })
      }
      
      // Parse coin data
      if (listing.coin && typeof listing.coin === 'string') {
        try {
          listing.coin = JSON.parse(listing.coin)
        } catch (e) {
          console.warn('Could not parse coin data')
        }
      }
      
      // Get offers for this listing
      db.all(
        'SELECT * FROM offers WHERE listing_id = ? ORDER BY created_at DESC',
        [listingId],
        (err, offers) => {
          if (err) {
            console.error('❌ Error fetching offers:', err)
            return res.status(500).json({ error: err.message })
          }
          
          console.log('📦 Found offers for listing:', offers.length, 'offers')
          offers.forEach(offer => {
            console.log('  - Offer:', offer.id, 'Status:', offer.status)
          })
          
          // Check if creator is online
          db.get(
            'SELECT is_online, last_seen FROM user_presence WHERE address = ?',
            [listing.creator],
            (err, presence) => {
              listing.creator_online = presence?.is_online || false
              listing.creator_last_seen = presence?.last_seen
              
              res.json({ listing, offers })
            }
          )
        }
      )
    })
  } catch (error) {
    console.error('❌ Error fetching listing:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create an offer for a listing
app.post('/api/listings/:listingId/offers', async (req, res) => {
  try {
    const { listingId } = req.params
    const { offerer_address, offerer_name, offer_price, message } = req.body
    
    // Check if listing exists and is active
    db.get('SELECT * FROM game_listings WHERE id = ? AND status = "active"', [listingId], (err, listing) => {
      if (err || !listing) {
        return res.status(404).json({ error: 'Listing not found or not active' })
      }
      
      // Check if offer meets minimum
      if (listing.accepts_offers && offer_price < listing.min_offer_price) {
        return res.status(400).json({ error: `Minimum offer is $${listing.min_offer_price}` })
      }
      
      const offerId = `offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      db.run(
        `INSERT INTO offers (
          id, listing_id, offerer_address, offerer_name, offer_price, message, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [offerId, listingId, offerer_address, offerer_name, offer_price, message, 'pending'],
        function(err) {
          if (err) {
            console.error('❌ Error creating offer:', err)
            return res.status(500).json({ error: err.message })
          }
          
          console.log('✅ Offer created:', offerId)
          
          // Create notification for listing creator
          createNotification(
            listing.creator, 
            'new_offer', 
            'New Offer!',
            `${offerer_name || (offerer_address ? offerer_address.slice(0, 6) + '...' : 'Unknown')} offered $${offer_price} for ${listing.nft_name}`,
            JSON.stringify({ offerId, listingId })
          )
          
          // Broadcast via WebSocket to listing creator
          broadcastToUser(listing.creator, {
            type: 'new_offer',
            listingId,
            offer: {
              id: offerId,
              offerer_address,
              offerer_name,
              offer_price,
              message
            }
          })
          
          // Broadcast to all users viewing this listing
          broadcastToListing(listingId, {
            type: 'new_offer',
            listingId,
            offer: {
              id: offerId,
              offerer_address,
              offerer_name,
              offer_price,
              message
            }
          })
          
          res.json({ success: true, offerId })
        }
      )
    })
  } catch (error) {
    console.error('❌ Error creating offer:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get offers for a game
app.get('/api/games/:gameId/offers', async (req, res) => {
  try {
    const { gameId } = req.params
    
    console.log('🎮 Fetching offers for game:', gameId)
    
    db.all(
      `SELECT * FROM offers WHERE listing_id = ? ORDER BY created_at DESC`,
      [gameId],
      (err, offers) => {
        if (err) {
          console.error('❌ Error fetching game offers:', err)
          return res.status(500).json({ error: err.message })
        }
        
        console.log(`✅ Found ${offers.length} offers for game ${gameId}`)
        res.json(offers)
      }
    )
  } catch (error) {
    console.error('❌ Error fetching game offers:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create an offer for a game
app.post('/api/games/:gameId/offers', async (req, res) => {
  try {
    const { gameId } = req.params
    const { offerer_address, offerer_name, offer_price, message } = req.body
    
    console.log('🎮 Creating offer for game:', { gameId, offerer_address, offer_price })
    
    // Check if game exists and is waiting for players or pending (after offer accepted)
    db.get('SELECT * FROM games WHERE id = ? AND (status = "waiting" OR status = "pending")', [gameId], (err, game) => {
      if (err) {
        console.error('❌ Database error:', err)
        return res.status(500).json({ error: 'Database error' })
      }
      
      if (!game) {
        console.log('❌ Game not found or not accepting offers:', gameId)
        // Let's check what the actual game status is
        db.get('SELECT id, status FROM games WHERE id = ?', [gameId], (err, gameCheck) => {
          if (err) {
            console.error('❌ Error checking game:', err)
          } else if (gameCheck) {
            console.log('📋 Game exists but status is:', gameCheck.status)
          } else {
            console.log('❌ Game does not exist in database')
          }
        })
        return res.status(404).json({ error: 'Game not found or not accepting offers' })
      }
      
      console.log('✅ Game found with status:', game.status)
      
      // For games, there's no minimum offer requirement - any offer is valid
      const offerId = `offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      db.run(
        `INSERT INTO offers (
          id, listing_id, offerer_address, offerer_name, offer_price, message, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [offerId, gameId, offerer_address, offerer_name, offer_price, message, 'pending'],
        function(err) {
          if (err) {
            console.error('❌ Error creating game offer:', err)
            return res.status(500).json({ error: err.message })
          }
          
          console.log('✅ Game offer created:', offerId)
          
          // Create notification for game creator
          createNotification(
            game.creator, 
            'new_offer', 
            'New Game Offer!',
            `${offerer_name || (offerer_address ? offerer_address.slice(0, 6) + '...' : 'Unknown')} offered $${offer_price} to join your game`,
            JSON.stringify({ offerId, gameId })
          )
          
          // Broadcast via WebSocket to game creator
          broadcastToUser(game.creator, {
            type: 'new_offer',
            gameId,
            offer: {
              id: offerId,
              offerer_address,
              offerer_name,
              offer_price,
              message
            }
          })
          
          // Broadcast to all users viewing this game
          broadcastToGame(gameId, {
            type: 'new_offer',
            gameId,
            offer: {
              id: offerId,
              offerer_address,
              offerer_name,
              offer_price,
              message
            }
          })
          
          res.json({ success: true, offerId })
        }
      )
    })
  } catch (error) {
    console.error('❌ Error creating game offer:', error)
    res.status(500).json({ error: error.message })
  }
})

// Accept an offer
app.post('/api/offers/:offerId/accept', async (req, res) => {
  // CLAUDE OPUS PATCH: Accept endpoint now handles both games and listings
  try {
    const { offerId } = req.params
    const { acceptor_address } = req.body
    
    // First get the offer
    db.get('SELECT * FROM offers WHERE id = ? AND status = "pending"', [offerId], async (err, offer) => {
      if (err || !offer) {
        return res.status(404).json({ error: 'Offer not found or not pending' })
      }
      
      // Check if it's a game or listing
      db.get('SELECT * FROM games WHERE id = ?', [offer.listing_id], async (err, game) => {
        if (game) {
          // It's a game offer
          if (game.creator !== acceptor_address) {
            return res.status(403).json({ error: 'Only game creator can accept offers' })
          }
          // Update offer status
          db.run('UPDATE offers SET status = "accepted" WHERE id = ?', [offerId], (err) => {
            if (err) return res.status(500).json({ error: err.message })
            // Update game with joiner
            db.run(
              'UPDATE games SET joiner = ?, price_usd = ?, status = "pending" WHERE id = ?',
              [offer.offerer_address, offer.offer_price, game.id],
              (err) => {
                if (err) return res.status(500).json({ error: err.message })
                res.json({ success: true, gameId: game.id })
                // Notify both players to show asset loading modal
                broadcastToUser(game.creator, {
                  type: 'game_created_pending_deposit',
                  gameId: game.id,
                  role: 'creator',
                  creator: game.creator,
                  joiner: offer.offerer_address,
                  nft_contract: game.nft_contract,
                  nft_token_id: game.nft_token_id,
                  nft_name: game.nft_name,
                  nft_image: game.nft_image,
                  price_usd: offer.offer_price,
                  coin: game.coin,
                  contract_game_id: game.contract_game_id
                })
                broadcastToUser(offer.offerer_address, {
                  type: 'game_created_pending_deposit',
                  gameId: game.id,
                  role: 'joiner',
                  creator: game.creator,
                  joiner: offer.offerer_address,
                  nft_contract: game.nft_contract,
                  nft_token_id: game.nft_token_id,
                  nft_name: game.nft_name,
                  nft_image: game.nft_image,
                  price_usd: offer.offer_price,
                  coin: game.coin,
                  contract_game_id: game.contract_game_id
                })
              }
            )
          })
        } else {
          // Check if it's a listing (existing logic)
          db.get('SELECT * FROM game_listings WHERE id = ?', [offer.listing_id], (err, listing) => {
            if (err) {
              console.error('❌ Database error:', err)
              return res.status(500).json({ error: 'Database error' })
            }
            
            if (!listing) {
              return res.status(404).json({ error: 'Listing not found' })
            }
            
            // Verify the acceptor is the listing creator
            if (listing.creator !== acceptor_address) {
              return res.status(403).json({ error: 'Only listing creator can accept offers' })
            }
            
            // Update offer status
            db.run(
              'UPDATE offers SET status = "accepted", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
              [offerId],
              async (err) => {
                if (err) {
                  return res.status(500).json({ error: err.message })
                }
                
                // Keep listing status as "active" - only change to "completed" when game actually starts
                console.log('✅ Offer accepted, keeping listing active for asset deposits')
                
                // Reject all other pending offers
                db.run(
                  'UPDATE offers SET status = "rejected" WHERE listing_id = ? AND id != ? AND status = "pending"',
                  [listing.id, offerId]
                )
                
                // Create notification for offerer
                createNotification(
                  offer.offerer_address,
                  'offer_accepted',
                  'Offer Accepted!',
                  `Your offer for ${listing.nft_name} has been accepted!`,
                  JSON.stringify({ offerId, listingId: listing.id })
                )
                
                // Create game in pending state
                const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                
                db.run(
                  `INSERT INTO games (
                    id, creator, joiner, nft_contract, nft_token_id,
                    nft_name, nft_image, nft_collection, price_usd,
                    status, game_type, coin, nft_chain
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [
                    gameId,
                    listing.creator,
                    offer.offerer_address,
                    listing.nft_contract,
                    listing.nft_token_id,
                    listing.nft_name,
                    listing.nft_image,
                    listing.nft_collection,
                    offer.offer_price,
                    'pending', // New status for games waiting for both assets
                    'nft-vs-crypto',
                    listing.coin,
                    listing.nft_chain
                  ],
                  (err) => {
                    if (err) {
                      console.error('❌ Error creating game:', err)
                      return res.status(500).json({ error: err.message })
                    }
                    
                    console.log('✅ Game created from accepted offer:', gameId)
                    
                    // Send response to client
                    res.json({ success: true, gameId })
                    
                    // Broadcast to both users
                    broadcastToUser(listing.creator, {
                      type: 'offer_accepted',
                      gameId,
                      listingId: listing.id
                    })
                    broadcastToUser(offer.offerer_address, {
                      type: 'offer_accepted',
                      gameId,
                      listingId: listing.id
                    })
                    
                    // Broadcast to all users viewing this listing
                    broadcastToListing(listing.id, {
                      type: 'offer_accepted',
                      gameId,
                      listingId: listing.id
                    })
                    
                    // Notify both users they need to deposit assets
                    broadcastToUser(listing.creator, {
                      type: 'game_created_pending_deposit',
                      gameId,
                      role: 'creator',
                      requiredAction: 'deposit_nft',
                      listingId: listing.id,
                      creator: listing.creator,
                      joiner: offer.offerer_address,
                      nft_contract: listing.nft_contract,
                      nft_token_id: listing.nft_token_id,
                      nft_name: listing.nft_name,
                      nft_image: listing.nft_image,
                      coin: listing.coin
                    })
                    broadcastToUser(offer.offerer_address, {
                      type: 'game_created_pending_deposit',
                      gameId,
                      role: 'joiner',
                      requiredAction: 'deposit_crypto',
                      amount: offer.offer_price,
                      listingId: listing.id,
                      creator: listing.creator,
                      joiner: offer.offerer_address,
                      nft_contract: listing.nft_contract,
                      nft_token_id: listing.nft_token_id,
                      nft_name: listing.nft_name,
                      nft_image: listing.nft_image,
                      coin: listing.coin
                    })
                  }
                )
              }
            )
          })
        }
      })
    })
  } catch (error) {
    console.error('❌ Error accepting offer:', error)
    res.status(500).json({ error: error.message })
  }
})

// Reject an offer
app.post('/api/offers/:offerId/reject', async (req, res) => {
  try {
    const { offerId } = req.params
    
    db.run(
      'UPDATE offers SET status = "rejected", updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = "pending"',
      [offerId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message })
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Offer not found or not pending' })
        }
        
        res.json({ success: true })
      }
    )
  } catch (error) {
    console.error('❌ Error rejecting offer:', error)
    res.status(500).json({ error: error.message })
  }
})

// Cancel a listing
app.post('/api/listings/:listingId/cancel', async (req, res) => {
  try {
    const { listingId } = req.params
    const { creator_address } = req.body
    
    db.run(
      'UPDATE game_listings SET status = "cancelled" WHERE id = ? AND creator = ? AND status = "active"',
      [listingId, creator_address],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message })
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Listing not found or not active' })
        }
        
        // Reject all pending offers
        db.run(
          'UPDATE offers SET status = "cancelled" WHERE listing_id = ? AND status = "pending"',
          [listingId]
        )
        
        res.json({ success: true })
      }
    )
  } catch (error) {
    console.error('❌ Error cancelling listing:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get user dashboard data
app.get('/api/dashboard/:address', async (req, res) => {
  try {
    const { address } = req.params
    
    // Get user's listings
    db.all(
      'SELECT * FROM game_listings WHERE creator = ? ORDER BY created_at DESC',
      [address],
      (err, listings) => {
        if (err) {
          return res.status(500).json({ error: err.message })
        }
        
        // Get offers made by user
        db.all(
          `SELECT o.*, l.nft_name, l.nft_image, l.creator 
           FROM offers o 
           JOIN game_listings l ON o.listing_id = l.id 
           WHERE o.offerer_address = ? 
           ORDER BY o.created_at DESC`,
          [address],
          (err, outgoingOffers) => {
            if (err) {
              return res.status(500).json({ error: err.message })
            }
            
            // Get offers on user's listings
            db.all(
              `SELECT o.*, l.nft_name 
               FROM offers o 
               JOIN game_listings l ON o.listing_id = l.id 
               WHERE l.creator = ? 
               ORDER BY o.created_at DESC`,
              [address],
              (err, incomingOffers) => {
                if (err) {
                  return res.status(500).json({ error: err.message })
                }
                
                // Parse coin data for listings
                const parsedListings = listings.map(listing => {
                  if (listing.coin && typeof listing.coin === 'string') {
                    try {
                      listing.coin = JSON.parse(listing.coin)
                    } catch (e) {}
                  }
                  return listing
                })
                
                res.json({
                  listings: parsedListings,
                  outgoingOffers,
                  incomingOffers,
                  stats: {
                    activeListings: listings.filter(l => l.status === 'active').length,
                    pendingOffers: incomingOffers.filter(o => o.status === 'pending').length,
                    totalListings: listings.length
                  }
                })
              }
            )
          }
        )
      }
    )
  } catch (error) {
    console.error('❌ Error fetching dashboard:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update user presence
app.post('/api/presence/update', async (req, res) => {
  try {
    const { address, socket_id } = req.body
    
    db.run(
      `INSERT OR REPLACE INTO user_presence (address, last_seen, is_online, socket_id) 
       VALUES (?, CURRENT_TIMESTAMP, true, ?)`,
      [address, socket_id],
      (err) => {
        if (err) {
          return res.status(500).json({ error: err.message })
        }
        res.json({ success: true })
      }
    )
  } catch (error) {
    console.error('❌ Error updating presence:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get notifications
app.get('/api/notifications/:address', async (req, res) => {
  try {
    const { address } = req.params
    const { unread_only } = req.query
    
    let query = 'SELECT * FROM notifications WHERE user_address = ?'
    if (unread_only === 'true') {
      query += ' AND read = false'
    }
    query += ' ORDER BY created_at DESC LIMIT 50'
    
    db.all(query, [address], (err, notifications) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }
      
      res.json(notifications)
    })
  } catch (error) {
    console.error('❌ Error fetching notifications:', error)
    res.status(500).json({ error: error.message })
  }
})

// Mark notification as read
app.post('/api/notifications/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params
    
    db.run(
      'UPDATE notifications SET read = true WHERE id = ?',
      [notificationId],
      (err) => {
        if (err) {
          return res.status(500).json({ error: err.message })
        }
        res.json({ success: true })
      }
    )
  } catch (error) {
    console.error('❌ Error marking notification as read:', error)
    res.status(500).json({ error: error.message })
  }
})

// Helper function to create notifications
function createNotification(userAddress, type, title, message, data = null) {
  const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  db.run(
    `INSERT INTO notifications (id, user_address, type, title, message, data) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [notificationId, userAddress, type, title, message, data],
    (err) => {
      if (err) {
        console.error('❌ Error creating notification:', err)
      } else {
        console.log('✅ Notification created:', notificationId)
        
        // Broadcast to user if online
        broadcastToUser(userAddress, {
          type: 'new_notification',
          notification: {
            id: notificationId,
            type,
            title,
            message,
            data
          }
        })
      }
    }
  )
}

// Helper function to broadcast to specific user
function broadcastToUser(address, message) {
  console.log(`📡 Broadcasting to user ${address}:`, message.type)
  
  // First try to send via user presence (for authenticated users)
  db.get(
    'SELECT socket_id FROM user_presence WHERE address = ? AND is_online = true',
    [address],
    (err, presence) => {
      if (!err && presence && presence.socket_id) {
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN && client.id === presence.socket_id) {
            client.send(JSON.stringify(message))
            console.log(`✅ Sent to authenticated user ${address} via socket ${presence.socket_id}`)
          }
        })
      } else {
        console.log(`⚠️ User ${address} not found in presence table or not online`)
      }
    }
  )
  
  // Also try to send to any socket with this address (for listing viewers)
  let sentCount = 0
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && 
        (client.address === address || client.listingAddress === address)) {
      client.send(JSON.stringify(message))
      sentCount++
      console.log(`✅ Sent to user ${address} via listing socket ${client.id}`)
    }
  })
  
  // BROADCAST TO ALL CONNECTED CLIENTS as fallback for critical messages
  if (sentCount === 0 && (message.type === 'game_created_pending_deposit' || message.type === 'offer_accepted' || message.type === 'game_ready' || message.type === 'player_joined')) {
    console.log(`🚨 No sockets found for ${address}, broadcasting to all clients as fallback`)
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          ...message,
          targetAddress: address, // Add target address so frontend can filter
          isBroadcast: true
        }))
        sentCount++
      }
    })
    console.log(`📡 Broadcast fallback sent to ${sentCount} total clients`)
  }
  
  if (sentCount === 0) {
    console.log(`⚠️ No active sockets found for user ${address}`)
  } else {
    console.log(`📡 Sent message to ${sentCount} socket(s) for user ${address}`)
  }
}

// Add after existing endpoints
app.post('/api/games/:gameId/complete', async (req, res) => {
  try {
    const { gameId } = req.params
    const { winner, creatorWins, joinerWins, rounds } = req.body
    
    // Verify game exists and is active
    db.get('SELECT * FROM games WHERE id = ?', [gameId], (err, game) => {
      if (err || !game) {
        return res.status(404).json({ error: 'Game not found' })
      }
      
      if (game.status !== 'active') {
        return res.status(400).json({ error: 'Game not active' })
      }
      
      // Verify winner is valid
      const validWinner = (creatorWins >= 3 && winner === game.creator) ||
                         (joinerWins >= 3 && winner === game.joiner)
      
      if (!validWinner) {
        return res.status(400).json({ error: 'Invalid winner' })
      }
      
      // Update database
      db.run(
        `UPDATE games SET 
         status = 'completed',
         winner = ?,
         creator_wins = ?,
         joiner_wins = ?,
         current_round = ?,
         updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [winner, creatorWins, joinerWins, rounds.length, gameId],
        function(err) {
          if (err) {
            console.error('❌ Error completing game:', err)
            return res.status(500).json({ error: err.message })
          }
          
          console.log(`🏆 Game ${gameId} completed. Winner: ${winner}`)
          
          // Clean up game state
          gameStates.delete(gameId)
          
          // Notify all clients
          broadcastToGame(gameId, {
            type: 'game_completed',
            gameId,
            winner,
            creatorWins,
            joinerWins
          })
          
          res.json({ success: true })
        }
      )
    })
  } catch (error) {
    console.error('❌ Error completing game:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update the round simulation for server-side games
function simulateRound(gameId) {
  const gameState = gameStates.get(gameId)
  if (!gameState) return
  
  // Simple randomness for demo - in production use better randomness
  const seed = Date.now().toString()
  const hash = crypto.createHash('sha256').update(seed).digest('hex')
  const result = parseInt(hash.slice(-1), 16) % 2 // 0 = heads, 1 = tails
  
  const flipResult = result === 0 ? 'heads' : 'tails'
  
  // Determine round winner
  let roundWinner
  if (gameState.creatorChoice === flipResult) {
    roundWinner = 'creator'
    gameState.creatorWins++
  } else {
    roundWinner = 'joiner'
    gameState.joinerWins++
  }
  
  // Add to rounds history
  gameState.rounds.push({
    round: gameState.currentRound,
    result: flipResult,
    winner: roundWinner,
    creatorChoice: gameState.creatorChoice,
    joinerChoice: gameState.joinerChoice,
    seed: seed
  })
  
  // Broadcast result
  broadcastToGame(gameId, {
    type: 'round_result',
    round: gameState.currentRound,
    result: flipResult,
    winner: roundWinner,
    creatorWins: gameState.creatorWins,
    joinerWins: gameState.joinerWins
  })
  
  // Check if game complete
  if (gameState.creatorWins >= 3 || gameState.joinerWins >= 3) {
    const gameWinner = gameState.creatorWins >= 3 ? gameState.creator : gameState.joiner
    
    // For games with smart contract, notify frontend to complete on-chain
    db.get('SELECT contract_game_id FROM games WHERE id = ?', [gameId], (err, game) => {
      if (!err && game && game.contract_game_id) {
        broadcastToGame(gameId, {
          type: 'ready_for_blockchain',
          winner: gameWinner,
          creatorWins: gameState.creatorWins,
          joinerWins: gameState.joinerWins,
          rounds: gameState.rounds
        })
      } else {
        // No contract, complete in database
        completeGameInDatabase(gameId, gameWinner, gameState)
      }
    })
  } else {
    // Next round
    gameState.currentRound++
    gameState.creatorChoice = null
    gameState.joinerChoice = null
    gameState.bothChosen = false
    gameState.phase = 'choosing'
    
    broadcastToGame(gameId, {
      type: 'next_round',
      round: gameState.currentRound
    })
  }
}

// Catch-all route to serve React app
app.get('*', (req, res) => {
  // Don't serve React app for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' })
  }
  
  // Don't serve React app for static assets (they should be handled by express.static)
  if (req.path.includes('.') && !req.path.endsWith('/')) {
    return res.status(404).json({ error: 'Static asset not found' })
  }
  
  // Serve the React app's index.html for all other routes
  const indexPath = path.join(__dirname, '..', 'index.html')
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.status(404).json({ 
      error: 'Frontend not built. Please run npm run build first.',
      path: req.path 
    })
  }
})

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
})

// Listing viewers tracking
const listingViewers = new Map() // listingId -> Set of socket IDs

// Asset loading rooms tracking
const assetLoadingRooms = new Map() // gameId -> Set of socket IDs

function broadcastToListing(listingId, message, excludeSocketId = null) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && 
        client.listingId === listingId && 
        client.id !== excludeSocketId) {
      client.send(JSON.stringify(message))
    }
  })
}

function broadcastToAssetRoom(gameId, message) {
  const room = assetLoadingRooms.get(gameId)
  if (!room) return
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && room.has(client.id)) {
      client.send(JSON.stringify(message))
    }
  })
}

// CLAUDE OPUS PATCH: Admin endpoint to clean up abandoned games older than 24 hours
// Note: There are already admin endpoints for cancelling/pausing games, but this is a direct cleanup for 'waiting' games >24h
app.post('/api/admin/cleanup-abandoned-games', async (req, res) => {
  try {
    db.run(
      `UPDATE games 
       SET status = 'cancelled' 
       WHERE status = 'waiting' 
       AND created_at < datetime('now', '-24 hours')`,
      [],
      function(err) {
        if (err) return res.status(500).json({ error: err.message })
        console.log(`🧹 Cleaned up ${this.changes} abandoned games`)
        res.json({ success: true, cleaned: this.changes })
      }
    )
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})