#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseConnectionTester {
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

  async testProfileOperations() {
    return new Promise((resolve, reject) => {
      console.log('🔧 Testing profile operations...');
      
      const testAddress = '0x1234567890123456789012345678901234567890';
      
      // Test getting profile
      this.db.get('SELECT * FROM profiles WHERE address = ?', [testAddress], (err, profile) => {
        if (err) {
          console.error('❌ Error getting profile:', err);
          reject(err);
          return;
        }
        
        console.log('📊 Profile found:', profile);
        
        if (!profile) {
          console.log('⚠️ Profile not found, creating test profile...');
          
          // Create test profile
          this.db.run(`
            INSERT INTO profiles (address, username, xp, unlocked_coins, created_at, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `, [testAddress, 'TestUser', 1000, '["plain"]'], (err) => {
            if (err) {
              console.error('❌ Error creating profile:', err);
              reject(err);
            } else {
              console.log('✅ Created test profile');
              resolve();
            }
          });
        } else {
          console.log('✅ Profile exists');
          resolve();
        }
      });
    });
  }

  async testUpdateProfile() {
    return new Promise((resolve, reject) => {
      console.log('🔧 Testing profile update...');
      
      const testAddress = '0x1234567890123456789012345678901234567890';
      const newBalance = 900;
      const unlockedCoins = '["plain","gold"]';
      
      this.db.run(`
        UPDATE profiles 
        SET xp = ?, unlocked_coins = ?, updated_at = CURRENT_TIMESTAMP
        WHERE address = ?
      `, [newBalance, unlockedCoins, testAddress], function(err) {
        if (err) {
          console.error('❌ Error updating profile:', err);
          reject(err);
        } else {
          console.log(`✅ Profile updated successfully, changes: ${this.changes}`);
          resolve(this.changes);
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
      await this.testProfileOperations();
      await this.testUpdateProfile();
      console.log('🎉 Database connection test completed successfully!');
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
  const tester = new DatabaseConnectionTester();
  tester.test()
    .then(() => {
      console.log('✅ Database connection test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database connection test failed:', error);
      process.exit(1);
    });
}

module.exports = DatabaseConnectionTester;
