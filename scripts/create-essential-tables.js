#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class EssentialTableCreator {
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

  async createProfilesTable() {
    return new Promise((resolve, reject) => {
      console.log('🔧 Creating profiles table...');
      
      this.db.run(`
        CREATE TABLE IF NOT EXISTS profiles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          address TEXT UNIQUE NOT NULL,
          username TEXT,
          profile_picture TEXT,
          xp INTEGER DEFAULT 0,
          level INTEGER DEFAULT 1,
          total_flips INTEGER DEFAULT 0,
          wins INTEGER DEFAULT 0,
          losses INTEGER DEFAULT 0,
          unlocked_coins TEXT DEFAULT '["plain"]',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('❌ Error creating profiles table:', err);
          reject(err);
        } else {
          console.log('✅ Created profiles table');
          resolve();
        }
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

  async createGamesTable() {
    return new Promise((resolve, reject) => {
      console.log('🔧 Creating games table...');
      
      this.db.run(`
        CREATE TABLE IF NOT EXISTS games (
          id TEXT PRIMARY KEY,
          creator TEXT NOT NULL,
          joiner TEXT,
          status TEXT DEFAULT 'waiting',
          game_type TEXT DEFAULT 'test_tubes',
          chain TEXT DEFAULT 'base',
          joiner_role TEXT DEFAULT 'CHOOSER',
          joiner_choice TEXT DEFAULT 'HEADS',
          max_rounds INTEGER DEFAULT 5,
          last_action_time TIMESTAMP,
          countdown_end_time TIMESTAMP,
          auth_info TEXT,
          unclaimed_eth DECIMAL(20, 8) DEFAULT 0,
          unclaimed_usdc DECIMAL(20, 8) DEFAULT 0,
          unclaimed_nfts TEXT,
          total_spectators INTEGER DEFAULT 0,
          coin TEXT,
          game_data TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          started_at DATETIME,
          completed_at DATETIME,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          deposit_deadline TIMESTAMP,
          listing_id TEXT,
          challenger TEXT,
          coin_data TEXT,
          creator_deposited BOOLEAN DEFAULT 0,
          challenger_deposited BOOLEAN DEFAULT 0
        )
      `, (err) => {
        if (err) {
          console.error('❌ Error creating games table:', err);
          reject(err);
        } else {
          console.log('✅ Created games table');
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

  async create() {
    try {
      await this.connect();
      await this.createProfilesTable();
      await this.createCoinUnlockTransactionsTable();
      await this.createGamesTable();
      console.log('🎉 Essential tables created successfully!');
    } catch (error) {
      console.error('❌ Table creation failed:', error);
      throw error;
    } finally {
      await this.close();
    }
  }
}

// Run creation if this script is executed directly
if (require.main === module) {
  const creator = new EssentialTableCreator();
  creator.create()
    .then(() => {
      console.log('✅ Essential tables creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Essential tables creation failed:', error);
      process.exit(1);
    });
}

module.exports = EssentialTableCreator;
