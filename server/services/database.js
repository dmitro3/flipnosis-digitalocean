const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const { ethers } = require('ethers')

class DatabaseService {
  constructor(databasePath) {
    this.databasePath = databasePath
    this.db = null
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      const database = new sqlite3.Database(this.databasePath, (err) => {
        if (err) {
          console.error('❌ Error opening database:', err)
          reject(err)
          return
        }
        console.log('✅ Connected to SQLite database at:', this.databasePath)
        
        // IMPORTANT: Since the database already exists with all tables,
        // we should NOT create tables, just verify they exist
        database.serialize(() => {
          // Verify critical tables exist
          database.get("SELECT name FROM sqlite_master WHERE type='table' AND name='games'", (err, result) => {
            if (err) {
              console.error('❌ Error checking games table:', err)
            } else if (result) {
              console.log('✅ Games table exists')
            } else {
              console.error('⚠️ Games table not found - database may be corrupted')
            }
          })
          
          database.get("SELECT name FROM sqlite_master WHERE type='table' AND name='profiles'", (err, result) => {
            if (err) {
              console.error('❌ Error checking profiles table:', err)
            } else if (result) {
              console.log('✅ Profiles table exists')
            } else {
              console.error('⚠️ Profiles table not found - database may be corrupted')
            }
          })

          database.get("SELECT name FROM sqlite_master WHERE type='table' AND name='listings'", (err, result) => {
            if (err) {
              console.error('❌ Error checking listings table:', err)
            } else if (result) {
              console.log('✅ Listings table exists')
            } else {
              console.error('⚠️ Listings table not found - database may be corrupted')
            }
          })

          database.get("SELECT name FROM sqlite_master WHERE type='table' AND name='offers'", (err, result) => {
            if (err) {
              console.error('❌ Error checking offers table:', err)
            } else if (result) {
              console.log('✅ Offers table exists')
            } else {
              console.error('⚠️ Offers table not found - database may be corrupted')
            }
          })

          database.get("SELECT name FROM sqlite_master WHERE type='table' AND name='game_rounds'", (err, result) => {
            if (err) {
              console.error('❌ Error checking game_rounds table:', err)
            } else if (result) {
              console.log('✅ Game rounds table exists')
            } else {
              console.error('⚠️ Game rounds table not found - database may be corrupted')
            }
          })
        })
        
        this.db = database
        resolve()
      })
    })
  }

  // Game management methods
  async getGameById(gameId) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM games WHERE id = ?', [gameId], (err, game) => {
        if (err) reject(err)
        else resolve(game)
      })
    })
  }

  async updateGameStatus(gameId, status) {
    return new Promise((resolve, reject) => {
      this.db.run('UPDATE games SET status = ? WHERE id = ?', [status, gameId], function(err) {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  async resetGameForNewOffers(game) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        UPDATE games SET 
          challenger = NULL, 
          offer_id = NULL, 
          price_usd = ?, 
          status = 'awaiting_challenger',
          deposit_deadline = NULL,
          challenger_deposited = false
        WHERE id = ?
      `, [game.asking_price || game.price_usd, game.id], function(err) {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  async updateListingStatus(listingId, status) {
    return new Promise((resolve, reject) => {
      this.db.run('UPDATE listings SET status = ? WHERE id = ?', [status, listingId], function(err) {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  // Profile management methods
  async getProfileByAddress(address) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM profiles WHERE address = ?', [address.toLowerCase()], (err, profile) => {
        if (err) reject(err)
        else resolve(profile)
      })
    })
  }

  async createOrUpdateProfile(profileData) {
    return new Promise((resolve, reject) => {
      const {
        address, name, avatar, headsImage, tailsImage, twitter, telegram,
        xp = 0, xp_name_earned = false, xp_avatar_earned = false,
        xp_heads_earned = false, xp_tails_earned = false,
        xp_twitter_earned = false, xp_telegram_earned = false
      } = profileData

      this.db.run(`
        INSERT OR REPLACE INTO profiles (
          address, name, avatar, headsImage, tailsImage, twitter, telegram,
          xp, xp_name_earned, xp_avatar_earned, xp_heads_earned, xp_tails_earned,
          xp_twitter_earned, xp_telegram_earned, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        address.toLowerCase(), name, avatar, headsImage, tailsImage, twitter, telegram,
        xp, xp_name_earned, xp_avatar_earned, xp_heads_earned, xp_tails_earned,
        xp_twitter_earned, xp_telegram_earned
      ], function(err) {
        if (err) reject(err)
        else resolve(this.lastID)
      })
    })
  }

  // Chat history methods
  async saveChatMessage(roomId, senderAddress, message, messageType = 'chat', messageData = null) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        INSERT INTO chat_messages (room_id, sender_address, message, message_type, message_data)
        VALUES (?, ?, ?, ?, ?)
      `, [roomId, senderAddress, message, messageType, messageData ? JSON.stringify(messageData) : null], function(err) {
        if (err) reject(err)
        else resolve(this.lastID)
      })
    })
  }

  async getChatHistory(roomId, limit = 100) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM chat_messages 
        WHERE room_id = ? 
        ORDER BY created_at ASC 
        LIMIT ?
      `, [roomId, limit], (err, messages) => {
        if (err) reject(err)
        else {
          const parsedMessages = messages.map(msg => ({
            ...msg,
            message_data: msg.message_data ? JSON.parse(msg.message_data) : null
          }))
          resolve(parsedMessages)
        }
      })
    })
  }

  // Game sharing methods
  async recordGameShare(gameId, playerAddress, platform) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT OR IGNORE INTO game_shares (game_id, player_address, share_platform)
         VALUES (?, ?, ?)`,
        [gameId, playerAddress.toLowerCase(), platform],
        function(err) {
          if (err) reject(err)
          else resolve(this.changes > 0)
        }
      )
    })
  }

  async hasSharedGame(gameId, playerAddress, platform) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT xp_awarded FROM game_shares 
         WHERE game_id = ? AND player_address = ? AND share_platform = ?`,
        [gameId, playerAddress.toLowerCase(), platform],
        (err, result) => {
          if (err) reject(err)
          else resolve(result ? result.xp_awarded : false)
        }
      )
    })
  }

  async markShareAsRewarded(gameId, playerAddress, platform) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE game_shares 
         SET xp_awarded = TRUE 
         WHERE game_id = ? AND player_address = ? AND share_platform = ?`,
        [gameId, playerAddress.toLowerCase(), platform],
        function(err) {
          if (err) reject(err)
          else resolve(this.changes > 0)
        }
      )
    })
  }

  // Game rounds methods
  async saveGameRound(roundData) {
    return new Promise((resolve, reject) => {
      const {
        game_id, round_number, creator_choice, challenger_choice,
        flip_result, round_winner, flipper_address, power_used = 0
      } = roundData

      this.db.run(`
        INSERT INTO game_rounds (
          game_id, round_number, creator_choice, challenger_choice,
          flip_result, round_winner, flipper_address, power_used, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        game_id, round_number, creator_choice, challenger_choice,
        flip_result, round_winner, flipper_address, power_used, new Date().toISOString()
      ], function(err) {
        if (err) reject(err)
        else resolve(this.lastID)
      })
    })
  }

  async getGameRounds(gameId) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM game_rounds 
        WHERE game_id = ? 
        ORDER BY round_number ASC
      `, [gameId], (err, rounds) => {
        if (err) reject(err)
        else resolve(rounds)
      })
    })
  }

  // Listing and offer methods
  async getListingById(listingId) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM listings WHERE id = ?', [listingId], (err, listing) => {
        if (err) reject(err)
        else resolve(listing)
      })
    })
  }

  async getOffersByListingId(listingId) {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM offers WHERE listing_id = ? ORDER BY created_at DESC', [listingId], (err, offers) => {
        if (err) reject(err)
        else resolve(offers)
      })
    })
  }

  async createOffer(offerData) {
    return new Promise((resolve, reject) => {
      const { id, listing_id, offerer_address, offer_price, message } = offerData
      
      this.db.run(`
        INSERT INTO offers (id, listing_id, offerer_address, offer_price, message)
        VALUES (?, ?, ?, ?, ?)
      `, [id, listing_id, offerer_address, offer_price, message], function(err) {
        if (err) reject(err)
        else resolve(this.lastID)
      })
    })
  }

  async updateOfferStatus(offerId, status) {
    return new Promise((resolve, reject) => {
      this.db.run('UPDATE offers SET status = ? WHERE id = ?', [status, offerId], function(err) {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  // User games and statistics
  async getUserGames(address) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM games 
        WHERE creator = ? OR challenger = ? 
        ORDER BY created_at DESC
      `, [address.toLowerCase(), address.toLowerCase()], (err, games) => {
        if (err) reject(err)
        else resolve(games)
      })
    })
  }

  async getUserStats(address) {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT 
          COUNT(*) as total_games,
          SUM(CASE WHEN winner = ? THEN 1 ELSE 0 END) as wins,
          SUM(CASE WHEN winner != ? AND winner IS NOT NULL THEN 1 ELSE 0 END) as losses
        FROM games 
        WHERE (creator = ? OR challenger = ?) AND status = 'completed'
      `, [address.toLowerCase(), address.toLowerCase(), address.toLowerCase(), address.toLowerCase()], (err, stats) => {
        if (err) reject(err)
        else resolve(stats)
      })
    })
  }

  // Leaderboard methods
  async getLeaderboard(limit = 50) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          p.address,
          p.name,
          p.avatar,
          p.xp,
          COUNT(g.id) as total_games,
          SUM(CASE WHEN g.winner = p.address THEN 1 ELSE 0 END) as wins
        FROM profiles p
        LEFT JOIN games g ON (g.creator = p.address OR g.challenger = p.address) AND g.status = 'completed'
        GROUP BY p.address
        ORDER BY p.xp DESC, wins DESC
        LIMIT ?
      `, [limit], (err, leaderboard) => {
        if (err) reject(err)
        else resolve(leaderboard)
      })
    })
  }

  // XP system methods
  async awardXP(address, amount, reason) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        UPDATE profiles 
        SET xp = xp + ?, updated_at = CURRENT_TIMESTAMP
        WHERE address = ?
      `, [amount, address.toLowerCase()], function(err) {
        if (err) reject(err)
        else resolve(this.changes > 0)
      })
    })
  }

  async markXPEarned(address, xpType) {
    return new Promise((resolve, reject) => {
      const fieldName = `xp_${xpType}_earned`
      this.db.run(`
        UPDATE profiles 
        SET ${fieldName} = TRUE, updated_at = CURRENT_TIMESTAMP
        WHERE address = ?
      `, [address.toLowerCase()], function(err) {
        if (err) reject(err)
        else resolve(this.changes > 0)
      })
    })
  }

  // Timeout and cleanup methods
  async getTimedOutGames(status, now) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM games WHERE status = ? AND deposit_deadline < ?`,
        [status, now],
        (err, games) => {
          if (err) reject(err)
          else resolve(games || [])
        }
      )
    })
  }

  async moveNFTToReady(game) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        INSERT OR REPLACE INTO ready_nfts (
          player_address, nft_contract, nft_token_id, nft_name, nft_image, nft_collection, source
        ) VALUES (?, ?, ?, ?, ?, ?, 'timeout_retention')
      `, [
        game.creator, game.nft_contract, game.nft_token_id, 
        game.nft_name, game.nft_image, game.nft_collection
      ], function(err) {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  async cancelGame(gameId) {
    return new Promise((resolve, reject) => {
      this.db.run('UPDATE games SET status = "cancelled" WHERE id = ?', [gameId], function(err) {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  getDatabase() {
    return this.db
  }
}

module.exports = { DatabaseService } 