const gameCompletionService = require('../blockchain/gameCompletion');
const db = require('../database'); // Adjust path to your database

// Function to handle when a battle royale game ends
async function handleBattleRoyaleCompletion(gameId, winnerIdOrAddress) {
  console.log(`\n🏁 Battle Royale Game ${gameId} completed!`);
  console.log(`🏆 Winner: ${winnerIdOrAddress}`);
  
  try {
    // 1. Get game details from database
    const game = await db.get(
      'SELECT * FROM battle_royale_games WHERE id = ?',
      [gameId]
    );
    
    if (!game) {
      throw new Error('Game not found in database');
    }
    
    // 2. Get winner's wallet address
    // If winnerIdOrAddress looks like an address (starts with 0x), use it directly
    // Otherwise, try to look it up from participants table
    let winnerAddress = null;
    if (winnerIdOrAddress && winnerIdOrAddress.startsWith('0x')) {
      // Already an address
      winnerAddress = winnerIdOrAddress.toLowerCase();
    } else {
      // Try to look up from participants table
      const winner = await db.get(
        'SELECT wallet_address FROM battle_royale_participants WHERE game_id = ? AND player_address = ?',
        [gameId, winnerIdOrAddress]
      );
      
      if (winner && winner.wallet_address) {
        winnerAddress = winner.wallet_address.toLowerCase();
      } else {
        // Fallback: assume winnerIdOrAddress is already the address
        winnerAddress = winnerIdOrAddress ? winnerIdOrAddress.toLowerCase() : null;
      }
    }
    
    if (!winnerAddress) {
      throw new Error('Winner wallet address not found or invalid');
    }
    
    // Use winnerAddress for the rest of the function
    const winner = { wallet_address: winnerAddress };
    
    // 3. Update database status to completing
    await db.run(
      'UPDATE battle_royale_games SET status = ? WHERE id = ?',
      ['completing', gameId]
    );
    
    // 4. Complete the game on blockchain
    console.log('📝 Writing to blockchain...');
    const result = await gameCompletionService.completeBattleRoyaleWithRetry(
      gameId,
      winner.wallet_address,
      game.current_players || 4
    );
    
    if (result.success) {
      // 5. Update database with completion info (including winner_address)
      await db.run(
        `UPDATE battle_royale_games 
         SET status = ?, 
             winner_address = ?,
             winner = ?,
             completion_tx = ?, 
             completion_block = ?,
             completed_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        ['completed', winnerAddress, winnerAddress, result.transactionHash, result.blockNumber, gameId]
      );
      
      console.log(`✅ Game ${gameId} fully completed!`);
      console.log(`📊 Transaction: ${result.transactionHash}`);
      
      // 6. Notify players via websocket (if you have this)
      // io.to(`game-${gameId}`).emit('game_completed', {
      //   gameId,
      //   winner: winner.wallet_address,
      //   transactionHash: result.transactionHash
      // });
      
      return {
        success: true,
        transactionHash: result.transactionHash
      };
    } else {
      // Blockchain write failed - mark as pending manual completion
      await db.run(
        `UPDATE battle_royale_games 
         SET status = ?, 
             completion_error = ?
         WHERE id = ?`,
        ['pending_completion', result.error, gameId]
      );
      
      console.error(`❌ Failed to complete game ${gameId} on-chain:`, result.error);
      
      // Alert admin (implement your alerting)
      // sendAdminAlert(`Game ${gameId} failed blockchain completion: ${result.error}`);
      
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    console.error('Error in handleBattleRoyaleCompletion:', error);
    
    // Update database with error
    await db.run(
      `UPDATE battle_royale_games 
       SET status = ?, 
           completion_error = ?
       WHERE id = ?`,
      ['error', error.message, gameId]
    );
    
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  handleBattleRoyaleCompletion
};
