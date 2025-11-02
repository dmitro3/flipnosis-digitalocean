const { ethers } = require("hardhat");

async function main() {
  console.log("🔄 Transferring contract ownership...");
  console.log("=" .repeat(60));

  // Contract address on Base (CURRENT CONTRACT)
  const contractAddress = "0xa90abBDE769BC2901A8E68E6C9758B1Cd6699A5F";
  
  // Old admin wallet (current owner - COMPROMISED)
  const oldAdminWallet = "0x6BA07382CF43E41aBfC80dC43FFc96730194A3c1";
  
  // New admin wallet (new owner - SECURE)
  const newAdminWallet = "0x3618cf0af757f3f2b9824202e7f4a79f41d66297";

  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log(`👤 Current Owner: ${oldAdminWallet}`);
  console.log(`👤 New Owner: ${newAdminWallet}`);

  try {
    // Get the contract
    const NFTFlipGame = await ethers.getContractFactory("contracts/NFTFlipGame.sol:NFTFlipGame");
    const contract = NFTFlipGame.attach(contractAddress);

    // Get the signer (connected wallet)
    const [signer] = await ethers.getSigners();
    const signerAddress = await signer.getAddress();
    console.log(`🔑 Connected Wallet: ${signerAddress}`);

    // Check current owner
    const currentOwner = await contract.owner();
    console.log(`\n🔍 Current Contract Owner: ${currentOwner}`);

    // Verify the connected wallet is the current owner
    if (signerAddress.toLowerCase() !== currentOwner.toLowerCase()) {
      console.log("❌ ERROR: You are not the current contract owner!");
      console.log("💡 You need to connect with the old admin wallet to transfer ownership.");
      console.log("💡 Current owner:", currentOwner);
      console.log("💡 Connected wallet:", signerAddress);
      return;
    }

    // Check if ownership is already transferred
    if (currentOwner.toLowerCase() === newAdminWallet.toLowerCase()) {
      console.log("✅ Contract is already owned by the new admin wallet!");
      return;
    }

    console.log("\n🔄 Transferring ownership to new admin wallet...");
    console.log("⚠️  This will require a transaction from the current owner wallet.");
    
    // Transfer ownership
    const tx = await contract.transferOwnership(newAdminWallet);
    console.log(`📝 Transfer transaction hash: ${tx.hash}`);
    
    console.log("⏳ Waiting for transaction confirmation...");
    await tx.wait();
    console.log("✅ Ownership transferred successfully!");
    
    // Verify the transfer
    const newOwner = await contract.owner();
    console.log(`🔍 New Contract Owner: ${newOwner}`);
    
    if (newOwner.toLowerCase() === newAdminWallet.toLowerCase()) {
      console.log("🎉 Contract ownership transfer confirmed!");
      console.log("💡 You can now use the admin panel with your new wallet.");
      console.log("💡 The NFT withdrawal functions should work properly now.");
    } else {
      console.log("❌ Ownership transfer verification failed!");
      console.log("💡 Please check the transaction on Base block explorer.");
    }

  } catch (error) {
    console.error("❌ Error transferring ownership:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.log("💡 Make sure your wallet has enough ETH for gas fees.");
    }
    
    if (error.message.includes("nonce")) {
      console.log("💡 Try refreshing your wallet or waiting a moment before retrying.");
    }
    
    if (error.message.includes("user rejected")) {
      console.log("💡 Transaction was rejected by the user.");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
