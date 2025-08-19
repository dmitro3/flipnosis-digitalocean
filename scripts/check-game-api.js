const fetch = require('node-fetch');

const gameId = 'game_1755622348054_dd45ba7e57f10cf6';
const baseUrl = 'http://localhost:3001'; // Adjust if your server runs on a different port

console.log('🔍 Checking API response for game:', gameId);

async function checkGameAPI() {
  try {
    // Check the game endpoint
    console.log('\n📡 Checking /games endpoint...');
    const gameResponse = await fetch(`${baseUrl}/api/games/${gameId}`);
    console.log('Status:', gameResponse.status);
    
    if (gameResponse.ok) {
      const gameData = await gameResponse.json();
      console.log('✅ Game data received:');
      console.log('   ID:', gameData.id);
      console.log('   Type:', gameData.type);
      console.log('   Creator:', gameData.creator);
      console.log('   Status:', gameData.status);
      console.log('   Listing ID:', gameData.listing_id);
      console.log('   NFT Name:', gameData.nft_name);
      console.log('   Price:', gameData.price_usd);
      
      // Check offers endpoint
      const listingId = gameData.listing_id || gameData.id;
      console.log('\n📡 Checking offers for listing:', listingId);
      const offersResponse = await fetch(`${baseUrl}/api/listings/${listingId}/offers`);
      console.log('Offers Status:', offersResponse.status);
      
      if (offersResponse.ok) {
        const offers = await offersResponse.json();
        console.log('✅ Offers received:', offers.length, 'offers');
        offers.forEach((offer, index) => {
          console.log(`   ${index + 1}. ${offer.offerer_address}: $${offer.offer_price}`);
        });
      } else {
        console.log('❌ Offers not found');
      }
    } else {
      console.log('❌ Game not found');
      
      // Try as listing
      console.log('\n📡 Trying as listing...');
      const listingResponse = await fetch(`${baseUrl}/api/listings/${gameId}`);
      console.log('Listing Status:', listingResponse.status);
      
      if (listingResponse.ok) {
        const listingData = await listingResponse.json();
        console.log('✅ Listing data received:');
        console.log('   ID:', listingData.id);
        console.log('   Creator:', listingData.creator);
        console.log('   Status:', listingData.status);
        console.log('   NFT Name:', listingData.nft_name);
        console.log('   Price:', listingData.asking_price);
      } else {
        console.log('❌ Not found as listing either');
      }
    }
  } catch (error) {
    console.error('❌ Error checking API:', error.message);
  }
}

checkGameAPI();
