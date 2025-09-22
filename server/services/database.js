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

          // Check and create Battle Royale tables if they don't exist
          database.get("SELECT name FROM sqlite_master WHERE type='table' AND name='battle_royale_games'", (err, result) => {
            if (err) {
              console.error('❌ Error checking battle_royale_games table:', err)
            } else if (result) {
              console.log('✅ Battle Royale games table exists')
            } else {
              console.log('⚠️ Battle Royale games table not found - creating it...')
              this.createBattleRoyaleTables(database)
            }
          })
        })
        
        this.db = database
        resolve()
      })
    })
  }

  createBattleRoyaleTables(database) {
    console.log('🔧 Creating Battle Royale tables...')
    
    // Create battle_royale_games table
    database.run(`
      CREATE TABLE IF NOT EXISTS battle_royale_games (
        id TEXT PRIMARY KEY,
        creator TEXT NOT NULL,
        nft_contract TEXT NOT NULL,
        nft_token_id TEXT NOT NULL,
        nft_name TEXT,
        nft_image TEXT,
        nft_collection TEXT,
        nft_chain TEXT DEFAULT 'base',
        entry_fee DECIMAL(20,8) NOT NULL,
        service_fee DECIMAL(20,8) NOT NULL,
        max_players INTEGER DEFAULT 8,
        current_players INTEGER DEFAULT 0,
        status TEXT DEFAULT 'filling',
        current_round INTEGER DEFAULT 1,
        target_result TEXT,
        round_deadline TIMESTAMP,
        winner_address TEXT,
        creator_payout DECIMAL(20,8) DEFAULT 0,
        platform_fee DECIMAL(20,8) DEFAULT 0,
        nft_deposited BOOLEAN DEFAULT 0,
        nft_deposit_time TIMESTAMP,
        nft_deposit_hash TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('❌ Error creating battle_royale_games table:', err)
      } else {
        console.log('✅ Created battle_royale_games table')
      }
    })

    // Create battle_royale_participants table
    database.run(`
      CREATE TABLE IF NOT EXISTS battle_royale_participants (
        game_id TEXT NOT NULL,
        player_address TEXT NOT NULL,
        slot_number INTEGER NOT NULL,
        entry_paid BOOLEAN DEFAULT 0,
        entry_amount DECIMAL(20,8),
        entry_payment_hash TEXT,
        eliminated_round INTEGER,
        final_choice TEXT,
        coin_result TEXT,
        coin_power INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        eliminated_at TIMESTAMP,
        PRIMARY KEY (game_id, player_address)
      )
    `, (err) => {
      if (err) {
        console.error('❌ Error creating battle_royale_participants table:', err)
      } else {
        console.log('✅ Created battle_royale_participants table')
      }
    })

    // Create battle_royale_rounds table
    database.run(`
      CREATE TABLE IF NOT EXISTS battle_royale_rounds (
        id TEXT PRIMARY KEY,
        game_id TEXT NOT NULL,
        round_number INTEGER NOT NULL,
        target_result TEXT NOT NULL,
        players_before INTEGER NOT NULL,
        players_eliminated INTEGER NOT NULL,
        eliminated_players TEXT,
        round_duration INTEGER DEFAULT 20,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('❌ Error creating battle_royale_rounds table:', err)
      } else {
        console.log('✅ Created battle_royale_rounds table')
      }
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

  async getGameByBlockchainId(blockchainGameId) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM games WHERE blockchain_game_id = ?', [blockchainGameId], (err, game) => {
        if (err) reject(err)
        else resolve(game)
      })
    })
  }

  // Unified getGame method that tries both ID formats
  async getGame(gameId) {
    return new Promise((resolve, reject) => {
      // First try the full game ID (e.g., "game_1757519849057_c6ac033837fd8420")
      this.db.get('SELECT * FROM games WHERE id = ?', [gameId], (err, game) => {
        if (err) {
          reject(err)
          return
        }
        
        if (game) {
          resolve(game)
          return
        }
        
        // If not found, try as blockchain_game_id
        this.db.get('SELECT * FROM games WHERE blockchain_game_id = ?', [gameId], (err, game) => {
          if (err) reject(err)
          else resolve(game)
        })
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

  // Get active offers for a game
  async getActiveOffers(gameId) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM offers 
        WHERE listing_id = ? AND status = 'pending'
        ORDER BY created_at DESC
      `, [gameId], (err, offers) => {
        if (err) reject(err)
        else resolve(offers || [])
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

  async saveOffer(roomId, fromAddress, toAddress, nftId, nftData) {
    return new Promise((resolve, reject) => {
      const offerId = `${roomId}_${fromAddress}_${toAddress}_${Date.now()}`
      this.db.run(`
        INSERT INTO offers (id, listing_id, offerer_address, offer_price, message, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [offerId, roomId, fromAddress, 0, JSON.stringify({ nftId, nftData }), 'pending', new Date().toISOString()], function(err) {
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

  async updateOfferStatusByDetails(roomId, fromAddress, toAddress, nftId, status) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        UPDATE offers 
        SET status = ? 
        WHERE listing_id = ? AND offerer_address = ? AND message LIKE ?
      `, [status, roomId, fromAddress, `%${nftId}%`], function(err) {
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

  // ===== BATTLE ROYALE METHODS =====
  
  // Create a new Battle Royale game
  async createBattleRoyaleGame(gameData) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO battle_royale_games (
          id, creator, nft_contract, nft_token_id, nft_name, nft_image, nft_collection, nft_chain,
          entry_fee, service_fee, max_players, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `
      
      this.db.run(sql, [
        gameData.id,
        gameData.creator,
        gameData.nft_contract,
        gameData.nft_token_id,
        gameData.nft_name,
        gameData.nft_image,
        gameData.nft_collection,
        gameData.nft_chain || 'base',
        gameData.entry_fee,
        gameData.service_fee,
        gameData.max_players || 8,
        'filling'
      ], function(err) {
        if (err) {
          console.error('❌ Error creating Battle Royale game:', err)
          reject(err)
        } else {
          console.log('✅ Battle Royale game created:', gameData.id)
          
          // Automatically add creator as first player (slot 0) with free entry
          const addCreatorSql = `
            INSERT INTO battle_royale_participants (
              game_id, player_address, slot_number, entry_paid, entry_amount, 
              status, joined_at
            ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
          `
          
          const self = this
          self.db.run(addCreatorSql, [
            gameData.id,
            gameData.creator,
            0, // Creator gets slot 0
            true, // Creator is marked as "paid" (free entry)
            0, // Creator pays nothing
            'active'
          ], function(creatorErr) {
            if (creatorErr) {
              console.error('❌ Error adding creator as participant:', creatorErr)
              // Don't reject the whole operation, just log the error
            } else {
              console.log('✅ Creator added as first participant:', gameData.creator)
            }
            
            // Update current_players count
            this.db.run(
              'UPDATE battle_royale_games SET current_players = 1 WHERE id = ?',
              [gameData.id],
              function(updateErr) {
                if (updateErr) {
                  console.error('❌ Error updating current_players count:', updateErr)
                } else {
                  console.log('✅ Updated current_players count to 1')
                }
                
                resolve({ id: gameData.id })
              }
            )
          })
        }
      })
    })
  }

  // Get Battle Royale game by ID
  async getBattleRoyaleGame(gameId) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM battle_royale_games WHERE id = ?', [gameId], (err, game) => {
        if (err) {
          console.error('❌ Error getting Battle Royale game:', err)
          reject(err)
        } else {
          resolve(game)
        }
      })
    })
  }

  // Get all Battle Royale games with optional status filter
  async getBattleRoyaleGames(status = null, limit = 50) {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM battle_royale_games'
      let params = []
      
      if (status) {
        sql += ' WHERE status = ?'
        params.push(status)
      }
      
      sql += ' ORDER BY created_at DESC LIMIT ?'
      params.push(limit)
      
      this.db.all(sql, params, (err, games) => {
        if (err) {
          console.error('❌ Error getting Battle Royale games:', err)
          reject(err)
        } else {
          resolve(games || [])
        }
      })
    })
  }

  // Add player to Battle Royale game
  async addBattleRoyalePlayer(gameId, playerData) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO battle_royale_participants (
          game_id, player_address, slot_number, entry_paid, entry_amount, 
          entry_payment_hash, status, joined_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `
      
      this.db.run(sql, [
        gameId,
        playerData.player_address,
        playerData.slot_number,
        playerData.entry_paid || false,
        playerData.entry_amount,
        playerData.entry_payment_hash,
        'active'
      ], function(err) {
        if (err) {
          console.error('❌ Error adding Battle Royale player:', err)
          reject(err)
        } else {
          console.log('✅ Player added to Battle Royale:', playerData.player_address)
          resolve({ playerId: this.lastID })
        }
      })
    })
  }

  // Get Battle Royale participants
  async getBattleRoyaleParticipants(gameId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM battle_royale_participants WHERE game_id = ? ORDER BY slot_number',
        [gameId],
        (err, participants) => {
          if (err) {
            console.error('❌ Error getting Battle Royale participants:', err)
            reject(err)
          } else {
            resolve(participants || [])
          }
        }
      )
    })
  }

  // Update Battle Royale game status
  async updateBattleRoyaleGame(gameId, updates) {
    return new Promise((resolve, reject) => {
      const fields = []
      const values = []
      
      Object.keys(updates).forEach(key => {
        fields.push(`${key} = ?`)
        values.push(updates[key])
      })
      
      if (fields.length === 0) {
        resolve({ changes: 0 })
        return
      }
      
      fields.push('updated_at = datetime(\'now\')')
      values.push(gameId)
      
      const sql = `UPDATE battle_royale_games SET ${fields.join(', ')} WHERE id = ?`
      
      this.db.run(sql, values, function(err) {
        if (err) {
          console.error('❌ Error updating Battle Royale game:', err)
          reject(err)
        } else {
          console.log(`✅ Battle Royale game updated: ${gameId}`)
          resolve({ changes: this.changes })
        }
      })
    })
  }

  // Update Battle Royale participant
  async updateBattleRoyaleParticipant(gameId, playerAddress, updates) {
    return new Promise((resolve, reject) => {
      const fields = []
      const values = []
      
      Object.keys(updates).forEach(key => {
        fields.push(`${key} = ?`)
        values.push(updates[key])
      })
      
      if (fields.length === 0) {
        resolve({ changes: 0 })
        return
      }
      
      values.push(gameId, playerAddress)
      const sql = `UPDATE battle_royale_participants SET ${fields.join(', ')} WHERE game_id = ? AND player_address = ?`
      
      this.db.run(sql, values, function(err) {
        if (err) {
          console.error('❌ Error updating Battle Royale participant:', err)
          reject(err)
        } else {
          console.log(`✅ Battle Royale participant updated: ${playerAddress}`)
          resolve({ changes: this.changes })
        }
      })
    })
  }

  // Create Battle Royale round record
  async createBattleRoyaleRound(roundData) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO battle_royale_rounds (
          id, game_id, round_number, target_result, players_before, 
          players_eliminated, eliminated_players, surviving_players,
          round_duration, round_start_time, round_end_time, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `
      
      this.db.run(sql, [
        roundData.id,
        roundData.game_id,
        roundData.round_number,
        roundData.target_result,
        roundData.players_before,
        roundData.players_eliminated,
        JSON.stringify(roundData.eliminated_players),
        JSON.stringify(roundData.surviving_players),
        roundData.round_duration || 20,
        roundData.round_start_time,
        roundData.round_end_time
      ], function(err) {
        if (err) {
          console.error('❌ Error creating Battle Royale round:', err)
          reject(err)
        } else {
          console.log('✅ Battle Royale round created:', roundData.id)
          resolve({ id: roundData.id })
        }
      })
    })
  }

  // Get Battle Royale rounds for a game
  async getBattleRoyaleRounds(gameId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM battle_royale_rounds WHERE game_id = ? ORDER BY round_number',
        [gameId],
        (err, rounds) => {
          if (err) {
            console.error('❌ Error getting Battle Royale rounds:', err)
            reject(err)
          } else {
            // Parse JSON fields
            const parsedRounds = rounds.map(round => ({
              ...round,
              eliminated_players: JSON.parse(round.eliminated_players || '[]'),
              surviving_players: JSON.parse(round.surviving_players || '[]')
            }))
            resolve(parsedRounds)
          }
        }
      )
    })
  }

  // Create Battle Royale flip record
  async createBattleRoyaleFlip(flipData) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO battle_royale_flips (
          id, game_id, round_id, player_address, choice, power, result, flip_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `
      
      this.db.run(sql, [
        flipData.id,
        flipData.game_id,
        flipData.round_id,
        flipData.player_address,
        flipData.choice,
        flipData.power,
        flipData.result
      ], function(err) {
        if (err) {
          console.error('❌ Error creating Battle Royale flip:', err)
          reject(err)
        } else {
          console.log('✅ Battle Royale flip recorded:', flipData.id)
          resolve({ id: flipData.id })
        }
      })
    })
  }

  // Get Battle Royale flips for a round
  async getBattleRoyaleFlips(gameId, roundId = null) {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM battle_royale_flips WHERE game_id = ?'
      let params = [gameId]
      
      if (roundId) {
        sql += ' AND round_id = ?'
        params.push(roundId)
      }
      
      sql += ' ORDER BY flip_time'
      
      this.db.all(sql, params, (err, flips) => {
        if (err) {
          console.error('❌ Error getting Battle Royale flips:', err)
          reject(err)
        } else {
          resolve(flips || [])
        }
      })
    })
  }

  // Save Battle Royale chat message
  async saveBattleRoyaleChatMessage(gameId, senderAddress, message) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO battle_royale_chat (game_id, sender_address, message, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `
      
      this.db.run(sql, [gameId, senderAddress, message], function(err) {
        if (err) {
          console.error('❌ Error saving Battle Royale chat message:', err)
          reject(err)
        } else {
          resolve({ id: this.lastID })
        }
      })
    })
  }

  // Get Battle Royale game by ID
  async getBattleRoyaleGame(gameId) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM battle_royale_games WHERE id = ?', [gameId], (err, game) => {
        if (err) {
          console.error('❌ Error getting Battle Royale game:', err)
          reject(err)
        } else {
          resolve(game)
        }
      })
    })
  }

  // Get Battle Royale participants
  async getBattleRoyaleParticipants(gameId) {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM battle_royale_participants WHERE game_id = ? ORDER BY slot_number', [gameId], (err, participants) => {
        if (err) {
          console.error('❌ Error getting Battle Royale participants:', err)
          reject(err)
        } else {
          resolve(participants || [])
        }
      })
    })
  }

  // Get Battle Royale chat history
  async getBattleRoyaleChatHistory(gameId, limit = 50) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM battle_royale_chat WHERE game_id = ? ORDER BY created_at DESC LIMIT ?',
        [gameId, limit],
        (err, messages) => {
          if (err) {
            console.error('❌ Error getting Battle Royale chat history:', err)
            reject(err)
          } else {
            resolve(messages ? messages.reverse() : [])
          }
        }
      )
    })
  }

  // ===== BACKUP AND RESTORE =====
  async createBackup() {
    console.log('📦 Creating database backup...')
    
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      tables: {}
    }
    
    // Backup all tables
    const tables = ['games', 'messages', 'offers', 'profiles', 'listings', 'notifications', 'game_rounds', 'ready_nfts']
    
    for (const table of tables) {
      backup.tables[table] = await new Promise((resolve, reject) => {
        this.db.all(`SELECT * FROM ${table}`, (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        })
      })
      console.log(`  ✓ Backed up ${table}: ${backup.tables[table].length} rows`)
    }
    
    console.log('✅ Backup complete')
    return backup
  }

  async restoreBackup(backupData) {
    console.log('📥 Restoring database from backup...')
    
    if (!backupData || !backupData.tables) {
      throw new Error('Invalid backup data')
    }
    
    // Start transaction
    await this.run('BEGIN TRANSACTION')
    
    try {
      // Clear existing data
      const tables = ['notifications', 'game_rounds', 'messages', 'offers', 'ready_nfts', 'profiles', 'listings', 'games']
      for (const table of tables) {
        await this.run(`DELETE FROM ${table}`)
        console.log(`  ✓ Cleared ${table}`)
      }
      
      // Restore games first (foreign key constraint)
      if (backupData.tables.games) {
        for (const game of backupData.tables.games) {
          const fields = Object.keys(game)
          const placeholders = fields.map(() => '?').join(', ')
          const values = fields.map(f => game[f])
          
          await this.run(
            `INSERT INTO games (${fields.join(', ')}) VALUES (${placeholders})`,
            values
          )
        }
        console.log(`  ✓ Restored games: ${backupData.tables.games.length} rows`)
      }
      
      // Restore other tables
      const otherTables = ['profiles', 'listings', 'messages', 'offers', 'notifications', 'game_rounds', 'ready_nfts']
      
      for (const table of otherTables) {
        if (backupData.tables[table]) {
          for (const row of backupData.tables[table]) {
            const fields = Object.keys(row).filter(f => f !== 'id')
            const placeholders = fields.map(() => '?').join(', ')
            const values = fields.map(f => row[f])
            
            await this.run(
              `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`,
              values
            )
          }
          console.log(`  ✓ Restored ${table}: ${backupData.tables[table].length} rows`)
        }
      }
      
      // Commit transaction
      await this.run('COMMIT')
      console.log('✅ Restore complete')
      
    } catch (error) {
      // Rollback on error
      await this.run('ROLLBACK')
      console.error('❌ Restore failed:', error)
      throw error
    }
  }

  // Timeout handling methods
  async getExpiredDepositGames() {
    const now = Math.floor(Date.now() / 1000)
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM games 
         WHERE status = 'awaiting_challenger_deposit' 
         AND deposit_deadline < ? 
         AND deposit_deadline IS NOT NULL`,
        [now],
        (err, games) => {
          if (err) reject(err)
          else resolve(games)
        }
      )
    })
  }

  async resetGameForNewOffers(gameId) {
    await this.run(
      `UPDATE games SET 
       status = 'awaiting_challenger',
       challenger = NULL,
       offer_id = NULL,
       deposit_deadline = NULL,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [gameId]
    )
  }

  async expireOffer(offerId) {
    await this.run('UPDATE offers SET status = "expired" WHERE id = ?', [offerId])
  }
}

module.exports = { DatabaseService } 