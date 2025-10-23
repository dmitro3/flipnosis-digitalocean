#!/usr/bin/env node

const io = require('socket.io-client');

class ServerCoinUnlockTester {
  constructor() {
    this.socket = null;
    this.testAddress = '0x1234567890123456789012345678901234567890';
  }

  async connect() {
    return new Promise((resolve, reject) => {
      console.log('🔌 Connecting to server...');
      
      this.socket = io('http://localhost:3000', {
        transports: ['websocket', 'polling']
      });
      
      this.socket.on('connect', () => {
        console.log('✅ Connected to server');
        resolve();
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('❌ Connection failed:', error);
        reject(error);
      });
      
      // Set timeout
      setTimeout(() => {
        if (!this.socket.connected) {
          reject(new Error('Connection timeout'));
        }
      }, 5000);
    });
  }

  async testGetProfile() {
    return new Promise((resolve, reject) => {
      console.log('🔍 Testing get_player_profile...');
      
      this.socket.emit('get_player_profile', { address: this.testAddress });
      
      this.socket.once('player_profile_data', (profileData) => {
        console.log('📊 Received profile data:', profileData);
        resolve(profileData);
      });
      
      this.socket.once('error', (error) => {
        console.error('❌ Error getting profile:', error);
        reject(error);
      });
      
      // Set timeout
      setTimeout(() => {
        reject(new Error('Profile request timeout'));
      }, 5000);
    });
  }

  async testCoinUnlock() {
    return new Promise((resolve, reject) => {
      console.log('🔓 Testing coin unlock...');
      
      const coinId = 'jestress';
      const cost = 500;
      
      this.socket.emit('unlock_coin', {
        address: this.testAddress,
        coinId: coinId,
        cost: cost
      });
      
      this.socket.once('coin_unlocked', (result) => {
        console.log('📊 Received unlock result:', result);
        resolve(result);
      });
      
      this.socket.once('error', (error) => {
        console.error('❌ Error unlocking coin:', error);
        reject(error);
      });
      
      // Set timeout
      setTimeout(() => {
        reject(new Error('Unlock request timeout'));
      }, 10000);
    });
  }

  async disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      console.log('✅ Disconnected from server');
    }
  }

  async test() {
    try {
      await this.connect();
      
      // Test getting profile first
      const profile = await this.testGetProfile();
      console.log('💰 Current FLIP balance:', profile.flip_balance);
      console.log('🔓 Current unlocked coins:', profile.unlocked_coins);
      
      // Test coin unlock
      const unlockResult = await this.testCoinUnlock();
      
      if (unlockResult.success) {
        console.log('🎉 Coin unlock successful!');
        console.log('💰 New balance:', unlockResult.newBalance);
        console.log('🔓 New unlocked coins:', unlockResult.unlockedCoins);
      } else {
        console.log('❌ Coin unlock failed:', unlockResult.error);
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Run test if this script is executed directly
if (require.main === module) {
  const tester = new ServerCoinUnlockTester();
  tester.test()
    .then(() => {
      console.log('✅ Server coin unlock test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Server coin unlock test failed:', error);
      process.exit(1);
    });
}

module.exports = ServerCoinUnlockTester;
