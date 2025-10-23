#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class ProfilesChecker {
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

  async checkProfiles() {
    return new Promise((resolve, reject) => {
      console.log('🔍 Checking profiles...');
      
      this.db.all('SELECT * FROM profiles', (err, profiles) => {
        if (err) {
          console.error('❌ Error getting profiles:', err);
          reject(err);
        } else {
          console.log('📊 All profiles:');
          profiles.forEach(profile => {
            console.log(`  - Address: ${profile.address}`);
            console.log(`    XP: ${profile.xp}`);
            console.log(`    Unlocked Coins: ${profile.unlocked_coins}`);
            console.log(`    Created: ${profile.created_at}`);
            console.log(`    Updated: ${profile.updated_at}`);
            console.log('');
          });
          resolve(profiles);
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

  async check() {
    try {
      await this.connect();
      await this.checkProfiles();
    } catch (error) {
      console.error('❌ Check failed:', error);
      throw error;
    } finally {
      await this.close();
    }
  }
}

// Run check if this script is executed directly
if (require.main === module) {
  const checker = new ProfilesChecker();
  checker.check()
    .then(() => {
      console.log('✅ Profiles check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Profiles check failed:', error);
      process.exit(1);
    });
}

module.exports = ProfilesChecker;
