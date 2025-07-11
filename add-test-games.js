const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const db = new sqlite3.Database('./server/games.db');

// Test NFT data
const testNFTs = [
  {
    name: "Bored Ape #1234",
    image: "https://ipfs.io/ipfs/QmRRPWG96cmgTn2qSzjwr2qvfNEuhunv6FNeMFGa9bx6mQ",
    collection: "Bored Ape Yacht Club",
    contractAddress: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
    tokenId: "1234",
    chain: "ethereum",
    priceUSD: 25.50
  },
  {
    name: "CryptoPunk #5678",
    image: "https://ipfs.io/ipfs/QmZ15eQX8FXjqrLWw4Vvvw1JArCkWBwXy6w9Qk8V1bKbEe",
    collection: "CryptoPunks",
    contractAddress: "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB",
    tokenId: "5678",
    chain: "ethereum",
    priceUSD: 15.75
  },
  {
    name: "Doodle #9999",
    image: "https://ipfs.io/ipfs/QmPMc4tcBsMqLRuCQtPvPe6kS4rVqDpFbw7Bxw6QLe6QqA",
    collection: "Doodles",
    contractAddress: "0x8a90CAb2b38dba7cF6C4a6C4d9C4d9C4d9C4d9C4",
    tokenId: "9999",
    chain: "ethereum",
    priceUSD: 8.25
  },
  {
    name: "Azuki #4321",
    image: "https://ipfs.io/ipfs/QmZ15eQX8FXjqrLWw4Vvvw1JArCkWBwXy6w9Qk8V1bKbEe",
    collection: "Azuki",
    contractAddress: "0xED5AF388653567AfF38846e88b8aC1D6492Ec974",
    tokenId: "4321",
    chain: "ethereum",
    priceUSD: 12.00
  },
  {
    name: "Moonbird #8765",
    image: "https://ipfs.io/ipfs/QmPMc4tcBsMqLRuCQtPvPe6kS4rVqDpFbw7Bxw6QLe6QqA",
    collection: "Moonbirds",
    contractAddress: "0x23581767a106ae21c074b2276D25e5C3e136a68b",
    tokenId: "8765",
    chain: "ethereum",
    priceUSD: 18.50
  }
];

console.log('🎮 Adding test games to database...');

let gamesAdded = 0;

testNFTs.forEach((nft, index) => {
  const gameId = uuidv4();
  const gameType = index % 2 === 0 ? 'nft-vs-crypto' : 'nft-vs-nft';
  
  const sql = `
    INSERT INTO games (
      id, creator, nft_contract, nft_token_id, nft_name, nft_image, 
      nft_collection, price_usd, status, game_type, nft_chain, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const values = [
    gameId,
    '0x1234567890123456789012345678901234567890', // Test creator address
    nft.contractAddress,
    nft.tokenId,
    nft.name,
    nft.image,
    nft.collection,
    nft.priceUSD,
    'waiting',
    gameType,
    nft.chain,
    new Date().toISOString()
  ];
  
  db.run(sql, values, function(err) {
    if (err) {
      console.error(`❌ Error adding game ${index + 1}:`, err);
    } else {
      gamesAdded++;
      console.log(`✅ Added game ${index + 1}: ${nft.name} (${gameType})`);
    }
    
    if (gamesAdded === testNFTs.length) {
      console.log(`\n🎉 Successfully added ${gamesAdded} test games!`);
      console.log('🔄 You can now refresh your app to see the games.');
      db.close();
    }
  });
}); 