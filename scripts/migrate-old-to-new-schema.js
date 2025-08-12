#!/usr/bin/env node

/**
 * Database Migration: Old Schema to New Schema
 * 
 * This script safely migrates the old games table schema to the new schema
 * that includes listing_id and other required columns.
 * 
 * OLD SCHEMA columns: id, creator, joiner, price_usd, etc.
 * NEW SCHEMA columns: id, creator, challenger, listing_id, final_price, etc.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../server/flipz-clean.db');
const BACKUP_PATH = DB_PATH + '.backup.' + new Date().toISOString().replace(/[:.]/g, '-');

async function migrateDatabase() {
  console.log('🔧 Starting database migration...\n');
  
  // Step 1: Create backup
  console.log('💾 Creating backup...');
  try {
    fs.copyFileSync(DB_PATH, BACKUP_PATH);
    console.log(`✅ Backup created: ${BACKUP_PATH}`);
  } catch (error) {
    console.error('❌ Failed to create backup:', error);
    return;
  }
  
  const db = new sqlite3.Database(DB_PATH);
  
  try {
    // Step 2: Check current schema
    console.log('\n📋 Checking current games table schema...');
    
    const tableInfo = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(games)", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    const columnNames = tableInfo.map(col => col.name);
    console.log('Current columns:', columnNames.join(', '));
    
    // Step 3: Check if migration is needed
    const hasOldSchema = columnNames.includes('joiner') && columnNames.includes('price_usd');
    const hasNewSchema = columnNames.includes('challenger') && columnNames.includes('listing_id') && columnNames.includes('final_price');
    
    if (hasNewSchema) {
      console.log('✅ Database already has new schema - no migration needed');
      return;
    }
    
    if (!hasOldSchema) {
      console.log('❌ Database schema is not recognized - manual intervention required');
      return;
    }
    
    console.log('🔄 Migration needed: old schema detected');
    
    // Step 4: Get existing data
    console.log('\n📊 Reading existing games data...');
    const existingGames = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM games", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`Found ${existingGames.length} existing games`);
    
    // Step 5: Create temporary table with new schema
    console.log('\n🔧 Creating new games table...');
    
    await new Promise((resolve, reject) => {
      db.run("ALTER TABLE games RENAME TO games_old", (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Create new games table with correct schema (without complex DEFAULT)
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
    
    console.log('✅ New games table created');
    
    // Step 6: Migrate existing data
    console.log('\n🔄 Migrating existing data...');
    
    for (const game of existingGames) {
      // Map old columns to new columns
      const migratedGame = {
        id: game.id,
        listing_id: `migrated_listing_${game.id.substring(0, 8)}`, // Generate a listing_id
        offer_id: null,
        blockchain_game_id: game.blockchain_game_id,
        creator: game.creator,
        challenger: game.joiner, // joiner -> challenger
        nft_contract: game.nft_contract,
        nft_token_id: game.nft_token_id,
        nft_name: game.nft_name,
        nft_image: game.nft_image,
        nft_collection: game.nft_collection,
        final_price: game.price_usd, // price_usd -> final_price
        coin_data: game.coin || JSON.stringify({ id: 'plain', type: 'default' }),
        status: game.status || 'waiting_deposits',
        creator_deposited: false,
        challenger_deposited: false,
        deposit_deadline: game.deposit_deadline,
        winner: game.winner,
        game_data: game.game_data,
        created_at: game.created_at,
        updated_at: game.updated_at || game.created_at
      };
      
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO games (
            id, listing_id, offer_id, blockchain_game_id, creator, challenger,
            nft_contract, nft_token_id, nft_name, nft_image, nft_collection,
            final_price, coin_data, status, creator_deposited, challenger_deposited,
            deposit_deadline, winner, game_data, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          migratedGame.id, migratedGame.listing_id, migratedGame.offer_id,
          migratedGame.blockchain_game_id, migratedGame.creator, migratedGame.challenger,
          migratedGame.nft_contract, migratedGame.nft_token_id, migratedGame.nft_name,
          migratedGame.nft_image, migratedGame.nft_collection, migratedGame.final_price,
          migratedGame.coin_data, migratedGame.status, migratedGame.creator_deposited,
          migratedGame.challenger_deposited, migratedGame.deposit_deadline,
          migratedGame.winner, migratedGame.game_data, migratedGame.created_at,
          migratedGame.updated_at
        ], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    
    console.log(`✅ Migrated ${existingGames.length} games to new schema`);
    
    // Step 7: Create corresponding listings for migrated games
    console.log('\n📋 Creating listings for migrated games...');
    
    for (const game of existingGames) {
      const listingId = `migrated_listing_${game.id.substring(0, 8)}`;
      
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT OR IGNORE INTO listings (
            id, game_id, creator, nft_contract, nft_token_id, nft_name,
            nft_image, nft_collection, asking_price, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          listingId, game.id, game.creator, game.nft_contract, game.nft_token_id,
          game.nft_name, game.nft_image, game.nft_collection, game.price_usd || 0,
          'game_created', game.created_at
        ], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    
    console.log('✅ Created corresponding listings');
    
    // Step 8: Drop old table
    console.log('\n🗑️  Cleaning up old table...');
    await new Promise((resolve, reject) => {
      db.run("DROP TABLE games_old", (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('✅ Old table removed');
    
    // Step 9: Verify migration
    console.log('\n✅ Migration completed successfully!');
    
    const newCount = await new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as count FROM games", (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    console.log(`📊 Games in new table: ${newCount}`);
    console.log(`💾 Backup saved as: ${BACKUP_PATH}`);
    console.log('\n🎉 Database migration completed! The listing_id error should now be fixed.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('💾 Database backup is available at:', BACKUP_PATH);
    console.log('🔄 You can restore by copying the backup over the current database');
  } finally {
    db.close();
  }
}

// Run the migration
migrateDatabase().catch(console.error);
