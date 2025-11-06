/**
 * Server-side Flip Integration Example
 * This shows how to integrate the FlipService with your existing server
 * 
 * Add this to your existing server.js file or create a separate flip handler
 */

const flipService = require('./services/FlipService') // Import the flip service

// Socket.io event handlers for flip mechanics
function setupFlipHandlers(io) {
  console.log('🎮 Setting up flip handlers for Glass Tube Game')

  io.on('connection', (socket) => {
    console.log('🔌 Client connected for flip game:', socket.id)

    // ===== FLIP SESSION MANAGEMENT =====

    /**
     * Handle coin flip request from client
     */
    socket.on('request_coin_flip', async (flipRequest) => {
      try {
        console.log('🪙 Flip request received:', flipRequest)

        // Validate the request
        if (!flipRequest.gameId || !flipRequest.playerAddress) {
          throw new Error('Invalid flip request: missing gameId or playerAddress')
        }

        // Start flip session
        const response = await flipService.startFlipSession(flipRequest)
        
        // Send response back to client
        socket.emit('flip_session_started', response)
        
        console.log(`✅ Flip session started: ${response.flipId}`)

      } catch (error) {
        console.error('❌ Error starting flip session:', error)
        socket.emit('flip_error', { 
          error: error.message,
          request: flipRequest 
        })
      }
    })

    /**
     * Handle flip resolution when coin stops
     */
    socket.on('resolve_flip', async (resolveRequest) => {
      try {
        console.log('🎯 Flip resolve request:', resolveRequest)

        const { flipId } = resolveRequest

        if (!flipId) {
          throw new Error('Invalid resolve request: missing flipId')
        }

        // Resolve the flip
        const result = await flipService.resolveFlipSession(flipId)
        
        // Send result to all players in the game room
        const gameId = result.gameId || 'unknown'
        io.to(`game_${gameId}`).emit('coin_flip_result', result)
        
        console.log(`🎲 Flip resolved: ${flipId} -> ${result.result}`)

      } catch (error) {
        console.error('❌ Error resolving flip:', error)
        socket.emit('flip_error', { 
          error: error.message,
          request: resolveRequest 
        })
      }
    })

    /**
     * Handle flip verification requests
     */
    socket.on('verify_flip', async (verifyRequest) => {
      try {
        console.log('🔍 Flip verification request:', verifyRequest)

        const { flipId } = verifyRequest

        if (!flipId) {
          throw new Error('Invalid verify request: missing flipId')
        }

        // Verify the flip
        const verification = await flipService.verifyFlipResult(flipId)
        
        socket.emit('flip_verification', verification)
        
        console.log(`✅ Flip verified: ${flipId}`)

      } catch (error) {
        console.error('❌ Error verifying flip:', error)
        socket.emit('flip_error', { 
          error: error.message,
          request: verifyRequest 
        })
      }
    })

    // ===== GAME STATE MANAGEMENT =====

    /**
     * Handle 4-player game state updates
     */
    socket.on('update_game_state', async (gameState) => {
      try {
        console.log('🔄 Game state update:', gameState.gameId)

        // Validate game state
        if (!gameState.gameId) {
          throw new Error('Invalid game state: missing gameId')
        }

        // Update game state in database
        await updateGameStateInDatabase(gameState)
        
        // Broadcast to all players in the game
        socket.to(`game_${gameState.gameId}`).emit('game_state_updated', gameState)
        
        console.log(`✅ Game state updated for: ${gameState.gameId}`)

      } catch (error) {
        console.error('❌ Error updating game state:', error)
        socket.emit('game_error', { 
          error: error.message,
          gameId: gameState.gameId 
        })
      }
    })

    /**
     * Handle player elimination
     */
    socket.on('player_eliminated', async (eliminationData) => {
      try {
        console.log('💀 Player eliminated:', eliminationData)

        const { gameId, playerAddress, reason } = eliminationData

        // Update player status in database
        await eliminatePlayerInDatabase(gameId, playerAddress, reason)
        
        // Broadcast elimination to all players
        io.to(`game_${gameId}`).emit('player_eliminated_broadcast', {
          gameId,
          playerAddress,
          reason,
          timestamp: Date.now()
        })
        
        console.log(`✅ Player eliminated: ${playerAddress} from ${gameId}`)

      } catch (error) {
        console.error('❌ Error eliminating player:', error)
        socket.emit('game_error', { 
          error: error.message,
          elimination: eliminationData 
        })
      }
    })

    // ===== CLEANUP =====

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id)
    })
  })

  // Cleanup old flip sessions periodically
  setInterval(() => {
    flipService.cleanupOldSessions()
  }, 60 * 60 * 1000) // Every hour
}

// ===== DATABASE INTEGRATION HELPERS =====

/**
 * Update game state in database
 */
async function updateGameStateInDatabase(gameState) {
  // TODO: Implement your database update logic here
  // This is where you'd update your PostgreSQL/MongoDB/etc.
  
  console.log('💾 Updating game state in database:', gameState.gameId)
  
  // Example PostgreSQL update:
  // await db.query(`
  //   UPDATE battle_royale_games 
  //   SET current_players = $1, phase = $2, updated_at = NOW()
  //   WHERE game_id = $3
  // `, [gameState.currentPlayers, gameState.phase, gameState.gameId])
}

/**
 * Eliminate player in database
 */
async function eliminatePlayerInDatabase(gameId, playerAddress, reason) {
  // TODO: Implement your database update logic here
  
  console.log('💾 Eliminating player in database:', { gameId, playerAddress, reason })
  
  // Example PostgreSQL update:
  // await db.query(`
  //   UPDATE battle_royale_players 
  //   SET is_active = false, eliminated_at = NOW(), elimination_reason = $1
  //   WHERE game_id = $2 AND player_address = $3
  // `, [reason, gameId, playerAddress])
}

// ===== EXPORTS =====

module.exports = {
  setupFlipHandlers,
  updateGameStateInDatabase,
  eliminatePlayerInDatabase
}

/**
 * INTEGRATION INSTRUCTIONS:
 * 
 * 1. Add this to your existing server.js:
 *    const { setupFlipHandlers } = require('./flip-integration-example')
 *    setupFlipHandlers(io)
 * 
 * 2. Update your database schema to support 4-player games:
 *    - Change max_players from 6 to 4
 *    - Update any hardcoded player count references
 * 
 * 3. Update your battle royale game creation logic:
 *    - Change from 6 players to 4 players
 *    - Update entry fee calculations
 * 
 * 4. Test the integration:
 *    - Create a 4-player game
 *    - Join with multiple players
 *    - Test the flip mechanics
 *    - Verify server authority
 */
