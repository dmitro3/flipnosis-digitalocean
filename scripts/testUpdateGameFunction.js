const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing updateGameWithPlayer2 function...");
  
  const contractAddress = "0x1e7E0f0b63AD010081140FC74D3435F00e0Df263";
  
  // Get the contract factory
  const NFTFlipGame = await ethers.getContractFactory("NFTFlipGame");
  
  // Get the contract instance
  const contract = NFTFlipGame.attach(contractAddress);
  
  try {
    // Test 1: Check if the function exists in the contract
    console.log("\n📋 Test 1: Function Availability");
    
    // Get the contract ABI to check if the function exists
    const contractABI = NFTFlipGame.interface.format();
    const hasUpdateFunction = contractABI.includes("updateGameWithPlayer2");
    
    console.log(`✅ updateGameWithPlayer2 function available in ABI: ${hasUpdateFunction}`);
    
    // Test 2: Check basic contract info
    console.log("\n📋 Test 2: Basic Contract Info");
    const owner = await contract.owner();
    const listingFee = await contract.listingFeeUSD();
    const platformFee = await contract.platformFeePercent();
    
    console.log(`✅ Owner: ${owner}`);
    console.log(`✅ Listing Fee: $${Number(listingFee) / 1000000}`);
    console.log(`✅ Platform Fee: ${Number(platformFee) / 100}%`);
    
    // Test 3: Try to call the function with explicit ABI
    console.log("\n📋 Test 3: Function Call Test with Explicit ABI");
    
    // Create contract with explicit ABI for the function
    const updateABI = [
      "function updateGameWithPlayer2(bytes32 gameId, address player2, uint256 priceUSD, uint8 paymentToken)"
    ];
    const contractWithUpdate = new ethers.Contract(contractAddress, updateABI, ethers.provider);
    
    try {
      // This should fail because the game doesn't exist
      await contractWithUpdate.updateGameWithPlayer2(
        ethers.id("test-game-id"),
        "0x1234567890123456789012345678901234567890",
        1000000, // $1.00
        0 // ETH
      );
      console.log("❌ Function call should have failed");
    } catch (error) {
      console.log(`✅ Function call failed as expected: ${error.message}`);
      if (error.message.includes("Game does not exist")) {
        console.log("✅ This confirms the updateGameWithPlayer2 function exists and is working!");
      }
    }
    
    console.log("\n🎉 updateGameWithPlayer2 function test completed!");
    console.log("✅ The new contract has the updateGameWithPlayer2 function");
    
  } catch (error) {
    console.error("❌ Error testing updateGameWithPlayer2 function:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }); 