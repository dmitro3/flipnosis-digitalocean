#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseInitializer {
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

  async createTables() {
    return new Promise((resolve, reject) => {
      console.log('🔧 Creating database tables...');
      
      // Read the schema file
      const schemaPath = path.join(__dirname, '..', 'schema-sqlite.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Split by semicolon and execute each statement
      const statements = schema.split(';').filter(stmt => stmt.trim());
      
      let completed = 0;
      let hasError = false;
      
      statements.forEach((statement, index) => {
        if (hasError) return;
        
        const trimmed = statement.trim();
        if (!trimmed) {
          completed++;
          if (completed === statements.length) {
            resolve();
          }
          return;
        }
        
        this.db.run(trimmed, (err) => {
          if (err) {
            console.error(`❌ Error executing statement ${index + 1}:`, err);
            console.error(`Statement: ${trimmed.substring(0, 100)}...`);
            hasError = true;
            reject(err);
          } else {
            completed++;
            if (completed === statements.length) {
              console.log('✅ All tables created successfully');
              resolve();
            }
          }
        });
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

  async init() {
    try {
      await this.connect();
      await this.createTables();
      console.log('🎉 Database initialization completed successfully!');
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      throw error;
    } finally {
      await this.close();
    }
  }
}

// Run initialization if this script is executed directly
if (require.main === module) {
  const initializer = new DatabaseInitializer();
  initializer.init()
    .then(() => {
      console.log('✅ Database initialization completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database initialization failed:', error);
      process.exit(1);
    });
}

module.exports = DatabaseInitializer;
