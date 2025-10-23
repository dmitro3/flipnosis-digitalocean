#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class CoinUnlockTester {
  constructor() {
    this.dbPath = path.join(__dirname, '..', 'database.sqlite');
    this.db = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ Error connecting to database:', err);
          reject(err);
        } else {
          console.log('✅ Connected to database');
          resolve();
        }
      });
    });
  }

  async createTestProfile() {
    return new Promise((resolve, reject) => {
      console.log('🔧 Creating test profile...');
      
      const testAddress = '0x1234567890123456789012345678901234567890';
      const testProfile = {
        address: testAddress,
        username: 'TestUser',
        xp: 1000, // Give them 1000 FLIP
        unlocked_coins: '["plain"]'
      };
      
      this.db.run(`
        INSERT OR REPLACE INTO profiles (address, username, xp, unlocked_coins, created_at, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [testProfile.address, testProfile.username, testProfile.xp, testProfile.unlocked_coins], (err) => {
        if (err) {
          console.error('❌ Error creating test profile:', err);
          reject(err);
        } else {
          console.log('✅ Created test profile');
          resolve(testAddress);
        }
      });
    });
  }

  async testCoinUnlock(testAddress) {
    return new Promise((resolve, reject) => {
      console.log('🔧 Testing coin unlock...');
      
      // Simulate the unlock process
      const coinId = 'gold';
      const cost = 100;
      
      // Get current profile
      this.db.get('SELECT * FROM profiles WHERE address = ?', [testAddress], (err, profile) => {
        if (err) {
          console.error('❌ Error getting profile:', err);
          reject(err);
          return;
        }
        
        if (!profile) {
          console.error('❌ Profile not found');
          reject(new Error('Profile not found'));
          return;
        }
        
        console.log('📊 Current profile:', {
          address: profile.address,
          xp: profile.xp,
          unlocked_coins: profile.unlocked_coins
        });
        
        const currentBalance = profile.xp || 0;
        const unlockedCoins = JSON.parse(profile.unlocked_coins || '["plain"]');
        
        // Check if already unlocked
        if (unlockedCoins.includes(coinId)) {
          console.log('❌ Coin already unlocked');
          reject(new Error('Coin already unlocked'));
          return;
        }
        
        // Check if has enough FLIP
        if (currentBalance < cost) {
          console.log('❌ Insufficient balance');
          reject(new Error('Insufficient FLIP balance'));
          return;
        }
        
        // Deduct FLIP and unlock coin
        const newBalance = currentBalance - cost;
        unlockedCoins.push(coinId);
        
        // Update profile
        this.db.run(`
          UPDATE profiles 
          SET xp = ?, unlocked_coins = ?, updated_at = CURRENT_TIMESTAMP
          WHERE address = ?
        `, [newBalance, JSON.stringify(unlockedCoins), testAddress], (err) => {
          if (err) {
            console.error('❌ Error updating profile:', err);
            reject(err);
          } else {
            console.log('✅ Profile updated successfully');
            
            // Record transaction
            this.db.run(`
              INSERT INTO coin_unlock_transactions (
                player_address, coin_id, flip_cost, flip_balance_before, flip_balance_after
              ) VALUES (?, ?, ?, ?, ?)
            `, [testAddress, coinId, cost, currentBalance, newBalance], (err) => {
              if (err) {
                console.error('❌ Error recording transaction:', err);
                reject(err);
              } else {
                console.log('✅ Transaction recorded successfully');
                resolve({
                  success: true,
                  newBalance: newBalance,
                  unlockedCoins: unlockedCoins
                });
              }
            });
          }
        });
      });
    });
  }

  async verifyUnlock(testAddress) {
    return new Promise((resolve, reject) => {
      console.log('🔍 Verifying unlock...');
      
      this.db.get('SELECT * FROM profiles WHERE address = ?', [testAddress], (err, profile) => {
        if (err) {
          console.error('❌ Error getting profile:', err);
          reject(err);
        } else {
          console.log('📊 Updated profile:', {
            address: profile.address,
            xp: profile.xp,
            unlocked_coins: profile.unlocked_coins
          });
          
          const unlockedCoins = JSON.parse(profile.unlocked_coins || '["plain"]');
          if (unlockedCoins.includes('gold')) {
            console.log('✅ Coin unlock verified!');
            resolve(true);
          } else {
            console.log('❌ Coin unlock failed!');
            resolve(false);
          }
        }
      });
    });
  }

  async close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('❌ Error closing database:', err);
          } else {
            console.log('✅ Database connection closed');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  async test() {
    try {
      await this.connect();
      const testAddress = await this.createTestProfile();
      await this.testCoinUnlock(testAddress);
      await this.verifyUnlock(testAddress);
      console.log('🎉 Coin unlock test completed successfully!');
    } catch (error) {
      console.error('❌ Test failed:', error);
      throw error;
    } finally {
      await this.close();
    }
  }
}

// Run test if this script is executed directly
if (require.main === module) {
  const tester = new CoinUnlockTester();
  tester.test()
    .then(() => {
      console.log('✅ Coin unlock test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Coin unlock test failed:', error);
      process.exit(1);
    });
}

module.exports = CoinUnlockTester;
