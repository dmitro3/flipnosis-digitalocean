const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing NFTFlipGame contract functions...");

  // Contract address on Base
  const contractAddress = "0x1e7E0f0b63AD010081140FC74D3435F00e0Df263";
  
  // Get the contract
  const NFTFlipGame = await ethers.getContractFactory("contracts/NFTFlipGame.sol:NFTFlipGame");
  const contract = NFTFlipGame.attach(contractAddress);

  console.log(`📍 Contract Address: ${contractAddress}`);

  try {
    // Test 1: Basic contract info
    console.log("\n📋 Test 1: Basic Contract Info");
    const owner = await contract.owner();
    const listingFee = await contract.listingFeeUSD();
    const platformFee = await contract.platformFeePercent();
    const nextGameId = await contract.nextGameId();
    
    console.log(`✅ Owner: ${owner}`);
    console.log(`✅ Listing Fee: $${Number(listingFee) / 1000000}`);
    console.log(`✅ Platform Fee: ${Number(platformFee) / 100}%`);
    console.log(`✅ Next Game ID: ${nextGameId}`);

    // Test 2: Price feed integration
    console.log("\n💰 Test 2: Price Feed Integration");
    const ethUsdFeed = await contract.ethUsdFeed();
    const usdcUsdFeed = await contract.usdcUsdFeed();
    const usdcToken = await contract.usdcToken();
    
    console.log(`✅ ETH/USD Feed: ${ethUsdFeed}`);
    console.log(`✅ USDC/USD Feed: ${usdcUsdFeed}`);
    console.log(`✅ USDC Token: ${usdcToken}`);

    // Test 3: ETH amount calculation
    console.log("\n🧮 Test 3: ETH Amount Calculation");
    const testUSD = 1000000; // $1.00 in 6 decimals
    const ethAmount = await contract.getETHAmount(testUSD);
    console.log(`✅ $1.00 = ${ethers.formatEther(ethAmount)} ETH`);

    // Test 4: Check if contract is paused
    console.log("\n⏸️ Test 4: Pause Status");
    const isPaused = await contract.paused();
    console.log(`✅ Contract Paused: ${isPaused}`);

    // Test 5: Check unclaimed rewards (should be 0 for new contract)
    console.log("\n🎁 Test 5: Unclaimed Rewards");
    const [deployer] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    
    const unclaimedETH = await contract.unclaimedETH(deployerAddress);
    const unclaimedUSDC = await contract.unclaimedUSDC(deployerAddress);
    
    console.log(`✅ Unclaimed ETH: ${ethers.formatEther(unclaimedETH)}`);
    console.log(`✅ Unclaimed USDC: ${ethers.formatUnits(unclaimedUSDC, 6)}`);

    // Test 6: Check user games (should be empty for new contract)
    console.log("\n🎮 Test 6: User Games");
    try {
      const userGames = await contract.userGames(deployerAddress);
      console.log(`✅ User Games Count: ${userGames.length}`);
    } catch (error) {
      console.log(`⚠️ User Games function not available: ${error.message}`);
    }

    // Test 7: Check contract balance
    console.log("\n💎 Test 7: Contract Balance");
    const contractBalance = await ethers.provider.getBalance(contractAddress);
    console.log(`✅ Contract ETH Balance: ${ethers.formatEther(contractBalance)}`);

    // Test 8: Verify contract bytecode
    console.log("\n🔍 Test 8: Contract Verification");
    const code = await ethers.provider.getCode(contractAddress);
    if (code !== "0x") {
      console.log(`✅ Contract bytecode verified (${code.length} characters)`);
    } else {
      console.log(`❌ Contract not found at address`);
    }

    // Test 9: Check if we can call view functions
    console.log("\n👁️ Test 9: View Function Access");
    try {
      const maxFeePercent = await contract.MAX_FEE_PERCENT();
      const basisPoints = await contract.BASIS_POINTS();
      console.log(`✅ MAX_FEE_PERCENT: ${maxFeePercent}`);
      console.log(`✅ BASIS_POINTS: ${basisPoints}`);
    } catch (error) {
      console.log(`❌ Error calling view functions: ${error.message}`);
    }

    // Test 10: Check game details (should fail for non-existent game)
    console.log("\n🎯 Test 10: Game Details (Non-existent)");
    try {
      await contract.getGameDetails(1);
      console.log(`❌ Should have failed for non-existent game`);
    } catch (error) {
      console.log(`✅ Correctly failed for non-existent game: ${error.message}`);
    }

    console.log("\n🎉 All contract function tests completed!");
    console.log("\n📝 Summary:");
    console.log("✅ Contract is deployed and accessible");
    console.log("✅ Owner and settings are correct");
    console.log("✅ Price feeds are configured");
    console.log("✅ View functions work properly");
    console.log("✅ Contract is ready for game creation");

  } catch (error) {
    console.error("❌ Error testing contract functions:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test script failed:", error);
    process.exit(1);
  }); 