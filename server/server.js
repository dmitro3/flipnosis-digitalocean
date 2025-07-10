const express = require('express')
const http = require('http')
const WebSocket = require('ws')
const cors = require('cors')
const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')
const fetch = require('node-fetch')

console.log('🚀 Starting FLIPNOSIS server...')

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

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

app.use(cors())
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
    timestamp: new Date().toISOString()
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

// WebSocket connection handling - simplified
wss.on('connection', (socket) => {
  console.log('Client connected:', socket.id)
  
  socket.on('join-game', (gameId) => {
    socket.join(`game-${gameId}`)
    console.log(`Socket ${socket.id} joined game ${gameId}`)
  })
  
  socket.on('game-event', (data) => {
    // Just relay events, no game logic
    io.to(`game-${data.gameId}`).emit('game-update', data)
  })
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

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
    
    // Only show waiting games by default
    if (!status) {
      query += ' AND status = "waiting"'
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
        gameData.nft_name || null,
        gameData.nft_image || null,
        gameData.nft_collection || null,
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
        
        res.json({ success: true, id: this.lastID })
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
    
    db.run(
      `UPDATE games SET 
       joiner = ?, 
       status = 'joined', 
       updated_at = CURRENT_TIMESTAMP,
       transaction_hash = COALESCE(?, transaction_hash)
       WHERE id = ? AND status = 'waiting'`,
      [joiner, transactionHash, gameId],
      function(err) {
        if (err) {
          console.error('❌ Error joining game:', err)
          return res.status(500).json({ error: err.message })
        }
        
        if (this.changes === 0) {
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