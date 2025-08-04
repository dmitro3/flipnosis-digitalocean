const crypto = require('crypto')
const CoinStreamService = require('../services/coinStream')

// Room management
const rooms = new Map()
const socketRooms = new Map()
const userSockets = new Map()

// Game state tracking
const gamePowerCharges = new Map() // Track power charges per game
const gameTurnState = new Map() // Track whose turn it is

// Initialize coin streaming service
const coinStreamService = new CoinStreamService()

// Create WebSocket handlers
function createWebSocketHandlers(wss, dbService, blockchainService) {
  // Handle WebSocket connections
  wss.on('connection', (socket, req) => {
    socket.id = crypto.randomBytes(16).toString('hex')
    console.log(`🔌 New WebSocket connection: ${socket.id}`)
    console.log(`🌐 Connection from: ${req.socket.remoteAddress}`)
    console.log(`📊 Total connected clients: ${wss.clients.size}`)
    
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
        console.log(`📨 Raw message from ${socket.id}:`, message.toString())
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
    if (!rooms.has(roomId)) {
      console.log(`⚠️ Room ${roomId} not found, creating it`)
      rooms.set(roomId, new Set())
    }
    
    const room = rooms.get(roomId)
    const messageStr = JSON.stringify(message)
    
    console.log(`📢 Broadcasting to room ${roomId}:`, {
      messageType: message.type,
      roomSize: room.size,
      connectedClients: wss.clients.size,
      message: message
    })
    
    let successfulBroadcasts = 0
    let failedBroadcasts = 0
    
    // Get all active WebSocket clients
    const activeClients = Array.from(wss.clients).filter(client => 
      client.readyState === 1 // WebSocket.OPEN
    )
    
    console.log(`🔍 Active clients: ${activeClients.length}, Room members: ${room.size}`)
    
    // Broadcast to room members
    room.forEach(socketId => {
      const client = activeClients.find(s => s.id === socketId)
      if (client) {
        try {
          client.send(messageStr)
          successfulBroadcasts++
          console.log(`✅ Sent message to client ${socketId}`)
        } catch (error) {
          console.error(`❌ Failed to send to client ${socketId}:`, error)
          failedBroadcasts++
          // Remove failed client from room
          room.delete(socketId)
        }
      } else {
        console.log(`⚠️ Client ${socketId} not found or not connected, removing from room`)
        room.delete(socketId)
        failedBroadcasts++
      }
    })
    
    // Also try to broadcast to any clients that might not be in the room but should receive the message
    // This is a safety net for connection issues
    if (message.type === 'player_choice_made' || message.type === 'both_choices_made' || message.type === 'power_charged') {
      activeClients.forEach(client => {
        if (client.address && !room.has(client.id)) {
          try {
            client.send(messageStr)
            console.log(`📤 Sent message to non-room client: ${client.address}`)
          } catch (error) {
            console.error(`❌ Failed to send to non-room client:`, error)
          }
        }
      })
    }
    
    console.log(`✅ Broadcast complete: ${successfulBroadcasts} successful, ${failedBroadcasts} failed`)
    
    // Clean up empty rooms
    if (room.size === 0) {
      rooms.delete(roomId)
      console.log(`🧹 Cleaned up empty room: ${roomId}`)
    }
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

  // Add a function to ensure room membership
  function ensureRoomMembership(socket, roomId) {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set())
    }
    
    const room = rooms.get(roomId)
    if (!room.has(socket.id)) {
      room.add(socket.id)
      socketRooms.set(socket.id, roomId)
      console.log(`✅ Added socket ${socket.id} to room ${roomId}`)
    }
  }

  function handleJoinRoom(socket, data) {
    const { roomId } = data
    
    console.log(`👥 Socket ${socket.id} requesting to join room ${roomId}`)
    console.log(`🏠 Current rooms:`, Array.from(rooms.keys()))
    console.log(`👥 Current room members:`, Array.from(rooms.values()).map(room => room.size))
    
    // Leave previous room if any
    const oldRoom = socketRooms.get(socket.id)
    if (oldRoom && rooms.has(oldRoom)) {
      rooms.get(oldRoom).delete(socket.id)
      console.log(`👋 Socket ${socket.id} left old room ${oldRoom}`)
    }
    
    // Join new room
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set())
      console.log(`🏠 Created new room: ${roomId}`)
    }
    
    const room = rooms.get(roomId)
    room.add(socket.id)
    socketRooms.set(socket.id, roomId)
    
    console.log(`👥 Socket ${socket.id} joined room ${roomId} (${room.size} members total)`)
    
    // Send confirmation
    try {
      socket.send(JSON.stringify({
        type: 'room_joined',
        roomId: roomId,
        members: room.size
      }))
    } catch (error) {
      console.error('❌ Failed to send room join confirmation:', error)
    }
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
        console.log('🎯 Player making choice:', { player, choice, gameId })
        
        // Immediately broadcast the choice to the room so other player sees it
        broadcastToRoom(gameId, {
          type: 'player_choice_made',
          gameId,
          player,
          choice,
          timestamp: Date.now()
        })
        
        // Get game from database to check both players
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
                    checkAndProcessRound(gameId, roundId, game, db)
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
                    checkAndProcessRound(gameId, this.lastID, game, db)
                  }
                )
              }
            }
          )
        })
        break
        
      case 'POWER_CHARGE_START':
        console.log('⚡ Power charge started:', { player, gameId })
        
        // Broadcast power charge start to room
        broadcastToRoom(gameId, {
          type: 'power_charge_started',
          gameId,
          player,
          timestamp: Date.now()
        })
        break
        
      case 'POWER_CHARGED':
        console.log('⚡ Power charged:', { player, powerLevel, gameId })
        
        // Check if it's the player's turn
        const turnState = gameTurnState.get(gameId)
        if (!turnState) {
          console.log('⚠️ No turn state found, allowing power charge')
        } else if (turnState.currentTurn !== player) {
          console.log('⚠️ Not player\'s turn, ignoring power charge:', { 
            currentTurn: turnState.currentTurn, 
            chargingPlayer: player 
          })
          return
        }
        
        // Track power charge for this game
        if (!gamePowerCharges.has(gameId)) {
          gamePowerCharges.set(gameId, new Map())
        }
        const powerCharges = gamePowerCharges.get(gameId)
        powerCharges.set(player, powerLevel)
        
        // Broadcast power charge to room
        broadcastToRoom(gameId, {
          type: 'power_charged',
          gameId,
          player,
          powerLevel,
          timestamp: Date.now()
        })
        
        // Switch turns if both players haven't charged yet
        if (turnState) {
          const db = dbService.getDatabase()
          db.get('SELECT * FROM games WHERE id = ?', [gameId], (err, game) => {
            if (err || !game) return
            
            const otherPlayer = player === game.creator ? game.challenger : game.creator
            const otherPlayerCharged = powerCharges.has(otherPlayer)
            
            if (!otherPlayerCharged) {
              // Switch to other player's turn
              turnState.currentTurn = otherPlayer
              gameTurnState.set(gameId, turnState)
              
              console.log('🔄 Switched turn to:', otherPlayer)
              
              // Broadcast turn change
              broadcastToRoom(gameId, {
                type: 'turn_changed',
                gameId,
                currentTurn: otherPlayer,
                message: `It's ${otherPlayer.slice(0, 6)}...'s turn to charge power!`
              })
            }
          })
        }
        
        // Check if both players have charged and trigger flip
        console.log('🎯 Calling checkAndTriggerFlip for game:', gameId)
        checkAndTriggerFlip(gameId, dbService)
        break
        
      case 'AUTO_FLIP':
      case 'AUTO_FLIP_TIMEOUT':
        console.log('🎲 Auto flip triggered:', { player, choice, gameId })
        
        // Handle auto-flip for Round 5 or timeout
        broadcastToRoom(gameId, {
          type: 'auto_flip_triggered',
          gameId,
          choice,
          player,
          timestamp: Date.now()
        })
        break
        
      default:
        console.log('⚠️ Unhandled game action:', action)
    }
  }

  // Check if both players have charged and trigger flip
  function checkAndTriggerFlip(gameId, dbService) {
    console.log('🎲 checkAndTriggerFlip called for game:', gameId)
    const db = dbService.getDatabase()
    
    // Get game info to identify both players
    db.get('SELECT * FROM games WHERE id = ?', [gameId], (err, game) => {
      if (err || !game) {
        console.error('❌ Game not found for flip check:', gameId)
        return
      }
      
      const powerCharges = gamePowerCharges.get(gameId)
      if (!powerCharges) {
        console.log('⏳ No power charges tracked yet for game:', gameId)
        return
      }
      
      const creatorPower = powerCharges.get(game.creator)
      const challengerPower = powerCharges.get(game.challenger)
      
      console.log('🔍 Checking power charges:', {
        gameId,
        creator: game.creator,
        challenger: game.challenger,
        creatorPower,
        challengerPower,
        hasBothCharged: creatorPower && challengerPower
      })
      
      // Check if both players have charged
      if (creatorPower && challengerPower) {
        console.log('🎲 Both players have charged! Triggering server-side flip...')
        
        // Get current round to ensure both players have made choices
        db.get(
          'SELECT * FROM game_rounds WHERE game_id = ? ORDER BY round_number DESC LIMIT 1',
          [gameId],
          (err, round) => {
            if (err || !round) {
              console.error('❌ No active round found for flip:', gameId)
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
            const roundWinner = creatorWins ? game.creator : game.challenger
            
            console.log('🎲 Flip result generated:', {
              result,
              creatorChoice: round.creator_choice,
              challengerChoice: round.challenger_choice,
              roundWinner,
              creatorPower,
              challengerPower
            })
            
            // Initialize coin scene if not already done
            if (!coinStreamService.scenes.has(gameId)) {
              // Parse coin data from game
              let coinData = {}
              try {
                if (game.coin_data) {
                  coinData = JSON.parse(game.coin_data)
                }
              } catch (e) {
                console.warn('⚠️ Could not parse coin data, using defaults')
              }
              
              coinStreamService.initializeGameScene(gameId, coinData)
            }
            
            // Start server-side flip animation
            console.log('🎬 Starting server-side flip animation for game:', gameId)
            const animationStarted = coinStreamService.startFlipAnimation(
              gameId, 
              result, 
              creatorPower, 
              challengerPower, 
              3000 // 3 second duration
            )
            
            if (animationStarted) {
              console.log('🎬 Server-side flip animation started')
              
              // Broadcast flip start to both players
              broadcastToRoom(gameId, {
                type: 'FLIP_STARTED',
                gameId,
                result,
                creatorPower,
                challengerPower,
                duration: 3000
              })
              
              // Start streaming animation frames
              setTimeout(() => {
                coinStreamService.streamAnimation(gameId, { broadcastToRoom: (roomId, message) => broadcastToRoom(roomId, message) }, gameId)
              }, 100)
              
              // Update round with flip result after animation completes
              setTimeout(() => {
                db.run(
                  'UPDATE game_rounds SET flip_result = ?, round_winner = ? WHERE id = ?',
                  [result, roundWinner, round.id],
                  (err) => {
                    if (err) {
                      console.error('❌ Error updating flip result:', err)
                      return
                    }
                    
                    console.log('✅ Flip result recorded:', { result, roundWinner })
                    
                    // Broadcast final result
                    broadcastToRoom(gameId, {
                      type: 'FLIP_RESULT',
                      gameId,
                      result,
                      roundWinner,
                      roundNumber: round.round_number,
                      creatorChoice: round.creator_choice,
                      challengerChoice: round.challenger_choice,
                      creatorPower,
                      challengerPower
                    })
                    
                    // Clear power charges for this round
                    gamePowerCharges.delete(gameId)
                    
                    // Check game completion
                    checkGameCompletion(gameId)
                  }
                )
              }, 3000) // Wait for animation to complete
              
            } else {
              console.error('❌ Failed to start flip animation')
            }
          }
        )
      } else {
        console.log('⏳ Waiting for both players to charge power...')
      }
    })
  }

  function checkAndProcessRound(gameId, roundId, game, db) {
    db.get(
      'SELECT * FROM game_rounds WHERE id = ?',
      [roundId],
      (err, round) => {
        if (err || !round) {
          console.error('❌ Round not found:', roundId)
          return
        }
        
        console.log('🔍 Checking round completion:', {
          roundId,
          creatorChoice: round.creator_choice,
          challengerChoice: round.challenger_choice,
          hasCreatorChoice: !!round.creator_choice,
          hasChallengerChoice: !!round.challenger_choice
        })
        
        // Check if both players have made choices
        if (round.creator_choice && round.challenger_choice) {
          console.log('🎯 Both players have chosen, transitioning to charging phase')
          
          // Set turn state - creator goes first
          gameTurnState.set(gameId, {
            currentTurn: game.creator,
            roundNumber: round.round_number,
            creatorChoice: round.creator_choice,
            challengerChoice: round.challenger_choice
          })
          
          // Broadcast that both players have chosen and game moves to charging phase
          broadcastToRoom(gameId, {
            type: 'choice_made_ready_to_flip',
            gameId,
            creatorChoice: round.creator_choice,
            challengerChoice: round.challenger_choice,
            roundNumber: round.round_number,
            currentTurn: game.creator,
            message: 'Both players have chosen! Creator goes first - hold the coin to charge power!'
          })
          
        } else if (round.creator_choice || round.challenger_choice) {
          // Only one player has chosen
          const waitingFor = round.creator_choice ? game.challenger : game.creator
          console.log('🎯 One player has chosen, waiting for:', waitingFor)
          
          // Broadcast that a player has chosen and waiting for the other
          broadcastToRoom(gameId, {
            type: 'choice_made_ready_to_flip',
            gameId,
            creatorChoice: round.creator_choice,
            challengerChoice: round.challenger_choice,
            roundNumber: round.round_number,
            waitingFor,
            message: 'Player has chosen! Waiting for other player to choose...'
          })
          
        } else {
          // No player has chosen yet
          console.log('⏳ Waiting for player to choose...')
          
          // Broadcast choice update
          broadcastToRoom(gameId, {
            type: 'choice_update',
            gameId,
            roundNumber: round.round_number,
            message: 'Choose heads or tails to begin!'
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
                
                // Clean up coin streaming resources
                coinStreamService.cleanupGame(gameId)
                
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