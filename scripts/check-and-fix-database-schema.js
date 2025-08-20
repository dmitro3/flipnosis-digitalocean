#!/usr/bin/env node

/**
 * Check and Fix Database Schema
 * 
 * This script checks the current database schema and fixes any missing columns
 * that are causing SQLITE_ERROR issues.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = '/opt/flipnosis/app/server/flipz.db';

async function checkAndFixSchema() {
  console.log('🔧 Checking and fixing database schema...\n');
  
  const db = new sqlite3.Database(DB_PATH);
  
  try {
    // Check games table schema
    console.log('📋 Checking games table schema...');
    
    const tableInfo = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(games)", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    if (tableInfo.length === 0) {
      console.log('❌ Games table does not exist!');
      return;
    }
    
    console.log('Current games table columns:');
    tableInfo.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });
    
    // Check for required columns
    const columnNames = tableInfo.map(col => col.name);
    const requiredColumns = [
      'id', 'listing_id', 'blockchain_game_id', 'creator', 'challenger',
      'nft_contract', 'nft_token_id', 'final_price', 'status', 'created_at'
    ];
    
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('\n❌ Missing required columns:', missingColumns);
      console.log('\n🔧 Attempting to fix database schema...');
      
      // The safest approach is to rename the old table and create a new one
      // But first, let's check if there's any data to preserve
      const gameCount = await new Promise((resolve, reject) => {
        db.get("SELECT COUNT(*) as count FROM games", (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        });
      });
      
      console.log(`📊 Found ${gameCount} existing games in database`);
      
      if (gameCount > 0) {
        console.log('⚠️  WARNING: The database contains existing games.');
        console.log('⚠️  To safely update the schema, please backup your data first.');
        console.log('⚠️  This script will not modify the database with existing data.');
        console.log('\n💡 Recommended action:');
        console.log('   1. Create a backup of your database');
        console.log('   2. Run this script again to update the schema');
      } else {
        console.log('✅ No existing games found, safe to update schema');
        
        // Drop and recreate the games table with correct schema
        await new Promise((resolve, reject) => {
          db.run("DROP TABLE IF EXISTS games", (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        
        // Create games table with correct schema
        await new Promise((resolve, reject) => {
          db.run(`
            CREATE TABLE games (
              id TEXT PRIMARY KEY,
              listing_id TEXT NOT NULL,
              offer_id TEXT,
              blockchain_game_id TEXT UNIQUE,
              creator TEXT NOT NULL,
              challenger TEXT,
              nft_contract TEXT NOT NULL,
              nft_token_id TEXT NOT NULL,
              nft_name TEXT,
              nft_image TEXT,
              nft_collection TEXT,
              final_price REAL NOT NULL,
              coin_data TEXT,
              status TEXT DEFAULT 'waiting_deposits',
              creator_deposited BOOLEAN DEFAULT false,
              challenger_deposited BOOLEAN DEFAULT false,
              deposit_deadline TIMESTAMP,
              winner TEXT,
              game_data TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        
        console.log('✅ Games table recreated with correct schema');
      }
    } else {
      console.log('✅ All required columns are present in games table');
    }
    
    // Check other tables
    console.log('\n📋 Checking other required tables...');
    
    const tables = ['listings', 'offers', 'profiles', 'chat_messages'];
    for (const tableName of tables) {
      const exists = await new Promise((resolve, reject) => {
        db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [tableName], (err, row) => {
          if (err) reject(err);
          else resolve(!!row);
        });
      });
      
      if (exists) {
        console.log(`✅ ${tableName} table exists`);
      } else {
        console.log(`❌ ${tableName} table missing`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking database schema:', error);
  } finally {
    db.close();
  }
}

// Run the check
checkAndFixSchema().catch(console.error);
