const express = require('express')
const http = require('http')
const WebSocket = require('ws')
const cors = require('cors')
const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const ethers = require('ethers')

console.log('🚀 Starting CryptoFlipz Clean Server...')

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

// ===== CONFIGURATION =====
const PORT = process.env.PORT || 3001
const DATABASE_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'flipz-clean.db')
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x807885ec42b9A727C4763d8F929f2ac132eDF6F0'
const CONTRACT_OWNER_KEY = process.env.CONTRACT_OWNER_KEY // Private key for contract owner
const RPC_URL = process.env.RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3'

// Initialize ethers
const provider = new ethers.JsonRpcProvider(RPC_URL)
const contractOwnerWallet = CONTRACT_OWNER_KEY ? new ethers.Wallet(CONTRACT_OWNER_KEY, provider) : null

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
            status TEXT DEFAULT 'active',
            coin_data TEXT,
            listing_fee_paid BOOLEAN DEFAULT false,
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
        
        // Games table - only created when offer is accepted
        database.run(`
          CREATE TABLE IF NOT EXISTS games (
            id TEXT PRIMARY KEY,
            listing_id TEXT NOT NULL,
            offer_id TEXT,
            blockchain_game_id TEXT UNIQUE,
            creator TEXT NOT NULL,
            challenger TEXT NOT NULL,
            nft_contract TEXT NOT NULL,
            nft_token_id TEXT NOT NULL,
            nft_name TEXT,
            nft_image TEXT,
            nft_collection TEXT,
            final_price REAL NOT NULL,
            coin_data TEXT,
            status TEXT DEFAULT 'waiting_deposits',
            creator_deposited BOOLEAN DEFAULT false,
            challenger_deposited BOOLEAN DEFAULT false,
            deposit_deadline TIMESTAMP,
            winner TEXT,
            game_data TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (listing_id) REFERENCES listings(id),
            FOREIGN KEY (offer_id) REFERENCES offers(id)
          )
        `, (err) => {
          if (err) console.error('❌ Error creating games table:', err)
          else console.log('✅ Games table ready')
        })
        
        // Game rounds table
        database.run(`
          CREATE TABLE IF NOT EXISTS game_rounds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            game_id TEXT NOT NULL,
            round_number INTEGER NOT NULL,
            creator_choice TEXT,
            challenger_choice TEXT,
            flip_result TEXT,
            round_winner TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (game_id) REFERENCES games(id)
          )
        `, (err) => {
          if (err) console.error('❌ Error creating game_rounds table:', err)
          else console.log('✅ Game rounds table ready')
        })
        
        // Chat messages table
        database.run(`
          CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id TEXT NOT NULL,
            sender_address TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) console.error('❌ Error creating chat_messages table:', err)
          else console.log('✅ Chat messages table ready')
        })
      })
      
      resolve(database)
    })
  })
}

// ===== WEBSOCKET MANAGEMENT =====
const rooms = new Map() // roomId -> Set of socket IDs
const socketRooms = new Map() // socket.id -> roomId
const userSockets = new Map() // address -> socket

wss.on('connection', (socket) => {
  socket.id = crypto.randomBytes(16).toString('hex')
  console.log('🔌 New connection:', socket.id)
  
  socket.on('message', async (message) => {
    try {
      const data = JSON.parse(message)
      console.log('📡 Received:', data.type)
      
      switch (data.type) {
        case 'join_room':
          handleJoinRoom(socket, data)
          break
          
        case 'register_user':
          handleRegisterUser(socket, data)
          break
          
        case 'chat_message':
          handleChatMessage(socket, data)
          break
          
        case 'game_choice':
          handleGameChoice(socket, data)
          break
          
        case 'flip_coin':
          handleFlipCoin(socket, data)
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

function handleJoinRoom(socket, data) {
  const { roomId } = data
  
  // Leave previous room if any
  const oldRoom = socketRooms.get(socket.id)
  if (oldRoom && rooms.has(oldRoom)) {
    rooms.get(oldRoom).delete(socket.id)
  }
  
  // Join new room
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set())
  }
  rooms.get(roomId).add(socket.id)
  socketRooms.set(socket.id, roomId)
  
  console.log(`👥 Socket ${socket.id} joined room ${roomId}`)
}

function handleRegisterUser(socket, data) {
  const { address } = data
  socket.address = address
  userSockets.set(address, socket)
  console.log(`👤 User registered: ${address}`)
}

async function handleChatMessage(socket, data) {
  const { roomId, message } = data
  
  // Save to database
  db.run(
    'INSERT INTO chat_messages (room_id, sender_address, message) VALUES (?, ?, ?)',
    [roomId, socket.address || 'anonymous', message]
  )
  
  // Broadcast to room
  broadcastToRoom(roomId, {
    type: 'chat_message',
    message,
    from: socket.address || 'anonymous',
    timestamp: Date.now()
  })
}

async function handleGameChoice(socket, data) {
  const { gameId, choice } = data
  
  // Get game from database
  db.get('SELECT * FROM games WHERE id = ?', [gameId], async (err, game) => {
    if (err || !game) {
      console.error('❌ Game not found:', gameId)
      return
    }
    
    // Get current round
    db.get(
      'SELECT COUNT(*) as round FROM game_rounds WHERE game_id = ?',
      [gameId],
      (err, result) => {
        const currentRound = (result?.round || 0) + 1
        
        // Store choice
        const isCreator = socket.address === game.creator
        db.run(
          `UPDATE game_rounds 
           SET ${isCreator ? 'creator_choice' : 'challenger_choice'} = ?
           WHERE game_id = ? AND round_number = ?`,
          [choice, gameId, currentRound],
          (err) => {
            if (err) {
              // Create new round if doesn't exist
              db.run(
                'INSERT INTO game_rounds (game_id, round_number, ' +
                (isCreator ? 'creator_choice' : 'challenger_choice') + 
                ') VALUES (?, ?, ?)',
                [gameId, currentRound, choice]
              )
            }
          }
        )
        
        // Notify room
        broadcastToRoom(gameId, {
          type: 'player_choice',
          player: socket.address,
          roundNumber: currentRound
        })
      }
    )
  })
}

async function handleFlipCoin(socket, data) {
  const { gameId } = data
  
  // Get game and current round
  db.get('SELECT * FROM games WHERE id = ?', [gameId], (err, game) => {
    if (err || !game || game.status !== 'active') {
      console.error('❌ Invalid game state')
      return
    }
    
    db.get(
      'SELECT * FROM game_rounds WHERE game_id = ? ORDER BY round_number DESC LIMIT 1',
      [gameId],
      (err, round) => {
        if (!round || !round.creator_choice || !round.challenger_choice) {
          console.error('❌ Both players must choose first')
          return
        }
        
        // Generate flip result
        const result = Math.random() < 0.5 ? 'heads' : 'tails'
        const creatorWins = round.creator_choice === result
        const roundWinner = creatorWins ? game.creator : game.challenger
        
        // Update round
        db.run(
          'UPDATE game_rounds SET flip_result = ?, round_winner = ? WHERE id = ?',
          [result, roundWinner, round.id]
        )
        
        // Check if game is complete (best of 5)
        db.all(
          'SELECT round_winner, COUNT(*) as wins FROM game_rounds WHERE game_id = ? GROUP BY round_winner',
          [gameId],
          (err, results) => {
            const wins = {}
            results.forEach(r => wins[r.round_winner] = r.wins)
            
            let gameComplete = false
            let gameWinner = null
            
            if (wins[game.creator] >= 3) {
              gameComplete = true
              gameWinner = game.creator
            } else if (wins[game.challenger] >= 3) {
              gameComplete = true
              gameWinner = game.challenger
            }
            
            // Broadcast result
            broadcastToRoom(gameId, {
              type: 'flip_result',
              result,
              roundWinner,
              roundNumber: round.round_number,
              creatorWins: wins[game.creator] || 0,
              challengerWins: wins[game.challenger] || 0,
              gameComplete,
              gameWinner
            })
            
            // If game complete, update database and blockchain
            if (gameComplete) {
              db.run(
                'UPDATE games SET status = ?, winner = ? WHERE id = ?',
                ['completed', gameWinner, gameId]
              )
              
              // Call smart contract to complete game
              if (contractOwnerWallet && game.blockchain_game_id) {
                completeGameOnChain(game.blockchain_game_id, gameWinner)
              }
            }
          }
        )
      }
    )
  })
}

function handleDisconnect(socket) {
  console.log('🔌 Disconnected:', socket.id)
  
  // Remove from rooms
  const roomId = socketRooms.get(socket.id)
  if (roomId && rooms.has(roomId)) {
    rooms.get(roomId).delete(socket.id)
  }
  socketRooms.delete(socket.id)
  
  // Remove from user sockets
  if (socket.address) {
    userSockets.delete(socket.address)
  }
}

function broadcastToRoom(roomId, message) {
  const room = rooms.get(roomId)
  if (!room) return
  
  room.forEach(socketId => {
    const client = Array.from(wss.clients).find(c => c.id === socketId)
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message))
    }
  })
}

function sendToUser(address, message) {
  const socket = userSockets.get(address)
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message))
  }
}

// ===== BLOCKCHAIN INTERACTION =====
const CONTRACT_ABI = [
  "function initializeGame(bytes32 gameId, address player1, address player2, address nftContract, uint256 tokenId, uint256 priceUSD)",
  "function completeGame(bytes32 gameId, address winner)",
  "function cancelGame(bytes32 gameId)"
]

async function initializeGameOnChain(gameId, player1, player2, nftContract, tokenId, priceUSD) {
  if (!contractOwnerWallet) {
    console.error('❌ Contract owner wallet not configured')
    return false
  }
  
  try {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, contractOwnerWallet)
    const gameIdBytes32 = ethers.id(gameId)
    
    const tx = await contract.initializeGame(
      gameIdBytes32,
      player1,
      player2,
      nftContract,
      tokenId,
      ethers.parseUnits(priceUSD.toString(), 6) // 6 decimals for USD
    )
    
    await tx.wait()
    console.log('✅ Game initialized on chain:', gameId)
    return true
  } catch (error) {
    console.error('❌ Failed to initialize game on chain:', error)
    return false
  }
}

async function completeGameOnChain(gameIdBytes32, winner) {
  if (!contractOwnerWallet) return
  
  try {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, contractOwnerWallet)
    const tx = await contract.completeGame(gameIdBytes32, winner)
    await tx.wait()
    console.log('✅ Game completed on chain')
  } catch (error) {
    console.error('❌ Failed to complete game on chain:', error)
  }
}

// ===== API ROUTES =====

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    server: 'clean-architecture', 
    timestamp: new Date().toISOString(),
    hasContractOwner: !!contractOwnerWallet
  })
})

// Create listing
app.post('/api/listings', (req, res) => {
  const { creator, nft_contract, nft_token_id, nft_name, nft_image, nft_collection, asking_price, coin_data } = req.body
  
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
    res.json({ success: true, listingId })
  })
})

// Get listing
app.get('/api/listings/:listingId', (req, res) => {
  const { listingId } = req.params
  
  db.get('SELECT * FROM listings WHERE id = ?', [listingId], (err, listing) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' })
    }
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' })
    }
    
    // Get offers count
    db.get('SELECT COUNT(*) as count FROM offers WHERE listing_id = ? AND status = "pending"', [listingId], (err, result) => {
      listing.pending_offers = result?.count || 0
      res.json(listing)
    })
  })
})

// Get all active listings
app.get('/api/listings', (req, res) => {
  db.all('SELECT * FROM listings WHERE status = "active" ORDER BY created_at DESC', (err, listings) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' })
    }
    res.json(listings)
  })
})

// Create offer
app.post('/api/listings/:listingId/offers', (req, res) => {
  const { listingId } = req.params
  const { offerer_address, offer_price, message } = req.body
  
  const offerId = `offer_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
  
  db.run(`
    INSERT INTO offers (id, listing_id, offerer_address, offer_price, message, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `, [offerId, listingId, offerer_address, offer_price, message], function(err) {
    if (err) {
      console.error('❌ Error creating offer:', err)
      return res.status(500).json({ error: 'Database error' })
    }
    
    // Notify listing creator
    db.get('SELECT creator FROM listings WHERE id = ?', [listingId], (err, listing) => {
      if (listing) {
        sendToUser(listing.creator, {
          type: 'new_offer',
          listingId,
          offerId,
          offer_price,
          message
        })
      }
    })
    
    res.json({ success: true, offerId })
  })
})

// Get offers for listing
app.get('/api/listings/:listingId/offers', (req, res) => {
  const { listingId } = req.params
  
  db.all('SELECT * FROM offers WHERE listing_id = ? ORDER BY created_at DESC', [listingId], (err, offers) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' })
    }
    res.json(offers)
  })
})

// Accept offer
app.post('/api/offers/:offerId/accept', async (req, res) => {
  const { offerId } = req.params
  
  db.get('SELECT * FROM offers WHERE id = ?', [offerId], async (err, offer) => {
    if (err || !offer) {
      return res.status(404).json({ error: 'Offer not found' })
    }
    
    if (offer.status !== 'pending') {
      return res.status(400).json({ error: 'Offer already processed' })
    }
    
    // Get listing details
    db.get('SELECT * FROM listings WHERE id = ?', [offer.listing_id], async (err, listing) => {
      if (err || !listing) {
        return res.status(404).json({ error: 'Listing not found' })
      }
      
      // Create game
      const gameId = `game_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
      const blockchainGameId = ethers.id(gameId)
      const depositDeadline = new Date(Date.now() + 2 * 60 * 1000).toISOString() // 2 minutes
      
      // Update offer status
      db.run('UPDATE offers SET status = "accepted" WHERE id = ?', [offerId])
      
      // Update listing status
      db.run('UPDATE listings SET status = "offer_accepted" WHERE id = ?', [offer.listing_id])
      
      // Create game record
      db.run(`
        INSERT INTO games (
          id, listing_id, offer_id, blockchain_game_id, creator, challenger,
          nft_contract, nft_token_id, nft_name, nft_image, nft_collection,
          final_price, coin_data, status, deposit_deadline
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        gameId, offer.listing_id, offerId, blockchainGameId, listing.creator, offer.offerer_address,
        listing.nft_contract, listing.nft_token_id, listing.nft_name, listing.nft_image, listing.nft_collection,
        offer.offer_price, listing.coin_data, 'waiting_deposits', depositDeadline
      ], async function(err) {
        if (err) {
          console.error('❌ Error creating game:', err)
          return res.status(500).json({ error: 'Database error' })
        }
        
        // Initialize game on blockchain
        const chainSuccess = await initializeGameOnChain(
          gameId,
          listing.creator,
          offer.offerer_address,
          listing.nft_contract,
          listing.nft_token_id,
          offer.offer_price
        )
        
        if (!chainSuccess) {
          // Rollback if blockchain fails
          db.run('DELETE FROM games WHERE id = ?', [gameId])
          db.run('UPDATE offers SET status = "pending" WHERE id = ?', [offerId])
          db.run('UPDATE listings SET status = "active" WHERE id = ?', [offer.listing_id])
          return res.status(500).json({ error: 'Blockchain initialization failed' })
        }
        
        // Notify both players
        sendToUser(listing.creator, {
          type: 'offer_accepted',
          gameId,
          depositDeadline
        })
        
        sendToUser(offer.offerer_address, {
          type: 'offer_accepted',
          gameId,
          depositDeadline
        })
        
        // Broadcast to listing room
        broadcastToRoom(offer.listing_id, {
          type: 'listing_converted_to_game',
          listingId: offer.listing_id,
          gameId
        })
        
        res.json({ success: true, gameId })
      })
    })
  })
})

// Reject offer
app.post('/api/offers/:offerId/reject', (req, res) => {
  const { offerId } = req.params
  
  db.run('UPDATE offers SET status = "rejected" WHERE id = ?', [offerId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' })
    }
    
    // Notify offerer
    db.get('SELECT * FROM offers WHERE id = ?', [offerId], (err, offer) => {
      if (offer) {
        sendToUser(offer.offerer_address, {
          type: 'offer_rejected',
          offerId
        })
      }
    })
    
    res.json({ success: true })
  })
})

// Get game
app.get('/api/games/:gameId', (req, res) => {
  const { gameId } = req.params
  
  db.get('SELECT * FROM games WHERE id = ? OR blockchain_game_id = ?', [gameId, gameId], (err, game) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' })
    }
    if (!game) {
      // Check if it's a listing
      db.get('SELECT * FROM listings WHERE id = ?', [gameId], (err, listing) => {
        if (err || !listing) {
          return res.status(404).json({ error: 'Game/Listing not found' })
        }
        // Return listing as game-like structure
        res.json({
          id: listing.id,
          type: 'listing',
          creator: listing.creator,
          nft_contract: listing.nft_contract,
          nft_token_id: listing.nft_token_id,
          nft_name: listing.nft_name,
          nft_image: listing.nft_image,
          nft_collection: listing.nft_collection,
          asking_price: listing.asking_price,
          coin_data: listing.coin_data,
          status: listing.status
        })
      })
      return
    }
    
    // Get round information
    db.all('SELECT * FROM game_rounds WHERE game_id = ? ORDER BY round_number', [gameId], (err, rounds) => {
      game.rounds = rounds || []
      
      // Calculate wins
      game.creator_wins = rounds.filter(r => r.round_winner === game.creator).length
      game.challenger_wins = rounds.filter(r => r.round_winner === game.challenger).length
      
      res.json(game)
    })
  })
})

// Get all games
app.get('/api/games', (req, res) => {
  db.all('SELECT * FROM games ORDER BY created_at DESC', (err, games) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' })
    }
    res.json(games)
  })
})

// Confirm deposit
app.post('/api/games/:gameId/deposit-confirmed', (req, res) => {
  const { gameId } = req.params
  const { player, assetType } = req.body // assetType: 'nft' or 'eth'
  
  db.get('SELECT * FROM games WHERE id = ?', [gameId], (err, game) => {
    if (err || !game) {
      return res.status(404).json({ error: 'Game not found' })
    }
    
    const isCreator = player === game.creator
    const column = isCreator ? 'creator_deposited' : 'challenger_deposited'
    
    db.run(`UPDATE games SET ${column} = true WHERE id = ?`, [gameId], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      
      // Check if both deposited
      db.get('SELECT * FROM games WHERE id = ?', [gameId], (err, updatedGame) => {
        if (updatedGame.creator_deposited && updatedGame.challenger_deposited) {
          // Start game
          db.run('UPDATE games SET status = "active" WHERE id = ?', [gameId])
          
          // Notify players
          broadcastToRoom(gameId, {
            type: 'game_started',
            gameId
          })
        } else {
          // Notify deposit confirmed
          broadcastToRoom(gameId, {
            type: 'deposit_confirmed',
            player,
            assetType
          })
        }
        
        res.json({ success: true })
      })
    })
  })
})

// Check deposit timeout
setInterval(() => {
  const now = new Date().toISOString()
  
  db.all(
    'SELECT * FROM games WHERE status = "waiting_deposits" AND deposit_deadline < ?',
    [now],
    (err, games) => {
      if (err || !games) return
      
      games.forEach(game => {
        // Cancel game
        db.run('UPDATE games SET status = "cancelled" WHERE id = ?', [game.id])
        
        // Notify players
        broadcastToRoom(game.id, {
          type: 'game_cancelled',
          reason: 'deposit_timeout'
        })
        
        // Update listing back to active if neither deposited
        if (!game.creator_deposited && !game.challenger_deposited) {
          db.run('UPDATE listings SET status = "active" WHERE id = ?', [game.listing_id])
        }
      })
    }
  )
}, 10000) // Check every 10 seconds

// Get user games
app.get('/api/users/:address/games', (req, res) => {
  const { address } = req.params
  
  db.all(
    'SELECT * FROM games WHERE creator = ? OR challenger = ? ORDER BY created_at DESC',
    [address, address],
    (err, games) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      res.json(games)
    }
  )
})

// Get user listings
app.get('/api/users/:address/listings', (req, res) => {
  const { address } = req.params
  
  db.all(
    'SELECT * FROM listings WHERE creator = ? ORDER BY created_at DESC',
    [address],
    (err, listings) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      res.json(listings)
    }
  )
})

// ===== STATIC FILE FALLBACK =====
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

// ===== SERVER STARTUP =====
initializeDatabase()
  .then((database) => {
    db = database
    console.log('✅ Database initialized')
    
    server.listen(PORT, () => {
      console.log(`🎮 CryptoFlipz Clean Server running on port ${PORT}`)
      console.log(`🌐 WebSocket server ready`)
      console.log(`📊 Database: ${DATABASE_PATH}`)
      console.log(`📝 Contract: ${CONTRACT_ADDRESS}`)
      console.log(`🔑 Contract owner: ${contractOwnerWallet ? 'Configured' : 'Not configured'}`)
    })
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  })
  