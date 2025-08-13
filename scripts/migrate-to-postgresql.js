const { Pool } = require('pg');
const Redis = require('redis');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseMigration {
  constructor() {
    // PostgreSQL connection
    this.pgPool = new Pool({
      host: '116.202.24.43',
      port: 5432,
      database: 'flipnosis',
      user: 'flipnosis_user',
      password: 'xUncTgMpgNtw', // Using the password from your database server
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Redis connection
    this.redis = Redis.createClient({
      host: '116.202.24.43',
      port: 6379,
      password: 'flipnosis_redis_password' // We'll set this during setup
    });

    // SQLite database paths
    this.sqlitePaths = [
      '/opt/flipnosis/shared/flipz-clean.db', // Server 116 database
      '/opt/flipnosis/app/server/flipz-clean.db' // Server 159 database
    ];
  }

  async initialize() {
    console.log('🔄 Initializing PostgreSQL + Redis migration...');
    
    try {
      // Test PostgreSQL connection
      const client = await this.pgPool.connect();
      await client.query('SELECT NOW()');
      client.release();
      console.log('✅ PostgreSQL connected');

      // Test Redis connection
      await this.redis.connect();
      await this.redis.ping();
      console.log('✅ Redis connected');

      return true;
    } catch (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
  }

  async createPostgreSQLSchema() {
    console.log('📋 Creating PostgreSQL schema...');
    
    const schema = `
      -- Core tables
      CREATE TABLE IF NOT EXISTS games (
        id VARCHAR(255) PRIMARY KEY,
        creator VARCHAR(42) NOT NULL,
        joiner VARCHAR(42),
        nft_contract VARCHAR(42) NOT NULL,
        nft_token_id VARCHAR(255) NOT NULL,
        nft_name TEXT,
        nft_image TEXT,
        nft_collection TEXT,
        nft_chain VARCHAR(20) DEFAULT 'base',
        price_usd DECIMAL(20, 8) NOT NULL,
        rounds INTEGER NOT NULL DEFAULT 5,
        status VARCHAR(50) DEFAULT 'waiting',
        winner VARCHAR(42),
        creator_wins INTEGER DEFAULT 0,
        joiner_wins INTEGER DEFAULT 0,
        current_round INTEGER DEFAULT 1,
        listing_fee_eth DECIMAL(20, 8),
        listing_fee_hash TEXT,
        entry_fee_hash TEXT,
        listing_fee_usd DECIMAL(20, 8),
        contract_game_id TEXT,
        transaction_hash TEXT,
        blockchain_game_id TEXT UNIQUE,
        challenger_nft_name TEXT,
        challenger_nft_image TEXT,
        challenger_nft_collection TEXT,
        challenger_nft_contract TEXT,
        challenger_nft_token_id TEXT,
        game_type VARCHAR(50) DEFAULT 'nft-vs-crypto',
        chain VARCHAR(20) DEFAULT 'base',
        payment_token VARCHAR(10) DEFAULT 'ETH',
        payment_amount DECIMAL(20, 8),
        listing_fee_paid DECIMAL(20, 8),
        platform_fee_collected DECIMAL(20, 8),
        creator_role VARCHAR(20) DEFAULT 'FLIPPER',
        joiner_role VARCHAR(20) DEFAULT 'CHOOSER',
        joiner_choice VARCHAR(10) DEFAULT 'HEADS',
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deposit_deadline TIMESTAMP,
        listing_id TEXT,
        challenger VARCHAR(42),
        coin_data TEXT,
        creator_deposited BOOLEAN DEFAULT false,
        challenger_deposited BOOLEAN DEFAULT false
      );

      CREATE TABLE IF NOT EXISTS profiles (
        address VARCHAR(42) PRIMARY KEY,
        name TEXT,
        avatar TEXT,
        heads_image TEXT,
        tails_image TEXT,
        twitter TEXT,
        telegram TEXT,
        xp INTEGER DEFAULT 0,
        xp_name_earned BOOLEAN DEFAULT FALSE,
        xp_avatar_earned BOOLEAN DEFAULT FALSE,
        xp_twitter_earned BOOLEAN DEFAULT FALSE,
        xp_telegram_earned BOOLEAN DEFAULT FALSE,
        xp_heads_earned BOOLEAN DEFAULT FALSE,
        xp_tails_earned BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS listings (
        id VARCHAR(255) PRIMARY KEY,
        game_id VARCHAR(255) UNIQUE,
        creator VARCHAR(42) NOT NULL,
        nft_contract VARCHAR(42) NOT NULL,
        nft_token_id VARCHAR(255) NOT NULL,
        nft_name TEXT,
        nft_image TEXT,
        nft_collection TEXT,
        nft_chain VARCHAR(20) DEFAULT 'base',
        asking_price DECIMAL(20, 8) NOT NULL,
        status VARCHAR(50) DEFAULT 'open',
        coin_data TEXT,
        listing_fee_paid BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS offers (
        id VARCHAR(255) PRIMARY KEY,
        listing_id VARCHAR(255) NOT NULL,
        offerer_address VARCHAR(42) NOT NULL,
        offerer_name TEXT,
        offer_price DECIMAL(20, 8) NOT NULL,
        message TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        room_id VARCHAR(255) NOT NULL,
        sender_address VARCHAR(42) NOT NULL,
        message TEXT NOT NULL,
        message_type VARCHAR(50) DEFAULT 'chat',
        message_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_presence (
        address VARCHAR(42) PRIMARY KEY,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_online BOOLEAN DEFAULT FALSE,
        socket_id TEXT
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(255) PRIMARY KEY,
        user_address VARCHAR(42) NOT NULL,
        type VARCHAR(100) NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS admin_actions (
        id SERIAL PRIMARY KEY,
        admin_address VARCHAR(42) NOT NULL,
        action_type VARCHAR(100) NOT NULL,
        target_address VARCHAR(42),
        amount DECIMAL(20, 8),
        game_id INTEGER,
        chain VARCHAR(20) NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        game_id VARCHAR(255),
        player_address VARCHAR(42) NOT NULL,
        transaction_type VARCHAR(100) NOT NULL,
        amount_usd DECIMAL(20, 8) NOT NULL,
        amount_eth DECIMAL(20, 8) NOT NULL,
        tx_hash TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS game_rounds (
        id SERIAL PRIMARY KEY,
        game_id VARCHAR(255) NOT NULL,
        round_number INTEGER NOT NULL,
        creator_choice TEXT,
        challenger_choice TEXT,
        flip_result TEXT,
        round_winner VARCHAR(42),
        flipper_address VARCHAR(42) NOT NULL,
        power_used DECIMAL(20, 8),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS player_stats (
        address VARCHAR(42) PRIMARY KEY,
        total_games INTEGER DEFAULT 0,
        games_won INTEGER DEFAULT 0,
        games_lost INTEGER DEFAULT 0,
        total_winnings_usd DECIMAL(20, 8) DEFAULT 0,
        total_spent_usd DECIMAL(20, 8) DEFAULT 0,
        favorite_chain VARCHAR(20),
        first_game_date TIMESTAMP,
        last_game_date TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS platform_stats (
        id SERIAL PRIMARY KEY,
        chain VARCHAR(20) NOT NULL,
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
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
      CREATE INDEX IF NOT EXISTS idx_games_creator ON games(creator);
      CREATE INDEX IF NOT EXISTS idx_games_joiner ON games(joiner);
      CREATE INDEX IF NOT EXISTS idx_games_chain ON games(chain);
      CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
      CREATE INDEX IF NOT EXISTS idx_offers_listing_id ON offers(listing_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_game_id ON transactions(game_id);
      CREATE INDEX IF NOT EXISTS idx_game_rounds_game_id ON game_rounds(game_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_address);
      CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_address);
    `;

    try {
      await this.pgPool.query(schema);
      console.log('✅ PostgreSQL schema created successfully');
      return true;
    } catch (error) {
      console.error('❌ Error creating schema:', error);
      return false;
    }
  }

  async migrateDataFromSQLite() {
    console.log('🔄 Starting data migration from SQLite...');
    
    for (const sqlitePath of this.sqlitePaths) {
      try {
        console.log(`📁 Migrating from: ${sqlitePath}`);
        await this.migrateSingleSQLiteDatabase(sqlitePath);
      } catch (error) {
        console.error(`❌ Error migrating ${sqlitePath}:`, error.message);
      }
    }
  }

  async migrateSingleSQLiteDatabase(sqlitePath) {
    return new Promise((resolve, reject) => {
      const sqliteDb = new sqlite3.Database(sqlitePath, sqlite3.OPEN_READONLY, async (err) => {
        if (err) {
          console.error(`❌ Cannot open SQLite database ${sqlitePath}:`, err.message);
          resolve();
          return;
        }

        try {
          // Migrate each table
          await this.migrateTable(sqliteDb, 'games');
          await this.migrateTable(sqliteDb, 'profiles');
          await this.migrateTable(sqliteDb, 'listings');
          await this.migrateTable(sqliteDb, 'offers');
          await this.migrateTable(sqliteDb, 'chat_messages');
          await this.migrateTable(sqliteDb, 'user_presence');
          await this.migrateTable(sqliteDb, 'notifications');
          await this.migrateTable(sqliteDb, 'admin_actions');
          await this.migrateTable(sqliteDb, 'transactions');
          await this.migrateTable(sqliteDb, 'game_rounds');
          await this.migrateTable(sqliteDb, 'player_stats');
          await this.migrateTable(sqliteDb, 'platform_stats');

          sqliteDb.close();
          console.log(`✅ Migration completed for ${sqlitePath}`);
          resolve();
        } catch (error) {
          sqliteDb.close();
          reject(error);
        }
      });
    });
  }

  async migrateTable(sqliteDb, tableName) {
    return new Promise((resolve, reject) => {
      sqliteDb.all(`SELECT * FROM ${tableName}`, async (err, rows) => {
        if (err) {
          console.log(`⚠️ Table ${tableName} not found or empty`);
          resolve();
          return;
        }

        if (rows.length === 0) {
          console.log(`📭 Table ${tableName} is empty, skipping`);
          resolve();
          return;
        }

        console.log(`📊 Migrating ${rows.length} records from ${tableName}`);

        try {
          // Use a transaction for better performance
          const client = await this.pgPool.connect();
          await client.query('BEGIN');

          for (const row of rows) {
            const columns = Object.keys(row);
            const values = Object.values(row);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
            
            const query = `
              INSERT INTO ${tableName} (${columns.join(', ')})
              VALUES (${placeholders})
              ON CONFLICT DO NOTHING
            `;
            
            await client.query(query, values);
          }

          await client.query('COMMIT');
          client.release();
          console.log(`✅ Migrated ${rows.length} records to ${tableName}`);
          resolve();
        } catch (error) {
          console.error(`❌ Error migrating ${tableName}:`, error);
          resolve(); // Continue with other tables
        }
      });
    });
  }

  async setupRedisForWebSockets() {
    console.log('🔧 Setting up Redis for WebSocket state management...');
    
    try {
      // Test Redis operations
      await this.redis.set('test:connection', 'success');
      await this.redis.expire('test:connection', 60);
      const testResult = await this.redis.get('test:connection');
      
      if (testResult === 'success') {
        console.log('✅ Redis setup successful');
        return true;
      } else {
        console.error('❌ Redis test failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Redis setup failed:', error);
      return false;
    }
  }

  async verifyMigration() {
    console.log('🔍 Verifying migration...');
    
    try {
      const tables = [
        'games', 'profiles', 'listings', 'offers', 'chat_messages',
        'user_presence', 'notifications', 'admin_actions', 'transactions',
        'game_rounds', 'player_stats', 'platform_stats'
      ];

      for (const table of tables) {
        const result = await this.pgPool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`📊 ${table}: ${result.rows[0].count} records`);
      }

      console.log('✅ Migration verification complete');
      return true;
    } catch (error) {
      console.error('❌ Verification failed:', error);
      return false;
    }
  }

  async close() {
    await this.pgPool.end();
    await this.redis.quit();
    console.log('🔌 Database connections closed');
  }
}

// Main migration function
async function runMigration() {
  const migration = new DatabaseMigration();
  
  try {
    console.log('🚀 Starting PostgreSQL + Redis migration...\n');
    
    // Step 1: Initialize connections
    const initialized = await migration.initialize();
    if (!initialized) {
      console.error('❌ Failed to initialize connections');
      process.exit(1);
    }

    // Step 2: Create PostgreSQL schema
    const schemaCreated = await migration.createPostgreSQLSchema();
    if (!schemaCreated) {
      console.error('❌ Failed to create schema');
      process.exit(1);
    }

    // Step 3: Migrate data
    await migration.migrateDataFromSQLite();

    // Step 4: Setup Redis
    const redisSetup = await migration.setupRedisForWebSockets();
    if (!redisSetup) {
      console.error('❌ Failed to setup Redis');
      process.exit(1);
    }

    // Step 5: Verify migration
    await migration.verifyMigration();

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update your application code to use PostgreSQL + Redis');
    console.log('2. Test the new database connections');
    console.log('3. Deploy the updated application');
    console.log('4. Monitor for any issues');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await migration.close();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = DatabaseMigration;
