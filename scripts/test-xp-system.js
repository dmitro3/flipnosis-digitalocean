const { XPService } = require('../server/services/xpService');

async function testXPSystem() {
  console.log('🧪 Testing XP System...\n');
  
  const xpService = new XPService('./server/flipz-clean.db');
  
  try {
    await xpService.initialize();
    console.log('✅ XP Service initialized\n');
    
    const testAddress = '0x1234567890123456789012345678901234567890';
    
    // Test 1: Profile XP Awards
    console.log('📝 Testing Profile XP Awards...');
    
    const profileTests = [
      { field: 'name', value: 'TestPlayer' },
      { field: 'avatar', value: 'https://example.com/avatar.png' },
      { field: 'twitter', value: '@testplayer' },
      { field: 'telegram', value: '@testplayer' },
      { field: 'heads_image', value: 'https://example.com/heads.png' },
      { field: 'tails_image', value: 'https://example.com/tails.png' }
    ];
    
    for (const test of profileTests) {
      try {
        const result = await xpService.awardProfileXP(testAddress, test.field, test.value);
        console.log(`  ✅ ${test.field}: ${result.xpGained} XP - ${result.message}`);
      } catch (error) {
        console.log(`  ❌ ${test.field}: ${error.message}`);
      }
    }
    
    // Test 2: Game XP Awards
    console.log('\n🎮 Testing Game XP Awards...');
    
    try {
      const gameWinResult = await xpService.awardGameXP(testAddress, 'won', 'game_123');
      console.log(`  ✅ Game Won: ${gameWinResult.xpGained} XP - ${gameWinResult.message}`);
    } catch (error) {
      console.log(`  ❌ Game Won: ${error.message}`);
    }
    
    try {
      const gameLoseResult = await xpService.awardGameXP(testAddress, 'lost', 'game_124');
      console.log(`  ✅ Game Lost: ${gameLoseResult.xpGained} XP - ${gameLoseResult.message}`);
    } catch (error) {
      console.log(`  ❌ Game Lost: ${error.message}`);
    }
    
    // Test 3: Special XP Awards
    console.log('\n🌟 Testing Special XP Awards...');
    
    const specialTests = [
      { reason: 'first_game', amount: 250 },
      { reason: 'winning_streak', amount: 250 },
      { reason: 'comeback_victory', amount: 250 },
      { reason: 'perfect_game', amount: 250 }
    ];
    
    for (const test of specialTests) {
      try {
        const result = await xpService.awardSpecialXP(testAddress, test.reason, test.amount, 'game_125');
        console.log(`  ✅ ${test.reason}: ${result.xpGained} XP - ${result.message}`);
      } catch (error) {
        console.log(`  ❌ ${test.reason}: ${error.message}`);
      }
    }
    
    // Test 4: Get User XP
    console.log('\n📊 Testing User XP Retrieval...');
    
    try {
      const userXP = await xpService.getUserXP(testAddress);
      const xpForNextLevel = xpService.getXPForNextLevel(userXP.level);
      console.log(`  ✅ User XP: ${userXP.xp} | Level: ${userXP.level} | Next Level: ${xpForNextLevel} XP needed`);
    } catch (error) {
      console.log(`  ❌ User XP: ${error.message}`);
    }
    
    // Test 5: Get Leaderboard
    console.log('\n🏆 Testing Leaderboard...');
    
    try {
      const leaderboard = await xpService.getLeaderboard(5);
      console.log(`  ✅ Leaderboard: ${leaderboard.length} players`);
      leaderboard.forEach((player, index) => {
        console.log(`    ${index + 1}. ${player.name || player.address}: ${player.xp} XP (Level ${player.level})`);
      });
    } catch (error) {
      console.log(`  ❌ Leaderboard: ${error.message}`);
    }
    
    // Test 6: Get Achievements
    console.log('\n🏅 Testing Achievements...');
    
    try {
      const achievements = await xpService.getUserAchievements(testAddress);
      console.log(`  ✅ Achievements: ${achievements.achievements.length} total`);
      console.log(`     Total XP: ${achievements.totalXP} | Level: ${achievements.level} | Completion: ${achievements.completion}%`);
      
      achievements.achievements.forEach(achievement => {
        const status = achievement.earned ? '✅' : '❌';
        console.log(`    ${status} ${achievement.name}: ${achievement.xp} XP`);
      });
    } catch (error) {
      console.log(`  ❌ Achievements: ${error.message}`);
    }
    
    // Test 7: XP Messages
    console.log('\n💬 Testing XP Messages...');
    
    const messageTests = [
      { reason: 'name_set', amount: 250 },
      { reason: 'game_won', amount: 750 },
      { reason: 'game_lost', amount: 250 },
      { reason: 'first_game', amount: 250 },
      { reason: 'winning_streak', amount: 250 }
    ];
    
    messageTests.forEach(test => {
      const message = xpService.getXPMessage(test.amount, test.reason);
      console.log(`  ✅ ${test.reason}: ${message}`);
    });
    
    console.log('\n🎉 XP System Test Complete!');
    
  } catch (error) {
    console.error('❌ XP System Test Failed:', error);
  } finally {
    xpService.close();
  }
}

// Run the test
testXPSystem().catch(console.error); 