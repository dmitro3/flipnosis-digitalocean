const crypto = require('crypto')

// Room management
const rooms = new Map()
const socketRooms = new Map()
const userSockets = new Map()

// Create WebSocket handlers
function createWebSocketHandlers(wss, dbService, blockchainService) {
  // Handle WebSocket connections
  wss.on('connection', (socket, req) => {
    socket.id = crypto.randomBytes(16).toString('hex')
    console.log(`🔌 New WebSocket connection: ${socket.id}`)
    
    socket.on('close', () => {
      console.log(`🔌 WebSocket disconnected: ${socket.id}`)
      
      // Cleanup
      const room = socketRooms.get(socket.id)
      if (room && rooms.has(room)) {
        rooms.get(room).delete(socket.id)
      }
      socketRooms.delete(socket.id)
      
      if (socket.address) {
        userSockets.delete(socket.address)
      }
    })

    socket.on('message', async (message) => {
      try {
        const data = JSON.parse(message)
        
        // Ensure type field exists
        if (!data || typeof data !== 'object') {
          console.warn('Invalid WebSocket data format')
          return
        }
        
        console.log('📡 Received WebSocket message:', data)
        
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
          case 'GAME_ACTION':
            console.log('🎮 Received GAME_ACTION:', data)
            handleGameAction(socket, data, dbService)
            break
          case 'nft_offer':
            handleNftOffer(socket, data)
            break
          case 'offer_accepted':
            handleOfferAccepted(socket, data)
            break
          default:
            console.log('⚠️ Unhandled WebSocket message type:', data.type)
        }
      } catch (error) {
        console.error('❌ WebSocket error:', error)
      }
    })
  })

  // Broadcast to room
  function broadcastToRoom(roomId, message) {
    if (!rooms.has(roomId)) return
    
    const room = rooms.get(roomId)
    const messageStr = JSON.stringify(message)
    
    console.log(`📢 Broadcasting to room ${roomId}:`, {
      messageType: message.type,
      roomSize: room.size,
      connectedClients: wss.clients.size
    })
    
    let successfulBroadcasts = 0
    room.forEach(socketId => {
      const client = Array.from(wss.clients).find(s => s.id === socketId)
      if (client && client.readyState === 1) { // WebSocket.OPEN
        client.send(messageStr)
        successfulBroadcasts++
      }
    })
    
    console.log(`✅ Successfully broadcasted to ${successfulBroadcasts}/${room.size} clients in room ${roomId}`)
  }

  // Broadcast to all
  function broadcastToAll(message) {
    const messageStr = JSON.stringify(message)
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(messageStr)
      }
    })
  }

  // Get user socket
  function getUserSocket(address) {
    return userSockets.get(address)
  }

  // Send message to specific user
  function sendToUser(address, message) {
    const socket = userSockets.get(address)
    if (socket && socket.readyState === 1) { // WebSocket.OPEN
      socket.send(JSON.stringify(message))
    }
  }

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

  async function handleGameAction(socket, data, dbService) {
    const { gameId, action, choice, player, powerLevel } = data
    console.log('🎯 Processing game action:', { gameId, action, choice, player })
    
    const db = dbService.getDatabase()
    
    switch (action) {
      case 'MAKE_CHOICE':
        // Get game from database
        db.get('SELECT * FROM games WHERE id = ?', [gameId], async (err, game) => {
          if (err || !game) {
            console.error('❌ Game not found:', gameId)
            return
          }
          
          // Get or create current round
          db.get(
            'SELECT * FROM game_rounds WHERE game_id = ? ORDER BY round_number DESC LIMIT 1',
            [gameId],
            async (err, currentRound) => {
              let roundNumber = 1
              let roundId = null
              
              if (currentRound) {
                // Check if current round is complete
                if (currentRound.flip_result) {
                  // Create new round
                  roundNumber = currentRound.round_number + 1
                } else {
                  // Use existing round
                  roundNumber = currentRound.round_number
                  roundId = currentRound.id
                }
              }
              
              const isCreator = player === game.creator
              const columnName = isCreator ? 'creator_choice' : 'challenger_choice'
              
              if (roundId) {
                // Update existing round
                db.run(
                  `UPDATE game_rounds SET ${columnName} = ? WHERE id = ?`,
                  [choice, roundId],
                  (err) => {
                    if (err) {
                      console.error('❌ Error updating round:', err)
                      return
                    }
                    console.log('✅ Updated round with choice:', { roundId, player, choice })
                    
                    // Check if both players have made choices
                    checkAndProcessRound(gameId, roundId)
                  }
                )
              } else {
                // Create new round
                db.run(
                  `INSERT INTO game_rounds (game_id, round_number, ${columnName}) VALUES (?, ?, ?)`,
                  [gameId, roundNumber, choice],
                  function(err) {
                    if (err) {
                      console.error('❌ Error creating round:', err)
                      return
                    }
                    console.log('✅ Created new round with choice:', { roundNumber, player, choice })
                    
                    // Check if both players have made choices
                    checkAndProcessRound(gameId, this.lastID)
                  }
                )
              }
            }
          )
        })
        break
        
      case 'FLIP_COIN':
        handleFlipCoin(socket, data, dbService)
        break
        
      default:
        console.log('⚠️ Unhandled game action:', action)
    }
  }

  function checkAndProcessRound(gameId, roundId) {
    const db = dbService.getDatabase()
    
    db.get(
      'SELECT * FROM game_rounds WHERE id = ?',
      [roundId],
      (err, round) => {
        if (err || !round) {
          console.error('❌ Round not found:', roundId)
          return
        }
        
        // Check if both players have made choices
        if (round.creator_choice && round.challenger_choice) {
          console.log('🎯 Both players have chosen, processing round:', round)
          
          // Generate flip result
          const result = Math.random() < 0.5 ? 'heads' : 'tails'
          const creatorWins = round.creator_choice === result
          
          // Get game info to determine winner
          db.get('SELECT * FROM games WHERE id = ?', [gameId], (err, game) => {
            if (err || !game) {
              console.error('❌ Game not found for round processing:', gameId)
              return
            }
            
            const roundWinner = creatorWins ? game.creator : game.challenger
            
            // Update round with result
            db.run(
              'UPDATE game_rounds SET flip_result = ?, round_winner = ? WHERE id = ?',
              [result, roundWinner, roundId],
              (err) => {
                if (err) {
                  console.error('❌ Error updating round result:', err)
                  return
                }
                
                console.log('✅ Round result updated:', { result, roundWinner })
                
                // Broadcast result to room
                broadcastToRoom(gameId, {
                  type: 'round_result',
                  result,
                  roundWinner,
                  roundNumber: round.round_number,
                  creatorChoice: round.creator_choice,
                  challengerChoice: round.challenger_choice
                })
                
                // Check if game is complete
                checkGameCompletion(gameId)
              }
            )
          })
        } else {
          console.log('⏳ Waiting for both players to choose...')
          
          // Broadcast choice made
          broadcastToRoom(gameId, {
            type: 'choice_made',
            roundNumber: round.round_number,
            player: round.creator_choice ? game.challenger : game.creator
          })
        }
      }
    )
  }

  function checkGameCompletion(gameId) {
    const db = dbService.getDatabase()
    
    db.all(
      'SELECT round_winner, COUNT(*) as wins FROM game_rounds WHERE game_id = ? AND round_winner IS NOT NULL GROUP BY round_winner',
      [gameId],
      (err, results) => {
        if (err) {
          console.error('❌ Error checking game completion:', err)
          return
        }
        
        // Get game info
        db.get('SELECT * FROM games WHERE id = ?', [gameId], (err, game) => {
          if (err || !game) {
            console.error('❌ Game not found for completion check:', gameId)
            return
          }
          
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
          
          if (gameComplete) {
            console.log('🏆 Game completed! Winner:', gameWinner)
            
            // Update game status
            db.run(
              'UPDATE games SET status = ?, winner = ? WHERE id = ?',
              ['completed', gameWinner, gameId],
              (err) => {
                if (err) {
                  console.error('❌ Error updating game status:', err)
                  return
                }
                
                // Broadcast game completion
                broadcastToRoom(gameId, {
                  type: 'game_completed',
                  winner: gameWinner,
                  creatorWins: wins[game.creator] || 0,
                  challengerWins: wins[game.challenger] || 0
                })
                
                // Complete game on blockchain if available
                if (blockchainService && blockchainService.hasOwnerWallet() && game.blockchain_game_id) {
                  blockchainService.completeGameOnChain(game.blockchain_game_id, gameWinner)
                    .then(() => console.log('✅ Game completed on blockchain'))
                    .catch(err => console.error('❌ Error completing game on blockchain:', err))
                }
              }
            )
          } else {
            // Broadcast current score
            broadcastToRoom(gameId, {
              type: 'score_update',
              creatorWins: wins[game.creator] || 0,
              challengerWins: wins[game.challenger] || 0
            })
          }
        })
      }
    )
  }

  async function handleFlipCoin(socket, data, dbService) {
    const { gameId } = data
    
    const db = dbService.getDatabase()
    
    // Get current round
    db.get(
      'SELECT * FROM game_rounds WHERE game_id = ? ORDER BY round_number DESC LIMIT 1',
      [gameId],
      (err, round) => {
        if (err || !round) {
          console.error('❌ No active round found for game:', gameId)
          return
        }
        
        if (!round.creator_choice || !round.challenger_choice) {
          console.error('❌ Both players must choose before flipping')
          return
        }
        
        if (round.flip_result) {
          console.error('❌ Round already has a result')
          return
        }
        
        // Generate flip result
        const result = Math.random() < 0.5 ? 'heads' : 'tails'
        const creatorWins = round.creator_choice === result
        
        // Get game info
        db.get('SELECT * FROM games WHERE id = ?', [gameId], (err, game) => {
          if (err || !game) {
            console.error('❌ Game not found for flip:', gameId)
            return
          }
          
          const roundWinner = creatorWins ? game.creator : game.challenger
          
          // Update round
          db.run(
            'UPDATE game_rounds SET flip_result = ?, round_winner = ? WHERE id = ?',
            [result, roundWinner, round.id],
            (err) => {
              if (err) {
                console.error('❌ Error updating flip result:', err)
                return
              }
              
              console.log('✅ Flip result recorded:', { result, roundWinner })
              
              // Broadcast result
              broadcastToRoom(gameId, {
                type: 'flip_result',
                result,
                roundWinner,
                roundNumber: round.round_number,
                creatorChoice: round.creator_choice,
                challengerChoice: round.challenger_choice
              })
              
              // Check game completion
              checkGameCompletion(gameId)
            }
          )
        })
      }
    )
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
  function handleOfferAccepted(socket, data) {
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

  return {
    broadcastToRoom,
    broadcastToAll,
    getUserSocket,
    sendToUser
  }
}

module.exports = { createWebSocketHandlers } 