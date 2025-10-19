const sqlite3 = require('sqlite3').verbose();

class FlipCollectionService {
  constructor(databasePath) {
    this.databasePath = databasePath;
    this.db = null;
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.databasePath, (err) => {
        if (err) {
          console.error('❌ Error opening database for FLIP Collection service:', err);
          reject(err);
          return;
        }
        console.log('✅ FLIP Collection Service connected to database');
        resolve();
      });
    });
  }

  // Record a FLIP earning during gameplay
  async recordFlipEarning(gameId, playerAddress, amount, reason = 'coin_flip_reward') {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO flip_earnings (game_id, player_address, flip_amount, reason, earned_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [gameId, playerAddress.toLowerCase(), amount, reason],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, amount, reason });
          }
        }
      );
    });
  }

  // Create a collection session for a player at game end
  async createCollectionSession(gameId, playerAddress, gameResult) {
    return new Promise((resolve, reject) => {
      // First, calculate total FLIP earned during the game
      this.db.get(
        `SELECT SUM(flip_amount) as total_flip FROM flip_earnings 
         WHERE game_id = ? AND player_address = ?`,
        [gameId, playerAddress.toLowerCase()],
        (err, result) => {
          if (err) {
            reject(err);
            return;
          }

          const totalFlip = result.total_flip || 0;
          
          // Create collection session
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
          
          this.db.run(
            `INSERT INTO flip_collections (game_id, player_address, total_flip_earned, 
             collection_status, game_result, created_at, expires_at)
             VALUES (?, ?, ?, 'pending', ?, CURRENT_TIMESTAMP, ?)`,
            [gameId, playerAddress.toLowerCase(), totalFlip, gameResult, expiresAt.toISOString()],
            function(err) {
              if (err) {
                reject(err);
              } else {
                // Update flip_earnings to link to this collection
                this.db.run(
                  `UPDATE flip_earnings SET collection_id = ? 
                   WHERE game_id = ? AND player_address = ?`,
                  [this.lastID, gameId, playerAddress.toLowerCase()],
                  (err) => {
                    if (err) {
                      console.error('Error linking earnings to collection:', err);
                    }
                  }
                );

                resolve({
                  collectionId: this.lastID,
                  totalFlip,
                  gameResult,
                  expiresAt: expiresAt.toISOString()
                });
              }
            }
          );
        }
      );
    });
  }

  // Collect FLIP tokens for a player
  async collectFlipTokens(collectionId, playerAddress) {
    return new Promise((resolve, reject) => {
      // Get collection details
      this.db.get(
        `SELECT * FROM flip_collections WHERE id = ? AND player_address = ? AND collection_status = 'pending'`,
        [collectionId, playerAddress.toLowerCase()],
        (err, collection) => {
          if (err) {
            reject(err);
            return;
          }

          if (!collection) {
            reject(new Error('Collection not found or already collected'));
            return;
          }

          // Check if expired
          if (new Date() > new Date(collection.expires_at)) {
            this.db.run(
              `UPDATE flip_collections SET collection_status = 'expired' WHERE id = ?`,
              [collectionId],
              (err) => {
                if (err) console.error('Error marking collection as expired:', err);
              }
            );
            reject(new Error('Collection has expired'));
            return;
          }

          // Mark as collected
          this.db.run(
            `UPDATE flip_collections 
             SET collection_status = 'collected', collected_at = CURRENT_TIMESTAMP, flip_collected = total_flip_earned
             WHERE id = ?`,
            [collectionId],
            (err) => {
              if (err) {
                reject(err);
                return;
              }

              // Award XP equal to FLIP collected
              this.db.run(
                `UPDATE profiles 
                 SET xp = xp + ?, updated_at = CURRENT_TIMESTAMP
                 WHERE address = ?`,
                [collection.total_flip_earned, playerAddress.toLowerCase()],
                (err) => {
                  if (err) {
                    console.error('Error updating XP:', err);
                  }

                  resolve({
                    collected: collection.total_flip_earned,
                    gameResult: collection.game_result,
                    collectionId
                  });
                }
              );
            }
          );
        }
      );
    });
  }

  // Claim NFT for winner
  async claimNFT(collectionId, playerAddress) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT * FROM flip_collections WHERE id = ? AND player_address = ? AND game_result = 'won'`,
        [collectionId, playerAddress.toLowerCase()],
        (err, collection) => {
          if (err) {
            reject(err);
            return;
          }

          if (!collection) {
            reject(new Error('Collection not found or not a winner'));
            return;
          }

          if (collection.nft_claimed) {
            reject(new Error('NFT already claimed'));
            return;
          }

          // Mark NFT as claimed
          this.db.run(
            `UPDATE flip_collections SET nft_claimed = TRUE WHERE id = ?`,
            [collectionId],
            (err) => {
              if (err) {
                reject(err);
              } else {
                resolve({ nftClaimed: true, collectionId });
              }
            }
          );
        }
      );
    });
  }

  // Get pending collections for a player
  async getPendingCollections(playerAddress) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM flip_collections 
         WHERE player_address = ? AND collection_status = 'pending' AND expires_at > CURRENT_TIMESTAMP
         ORDER BY created_at DESC`,
        [playerAddress.toLowerCase()],
        (err, collections) => {
          if (err) {
            reject(err);
          } else {
            resolve(collections || []);
          }
        }
      );
    });
  }

  // Get collection details
  async getCollectionDetails(collectionId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT fc.*, 
                GROUP_CONCAT(fe.reason || ':' || fe.flip_amount) as earnings_breakdown
         FROM flip_collections fc
         LEFT JOIN flip_earnings fe ON fc.id = fe.collection_id
         WHERE fc.id = ?
         GROUP BY fc.id`,
        [collectionId],
        (err, collection) => {
          if (err) {
            reject(err);
          } else {
            resolve(collection);
          }
        }
      );
    });
  }

  // Clean up expired collections (run periodically)
  async cleanupExpiredCollections() {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE flip_collections 
         SET collection_status = 'expired' 
         WHERE collection_status = 'pending' AND expires_at < CURRENT_TIMESTAMP`,
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ expiredCount: this.changes });
          }
        }
      );
    });
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = { FlipCollectionService };
