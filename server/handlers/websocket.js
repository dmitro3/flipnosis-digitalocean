const crypto = require('crypto')

function createWebSocketHandlers(wss, dbService, blockchainService) {
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
    const db = dbService.getDatabase()
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
    
    const db = dbService.getDatabase()
    
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
    
    const db = dbService.getDatabase()
    
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
                if (blockchainService.hasOwnerWallet() && game.blockchain_game_id) {
                  blockchainService.completeGameOnChain(game.blockchain_game_id, gameWinner)
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
      if (client && client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify(message))
        successfulBroadcasts++
      }
    })
    
    console.log(`✅ Successfully broadcasted to ${successfulBroadcasts}/${room.size} clients in room ${roomId}`)
  }

  function sendToUser(address, message) {
    const socket = userSockets.get(address)
    if (socket && socket.readyState === 1) { // WebSocket.OPEN
      socket.send(JSON.stringify(message))
    }
  }

  return {
    broadcastToRoom,
    sendToUser
  }
}

module.exports = { createWebSocketHandlers } 