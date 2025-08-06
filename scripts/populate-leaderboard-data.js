const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '../server/games.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log('Connected to database');
});

async function populateLeaderboardData() {
  console.log('🔄 Starting leaderboard data population...');

  try {
    // First, ensure the player_stats table exists
    await new Promise((resolve, reject) => {
      db.run(`
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
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('✅ Player stats table ready');

    // Get all completed games
    const games = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          creator,
          joiner,
          winner,
          price_usd,
          created_at,
          updated_at
        FROM games 
        WHERE status = 'completed' 
          AND winner IS NOT NULL 
          AND winner != ''
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    console.log(`📊 Found ${games.length} completed games`);

    // Create a map to track player stats
    const playerStats = new Map();

    // Process each game
    games.forEach(game => {
      const { creator, joiner, winner, price_usd, created_at, updated_at } = game;
      const price = parseFloat(price_usd) || 0;

      // Process creator
      if (!playerStats.has(creator)) {
        playerStats.set(creator, {
          address: creator,
          totalGames: 0,
          gamesWon: 0,
          gamesLost: 0,
          totalVolume: 0,
          totalRewardsEarned: 0,
          lastActivity: created_at
        });
      }
      const creatorStats = playerStats.get(creator);
      creatorStats.totalGames++;
      creatorStats.totalVolume += price;
      if (winner === creator) {
        creatorStats.gamesWon++;
        creatorStats.totalRewardsEarned += price;
      } else {
        creatorStats.gamesLost++;
      }
      if (new Date(updated_at) > new Date(creatorStats.lastActivity)) {
        creatorStats.lastActivity = updated_at;
      }

      // Process joiner if exists
      if (joiner && joiner !== creator) {
        if (!playerStats.has(joiner)) {
          playerStats.set(joiner, {
            address: joiner,
            totalGames: 0,
            gamesWon: 0,
            gamesLost: 0,
            totalVolume: 0,
            totalRewardsEarned: 0,
            lastActivity: created_at
          });
        }
        const joinerStats = playerStats.get(joiner);
        joinerStats.totalGames++;
        joinerStats.totalVolume += price;
        if (winner === joiner) {
          joinerStats.gamesWon++;
          joinerStats.totalRewardsEarned += price;
        } else {
          joinerStats.gamesLost++;
        }
        if (new Date(updated_at) > new Date(joinerStats.lastActivity)) {
          joinerStats.lastActivity = updated_at;
        }
      }
    });

    console.log(`👥 Processed ${playerStats.size} unique players`);

    if (playerStats.size === 0) {
      console.log('ℹ️ No completed games found. Leaderboard will be empty until games are completed.');
      return;
    }

    // Insert or update player stats
    let insertedCount = 0;
    let updatedCount = 0;

    for (const [address, stats] of playerStats) {
      try {
        await new Promise((resolve, reject) => {
          db.run(`
            INSERT OR REPLACE INTO player_stats (
              user_address, chain, total_games, games_won, games_lost,
              total_volume, total_rewards_earned, last_activity, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `, [
            address,
            'base',
            stats.totalGames,
            stats.gamesWon,
            stats.gamesLost,
            stats.totalVolume,
            stats.totalRewardsEarned,
            stats.lastActivity
          ], function(err) {
            if (err) reject(err);
            else {
              if (this.changes > 0) {
                if (this.lastID) insertedCount++;
                else updatedCount++;
              }
              resolve();
            }
          });
        });
      } catch (error) {
        console.error(`❌ Error processing player ${address}:`, error);
      }
    }

    console.log(`✅ Successfully processed ${insertedCount} new players and updated ${updatedCount} existing players`);

    // Show some sample data
    const topPlayers = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          user_address,
          total_rewards_earned,
          games_won,
          total_games
        FROM player_stats 
        WHERE total_rewards_earned > 0
        ORDER BY total_rewards_earned DESC 
        LIMIT 5
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    console.log('\n🏆 Top 5 Players by Total Rewards:');
    topPlayers.forEach((player, index) => {
      console.log(`${index + 1}. ${player.user_address.slice(0, 8)}... - $${player.total_rewards_earned.toFixed(2)} (${player.games_won}/${player.total_games} wins)`);
    });

  } catch (error) {
    console.error('❌ Error populating leaderboard data:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('✅ Database connection closed');
      }
    });
  }
}

// Run the script
populateLeaderboardData().catch(console.error); 