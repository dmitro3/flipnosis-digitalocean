const sqlite3 = require('sqlite3').verbose();

class XPService {
  constructor(databasePath) {
    this.databasePath = databasePath;
    this.db = null;
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.databasePath, (err) => {
        if (err) {
          console.error('❌ Error opening database for XP service:', err);
          reject(err);
          return;
        }
        console.log('✅ XP Service connected to database');
        resolve();
      });
    });
  }

  // XP Award Messages
  getXPMessage(xpAmount, reason) {
    const messages = {
      // Profile completion awards
      'name_set': `**+${xpAmount} XP!** You've claimed your identity!`,
      'avatar_set': `**+${xpAmount} XP!** Your avatar is now loaded!`,
      'twitter_added': `**+${xpAmount} XP!** Tweet tweet!`,
      'telegram_added': `**+${xpAmount} XP!** Telegram connected!`,
      'heads_customized': `**+${xpAmount} XP!** Custom heads loaded!`,
      'tails_customized': `**+${xpAmount} XP!** Custom tails loaded!`,
      
      // Game outcome awards
      'game_won': `**+${xpAmount} XP!** VICTORY!`,
      'game_lost': `**+${xpAmount} XP!** Courage rewarded! Keep flipping!`,
      
      // Special achievements
      'first_game': `**+${xpAmount} XP!** First game completed! Welcome to the Flipnosis family!`,
      'winning_streak': `**+${xpAmount} XP!** HOT STREAK! You're on fire!`,
      'comeback_victory': `**+${xpAmount} XP!** INCREDIBLE COMEBACK! From behind to victory!`,
      'perfect_game': `**+${xpAmount} XP!** PERFECT GAME! Flawless execution!`,
      
      // Social achievements
      'first_offer': `**+${xpAmount} XP!** First offer made! You're building connections.`,
      'offer_accepted': `**+${xpAmount} XP!** Offer accepted! Your negotiation skills are legendary.`,
      'community_help': `**+${xpAmount} XP!** Community helper! You're making Flipnosis better.`,
      
      // Milestone achievements
      'level_up': `**+${xpAmount} XP!** LEVEL UP! You've reached new heights!`,
      'milestone_reached': `**+${xpAmount} XP!** MILESTONE! You're hitting all the right notes!`,
      'seasonal_bonus': `**+${xpAmount} XP!** Seasonal bonus! Special rewards for special players!`
    };

    return messages[reason] || `**+${xpAmount} XP!** Achievement unlocked: ${reason}`;
  }

  // Award XP for profile completion
  async awardProfileXP(userAddress, field, value) {
    return new Promise((resolve, reject) => {
      const xpAmount = 250;
      const fieldMap = {
        'name': 'name_set',
        'avatar': 'avatar_set', 
        'twitter': 'twitter_added',
        'telegram': 'telegram_added',
        'heads_image': 'heads_customized',
        'tails_image': 'tails_customized'
      };

      const reason = fieldMap[field];
      if (!reason) {
        reject(new Error(`Invalid profile field: ${field}`));
        return;
      }

      // Check if XP was already earned for this field
      const earnedField = `xp_${field}_earned`;
      
      this.db.get(
        `SELECT ${earnedField}, xp FROM profiles WHERE address = ?`,
        [userAddress.toLowerCase()],
        (err, profile) => {
          if (err) {
            reject(err);
            return;
          }

          if (!profile) {
            // Create new profile with XP
            this.db.run(
              `INSERT INTO profiles (address, ${field}, ${earnedField}, xp, created_at, updated_at)
               VALUES (?, ?, TRUE, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
              [userAddress.toLowerCase(), value, xpAmount],
              function(err) {
                if (err) {
                  reject(err);
                } else {
                  const message = this.getXPMessage(xpAmount, reason);
                  resolve({ xpGained: xpAmount, message, totalXP: xpAmount });
                }
              }.bind(this)
            );
          } else if (!profile[earnedField] && value && value.trim() !== '') {
            // Award XP for first time setting this field
            this.db.run(
              `UPDATE profiles 
               SET ${field} = ?, ${earnedField} = TRUE, xp = xp + ?, updated_at = CURRENT_TIMESTAMP
               WHERE address = ?`,
              [value, xpAmount, userAddress.toLowerCase()],
              function(err) {
                if (err) {
                  reject(err);
                } else {
                  const message = this.getXPMessage(xpAmount, reason);
                  const newTotalXP = profile.xp + xpAmount;
                  resolve({ xpGained: xpAmount, message, totalXP: newTotalXP });
                }
              }.bind(this)
            );
          } else {
            // No XP awarded (already earned or empty value)
            resolve({ xpGained: 0, message: null, totalXP: profile.xp });
          }
        }
      );
    });
  }

  // Award XP for game outcomes
  async awardGameXP(userAddress, gameResult, gameId = null) {
    return new Promise((resolve, reject) => {
      const xpAmount = gameResult === 'won' ? 750 : 250;
      const reason = gameResult === 'won' ? 'game_won' : 'game_lost';

      this.db.run(
        `UPDATE profiles 
         SET xp = xp + ?, updated_at = CURRENT_TIMESTAMP
         WHERE address = ?`,
        [xpAmount, userAddress.toLowerCase()],
        function(err) {
          if (err) {
            reject(err);
            return;
          }

          // Log the XP award
          this.logXPAward(userAddress, xpAmount, reason, gameId);

          const message = this.getXPMessage(xpAmount, reason);
          
          // Get updated total XP
          this.db.get(
            'SELECT xp FROM profiles WHERE address = ?',
            [userAddress.toLowerCase()],
            (err, profile) => {
              if (err) {
                reject(err);
              } else {
                resolve({ 
                  xpGained: xpAmount, 
                  message, 
                  totalXP: profile.xp,
                  gameResult 
                });
              }
            }
          );
        }.bind(this)
      );
    });
  }

  // Award XP for special achievements
  async awardSpecialXP(userAddress, reason, xpAmount = 250, gameId = null) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE profiles 
         SET xp = xp + ?, updated_at = CURRENT_TIMESTAMP
         WHERE address = ?`,
        [xpAmount, userAddress.toLowerCase()],
        function(err) {
          if (err) {
            reject(err);
            return;
          }

          // Log the XP award
          this.logXPAward(userAddress, xpAmount, reason, gameId);

          const message = this.getXPMessage(xpAmount, reason);
          
          // Get updated total XP
          this.db.get(
            'SELECT xp FROM profiles WHERE address = ?',
            [userAddress.toLowerCase()],
            (err, profile) => {
              if (err) {
                reject(err);
              } else {
                resolve({ 
                  xpGained: xpAmount, 
                  message, 
                  totalXP: profile.xp,
                  reason 
                });
              }
            }
          );
        }.bind(this)
      );
    });
  }

  // Log XP awards for tracking
  async logXPAward(userAddress, xpAmount, reason, gameId = null) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO admin_actions (admin_address, action_type, target_address, amount, game_id, chain, details, created_at)
         VALUES ('SYSTEM', 'XP_AWARD', ?, ?, ?, 'base', ?, CURRENT_TIMESTAMP)`,
        [userAddress.toLowerCase(), xpAmount, gameId, JSON.stringify({ reason })],
        function(err) {
          if (err) {
            console.error('Error logging XP award:', err);
          }
          resolve();
        }
      );
    });
  }

  // Get user's XP and level
  async getUserXP(userAddress) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT xp FROM profiles WHERE address = ?',
        [userAddress.toLowerCase()],
        (err, profile) => {
          if (err) {
            reject(err);
          } else {
            const xp = profile ? profile.xp : 0;
            const level = this.calculateLevel(xp);
            resolve({ xp, level });
          }
        }
      );
    });
  }

  // Calculate level based on XP (simple formula: level = floor(sqrt(xp/100)) + 1)
  calculateLevel(xp) {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  }

  // Get XP needed for next level
  getXPForNextLevel(currentLevel) {
    return Math.pow(currentLevel, 2) * 100;
  }

  // Get leaderboard
  async getLeaderboard(limit = 10) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT address, name, avatar, xp, 
                xp_name_earned, xp_avatar_earned, xp_twitter_earned, 
                xp_telegram_earned, xp_heads_earned, xp_tails_earned
         FROM profiles 
         WHERE xp > 0 
         ORDER BY xp DESC 
         LIMIT ?`,
        [limit],
        (err, profiles) => {
          if (err) {
            reject(err);
          } else {
            const leaderboard = profiles.map(profile => ({
              ...profile,
              level: this.calculateLevel(profile.xp),
              xpForNextLevel: this.getXPForNextLevel(this.calculateLevel(profile.xp))
            }));
            resolve(leaderboard);
          }
        }
      );
    });
  }

  // Get user achievements
  async getUserAchievements(userAddress) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT xp_name_earned, xp_avatar_earned, xp_twitter_earned, 
                xp_telegram_earned, xp_heads_earned, xp_tails_earned, xp
         FROM profiles WHERE address = ?`,
        [userAddress.toLowerCase()],
        (err, profile) => {
          if (err) {
            reject(err);
          } else if (!profile) {
            resolve({
              achievements: [],
              totalXP: 0,
              level: 1,
              completion: 0
            });
          } else {
            const achievements = [
              { id: 'name', name: 'Identity Claimed', earned: profile.xp_name_earned, xp: 250 },
              { id: 'avatar', name: 'Avatar Set', earned: profile.xp_avatar_earned, xp: 250 },
              { id: 'twitter', name: 'Twitter Connected', earned: profile.xp_twitter_earned, xp: 250 },
              { id: 'telegram', name: 'Telegram Connected', earned: profile.xp_telegram_earned, xp: 250 },
              { id: 'heads', name: 'Custom Heads', earned: profile.xp_heads_earned, xp: 250 },
              { id: 'tails', name: 'Custom Tails', earned: profile.xp_tails_earned, xp: 250 }
            ];

            const earnedCount = achievements.filter(a => a.earned).length;
            const completion = Math.round((earnedCount / achievements.length) * 100);

            resolve({
              achievements,
              totalXP: profile.xp,
              level: this.calculateLevel(profile.xp),
              completion
            });
          }
        }
      );
    });
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = { XPService }; 