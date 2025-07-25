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
const CONTRACT_OWNER_KEY = process.env.CONTRACT_OWNER_KEY || process.env.PRIVATE_KEY // Private key for contract owner
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
            status TEXT DEFAULT 'open',
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

                 // Profiles table
         database.run(`
           CREATE TABLE IF NOT EXISTS profiles (
             address TEXT PRIMARY KEY,
             name TEXT,
             avatar TEXT,
             headsImage TEXT,
             tailsImage TEXT
           )
         `, (err) => {
           if (err) console.error('❌ Error creating profiles table:', err)
           else console.log('✅ Profiles table ready')
         })

         // Ready NFTs table - for pre-loaded and retained NFTs
         database.run(`
           CREATE TABLE IF NOT EXISTS ready_nfts (
             id INTEGER PRIMARY KEY AUTOINCREMENT,
             player_address TEXT NOT NULL,
             nft_contract TEXT NOT NULL,
             nft_token_id TEXT NOT NULL,
             nft_name TEXT,
             nft_image TEXT,
             nft_collection TEXT,
             deposited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
             source TEXT DEFAULT 'preload',
             UNIQUE(player_address, nft_contract, nft_token_id)
           )
         `, (err) => {
           if (err) console.error('❌ Error creating ready_nfts table:', err)
           else console.log('✅ Ready NFTs table ready')
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
      console.log('📡 Received WebSocket message:', data)
      
      switch (data.type) {
        case 'join_room':
          handleJoinRoom(socket, data)
          break
        case 'register_user':
          handleRegisterUser(socket, data)
          break
        case 'chat_message':
          // Ensure roomId is present
          if (!data.roomId && data.gameId) data.roomId = data.gameId
          handleChatMessage(socket, data)
          break
        case 'game_choice':
          handleGameChoice(socket, data)
          break
        case 'flip_coin':
          handleFlipCoin(socket, data)
          break
        case 'nft_offer':
          handleNftOffer(socket, data)
          break
        case 'accept_nft_offer':
          handleAcceptNftOffer(socket, data)
          break
        default:
          console.log('⚠️ Unhandled WebSocket message type:', data.type)
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
  const { roomId, message, from } = data
  
  // Use the sender's address from the socket or the provided 'from' field
  const senderAddress = socket.address || from || 'anonymous'
  
  // Save to database
  db.run(
    'INSERT INTO chat_messages (room_id, sender_address, message) VALUES (?, ?, ?)',
    [roomId, senderAddress, message]
  )
  
  // Broadcast to room
  broadcastToRoom(roomId, {
    type: 'chat_message',
    message,
    from: senderAddress,
    timestamp: new Date().toISOString()
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

// Handle NFT offer (for NFT-vs-NFT games)
function handleNftOffer(socket, data) {
  const { gameId, offererAddress, nft, timestamp } = data
  if (!gameId || !offererAddress || !nft) {
    console.error('❌ Invalid NFT offer data:', data)
    return
  }
  // Broadcast to the game room
  broadcastToRoom(gameId, {
    type: 'nft_offer_received',
    offer: {
      offererAddress,
      nft,
      timestamp: timestamp || new Date().toISOString()
    }
  })
  console.log('📢 Broadcasted nft_offer_received to room', gameId)
}

// Handle NFT offer acceptance (for NFT-vs-NFT games)
function handleAcceptNftOffer(socket, data) {
  const { gameId, creatorAddress, acceptedOffer, timestamp } = data
  if (!gameId || !creatorAddress || !acceptedOffer) {
    console.error('❌ Invalid accept_nft_offer data:', data)
    return
  }
  // Broadcast acceptance to the game room
  broadcastToRoom(gameId, {
    type: 'nft_offer_accepted',
    acceptedOffer,
    creatorAddress,
    timestamp: timestamp || new Date().toISOString()
  })
  console.log('📢 Broadcasted nft_offer_accepted to room', gameId)
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
  if (!room) {
    console.log(`⚠️ No room found for broadcast: ${roomId}`)
    return
  }
  
  console.log(`📢 Broadcasting to room ${roomId}:`, {
    messageType: message.type,
    roomSize: room.size,
    connectedClients: Array.from(wss.clients).length
  })
  
  let successfulBroadcasts = 0
  room.forEach(socketId => {
    const client = Array.from(wss.clients).find(c => c.id === socketId)
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message))
      successfulBroadcasts++
    }
  })
  
  console.log(`✅ Successfully broadcasted to ${successfulBroadcasts}/${room.size} clients in room ${roomId}`)
}

function sendToUser(address, message) {
  const socket = userSockets.get(address)
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message))
  }
}

// ===== BLOCKCHAIN INTERACTION =====
const CONTRACT_ABI = [
  "function initializeGame(bytes32 gameId, address player1, address player2, address nftContract, uint256 tokenId, uint256 priceUSD, uint8 paymentToken)",
  "function completeGame(bytes32 gameId, address winner)",
  "function cancelGame(bytes32 gameId)"
]

 async function initializeGameOnChain(gameId, player1, player2, nftContract, tokenId, priceUSD) {
   console.log('🔗 Initializing game on blockchain:', { gameId, player1, player2, nftContract, tokenId, priceUSD })
   
      if (!contractOwnerWallet) {
      console.error('❌ Contract owner wallet not configured')
      console.error('❌ Please check CONTRACT_OWNER_KEY or PRIVATE_KEY environment variable')
      return { success: false, error: 'Contract wallet not configured' }
   }
   
   if (!CONTRACT_ADDRESS) {
     console.error('❌ Contract address not configured')
     return { success: false, error: 'Contract address not configured' }
   }
   
   try {
     // Add network info
     const network = await provider.getNetwork()
     console.log('🌐 Connected to network:', {
       name: network.name,
       chainId: network.chainId,
       rpc: RPC_URL
     })
     
     // Check wallet balance
     const balance = await provider.getBalance(contractOwnerWallet.address)
     console.log('💰 Contract owner balance:', ethers.formatEther(balance), 'ETH')
     
     if (balance === 0n) {
       return { success: false, error: 'Contract owner wallet has no ETH for gas fees' }
     }
     
     const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, contractOwnerWallet)
     const gameIdBytes32 = ethers.id(gameId)
     
     // Verify contract exists
     try {
       const code = await provider.getCode(CONTRACT_ADDRESS)
       if (code === '0x') {
         console.error('❌ No contract deployed at address:', CONTRACT_ADDRESS)
         return { success: false, error: 'Contract not found at specified address' }
       }
       console.log('✅ Contract found at address:', CONTRACT_ADDRESS)
     } catch (err) {
       console.error('❌ Error checking contract:', err)
       return { success: false, error: 'Failed to verify contract existence' }
     }
     
     console.log('🔗 Sending transaction to contract:', CONTRACT_ADDRESS)
           console.log('📝 Transaction parameters:', {
        gameIdBytes32,
        player1,
        player2, 
        nftContract,
        tokenId,
        priceUSD: ethers.parseUnits(priceUSD.toString(), 6),
        paymentToken: 0 // 0 = ETH, 1 = USDC
      })
     
           // Try to estimate gas first
      try {
        const gasEstimate = await contract.initializeGame.estimateGas(
          gameIdBytes32,
          player1,
          player2,
          nftContract,
          tokenId,
          ethers.parseUnits(priceUSD.toString(), 6),
          0 // PaymentToken.ETH = 0, PaymentToken.USDC = 1
        )
        console.log('⛽ Gas estimate:', gasEstimate.toString())
      } catch (gasError) {
        console.error('❌ Gas estimation failed:', gasError)
        return { success: false, error: `Gas estimation failed: ${gasError.message}` }
      }
      
      const tx = await contract.initializeGame(
        gameIdBytes32,
        player1,
        player2,
        nftContract,
        tokenId,
        ethers.parseUnits(priceUSD.toString(), 6), // 6 decimals for USD
        0 // PaymentToken.ETH = 0, PaymentToken.USDC = 1
      )
     
     console.log('⏳ Waiting for transaction confirmation:', tx.hash)
     await tx.wait()
     console.log('✅ Game initialized on chain:', gameId)
     return { success: true }
   } catch (error) {
     console.error('❌ Failed to initialize game on chain:', error)
     console.error('❌ Error details:', {
       message: error.message,
       code: error.code,
       reason: error.reason
     })
     return { success: false, error: error.message || 'Blockchain transaction failed' }
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
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
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
  db.all('SELECT * FROM listings WHERE status = "open" ORDER BY created_at DESC', (err, listings) => {
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

  console.log('💡 New offer request:', { listingId, offerer_address, offer_price, message })

  // Allow offers for listings that are not completed/cancelled
  db.get('SELECT * FROM listings WHERE id = ?', [listingId], (err, listing) => {
    if (err || !listing) {
      console.error('❌ Listing not found for offer:', listingId, err)
      return res.status(404).json({ error: 'Listing not found' })
    }
    
    console.log('✅ Found listing for offer:', { id: listing.id, status: listing.status, creator: listing.creator })
    
    // Only block offers if the listing is cancelled or completed
    if (listing.status === 'closed' || listing.status === 'completed') {
      console.warn('⚠️ Attempted offer on closed/completed listing:', listing.status)
      return res.status(400).json({ error: 'Cannot make offers on cancelled or completed listings' })
    }
    // Optionally, block offers if there is already a joiner/challenger (if you track that on the listing)
    // Otherwise, allow offers
    const offerId = `offer_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
    
    console.log('💾 Creating offer in database:', { offerId, listingId, offerer_address, offer_price })
    
    db.run(`
      INSERT INTO offers (id, listing_id, offerer_address, offer_price, message, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `, [offerId, listingId, offerer_address, offer_price, message], function(err) {
      if (err) {
        console.error('❌ Error creating offer in database:', err)
        return res.status(500).json({ error: 'Database error' })
      }
      
      console.log('✅ Offer created successfully:', offerId)
      // Notify listing creator and broadcast to room
      db.get('SELECT creator FROM listings WHERE id = ?', [listingId], (err, listing) => {
        if (listing) {
          // Send direct notification to listing creator
          sendToUser(listing.creator, {
            type: 'new_offer',
            listingId,
            offerId,
            offer_price,
            message
          })
          
          // Broadcast to all users in the listing room for real-time updates
          broadcastToRoom(listingId, {
            type: 'new_offer',
            listingId,
            offerId,
            offer_price,
            message,
            offerer_address
          })
          
          console.log('📢 Broadcasted new offer to room:', listingId)
        }
      })
      res.json({ success: true, offerId })
    })
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
      const depositDeadline = new Date(Date.now() + 3 * 60 * 1000).toISOString() // 3 minutes total
      
      // Update offer status
      db.run('UPDATE offers SET status = "accepted" WHERE id = ?', [offerId])
      
      // Update listing status
      db.run('UPDATE listings SET status = "pending" WHERE id = ?', [offer.listing_id])
      
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
        console.log('🎲 Attempting to initialize game on blockchain for offer acceptance')
        const chainResult = await initializeGameOnChain(
          gameId,
          listing.creator,
          offer.offerer_address,
          listing.nft_contract,
          listing.nft_token_id,
          offer.offer_price
        )
        
        if (!chainResult.success) {
          // Rollback if blockchain fails
          console.error('❌ Rolling back database changes due to blockchain failure:', chainResult.error)
          db.run('DELETE FROM games WHERE id = ?', [gameId])
          db.run('UPDATE offers SET status = "pending" WHERE id = ?', [offerId])
          db.run('UPDATE listings SET status = "open" WHERE id = ?', [offer.listing_id])
          return res.status(500).json({ 
            error: 'Blockchain initialization failed', 
            details: chainResult.error,
            gameId 
          })
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
          game_type: 'nft-vs-crypto', // Add this line
          creator: listing.creator,
          creator_address: listing.creator, // Add for compatibility
          nft_contract: listing.nft_contract,
          nft_token_id: listing.nft_token_id,
          nft_name: listing.nft_name,
          nft_image: listing.nft_image,
          nft_collection: listing.nft_collection,
          asking_price: listing.asking_price,
          coin_data: listing.coin_data,
          status: listing.status,
          coinData: listing.coin_data ? JSON.parse(listing.coin_data) : null // Parse coin data
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
     
     // If it's an NFT deposit, remove from ready_nfts table (it's now in active game)
     if (isCreator && assetType === 'nft') {
       db.run(
         'DELETE FROM ready_nfts WHERE player_address = ? AND nft_contract = ? AND nft_token_id = ?',
         [player, game.nft_contract, game.nft_token_id],
         (err) => {
           if (err) {
             console.error('❌ Error removing NFT from ready state:', err)
           } else {
             console.log('✅ NFT moved from ready state to active game')
           }
         }
       )
     }
     
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

 // Auto-confirm NFT deposit if already ready
 app.post('/api/games/:gameId/use-ready-nft', (req, res) => {
   const { gameId } = req.params
   const { player } = req.body
   
   db.get('SELECT * FROM games WHERE id = ?', [gameId], (err, game) => {
     if (err || !game) {
       return res.status(404).json({ error: 'Game not found' })
     }
     
     if (player !== game.creator) {
       return res.status(400).json({ error: 'Only creator can use ready NFT' })
     }
     
     // Check if the game's NFT is ready for this player
     db.get(
       'SELECT * FROM ready_nfts WHERE player_address = ? AND nft_contract = ? AND nft_token_id = ?',
       [player, game.nft_contract, game.nft_token_id],
       (err, readyNft) => {
         if (err || !readyNft) {
           return res.status(404).json({ error: 'Ready NFT not found' })
         }
         
         // Remove from ready_nfts (now in active use)
         db.run(
           'DELETE FROM ready_nfts WHERE id = ?',
           [readyNft.id],
           (err) => {
             if (err) {
               console.error('❌ Error removing ready NFT:', err)
               return res.status(500).json({ error: 'Database error' })
             }
             
             // Mark creator as deposited
             db.run('UPDATE games SET creator_deposited = true WHERE id = ?', [gameId], (err) => {
               if (err) {
                 return res.status(500).json({ error: 'Database error' })
               }
               
               console.log('⚡ Ready NFT used for instant game start:', game.nft_name)
               
               // Notify players
               broadcastToRoom(gameId, {
                 type: 'ready_nft_used',
                 player,
                 nft_name: game.nft_name,
                 message: 'Pre-loaded NFT used - waiting for challenger deposit'
               })
               
               broadcastToRoom(gameId, {
                 type: 'deposit_confirmed',
                 player,
                 assetType: 'nft'
               })
               
               res.json({ success: true, message: 'Ready NFT used successfully!' })
             })
           }
         )
       }
     )
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
         // If creator deposited NFT but challenger didn't show, move NFT to ready state
         if (game.creator_deposited && !game.challenger_deposited) {
           console.log('🎯 Moving timed-out NFT to ready state for future games:', game.nft_name)
           
           // Move NFT to ready state instead of forcing withdrawal
           db.run(`
             INSERT OR REPLACE INTO ready_nfts (
               player_address, nft_contract, nft_token_id, nft_name, nft_image, nft_collection, source
             ) VALUES (?, ?, ?, ?, ?, ?, 'timeout_retention')
           `, [
             game.creator, game.nft_contract, game.nft_token_id, 
             game.nft_name, game.nft_image, game.nft_collection
           ], (err) => {
             if (err) {
               console.error('❌ Error moving NFT to ready state:', err)
             } else {
               console.log('✅ NFT moved to ready state for', game.creator)
               
               // Notify player their NFT is ready for next game
               sendToUser(game.creator, {
                 type: 'nft_moved_to_ready',
                 nft_name: game.nft_name,
                 message: 'Your NFT is ready for the next game - no need to deposit again!'
               })
             }
           })
         }
         
         // Cancel game
         db.run('UPDATE games SET status = "cancelled" WHERE id = ?', [game.id])
         
         // Notify players
         broadcastToRoom(game.id, {
           type: 'game_cancelled',
           reason: 'deposit_timeout',
           creator_deposited: game.creator_deposited,
           nft_moved_to_ready: game.creator_deposited && !game.challenger_deposited
         })
         
         // Update listing back to open if neither deposited
         if (!game.creator_deposited && !game.challenger_deposited) {
           db.run('UPDATE listings SET status = "open" WHERE id = ?', [game.listing_id])
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

// Get user profile
app.get('/api/profile/:address', (req, res) => {
  const { address } = req.params
  db.get('SELECT * FROM profiles WHERE address = ?', [address], (err, profile) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' })
    }
    if (!profile) {
      // Return empty profile if not found
      return res.json({
        address,
        name: '',
        avatar: '',
        headsImage: '',
        tailsImage: ''
      })
    }
    res.json(profile)
  })
})

// Get dashboard data for user
app.get('/api/dashboard/:address', (req, res) => {
  const { address } = req.params
  
  // Get user's listings
  db.all('SELECT * FROM listings WHERE creator = ? ORDER BY created_at DESC', [address], (err, listings) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' })
    }
    
    // Get user's outgoing offers
    db.all('SELECT * FROM offers WHERE offerer_address = ? ORDER BY created_at DESC', [address], (err, outgoingOffers) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }
      
      // Get user's incoming offers (offers on their listings)
      db.all(`
        SELECT o.*, l.nft_name, l.nft_image, l.nft_collection 
        FROM offers o 
        JOIN listings l ON o.listing_id = l.id 
        WHERE l.creator = ? AND o.status = 'pending'
        ORDER BY o.created_at DESC
      `, [address], (err, incomingOffers) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' })
        }
        
        res.json({
          listings: listings || [],
          outgoingOffers: outgoingOffers || [],
          incomingOffers: incomingOffers || []
        })
      })
    })
  })
})

 // Update user profile
 app.put('/api/profile/:address', (req, res) => {
   const { address } = req.params
   const { name, avatar, headsImage, tailsImage } = req.body
   db.run(
     `INSERT INTO profiles (address, name, avatar, headsImage, tailsImage) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(address) DO UPDATE SET name=excluded.name, avatar=excluded.avatar, headsImage=excluded.headsImage, tailsImage=excluded.tailsImage`,
     [address, name || '', avatar || '', headsImage || '', tailsImage || ''],
     function(err) {
       if (err) {
         return res.status(500).json({ error: 'Database error' })
       }
       res.json({ success: true })
     }
   )
 })

 // ===== READY NFT SYSTEM =====

 // Pre-load NFT during listing creation
 app.post('/api/nft/preload', async (req, res) => {
   const { player_address, nft_contract, nft_token_id, nft_name, nft_image, nft_collection } = req.body
   
   console.log('🎯 Pre-loading NFT:', { player_address, nft_contract, nft_token_id })
   
   // Check if NFT already ready
   db.get(
     'SELECT * FROM ready_nfts WHERE player_address = ? AND nft_contract = ? AND nft_token_id = ?',
     [player_address, nft_contract, nft_token_id],
     (err, existing) => {
       if (existing) {
         return res.status(400).json({ error: 'NFT already pre-loaded' })
       }
       
       // Store in ready_nfts table
       db.run(`
         INSERT INTO ready_nfts (player_address, nft_contract, nft_token_id, nft_name, nft_image, nft_collection, source)
         VALUES (?, ?, ?, ?, ?, ?, 'preload')
       `, [player_address, nft_contract, nft_token_id, nft_name, nft_image, nft_collection], function(err) {
         if (err) {
           console.error('❌ Error pre-loading NFT:', err)
           return res.status(500).json({ error: 'Database error' })
         }
         
         console.log('✅ NFT pre-loaded successfully:', nft_contract, nft_token_id)
         res.json({ success: true, message: 'NFT pre-loaded for instant games!' })
       })
     }
   )
 })

 // Withdraw ready NFT
 app.post('/api/nft/withdraw', async (req, res) => {
   const { player_address, nft_contract, nft_token_id } = req.body
   
   console.log('💎 Withdrawing ready NFT:', { player_address, nft_contract, nft_token_id })
   
   // Remove from ready_nfts table
   db.run(
     'DELETE FROM ready_nfts WHERE player_address = ? AND nft_contract = ? AND nft_token_id = ?',
     [player_address, nft_contract, nft_token_id],
     function(err) {
       if (err) {
         console.error('❌ Error withdrawing NFT:', err)
         return res.status(500).json({ error: 'Database error' })
       }
       
       if (this.changes === 0) {
         return res.status(404).json({ error: 'Ready NFT not found' })
       }
       
       console.log('✅ Ready NFT withdrawn successfully')
       res.json({ success: true, message: 'NFT withdrawn from ready state' })
     }
   )
 })

 // Get user's ready NFTs
 app.get('/api/users/:address/ready-nfts', (req, res) => {
   const { address } = req.params
   
   db.all(
     'SELECT * FROM ready_nfts WHERE player_address = ? ORDER BY deposited_at DESC',
     [address],
     (err, readyNfts) => {
       if (err) {
         return res.status(500).json({ error: 'Database error' })
       }
       res.json(readyNfts || [])
     }
   )
 })

 // Check if specific NFT is ready for user
 app.get('/api/nft/ready-status/:address/:contract/:tokenId', (req, res) => {
   const { address, contract, tokenId } = req.params
   
   db.get(
     'SELECT * FROM ready_nfts WHERE player_address = ? AND nft_contract = ? AND nft_token_id = ?',
     [address, contract, tokenId],
     (err, readyNft) => {
       if (err) {
         return res.status(500).json({ error: 'Database error' })
       }
       res.json({ 
         ready: !!readyNft,
         nft: readyNft || null
       })
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
  