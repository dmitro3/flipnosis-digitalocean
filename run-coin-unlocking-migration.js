#!/usr/bin/env node

/**
 * Run Coin Unlocking System Migration
 * This script applies the database migration to add coin unlocking functionality
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database path - adjust as needed
const DATABASE_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'server', 'flipz.db');

async function runMigration() {
  console.log('🔄 Starting Coin Unlocking System Migration...');
  console.log(`📁 Database: ${DATABASE_PATH}`);

  const db = new sqlite3.Database(DATABASE_PATH);

  try {
    // Read and execute the migration
    const migrationSQL = fs.readFileSync(path.join(__dirname, 'migration-coin-unlocking-system.sql'), 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL.split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`📝 Executing: ${statement.trim().substring(0, 50)}...`);
        await new Promise((resolve, reject) => {
          db.run(statement, (err) => {
            if (err) {
              // Some errors are expected (like column already exists)
              if (err.message.includes('duplicate column name') || 
                  err.message.includes('already exists') ||
                  err.message.includes('table') && err.message.includes('already exists')) {
                console.log(`⚠️  Expected: ${err.message}`);
                resolve();
              } else {
                reject(err);
              }
            } else {
              resolve();
            }
          });
        });
      }
    }

    console.log('✅ Migration completed successfully!');
    
    // Verify the migration
    console.log('🔍 Verifying migration...');
    
    const profileColumns = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(profiles)", (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => row.name));
      });
    });
    
    console.log('📊 Profile table columns:', profileColumns);
    
    const hasFlipBalance = profileColumns.includes('flip_balance');
    const hasUnlockedCoins = profileColumns.includes('unlocked_coins');
    const hasCustomCoinHeads = profileColumns.includes('custom_coin_heads');
    const hasCustomCoinTails = profileColumns.includes('custom_coin_tails');
    
    if (hasFlipBalance && hasUnlockedCoins && hasCustomCoinHeads && hasCustomCoinTails) {
      console.log('✅ All required columns added successfully!');
    } else {
      console.log('❌ Some columns are missing:', {
        flip_balance: hasFlipBalance,
        unlocked_coins: hasUnlockedCoins,
        custom_coin_heads: hasCustomCoinHeads,
        custom_coin_tails: hasCustomCoinTails
      });
    }
    
    // Check if coin_unlock_transactions table exists
    const tables = await new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='coin_unlock_transactions'", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    if (tables.length > 0) {
      console.log('✅ coin_unlock_transactions table created successfully!');
    } else {
      console.log('❌ coin_unlock_transactions table not found!');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Run the migration
runMigration().catch(console.error);
