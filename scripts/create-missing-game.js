const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = '/opt/flipnosis/app/server/flipz.db';

console.log('🔧 Creating missing game and listing data...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    return;
  }
  console.log('✅ Connected to database');
});

// Game data from the frontend
const gameId = 'game_1755622348054_dd45ba7e57f10cf6';
const listingId = 'listing_1755622345767_2309eb50f48e54fe';
const creatorAddress = '0x47d80671Bcb7Ec368ef4d3ca6E1C20173CCc9a28'; // From console logs
const nftContract = '0x035003062428fD92384317d7a853d8b4Dff9888a'; // BASE APE TEAM contract
const nftTokenId = '7639';
const nftName = 'BASE APE TEAM #7639';
const nftCollection = 'BASE APE TEAM';
const nftImage = 'https://ipfs.io/ipfs/bafybeigp4esouh544gy4licjuf46nmbauxvvay3x7s2njrivsqa6tvv6oq/7639';
const price = 0.15; // From console logs

// Create the listing first
console.log('📋 Creating listing...');
db.run(`
  INSERT INTO listings (
    id, game_id, creator, nft_contract, nft_token_id, nft_name, 
    nft_image, nft_collection, nft_chain, asking_price, status, 
    coin_data, listing_fee_paid, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`, [
  listingId, gameId, creatorAddress, nftContract, nftTokenId, nftName,
  nftImage, nftCollection, 'base', price, 'open',
  JSON.stringify({
    id: 'plain',
    type: 'default',
    name: 'Classic',
    headsImage: '/coins/plainh.png',
    tailsImage: '/coins/plaint.png'
  }), false, new Date().toISOString(), new Date().toISOString()
], function(err) {
  if (err) {
    console.error('❌ Error creating listing:', err.message);
    return;
  }
  
  console.log('✅ Listing created successfully');
  
  // Create the game
  console.log('🎮 Creating game...');
  db.run(`
    INSERT INTO games (
      id, listing_id, blockchain_game_id, creator, challenger,
      nft_contract, nft_token_id, nft_name, nft_image, nft_collection,
      price_usd, coin_data, status, creator_deposited, game_type, 
      chain, payment_token, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    gameId, listingId, gameId, creatorAddress, null, // challenger is null initially
    nftContract, nftTokenId, nftName, nftImage, nftCollection,
    price, JSON.stringify({
      id: 'plain',
      type: 'default',
      name: 'Classic',
      headsImage: '/coins/plainh.png',
      tailsImage: '/coins/plaint.png'
    }), 'awaiting_challenger', true, // creator_deposited = true since NFT is already deposited
    'nft-vs-crypto', 'base', 'ETH', new Date().toISOString(), new Date().toISOString()
  ], function(err) {
    if (err) {
      console.error('❌ Error creating game:', err.message);
      return;
    }
    
    console.log('✅ Game created successfully');
    
    // Verify the data was created
    db.get("SELECT * FROM games WHERE id = ?", [gameId], (err, game) => {
      if (err) {
        console.error('❌ Error verifying game:', err.message);
        return;
      }
      
      if (game) {
        console.log('\n✅ Game verification:');
        console.log('   ID:', game.id);
        console.log('   Listing ID:', game.listing_id);
        console.log('   Creator:', game.creator);
        console.log('   Status:', game.status);
        console.log('   NFT:', game.nft_name);
        console.log('   Price:', game.price_usd);
      }
      
      db.get("SELECT * FROM listings WHERE id = ?", [listingId], (err, listing) => {
        if (err) {
          console.error('❌ Error verifying listing:', err.message);
          return;
        }
        
        if (listing) {
          console.log('\n✅ Listing verification:');
          console.log('   ID:', listing.id);
          console.log('   Game ID:', listing.game_id);
          console.log('   Creator:', listing.creator);
          console.log('   Status:', listing.status);
          console.log('   NFT:', listing.nft_name);
          console.log('   Price:', listing.asking_price);
        }
        
        console.log('\n🎉 Game and listing data created successfully!');
        console.log('💰 Offers should now work properly.');
        
        db.close();
      });
    });
  });
});
