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

async function addSampleData() {
  console.log('🔄 Adding sample leaderboard data...');

  try {
    // Sample player data
    const samplePlayers = [
      {
        address: '0x1234567890123456789012345678901234567890',
        totalGames: 15,
        gamesWon: 12,
        gamesLost: 3,
        totalVolume: 2500.50,
        totalRewardsEarned: 1800.25,
        lastActivity: new Date().toISOString()
      },
      {
        address: '0x2345678901234567890123456789012345678901',
        totalGames: 22,
        gamesWon: 18,
        gamesLost: 4,
        totalVolume: 4200.75,
        totalRewardsEarned: 3200.50,
        lastActivity: new Date().toISOString()
      },
      {
        address: '0x3456789012345678901234567890123456789012',
        totalGames: 8,
        gamesWon: 6,
        gamesLost: 2,
        totalVolume: 1200.00,
        totalRewardsEarned: 900.75,
        lastActivity: new Date().toISOString()
      },
      {
        address: '0x4567890123456789012345678901234567890123',
        totalGames: 30,
        gamesWon: 25,
        gamesLost: 5,
        totalVolume: 6800.25,
        totalRewardsEarned: 5500.00,
        lastActivity: new Date().toISOString()
      },
      {
        address: '0x5678901234567890123456789012345678901234',
        totalGames: 12,
        gamesWon: 9,
        gamesLost: 3,
        totalVolume: 1800.50,
        totalRewardsEarned: 1350.25,
        lastActivity: new Date().toISOString()
      }
    ];

    // Insert sample data
    for (const player of samplePlayers) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT OR REPLACE INTO player_stats (
            user_address, chain, total_games, games_won, games_lost,
            total_volume, total_rewards_earned, last_activity, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
          player.address,
          'base',
          player.totalGames,
          player.gamesWon,
          player.gamesLost,
          player.totalVolume,
          player.totalRewardsEarned,
          player.lastActivity
        ], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    console.log(`✅ Added ${samplePlayers.length} sample players`);

    // Show the sample data
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
        LIMIT 10
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    console.log('\n🏆 Sample Leaderboard Data:');
    topPlayers.forEach((player, index) => {
      console.log(`${index + 1}. ${player.user_address.slice(0, 8)}... - $${player.total_rewards_earned.toFixed(2)} (${player.games_won}/${player.total_games} wins)`);
    });

  } catch (error) {
    console.error('❌ Error adding sample data:', error);
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
addSampleData().catch(console.error); 