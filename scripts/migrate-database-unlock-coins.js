#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseMigrator {
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

  async addUnlockedCoinsField() {
    return new Promise((resolve, reject) => {
      console.log('🔧 Adding unlocked_coins field to profiles table...');
      
      // Check if the field already exists
      this.db.get("PRAGMA table_info(profiles)", (err, row) => {
        if (err) {
          console.error('❌ Error checking table info:', err);
          reject(err);
          return;
        }
        
        // Check if unlocked_coins column exists
        this.db.all("PRAGMA table_info(profiles)", (err, columns) => {
          if (err) {
            console.error('❌ Error getting table info:', err);
            reject(err);
            return;
          }
          
          const hasUnlockedCoins = columns.some(col => col.name === 'unlocked_coins');
          
          if (hasUnlockedCoins) {
            console.log('✅ unlocked_coins field already exists');
            resolve();
            return;
          }
          
          // Add the field
          this.db.run("ALTER TABLE profiles ADD COLUMN unlocked_coins TEXT DEFAULT '[\"plain\"]'", (err) => {
            if (err) {
              console.error('❌ Error adding unlocked_coins field:', err);
              reject(err);
            } else {
              console.log('✅ Added unlocked_coins field to profiles table');
              resolve();
            }
          });
        });
      });
    });
  }

  async createCoinUnlockTransactionsTable() {
    return new Promise((resolve, reject) => {
      console.log('🔧 Creating coin_unlock_transactions table...');
      
      this.db.run(`
        CREATE TABLE IF NOT EXISTS coin_unlock_transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          player_address TEXT NOT NULL,
          coin_id TEXT NOT NULL,
          flip_cost INTEGER NOT NULL,
          flip_balance_before INTEGER NOT NULL,
          flip_balance_after INTEGER NOT NULL,
          unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('❌ Error creating coin_unlock_transactions table:', err);
          reject(err);
        } else {
          console.log('✅ Created coin_unlock_transactions table');
          resolve();
        }
      });
    });
  }

  async updateExistingProfiles() {
    return new Promise((resolve, reject) => {
      console.log('🔧 Updating existing profiles with default unlocked coins...');
      
      this.db.run("UPDATE profiles SET unlocked_coins = '[\"plain\"]' WHERE unlocked_coins IS NULL", (err) => {
        if (err) {
          console.error('❌ Error updating existing profiles:', err);
          reject(err);
        } else {
          console.log('✅ Updated existing profiles with default unlocked coins');
          resolve();
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

  async migrate() {
    try {
      await this.connect();
      await this.addUnlockedCoinsField();
      await this.createCoinUnlockTransactionsTable();
      await this.updateExistingProfiles();
      console.log('🎉 Database migration completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      await this.close();
    }
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  const migrator = new DatabaseMigrator();
  migrator.migrate()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = DatabaseMigrator;
