const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class DatabaseConsolidator {
  constructor() {
    this.sourceDatabases = [
      './server/games.db',
      './server/local-dev.db',
      './server/games-v2.db'
    ];
    this.targetDatabase = '/opt/flipnosis/app/server/flipz.db';
  }

  async consolidate() {
    console.log('🔄 Starting database consolidation...\n');
    
    try {
      // Create a fresh target database
      await this.createFreshDatabase();
      
      // Copy data from each source database
      for (const sourceDb of this.sourceDatabases) {
        if (fs.existsSync(sourceDb)) {
          console.log(`📁 Consolidating data from: ${sourceDb}`);
          await this.copyDatabaseData(sourceDb);
        } else {
          console.log(`⚠️  Source database not found: ${sourceDb}`);
        }
      }
      
      console.log('\n✅ Database consolidation completed!');
      console.log(`🎯 Primary database: ${this.targetDatabase}`);
      
      // Show final statistics
      await this.showDatabaseStats();
      
    } catch (error) {
      console.error('❌ Error during consolidation:', error);
    }
  }

  async createFreshDatabase() {
    console.log('🔧 Creating fresh target database...');
    
    return new Promise((resolve, reject) => {
      // Remove existing target database
      if (fs.existsSync(this.targetDatabase)) {
        fs.unlinkSync(this.targetDatabase);
      }
      
      const db = new sqlite3.Database(this.targetDatabase, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        db.serialize(() => {
          // Create all tables with complete schema
          this.createAllTables(db);
          
          db.close((err) => {
            if (err) {
              reject(err);
            } else {
              console.log('✅ Fresh database created');
              resolve();
            }
          });
        });
      });
    });
  }

  createAllTables(db) {
    // Core tables
    db.run(`
      CREATE TABLE games (
        id TEXT PRIMARY KEY,
        creator TEXT NOT NULL,
        joiner TEXT,
        nft_contract TEXT NOT NULL,
        nft_token_id TEXT NOT NULL,
        nft_name TEXT,
        nft_image TEXT,
        nft_collection TEXT,
        nft_chain TEXT DEFAULT 'base',
        price_usd REAL NOT NULL,
        rounds INTEGER NOT NULL DEFAULT 5,
        status TEXT DEFAULT 'waiting',
        winner TEXT,
        creator_wins INTEGER DEFAULT 0,
        joiner_wins INTEGER DEFAULT 0,
        current_round INTEGER DEFAULT 1,
        listing_fee_eth REAL,
        listing_fee_hash TEXT,
        entry_fee_hash TEXT,
        listing_fee_usd REAL,
        contract_game_id TEXT,
        transaction_hash TEXT,
        blockchain_game_id TEXT UNIQUE,
        challenger_nft_name TEXT,
        challenger_nft_image TEXT,
        challenger_nft_collection TEXT,
        challenger_nft_contract TEXT,
        challenger_nft_token_id TEXT,
        game_type TEXT DEFAULT 'nft-vs-crypto',
        chain TEXT DEFAULT 'base',
        payment_token TEXT DEFAULT 'ETH',
        payment_amount DECIMAL(20, 8),
        listing_fee_paid DECIMAL(20, 8),
        platform_fee_collected DECIMAL(20, 8),
        creator_role TEXT DEFAULT 'FLIPPER',
        joiner_role TEXT DEFAULT 'CHOOSER',
        joiner_choice TEXT DEFAULT 'HEADS',
        max_rounds INTEGER DEFAULT 5,
        last_action_time TIMESTAMP,
        countdown_end_time TIMESTAMP,
        auth_info TEXT,
        unclaimed_eth DECIMAL(20, 8) DEFAULT 0,
        unclaimed_usdc DECIMAL(20, 8) DEFAULT 0,
        unclaimed_nfts TEXT,
        total_spectators INTEGER DEFAULT 0,
        coin TEXT,
        game_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        started_at DATETIME,
        completed_at DATETIME,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE profiles (
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
    `);

    db.run(`
      CREATE TABLE listings (
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE offers (
        id TEXT PRIMARY KEY,
        listing_id TEXT NOT NULL,
        offerer_address TEXT NOT NULL,
        offerer_name TEXT,
        offer_price REAL NOT NULL,
        message TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE game_rounds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id TEXT NOT NULL,
        round_number INTEGER NOT NULL,
        creator_choice TEXT,
        challenger_choice TEXT,
        flip_result TEXT,
        round_winner TEXT,
        flipper_address TEXT NOT NULL,
        power_used REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id TEXT NOT NULL,
        sender_address TEXT NOT NULL,
        message TEXT NOT NULL,
        message_type TEXT DEFAULT 'chat',
        message_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE ready_nfts (
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
    `);

    // Additional tables
    db.run(`
      CREATE TABLE transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id TEXT,
        player_address TEXT NOT NULL,
        transaction_type TEXT NOT NULL,
        amount_usd REAL NOT NULL,
        amount_eth REAL NOT NULL,
        tx_hash TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE nft_metadata_cache (
        contract_address TEXT NOT NULL,
        token_id TEXT NOT NULL,
        chain TEXT NOT NULL,
        name TEXT,
        image_url TEXT,
        collection_name TEXT,
        description TEXT,
        attributes TEXT,
        token_type TEXT,
        fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (contract_address, token_id, chain)
      )
    `);

    db.run(`
      CREATE TABLE game_listings (
        id TEXT PRIMARY KEY,
        creator TEXT NOT NULL,
        nft_contract TEXT NOT NULL,
        nft_token_id TEXT NOT NULL,
        nft_name TEXT,
        nft_image TEXT,
        nft_collection TEXT,
        nft_chain TEXT,
        asking_price REAL NOT NULL,
        accepts_offers BOOLEAN,
        min_offer_price REAL,
        coin TEXT,
        status TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        contract_game_id TEXT,
        transaction_hash TEXT
      )
    `);

    db.run(`
      CREATE TABLE notifications (
        id TEXT PRIMARY KEY,
        user_address TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE user_presence (
        address TEXT PRIMARY KEY,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_online BOOLEAN DEFAULT FALSE,
        socket_id TEXT
      )
    `);

    db.run(`
      CREATE TABLE player_stats (
        address TEXT PRIMARY KEY,
        total_games INTEGER DEFAULT 0,
        games_won INTEGER DEFAULT 0,
        games_lost INTEGER DEFAULT 0,
        total_winnings_usd REAL DEFAULT 0,
        total_spent_usd REAL DEFAULT 0,
        favorite_chain TEXT,
        first_game_date DATETIME,
        last_game_date DATETIME
      )
    `);

    db.run(`
      CREATE TABLE platform_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chain TEXT NOT NULL,
        date DATE NOT NULL,
        total_games INTEGER DEFAULT 0,
        active_games INTEGER DEFAULT 0,
        completed_games INTEGER DEFAULT 0,
        total_volume DECIMAL(20, 8) DEFAULT 0,
        platform_fees DECIMAL(20, 8) DEFAULT 0,
        listing_fees DECIMAL(20, 8) DEFAULT 0,
        unique_players INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(chain, date)
      )
    `);

    db.run(`
      CREATE TABLE unclaimed_rewards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_address TEXT NOT NULL,
        chain TEXT NOT NULL,
        reward_type TEXT NOT NULL,
        amount DECIMAL(20, 8) DEFAULT 0,
        nft_contract TEXT,
        nft_token_id INTEGER,
        game_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        claimed_at TIMESTAMP,
        UNIQUE(user_address, chain, reward_type, nft_contract, nft_token_id)
      )
    `);

    db.run(`
      CREATE TABLE nft_tracking (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nft_contract TEXT NOT NULL,
        token_id INTEGER NOT NULL,
        owner_address TEXT NOT NULL,
        chain TEXT NOT NULL,
        game_id INTEGER,
        status TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(nft_contract, token_id, chain)
      )
    `);

    db.run(`
      CREATE TABLE admin_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_address TEXT NOT NULL,
        action_type TEXT NOT NULL,
        target_address TEXT,
        amount DECIMAL(20, 8),
        game_id INTEGER,
        chain TEXT NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    this.createIndexes(db);
  }

  createIndexes(db) {
    const indexes = [
      'CREATE INDEX idx_games_chain ON games(chain)',
      'CREATE INDEX idx_games_game_type ON games(game_type)',
      'CREATE INDEX idx_games_status_chain ON games(status, chain)',
      'CREATE INDEX idx_games_creator_chain ON games(creator, chain)',
      'CREATE INDEX idx_games_joiner_chain ON games(joiner, chain)',
      'CREATE INDEX idx_games_created_at_chain ON games(created_at, chain)',
      'CREATE INDEX idx_game_rounds_game_id ON game_rounds(game_id)',
      'CREATE INDEX idx_game_rounds_round_number ON game_rounds(round_number)',
      'CREATE INDEX idx_transactions_game_id ON transactions(game_id)',
      'CREATE INDEX idx_transactions_player ON transactions(player_address)',
      'CREATE INDEX idx_transactions_type ON transactions(transaction_type)',
      'CREATE INDEX idx_notifications_user ON notifications(user_address)',
      'CREATE INDEX idx_notifications_type ON notifications(type)',
      'CREATE INDEX idx_notifications_read ON notifications(read)',
      'CREATE INDEX idx_user_presence_online ON user_presence(is_online)',
      'CREATE INDEX idx_user_presence_last_seen ON user_presence(last_seen)',
      'CREATE INDEX idx_player_stats_user ON player_stats(address)',
      'CREATE INDEX idx_player_stats_chain ON player_stats(favorite_chain)',
      'CREATE INDEX idx_platform_stats_chain_date ON platform_stats(chain, date)',
      'CREATE INDEX idx_platform_stats_date ON platform_stats(date)',
      'CREATE INDEX idx_unclaimed_rewards_user ON unclaimed_rewards(user_address)',
      'CREATE INDEX idx_unclaimed_rewards_chain ON unclaimed_rewards(chain)',
      'CREATE INDEX idx_unclaimed_rewards_type ON unclaimed_rewards(reward_type)',
      'CREATE INDEX idx_nft_tracking_contract_token ON nft_tracking(nft_contract, token_id)',
      'CREATE INDEX idx_nft_tracking_owner ON nft_tracking(owner_address)',
      'CREATE INDEX idx_nft_tracking_chain ON nft_tracking(chain)',
      'CREATE INDEX idx_nft_tracking_status ON nft_tracking(status)',
      'CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_address)',
      'CREATE INDEX idx_admin_actions_type ON admin_actions(action_type)',
      'CREATE INDEX idx_admin_actions_chain ON admin_actions(chain)',
      'CREATE INDEX idx_admin_actions_created ON admin_actions(created_at)'
    ];

    indexes.forEach(indexSql => {
      db.run(indexSql);
    });
  }

  async copyDatabaseData(sourceDbPath) {
    return new Promise((resolve, reject) => {
      const sourceDb = new sqlite3.Database(sourceDbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          console.error(`❌ Error opening source database ${sourceDbPath}:`, err);
          resolve();
          return;
        }

        const targetDb = new sqlite3.Database(this.targetDatabase, (err) => {
          if (err) {
            reject(err);
            return;
          }

          // Get all tables from source
          sourceDb.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
            if (err) {
              reject(err);
              return;
            }

            let completedTables = 0;
            
            tables.forEach(table => {
              const tableName = table.name;
              
              // Skip sqlite internal tables
              if (tableName.startsWith('sqlite_')) {
                completedTables++;
                if (completedTables === tables.length) {
                  sourceDb.close();
                  targetDb.close();
                  resolve();
                }
                return;
              }

                             // Copy table data with schema mapping
               sourceDb.all(`SELECT * FROM ${tableName}`, (err, rows) => {
                 if (err) {
                   console.error(`❌ Error reading from ${tableName}:`, err);
                 } else if (rows.length > 0) {
                   try {
                     // Get target table schema
                     targetDb.all(`PRAGMA table_info(${tableName})`, (err, targetColumns) => {
                       if (err) {
                         console.error(`❌ Error getting target schema for ${tableName}:`, err);
                       } else {
                         const targetColumnNames = targetColumns.map(col => col.name);
                         
                         // Filter source data to match target schema
                         const filteredRows = rows.map(row => {
                           const filteredRow = {};
                           targetColumnNames.forEach(colName => {
                             if (row.hasOwnProperty(colName)) {
                               filteredRow[colName] = row[colName];
                             }
                           });
                           return filteredRow;
                         });
                         
                         if (filteredRows.length > 0 && Object.keys(filteredRows[0]).length > 0) {
                           const placeholders = Object.keys(filteredRows[0]).map(() => '?').join(',');
                           const columns = Object.keys(filteredRows[0]).join(',');
                           
                           const insertSql = `INSERT OR IGNORE INTO ${tableName} (${columns}) VALUES (${placeholders})`;
                           
                           const stmt = targetDb.prepare(insertSql);
                           filteredRows.forEach(row => {
                             stmt.run(Object.values(row));
                           });
                           stmt.finalize();
                           
                           console.log(`  ✅ Copied ${filteredRows.length} rows from ${tableName}`);
                         }
                       }
                     });
                   } catch (error) {
                     console.error(`❌ Error copying ${tableName}:`, error.message);
                   }
                 }
                
                completedTables++;
                if (completedTables === tables.length) {
                  sourceDb.close();
                  targetDb.close();
                  resolve();
                }
              });
            });
          });
        });
      });
    });
  }

  async showDatabaseStats() {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.targetDatabase, (err) => {
        if (err) {
          reject(err);
          return;
        }

        console.log('\n📊 Final Database Statistics:');
        
        const tables = ['games', 'profiles', 'listings', 'offers', 'game_rounds', 'chat_messages', 'ready_nfts', 'transactions', 'notifications', 'user_presence', 'player_stats'];
        
        let completedTables = 0;
        
        tables.forEach(tableName => {
          db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, result) => {
            if (err) {
              console.log(`  ${tableName}: Error`);
            } else {
              console.log(`  ${tableName}: ${result.count} records`);
            }
            
            completedTables++;
            if (completedTables === tables.length) {
              db.close();
              resolve();
            }
          });
        });
      });
    });
  }
}

// Run the consolidator
const consolidator = new DatabaseConsolidator();
consolidator.consolidate().catch(console.error); 