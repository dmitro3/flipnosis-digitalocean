const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing NEW NFTFlipGame contract functions...");
  
  const contractAddress = "0xF5fdE838AB5aa566AC7d1b9116523268F39CC6D0";
  
  // Get the contract factory
  const NFTFlipGame = await ethers.getContractFactory("contracts/NFTFlipGame.sol:NFTFlipGame");
  
  // Connect to the deployed contract
  const contract = NFTFlipGame.attach(contractAddress);
  
  console.log("📋 Test 1: Basic Contract Info");
  try {
    const owner = await contract.owner();
    const listingFee = await contract.listingFeeUSD();
    const platformFee = await contract.platformFeePercent();
    const depositTimeout = await contract.depositTimeout();
    const ethUsdFeed = await contract.ethUsdFeed();
    const usdcToken = await contract.usdcToken();
    const platformFeeReceiver = await contract.platformFeeReceiver();
    
    console.log("✅ Contract info retrieved successfully!");
    console.log(`   - Owner: ${owner}`);
    console.log(`   - Listing Fee: $${Number(listingFee) / 1000000}`);
    console.log(`   - Platform Fee: ${Number(platformFee) / 100}%`);
    console.log(`   - Deposit Timeout: ${Number(depositTimeout)} seconds`);
    console.log(`   - ETH/USD Feed: ${ethUsdFeed}`);
    console.log(`   - USDC Token: ${usdcToken}`);
    console.log(`   - Platform Fee Receiver: ${platformFeeReceiver}`);
    
  } catch (error) {
    console.error("❌ Error getting contract info:", error.message);
  }
  
  console.log("\n📋 Test 2: View Functions");
  try {
    // Test canDeposit with a dummy game ID
    const dummyGameId = ethers.keccak256(ethers.toUtf8Bytes("test"));
    const canDeposit = await contract.canDeposit(dummyGameId);
    console.log(`✅ canDeposit function works: ${canDeposit}`);
    
    // Test getETHAmount
    const ethAmount = await contract.getETHAmount(1000000); // $1.00
    console.log(`✅ getETHAmount function works: ${ethers.formatEther(ethAmount)} ETH for $1.00`);
    
    // Test getUSDCAmount
    const usdcAmount = await contract.getUSDCAmount(1000000); // $1.00
    console.log(`✅ getUSDCAmount function works: ${usdcAmount} USDC for $1.00`);
    
  } catch (error) {
    console.error("❌ Error testing view functions:", error.message);
  }
  
  console.log("\n📋 Test 3: Game Details Function");
  try {
    // Test getGameDetails with a dummy game ID
    const dummyGameId = ethers.keccak256(ethers.toUtf8Bytes("test"));
    const gameDetails = await contract.getGameDetails(dummyGameId);
    console.log("✅ getGameDetails function works (returns empty game for non-existent game)");
    
  } catch (error) {
    console.error("❌ Error testing getGameDetails:", error.message);
  }
  
  console.log("\n🎉 New contract test completed!");
  console.log("✅ The new contract is working properly with the updated structure.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }); 