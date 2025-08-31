const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking contract ownership (read-only)...");
  console.log("=" .repeat(60));

  // Contract address on Base
  const contractAddress = "0x415BBd5933EaDc0570403c65114B7c5a1c7FADb7";
  
  // Expected admin wallets
  const oldAdminWallet = "0x47d80671Bcb7Ec368ef4d3ca6E1C20173CCc9a28";
  const newAdminWallet = "0xDd6377919ef1Ad4baBBEAd667eFE3F6607558628";

  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log(`👤 Old Admin Wallet: ${oldAdminWallet}`);
  console.log(`👤 New Admin Wallet: ${newAdminWallet}`);

  try {
    // Get the contract
    const NFTFlipGame = await ethers.getContractFactory("contracts/NFTFlipGame.sol:NFTFlipGame");
    const contract = NFTFlipGame.attach(contractAddress);

    // Check current owner
    const currentOwner = await contract.owner();
    console.log(`\n🔍 Current Contract Owner: ${currentOwner}`);

    // Check platform fee receiver
    const platformFeeReceiver = await contract.platformFeeReceiver();
    console.log(`💰 Platform Fee Receiver: ${platformFeeReceiver}`);

    // Determine the situation
    if (currentOwner.toLowerCase() === newAdminWallet.toLowerCase()) {
      console.log("\n✅ STATUS: Contract is owned by the new admin wallet!");
      console.log("🎉 You should be able to use the admin panel with your new wallet.");
      console.log("💡 If you're still having issues, it might be a different problem.");
    } else if (currentOwner.toLowerCase() === oldAdminWallet.toLowerCase()) {
      console.log("\n⚠️  STATUS: Contract is owned by the old admin wallet.");
      console.log("❌ This is why your NFT withdrawals are failing!");
      console.log("💡 You need to transfer ownership to the new wallet.");
      console.log("💡 Run: npx hardhat run scripts/check-contract-ownership.js --network base");
    } else {
      console.log("\n❓ STATUS: Contract is owned by an unknown address!");
      console.log("💡 This might be a different contract or ownership was transferred elsewhere.");
      console.log("💡 You may need to redeploy the contract or contact the current owner.");
    }

    // Additional checks
    console.log("\n📋 Additional Contract Info:");
    try {
      const depositTimeout = await contract.depositTimeout();
      console.log(`   - Deposit Timeout: ${Number(depositTimeout)} seconds`);
      
      const platformFeePercent = await contract.platformFeePercent();
      console.log(`   - Platform Fee: ${Number(platformFeePercent) / 100}%`);
      
      const usdcToken = await contract.usdcToken();
      console.log(`   - USDC Token: ${usdcToken}`);
      
    } catch (error) {
      console.log("   - Could not read additional contract info");
    }

  } catch (error) {
    console.error("❌ Error checking contract ownership:", error.message);
    
    if (error.message.includes("contract")) {
      console.log("💡 This might not be the correct contract address or ABI.");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
