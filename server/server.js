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
const PORT = process.env.PORT || 3001
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
        
        // Profiles table
        database.run(`
          CREATE TABLE IF NOT EXISTS profiles (
            address TEXT PRIMARY KEY,
            name TEXT,
            avatar TEXT,
            heads_image TEXT,
            tails_image TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) console.error('❌ Error creating profiles table:', err)
          else console.log('✅ Profiles table ready')
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
  
  console.log(`👥 Socket ${socket.id} subscribed to game/listing ${gameId}`)
  console.log(`📊 Current rooms:`, Array.from(gameRooms.keys()))
  console.log(`👥 Room ${gameId} has ${gameRooms.get(gameId).size} subscribers`)
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
  if (!room) {
    console.log(`⚠️ No room found for gameId: ${gameId}`)
    return
  }
  
  console.log(`📡 Broadcasting to room ${gameId}:`, message.type)
  console.log(`👥 Room has ${room.size} subscribers`)
  
  let sentCount = 0
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && room.has(client.id)) {
      client.send(JSON.stringify(message))
      sentCount++
    }
  })
  
  console.log(`✅ Message sent to ${sentCount} clients in room ${gameId}`)
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'v2', timestamp: new Date().toISOString() })
})

// Get game by ID
app.get('/api/games/:gameId', (req, res) => {
  const { gameId } = req.params
  console.log(`🎮 Fetching game: ${gameId}`)
  
  db.get('SELECT * FROM games WHERE blockchain_id = ? OR id = ?', [gameId, gameId], (err, row) => {
    if (err) {
      console.error('❌ Error fetching game:', err)
      return res.status(500).json({ error: 'Database error' })
    }
    if (!row) {
      console.log(`❌ Game not found: ${gameId}`)
      return res.status(404).json({ error: 'Game not found' })
    }
    console.log(`✅ Game found: ${gameId}`)
    res.json(row)
  })
})

// Get all games
app.get('/api/games', (req, res) => {
  console.log('🎮 Fetching all games')
  
  db.all('SELECT * FROM games ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      console.error('❌ Error fetching games:', err)
      return res.status(500).json({ error: 'Database error' })
    }
    console.log(`✅ Found ${rows.length} games`)
    res.json(rows)
  })
})

// Get listings
app.get('/api/listings', (req, res) => {
  console.log('📋 Fetching listings')
  
  db.all('SELECT * FROM listings WHERE status = "active" ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      console.error('❌ Error fetching listings:', err)
      return res.status(500).json({ error: 'Database error' })
    }
    console.log(`✅ Found ${rows.length} listings`)
    res.json(rows)
  })
})

// Get listing by ID
app.get('/api/listings/:listingId', (req, res) => {
  const { listingId } = req.params
  console.log(`📋 Fetching listing: ${listingId}`)
  
  db.get('SELECT * FROM listings WHERE id = ?', [listingId], (err, row) => {
    if (err) {
      console.error('❌ Error fetching listing:', err)
      return res.status(500).json({ error: 'Database error' })
    }
    if (!row) {
      console.log(`❌ Listing not found: ${listingId}`)
      return res.status(404).json({ error: 'Listing not found' })
    }
    console.log(`✅ Listing found: ${listingId}`)
    res.json(row)
  })
})

// Get dashboard data for user
app.get('/api/dashboard/:address', (req, res) => {
  const { address } = req.params
  console.log(`📊 Fetching dashboard for: ${address}`)
  
  db.all(`
    SELECT 
      l.*,
      g.id as game_id,
      g.status as game_status
    FROM listings l
    LEFT JOIN games g ON l.id = g.listing_id
    WHERE l.creator = ?
    ORDER BY l.created_at DESC
  `, [address], (err, listings) => {
    if (err) {
      console.error('❌ Error fetching dashboard:', err)
      return res.status(500).json({ error: 'Database error' })
    }
    
    // Get offers
    db.all(`
      SELECT o.*, l.nft_name, l.nft_image
      FROM offers o
      JOIN listings l ON o.listing_id = l.id
      WHERE o.offerer_address = ? OR l.creator = ?
      ORDER BY o.created_at DESC
    `, [address, address], (err, offers) => {
      if (err) {
        console.error('❌ Error fetching offers:', err)
        return res.status(500).json({ error: 'Database error' })
      }
      
      const outgoingOffers = offers.filter(o => o.offerer_address === address)
      const incomingOffers = offers.filter(o => o.offerer_address !== address)
      
      console.log(`✅ Dashboard data: ${listings.length} listings, ${outgoingOffers.length} outgoing, ${incomingOffers.length} incoming`)
      res.json({
        listings: listings || [],
        outgoingOffers: outgoingOffers || [],
        incomingOffers: incomingOffers || []
      })
    })
  })
})

// Create listing
app.post('/api/listings', (req, res) => {
  const { creator, nft_contract, nft_token_id, nft_name, nft_image, nft_collection, asking_price, coin_data } = req.body
  console.log(`📋 Creating listing for: ${creator}`)
  console.log(`🪙 Coin data received:`, coin_data)
  
  const listingId = `listing_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
  
  db.run(`
    INSERT INTO listings (id, creator, nft_contract, nft_token_id, nft_name, nft_image, nft_collection, asking_price, coin_data, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `, [listingId, creator, nft_contract, nft_token_id, nft_name, nft_image, nft_collection, asking_price, JSON.stringify(coin_data)], function(err) {
    if (err) {
      console.error('❌ Error creating listing:', err)
      return res.status(500).json({ error: 'Database error' })
    }
    console.log(`✅ Listing created: ${listingId}`)
    console.log(`🪙 Coin data saved:`, JSON.stringify(coin_data))
    res.json({ success: true, listingId, message: 'Listing created successfully. Please approve your NFT to create the blockchain game.' })
  })
})

// Update listing with contract game ID (PUT version)
app.put('/api/listings/:listingId/contract-game', (req, res) => {
  const { listingId } = req.params
  const { contractGameId, transactionHash, listingFeeUSD } = req.body
  console.log(`🔄 Updating listing ${listingId} with contract game: ${contractGameId}`)
  
  // Create game record
  const gameId = `game_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
  
  db.run(`
    INSERT INTO games (id, blockchain_id, listing_id, creator, nft_contract, nft_token_id, nft_name, nft_image, nft_collection, final_price, status, game_data, coin_data)
    SELECT ?, ?, ?, creator, nft_contract, nft_token_id, nft_name, nft_image, nft_collection, asking_price, 'waiting_payment', ?, coin_data
    FROM listings WHERE id = ?
  `, [gameId, contractGameId, listingId, JSON.stringify({ transactionHash, listingFeeUSD }), listingId], function(err) {
    if (err) {
      console.error('❌ Error creating game:', err)
      return res.status(500).json({ error: 'Database error' })
    }
    
    // Verify coin data was copied
    db.get('SELECT coin_data FROM games WHERE id = ?', [gameId], (err, row) => {
      if (!err && row) {
        console.log(`🪙 Coin data copied to game ${gameId}:`, row.coin_data)
      }
    })
    
            // Update listing status
        db.run('UPDATE listings SET status = "game_created" WHERE id = ?', [listingId], (err) => {
          if (err) {
            console.error('❌ Error updating listing:', err)
            return res.status(500).json({ error: 'Database error' })
          }
          console.log(`✅ Game created: ${gameId} (contract: ${contractGameId})`)
          
          // Transfer WebSocket subscriptions from listing to game
          const listingRoom = gameRooms.get(listingId)
          if (listingRoom && listingRoom.size > 0) {
            console.log(`🔄 Transferring ${listingRoom.size} WebSocket subscriptions from listing ${listingId} to game ${gameId}`)
            gameRooms.set(gameId, listingRoom)
            gameRooms.delete(listingId)
            
            // Update all sockets in the room to point to the new game ID
            wss.clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN && listingRoom.has(client.id)) {
                client.gameId = gameId
              }
            })
            
            // Notify clients that the listing has been converted to a game
            broadcastToGame(gameId, {
              type: 'listing_converted_to_game',
              listingId,
              gameId,
              contractGameId
            })
          }
          
          res.json({ success: true, gameId, contractGameId })
        })
  })
})

// Create blockchain game (POST version - for compatibility)
app.post('/api/listings/:listingId/create-blockchain-game', (req, res) => {
  const { listingId } = req.params
  const { contract_game_id, transaction_hash } = req.body
  console.log(`🔄 Creating blockchain game for listing ${listingId}: ${contract_game_id}`)
  
  // Create game record
  const gameId = `game_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
  
  db.run(`
    INSERT INTO games (id, blockchain_id, listing_id, creator, nft_contract, nft_token_id, nft_name, nft_image, nft_collection, final_price, status, game_data, coin_data)
    SELECT ?, ?, ?, creator, nft_contract, nft_token_id, nft_name, nft_image, nft_collection, asking_price, 'waiting_payment', ?, coin_data
    FROM listings WHERE id = ?
  `, [gameId, contract_game_id, listingId, JSON.stringify({ transaction_hash }), listingId], function(err) {
    if (err) {
      console.error('❌ Error creating game:', err)
      return res.status(500).json({ error: 'Database error' })
    }
    
    // Update listing status
    db.run('UPDATE listings SET blockchain_game_id = ?, status = "game_created" WHERE id = ?', [contract_game_id, listingId], (err) => {
      if (err) {
        console.error('❌ Error updating listing:', err)
        return res.status(500).json({ error: 'Database error' })
      }
      console.log(`✅ Blockchain game created: ${gameId} (contract: ${contract_game_id})`)
      
                // Transfer WebSocket subscriptions from listing to game
          const listingRoom = gameRooms.get(listingId)
          if (listingRoom && listingRoom.size > 0) {
            console.log(`🔄 Transferring ${listingRoom.size} WebSocket subscriptions from listing ${listingId} to game ${gameId}`)
            gameRooms.set(gameId, listingRoom)
            gameRooms.delete(listingId)
            
            // Update all sockets in the room to point to the new game ID
            wss.clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN && listingRoom.has(client.id)) {
                client.gameId = gameId
              }
            })
            
            // Notify clients that the listing has been converted to a game
            broadcastToGame(gameId, {
              type: 'listing_converted_to_game',
              listingId,
              gameId,
              contractGameId: contract_game_id
            })
          }
      
      res.json({ success: true, gameId, contractGameId: contract_game_id })
    })
  })
})

// Confirm payment and start game
app.post('/api/games/:gameId/payment-confirmed', (req, res) => {
  const { gameId } = req.params
  const { joiner_address, payment_transaction_hash } = req.body
  console.log(`💰 Payment confirmed for game: ${gameId}`)
  
  db.run(`
    UPDATE games 
    SET joiner = ?, status = 'active', game_data = json_set(game_data, '$.payment_transaction_hash', ?)
    WHERE id = ? OR blockchain_id = ?
  `, [joiner_address, payment_transaction_hash, gameId, gameId], function(err) {
    if (err) {
      console.error('❌ Error updating game:', err)
      return res.status(500).json({ error: 'Database error' })
    }
    console.log(`✅ Game activated: ${gameId}`)
    res.json({ success: true, message: 'Game activated successfully' })
  })
})

// ===== PROFILE API ENDPOINTS =====

// Get profile by address
app.get('/api/profile/:address', (req, res) => {
  const { address } = req.params
  console.log(`👤 Fetching profile for: ${address}`)
  
  db.get('SELECT * FROM profiles WHERE address = ?', [address], (err, row) => {
    if (err) {
      console.error('❌ Error fetching profile:', err)
      return res.status(500).json({ error: 'Database error' })
    }
    if (!row) {
      console.log(`❌ Profile not found: ${address}`)
      return res.status(404).json({ error: 'Profile not found' })
    }
    console.log(`✅ Profile found: ${address}`)
    res.json(row)
  })
})

// Update profile
app.put('/api/profile/:address', (req, res) => {
  const { address } = req.params
  const profileData = req.body
  console.log(`👤 Updating profile for: ${address}`)
  
  db.run(`
    INSERT OR REPLACE INTO profiles (address, name, avatar, heads_image, tails_image, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `, [address, profileData.name || '', profileData.avatar || '', profileData.headsImage || '', profileData.tailsImage || ''], function(err) {
    if (err) {
      console.error('❌ Error updating profile:', err)
      return res.status(500).json({ error: 'Database error' })
    }
    console.log(`✅ Profile updated: ${address}`)
    res.json({ success: true, message: 'Profile updated successfully' })
  })
})

// ===== OFFERS API ENDPOINTS =====

// Get offers for a listing
app.get('/api/listings/:listingId/offers', (req, res) => {
  const { listingId } = req.params
  console.log(`💰 Fetching offers for listing: ${listingId}`)
  
  db.all('SELECT * FROM offers WHERE listing_id = ? ORDER BY created_at DESC', [listingId], (err, rows) => {
    if (err) {
      console.error('❌ Error fetching offers:', err)
      return res.status(500).json({ error: 'Database error' })
    }
    console.log(`✅ Found ${rows.length} offers for listing ${listingId}`)
    res.json(rows)
  })
})

// Create offer
app.post('/api/listings/:listingId/offers', (req, res) => {
  const { listingId } = req.params
  const { offerer_address, offerer_name, offer_price, message } = req.body
  console.log(`💰 Creating offer for listing: ${listingId}`)
  
  const offerId = `offer_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
  
  db.run(`
    INSERT INTO offers (id, listing_id, offerer_address, offerer_name, offer_price, message, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `, [offerId, listingId, offerer_address, offerer_name, offer_price, message], function(err) {
    if (err) {
      console.error('❌ Error creating offer:', err)
      return res.status(500).json({ error: 'Database error' })
    }
    console.log(`✅ Offer created: ${offerId}`)
    
    // Broadcast offer creation to all users subscribed to this listing
    console.log(`📡 Broadcasting offer_created to listing ${listingId}`)
    broadcastToGame(listingId, {
      type: 'offer_created',
      offerId,
      listingId
    })
    
    res.json({ success: true, offerId, message: 'Offer created successfully' })
  })
})

// Accept offer
app.post('/api/offers/:offerId/accept', (req, res) => {
  const { offerId } = req.params
  const { final_price } = req.body
  console.log(`✅ Accepting offer: ${offerId}`)
  
  db.run('UPDATE offers SET status = "accepted" WHERE id = ?', [offerId], function(err) {
    if (err) {
      console.error('❌ Error accepting offer:', err)
      return res.status(500).json({ error: 'Database error' })
    }
    
    // Get the listing ID from the offer
    db.get('SELECT listing_id FROM offers WHERE id = ?', [offerId], (err, offer) => {
      if (err || !offer) {
        console.error('❌ Error fetching offer:', err)
        return res.status(500).json({ error: 'Database error' })
      }
      
      // Update listing with final price
      db.run('UPDATE listings SET final_price = ?, status = "offer_accepted" WHERE id = ?', [final_price, offer.listing_id], (err) => {
        if (err) {
          console.error('❌ Error updating listing:', err)
          return res.status(500).json({ error: 'Database error' })
        }
        console.log(`✅ Offer accepted: ${offerId}`)
        
        // Broadcast offer acceptance to all users subscribed to this listing
        console.log(`📡 Broadcasting offer_updated (accepted) to listing ${offer.listing_id}`)
        broadcastToGame(offer.listing_id, {
          type: 'offer_updated',
          offerId,
          listingId: offer.listing_id,
          status: 'accepted'
        })
        
        // Only return success, never a gameId
        res.json({ success: true, message: 'Offer accepted successfully' })
      })
    })
  })
})

// Reject offer
app.post('/api/offers/:offerId/reject', (req, res) => {
  const { offerId } = req.params
  console.log(`❌ Rejecting offer: ${offerId}`)
  
  db.run('UPDATE offers SET status = "rejected" WHERE id = ?', [offerId], function(err) {
    if (err) {
      console.error('❌ Error rejecting offer:', err)
      return res.status(500).json({ error: 'Database error' })
    }
    
    // Get the listing ID from the offer
    db.get('SELECT listing_id FROM offers WHERE id = ?', [offerId], (err, offer) => {
      if (err || !offer) {
        console.error('❌ Error fetching offer:', err)
        return res.status(500).json({ error: 'Database error' })
      }
      
      console.log(`✅ Offer rejected: ${offerId}`)
      
              // Broadcast offer rejection to all users subscribed to this listing
        console.log(`📡 Broadcasting offer_updated (rejected) to listing ${offer.listing_id}`)
        broadcastToGame(offer.listing_id, {
          type: 'offer_updated',
          offerId,
          listingId: offer.listing_id,
          status: 'rejected'
        })
      
      res.json({ success: true, message: 'Offer rejected successfully' })
    })
  })
})

// ===== SERVER STARTUP =====
console.log('🚀 Starting server...')

initializeDatabase()
  .then((database) => {
    db = database
    console.log('✅ Database initialized')
    
    server.listen(PORT, () => {
      console.log(`🎮 CryptoFlipz V2 Server running on port ${PORT}`)
      console.log(`🌐 WebSocket server ready`)
      console.log(`📊 Database: ${DATABASE_PATH}`)
    })
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  })