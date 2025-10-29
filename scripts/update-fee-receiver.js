const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Updating platform fee receiver address...");
  console.log("=" .repeat(60));

  // Current deployed contract address
  const contractAddress = "0xB2FC2180e003D818621F4722FFfd7878A218581D";
  
  // NEW SECURE FEE RECEIVER ADDRESS - UPDATE THIS TO YOUR SECURE WALLET
  const newFeeReceiver = "0x6BA07382CF43E41aBfC80dC43FFc96730194A3c1"; // Using your current owner address as secure fee receiver
  
  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log(`💰 New Fee Receiver: ${newFeeReceiver}`);
  console.log(`🔗 BaseScan: https://basescan.org/address/${contractAddress}`);

  if (newFeeReceiver === "0x0000000000000000000000000000000000000000") {
    console.log("\n❌ ERROR: Please update the newFeeReceiver address in this script!");
    console.log("   Edit scripts/update-fee-receiver.js and set newFeeReceiver to your secure wallet address.");
    return;
  }

  try {
    // Get the contract
    const NFTFlipGame = await ethers.getContractFactory("NFTFlipGame");
    const contract = NFTFlipGame.attach(contractAddress);

    // Check current owner
    const owner = await contract.owner();
    const [deployer] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    
    if (owner.toLowerCase() !== deployerAddress.toLowerCase()) {
      console.log("\n❌ ERROR: You are not the contract owner!");
      console.log(`   Current owner: ${owner}`);
      console.log(`   Your address: ${deployerAddress}`);
      return;
    }

    // Check current fee receiver
    const currentFeeReceiver = await contract.platformFeeReceiver();
    console.log(`\n🔍 Current Fee Receiver: ${currentFeeReceiver}`);
    
    if (currentFeeReceiver.toLowerCase() === newFeeReceiver.toLowerCase()) {
      console.log("✅ Fee receiver is already set to the new address!");
      return;
    }

    // Update the platform fee receiver
    console.log("\n🚀 Updating platform fee receiver...");
    const tx = await contract.setPlatformFeeReceiver(newFeeReceiver);
    console.log(`📝 Transaction hash: ${tx.hash}`);
    
    console.log("⏳ Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
    
    // Verify the change
    const updatedFeeReceiver = await contract.platformFeeReceiver();
    console.log(`\n🎉 Success! New Fee Receiver: ${updatedFeeReceiver}`);
    
    if (updatedFeeReceiver.toLowerCase() === newFeeReceiver.toLowerCase()) {
      console.log("✅ Fee receiver successfully updated!");
    } else {
      console.log("❌ Something went wrong - fee receiver not updated correctly");
    }

  } catch (error) {
    console.error("❌ Error updating fee receiver:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.log("\n💡 Make sure you have enough ETH for gas fees");
    } else if (error.message.includes("nonce")) {
      console.log("\n💡 Try again in a few seconds (nonce issue)");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
