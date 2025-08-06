// Use built-in fetch if available (Node 18+), otherwise use a simple HTTP request
let fetch;
if (typeof globalThis.fetch === 'function') {
  fetch = globalThis.fetch;
} else {
  // Fallback for older Node versions
  const http = require('http');
  const https = require('https');
  
  fetch = (url, options = {}) => {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const req = client.request(url, {
        method: options.method || 'GET',
        headers: options.headers || {},
        ...options
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(JSON.parse(data))
          });
        });
      });
      
      req.on('error', reject);
      if (options.body) {
        req.write(options.body);
      }
      req.end();
    });
  };
}

const API_BASE = 'http://localhost:3000';

async function testLeaderboardAPI() {
  console.log('🧪 Testing Leaderboard API endpoints...\n');

  try {
    // Test all-time leaderboard
    console.log('📊 Testing All-Time Leaderboard...');
    const allTimeResponse = await fetch(`${API_BASE}/api/leaderboard/all-time`);
    if (allTimeResponse.ok) {
      const allTimeData = await allTimeResponse.json();
      console.log(`✅ All-time leaderboard: ${allTimeData.length} players found`);
      if (allTimeData.length > 0) {
        console.log('🏆 Top 3 players:');
        allTimeData.slice(0, 3).forEach((player, index) => {
          console.log(`  ${index + 1}. ${player.address.slice(0, 8)}... - $${player.totalWinnings.toFixed(2)} (${player.gamesWon} wins)`);
        });
      }
    } else {
      console.log(`❌ All-time leaderboard failed: ${allTimeResponse.status}`);
    }

    console.log('\n📅 Testing Weekly Leaderboard...');
    const weeklyResponse = await fetch(`${API_BASE}/api/leaderboard/weekly`);
    if (weeklyResponse.ok) {
      const weeklyData = await weeklyResponse.json();
      console.log(`✅ Weekly leaderboard: ${weeklyData.length} players found`);
      if (weeklyData.length > 0) {
        console.log('🏆 Top 3 players this week:');
        weeklyData.slice(0, 3).forEach((player, index) => {
          console.log(`  ${index + 1}. ${player.address.slice(0, 8)}... - $${player.totalWinnings.toFixed(2)} (${player.gamesWon} wins)`);
        });
      } else {
        console.log('ℹ️ No weekly data available (no games completed this week)');
      }
    } else {
      console.log(`❌ Weekly leaderboard failed: ${weeklyResponse.status}`);
    }

    console.log('\n👑 Testing Last Week Winner...');
    const lastWeekResponse = await fetch(`${API_BASE}/api/leaderboard/last-week-winner`);
    if (lastWeekResponse.ok) {
      const lastWeekData = await lastWeekResponse.json();
      if (lastWeekData.address) {
        console.log(`✅ Last week winner: ${lastWeekData.address.slice(0, 8)}... - $${lastWeekData.totalWinnings.toFixed(2)}`);
      } else {
        console.log('ℹ️ No last week winner data available');
      }
    } else {
      console.log(`❌ Last week winner failed: ${lastWeekResponse.status}`);
    }

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.log('\n💡 Make sure the development server is running on http://localhost:3000');
  }
}

// Run the test
testLeaderboardAPI().catch(console.error); 