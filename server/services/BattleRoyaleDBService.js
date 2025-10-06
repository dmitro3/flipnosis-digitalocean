class BattleRoyaleDBService {
  constructor(db) {
    this.db = db
  }

  async saveBattleRoyaleGame(gameId, gameData) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO battle_royale_games (
          id, creator, nft_contract, nft_token_id, nft_name, 
          nft_image, nft_collection, nft_chain, entry_fee, service_fee,
          max_players, current_players, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `
      
      this.db.run(query, [
        gameId,
        gameData.creator,
        gameData.nftContract,
        gameData.nftTokenId,
        gameData.nftName,
        gameData.nftImage,
        gameData.nftCollection,
        gameData.nftChain || 'base',
        gameData.entryFee,
        gameData.serviceFee,
        8, // max_players
        1, // current_players (creator)
        'filling',
      ], (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  async addBattleRoyaleParticipant(gameId, playerAddress, slotNumber, entryAmount) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO battle_royale_participants (
          game_id, player_address, slot_number, entry_paid, 
          entry_amount, status, joined_at
        ) VALUES (?, ?, ?, ?, ?, 'active', datetime('now'))
      `
      
      this.db.run(query, [
        gameId,
        playerAddress,
        slotNumber,
        1, // entry_paid
        entryAmount
      ], (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  async updateBattleRoyaleStatus(gameId, status, currentPlayers) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE battle_royale_games 
        SET status = ?, current_players = ?, 
            started_at = CASE WHEN ? = 'active' THEN datetime('now') ELSE started_at END,
            updated_at = datetime('now')
        WHERE id = ?
      `
      
      this.db.run(query, [status, currentPlayers, status, gameId], (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  async saveBattleRoyaleRound(gameId, roundNumber, targetResult, playersBefore, eliminated) {
    return new Promise((resolve, reject) => {
      const roundId = `${gameId}_round_${roundNumber}`
      const query = `
        INSERT INTO battle_royale_rounds (
          id, game_id, round_number, target_result, 
          players_before, players_eliminated, eliminated_players, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `
      
      this.db.run(query, [
        roundId,
        gameId,
        roundNumber,
        targetResult,
        playersBefore,
        eliminated.length,
        JSON.stringify(eliminated)
      ], (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  async getBattleRoyaleGame(gameId) {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM battle_royale_games WHERE id = ?`
      this.db.get(query, [gameId], (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    })
  }

  // Add competitive fields updates
  async updatePlayerStats(gameId, playerAddress, stats) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE battle_royale_participants 
        SET lives = ?,
            power = ?,
            has_shield = ?,
            consecutive_wins = ?,
            has_lightning_round = ?,
            total_xp_earned = ?,
            last_xp_drop = ?
        WHERE game_id = ? AND player_address = ?
      `
      this.db.run(query, [
        stats.lives,
        stats.power,
        stats.hasShield ? 1 : 0,
        stats.consecutiveWins,
        stats.hasLightningRound ? 1 : 0,
        stats.totalXPEarned,
        stats.lastXPDrop,
        gameId,
        playerAddress
      ], (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  async recordShieldUsage(gameId, playerAddress, roundNumber) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE battle_royale_participants 
        SET has_shield = 0,
            shield_used_round = ?
        WHERE game_id = ? AND player_address = ?
      `
      this.db.run(query, [roundNumber, gameId, playerAddress], (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }
}

module.exports = BattleRoyaleDBService
