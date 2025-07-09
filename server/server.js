const express = require('express')
const http = require('http')
const WebSocket = require('ws')
const cors = require('cors')
const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')
const fetch = require('node-fetch') // You'll need to install this: npm install node-fetch@2

console.log('🚀 Starting FLIPNOSIS server...')
console.log('📁 Server directory:', __dirname)
console.log('📁 Process CWD:', process.cwd())
console.log('🌍 NODE_ENV:', process.env.NODE_ENV)
console.log('🔌 PORT:', process.env.PORT)

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

// Railway health check endpoint - must be first
app.get('/health', (req, res) => {
  console.log(`❤️ Health check at ${new Date().toISOString()}`)
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: process.env.PORT,
    host: '0.0.0.0'
  })
})

// Add extensive request logging
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.url}`)
  console.log('📥 Headers:', JSON.stringify(req.headers, null, 2))
  next()
})

app.use(cors())
app.use(express.json({ limit: '50mb' })) // Increase JSON payload limit
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Database setup with Railway environment variable
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

// Test route first
app.get('/test', (req, res) => {
  console.log('🧪 Test route hit!')
  res.json({ 
    message: 'Server is working!',
    timestamp: new Date().toISOString(),
    __dirname: __dirname,
    cwd: process.cwd(),
    env: process.env.NODE_ENV,
    port: process.env.PORT
  })
})

// Health check route (before static files)
app.get('/health', (req, res) => {
  console.log('❤️ Health check requested')
  res.json({ 
    status: 'ok', 
    activeSessions: 0, // activeSessions.size,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    __dirname: __dirname,
    staticPath: path.join(__dirname, '..'),
    distContents: (() => {
      try {
        const distPath = path.join(__dirname, '..')
        return fs.readdirSync(distPath)
      } catch (e) {
        return 'Error reading dist: ' + e.message
      }
    })()
  })
})

// ETH price caching
let cachedEthPrice = 3000 // Default fallback
let lastEthPriceUpdate = 0
const ETH_PRICE_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Listing fee configuration (in USD)
let listingFeeUSD = 0.20 // 20 cents - configurable

// Function to fetch current ETH price
async function fetchCurrentEthPrice() {
  try {
    console.log('💰 Fetching current ETH price...')
    
    // Try CoinGecko first (free, no API key needed)
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
    const data = await response.json()
    
    if (data.ethereum && data.ethereum.usd) {
      const price = data.ethereum.usd
      console.log('✅ ETH price from CoinGecko:', price)
      return price
    }
    
    // Fallback to alternative API
    const fallbackResponse = await fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot')
    const fallbackData = await fallbackResponse.json()
    
    if (fallbackData.data && fallbackData.data.amount) {
      const price = parseFloat(fallbackData.data.amount)
      console.log('✅ ETH price from Coinbase:', price)
      return price
    }
    
    throw new Error('No price data available')
    
  } catch (error) {
    console.error('❌ Error fetching ETH price:', error)
    return cachedEthPrice // Return cached price on error
  }
}

// Update ETH price every 5 minutes
async function updateEthPrice() {
  const now = Date.now()
  
  if (now - lastEthPriceUpdate > ETH_PRICE_CACHE_DURATION) {
    const newPrice = await fetchCurrentEthPrice()
    if (newPrice && newPrice > 0) {
      cachedEthPrice = newPrice
      lastEthPriceUpdate = now
      console.log('💰 ETH price updated to:', cachedEthPrice)
    }
  }
}

// ETH price endpoint
app.get('/api/eth-price', async (req, res) => {
  try {
    await updateEthPrice()
    res.json({ 
      price: cachedEthPrice,
      listingFeeUSD: listingFeeUSD,
      lastUpdated: new Date(lastEthPriceUpdate).toISOString(),
      cacheDuration: ETH_PRICE_CACHE_DURATION / 1000
    })
  } catch (error) {
    console.error('❌ Error in ETH price endpoint:', error)
    res.json({ 
      price: cachedEthPrice,
      listingFeeUSD: listingFeeUSD,
      error: 'Using cached price',
      lastUpdated: new Date(lastEthPriceUpdate).toISOString()
    })
  }
})

// Admin endpoint to update listing fee
app.post('/api/admin/listing-fee', (req, res) => {
  try {
    const { feeUSD } = req.body
    
    if (typeof feeUSD !== 'number' || feeUSD < 0) {
      return res.status(400).json({ error: 'Invalid fee amount' })
    }
    
    listingFeeUSD = feeUSD
    console.log('💰 Listing fee updated to:', listingFeeUSD, 'USD')
    
    res.json({ 
      success: true, 
      listingFeeUSD,
      message: `Listing fee updated to $${listingFeeUSD}`
    })
  } catch (error) {
    console.error('❌ Error updating listing fee:', error)
    res.status(500).json({ error: error.message })
  }
})

// API routes (before static files)
app.get('/api/test', (req, res) => {
  console.log('🔧 API test route hit!')
  res.json({ message: 'API is working!' })
})



// Profile API endpoints
app.get('/api/profile/:address', async (req, res) => {
  try {
    const { address } = req.params
    console.log('👤 Profile requested for address:', address)
    
    // Get profile from database
    db.get('SELECT * FROM user_profiles WHERE address = ?', [address], (err, row) => {
      if (err) {
        console.error('❌ Database error getting profile:', err)
        return res.status(500).json({ error: 'Database error' })
      }
      
      if (row) {
        console.log('✅ Profile found:', { address, name: row.name })
        res.json({
          address: row.address,
          name: row.name || '',
          avatar: row.avatar || '',
          headsImage: row.heads_image || '',
          tailsImage: row.tails_image || '',
          createdAt: row.created_at,
          updatedAt: row.updated_at
        })
      } else {
        console.log('📝 No profile found, returning empty profile')
        res.json({
          address: address,
          name: '',
          avatar: '',
          headsImage: '',
          tailsImage: '',
          createdAt: null,
          updatedAt: null
        })
      }
    })
  } catch (error) {
    console.error('❌ Profile API Error:', error)
    res.status(500).json({ error: 'Failed to get profile' })
  }
})

app.put('/api/profile/:address', async (req, res) => {
  try {
    const { address } = req.params
    const { name, avatar, headsImage, tailsImage } = req.body
    
    console.log('💾 Updating profile for address:', address, { name, hasAvatar: !!avatar, hasHeads: !!headsImage, hasTails: !!tailsImage })
    
    // Check if profile exists
    db.get('SELECT address FROM user_profiles WHERE address = ?', [address], (err, existing) => {
      if (err) {
        console.error('❌ Database error checking profile:', err)
        return res.status(500).json({ error: 'Database error' })
      }
      
      if (existing) {
        // Update existing profile
        const sql = `UPDATE user_profiles 
                     SET name = ?, avatar = ?, heads_image = ?, tails_image = ?, updated_at = CURRENT_TIMESTAMP 
                     WHERE address = ?`
        const values = [name || '', avatar || '', headsImage || '', tailsImage || '', address]
        
        db.run(sql, values, function(err) {
          if (err) {
            console.error('❌ Database error updating profile:', err)
            return res.status(500).json({ error: 'Failed to update profile' })
          }
          
          console.log('✅ Profile updated successfully')
          res.json({ success: true, message: 'Profile updated' })
        })
      } else {
        // Create new profile
        const sql = `INSERT INTO user_profiles (address, name, avatar, heads_image, tails_image, created_at, updated_at) 
                     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
        const values = [address, name || '', avatar || '', headsImage || '', tailsImage || '']
        
        db.run(sql, values, function(err) {
          if (err) {
            console.error('❌ Database error creating profile:', err)
            return res.status(500).json({ error: 'Failed to create profile' })
          }
          
          console.log('✅ Profile created successfully')
          res.json({ success: true, message: 'Profile created' })
        })
      }
    })
  } catch (error) {
    console.error('❌ Profile API Error:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

// Serve static files from the built frontend
if (process.env.NODE_ENV === 'production') {
  console.log('🌍 Production mode - setting up static file serving')
  
  // Debug file system
  console.log('📁 Current directory contents:', fs.readdirSync(__dirname))
  console.log('📁 Parent directory contents:', fs.readdirSync(path.join(__dirname, '..')))
  console.log('📁 Root directory contents:', fs.readdirSync('/app'))
  
  const distPath = path.join(__dirname, '..')
  console.log('📁 Looking for static files at:', distPath)
  
  // Check for index.html
  const indexPath = path.join(distPath, 'index.html')
  console.log('📄 Looking for index.html at:', indexPath)
  console.log('📄 Index.html exists:', fs.existsSync(indexPath))
  
  if (fs.existsSync(indexPath)) {
    console.log('✅ Found built frontend files')
    
    // Log all files in dist
    console.log('📁 Dist directory contents:', fs.readdirSync(distPath))
    
    app.use(express.static(distPath, {
      index: false, // Don't serve index.html automatically
      setHeaders: (res, path) => {
        console.log('📤 Serving static file:', path)
      }
    }))
    
    console.log('📁 Serving static files from:', distPath)
    
    // Handle React Router (SPA) - serve index.html for all non-API routes
    app.get('*', (req, res, next) => {
      console.log('🌐 Catch-all route hit for:', req.path)
      
      if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/test')) {
        console.log('🔄 Skipping catch-all for API route:', req.path)
        return next()
      }
      
      console.log('📄 Serving index.html for:', req.path)
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error('❌ Error serving index.html:', err)
          res.status(500).send('Error loading application: ' + err.message)
        } else {
          console.log('✅ Successfully served index.html for:', req.path)
        }
      })
    })
  } else {
    console.error('❌ Built frontend not found at:', distPath)
    console.log('📁 Available files in server dir:', fs.readdirSync(__dirname))
    console.log('📁 Available files in parent dir:', fs.readdirSync(path.join(__dirname, '..')))
    
    // Fallback response
    app.get('*', (req, res) => {
      res.status(404).json({
        error: 'Frontend not found',
        distPath: distPath,
        indexPath: indexPath,
        serverDir: __dirname,
        serverContents: fs.readdirSync(__dirname),
        parentContents: fs.readdirSync(path.join(__dirname, '..')),
        requestedPath: req.path
      })
    })
  }
} else {
  console.log('🏠 Development mode - not serving static files')
}

// Debug endpoint to see what files exist
app.get('/debug/files', (req, res) => {
  console.log('🔍 Debug files endpoint hit')
  try {
    const serverDir = fs.readdirSync(__dirname)
    const parentDir = fs.readdirSync(path.join(__dirname, '..'))
    const rootDir = fs.readdirSync('/app')
    
    res.json({
      serverDir: {
        path: __dirname,
        contents: serverDir
      },
      parentDir: {
        path: path.join(__dirname, '..'),
        contents: parentDir
      },
      rootDir: {
        path: '/app',
        contents: rootDir
      },
      indexExists: fs.existsSync(path.join(__dirname, '..', 'index.html')),
      indexPath: path.join(__dirname, '..', 'index.html')
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Debug endpoint to check database
app.get('/api/debug/db', async (req, res) => {
  try {
    // Test database connection
    db.get("SELECT name FROM sqlite_master WHERE type='table'", (err, result) => {
      if (err) {
        res.status(500).json({ error: 'Database error', details: err.message })
      } else {
        // Get all games count
        db.get("SELECT COUNT(*) as count FROM games", (err2, countResult) => {
          if (err2) {
            res.json({ 
              tablesExist: !!result,
              gamesTableExists: false,
              error: err2.message 
            })
          } else {
            res.json({ 
              tablesExist: !!result,
              gamesTableExists: true,
              gamesCount: countResult.count,
              databasePath: dbPath 
            })
          }
        })
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Database initialization endpoint
app.post('/api/debug/init', async (req, res) => {
  try {
    console.log('🔧 Manual database initialization requested')
    
    // Force database initialization
    db.serialize(() => {
      // Drop and recreate tables to ensure clean slate
      db.run("DROP TABLE IF EXISTS games", (err) => {
        if (err) console.log('Note: games table did not exist')
      })
      
      db.run("DROP TABLE IF EXISTS game_rounds", (err) => {
        if (err) console.log('Note: game_rounds table did not exist')
      })
      
      // Create games table
      db.run(`CREATE TABLE games (
        id TEXT PRIMARY KEY,
        creator TEXT NOT NULL,
        joiner TEXT,
        nft_contract TEXT NOT NULL,
        nft_token_id TEXT NOT NULL,
        nft_name TEXT,
        nft_image TEXT,
        nft_collection TEXT,
        nft_chain TEXT,
        nft_description TEXT,
        nft_attributes TEXT,
        nft_token_type TEXT,
        nft_external_url TEXT,
        nft_animation_url TEXT,
        price_usd REAL NOT NULL,
        rounds INTEGER NOT NULL,
        status TEXT DEFAULT 'waiting',
        winner TEXT,
        creator_wins INTEGER DEFAULT 0,
        joiner_wins INTEGER DEFAULT 0,
        listing_fee_eth REAL,
        listing_fee_hash TEXT,
        entry_fee_hash TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        started_at DATETIME,
        completed_at DATETIME
        -- REMOVED: total_spectators (no longer tracking spectators)
      )`, (err) => {
        if (err) {
          console.error('❌ Error creating games table:', err)
          res.status(500).json({ error: 'Failed to create games table', details: err.message })
        } else {
          console.log('✅ Games table created successfully')
          
          // Test insert
          const testGame = {
            id: 'test123',
            creator: '0x123',
            nft_contract: '0x456',
            nft_token_id: '1',
            nft_name: 'Test NFT',
            nft_image: 'test.jpg',
            nft_collection: 'Test Collection',
            nft_chain: 'base',
            price_usd: 1.0,
            rounds: 3
          }
          
          const sql = `INSERT INTO games (
            id, creator, nft_contract, nft_token_id, nft_name, nft_image, 
            nft_collection, nft_chain, price_usd, rounds
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          
          db.run(sql, [
            testGame.id, testGame.creator, testGame.nft_contract, 
            testGame.nft_token_id, testGame.nft_name, testGame.nft_image,
            testGame.nft_collection, testGame.nft_chain, testGame.price_usd, 
            testGame.rounds
          ], function(err) {
            if (err) {
              console.error('❌ Test insert failed:', err)
              res.json({ 
                success: false, 
                message: 'Tables created but test insert failed',
                error: err.message 
              })
            } else {
              console.log('✅ Test game inserted successfully')
              res.json({ 
                success: true, 
                message: 'Database initialized successfully',
                testGameId: testGame.id,
                insertId: this.lastID
              })
            }
          })
        }
      })
    })
    
  } catch (error) {
    console.error('❌ Database initialization error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Database initialization and rest of your code stays the same...
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err)
  } else {
    console.log('✅ Connected to SQLite database at:', dbPath)
    // Force immediate initialization
    setTimeout(() => {
      initializeDatabase()
    }, 100)
  }
})

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Games table
    db.run(`CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      creator TEXT NOT NULL,
      joiner TEXT,
      nft_contract TEXT NOT NULL,
      nft_token_id TEXT NOT NULL,
      nft_name TEXT,
      nft_image TEXT,
      nft_collection TEXT,
      nft_chain TEXT,
      nft_description TEXT,
      nft_attributes TEXT,
      nft_token_type TEXT,
      nft_external_url TEXT,
      nft_animation_url TEXT,
      price_usd REAL NOT NULL,
      rounds INTEGER NOT NULL,
      status TEXT DEFAULT 'waiting',
      winner TEXT,
      creator_wins INTEGER DEFAULT 0,
      joiner_wins INTEGER DEFAULT 0,
      listing_fee_eth REAL,
      listing_fee_hash TEXT,
      entry_fee_hash TEXT,
      coin TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      started_at DATETIME,
      completed_at DATETIME,
      contract_game_id TEXT,
      transaction_hash TEXT,
      join_transaction_hash TEXT,
      flip_transaction_hash TEXT
    )`, (err) => {
      if (err) {
        console.error('❌ Error creating games table:', err)
      } else {
        console.log('✅ Games table ready')
        
        // Add new columns to existing tables if they don't exist
        db.run(`ALTER TABLE games ADD COLUMN contract_game_id TEXT`, (alterErr) => {
          if (alterErr && !alterErr.message.includes('duplicate column')) {
            console.error('❌ Error adding contract_game_id column:', alterErr)
          } else if (!alterErr) {
            console.log('✅ Added contract_game_id column to games table')
          }
        })
        
        db.run(`ALTER TABLE games ADD COLUMN transaction_hash TEXT`, (alterErr) => {
          if (alterErr && !alterErr.message.includes('duplicate column')) {
            console.error('❌ Error adding transaction_hash column:', alterErr)
          } else if (!alterErr) {
            console.log('✅ Added transaction_hash column to games table')
          }
        })
        
        db.run(`ALTER TABLE games ADD COLUMN join_transaction_hash TEXT`, (alterErr) => {
          if (alterErr && !alterErr.message.includes('duplicate column')) {
            console.error('❌ Error adding join_transaction_hash column:', alterErr)
          } else if (!alterErr) {
            console.log('✅ Added join_transaction_hash column to games table')
          }
        })
        
        db.run(`ALTER TABLE games ADD COLUMN flip_transaction_hash TEXT`, (alterErr) => {
          if (alterErr && !alterErr.message.includes('duplicate column')) {
            console.error('❌ Error adding flip_transaction_hash column:', alterErr)
          } else if (!alterErr) {
            console.log('✅ Added flip_transaction_hash column to games table')
          }
        })
        
        // Add coin column to existing tables if it doesn't exist
        db.run(`ALTER TABLE games ADD COLUMN coin TEXT`, (alterErr) => {
          if (alterErr && !alterErr.message.includes('duplicate column')) {
            console.error('❌ Error adding coin column:', alterErr)
          } else if (!alterErr) {
            console.log('✅ Added coin column to games table')
          }
        })
      }
    })

    // Game rounds table
    db.run(`CREATE TABLE IF NOT EXISTS game_rounds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT NOT NULL,
      round_number INTEGER NOT NULL,
      flip_result TEXT NOT NULL,
      flipper_address TEXT NOT NULL,
      power_used REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(game_id) REFERENCES games(id)
    )`)

    // Player statistics table
    db.run(`CREATE TABLE IF NOT EXISTS player_stats (
      address TEXT PRIMARY KEY,
      total_games INTEGER DEFAULT 0,
      games_won INTEGER DEFAULT 0,
      games_lost INTEGER DEFAULT 0,
      total_winnings_usd REAL DEFAULT 0,
      total_spent_usd REAL DEFAULT 0,
      favorite_chain TEXT,
      first_game_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_game_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`)

    // Transactions table for all payments
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT,
      player_address TEXT NOT NULL,
      transaction_type TEXT NOT NULL, -- 'listing_fee', 'entry_fee', 'payout'
      amount_usd REAL NOT NULL,
      amount_eth REAL NOT NULL,
      tx_hash TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(game_id) REFERENCES games(id)
    )`)

    // User profiles table
    db.run(`CREATE TABLE IF NOT EXISTS user_profiles (
      address TEXT PRIMARY KEY,
      name TEXT,
      avatar TEXT,
      heads_image TEXT,
      tails_image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('❌ Error creating user_profiles table:', err)
      } else {
        console.log('✅ User profiles table ready')
      }
    })

    // NFT metadata cache table
    db.run(`CREATE TABLE IF NOT EXISTS nft_metadata_cache (
      contract_address TEXT NOT NULL,
      token_id TEXT NOT NULL,
      name TEXT,
      image_url TEXT,
      collection_name TEXT,
      description TEXT,
      attributes TEXT,
      token_type TEXT DEFAULT 'ERC721',
      chain TEXT DEFAULT 'base',
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (contract_address, token_id, chain)
    )`, (err) => {
      if (err) {
        console.error('❌ Error creating nft_metadata_cache table:', err)
      } else {
        console.log('✅ NFT metadata cache table ready')
      }
    })

    console.log('✅ Database tables initialized')
  })
}

// Call initializeDatabase during server startup
initializeDatabase()

// Database helper functions
const dbHelpers = {
  // Create a new game
  createGame: (gameData) => {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO games (
        id, creator, nft_contract, nft_token_id, nft_name, nft_image, 
        nft_collection, nft_chain, nft_description, nft_attributes, 
        nft_token_type, nft_external_url, nft_animation_url,
        price_usd, rounds, listing_fee_eth, listing_fee_hash, coin
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      
      const values = [
        gameData.id,
        gameData.creator,
        gameData.nft.contractAddress,
        gameData.nft.tokenId,
        gameData.nft.name,
        gameData.nft.image,
        gameData.nft.collection,
        gameData.nft.chain,
        gameData.nft.metadata?.description || '',
        JSON.stringify(gameData.nft.metadata?.attributes || []),
        gameData.nft.tokenType || 'ERC721',
        gameData.nft.metadata?.externalUrl || '',
        gameData.nft.metadata?.animationUrl || '',
        gameData.priceUSD,
        gameData.rounds,
        gameData.listingFee?.amountETH,
        gameData.listingFee?.transactionHash,
        JSON.stringify(gameData.coin || {}) // NEW: Store coin data as JSON
      ]
      
      db.run(sql, values, function(err) {
        if (err) {
          console.error('❌ Error creating game:', err)
          reject(err)
        } else {
          console.log('✅ Game created in database:', gameData.id)
          resolve(this.lastID)
        }
      })
    })
  },

  // Get game by ID
  getGame: (gameId) => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM games WHERE id = ?`
      db.get(sql, [gameId], (err, row) => {
        if (err) {
          console.error('❌ Error getting game:', err)
          reject(err)
        } else if (row) {
          // Parse the JSON attributes back to array
          try {
            row.nft_attributes = JSON.parse(row.nft_attributes || '[]')
          } catch (parseError) {
            console.error('Error parsing NFT attributes:', parseError)
            row.nft_attributes = []
          }
          
          // Parse the coin data back to object
          if (row.coin) {
            try {
              row.coin = JSON.parse(row.coin)
            } catch (parseError) {
              console.error('Error parsing coin data:', parseError)
              row.coin = null
            }
          }
          
          resolve(row)
        } else {
          resolve(null)
        }
      })
    })
  },

  // Get all games (not just waiting)
  getAllGames: (limit = 50) => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM games ORDER BY created_at DESC LIMIT ?`
      db.all(sql, [limit], (err, rows) => {
        if (err) {
          console.error('❌ Error getting games:', err)
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  },

  // Get all waiting games
  getWaitingGames: (limit = 50) => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM games WHERE status = 'waiting' ORDER BY created_at DESC LIMIT ?`
      db.all(sql, [limit], (err, rows) => {
        if (err) {
          console.error('❌ Error getting waiting games:', err)
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  },

  // Update game status
  updateGame: (gameId, updates) => {
    return new Promise((resolve, reject) => {
      const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ')
      const sql = `UPDATE games SET ${setClause} WHERE id = ?`
      const values = [...Object.values(updates), gameId]
      
      db.run(sql, values, function(err) {
        if (err) {
          console.error('❌ Error updating game:', err)
          reject(err)
        } else {
          console.log('✅ Game updated:', gameId)
          resolve(this.changes)
        }
      })
    })
  },

  // Record a round result
  recordRound: (gameId, roundNumber, flipResult, flipperAddress, power) => {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO game_rounds (game_id, round_number, flip_result, flipper_address, power_used) 
                   VALUES (?, ?, ?, ?, ?)`
      
      db.run(sql, [gameId, roundNumber, flipResult, flipperAddress, power], function(err) {
        if (err) {
          console.error('❌ Error recording round:', err)
          reject(err)
        } else {
          console.log('✅ Round recorded:', gameId, roundNumber)
          resolve(this.lastID)
        }
      })
    })
  },

  // Record transaction
  recordTransaction: (gameId, playerAddress, type, amountUSD, amountETH, txHash) => {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO transactions (game_id, player_address, transaction_type, amount_usd, amount_eth, tx_hash) 
                   VALUES (?, ?, ?, ?, ?, ?)`
      
      db.run(sql, [gameId, playerAddress, type, amountUSD, amountETH, txHash], function(err) {
        if (err) {
          console.error('❌ Error recording transaction:', err)
          reject(err)
        } else {
          console.log('✅ Transaction recorded:', type, amountUSD)
          resolve(this.lastID)
        }
      })
    })
  },

  // Get monthly stats
  getMonthlyStats: (year, month) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          COUNT(*) as total_games,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_games,
          SUM(price_usd) as total_value,
          COUNT(DISTINCT creator) as unique_creators,
          COUNT(DISTINCT joiner) as unique_joiners
        FROM games 
        WHERE strftime('%Y', created_at) = ? AND strftime('%m', created_at) = ?
      `
      
      db.get(sql, [year.toString(), month.toString().padStart(2, '0')], (err, row) => {
        if (err) {
          console.error('❌ Error getting monthly stats:', err)
          reject(err)
        } else {
          resolve(row)
        }
      })
    })
  }
}

// Add global game viewers tracking (before GameSession class)
const gameViewers = new Map() // gameId -> Set of WebSocket connections

// Global function to broadcast to all viewers of a game
function broadcastToGameViewers(gameId, message) {
  const viewers = gameViewers.get(gameId)
  if (!viewers) return
  
  const deadViewers = new Set()
  viewers.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message))
      } catch (error) {
        console.error('❌ Error broadcasting to viewer:', error)
        deadViewers.add(ws)
      }
    } else {
      deadViewers.add(ws)
    }
  })
  
  // Clean up dead connections
  deadViewers.forEach(ws => {
    viewers.delete(ws)
  })
}

class GameSession {
  constructor(gameId) {
    this.gameId = gameId
    this.clients = new Set() // Only actual players now
    this.creator = null
    this.joiner = null
    this.phase = 'waiting'
    this.currentRound = 1
    this.maxRounds = 5
    this.creatorWins = 0
    this.joinerWins = 0
    this.winner = null
    this.creatorPower = 0
    this.joinerPower = 0
    this.chargingPlayer = null
    this.currentPlayer = null
    this.isFlipInProgress = false
    this.creatorChoice = null
    this.joinerChoice = null
    this.turnTimer = null
    this.turnTimeLeft = 20
    this.powerInterval = null
    this.preCalculatedResult = null
    
    // NEW: Join state management
    this.joinInProgress = false
    this.joiningPlayer = null
    
    // NFT vs NFT fields
    this.gameType = 'crypto-vs-crypto'
    this.offeredNFTs = []
    this.acceptedOffer = null
    this.challengerPaid = false
    
    // Player profiles
    this.creatorProfile = null
    this.joinerProfile = null
    
    // Coin customization
    this.coin = null
  }

  addClient(ws, playerAddress) {
    // Only add if they're a player in this game
    if (playerAddress === this.creator || playerAddress === this.joiner) {
      console.log('🔌 Adding player client to game:', {
        gameId: this.gameId,
        playerAddress,
        isCreator: playerAddress === this.creator,
        isJoiner: playerAddress === this.joiner,
        currentClients: this.clients.size
      })
      this.clients.add(ws)
      console.log('✅ Player client added. Total clients:', this.clients.size)
    } else {
      console.log('❌ Rejected non-player client:', {
        gameId: this.gameId,
        playerAddress,
        creator: this.creator,
        joiner: this.joiner
      })
      ws.send(JSON.stringify({ 
        type: 'error', 
        error: 'Only game players can connect to game session' 
      }))
    }
  }

  removeClient(ws) {
    console.log('🔌 Removing client from game:', {
      gameId: this.gameId,
      currentClients: this.clients.size,
      phase: this.phase
    })
    this.clients.delete(ws)
  }

  broadcastGameState() {
    const state = {
      type: 'game_state',
      gameId: this.gameId,
      creator: this.creator,
      joiner: this.joiner,
      phase: this.phase,
      currentRound: this.currentRound,
      maxRounds: this.maxRounds,
      creatorWins: this.creatorWins,
      joinerWins: this.joinerWins,
      winner: this.winner,
      creatorPower: this.creatorPower,
      joinerPower: this.joinerPower,
      chargingPlayer: this.chargingPlayer,
      currentPlayer: this.currentPlayer,
      isFlipInProgress: this.isFlipInProgress,
      creatorChoice: this.creatorChoice,
      joinerChoice: this.joinerChoice,
      gameType: this.gameType,
      offeredNFTs: this.offeredNFTs,
      acceptedOffer: this.acceptedOffer,
      challengerPaid: this.challengerPaid,
      creatorProfile: this.creatorProfile,
      joinerProfile: this.joinerProfile,
      turnTimeLeft: this.turnTimeLeft,
      coin: this.coin,
      joinInProgress: this.joinInProgress,
      joiningPlayer: this.joiningPlayer
    }

    console.log('📢 Broadcasting game state:', {
      gameId: this.gameId,
      phase: this.phase,
      currentPlayer: this.currentPlayer,
      clients: this.clients.size,
      joinInProgress: this.joinInProgress,
      creator: this.creator,
      joiner: this.joiner,
      coin: this.coin ? 'present' : 'null'
    })

    // Safely broadcast to all clients (only players now)
    const deadClients = new Set()
    
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify(state))
        } catch (error) {
          console.error('❌ Error sending to client, marking for removal:', error)
          deadClients.add(client)
        }
      } else {
        deadClients.add(client)
      }
    })
    
    // Clean up dead clients
    deadClients.forEach(client => {
      this.clients.delete(client)
    })
  }

  // NEW: Start join process
  async startJoinProcess(address) {
    if (this.joinInProgress) {
      return { success: false, error: 'Another player is already joining' }
    }
    
    if (this.joiner) {
      return { success: false, error: 'Game already has a second player' }
    }
    
    if (this.creator === address) {
      return { success: false, error: 'Creator cannot join their own game' }
    }
    
    if (this.phase !== 'waiting') {
      return { success: false, error: 'Game is not accepting new players' }
    }
    
    this.joinInProgress = true
    this.joiningPlayer = address
    
    // Broadcast updated state to show "Player Joining..." 
    this.broadcastToAll()
    
    console.log('🎯 Join process started for:', address)
    return { success: true }
  }

  // NEW: Complete join process
  async completeJoinProcess(address, entryFeeHash) {
    // Check if this is a valid join process OR if it's a blockchain-based join
    if (!this.joinInProgress || this.joiningPlayer !== address) {
      // For blockchain-based joins, we'll allow completion without a join process
      console.log('🔄 Blockchain-based join detected, allowing completion')
    }
    
    // Normal join process completion
    this.joiner = address
    this.phase = 'ready'
    this.joinInProgress = false
    this.joiningPlayer = null
    
    console.log('✅ Join process completed for:', address)
    console.log('📊 Current session state after join:', {
      gameId: this.gameId,
      phase: this.phase,
      currentPlayer: this.currentPlayer,
      creator: this.creator,
      joiner: this.joiner,
      clients: this.clients.size
    })
    this.broadcastToAll()
    
    // Also broadcast current game state to all players
    this.broadcastGameState()
    
    // Auto-start the choosing phase after 2 seconds
    setTimeout(() => {
      if (this.phase === 'ready' && this.creator && this.joiner) {
        console.log('🚀 AUTO-STARTING game - entering choosing phase WITH TIMER')
        this.startGameWithTimer()
      }
    }, 2000)
    
    return { success: true }
  }

  // NEW: Cancel join process
  async cancelJoinProcess(address) {
    if (this.joinInProgress && this.joiningPlayer === address) {
      this.joinInProgress = false
      this.joiningPlayer = null
      this.broadcastToAll()
      console.log('❌ Join process cancelled for:', address)
    }
  }

  // NEW: Broadcast to ALL potential viewers (not just players)
  broadcastToAll() {
    const state = {
      type: 'join_state_update',
      gameId: this.gameId,
      joiner: this.joiner,
      phase: this.phase,
      joinInProgress: this.joinInProgress,
      joiningPlayer: this.joiningPlayer
    }

    // This will be handled by the main WebSocket handler to broadcast to all viewers
    broadcastToGameViewers(this.gameId, state)
  }

  async setGameData(data) {
    this.gameData = data
    this.creator = data.creator
    this.maxRounds = data.rounds
    this.coin = data.coin // NEW: Store coin data
    try {
      await dbHelpers.createGame(data)
    } catch (error) {
      console.error('Error saving game:', error)
    }
    this.broadcastGameState()
  }

  async startGame() {
    console.log('🎮 startGame called:', { 
      currentPhase: this.phase,
      creator: this.creator,
      joiner: this.joiner
    })
    
    if (this.phase !== 'ready') {
      console.log('❌ Cannot start game - wrong phase:', this.phase)
      return
    }
    
    this.phase = 'choosing'  // Changed from 'round_active' to 'choosing'
    this.currentPlayer = this.creator  // Player 1 chooses first
    this.currentRound = 1
    this.resetPowers()
    this.resetChoices()
    
    // START THE TIMER IMMEDIATELY when game begins
    this.startTurnTimer()
    
    console.log('✅ Game started:', {
      newPhase: this.phase,
      currentPlayer: this.currentPlayer,
      currentRound: this.currentRound,
      turnTimeLeft: this.turnTimeLeft
    })
    
    try {
      await dbHelpers.updateGame(this.gameId, { 
        status: 'active',
        started_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error updating game start:', error)
    }
    
    console.log('🎯 Game started with countdown - Player 1 has 20 seconds to choose')
    this.broadcastGameState()
  }

  async startGameWithTimer() {
    console.log('🎮 startGameWithTimer called:', { 
      currentPhase: this.phase,
      creator: this.creator,
      joiner: this.joiner
    })
    
    if (this.phase !== 'ready') {
      console.log('❌ Cannot start game - wrong phase:', this.phase)
      return
    }
    
    this.phase = 'choosing'
    this.currentPlayer = this.creator  // Player 1 chooses first
    this.currentRound = 1
    this.resetPowers()
    this.resetChoices()
    
    // START THE TIMER IMMEDIATELY when game begins
    this.startTurnTimer()
    
    console.log('✅ Game started with timer:', {
      newPhase: this.phase,
      currentPlayer: this.currentPlayer,
      currentRound: this.currentRound,
      turnTimeLeft: this.turnTimeLeft
    })
    
    try {
      await dbHelpers.updateGame(this.gameId, { 
        status: 'active',
        started_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error updating game start:', error)
    }
    
    console.log('🎯 Game started with countdown - Player 1 has 20 seconds to choose')
    this.broadcastGameState()
  }

  setPlayerChoice(address, choice) {
    console.log('🎯 setPlayerChoice called:', {
      address,
      choice,
      phase: this.phase,
      currentPlayer: this.currentPlayer,
      creatorChoice: this.creatorChoice,
      joinerChoice: this.joinerChoice
    })

    if (this.phase !== 'choosing' || address !== this.currentPlayer) {
      console.log('❌ Cannot set choice:', { 
        phase: this.phase, 
        currentPlayer: this.currentPlayer, 
        address 
      })
      return false
    }
    
    if (address === this.creator) {
      this.creatorChoice = choice
      console.log('✅ Creator chose:', choice)
    } else if (address === this.joiner) {
      this.joinerChoice = choice
      console.log('✅ Joiner chose:', choice)
    } else {
      return false
    }
    
    // Move to power charging phase after choice is made
    this.phase = 'round_active'
    console.log('🔄 Moving to round_active phase after choice')

    // Stop the choosing timer and start charging timer
    this.stopTurnTimer()
    this.startTurnTimer()

    this.broadcastGameState()
    return true
  }

  resetPowers() {
    this.creatorPower = 0
    this.joinerPower = 0
    this.chargingPlayer = null
  }

  resetChoices() {
    this.creatorChoice = null
    this.joinerChoice = null
  }

  startTurnTimer() {
    // Clear any existing timer
    if (this.turnTimer) {
      clearInterval(this.turnTimer)
    }
    
    this.turnTimeLeft = 20 // Reset to 20 seconds
    
    // Start the timer
    this.turnTimer = setInterval(() => {
      this.turnTimeLeft--
      
      // Broadcast time remaining
      this.broadcastGameState()
      
      // If time runs out, auto-flip at max power
      if (this.turnTimeLeft <= 0) {
        clearInterval(this.turnTimer)
        this.turnTimer = null
        
        // Auto-flip at max power
        this.autoFlip()
      }
    }, 1000)
  }

  stopTurnTimer() {
    if (this.turnTimer) {
      clearInterval(this.turnTimer)
      this.turnTimer = null
    }
  }

  async autoFlip() {
    console.log('⚡ Auto-flipping due to timeout for:', this.currentPlayer)
    
    // If player hasn't chosen, auto-choose for them
    if (this.currentPlayer === this.creator && !this.creatorChoice) {
      console.log('🎯 Auto-choosing HEADS for creator due to timeout')
      this.creatorChoice = 'heads'
    } else if (this.currentPlayer === this.joiner && !this.joinerChoice) {
      console.log('🎯 Auto-choosing TAILS for joiner due to timeout')
      this.joinerChoice = 'tails'
    }
    
    // Move to active phase if still in choosing
    if (this.phase === 'choosing') {
      this.phase = 'round_active'
    }
    
    // Use medium power for better animation (results in ~3 second flip)
    const autoPower = 5
    
    // Set medium power
    if (this.currentPlayer === this.creator) {
      this.creatorPower = autoPower
    } else {
      this.joinerPower = autoPower
    }
    
    // Pre-calculate result for auto-flip
    this.preCalculatedResult = Math.random() < 0.5 ? 'heads' : 'tails'
    
    console.log('🎯 Auto-flip summary:', {
      currentPlayer: this.currentPlayer,
      creatorChoice: this.creatorChoice,
      joinerChoice: this.joinerChoice,
      power: autoPower,
      preCalculatedResult: this.preCalculatedResult
    })
    
    // Broadcast state update
    this.broadcastGameState()
    
    // Wait a moment for UI to update
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Execute the flip with medium power
    await this.executeFlip(this.currentPlayer, autoPower)
  }

  startCharging(address) {
    console.log('⚡ startCharging called:', {
      address,
      currentPlayer: this.currentPlayer,
      isFlipInProgress: this.isFlipInProgress,
      phase: this.phase
    })
    
    if (this.isFlipInProgress || address !== this.currentPlayer) {
      console.log('❌ Cannot start charging:', {
        isFlipInProgress: this.isFlipInProgress,
        isCurrentPlayer: address === this.currentPlayer
      })
      return
    }
    
    // Ensure we're in the right phase
    if (this.phase !== 'round_active') {
      console.log('❌ Wrong phase for charging:', this.phase)
      return
    }
    
    this.chargingPlayer = address
    this.broadcastGameState()
    
    // Start power increase
    this.powerInterval = setInterval(() => {
      if (address === this.creator) {
        this.creatorPower = Math.min(10, this.creatorPower + 0.3)
      } else {
        this.joinerPower = Math.min(10, this.joinerPower + 0.3)
      }
      this.broadcastGameState()
    }, 100)
  }

  async stopCharging(address) {
    if (this.chargingPlayer !== address) return
    
    clearInterval(this.powerInterval)
    this.chargingPlayer = null
    
    const power = address === this.creator ? this.creatorPower : this.joinerPower
    
    if (power > 0) {
      await this.executeFlip(address, power)
    }
    
    this.broadcastGameState()
  }

  async executeFlip(address, power) {
    if (this.isFlipInProgress || address !== this.currentPlayer) {
      console.log('❌ Cannot execute flip:', {
        isFlipInProgress: this.isFlipInProgress,
        addressIsCurrentPlayer: address === this.currentPlayer,
        currentPlayer: this.currentPlayer
      })
      return
    }
    
    // Stop the turn timer
    this.stopTurnTimer()
    
    console.log('🎲 Executing flip for:', address, 'with power:', power)
    
    this.isFlipInProgress = true
    this.broadcastGameState()
    
    // Generate instant result on release
    const result = Math.random() < 0.5 ? 'heads' : 'tails'
    console.log('🎲 Instant flip result generated:', result)
    
    // FIXED: Get the actual player choice instead of hardcoded values
    const playerChoice = address === this.creator ? this.creatorChoice : this.joinerChoice
    const isWinner = playerChoice === result
    
    console.log('🎲 FLIP RESULT CALCULATION:', {
      address,
      isCreator: address === this.creator,
      playerChoice,
      result,
      isWinner,
      power,
      creatorChoice: this.creatorChoice,
      joinerChoice: this.joinerChoice,
      // Additional clarity
      playerChoiceMatchesResult: playerChoice === result,
      winnerDetermination: playerChoice === result ? 'PLAYER WINS' : 'OPPONENT WINS'
    })
    
    // Calculate flip duration based on power
    // Power 1 = 5 seconds, Power 10 = 10 seconds
    // Higher power = longer, more dramatic flip
    const flipDuration = 5000 + (power * 500)
    
    console.log('⏱️ Flip duration:', flipDuration, 'ms')
    
    // Broadcast flip animation
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify({
            type: 'flip_animation',
            result: result,
            duration: flipDuration,
            playerChoice: playerChoice,
            playerAddress: address,
            power: power
          }))
        } catch (error) {
          console.error('❌ Error sending flip animation:', error)
        }
      }
    })
    
    // Process result after animation with extra logging
    console.log('⏰ Setting timeout for processFlipResult in:', flipDuration + 1000, 'ms')
    setTimeout(async () => {
      console.log('⏰ Timeout fired - calling processFlipResult')
      await this.processFlipResult(address, result, isWinner, power)
    }, flipDuration + 1000)
  }

  async processFlipResult(address, result, isWinner, power) {
    try {
      if (this.roundCompleted) {
        console.log('⚠️ Round already completed, skipping')
        return
      }
      
      console.log('🎯 Processing flip result:', {
        address,
        result,
        isWinner,
        power,
        currentRound: this.currentRound,
        isCreator: address === this.creator,
        playerChoice: address === this.creator ? this.creatorChoice : this.joinerChoice
      })
      
      this.roundCompleted = true
      
      // FIXED: Update scores based on who actually won
      if (isWinner) {
        if (address === this.creator) {
          this.creatorWins++
          console.log('✅ CREATOR WINS! Score:', this.creatorWins, '-', this.joinerWins)
        } else if (address === this.joiner) {
          this.joinerWins++
          console.log('✅ JOINER WINS! Score:', this.creatorWins, '-', this.joinerWins)
        }
      } else {
        // The player who flipped lost, so the other player wins
        if (address === this.creator) {
          this.joinerWins++
          console.log('✅ JOINER WINS (creator lost)! Score:', this.creatorWins, '-', this.joinerWins)
        } else if (address === this.joiner) {
          this.creatorWins++
          console.log('✅ CREATOR WINS (joiner lost)! Score:', this.creatorWins, '-', this.joinerWins)
        }
      }

      // Record in database
      try {
        await dbHelpers.recordRound(this.gameId, this.currentRound, result, address, power)
        await dbHelpers.updateGame(this.gameId, { 
          creator_wins: this.creatorWins,
          joiner_wins: this.joinerWins
        })
        console.log('✅ Database updated successfully')
      } catch (dbError) {
        console.error('❌ Database error:', dbError)
      }

      // FIXED: Determine actual winner based on the flip result and player choices
      const actualWinner = isWinner ? address : (address === this.creator ? this.joiner : this.creator)
      
      console.log('🏆 ROUND RESULT SUMMARY:', {
        flipResult: result,
        currentPlayerAddress: address,
        currentPlayerChoice: address === this.creator ? this.creatorChoice : this.joinerChoice,
        currentPlayerWon: isWinner,
        actualWinner: actualWinner,
        newScore: `${this.creatorWins}-${this.joinerWins}`,
        // Additional clarity
        winnerExplanation: isWinner 
          ? `${address} won because their choice (${address === this.creator ? this.creatorChoice : this.joinerChoice}) matched the result (${result})`
          : `${actualWinner} won because ${address}'s choice (${address === this.creator ? this.creatorChoice : this.joinerChoice}) did not match the result (${result})`
      })
      
      // Broadcast result to all clients with detailed information
      try {
        this.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            try {
              client.send(JSON.stringify({
                type: 'round_result',
                result: result,
                isWinner: isWinner,
                playerAddress: address,
                playerChoice: address === this.creator ? this.creatorChoice : this.joinerChoice,
                actualWinner: actualWinner,
                creatorWins: this.creatorWins,
                joinerWins: this.joinerWins,
                roundNumber: this.currentRound,
                // Additional debug info
                flipperWon: isWinner,
                creatorChoice: this.creatorChoice,
                joinerChoice: this.joinerChoice
              }))
            } catch (sendError) {
              console.error('❌ Error sending result to client:', sendError)
            }
          }
        })
      } catch (broadcastError) {
        console.error('❌ Broadcast error:', broadcastError)
      }

      // Check win condition
      const winsNeeded = Math.ceil(this.maxRounds / 2)
      if (this.creatorWins >= winsNeeded || this.joinerWins >= winsNeeded) {
        console.log('🏆 Game complete! Final scores:', this.creatorWins, '-', this.joinerWins)
        // End game after showing result
        setTimeout(() => {
          this.endGame()
        }, 3000)
        return
      }

      // Schedule next round - FIXED TIMING
      console.log('⏳ Scheduling next round in 4 seconds...')
      setTimeout(() => {
        console.log('🔄 Timer fired - calling prepareNextRound')
        this.prepareNextRound()
      }, 4000)
      
    } catch (error) {
      console.error('❌ Critical error in processFlipResult:', error)
      this.broadcastGameState()
    }
  }

  async endGame() {
    // Stop any running timer
    this.stopTurnTimer()
    
    this.phase = 'game_complete'
    this.winner = this.creatorWins > this.joinerWins ? this.creator : this.joiner
    
    try {
      await dbHelpers.updateGame(this.gameId, { 
        status: 'completed',
        winner: this.winner,
        completed_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error updating game completion:', error)
    }
    
    this.broadcastGameState()
  }

  prepareNextRound() {
    try {
      if (this.phase === 'game_complete') {
        console.log('⚠️ Game already complete, not preparing next round')
        return
      }
      
      console.log('🔄 Preparing next round...', {
        currentRound: this.currentRound,
        maxRounds: this.maxRounds,
        currentPlayer: this.currentPlayer
      })
      
      // Increment round
      this.currentRound++
      
      // Switch players
      this.currentPlayer = this.currentPlayer === this.creator ? this.joiner : this.creator
      
      // Reset round state
      this.phase = 'choosing'
      this.isFlipInProgress = false
      this.roundCompleted = false
      this.resetPowers()
      this.resetChoices()
      
      // START THE TIMER IMMEDIATELY when switching players
      this.startTurnTimer()
      
      // Check if this is the final round (round 5) and scores are tied
      if (this.currentRound === 5 && this.creatorWins === this.joinerWins) {
        console.log('🏆 Final round with tied scores - auto-flipping')
        this.phase = 'round_active'
        this.autoFlip()
      }
      
      console.log('✅ Next round ready:', {
        newRound: this.currentRound,
        newCurrentPlayer: this.currentPlayer,
        phase: this.phase,
        turnTimeLeft: this.turnTimeLeft
      })
      
      // Broadcast the new round state
      this.broadcastGameState()
      
    } catch (error) {
      console.error('❌ Error in prepareNextRound:', error)
      this.broadcastGameState()
    }
  }

  async loadFromDatabase() {
    try {
      const gameData = await dbHelpers.getGame(this.gameId)
      if (gameData) {
        this.creator = gameData.creator
        this.joiner = gameData.joiner
        this.maxRounds = gameData.rounds
        this.creatorWins = gameData.creator_wins || 0
        this.joinerWins = gameData.joiner_wins || 0
        
        // NEW: Load coin data
        if (gameData.coin) {
          this.coin = typeof gameData.coin === 'string' ? JSON.parse(gameData.coin) : gameData.coin
        }
        
        console.log('📊 Loading game from DB:', {
          creator: this.creator,
          joiner: this.joiner,
          status: gameData.status,
          creatorWins: this.creatorWins,
          joinerWins: this.joinerWins
        })
        
        // Determine current phase based on database state
        if (gameData.status === 'completed') {
          this.phase = 'game_complete'
          this.winner = gameData.winner
        } else if (gameData.status === 'active' && this.joiner) {
          this.phase = 'round_active'
          this.currentPlayer = this.creator // Default to creator's turn
        } else if (this.joiner && gameData.status === 'joined') {
          this.phase = 'ready'
          // Set current player for ready phase
          this.currentPlayer = this.creator
        } else {
          this.phase = 'waiting'
        }
        
        // Count completed rounds to determine current round
        const roundsSql = `SELECT COUNT(*) as count FROM game_rounds WHERE game_id = ?`
        return new Promise((resolve) => {
          db.get(roundsSql, [this.gameId], (err, result) => {
            if (!err && result) {
              this.currentRound = Math.min((result.count || 0) + 1, this.maxRounds)
            }
            console.log('✅ Game state loaded:', {
              gameId: this.gameId,
              phase: this.phase,
              currentRound: this.currentRound,
              creator: this.creator,
              joiner: this.joiner
            })
            resolve()
          })
        })
      }
    } catch (error) {
      console.error('❌ Error loading game from database:', error)
    }
  }
}

const activeSessions = new Map()

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('🔌 New WebSocket connection')
  
  // Add error handler
  ws.on('error', (error) => {
    console.error('❌ WebSocket client error:', error)
  })
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message)
      await handleMessage(ws, data)
    } catch (error) {
      console.error('❌ Error handling message:', error)
      // Send error back but don't crash
      try {
        ws.send(JSON.stringify({ type: 'error', error: 'Message processing failed' }))
      } catch (sendError) {
        console.error('❌ Could not send error message:', sendError)
      }
    }
  })
  
  ws.on('close', () => {
    console.log('🔌 Client disconnected')
    // Clean up from all sessions
    activeSessions.forEach(session => {
      session.removeClient(ws)
    })
  })
})

async function handleMessage(ws, data) {
  const { type, gameId } = data

  if (!gameId) {
    console.error('❌ No gameId provided')
    ws.send(JSON.stringify({ type: 'error', error: 'Game ID required' }))
    return
  }

  // Initialize game viewers if needed
  if (!gameViewers.has(gameId)) {
    gameViewers.set(gameId, new Set())
  }

  let session = activeSessions.get(gameId)
  
  if (!session) {
    session = new GameSession(gameId)
    await session.loadFromDatabase()
    activeSessions.set(gameId, session)
  }

  switch (type) {
    case 'connect_to_game':
      console.log('🔗 Connection request:', { 
        address: data.address,
        currentPhase: session.phase,
        creator: session.creator,
        joiner: session.joiner
      })
      
      // Add to viewers for join state updates
      gameViewers.get(gameId).add(ws)
      
      // If they're a player, add to game session
      if (data.address === session.creator || data.address === session.joiner) {
        session.addClient(ws, data.address)
      } else {
        // Send basic game info to non-players
        ws.send(JSON.stringify({
          type: 'game_info',
          gameId: session.gameId,
          creator: session.creator,
          joiner: session.joiner,
          phase: session.phase,
          joinInProgress: session.joinInProgress,
          joiningPlayer: session.joiningPlayer
        }))
      }
      break

    case 'start_join_process':
      console.log('🎯 Starting join process:', {
        address: data.address,
        gameId
      })
      
      const startResult = await session.startJoinProcess(data.address)
      ws.send(JSON.stringify({
        type: 'join_process_response',
        success: startResult.success,
        error: startResult.error
      }))
      break

    case 'join_game':
      console.log('🎮 Join game request:', {
        role: data.role,
        address: data.address,
        entryFeeHash: data.entryFeeHash,
        currentPhase: session.phase,
        sessionJoiner: session.joiner,
        sessionCreator: session.creator
      })
      
      if (data.role === 'joiner' && data.entryFeeHash) {
        // Check if player has already joined via smart contract
        if (session.joiner === data.address && session.phase === 'ready') {
          console.log('✅ Player already joined via smart contract, adding as client')
          session.addClient(ws, data.address)
          session.broadcastGameState()
          
          // Auto-start the game after a short delay
          setTimeout(() => {
            if (session.phase === 'ready' && session.creator && session.joiner) {
              console.log('🚀 AUTO-STARTING game - entering choosing phase WITH TIMER')
              session.startGameWithTimer()
            }
          }, 2000)
        } else {
          console.log('🎯 Completing join process')
          const joinResult = await session.completeJoinProcess(data.address, data.entryFeeHash)
          console.log('🎯 Join process result:', joinResult)
          if (joinResult.success) {
            // Now add them as a player client
            session.addClient(ws, data.address)
            console.log('✅ Joiner added as client, broadcasting game state')
            session.broadcastGameState()
          } else {
            console.log('❌ Join process failed:', joinResult.error)
            ws.send(JSON.stringify({ type: 'error', error: joinResult.error }))
          }
        }
      } else if (data.role === 'creator') {
        console.log('🎯 Creator connecting to game')
        if (!session.creator) {
          session.creator = data.address
        }
        session.addClient(ws, data.address)
        session.broadcastGameState()
      }
      break

    case 'cancel_join_process':
      console.log('❌ Cancelling join process:', {
        address: data.address,
        gameId
      })
      
      await session.cancelJoinProcess(data.address)
      break

    case 'player_choice':
      console.log('🎯 Player choice received:', {
        address: data.address,
        choice: data.choice,
        currentPhase: session.phase,
        currentPlayer: session.currentPlayer
      })
      if (session && data.address && data.choice) {
        const success = session.setPlayerChoice(data.address, data.choice)
        if (!success) {
          console.log('❌ Invalid choice attempt:', {
            address: data.address,
            choice: data.choice,
            phase: session.phase,
            currentPlayer: session.currentPlayer
          })
          ws.send(JSON.stringify({ type: 'error', error: 'Invalid choice or not your turn' }))
        }
      }
      break

    case 'start_charging':
      console.log('⚡ Start charging:', {
        address: data.address,
        currentPhase: session.phase,
        currentPlayer: session.currentPlayer
      })
      session.startCharging(data.address)
      break

    case 'stop_charging':
      console.log('⚡ Stop charging:', {
        address: data.address,
        currentPhase: session.phase,
        currentPlayer: session.currentPlayer
      })
      await session.stopCharging(data.address)
      break

    case 'chat_message':
      console.log('💬 Chat message received:', {
        gameId: data.gameId,
        address: data.address,
        name: data.name,
        message: data.message
      })
      
      // Validate message
      if (!data.message || !data.address || !data.name) {
        ws.send(JSON.stringify({ type: 'error', error: 'Invalid chat message' }))
        return
      }
      
      // Only allow players to chat
      if (data.address !== session.creator && data.address !== session.joiner) {
        ws.send(JSON.stringify({ type: 'error', error: 'Only players can chat' }))
        return
      }
      
      // Broadcast to all players in this game
      if (session) {
        const chatData = {
          type: 'chat_message',
          id: Date.now().toString(),
          gameId: data.gameId,
          address: data.address,
          name: data.name,
          message: data.message,
          timestamp: new Date().toISOString()
        }
        
        session.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            try {
              client.send(JSON.stringify(chatData))
            } catch (error) {
              console.error('❌ Error sending chat message:', error)
            }
          }
        })
      }
      break

    case 'share_profile':
      console.log('👤 Profile shared:', {
        address: data.address,
        name: data.name,
        imageUrl: data.imageUrl
      })
      
      if (session) {
        if (data.address === session.creator) {
          session.creatorProfile = {
            name: data.name,
            imageUrl: data.imageUrl,
            address: data.address
          }
        } else if (data.address === session.joiner) {
          session.joinerProfile = {
            name: data.name,
            imageUrl: data.imageUrl,
            address: data.address
          }
        }
        
        // Broadcast updated state with profiles
        session.broadcastGameState()
      }
      break

    default:
      console.warn('⚠️ Unknown message type:', type)
      ws.send(JSON.stringify({ type: 'error', error: 'Unknown message type' }))
      break
  }
  
  // Clean up viewer connection when WebSocket closes
  ws.on('close', () => {
    const viewers = gameViewers.get(gameId)
    if (viewers) {
      viewers.delete(ws)
    }
  })
}

// REST API endpoints for analytics
app.get('/api/games', async (req, res) => {
  try {
    const games = await dbHelpers.getAllGames(100)
    res.json(games)
  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({ error: 'Database error' })
  }
})

app.get('/api/games/:gameId', async (req, res) => {
  try {
    const gameId = req.params.gameId
    console.log('📊 Fetching game:', gameId)
    
    const game = await dbHelpers.getGame(gameId)
    if (game) {
      console.log('📊 Game found:', {
        id: game.id,
        creator: game.creator,
        joiner: game.joiner,
        status: game.status,
        coin: game.coin ? 'present' : 'missing'
      })
      
      if (game.coin) {
        console.log('🪙 Coin data in database:', game.coin)
        try {
          const parsedCoin = JSON.parse(game.coin)
          console.log('🪙 Parsed coin data:', parsedCoin)
        } catch (e) {
          console.warn('⚠️ Could not parse coin data:', e)
        }
      }
      
      res.json(game)
    } else {
      res.status(404).json({ error: 'Game not found' })
    }
  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({ error: 'Database error' })
  }
})

app.get('/api/stats/monthly/:year/:month', async (req, res) => {
  try {
    const stats = await dbHelpers.getMonthlyStats(req.params.year, req.params.month)
    res.json(stats)
  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({ error: 'Database error' })
  }
})

// POST endpoint to create games with NFT metadata fetching
app.post('/api/games', async (req, res) => {
  try {
    console.log('🎮 Creating game via REST API:', req.body)
    
    const { 
      id, 
      creator, 
      nft_contract, 
      nft_token_id, 
      price_usd, 
      game_type,
      coin,
      contract_game_id,
      transaction_hash,
      nft_chain = 'base'
    } = req.body

    // Use contract_game_id as the primary ID if provided
    const gameId = contract_game_id || id || uuidv4()

    // Fetch NFT metadata from cache or Alchemy
    let nftMetadata = {
      name: req.body.nft_name || 'NFT',
      image_url: req.body.nft_image || '',
      collection_name: req.body.nft_collection || 'Collection',
      description: req.body.nft_description || '',
      attributes: req.body.nft_attributes || '[]'
    }

    // Only fetch if we don't have complete metadata
    if (!req.body.nft_image || !req.body.nft_name || !req.body.nft_collection) {
      console.log('🔍 Incomplete NFT metadata, fetching from Alchemy...')
      const fetchedMetadata = await getNFTMetadataWithCache(nft_contract, nft_token_id, nft_chain)
      
      if (fetchedMetadata) {
        nftMetadata = {
          name: fetchedMetadata.name || nftMetadata.name,
          image_url: fetchedMetadata.image_url || nftMetadata.image_url,
          collection_name: fetchedMetadata.collection_name || nftMetadata.collection_name,
          description: fetchedMetadata.description || nftMetadata.description,
          attributes: fetchedMetadata.attributes || nftMetadata.attributes
        }
      }
    }

    const query = `
      INSERT INTO games (
        id, creator, nft_contract, nft_token_id, nft_name, nft_image, nft_collection, nft_chain,
        nft_description, nft_attributes, price_usd, rounds, coin, status, created_at, 
        contract_game_id, transaction_hash
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)
    `

    db.run(query, [
      gameId,
      creator,
      nft_contract,
      nft_token_id,
      nftMetadata.name,
      nftMetadata.image_url,
      nftMetadata.collection_name,
      nft_chain,
      nftMetadata.description,
      nftMetadata.attributes,
      price_usd,
      5, // default rounds
      JSON.stringify(coin),
      'waiting',
      contract_game_id,
      transaction_hash
    ], function(err) {
      if (err) {
        console.error('❌ Database error creating game:', err)
        res.status(500).json({ error: 'Failed to create game', details: err.message })
      } else {
        console.log('✅ Game created in database with ID:', gameId)
        console.log('✅ NFT metadata stored:', nftMetadata)
        res.json({ 
          id: gameId, 
          success: true,
          contract_game_id: contract_game_id,
          nft: {
            name: nftMetadata.name,
            image: nftMetadata.image_url,
            collection: nftMetadata.collection_name
          }
        })
      }
    })
    
  } catch (error) {
    console.error('❌ Error creating game:', error)
    res.status(500).json({ error: 'Failed to create game', details: error.message })
  }
})

// Add PATCH endpoint for updating games
app.patch('/api/games/:id', (req, res) => {
  const gameId = req.params.id
  const updates = req.body
  
  // Build dynamic update query
  const updateFields = []
  const values = []
  
  Object.keys(updates).forEach(key => {
    if (key !== 'id') {
      updateFields.push(`${key} = ?`)
      values.push(updates[key])
    }
  })
  
  if (updateFields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' })
  }
  
  values.push(gameId)
  const query = `UPDATE games SET ${updateFields.join(', ')} WHERE id = ?`
  
  db.run(query, values, function(err) {
    if (err) {
      console.error('Error updating game:', err)
      res.status(500).json({ error: 'Failed to update game' })
    } else {
      res.json({ success: true, changes: this.changes })
    }
  })
})

// Claim a player slot (prevents race conditions)
app.post('/api/games/:gameId/claim-slot', async (req, res) => {
  try {
    const { gameId } = req.params
    const { playerAddress } = req.body
    
    console.log('🎯 Claiming slot for game:', { gameId, playerAddress })
    
    // Get current game state
    const game = await dbHelpers.getGame(gameId)
    if (!game) {
      return res.status(404).json({ error: 'Game not found' })
    }
    
    // Check if slot is available
    if (game.joiner) {
      return res.status(400).json({ error: 'Game already has a second player' })
    }
    
    if (game.creator === playerAddress) {
      return res.status(400).json({ error: 'Creator cannot join their own game' })
    }
    
    if (game.status !== 'waiting') {
      return res.status(400).json({ error: 'Game is not accepting new players' })
    }
    
    // Temporarily reserve the slot (we'll use a special status)
    await dbHelpers.updateGame(gameId, { 
      status: 'claiming',
      joiner: playerAddress // Temporarily set joiner
    })
    
    console.log('✅ Slot claimed successfully:', gameId)
    res.json({ success: true, gameId })
    
  } catch (error) {
    console.error('❌ Error claiming slot:', error)
    res.status(500).json({ error: 'Failed to claim slot', details: error.message })
  }
})

// Release a claimed slot (if payment fails)
app.post('/api/games/:gameId/release-slot', async (req, res) => {
  try {
    const { gameId } = req.params
    const { playerAddress } = req.body
    
    console.log('🔓 Releasing slot for game:', { gameId, playerAddress })
    
    // Get current game state
    const game = await dbHelpers.getGame(gameId)
    if (!game) {
      return res.status(404).json({ error: 'Game not found' })
    }
    
    // More flexible release conditions
    if (game.joiner === playerAddress && (game.status === 'claiming' || game.status === 'waiting')) {
      await dbHelpers.updateGame(gameId, { 
        status: 'waiting',
        joiner: null // Clear the joiner
      })
      
      console.log('✅ Slot released successfully:', gameId)
      res.json({ success: true, gameId })
    } else if (game.status === 'waiting' && !game.joiner) {
      // Slot was already released or never claimed
      console.log('ℹ️ Slot was already available:', gameId)
      res.json({ success: true, gameId, message: 'Slot was already available' })
    } else {
      console.log('⚠️ Cannot release slot:', { 
        gameJoiner: game.joiner, 
        requestPlayer: playerAddress, 
        gameStatus: game.status 
      })
      res.status(400).json({ 
        error: 'Cannot release slot',
        debug: {
          gameJoiner: game.joiner,
          requestPlayer: playerAddress,
          gameStatus: game.status
        }
      })
    }
    
  } catch (error) {
    console.error('❌ Error releasing slot:', error)
    res.status(500).json({ error: 'Failed to release slot', details: error.message })
  }
})

// Update the existing join endpoint to handle the new flow
app.post('/api/games/:gameId/join', async (req, res) => {
  try {
    const { gameId } = req.params
    const { joinerAddress, paymentTxHash, paymentAmount } = req.body
    
    console.log('🎮 Completing join for game:', {
      gameId,
      joinerAddress,
      paymentTxHash,
      paymentAmount
    })
    
    // Validate input
    if (!joinerAddress || !paymentTxHash) {
      return res.status(400).json({ error: 'Missing required fields: joinerAddress, paymentTxHash' })
    }
    
    // Get current game state
    const game = await dbHelpers.getGame(gameId)
    if (!game) {
      console.error('❌ Game not found:', gameId)
      return res.status(404).json({ error: 'Game not found' })
    }
    
    console.log('🎮 Current game state:', {
      status: game.status,
      joiner: game.joiner,
      creator: game.creator
    })
    
    // Handle different game states
    if (game.status === 'claiming' && game.joiner === joinerAddress) {
      // Complete the join with payment (existing flow)
      const updates = {
        status: 'joined',
        entry_fee_hash: paymentTxHash
      }
      
      await dbHelpers.updateGame(gameId, updates)
      console.log('✅ Join completed (claiming flow):', gameId)
      
    } else if (game.status === 'waiting' && !game.joiner) {
      // Direct join (new flow)
      if (game.creator === joinerAddress) {
        return res.status(400).json({ error: 'Creator cannot join their own game' })
      }
      
      const updates = {
        joiner: joinerAddress,
        status: 'joined',
        entry_fee_hash: paymentTxHash
      }
      
      await dbHelpers.updateGame(gameId, updates)
      console.log('✅ Join completed (direct flow):', gameId)
      
    } else {
      console.error('❌ Invalid join state:', {
        status: game.status,
        joiner: game.joiner,
        joinerAddress,
        creator: game.creator
      })
      return res.status(400).json({ error: 'Game is not available for joining' })
    }
    
    // Record the payment transaction
    if (paymentAmount) {
      await dbHelpers.recordTransaction(
        gameId,
        joinerAddress,
        'entry_fee',
        paymentAmount,
        paymentAmount / 2500, // Approximate ETH amount
        paymentTxHash
      )
    }
    
    // Update session if exists
    const session = activeSessions.get(gameId)
    if (session) {
      await session.completeJoinProcess(joinerAddress, paymentTxHash)
    }
    
    console.log('✅ Join completed successfully:', gameId)
    res.json({ success: true, gameId })
    
  } catch (error) {
    console.error('❌ Error completing join:', error)
    res.status(500).json({ error: 'Failed to complete join', details: error.message })
  }
})

// Simple join endpoint - just updates database
app.post('/api/games/:gameId/simple-join', async (req, res) => {
  try {
    const { gameId } = req.params
    const { joinerAddress, paymentTxHash, paymentAmount } = req.body
    
    console.log('🎮 Simple join for game:', {
      gameId,
      joinerAddress,
      paymentTxHash,
      paymentAmount
    })
    
    // Get current game state
    const game = await dbHelpers.getGame(gameId)
    if (!game) {
      return res.status(404).json({ error: 'Game not found' })
    }
    
    // Basic validation
    if (game.joiner) {
      return res.status(400).json({ error: 'Game already has a second player' })
    }
    
    if (game.creator === joinerAddress) {
      return res.status(400).json({ error: 'Creator cannot join their own game' })
    }
    
    if (game.status !== 'waiting') {
      return res.status(400).json({ error: 'Game is not accepting new players' })
    }
    
    // Update database
    const updates = {
      joiner: joinerAddress,
      status: 'joined',
      entry_fee_hash: paymentTxHash
    }
    
    await dbHelpers.updateGame(gameId, updates)
    
    // Record the payment transaction
    await dbHelpers.recordTransaction(
      gameId,
      joinerAddress,
      'entry_fee',
      paymentAmount,
      paymentAmount / 2500, // Approximate ETH amount
      paymentTxHash
    )
    
    console.log('✅ Simple join completed successfully:', gameId)
    res.json({ success: true, gameId })
    
  } catch (error) {
    console.error('❌ Error in simple join:', error)
    res.status(500).json({ error: 'Failed to join game', details: error.message })
  }
})

// Cleanup inactive sessions
setInterval(() => {
  const now = Date.now()
  const timeout = 5 * 60 * 1000

  activeSessions.forEach((session, gameId) => {
    if (now - session.lastActionTime > timeout && session.clients.size === 0) {
      console.log('🧹 Cleaning up inactive session:', gameId)
      activeSessions.delete(gameId)
    }
  })
}, 60000)

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down server...')
  db.close((err) => {
    if (err) {
      console.error('❌ Error closing database:', err)
    } else {
      console.log('✅ Database closed')
    }
    process.exit(0)
  })
})

// Start background ETH price updates
setInterval(async () => {
  try {
    await updateEthPrice()
  } catch (error) {
    console.error('❌ Background ETH price update failed:', error)
  }
}, ETH_PRICE_CACHE_DURATION)

// Update ETH price on startup
setTimeout(async () => {
  try {
    await updateEthPrice()
    console.log('💰 Initial ETH price fetched:', cachedEthPrice)
  } catch (error) {
    console.error('❌ Initial ETH price fetch failed:', error)
  }
}, 5000)

const PORT = process.env.PORT || 3001
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WebSocket server with SQLite running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`)
  console.log(`🎮 Games API: http://localhost:${PORT}/api/games`)
  console.log(`💰 ETH price API: http://localhost:${PORT}/api/eth-price`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`)
  console.log(`🔗 Server listening on 0.0.0.0:${PORT}`)
  console.log(`💰 ETH price updates every ${ETH_PRICE_CACHE_DURATION / 1000} seconds`)
  
  if (process.env.NODE_ENV === 'production') {
    console.log(`🚀 Production server ready at https://cryptoflipz2-production.up.railway.app`)
    console.log(`📄 Frontend served from static files`)
  }
})

// Background job to fetch missing NFT metadata
const runMetadataBackgroundJob = async () => {
  try {
    console.log('🔄 Running NFT metadata background job...')
    
    // Find games with missing NFT data
    const gamesWithMissingData = await new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM games 
         WHERE (nft_image IS NULL OR nft_image = '' OR nft_image = '/placeholder-nft.svg')
         AND nft_contract IS NOT NULL 
         AND nft_token_id IS NOT NULL
         LIMIT 10`,
        (err, rows) => {
          if (err) reject(err)
          else resolve(rows || [])
        }
      )
    })
    
    console.log(`📊 Found ${gamesWithMissingData.length} games with missing NFT metadata`)
    
    for (const game of gamesWithMissingData) {
      try {
        const metadata = await getNFTMetadataWithCache(
          game.nft_contract,
          game.nft_token_id,
          game.nft_chain || 'base'
        )
        
        if (metadata && metadata.image_url) {
          await dbHelpers.updateGame(game.id, {
            nft_name: metadata.name,
            nft_image: metadata.image_url,
            nft_collection: metadata.collection_name,
            nft_description: metadata.description,
            nft_attributes: metadata.attributes
          })
          console.log(`✅ Updated metadata for game ${game.id}`)
        }
        
        // Rate limit protection
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        console.error(`❌ Error updating game ${game.id}:`, error)
      }
    }
    
  } catch (error) {
    console.error('❌ Background job error:', error)
  }
}

// Run background job every 5 minutes
setInterval(runMetadataBackgroundJob, 5 * 60 * 1000)

// Run once on startup after a delay
setTimeout(runMetadataBackgroundJob, 10000)

// ==============================================
// ADMIN API ROUTES
// ==============================================

// Admin API Routes (add authentication middleware in production)
app.get('/api/admin/games', async (req, res) => {
  try {
    const games = await new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM games 
        ORDER BY created_at DESC 
        LIMIT 100
      `, (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
    
    // Calculate stats
    const stats = {
      totalGames: games.length,
      activeGames: games.filter(g => g.status === 'active').length,
      waitingGames: games.filter(g => g.status === 'waiting').length,
      completedGames: games.filter(g => g.status === 'completed').length,
      totalVolume: games.reduce((sum, g) => sum + (g.price_usd || 0), 0)
    }
    
    res.json({ games, stats })
  } catch (error) {
    console.error('Admin API error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Cancel game endpoint
app.put('/api/admin/games/:gameId/cancel', async (req, res) => {
  try {
    const { gameId } = req.params
    
    db.run(
      `UPDATE games SET status = 'cancelled' WHERE id = ?`,
      [gameId],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message })
        } else {
          res.json({ success: true, gameId })
        }
      }
    )
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update game status
app.patch('/api/admin/games/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params
    const updates = req.body
    
    const fields = []
    const values = []
    
    if (updates.status) {
      fields.push('status = ?')
      values.push(updates.status)
    }
    
    if (updates.winner) {
      fields.push('winner = ?')
      values.push(updates.winner)
    }
    
    values.push(gameId)
    
    db.run(
      `UPDATE games SET ${fields.join(', ')} WHERE id = ?`,
      values,
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message })
        } else {
          res.json({ success: true, changes: this.changes })
        }
      }
    )
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Pause all games endpoint
app.post('/api/admin/pause-all', async (req, res) => {
  try {
    db.run(
      `UPDATE games SET status = 'paused' WHERE status = 'waiting'`,
      [],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message })
        } else {
          res.json({ success: true, pausedCount: this.changes })
        }
      }
    )
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ==============================================
// DATABASE ADMIN ENDPOINTS - Add to server.js
// ==============================================

// 1. VIEW ALL GAMES - See complete database (legacy endpoint)
app.get('/api/admin/games-legacy', async (req, res) => {
  try {
    const games = await dbHelpers.getAllGames(100)
    res.json({
      total: games.length,
      games: games.map(game => ({
        id: game.id,
        creator: game.creator,
        joiner: game.joiner,
        nft_name: game.nft_name,
        nft_collection: game.nft_collection,
        price_usd: game.price_usd,
        status: game.status,
        created_at: game.created_at,
        creator_wins: game.creator_wins,
        joiner_wins: game.joiner_wins
      }))
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 2. DELETE GAME - Remove specific game
app.delete('/api/admin/games/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params
    
    // Delete from database
    const sql = `DELETE FROM games WHERE id = ?`
    db.run(sql, [gameId], function(err) {
      if (err) {
        console.error('❌ Error deleting game:', err)
        res.status(500).json({ error: 'Failed to delete game' })
      } else {
        console.log('✅ Game deleted:', gameId, 'Changes:', this.changes)
        res.json({ 
          success: true, 
          deletedId: gameId,
          changes: this.changes 
        })
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 3. CLEAR ALL GAMES - Reset database completely
app.delete('/api/admin/games', async (req, res) => {
  try {
    console.log('🧹 Clearing all games from database')
    
    // Delete all games
    const sql = `DELETE FROM games`
    db.run(sql, [], function(err) {
      if (err) {
        console.error('❌ Error clearing games:', err)
        res.status(500).json({ error: 'Failed to clear games' })
      } else {
        console.log('✅ All games cleared. Changes:', this.changes)
        res.json({ 
          success: true, 
          message: 'All games deleted',
          deletedCount: this.changes 
        })
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 4. UPDATE GAME STATUS - Fix stuck games
app.patch('/api/admin/games/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params
    const { status, joiner, creator_wins, joiner_wins } = req.body
    
    const updates = {}
    if (status) updates.status = status
    if (joiner !== undefined) updates.joiner = joiner
    if (creator_wins !== undefined) updates.creator_wins = creator_wins
    if (joiner_wins !== undefined) updates.joiner_wins = joiner_wins
    
    const result = await dbHelpers.updateGame(gameId, updates)
    
    res.json({ 
      success: true, 
      gameId,
      updates,
      changes: result 
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 5. DELIST GAME - Creator can cancel their own game
app.post('/api/games/:gameId/delist', async (req, res) => {
  try {
    const { gameId } = req.params
    const { creatorAddress } = req.body
    
    console.log('🗑️ Delisting game:', { gameId, creatorAddress })
    
    // Get game to verify creator
    const game = await dbHelpers.getGame(gameId)
    if (!game) {
      return res.status(404).json({ error: 'Game not found' })
    }
    
    // Verify creator
    if (game.creator !== creatorAddress) {
      return res.status(403).json({ error: 'Only creator can delist game' })
    }
    
    // Can only delist if no joiner or if waiting
    if (game.joiner && game.status !== 'waiting') {
      return res.status(400).json({ error: 'Cannot delist game with active players' })
    }
    
    // Update status to cancelled
    await dbHelpers.updateGame(gameId, { 
      status: 'cancelled',
      completed_at: new Date().toISOString()
    })
    
    console.log('✅ Game delisted successfully:', gameId)
    res.json({ success: true, gameId })
    
  } catch (error) {
    console.error('❌ Error delisting game:', error)
    res.status(500).json({ error: 'Failed to delist game', details: error.message })
  }
})

// 6. GET GAMES BY CREATOR - See your own games
app.get('/api/games/creator/:address', async (req, res) => {
  try {
    const { address } = req.params
    
    const sql = `SELECT * FROM games WHERE creator = ? ORDER BY created_at DESC`
    db.all(sql, [address], (err, rows) => {
      if (err) {
        console.error('❌ Error getting creator games:', err)
        res.status(500).json({ error: 'Database error' })
      } else {
        res.json(rows)
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get enhanced NFT data
app.get('/api/games/:gameId/nft', async (req, res) => {
  try {
    const { gameId } = req.params
    console.log('🎨 NFT data requested for game:', gameId)
    const game = await dbHelpers.getGame(gameId)
    
    if (!game) {
      console.log('❌ Game not found:', gameId)
      return res.status(404).json({ error: 'Game not found' })
    }
    
    // Return comprehensive NFT data
    const nftData = {
      contractAddress: game.nft_contract,
      tokenId: game.nft_token_id,
      name: game.nft_name,
      image: game.nft_image,
      collection: game.nft_collection,
      chain: game.nft_chain,
      tokenType: game.nft_token_type,
      metadata: {
        description: game.nft_description,
        attributes: game.nft_attributes, // Already parsed in getGame
        externalUrl: game.nft_external_url,
        animationUrl: game.nft_animation_url
      }
    }
    
    console.log('✅ Returning NFT data:', nftData)
    res.json(nftData)
  } catch (error) {
    console.error('❌ NFT API Error:', error)
    res.status(500).json({ error: 'Failed to get NFT data' })
  }
})

// Update game with NFT metadata - enhanced version
app.post('/api/games/:gameId/update-nft-metadata', async (req, res) => {
  try {
    const { gameId } = req.params
    console.log('🔄 Updating NFT metadata for game:', gameId)
    
    const game = await dbHelpers.getGame(gameId)
    if (!game) {
      return res.status(404).json({ error: 'Game not found' })
    }
    
    // Force fetch fresh metadata
    const nftMetadata = await getNFTMetadataWithCache(
      game.nft_contract, 
      game.nft_token_id, 
      game.nft_chain || 'base'
    )
    
    if (!nftMetadata || !nftMetadata.image_url) {
      return res.status(404).json({ error: 'Could not fetch NFT metadata' })
    }
    
    // Update the game with new metadata
    const updateQuery = `
      UPDATE games 
      SET nft_name = ?, nft_image = ?, nft_collection = ?, nft_description = ?, nft_attributes = ?
      WHERE id = ?
    `
    
    db.run(updateQuery, [
      nftMetadata.name,
      nftMetadata.image_url,
      nftMetadata.collection_name,
      nftMetadata.description,
      nftMetadata.attributes,
      gameId
    ], function(err) {
      if (err) {
        console.error('❌ Error updating NFT metadata:', err)
        res.status(500).json({ error: 'Failed to update NFT metadata' })
      } else {
        console.log('✅ Updated NFT metadata for game:', gameId)
        res.json({ 
          success: true, 
          message: 'NFT metadata updated successfully',
          nft: {
            name: nftMetadata.name,
            image: nftMetadata.image_url,
            collection: nftMetadata.collection_name
          }
        })
      }
    })
    
  } catch (error) {
    console.error('❌ Error updating NFT metadata:', error)
    res.status(500).json({ error: 'Failed to update NFT metadata' })
  }
})

// Add NFT validation endpoint for enhanced security
app.post('/api/nft/validate', async (req, res) => {
  try {
    const { contractAddress, tokenId, chain } = req.body
    
    // Here you could add additional validation logic:
    // 1. Check if contract exists on blockchain
    // 2. Verify token exists
    // 3. Check if it's a valid NFT contract
    // 4. Verify ownership (optional)
    
    // For now, basic validation
    if (!contractAddress || !tokenId || !chain) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    
    // Return validation result
    res.json({
      isValid: true,
      message: 'NFT validation successful',
      details: {
        contractAddress,
        tokenId,
        chain,
        validatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({ error: 'Failed to validate NFT' })
  }
})

// Enhanced join endpoint with race condition protection
app.post('/api/games/:gameId/start-join', async (req, res) => {
  try {
    const { gameId } = req.params
    const { playerAddress } = req.body
    
    console.log('🎯 Starting join process for game:', { gameId, playerAddress })
    
    // Get or create session
    let session = activeSessions.get(gameId)
    if (!session) {
      session = new GameSession(gameId)
      await session.loadFromDatabase()
      activeSessions.set(gameId, session)
    }
    
    const result = await session.startJoinProcess(playerAddress)
    
    if (result.success) {
      // Set a timeout to auto-cancel if not completed
      setTimeout(async () => {
        await session.cancelJoinProcess(playerAddress)
      }, 60000) // 1 minute timeout
      
      res.json({ success: true, gameId })
    } else {
      res.status(400).json({ error: result.error })
    }
    
  } catch (error) {
    console.error('❌ Error starting join process:', error)
    res.status(500).json({ error: 'Failed to start join process', details: error.message })
  }
})

// Simple join endpoint - now works with the join process
app.post('/api/games/:gameId/simple-join', async (req, res) => {
  try {
    const { gameId } = req.params
    const { joinerAddress, paymentTxHash, paymentAmount } = req.body
    
    console.log('🎮 Completing join for game:', {
      gameId,
      joinerAddress,
      paymentTxHash,
      paymentAmount
    })
    
    // Validate input
    if (!joinerAddress || !paymentTxHash) {
      return res.status(400).json({ error: 'Missing required fields: joinerAddress, paymentTxHash' })
    }
    
    // Get current game state
    const game = await dbHelpers.getGame(gameId)
    if (!game) {
      console.error('❌ Game not found:', gameId)
      return res.status(404).json({ error: 'Game not found' })
    }
    
    // Check if game is available for joining
    if (game.status !== 'waiting') {
      console.error('❌ Game not available for joining:', { gameId, status: game.status })
      return res.status(400).json({ error: 'Game is not available for joining' })
    }
    
    if (game.joiner) {
      console.error('❌ Game already has a joiner:', { gameId, joiner: game.joiner })
      return res.status(400).json({ error: 'Game already has a second player' })
    }
    
    // Update database first
    const updates = {
      joiner: joinerAddress,
      status: 'joined',
      entry_fee_hash: paymentTxHash
    }
    
    console.log('💾 Updating database with:', updates)
    const updateResult = await dbHelpers.updateGame(gameId, updates)
    console.log('✅ Database update result:', updateResult)
    
    // Record the payment transaction
    if (paymentAmount) {
      console.log('💰 Recording transaction:', { paymentAmount, paymentTxHash })
      await dbHelpers.recordTransaction(
        gameId,
        joinerAddress,
        'entry_fee',
        paymentAmount,
        paymentAmount / 2500, // Approximate ETH amount
        paymentTxHash
      )
    }
    
    // Update session if exists
    const session = activeSessions.get(gameId)
    if (session) {
      console.log('🔄 Updating active session')
      await session.completeJoinProcess(joinerAddress, paymentTxHash)
    } else {
      console.log('⚠️ No active session found for game:', gameId)
    }
    
    console.log('✅ Join completed successfully:', gameId)
    res.json({ success: true, gameId })
    
  } catch (error) {
    console.error('❌ Error in simple join:', error)
    res.status(500).json({ error: 'Failed to join game', details: error.message })
  }
})

// Get join status endpoint
app.get('/api/games/:gameId/join-status', async (req, res) => {
  try {
    const { gameId } = req.params
    
    const session = activeSessions.get(gameId)
    if (session) {
      res.json({
        joinInProgress: session.joinInProgress,
        joiningPlayer: session.joiningPlayer,
        joiner: session.joiner,
        phase: session.phase
      })
    } else {
      // Get from database
      const game = await dbHelpers.getGame(gameId)
      if (game) {
        res.json({
          joinInProgress: false,
          joiningPlayer: null,
          joiner: game.joiner,
          phase: game.status === 'waiting' ? 'waiting' : game.status
        })
      } else {
        res.status(404).json({ error: 'Game not found' })
      }
    }
  } catch (error) {
    console.error('❌ Error getting join status:', error)
    res.status(500).json({ error: 'Failed to get join status' })
  }
})