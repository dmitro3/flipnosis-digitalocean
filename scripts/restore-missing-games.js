const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '../server/flipz.db');

// Data from the listings you provided
const missingGames = [
  {
    id: 'listing_1755366260381_9c3bac0b2ee22796',
    nft_token_id: 9284,
    price_usd: 0.15,
    status: 'waiting'
  },
  {
    id: 'listing_1755363620128_388025b6deb4b337', 
    nft_token_id: 9284,
    price_usd: 0.15,
    status: 'waiting'
  },
  {
    id: 'listing_1755362734367_80a233d43e8c7d33',
    nft_token_id: 5274,
    price_usd: 0.15,
    status: 'waiting'
  },
  {
    id: 'listing_1755362378481_68e63436638e60fc',
    nft_token_id: 9287,
    price_usd: 0.15,
    status: 'waiting'
  },
  {
    id: 'listing_1755362334407_5c7bfe5d205da6c5',
    nft_token_id: 9289,
    price_usd: 0.15,
    status: 'waiting'
  },
  {
    id: 'listing_1755361845873_fc762e5943599768',
    nft_token_id: 9201,
    price_usd: 0.14,
    status: 'waiting'
  },
  {
    id: 'listing_1755361426703_dce7bf4a68ee978c',
    nft_token_id: 1271,
    price_usd: 0.15,
    status: 'waiting'
  },
  {
    id: 'listing_1755345628724_ff14ece992fd420e',
    nft_token_id: 9183,
    price_usd: 0.13,
    status: 'waiting'
  }
];

// NFT contract address (from console output)
const NFT_CONTRACT = '0x70cdcc990efbd44a1cb1c86f7feb9962d15ed71f';
const ADMIN_ADDRESS = '0xDd6377919ef1Ad4baBBEAd667eFE3F6607558628';

async function restoreMissingGames() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err);
        reject(err);
        return;
      }
      console.log('✅ Connected to SQLite database');
    });

    // First, let's check which NFTs are actually in the contract
    const actualNFTs = [1271, 5274, 9201, 9289, 9287]; // From your console output
    
    console.log('🔍 NFTs found in contract:', actualNFTs);
    console.log('📝 Creating database entries for these games...');

    const insertGame = db.prepare(`
      INSERT OR REPLACE INTO games (
        id, creator, nft_contract, nft_token_id, nft_name, nft_image, 
        nft_collection, price_usd, status, created_at, creator_deposited
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let insertedCount = 0;
    const now = new Date().toISOString();

    missingGames.forEach(game => {
      // Only insert games for NFTs that are actually in the contract
      if (actualNFTs.includes(game.nft_token_id)) {
        try {
          insertGame.run([
            game.id,                    // id
            ADMIN_ADDRESS,              // creator (admin)
            NFT_CONTRACT,               // nft_contract
            game.nft_token_id,          // nft_token_id
            `NFT #${game.nft_token_id}`, // nft_name
            '',                         // nft_image (will be filled by metadata update)
            'Unknown Collection',       // nft_collection
            game.price_usd,             // price_usd
            'waiting',                  // status
            now,                        // created_at
            1                           // creator_deposited (true)
          ]);
          insertedCount++;
          console.log(`✅ Restored game: ${game.id} (NFT #${game.nft_token_id})`);
        } catch (error) {
          console.error(`❌ Error inserting game ${game.id}:`, error);
        }
      } else {
        console.log(`⚠️ Skipping game ${game.id} - NFT #${game.nft_token_id} not in contract`);
      }
    });

    insertGame.finalize();

    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err);
        reject(err);
      } else {
        console.log('✅ Database connection closed');
        console.log(`🎉 Successfully restored ${insertedCount} games to database`);
        console.log('💡 Now try the admin panel NFT withdrawal again!');
        resolve(insertedCount);
      }
    });
  });
}

// Run the script
if (require.main === module) {
  restoreMissingGames()
    .then(count => {
      console.log(`\n🎯 SUMMARY: Restored ${count} games`);
      console.log('🔄 Next steps:');
      console.log('1. Refresh your admin panel');
      console.log('2. Go to NFT Management tab');
      console.log('3. Click "Load NFTs"');
      console.log('4. Try withdrawing the NFTs again');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { restoreMissingGames };
