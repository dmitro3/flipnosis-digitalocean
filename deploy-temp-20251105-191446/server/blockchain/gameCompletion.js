const { ethers } = require('ethers');
require('dotenv').config();

// Contract ABI - only the functions we need
const GAME_CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "bytes32", "name": "gameId", "type": "bytes32"},
      {"internalType": "address", "name": "winner", "type": "address"}
    ],
    "name": "completeBattleRoyale",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "gameId", "type": "bytes32"},
      {"internalType": "address", "name": "winner", "type": "address"}
    ],
    "name": "completeBattleRoyaleEarly",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

class GameCompletionService {
  constructor() {
    // Initialize provider and wallet from environment
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    this.adminWallet = new ethers.Wallet(
      process.env.CONTRACT_OWNER_KEY, 
      this.provider
    );
    this.contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      GAME_CONTRACT_ABI,
      this.adminWallet
    );
    
    console.log('GameCompletionService initialized');
    console.log('Admin wallet address:', this.adminWallet.address);
    this.checkBalance();
  }

  // Check admin wallet balance
  async checkBalance() {
    try {
      const balance = await this.provider.getBalance(this.adminWallet.address);
      const balanceInEth = ethers.formatEther(balance);
      console.log(`Admin wallet balance: ${balanceInEth} ETH`);
      
      // Warn if balance is low
      if (parseFloat(balanceInEth) < 0.01) {
        console.warn('⚠️ WARNING: Admin wallet balance is low! Please add ETH for gas fees.');
      }
    } catch (error) {
      console.error('Failed to check balance:', error);
    }
  }

  // Convert gameId to bytes32 format
  getGameIdBytes32(gameId) {
    // If already bytes32 format, return as is
    if (gameId.startsWith('0x') && gameId.length === 66) {
      return gameId;
    }
    // Convert string to bytes32
    return ethers.encodeBytes32String(gameId);
  }

  // Complete a battle royale game on-chain
  async completeBattleRoyaleOnChain(gameId, winnerAddress, playerCount = 4) {
    try {
      console.log(`Completing game ${gameId} with winner ${winnerAddress}`);
      
      const gameIdBytes32 = this.getGameIdBytes32(gameId);
      
      // Choose the right function based on player count
      let tx;
      if (playerCount >= 4) {
        // Full game - use completeBattleRoyale
        console.log('Calling completeBattleRoyale (full game)...');
        tx = await this.contract.completeBattleRoyale(gameIdBytes32, winnerAddress);
      } else if (playerCount >= 2) {
        // Early completion - use completeBattleRoyaleEarly
        console.log('Calling completeBattleRoyaleEarly (partial game)...');
        tx = await this.contract.completeBattleRoyaleEarly(gameIdBytes32, winnerAddress);
      } else {
        throw new Error('Game must have at least 2 players to complete');
      }
      
      console.log(`Transaction sent: ${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`✅ Game completed on-chain! Block: ${receipt.blockNumber}`);
      
      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Failed to complete game on-chain:', error);
      
      // Parse error for common issues
      let errorMessage = error.message;
      if (error.reason) errorMessage = error.reason;
      if (error.error?.message) errorMessage = error.error.message;
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Retry logic for failed transactions
  async completeBattleRoyaleWithRetry(gameId, winnerAddress, playerCount, maxRetries = 3) {
    let retries = 0;
    let lastError;
    
    while (retries < maxRetries) {
      const result = await this.completeBattleRoyaleOnChain(gameId, winnerAddress, playerCount);
      
      if (result.success) {
        return result;
      }
      
      lastError = result.error;
      retries++;
      
      // Don't retry if it's a contract revert (game already completed, etc)
      if (lastError.includes('Game already completed') || 
          lastError.includes('Not the owner') ||
          lastError.includes('Game does not exist')) {
        console.log('Contract revert detected, not retrying:', lastError);
        break;
      }
      
      console.log(`Retry ${retries}/${maxRetries} after 5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    return {
      success: false,
      error: lastError || 'Max retries reached'
    };
  }
}

// Export singleton instance
module.exports = new GameCompletionService();
