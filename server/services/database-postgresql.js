const { Pool } = require('pg');
const Redis = require('redis');
const { ethers } = require('ethers');

class DatabaseService {
  constructor() {
    // PostgreSQL connection pool
    this.pgPool = new Pool({
      host: process.env.POSTGRES_HOST || '116.202.24.43',
      port: process.env.POSTGRES_PORT || 5432,
      database: process.env.POSTGRES_DATABASE || 'flipnosis',
      user: process.env.POSTGRES_USER || 'flipnosis_user',
      password: process.env.POSTGRES_PASSWORD || 'xUncTgMpgNtw',
      max: parseInt(process.env.POSTGRES_MAX_CONNECTIONS) || 20,
      idleTimeoutMillis: parseInt(process.env.POSTGRES_IDLE_TIMEOUT) || 30000,
      connectionTimeoutMillis: parseInt(process.env.POSTGRES_CONNECTION_TIMEOUT) || 2000,
    });

    // Redis connection
    this.redis = Redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || '116.202.24.43',
        port: process.env.REDIS_PORT || 6379
      },
      password: process.env.REDIS_PASSWORD || 'flipnosis_redis_password'
    });

    // Redis subscriber for real-time updates
    this.redisSubscriber = this.redis.duplicate();

    // WebSocket room management
    this.rooms = new Map();
    this.userSockets = new Map();

    // Initialize Redis connection
    this.initializeRedis();
  }

  async initialize() {
    console.log('🔄 Initializing PostgreSQL + Redis database service...');
    
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

      // Connect Redis subscriber
      await this.redisSubscriber.connect();
      console.log('✅ Redis subscriber connected');

      return true;
    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
      return false;
    }
  }

  async initializeRedis() {
    this.redis.on('error', (err) => {
      console.error('Redis error:', err);
    });

    this.redisSubscriber.on('error', (err) => {
      console.error('Redis subscriber error:', err);
    });

    this.redisSubscriber.on('message', (channel, message) => {
      this.handleRedisMessage(channel, message);
    });
  }

  async handleRedisMessage(channel, message) {
    try {
      const data = JSON.parse(message);
      const [type, roomId] = channel.split(':');
      
      // Broadcast to WebSocket clients in the room
      if (this.rooms.has(roomId)) {
        const sockets = this.rooms.get(roomId);
        const messageData = {
          type: type === 'chat' ? 'chat_message' : 'game_update',
          data: data
        };
        
        sockets.forEach(socket => {
          if (socket.readyState === 1) { // WebSocket.OPEN
            socket.send(JSON.stringify(messageData));
          }
        });
      }
    } catch (error) {
      console.error('Error handling Redis message:', error);
    }
  }

  // ===== GAME MANAGEMENT =====
  async getGameById(gameId) {
    try {
      // Check Redis cache first
      const cached = await this.redis.get(`game:${gameId}`);
      if (cached) {
        return JSON.parse(cached);
      }

      // Query PostgreSQL
      const result = await this.pgPool.query(
        'SELECT * FROM games WHERE id = $1',
        [gameId]
      );

      if (result.rows[0]) {
        // Cache in Redis for 1 hour
        await this.redis.setex(`game:${gameId}`, 3600, JSON.stringify(result.rows[0]));
        return result.rows[0];
      }

      return null;
    } catch (error) {
      console.error('Error getting game by ID:', error);
      throw error;
    }
  }

  async createGame(gameData) {
    try {
      const query = `
        INSERT INTO games (
          id, creator, nft_contract, nft_token_id, nft_name, nft_image, 
          nft_collection, nft_chain, price_usd, rounds, status, game_type, 
          chain, payment_token, payment_amount, listing_id, challenger, coin_data
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        ) RETURNING *
      `;
      
      const values = [
        gameData.id, gameData.creator, gameData.nft_contract, gameData.nft_token_id,
        gameData.nft_name, gameData.nft_image, gameData.nft_collection, gameData.nft_chain,
        gameData.price_usd, gameData.rounds, gameData.status, gameData.game_type,
        gameData.chain, gameData.payment_token, gameData.payment_amount, gameData.listing_id,
        gameData.challenger, gameData.coin_data
      ];

      const result = await this.pgPool.query(query, values);
      
      // Cache in Redis
      await this.redis.setex(`game:${gameData.id}`, 3600, JSON.stringify(result.rows[0]));
      
      // Publish to Redis for real-time updates
      await this.redis.publish(`game:${gameData.id}`, JSON.stringify({
        type: 'game_created',
        game: result.rows[0]
      }));

      return result.rows[0];
    } catch (error) {
      console.error('Error creating game:', error);
      throw error;
    }
  }

  async updateGameStatus(gameId, status, additionalData = {}) {
    try {
      const query = `
        UPDATE games 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        ${Object.keys(additionalData).length > 0 ? ', ' + Object.keys(additionalData).map((key, index) => `${key} = $${index + 3}`).join(', ') : ''}
        WHERE id = $2 
        RETURNING *
      `;
      
      const values = [status, gameId, ...Object.values(additionalData)];
      const result = await this.pgPool.query(query, values);

      if (result.rows[0]) {
        // Update Redis cache
        await this.redis.setex(`game:${gameId}`, 3600, JSON.stringify(result.rows[0]));
        
        // Publish update
        await this.redis.publish(`game:${gameId}`, JSON.stringify({
          type: 'game_updated',
          game: result.rows[0]
        }));

        return result.rows[0];
      }

      return null;
    } catch (error) {
      console.error('Error updating game status:', error);
      throw error;
    }
  }

  async getActiveGames(chain = 'base') {
    try {
      const result = await this.pgPool.query(
        'SELECT * FROM games WHERE status IN ($1, $2) AND chain = $3 ORDER BY created_at DESC',
        ['waiting', 'active', chain]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting active games:', error);
      throw error;
    }
  }

  // ===== LISTINGS MANAGEMENT =====
  async getActiveListings(chain = 'base') {
    try {
      const result = await this.pgPool.query(
        'SELECT * FROM listings WHERE status = $1 AND nft_chain = $2 ORDER BY created_at DESC',
        ['open', chain]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting active listings:', error);
      throw error;
    }
  }

  async getListingById(listingId) {
    try {
      const result = await this.pgPool.query(
        'SELECT * FROM listings WHERE id = $1',
        [listingId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting listing by ID:', error);
      throw error;
    }
  }

  async createListing(listingData) {
    try {
      const query = `
        INSERT INTO listings (
          id, creator, nft_contract, nft_token_id, nft_name, nft_image, 
          nft_collection, nft_chain, asking_price, status, coin_data
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        ) RETURNING *
      `;
      
      const values = [
        listingData.id || Math.random().toString(36).substr(2, 9),
        listingData.creator, listingData.nft_contract, listingData.nft_token_id,
        listingData.nft_name, listingData.nft_image, listingData.nft_collection, 
        listingData.nft_chain, listingData.asking_price, 'open', listingData.coin_data
      ];

      const result = await this.pgPool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating listing:', error);
      throw error;
    }
  }

  async acceptOffer(offerId, acceptData) {
    try {
      // Update offer status to accepted
      const offerQuery = 'UPDATE offers SET status = $1 WHERE id = $2 RETURNING *';
      const offerResult = await this.pgPool.query(offerQuery, ['accepted', offerId]);
      
      if (offerResult.rows.length === 0) {
        throw new Error('Offer not found');
      }

      const offer = offerResult.rows[0];
      
      // Update listing status to sold
      await this.pgPool.query(
        'UPDATE listings SET status = $1 WHERE id = $2',
        ['sold', offer.listing_id]
      );

      return { success: true, offer: offer };
    } catch (error) {
      console.error('Error accepting offer:', error);
      throw error;
    }
  }

  // ===== CHAT MANAGEMENT =====
  async saveChatMessage(roomId, senderAddress, message, messageType = 'chat', messageData = null) {
    try {
      const query = `
        INSERT INTO chat_messages (room_id, sender_address, message, message_type, message_data)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const values = [roomId, senderAddress, message, messageType, messageData];
      const result = await this.pgPool.query(query, values);

      // Publish to Redis for real-time chat
      await this.redis.publish(`chat:${roomId}`, JSON.stringify(result.rows[0]));

      return result.rows[0];
    } catch (error) {
      console.error('Error saving chat message:', error);
      throw error;
    }
  }

  async getChatHistory(roomId, limit = 50) {
    try {
      const result = await this.pgPool.query(
        'SELECT * FROM chat_messages WHERE room_id = $1 ORDER BY created_at DESC LIMIT $2',
        [roomId, limit]
      );
      return result.rows.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }

  // ===== WEBSOCKET ROOM MANAGEMENT =====
  async joinRoom(socket, roomId, userAddress) {
    try {
      // Add to in-memory room tracking
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, new Set());
      }
      this.rooms.get(roomId).add(socket);

      // Track user socket
      this.userSockets.set(socket.id, { roomId, userAddress });

      // Update user presence in Redis
      await this.redis.hset(`user:${userAddress}`, {
        socketId: socket.id,
        roomId: roomId,
        lastSeen: Date.now(),
        isOnline: true
      });

      // Subscribe to Redis channels for this room
      await this.redisSubscriber.subscribe(`chat:${roomId}`);
      await this.redisSubscriber.subscribe(`game:${roomId}`);

      console.log(`👤 User ${userAddress} joined room ${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  }

  async leaveRoom(socket) {
    try {
      const userData = this.userSockets.get(socket.id);
      if (!userData) return;

      const { roomId, userAddress } = userData;

      // Remove from in-memory tracking
      if (this.rooms.has(roomId)) {
        this.rooms.get(roomId).delete(socket);
        if (this.rooms.get(roomId).size === 0) {
          this.rooms.delete(roomId);
        }
      }

      this.userSockets.delete(socket.id);

      // Update user presence
      await this.redis.hset(`user:${userAddress}`, {
        isOnline: false,
        lastSeen: Date.now()
      });

      console.log(`👋 User ${userAddress} left room ${roomId}`);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  }

  async getRoomMembers(roomId) {
    try {
      if (!this.rooms.has(roomId)) return [];
      
      const sockets = this.rooms.get(roomId);
      const members = [];
      
      for (const socket of sockets) {
        const userData = this.userSockets.get(socket.id);
        if (userData) {
          members.push(userData.userAddress);
        }
      }
      
      return members;
    } catch (error) {
      console.error('Error getting room members:', error);
      return [];
    }
  }

  // ===== USER MANAGEMENT =====
  async getUserProfile(address) {
    try {
      const result = await this.pgPool.query(
        'SELECT * FROM profiles WHERE address = $1',
        [address]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  async createOrUpdateProfile(profileData) {
    try {
      const query = `
        INSERT INTO profiles (address, name, avatar, heads_image, tails_image, twitter, telegram, xp)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (address) 
        DO UPDATE SET 
          name = EXCLUDED.name,
          avatar = EXCLUDED.avatar,
          heads_image = EXCLUDED.heads_image,
          tails_image = EXCLUDED.tails_image,
          twitter = EXCLUDED.twitter,
          telegram = EXCLUDED.telegram,
          xp = EXCLUDED.xp,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;
      
      const values = [
        profileData.address, profileData.name, profileData.avatar,
        profileData.heads_image, profileData.tails_image, profileData.twitter,
        profileData.telegram, profileData.xp || 0
      ];

      const result = await this.pgPool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating/updating profile:', error);
      throw error;
    }
  }

  // ===== OFFERS MANAGEMENT =====
  async createOffer(offerData) {
    try {
      const query = `
        INSERT INTO offers (id, listing_id, offerer_address, offerer_name, offer_price, message, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const values = [
        offerData.id, offerData.listing_id, offerData.offerer_address,
        offerData.offerer_name, offerData.offer_price, offerData.message, 'pending'
      ];

      const result = await this.pgPool.query(query, values);
      
      // Publish to Redis for real-time updates
      await this.redis.publish(`offers:${offerData.listing_id}`, JSON.stringify({
        type: 'offer_created',
        offer: result.rows[0]
      }));

      return result.rows[0];
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }

  async getOffersForListing(listingId) {
    try {
      const result = await this.pgPool.query(
        'SELECT * FROM offers WHERE listing_id = $1 ORDER BY created_at DESC',
        [listingId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting offers:', error);
      throw error;
    }
  }

  // ===== NOTIFICATIONS =====
  async createNotification(notificationData) {
    try {
      const query = `
        INSERT INTO notifications (id, user_address, type, title, message, data)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const values = [
        notificationData.id, notificationData.user_address, notificationData.type,
        notificationData.title, notificationData.message, notificationData.data
      ];

      const result = await this.pgPool.query(query, values);
      
      // Publish to Redis for real-time notifications
      await this.redis.publish(`notifications:${notificationData.user_address}`, JSON.stringify({
        type: 'notification_created',
        notification: result.rows[0]
      }));

      return result.rows[0];
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async getUserNotifications(address, limit = 20) {
    try {
      const result = await this.pgPool.query(
        'SELECT * FROM notifications WHERE user_address = $1 ORDER BY created_at DESC LIMIT $2',
        [address, limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  // ===== UTILITY METHODS =====
  async close() {
    try {
      await this.pgPool.end();
      await this.redis.quit();
      await this.redisSubscriber.quit();
      console.log('🔌 Database connections closed');
    } catch (error) {
      console.error('Error closing database connections:', error);
    }
  }

  // Health check
  async healthCheck() {
    try {
      // Test PostgreSQL
      const client = await this.pgPool.connect();
      await client.query('SELECT 1');
      client.release();

      // Test Redis
      await this.redis.ping();

      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
    }
  }
}

module.exports = DatabaseService;
