const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking current platform fee receiver address...");
  console.log("=" .repeat(60));

  // Current deployed contract address
  const contractAddress = "0x1800C075E5a939B8184A50A7efdeC5E1fFF8dd29";
  
  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log(`🔗 BaseScan: https://basescan.org/address/${contractAddress}`);

  try {
    // Get the contract
    const NFTFlipGame = await ethers.getContractFactory("NFTFlipGame");
    const contract = NFTFlipGame.attach(contractAddress);

    // Check current platform fee receiver
    const platformFeeReceiver = await contract.platformFeeReceiver();
    console.log(`\n💰 Current Platform Fee Receiver: ${platformFeeReceiver}`);
    
    // Check contract owner
    const owner = await contract.owner();
    console.log(`👤 Contract Owner: ${owner}`);
    
    // Check if owner can change fee receiver
    const [deployer] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    console.log(`🔑 Your Address: ${deployerAddress}`);
    
    const isOwner = owner.toLowerCase() === deployerAddress.toLowerCase();
    console.log(`🔐 You are owner: ${isOwner ? '✅ YES' : '❌ NO'}`);
    
    if (!isOwner) {
      console.log("\n⚠️  WARNING: You are not the contract owner!");
      console.log("   Only the contract owner can change the platform fee receiver.");
      console.log("   Contact the current owner to update the fee receiver address.");
    } else {
      console.log("\n✅ You can update the platform fee receiver address.");
      console.log("   Run: npx hardhat run scripts/update-fee-receiver.js --network base");
    }

    // Check current fees
    const platformFeePercent = await contract.platformFeePercent();
    console.log(`\n📊 Current Platform Fee: ${Number(platformFeePercent) / 100}%`);

  } catch (error) {
    console.error("❌ Error checking contract:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });












