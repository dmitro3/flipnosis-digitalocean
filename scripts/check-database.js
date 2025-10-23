#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseChecker {
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

  async checkTables() {
    return new Promise((resolve, reject) => {
      this.db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
          console.error('❌ Error getting tables:', err);
          reject(err);
        } else {
          console.log('📋 Database tables:');
          tables.forEach(table => {
            console.log(`  - ${table.name}`);
          });
          resolve(tables);
        }
      });
    });
  }

  async checkProfilesTable() {
    return new Promise((resolve, reject) => {
      this.db.all("PRAGMA table_info(profiles)", (err, columns) => {
        if (err) {
          console.error('❌ Error getting profiles table info:', err);
          reject(err);
        } else {
          console.log('📋 Profiles table columns:');
          columns.forEach(col => {
            console.log(`  - ${col.name} (${col.type})`);
          });
          resolve(columns);
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
      await this.checkTables();
      await this.checkProfilesTable();
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
  const checker = new DatabaseChecker();
  checker.check()
    .then(() => {
      console.log('✅ Database check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database check failed:', error);
      process.exit(1);
    });
}

module.exports = DatabaseChecker;
