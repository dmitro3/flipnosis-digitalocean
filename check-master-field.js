#!/usr/bin/env node

/**
 * Check Master Field Balance
 * Shows how much FLIP has been collected in the Master Field
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const DATABASE_PATH = path.join(__dirname, 'server', 'flipz.db');

async function checkMasterField() {
  console.log('💰 Checking Master Field Balance...');
  console.log(`📁 Database: ${DATABASE_PATH}`);

  const db = new sqlite3.Database(DATABASE_PATH);

  try {
    const MASTER_ADDRESS = '0x0000000000000000000000000000000000000000';
    
    // Get master profile
    const masterProfile = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM profiles WHERE address = ?', [MASTER_ADDRESS], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (masterProfile) {
      console.log(`\n💰 Master Field Balance: ${masterProfile.xp || 0} FLIP`);
      console.log(`📊 Master Field Details:`);
      console.log(`  Address: ${masterProfile.address}`);
      console.log(`  XP (FLIP): ${masterProfile.xp || 0}`);
      console.log(`  Created: ${masterProfile.created_at}`);
      console.log(`  Updated: ${masterProfile.updated_at}`);
    } else {
      console.log(`\n💰 Master Field Balance: 0 FLIP (no profile created yet)`);
    }

    // Get total coin unlock transactions
    const transactions = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM coin_unlock_transactions ORDER BY unlocked_at DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`\n📊 Coin Unlock Transactions: ${transactions.length} total`);
    if (transactions.length > 0) {
      const totalSpent = transactions.reduce((sum, tx) => sum + tx.flip_cost, 0);
      console.log(`💰 Total FLIP spent on unlocks: ${totalSpent}`);
      console.log(`\n🔓 Recent unlocks:`);
      transactions.slice(0, 5).forEach(tx => {
        console.log(`  - ${tx.coin_id}: ${tx.flip_cost} FLIP (${tx.unlocked_at})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    db.close();
  }
}

// Run the check
checkMasterField().catch(console.error);
