import FirebaseService from './FirebaseService';
import ContractService from './ContractService';

class SyncService {
  constructor() {
    this.firebaseService = new FirebaseService();
    this.contractService = new ContractService();
  }

  // Sync game from Firebase to Contract
  async syncGameToContract(gameId, provider) {
    try {
      // Get game from Firebase
      const result = await this.firebaseService.getGame(gameId);
      if (!result.success) {
        throw new Error('Game not found in Firebase');
      }

      const game = result.game;
      
      // Skip if already on chain
      if (game.onChain && game.contractGameId) {
        return { success: true, contractGameId: game.contractGameId };
      }

      // Initialize contract service
      await this.contractService.init(provider);

      // Create game on contract
      const contractResult = await this.contractService.createGame(
        game.nft.contractAddress,
        game.nft.tokenId,
        game.price,
        game.rounds,
        0 // ETH payment for now
      );

      if (!contractResult.success) {
        throw new Error(contractResult.error);
      }

      // Update Firebase with contract info
      await this.firebaseService.updateGame(gameId, {
        onChain: true,
        contractGameId: contractResult.gameId,
        contractAddress: this.contractService.contract.address
      });

      return {
        success: true,
        contractGameId: contractResult.gameId
      };

    } catch (error) {
      console.error('Error syncing game to contract:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Sync game state from Contract to Firebase
  async syncGameFromContract(contractGameId, firebaseGameId = null) {
    try {
      // Get game from contract
      const contractGame = await this.contractService.getGame(contractGameId);
      if (!contractGame) {
        throw new Error('Game not found on contract');
      }

      // Find Firebase game if not provided
      if (!firebaseGameId) {
        // You'd need to implement a way to map contract game IDs to Firebase IDs
        // For now, we'll skip this case
        throw new Error('Firebase game ID required');
      }

      // Update Firebase with contract state
      const updates = {
        status: this.mapContractStatusToFirebase(contractGame.status),
        joiner: contractGame.joiner !== '0x0000000000000000000000000000000000000000' ? contractGame.joiner : null,
        currentRound: contractGame.currentRound,
        creatorWins: contractGame.creatorWins,
        joinerWins: contractGame.joinerWins,
        winner: contractGame.winner !== '0x0000000000000000000000000000000000000000' ? contractGame.winner : null,
        lastSyncedAt: new Date()
      };

      await this.firebaseService.updateGame(firebaseGameId, updates);

      return { success: true };

    } catch (error) {
      console.error('Error syncing game from contract:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper function to map contract status to Firebase status
  mapContractStatusToFirebase(contractStatus) {
    const statusMap = {
      0: 'waiting',    // Created
      1: 'active',     // Joined
      2: 'active',     // InProgress
      3: 'completed',  // Completed
      4: 'expired',    // Expired
      5: 'cancelled'   // Cancelled
    };
    return statusMap[contractStatus] || 'unknown';
  }

  // Sync offer from Firebase to Contract
  async syncOfferToContract(gameId, offerId, provider) {
    try {
      // Get offer from Firebase
      const offersResult = await this.firebaseService.getGameOffers(gameId);
      if (!offersResult.success) {
        throw new Error('Could not get offers');
      }

      const offer = offersResult.offers.find(o => o.id === offerId);
      if (!offer) {
        throw new Error('Offer not found');
      }

      // Get Firebase game to get contract game ID
      const gameResult = await this.firebaseService.getGame(gameId);
      if (!gameResult.success || !gameResult.game.contractGameId) {
        throw new Error('Game not found or not on contract');
      }

      // Initialize contract service
      await this.contractService.init(provider);

      // Make offer on contract
      const contractResult = await this.contractService.makeCounterOffer(
        gameResult.game.contractGameId,
        offer.price,
        0 // ETH for now
      );

      if (!contractResult.success) {
        throw new Error(contractResult.error);
      }

      // Update Firebase offer
      await this.firebaseService.updateOffer(gameId, offerId, {
        onChain: true,
        contractTransactionHash: contractResult.transactionHash
      });

      return { success: true };

    } catch (error) {
      console.error('Error syncing offer to contract:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default SyncService; 