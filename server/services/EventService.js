const EventEmitter = require('events');
const db = require('../database');

class GameEventService extends EventEmitter {
  constructor() {
    super();
    this.eventTypes = {
      OFFER_MADE: 'offer_made',
      OFFER_ACCEPTED: 'offer_accepted',
      GAME_STATUS_CHANGED: 'game_status_changed',
      DEPOSIT_MADE: 'deposit_made',
      GAME_STARTED: 'game_started',
      ROUND_COMPLETED: 'round_completed',
      GAME_ENDED: 'game_ended',
      SPECTATOR_JOINED: 'spectator_joined',
      CHAT_MESSAGE: 'chat_message'
    };
  }

  // Emit a game event and store it in the database
  async emitGameEvent(eventType, gameId, eventData, targetUsers = []) {
    try {
      console.log(`🎯 Emitting game event: ${eventType} for game ${gameId}`);
      console.log(`📋 Event data:`, eventData);
      console.log(`👥 Target users:`, targetUsers);

      // Store event in database
      const eventId = await this.storeEvent(eventType, gameId, eventData, targetUsers);
      
      // Update game's last event info
      await this.updateGameEventInfo(gameId, eventId);

      // Emit the event for WebSocket handlers
      this.emit(eventType, {
        eventId,
        gameId,
        eventType,
        eventData,
        targetUsers,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Event ${eventType} emitted successfully with ID: ${eventId}`);
      return eventId;
    } catch (error) {
      console.error(`❌ Error emitting game event ${eventType}:`, error);
      throw error;
    }
  }

  // Store event in database
  async storeEvent(eventType, gameId, eventData, targetUsers) {
    return new Promise((resolve, reject) => {
      const eventDataJson = JSON.stringify(eventData);
      const targetUsersJson = JSON.stringify(targetUsers);
      
      db.run(`
        INSERT INTO game_events (game_id, event_type, event_data, target_users, processed)
        VALUES (?, ?, ?, ?, 1)
      `, [gameId, eventType, eventDataJson, targetUsersJson], function(err) {
        if (err) {
          console.error('❌ Error storing event:', err);
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  // Update game's event tracking info
  async updateGameEventInfo(gameId, eventId) {
    return new Promise((resolve, reject) => {
      db.run(`
        UPDATE games 
        SET last_event_id = ?, event_version = event_version + 1
        WHERE id = ?
      `, [eventId, gameId], function(err) {
        if (err) {
          console.error('❌ Error updating game event info:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Get recent events for a game
  async getGameEvents(gameId, limit = 10) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM game_events 
        WHERE game_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `, [gameId, limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Parse JSON data
          const events = rows.map(row => ({
            ...row,
            event_data: JSON.parse(row.event_data || '{}'),
            target_users: JSON.parse(row.target_users || '[]')
          }));
          resolve(events);
        }
      });
    });
  }

  // Get unprocessed events
  async getUnprocessedEvents() {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM game_events 
        WHERE processed = 0 
        ORDER BY created_at ASC
      `, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const events = rows.map(row => ({
            ...row,
            event_data: JSON.parse(row.event_data || '{}'),
            target_users: JSON.parse(row.target_users || '[]')
          }));
          resolve(events);
        }
      });
    });
  }

  // Mark event as processed
  async markEventProcessed(eventId) {
    return new Promise((resolve, reject) => {
      db.run(`
        UPDATE game_events 
        SET processed = 1 
        WHERE id = ?
      `, [eventId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Convenience methods for common events
  async emitOfferMade(gameId, offerData, creatorAddress) {
    return this.emitGameEvent(
      this.eventTypes.OFFER_MADE,
      gameId,
      { ...offerData, timestamp: new Date().toISOString() },
      [creatorAddress]
    );
  }

  async emitOfferAccepted(gameId, offerData, creatorAddress, challengerAddress) {
    return this.emitGameEvent(
      this.eventTypes.OFFER_ACCEPTED,
      gameId,
      { 
        ...offerData, 
        creator: creatorAddress,
        challenger: challengerAddress,
        timestamp: new Date().toISOString() 
      },
      [creatorAddress, challengerAddress]
    );
  }

  async emitGameStatusChanged(gameId, newStatus, previousStatus, affectedUsers) {
    return this.emitGameEvent(
      this.eventTypes.GAME_STATUS_CHANGED,
      gameId,
      { 
        newStatus, 
        previousStatus, 
        timestamp: new Date().toISOString() 
      },
      affectedUsers
    );
  }

  async emitDepositMade(gameId, depositData, affectedUsers) {
    return this.emitGameEvent(
      this.eventTypes.DEPOSIT_MADE,
      gameId,
      { ...depositData, timestamp: new Date().toISOString() },
      affectedUsers
    );
  }
}

// Create singleton instance
const gameEventService = new GameEventService();

module.exports = gameEventService;
