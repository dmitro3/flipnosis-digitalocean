const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseSchemaFixer {
  constructor() {
    this.databases = [
      './server/flipz-clean.db',
      './server/games.db',
      './server/games-v2.db',
      './server/local-dev.db'
    ];
  }

  async fixAllDatabases() {
    console.log('🔧 Starting database schema fixes...\n');

    for (const dbPath of this.databases) {
      try {
        await this.fixDatabase(dbPath);
      } catch (error) {
        console.error(`❌ Error fixing ${dbPath}:`, error);
      }
    }

    console.log('✅ Database schema fixes completed!');
  }

  async fixDatabase(dbPath) {
    console.log(`📁 Fixing database: ${dbPath}`);
    
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error(`❌ Error opening ${dbPath}:`, err);
          reject(err);
          return;
        }

        db.serialize(() => {
          // Fix profiles table
          this.fixProfilesTable(db);
          
          // Fix chat_messages table
          this.fixChatMessagesTable(db);
          
          // Fix games table
          this.fixGamesTable(db);
          
          // Create missing tables
          this.createMissingTables(db);
          
          // Add missing indexes
          this.addMissingIndexes(db);
          
          db.close((err) => {
            if (err) {
              console.error(`❌ Error closing ${dbPath}:`, err);
              reject(err);
            } else {
              console.log(`✅ Fixed ${dbPath}`);
              resolve();
            }
          });
        });
      });
    });
  }

  fixProfilesTable(db) {
    console.log('  🔧 Fixing profiles table...');
    
    // Add missing columns to profiles table
    const profileColumns = [
      'twitter TEXT',
      'telegram TEXT', 
      'xp INTEGER DEFAULT 0',
      'heads_image TEXT',
      'tails_image TEXT',
      'xp_name_earned BOOLEAN DEFAULT FALSE',
      'xp_avatar_earned BOOLEAN DEFAULT FALSE',
      'xp_twitter_earned BOOLEAN DEFAULT FALSE',
      'xp_telegram_earned BOOLEAN DEFAULT FALSE',
      'xp_heads_earned BOOLEAN DEFAULT FALSE',
      'xp_tails_earned BOOLEAN DEFAULT FALSE',
      'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
      'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    ];

    profileColumns.forEach(columnDef => {
      const columnName = columnDef.split(' ')[0];
      db.run(`ALTER TABLE profiles ADD COLUMN ${columnDef}`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error(`    ❌ Error adding ${columnName}:`, err.message);
        } else if (!err) {
          console.log(`    ✅ Added ${columnName}`);
        }
      });
    });
  }

  fixChatMessagesTable(db) {
    console.log('  🔧 Fixing chat_messages table...');
    
    // Add missing columns to chat_messages table
    const chatColumns = [
      'message_type TEXT DEFAULT "chat"',
      'message_data TEXT'
    ];

    chatColumns.forEach(columnDef => {
      const columnName = columnDef.split(' ')[0];
      db.run(`ALTER TABLE chat_messages ADD COLUMN ${columnDef}`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error(`    ❌ Error adding ${columnName}:`, err.message);
        } else if (!err) {
          console.log(`    ✅ Added ${columnName}`);
        }
      });
    });
  }

  fixGamesTable(db) {
    console.log('  🔧 Fixing games table...');
    
    // Add missing columns to games table
    const gameColumns = [
      'game_type TEXT DEFAULT "nft-vs-crypto"',
      'chain TEXT DEFAULT "base"',
      'payment_token TEXT DEFAULT "ETH"',
      'payment_amount DECIMAL(20, 8)',
      'listing_fee_paid DECIMAL(20, 8)',
      'platform_fee_collected DECIMAL(20, 8)',
      'creator_role TEXT DEFAULT "FLIPPER"',
      'joiner_role TEXT DEFAULT "CHOOSER"',
      'joiner_choice TEXT DEFAULT "HEADS"',
      'max_rounds INTEGER DEFAULT 5',
      'last_action_time TIMESTAMP',
      'countdown_end_time TIMESTAMP',
      'auth_info TEXT',
      'unclaimed_eth DECIMAL(20, 8) DEFAULT 0',
      'unclaimed_usdc DECIMAL(20, 8) DEFAULT 0',
      'unclaimed_nfts TEXT'
    ];

    gameColumns.forEach(columnDef => {
      const columnName = columnDef.split(' ')[0];
      db.run(`ALTER TABLE games ADD COLUMN ${columnDef}`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error(`    ❌ Error adding ${columnName}:`, err.message);
        } else if (!err) {
          console.log(`    ✅ Added ${columnName}`);
        }
      });
    });
  }

  createMissingTables(db) {
    console.log('  🔧 Creating missing tables...');

    // Create platform_stats table
    db.run(`
      CREATE TABLE IF NOT EXISTS platform_stats (
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
    `, (err) => {
      if (err) console.error('    ❌ Error creating platform_stats:', err.message);
      else console.log('    ✅ Created platform_stats table');
    });

    // Create unclaimed_rewards table
    db.run(`
      CREATE TABLE IF NOT EXISTS unclaimed_rewards (
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
    `, (err) => {
      if (err) console.error('    ❌ Error creating unclaimed_rewards:', err.message);
      else console.log('    ✅ Created unclaimed_rewards table');
    });

    // Create nft_tracking table
    db.run(`
      CREATE TABLE IF NOT EXISTS nft_tracking (
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
    `, (err) => {
      if (err) console.error('    ❌ Error creating nft_tracking:', err.message);
      else console.log('    ✅ Created nft_tracking table');
    });

    // Create admin_actions table
    db.run(`
      CREATE TABLE IF NOT EXISTS admin_actions (
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
    `, (err) => {
      if (err) console.error('    ❌ Error creating admin_actions:', err.message);
      else console.log('    ✅ Created admin_actions table');
    });

    // Create transactions table (if not exists)
    db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id TEXT,
        player_address TEXT NOT NULL,
        transaction_type TEXT NOT NULL,
        amount_usd REAL NOT NULL,
        amount_eth REAL NOT NULL,
        tx_hash TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('    ❌ Error creating transactions:', err.message);
      else console.log('    ✅ Created transactions table');
    });

    // Create nft_metadata_cache table (if not exists)
    db.run(`
      CREATE TABLE IF NOT EXISTS nft_metadata_cache (
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
    `, (err) => {
      if (err) console.error('    ❌ Error creating nft_metadata_cache:', err.message);
      else console.log('    ✅ Created nft_metadata_cache table');
    });

    // Create notifications table (if not exists)
    db.run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_address TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('    ❌ Error creating notifications:', err.message);
      else console.log('    ✅ Created notifications table');
    });

    // Create user_presence table (if not exists)
    db.run(`
      CREATE TABLE IF NOT EXISTS user_presence (
        address TEXT PRIMARY KEY,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_online BOOLEAN DEFAULT FALSE,
        socket_id TEXT
      )
    `, (err) => {
      if (err) console.error('    ❌ Error creating user_presence:', err.message);
      else console.log('    ✅ Created user_presence table');
    });

    // Create player_stats table (if not exists)
    db.run(`
      CREATE TABLE IF NOT EXISTS player_stats (
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
    `, (err) => {
      if (err) console.error('    ❌ Error creating player_stats:', err.message);
      else console.log('    ✅ Created player_stats table');
    });
  }

  addMissingIndexes(db) {
    console.log('  🔧 Adding missing indexes...');

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_games_chain ON games(chain)',
      'CREATE INDEX IF NOT EXISTS idx_games_game_type ON games(game_type)',
      'CREATE INDEX IF NOT EXISTS idx_games_status_chain ON games(status, chain)',
      'CREATE INDEX IF NOT EXISTS idx_games_creator_chain ON games(creator, chain)',
      'CREATE INDEX IF NOT EXISTS idx_games_joiner_chain ON games(joiner, chain)',
      'CREATE INDEX IF NOT EXISTS idx_games_created_at_chain ON games(created_at, chain)',
      'CREATE INDEX IF NOT EXISTS idx_game_rounds_game_id ON game_rounds(game_id)',
      'CREATE INDEX IF NOT EXISTS idx_game_rounds_round_number ON game_rounds(round_number)',
      'CREATE INDEX IF NOT EXISTS idx_unclaimed_rewards_user ON unclaimed_rewards(user_address)',
      'CREATE INDEX IF NOT EXISTS idx_unclaimed_rewards_chain ON unclaimed_rewards(chain)',
      'CREATE INDEX IF NOT EXISTS idx_unclaimed_rewards_type ON unclaimed_rewards(reward_type)',
      'CREATE INDEX IF NOT EXISTS idx_platform_stats_chain_date ON platform_stats(chain, date)',
      'CREATE INDEX IF NOT EXISTS idx_platform_stats_date ON platform_stats(date)',
      'CREATE INDEX IF NOT EXISTS idx_player_stats_user ON player_stats(address)',
      'CREATE INDEX IF NOT EXISTS idx_player_stats_chain ON player_stats(favorite_chain)',
      'CREATE INDEX IF NOT EXISTS idx_nft_tracking_contract_token ON nft_tracking(nft_contract, token_id)',
      'CREATE INDEX IF NOT EXISTS idx_nft_tracking_owner ON nft_tracking(owner_address)',
      'CREATE INDEX IF NOT EXISTS idx_nft_tracking_chain ON nft_tracking(chain)',
      'CREATE INDEX IF NOT EXISTS idx_nft_tracking_status ON nft_tracking(status)',
      'CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_address)',
      'CREATE INDEX IF NOT EXISTS idx_admin_actions_type ON admin_actions(action_type)',
      'CREATE INDEX IF NOT EXISTS idx_admin_actions_chain ON admin_actions(chain)',
      'CREATE INDEX IF NOT EXISTS idx_admin_actions_created ON admin_actions(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_game_id ON transactions(game_id)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_player ON transactions(player_address)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_address)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)',
      'CREATE INDEX IF NOT EXISTS idx_user_presence_online ON user_presence(is_online)',
      'CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen)'
    ];

    indexes.forEach(indexSql => {
      db.run(indexSql, (err) => {
        if (err) {
          console.error(`    ❌ Error creating index:`, err.message);
        } else {
          console.log(`    ✅ Created index: ${indexSql.split(' ')[2]}`);
        }
      });
    });
  }
}

// Run the fixer
const fixer = new DatabaseSchemaFixer();
fixer.fixAllDatabases().catch(console.error); 