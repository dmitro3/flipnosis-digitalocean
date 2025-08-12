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
        console.log('✅ Connected to SQLite database')
        
        database.serialize(() => {
          // Listings table
          database.run(`
            CREATE TABLE IF NOT EXISTS listings (
              id TEXT PRIMARY KEY,
              game_id TEXT UNIQUE,
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
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (game_id) REFERENCES games(id)
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
              challenger TEXT,
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
              message_type TEXT DEFAULT 'chat',
              message_data TEXT,
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
              tailsImage TEXT,
              twitter TEXT,
              telegram TEXT,
              xp INTEGER DEFAULT 0,
              heads_image TEXT,
              tails_image TEXT,
              xp_name_earned BOOLEAN DEFAULT FALSE,
              xp_avatar_earned BOOLEAN DEFAULT FALSE,
              xp_twitter_earned BOOLEAN DEFAULT FALSE,
              xp_telegram_earned BOOLEAN DEFAULT FALSE,
              xp_heads_earned BOOLEAN DEFAULT FALSE,
              xp_tails_earned BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

          // Game shares tracking table - for XP rewards
          database.run(`
            CREATE TABLE IF NOT EXISTS game_shares (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              game_id TEXT NOT NULL,
              player_address TEXT NOT NULL,
              share_platform TEXT NOT NULL,
              xp_awarded BOOLEAN DEFAULT FALSE,
              shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(game_id, player_address, share_platform)
            )
          `, (err) => {
            if (err) console.error('❌ Error creating game_shares table:', err)
            else console.log('✅ Game shares table ready')
          })

          // Player stats table - for leaderboard tracking
          database.run(`
            CREATE TABLE IF NOT EXISTS player_stats (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_address TEXT NOT NULL,
              chain TEXT DEFAULT 'base',
              total_games INTEGER DEFAULT 0,
              games_won INTEGER DEFAULT 0,
              games_lost INTEGER DEFAULT 0,
              total_volume DECIMAL(20, 8) DEFAULT 0,
              total_fees_paid DECIMAL(20, 8) DEFAULT 0,
              total_rewards_earned DECIMAL(20, 8) DEFAULT 0,
              nfts_in_contract INTEGER DEFAULT 0,
              unclaimed_eth DECIMAL(20, 8) DEFAULT 0,
              unclaimed_usdc DECIMAL(20, 8) DEFAULT 0,
              unclaimed_nfts TEXT,
              last_activity TIMESTAMP,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(user_address, chain)
            )
          `, (err) => {
            if (err) console.error('❌ Error creating player_stats table:', err)
            else console.log('✅ Player stats table ready')
          })
        })
        
        this.db = database
        resolve(database)
      })
    })
  }

  // Database operation methods
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

  async resetGameForNewOffers(game) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        UPDATE games SET 
          challenger = NULL, 
          offer_id = NULL, 
          final_price = ?, 
          status = 'awaiting_challenger',
          deposit_deadline = NULL,
          challenger_deposited = false
        WHERE id = ?
      `, [game.asking_price || game.final_price, game.id], function(err) {
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
          // Parse message_data JSON for each message
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

  // Add other database methods as needed
  getDatabase() {
    return this.db
  }
}

module.exports = { DatabaseService } 