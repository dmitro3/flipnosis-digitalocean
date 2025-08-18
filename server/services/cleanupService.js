const { ethers } = require('ethers')

class CleanupService {
  constructor(dbService, blockchainService) {
    this.dbService = dbService
    this.blockchainService = blockchainService
    this.cleanupInterval = null
    this.CLEANUP_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes
    this.MAX_AGE_MINUTES = 10 // 10 minutes for games without NFT deposits
    this.CONTRACT_CHECK_COOLDOWN_MS = 2 * 60 * 1000 // 2 minutes between contract checks
  }

  /**
   * Start the cleanup service
   */
  start() {
    console.log('🧹 Starting cleanup service...')
    
    // Run initial cleanup
    this.runCleanup()
    
    // Set up periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.runCleanup()
    }, this.CLEANUP_INTERVAL_MS)
    
    console.log(`✅ Cleanup service started - running every ${this.CLEANUP_INTERVAL_MS / 1000 / 60} minutes`)
  }

  /**
   * Stop the cleanup service
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
      console.log('🛑 Cleanup service stopped')
    }
  }

  /**
   * Main cleanup function
   */
  async runCleanup() {
    try {
      console.log('🧹 Running cleanup...')
      
      // Get games that need cleanup
      const gamesToCheck = await this.getGamesNeedingCleanup()
      console.log(`📋 Found ${gamesToCheck.length} games to check`)
      
      let cleanedCount = 0
      let verifiedCount = 0
      
      for (const game of gamesToCheck) {
        try {
          const result = await this.processGame(game)
          if (result.cleaned) {
            cleanedCount++
          } else if (result.verified) {
            verifiedCount++
          }
        } catch (error) {
          console.error(`❌ Error processing game ${game.id}:`, error.message)
        }
      }
      
      console.log(`✅ Cleanup completed: ${cleanedCount} games cleaned, ${verifiedCount} NFTs verified`)
      
    } catch (error) {
      console.error('❌ Cleanup service error:', error)
    }
  }

  /**
   * Get games that need cleanup or verification
   */
  async getGamesNeedingCleanup() {
    const cutoffTime = new Date(Date.now() - (this.MAX_AGE_MINUTES * 60 * 1000))
    
    return new Promise((resolve, reject) => {
      this.dbService.db.all(`
        SELECT * FROM games 
        WHERE (
          -- Games without NFT deposits older than MAX_AGE_MINUTES
          (nft_deposited = false AND created_at < ? AND status IN ('waiting_challenger', 'waiting'))
          OR
          -- Games that need contract verification (not checked recently)
          (nft_deposited = true AND nft_deposit_verified = false AND 
           (last_nft_check_time IS NULL OR last_nft_check_time < ?))
        )
        ORDER BY created_at ASC
      `, [cutoffTime.toISOString(), new Date(Date.now() - this.CONTRACT_CHECK_COOLDOWN_MS).toISOString()], (err, rows) => {
        if (err) reject(err)
        else resolve(rows || [])
      })
    })
  }

  /**
   * Process a single game for cleanup or verification
   */
  async processGame(game) {
    const now = new Date()
    
    // Update last check time
    await this.updateLastCheckTime(game.id)
    
    if (!game.nft_deposited) {
      // Game doesn't have NFT deposited - check if it's old enough to clean up
      const gameAge = now.getTime() - new Date(game.created_at).getTime()
      const maxAgeMs = this.MAX_AGE_MINUTES * 60 * 1000
      
      if (gameAge > maxAgeMs) {
        console.log(`🗑️ Cleaning up old game ${game.id} (${Math.round(gameAge / 1000 / 60)} minutes old)`)
        await this.cleanupGame(game.id)
        return { cleaned: true, verified: false }
      }
    } else if (!game.nft_deposit_verified) {
      // Game has NFT deposited but not verified - check contract
      console.log(`🔍 Verifying NFT deposit for game ${game.id}`)
      const verified = await this.verifyNFTDeposit(game)
      
      if (verified) {
        await this.markNFTVerified(game.id)
        return { cleaned: false, verified: true }
      } else {
        // NFT not actually in contract - mark as not deposited
        console.log(`❌ NFT not found in contract for game ${game.id} - marking as not deposited`)
        await this.markNFTNotDeposited(game.id)
        return { cleaned: false, verified: false }
      }
    }
    
    return { cleaned: false, verified: false }
  }

  /**
   * Verify NFT deposit by checking the contract
   */
  async verifyNFTDeposit(game) {
    try {
      if (!this.blockchainService) {
        console.log('⚠️ Blockchain service not available for verification')
        return false
      }
      
      const gameState = await this.blockchainService.getGameState(game.id)
      
      if (!gameState.success) {
        console.log(`❌ Failed to get game state for ${game.id}:`, gameState.error)
        return false
      }
      
      const hasNFT = gameState.gameState.nftDeposit.hasDeposit
      console.log(`🔍 Game ${game.id} NFT deposit status:`, hasNFT)
      
      return hasNFT
      
    } catch (error) {
      console.error(`❌ Error verifying NFT deposit for game ${game.id}:`, error.message)
      return false
    }
  }

  /**
   * Clean up a game by marking it as cancelled
   */
  async cleanupGame(gameId) {
    return new Promise((resolve, reject) => {
      this.dbService.db.run(`
        UPDATE games 
        SET status = 'cancelled', 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [gameId], function(err) {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  /**
   * Mark NFT as verified in database
   */
  async markNFTVerified(gameId) {
    return new Promise((resolve, reject) => {
      this.dbService.db.run(`
        UPDATE games 
        SET nft_deposit_verified = true,
            last_nft_check_time = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [gameId], function(err) {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  /**
   * Mark NFT as not deposited (contract verification failed)
   */
  async markNFTNotDeposited(gameId) {
    return new Promise((resolve, reject) => {
      this.dbService.db.run(`
        UPDATE games 
        SET nft_deposited = false,
            nft_deposit_verified = false,
            last_nft_check_time = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [gameId], function(err) {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  /**
   * Update last check time for a game
   */
  async updateLastCheckTime(gameId) {
    return new Promise((resolve, reject) => {
      this.dbService.db.run(`
        UPDATE games 
        SET last_nft_check_time = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [gameId], function(err) {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  /**
   * Mark NFT as deposited (called when NFT is successfully deposited)
   */
  async markNFTDeposited(gameId, depositHash) {
    return new Promise((resolve, reject) => {
      this.dbService.db.run(`
        UPDATE games 
        SET nft_deposited = true,
            nft_deposit_time = CURRENT_TIMESTAMP,
            nft_deposit_hash = ?,
            nft_deposit_verified = true,
            last_nft_check_time = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [depositHash, gameId], function(err) {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  /**
   * Get cleanup statistics
   */
  async getCleanupStats() {
    const cutoffTime = new Date(Date.now() - (this.MAX_AGE_MINUTES * 60 * 1000))
    
    return new Promise((resolve, reject) => {
      this.dbService.db.get(`
        SELECT 
          COUNT(*) as total_games,
          SUM(CASE WHEN nft_deposited = false AND created_at < ? THEN 1 ELSE 0 END) as old_games_without_nft,
          SUM(CASE WHEN nft_deposited = true AND nft_deposit_verified = false THEN 1 ELSE 0 END) as games_needing_verification,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_games
        FROM games
      `, [cutoffTime.toISOString()], (err, row) => {
        if (err) reject(err)
        else resolve(row || {})
      })
    })
  }
}

module.exports = CleanupService
