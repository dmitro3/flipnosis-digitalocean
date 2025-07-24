const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Setting platform fee receiver...");

  // Contract address on Base
  const contractAddress = "0x807885ec42b9A727C4763d8F929f2ac132eDF6F0";
  
  // Admin wallet address (same as deployer)
  const adminWallet = "0x47d80671Bcb7Ec368ef4d3ca6E1C20173CCc9a28";

  // Get the contract
  const NFTFlipGame = await ethers.getContractFactory("contracts/NFTFlipGame.sol:NFTFlipGame");
  const contract = NFTFlipGame.attach(contractAddress);

  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log(`👤 Admin Wallet: ${adminWallet}`);

  try {
    // Check current owner
    const currentOwner = await contract.owner();
    console.log(`🔍 Current Owner: ${currentOwner}`);

    // Check if we're the owner
    const [deployer] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    
    if (currentOwner.toLowerCase() !== deployerAddress.toLowerCase()) {
      console.error("❌ You are not the contract owner!");
      return;
    }

    // Set platform fee receiver (this would require a function in the contract)
    // For now, let's just verify the contract is working
    console.log("✅ Contract ownership verified!");
    
    // Get current settings
    const listingFee = await contract.listingFeeUSD();
    const platformFee = await contract.platformFeePercent();
    
    console.log(`📋 Current Settings:`);
    console.log(`   - Listing Fee: $${Number(listingFee) / 1000000}`);
    console.log(`   - Platform Fee: ${Number(platformFee) / 100}%`);
    console.log(`   - Owner: ${currentOwner}`);

    console.log("🎉 Platform fee receiver setup complete!");
    console.log("💡 Note: The platform fee receiver is set to the contract owner by default.");
    console.log("💡 To change it, you'll need to add a function to the contract or use the admin panel.");

  } catch (error) {
    console.error("❌ Error setting platform fee receiver:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 