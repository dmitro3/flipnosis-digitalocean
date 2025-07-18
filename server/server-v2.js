const express = require('express')
const http = require('http')
const WebSocket = require('ws')
const cors = require('cors')
const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')
const fetch = require('node-fetch')
const crypto = require('crypto')

console.log('🚀 Starting CryptoFlipz V2 Server...')

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

// ===== CONFIGURATION =====
const PORT = process.env.PORT_V2 || 3002
const DATABASE_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'games-v2.db')
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || 'hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3'
const ALCHEMY_BASE_URL = `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`

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
const distPath = path.join(__dirname, '..')
if (fs.existsSync(distPath)) {
  console.log('📁 Serving static files from:', distPath)
  app.use(express.static(distPath))
}

// ===== DATABASE =====
let db

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const database = new sqlite3.Database(DATABASE_PATH, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err)
        reject(err)
        return
      }
      console.log('✅ Connected to SQLite database')
      
      database.serialize(() => {
        // Simplified games table
        database.run(`
          CREATE TABLE IF NOT EXISTS games (
            id TEXT PRIMARY KEY,
            blockchain_id TEXT UNIQUE,
            listing_id TEXT,
            creator TEXT NOT NULL,
            joiner TEXT,
            nft_contract TEXT NOT NULL,
            nft_token_id TEXT NOT NULL,
            nft_name TEXT,
            nft_image TEXT,
            nft_collection TEXT,
            nft_chain TEXT DEFAULT 'base',
            final_price REAL NOT NULL,
            status TEXT DEFAULT 'waiting_payment',
            winner TEXT,
            game_data TEXT,
            coin_data TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) console.error('❌ Error creating games table:', err)
          else console.log('✅ Games table ready')
        })
        
        // Listings table
        database.run(`
          CREATE TABLE IF NOT EXISTS listings (
            id TEXT PRIMARY KEY,
            creator TEXT NOT NULL,
            nft_contract TEXT NOT NULL,
            nft_token_id TEXT NOT NULL,
            nft_name TEXT,
            nft_image TEXT,
            nft_collection TEXT,
            nft_chain TEXT DEFAULT 'base',
            asking_price REAL NOT NULL,
            min_offer_price REAL,
            blockchain_game_id TEXT,
            status TEXT DEFAULT 'active',
            coin_data TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) console.error('❌ Error creating listings table:', err)
          else console.log('✅ Listings table ready')
        })
        
        // Offers table
        database.run(`
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
            FOREIGN KEY (listing_id) REFERENCES listings(id)
          )
        `, (err) => {
          if (err) console.error('❌ Error creating offers table:', err)
          else console.log('✅ Offers table ready')
        })
        
        // NFT metadata cache
        database.run(`
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
            PRIMARY KEY (contract_address, token_id, chain)
          )
        `, (err) => {
          if (err) console.error('❌ Error creating nft_metadata_cache table:', err)
          else console.log('✅ NFT metadata cache table ready')
        })
        
        // User presence
        database.run(`
          CREATE TABLE IF NOT EXISTS user_presence (
            address TEXT PRIMARY KEY,
            last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_online BOOLEAN DEFAULT true,
            socket_id TEXT
          )
        `, (err) => {
          if (err) console.error('❌ Error creating user_presence table:', err)
          else console.log('✅ User presence table ready')
        })
      })
      
      resolve(database)
    })
  })
}

// ===== WEBSOCKET MANAGEMENT =====
const gameRooms = new Map() // gameId -> Set of socket IDs
const userSockets = new Map() // address -> socket ID

wss.on('connection', (socket) => {
  socket.id = crypto.randomBytes(16).toString('hex')
  console.log('🔌 New connection:', socket.id)
  
  socket.on('message', async (message) => {
    try {
      const data = JSON.parse(message)
      console.log('📡 Received:', data.type)
      
      switch (data.type) {
        case 'subscribe_game':
          handleSubscribeGame(socket, data)
          break
          
        case 'register_user':
          handleRegisterUser(socket, data)
          break
          
        case 'game_action':
          handleGameAction(socket, data)
          break
          
        case 'chat_message':
          handleChatMessage(socket, data)
          break
      }
    } catch (error) {
      console.error('❌ WebSocket error:', error)
    }
  })
  
  socket.on('close', () => {
    handleDisconnect(socket)
  })
})

function handleSubscribeGame(socket, data) {
  const { gameId } = data
  socket.gameId = gameId
  
  if (!gameRooms.has(gameId)) {
    gameRooms.set(gameId, new Set())
  }
  gameRooms.get(gameId).add(socket.id)
  
  console.log(`👥 Socket ${socket.id} subscribed to game ${gameId}`)
}

function handleRegisterUser(socket, data) {
  const { address } = data
  socket.address = address
  userSockets.set(address, socket.id)
  
  // Update presence
  db.run(
    'INSERT OR REPLACE INTO user_presence (address, socket_id, is_online) VALUES (?, ?, true)',
    [address, socket.id]
  )
}

function handleGameAction(socket, data) {
  const { gameId, action, payload } = data
  
  // Broadcast to all in game room
  broadcastToGame(gameId, {
    type: 'game_action',
    action,
    payload,
    from: socket.address
  })
}

function handleChatMessage(socket, data) {
  const { gameId, message } = data
  
  broadcastToGame(gameId, {
    type: 'chat_message',
    message,
    from: socket.address,
    timestamp: Date.now()
  })
}

function handleDisconnect(socket) {
  console.log('🔌 Disconnected:', socket.id)
  
  // Remove from game rooms
  if (socket.gameId && gameRooms.has(socket.gameId)) {
    gameRooms.get(socket.gameId).delete(socket.id)
  }
  
  // Update user presence
  if (socket.address) {
    userSockets.delete(socket.address)
    db.run(
      'UPDATE user_presence SET is_online = false WHERE address = ?',
      [socket.address]
    )
  }
}

function broadcastToGame(gameId, message) {
  const room = gameRooms.get(gameId)
  if (!room) return
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && room.has(client.id)) {
      client.send(JSON.stringify(message))
    }
  })
}

function sendToUser(address, message) {
  const socketId = userSockets.get(address)
  if (!socketId) return
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client.id === socketId) {
      client.send(JSON.stringify(message))
    }
  })
}

// ===== NFT METADATA HELPERS =====
async function fetchNFTMetadata(contractAddress, tokenId, chain = 'base') {
  try {
    const url = `${ALCHEMY_BASE_URL}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Alchemy API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    let imageUrl = ''
    if (data.media && data.media.length > 0) {
      imageUrl = data.media[0].gateway || data.media[0].raw || ''
    }
    if (!imageUrl && data.rawMetadata) {
      imageUrl = data.rawMetadata.image || data.rawMetadata.image_url || ''
    }
    if (imageUrl && imageUrl.startsWith('ipfs://')) {
      imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')
    }
    
    return {
      name: data.title || data.name || `NFT #${tokenId}`,
      image_url: imageUrl,
      collection_name: data.contract?.name || 'Unknown Collection',
      description: data.description || '',
      attributes: JSON.stringify(data.attributes || [])
    }
  } catch (error) {
    console.error('❌ Error fetching NFT metadata:', error)
    return null
  }
}

async function getNFTMetadataWithCache(contractAddress, tokenId, chain = 'base') {
  return new Promise((resolve) => {
    // Check cache first
    db.get(
      'SELECT * FROM nft_metadata_cache WHERE contract_address = ? AND token_id = ? AND chain = ?',
      [contractAddress, tokenId, chain],
      async (err, cached) => {
        if (!err && cached) {
          const cacheAge = Date.now() - new Date(cached.fetched_at).getTime()
          if (cacheAge < 7 * 24 * 60 * 60 * 1000) { // 7 days
            return resolve(cached)
          }
        }
        
        // Fetch fresh
        const metadata = await fetchNFTMetadata(contractAddress, tokenId, chain)
        if (!metadata) {
          return resolve(cached || { name: `NFT #${tokenId}`, image_url: '' })
        }
        
        // Cache it
        db.run(
          `INSERT OR REPLACE INTO nft_metadata_cache 
           (contract_address, token_id, chain, name, image_url, collection_name, description, attributes, token_type)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [contractAddress, tokenId, chain, metadata.name, metadata.image_url, 
           metadata.collection_name, metadata.description, metadata.attributes, 'ERC721']
        )
        
        resolve(metadata)
      }
    )
  })
}

// ===== API ROUTES =====
// ... existing code ...
// (The rest of the server-v2.js code from the artifact should be included here) 