import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  setDoc,
  deleteDoc, 
  deleteField,
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from './firebase';

class FirebaseService {
  constructor() {
    console.log('🔥 FirebaseService constructor called')
    this.gamesCollection = collection(db, 'games');
    this.usersCollection = collection(db, 'users');
    this.nftsCollection = collection(db, 'nfts');
    console.log('✅ FirebaseService collections initialized')
  }

  // Game Operations
  async createGame(gameData) {
    try {
      console.log('🔥 Creating game in Firebase:', gameData)
      
      const docRef = await addDoc(this.gamesCollection, {
        ...gameData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        onChain: false,
        contractGameId: null
      });
      
      console.log('✅ Game created with ID:', docRef.id)
      
      return {
        success: true,
        gameId: docRef.id,
        docRef
      };
    } catch (error) {
      console.error('❌ Error creating game:', error);
      console.error('Game data that failed:', gameData);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateGame(gameId, updates) {
    try {
      const gameRef = doc(this.gamesCollection, gameId);
      await updateDoc(gameRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating game:', error);
      return { success: false, error: error.message };
    }
  }

  async getGame(gameId) {
    try {
      const gameRef = doc(this.gamesCollection, gameId);
      const gameSnap = await getDoc(gameRef);
      
      if (gameSnap.exists()) {
        return {
          success: true,
          game: { id: gameSnap.id, ...gameSnap.data() }
        };
      } else {
        return { success: false, error: 'Game not found' };
      }
    } catch (error) {
      console.error('Error getting game:', error);
      return { success: false, error: error.message };
    }
  }

  async getActiveGames(chainFilter = null, limitCount = 50) {
    try {
      console.log('🔍 Fetching active games, chainFilter:', chainFilter)
      
      let q;
      
      if (chainFilter && chainFilter !== 'all') {
        q = query(
          this.gamesCollection,
          where('status', '==', 'waiting'),
          where('nft.chain', '==', chainFilter),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      } else {
        q = query(
          this.gamesCollection,
          where('status', '==', 'waiting'),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }

      const querySnapshot = await getDocs(q);
      console.log('📊 Query snapshot size:', querySnapshot.size)
      
      const games = [];
      
      querySnapshot.forEach((doc) => {
        const gameData = { id: doc.id, ...doc.data() };
        console.log('🎮 Found game:', gameData);
        games.push(gameData);
      });

      console.log('✅ Returning games:', games);
      return { success: true, games };
    } catch (error) {
      console.error('❌ Error getting active games:', error);
      return { success: false, error: error.message, games: [] };
    }
  }

  async getUserGames(userAddress) {
    try {
      const createdGamesQuery = query(
        this.gamesCollection,
        where('creator', '==', userAddress),
        orderBy('createdAt', 'desc')
      );

      const joinedGamesQuery = query(
        this.gamesCollection,
        where('joiner', '==', userAddress),
        orderBy('createdAt', 'desc')
      );

      const [createdSnapshot, joinedSnapshot] = await Promise.all([
        getDocs(createdGamesQuery),
        getDocs(joinedGamesQuery)
      ]);

      const games = [];
      
      createdSnapshot.forEach((doc) => {
        games.push({ id: doc.id, ...doc.data(), userRole: 'creator' });
      });
      
      joinedSnapshot.forEach((doc) => {
        games.push({ id: doc.id, ...doc.data(), userRole: 'joiner' });
      });

      // Sort by creation time
      games.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      return { success: true, games };
    } catch (error) {
      console.error('Error getting user games:', error);
      return { success: false, error: error.message, games: [] };
    }
  }

  // Offer Operations
  async createOffer(gameId, offerData) {
    try {
      const offersCollection = collection(db, 'games', gameId, 'offers');
      const docRef = await addDoc(offersCollection, {
        ...offerData,
        createdAt: serverTimestamp(),
        status: 'pending',
        onChain: false
      });
      
      return {
        success: true,
        offerId: docRef.id
      };
    } catch (error) {
      console.error('Error creating offer:', error);
      return { success: false, error: error.message };
    }
  }

  async getGameOffers(gameId) {
    try {
      const offersCollection = collection(db, 'games', gameId, 'offers');
      const q = query(offersCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const offers = [];
      querySnapshot.forEach((doc) => {
        offers.push({ id: doc.id, ...doc.data() });
      });

      return { success: true, offers };
    } catch (error) {
      console.error('Error getting offers:', error);
      return { success: false, error: error.message, offers: [] };
    }
  }

  async updateOffer(gameId, offerId, updates) {
    try {
      const offerRef = doc(db, 'games', gameId, 'offers', offerId);
      await updateDoc(offerRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating offer:', error);
      return { success: false, error: error.message };
    }
  }

  // User Operations
  async createOrUpdateUser(userAddress, userData) {
    try {
      const userRef = doc(this.usersCollection, userAddress);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        // Update existing user
        await updateDoc(userRef, {
          ...userData,
          lastActive: serverTimestamp()
        });
      } else {
        // Create new user - use setDoc instead of updateDoc
        await setDoc(userRef, {
          address: userAddress,
          ...userData,
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp(),
          gamesCreated: 0,
          gamesWon: 0,
          gamesLost: 0,
          totalEarnings: 0
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error creating/updating user:', error);
      return { success: false, error: error.message };
    }
  }

  async getUser(userAddress) {
    try {
      const userRef = doc(this.usersCollection, userAddress);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return {
          success: true,
          user: { id: userSnap.id, ...userSnap.data() }
        };
      } else {
        return { success: false, error: 'User not found' };
      }
    } catch (error) {
      console.error('Error getting user:', error);
      return { success: false, error: error.message };
    }
  }

  // NFT Cache Operations
  async cacheNFT(nftData) {
    try {
      const nftId = `${nftData.contractAddress}_${nftData.tokenId}`;
      const nftRef = doc(this.nftsCollection, nftId);
      
      // Use setDoc to create or update
      await setDoc(nftRef, {
        ...nftData,
        lastUpdated: serverTimestamp()
      }, { merge: true }); // merge: true will update existing fields or create if doesn't exist
      
      return { success: true };
    } catch (error) {
      console.error('Error caching NFT:', error);
      return { success: false, error: error.message };
    }
  }

  async getCachedNFT(contractAddress, tokenId) {
    try {
      const nftId = `${contractAddress}_${tokenId}`;
      const nftRef = doc(this.nftsCollection, nftId);
      const nftSnap = await getDoc(nftRef);
      
      if (nftSnap.exists()) {
        return {
          success: true,
          nft: { id: nftSnap.id, ...nftSnap.data() }
        };
      } else {
        return { success: false, error: 'NFT not found in cache' };
      }
    } catch (error) {
      console.error('Error getting cached NFT:', error);
      return { success: false, error: error.message };
    }
  }

  // Real-time subscriptions
  subscribeToActiveGames(callback, chainFilter = null) {
    let q = query(
      this.gamesCollection,
      where('status', '==', 'waiting'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    if (chainFilter) {
      q = query(
        this.gamesCollection,
        where('status', '==', 'waiting'),
        where('nft.chain', '==', chainFilter),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    }

    return onSnapshot(q, (querySnapshot) => {
      const games = [];
      querySnapshot.forEach((doc) => {
        games.push({ id: doc.id, ...doc.data() });
      });
      callback(games);
    });
  }

  subscribeToGame(gameId, callback) {
    const gameRef = doc(this.gamesCollection, gameId);
    return onSnapshot(gameRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      }
    });
  }

  subscribeToGameOffers(gameId, callback) {
    const offersCollection = collection(db, 'games', gameId, 'offers');
    const q = query(offersCollection, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (querySnapshot) => {
      const offers = [];
      querySnapshot.forEach((doc) => {
        offers.push({ id: doc.id, ...doc.data() });
      });
      callback(offers);
    });
  }

  // Check for duplicate listings
  async checkDuplicateListing(contractAddress, tokenId, creatorAddress) {
    try {
      const q = query(
        this.gamesCollection,
        where('nft.contractAddress', '==', contractAddress),
        where('nft.tokenId', '==', tokenId),
        where('creator', '==', creatorAddress),
        where('status', 'in', ['waiting', 'active'])
      );

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const existingGame = querySnapshot.docs[0];
        return {
          isDuplicate: true,
          existingGameId: existingGame.id,
          existingGame: { id: existingGame.id, ...existingGame.data() }
        };
      }

      return { isDuplicate: false };
    } catch (error) {
      console.error('Error checking duplicate listing:', error);
      return { isDuplicate: false, error: error.message };
    }
  }

  // Listing fee operations
  async createListingFeeTransaction(gameId, userAddress, feeAmount, transactionHash) {
    try {
      const feeTransaction = {
        gameId,
        userAddress,
        feeAmount,
        currency: 'ETH',
        status: 'completed',
        createdAt: serverTimestamp(),
        transactionHash
      };

      const feesCollection = collection(db, 'listingFees');
      const docRef = await addDoc(feesCollection, feeTransaction);
      
      return {
        success: true,
        feeId: docRef.id
      };
    } catch (error) {
      console.error('Error creating listing fee transaction:', error);
      return { success: false, error: error.message };
    }
  }

  // Spectator Operations
  async addSpectator(gameId, userAddress) {
    try {
      const gameRef = doc(this.gamesCollection, gameId);
      await updateDoc(gameRef, {
        [`spectators.${userAddress}`]: {
          joinedAt: serverTimestamp(),
          lastSeen: serverTimestamp()
        }
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error adding spectator:', error);
      return { success: false, error: error.message };
    }
  }

  async removeSpectator(gameId, userAddress) {
    try {
      const gameRef = doc(this.gamesCollection, gameId);
      await updateDoc(gameRef, {
        [`spectators.${userAddress}`]: deleteField()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error removing spectator:', error);
      return { success: false, error: error.message };
    }
  }

  // Flip State Operations
  async updateFlipState(gameId, flipState) {
    try {
      const gameRef = doc(this.gamesCollection, gameId);
      await updateDoc(gameRef, {
        currentFlipState: flipState,
        lastFlipUpdate: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating flip state:', error);
      return { success: false, error: error.message };
    }
  }

  async getActivePlayingGames(limitCount = 20) {
    try {
      console.log('🔍 Fetching active playing games for spectating')
      
      const q = query(
        this.gamesCollection,
        where('status', '==', 'playing'),
        orderBy('lastFlipUpdate', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      console.log('📊 Playing games query snapshot size:', querySnapshot.size)
      
      const games = [];
      
      querySnapshot.forEach((doc) => {
        const gameData = { id: doc.id, ...doc.data() };
        console.log('🎮 Found playing game:', gameData);
        games.push(gameData);
      });

      console.log('✅ Returning playing games:', games);
      return { success: true, games };
    } catch (error) {
      console.error('❌ Error getting active playing games:', error);
      return { success: false, error: error.message, games: [] };
    }
  }
}

export default FirebaseService; 