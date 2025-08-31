const { ethers } = require("hardhat");

async function main() {
  console.log("🔄 Transferring contract ownership...");
  console.log("=" .repeat(60));

  // Contract address on Base
  const contractAddress = "0x415BBd5933EaDc0570403c65114B7c5a1c7FADb7";
  
  // Old admin wallet (current owner)
  const oldAdminWallet = "0x47d80671Bcb7Ec368ef4d3ca6E1C20173CCc9a28";
  
  // New admin wallet (new owner)
  const newAdminWallet = "0xDd6377919ef1Ad4baBBEAd667eFE3F6607558628";

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
