const express = require('express')
const http = require('http')
const WebSocket = require('ws')
const cors = require('cors')
const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')

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
app.use(express.json())

// Database setup with Railway environment variable
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'games.db')
console.log('🗄️ Database path:', dbPath)

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

// API routes (before static files)
app.get('/api/test', (req, res) => {
  console.log('🔧 API test route hit!')
  res.json({ message: 'API is working!' })
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
        completed_at DATETIME,
        total_spectators INTEGER DEFAULT 0
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      started_at DATETIME,
      completed_at DATETIME,
      total_spectators INTEGER DEFAULT 0
    )`, (err) => {
      if (err) {
        console.error('❌ Error creating games table:', err)
      } else {
        console.log('✅ Games table ready')
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
        price_usd, rounds, listing_fee_eth, listing_fee_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      
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
        gameData.listingFee?.transactionHash
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

class GameSession {
  constructor(gameId) {
    console.log('🎮 Creating new GameSession:', gameId)
    this.gameId = gameId
    this.creator = null
    this.joiner = null
    this.phase = 'waiting'
    this.currentRound = 1
    this.maxRounds = 5
    this.creatorWins = 0
    this.joinerWins = 0
    this.winner = null
    
    // Simple power system
    this.creatorPower = 0
    this.joinerPower = 0
    this.chargingPlayer = null
    this.currentPlayer = null
    
    // Player choices for each round
    this.creatorChoice = null
    this.joinerChoice = null
    
    // Control flags
    this.isFlipInProgress = false
    this.gameData = null
    this.clients = new Set()
    this.lastActionTime = Date.now()
    this.roundCompleted = false
    this.syncedFlip = null
    
    // Timer system
    this.turnTimer = null
    this.turnTimeLeft = 20 // 20 seconds per turn
    this.remainingTimeForPower = 0 // Track remaining time for power phase
    
    console.log('✅ GameSession created:', {
      gameId,
      phase: this.phase,
      creator: this.creator,
      joiner: this.joiner,
      currentPlayer: this.currentPlayer
    })
  }

  addClient(ws) {
    console.log('🔌 Adding client to game:', {
      gameId: this.gameId,
      currentClients: this.clients.size,
      phase: this.phase
    })
    this.clients.add(ws)
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
      spectators: this.clients.size,
      creatorChoice: this.creatorChoice,
      joinerChoice: this.joinerChoice,
      turnTimeLeft: this.turnTimeLeft,
      remainingTimeForPower: this.remainingTimeForPower
    }

    console.log('📢 Broadcasting game state:', {
      gameId: this.gameId,
      phase: this.phase,
      currentPlayer: this.currentPlayer,
      creatorChoice: this.creatorChoice,
      joinerChoice: this.joinerChoice,
      clients: this.clients.size
    })

    // Safely broadcast to all clients
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

  async setGameData(data) {
    this.gameData = data
    this.creator = data.creator
    this.maxRounds = data.rounds
    try {
      await dbHelpers.createGame(data)
    } catch (error) {
      console.error('Error saving game:', error)
    }
    this.broadcastGameState()
  }

  async setJoiner(address, entryFeeHash) {
    console.log('🎮 setJoiner called:', { 
      address, 
      currentPhase: this.phase,
      creator: this.creator,
      joiner: this.joiner
    })
    
    // Only set if not already set
    if (this.joiner) {
      console.log('⚠️ Joiner already set:', this.joiner)
      this.broadcastGameState()
      return
    }
    
    this.joiner = address
    this.phase = 'ready'
    
    console.log('✅ Player 2 joined via WebSocket:', address)
    console.log('🔄 Game state after join:', { 
      phase: this.phase,
      creator: this.creator,
      joiner: this.joiner,
      currentPlayer: this.currentPlayer
    })
    
    this.broadcastGameState()
    
    // Auto-start the choosing phase after 2 seconds
    console.log('⏰ Setting up auto-start timer...')
    setTimeout(() => {
      console.log('⏰ Auto-start timer fired:', {
        currentPhase: this.phase,
        hasCreator: !!this.creator,
        hasJoiner: !!this.joiner
      })
      if (this.phase === 'ready' && this.creator && this.joiner) {
        console.log('🚀 AUTO-STARTING game - entering choosing phase')
        this.startGame()
      } else {
        console.log('⚠️ Auto-start conditions not met:', {
          phase: this.phase,
          creator: this.creator,
          joiner: this.joiner
        })
      }
    }, 2000)
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
    
    this.phase = 'choosing'
    this.currentPlayer = this.creator  // Player 1 chooses first
    this.currentRound = 1
    this.resetPowers()
    this.resetChoices()
    
    // Start the timer immediately
    this.startTurnTimer()
    
    console.log('✅ Game started:', {
      newPhase: this.phase,
      currentPlayer: this.currentPlayer,
      currentRound: this.currentRound,
      creatorChoice: this.creatorChoice,
      joinerChoice: this.joinerChoice
    })
    
    try {
      await dbHelpers.updateGame(this.gameId, { 
        status: 'active',
        started_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error updating game start:', error)
    }
    
    console.log('🎯 Game started - Player 1 should choose heads or tails')
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
    this.remainingTimeForPower = this.turnTimeLeft // Save remaining time for power phase
    console.log('🔄 Moving to round_active phase after choice')
    
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
    this.remainingTimeForPower = 0 // Reset power time
    
    // Start the timer
    this.turnTimer = setInterval(() => {
      this.turnTimeLeft--
      
      // Broadcast time remaining
      this.broadcastGameState()
      
      // If time runs out, handle based on phase
      if (this.turnTimeLeft <= 0) {
        clearInterval(this.turnTimer)
        this.turnTimer = null
        
        if (this.phase === 'choosing') {
          // Auto-select heads or tails
          this.autoSelectChoice()
        } else if (this.phase === 'round_active') {
          // Auto-flip at current power
          this.autoFlip()
        }
      }
    }, 1000)
  }

  async autoSelectChoice() {
    console.log('🎲 Auto-selecting choice for:', this.currentPlayer)
    
    // Randomly select heads or tails
    const choice = Math.random() < 0.5 ? 'heads' : 'tails'
    
    // Set the choice
    if (this.currentPlayer === this.creator) {
      this.creatorChoice = choice
    } else {
      this.joinerChoice = choice
    }
    
    console.log('✅ Auto-selected:', choice, 'for', this.currentPlayer)
    
    // Move to power charging phase
    this.phase = 'round_active'
    this.remainingTimeForPower = 0 // No time left for power charging
    this.broadcastGameState()
    
    // Auto-flip immediately since no time left
    this.autoFlip()
  }

  async autoFlip() {
    console.log('⚡ Auto-flipping at current power for:', this.currentPlayer)
    
    // Set current power
    if (this.currentPlayer === this.creator) {
      this.creatorPower = 10
    } else {
      this.joinerPower = 10
    }
    
    // Execute the flip
    await this.executeFlip(this.currentPlayer, 10)
  }

  startCharging(address) {
    console.log('⚡ startCharging called:', {
      address,
      currentPlayer: this.currentPlayer,
      phase: this.phase
    })

    if (this.phase !== 'round_active' || address !== this.currentPlayer) {
      console.log('❌ Cannot start charging:', { 
        phase: this.phase, 
        currentPlayer: this.currentPlayer, 
        address 
      })
      return
    }

    this.chargingPlayer = address
    console.log('✅ Started charging for:', address)
    
    // Start power increase
    this.powerInterval = setInterval(() => {
      if (this.chargingPlayer === this.creator) {
        this.creatorPower = Math.min(10, this.creatorPower + 0.1)
      } else {
        this.joinerPower = Math.min(10, this.joinerPower + 0.1)
      }
      this.broadcastGameState()
    }, 100)
  }

  stopCharging(address) {
    console.log('🛑 stopCharging called:', {
      address,
      currentPlayer: this.currentPlayer,
      phase: this.phase,
      chargingPlayer: this.chargingPlayer
    })

    if (this.phase !== 'round_active' || address !== this.currentPlayer || address !== this.chargingPlayer) {
      console.log('❌ Cannot stop charging:', { 
        phase: this.phase, 
        currentPlayer: this.currentPlayer, 
        address,
        chargingPlayer: this.chargingPlayer
      })
      return
    }

    // Clear the power increase interval
    if (this.powerInterval) {
      clearInterval(this.powerInterval)
      this.powerInterval = null
    }

    this.chargingPlayer = null
    console.log('✅ Stopped charging for:', address)
    
    // Execute the flip immediately with current power
    const power = address === this.creator ? this.creatorPower : this.joinerPower
    console.log('🎯 Executing flip with power:', power)
    
    // Execute flip synchronously
    this.executeFlip(address, power).catch(error => {
      console.error('❌ Error executing flip:', error)
    })
  }

  async executeFlip(address, power) {
    if (this.isFlipInProgress) {
      console.log('⚠️ Flip already in progress')
      return
    }

    this.isFlipInProgress = true
    console.log('🎯 Starting flip execution for:', address, 'with power:', power)

    try {
      // Generate flip result
      const result = Math.random() < 0.5 ? 'heads' : 'tails'
      console.log('🎲 Flip result:', result)

      // Get player's choice
      const playerChoice = address === this.creator ? this.creatorChoice : this.joinerChoice
      console.log('🎯 Player choice:', playerChoice)

      // Determine if player won
      const isWin = result === playerChoice
      console.log('🏆 Player won:', isWin)

      // Update scores
      if (isWin) {
        if (address === this.creator) {
          this.creatorWins++
        } else {
          this.joinerWins++
        }
      }

      // Broadcast flip result
      this.syncedFlip = {
        result,
        power,
        isWin,
        player: address
      }
      this.broadcastGameState()

      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Check for game end
      if (this.currentRound >= this.maxRounds) {
        this.endGame()
      } else {
        // Prepare next round
        this.prepareNextRound()
      }

    } catch (error) {
      console.error('❌ Error in executeFlip:', error)
    } finally {
      this.isFlipInProgress = false
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
      
      // Start the timer immediately for choosing phase
      this.startTurnTimer()
      
      // Check if this is the final round (round 5)
      if (this.currentRound === 5) {
        console.log('🏆 Final round - auto-selecting and flipping')
        this.autoSelectChoice()
      }
      
      console.log('✅ Next round ready:', {
        newRound: this.currentRound,
        newCurrentPlayer: this.currentPlayer,
        phase: this.phase,
        creatorChoice: this.creatorChoice,
        joinerChoice: this.joinerChoice
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

  console.log('📡 Received message:', { type, gameId, data })

  let session = activeSessions.get(gameId)
  if (!session && (type === 'connect_to_game' || type === 'join_game')) {
    console.log('🎮 Creating new game session:', gameId)
    session = new GameSession(gameId)
    activeSessions.set(gameId, session)
    
    // Load existing game data
    try {
      const gameData = await dbHelpers.getGame(gameId)
      if (gameData) {
        console.log('📂 Loading existing game data:', gameData)
        await session.loadFromDatabase()
      }
    } catch (error) {
      console.error('Error loading game data:', error)
    }
  }

  if (!session) {
    console.error('❌ No session found for game:', gameId)
    ws.send(JSON.stringify({ type: 'error', error: 'Game session not found' }))
    return
  }

  session.addClient(ws)

  switch (type) {
    case 'connect_to_game':
      console.log('🔗 Player connected:', { 
        address: data.address,
        currentPhase: session.phase,
        creator: session.creator,
        joiner: session.joiner
      })
      // Session automatically broadcasts state when client is added
      break

    case 'join_game':
      console.log('🎮 Join game request:', {
        role: data.role,
        address: data.address,
        entryFeeHash: data.entryFeeHash,
        currentPhase: session.phase
      })
      
      if (data.role === 'joiner' && data.entryFeeHash) {
        console.log('🎯 Player 2 joining game')
        await session.setJoiner(data.address, data.entryFeeHash)
      } else if (data.role === 'creator') {
        console.log('🎯 Creator connecting to game')
        if (!session.creator) {
          session.creator = data.address
        }
        session.broadcastGameState()
      } else {
        console.log('👀 Spectator viewing:', data.address)
        session.broadcastGameState()
      }
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

    default:
      console.warn('⚠️ Unknown message type:', type)
      ws.send(JSON.stringify({ type: 'error', error: 'Unknown message type' }))
      break
  }
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
    const game = await dbHelpers.getGame(req.params.gameId)
    if (game) {
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

// POST endpoint to create games
app.post('/api/games', async (req, res) => {
  try {
    console.log('🎮 Creating game via REST API:', req.body)
    
    const gameData = req.body
    await dbHelpers.createGame(gameData)
    
    console.log('✅ Game created successfully:', gameData.id)
    res.json({ success: true, gameId: gameData.id })
    
  } catch (error) {
    console.error('❌ Error creating game:', error)
    res.status(500).json({ error: 'Failed to create game', details: error.message })
  }
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
    
    // Get current game state
    const game = await dbHelpers.getGame(gameId)
    if (!game) {
      return res.status(404).json({ error: 'Game not found' })
    }
    
    // Verify this player claimed the slot
    if (game.joiner !== joinerAddress || game.status !== 'claiming') {
      return res.status(400).json({ error: 'Player slot not properly claimed' })
    }
    
    // Complete the join with payment
    const updates = {
      status: 'joined', // Move from 'claiming' to 'joined'
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

const PORT = process.env.PORT || 3001
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WebSocket server with SQLite running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`)
  console.log(`🎮 Games API: http://localhost:${PORT}/api/games`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`)
  console.log(`🔗 Server listening on 0.0.0.0:${PORT}`)
  
  if (process.env.NODE_ENV === 'production') {
    console.log(`🚀 Production server ready at https://cryptoflipz2-production.up.railway.app`)
    console.log(`📄 Frontend served from static files`)
  }
})

// ==============================================
// DATABASE ADMIN ENDPOINTS - Add to server.js
// ==============================================

// 1. VIEW ALL GAMES - See complete database
app.get('/api/admin/games', async (req, res) => {
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