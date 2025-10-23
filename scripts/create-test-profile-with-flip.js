#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class TestProfileCreator {
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

  async createTestProfileWithFlip() {
    return new Promise((resolve, reject) => {
      console.log('🔧 Creating test profile with FLIP tokens...');
      
      const testAddress = '0x1234567890123456789012345678901234567890';
      const flipBalance = 1000; // Give them 1000 FLIP
      const unlockedCoins = '["plain"]';
      
      this.db.run(`
        INSERT OR REPLACE INTO profiles (address, username, xp, unlocked_coins, created_at, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [testAddress, 'TestUser', flipBalance, unlockedCoins], (err) => {
        if (err) {
          console.error('❌ Error creating test profile:', err);
          reject(err);
        } else {
          console.log('✅ Created test profile with 1000 FLIP');
          resolve(testAddress);
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

  async create() {
    try {
      await this.connect();
      await this.createTestProfileWithFlip();
      console.log('🎉 Test profile created successfully!');
    } catch (error) {
      console.error('❌ Profile creation failed:', error);
      throw error;
    } finally {
      await this.close();
    }
  }
}

// Run creation if this script is executed directly
if (require.main === module) {
  const creator = new TestProfileCreator();
  creator.create()
    .then(() => {
      console.log('✅ Test profile creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test profile creation failed:', error);
      process.exit(1);
    });
}

module.exports = TestProfileCreator;
