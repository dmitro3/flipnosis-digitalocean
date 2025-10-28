const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking contract ownership...");
  console.log("=" .repeat(60));

  // Contract address on Base
  const contractAddress = "0xd2a2d0A6a0a446c494EdD059680E0f819f9d480B";
  
  // Old admin wallet
  const oldAdminWallet = "0xDd6377919ef1Ad4baBBEAd667eFE3F6607558628";
  
  // New admin wallet
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

    // Get the signer (connected wallet)
    const [signer] = await ethers.getSigners();
    const signerAddress = await signer.getAddress();
    console.log(`🔑 Connected Wallet: ${signerAddress}`);

    if (currentOwner.toLowerCase() === newAdminWallet.toLowerCase()) {
      console.log("✅ Contract is already owned by the new admin wallet!");
      console.log("🎉 You should be able to use the admin panel with your new wallet.");
      return;
    }

    if (currentOwner.toLowerCase() === oldAdminWallet.toLowerCase()) {
      console.log("⚠️  Contract is owned by the old admin wallet.");
      console.log("💡 You need to transfer ownership to the new wallet.");
      
      // Check if the connected wallet is the current owner
      if (signerAddress.toLowerCase() === currentOwner.toLowerCase()) {
        console.log("\n🔄 Transferring ownership to new admin wallet...");
        
        const tx = await contract.transferOwnership(newAdminWallet);
        console.log(`📝 Transfer transaction hash: ${tx.hash}`);
        
        await tx.wait();
        console.log("✅ Ownership transferred successfully!");
        
        // Verify the transfer
        const newOwner = await contract.owner();
        console.log(`🔍 New Contract Owner: ${newOwner}`);
        
        if (newOwner.toLowerCase() === newAdminWallet.toLowerCase()) {
          console.log("🎉 Contract ownership transfer confirmed!");
          console.log("💡 You can now use the admin panel with your new wallet.");
        } else {
          console.log("❌ Ownership transfer verification failed!");
        }
      } else {
        console.log("❌ You are not the current contract owner!");
        console.log("💡 You need to connect with the old admin wallet to transfer ownership.");
        console.log("💡 Or contact the current owner to transfer ownership to your new wallet.");
      }
    } else {
      console.log("❌ Contract is owned by an unknown address!");
      console.log("💡 This might be a different contract or ownership was transferred elsewhere.");
    }

  } catch (error) {
    console.error("❌ Error checking contract ownership:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.log("💡 Make sure your wallet has enough ETH for gas fees.");
    }
    
    if (error.message.includes("nonce")) {
      console.log("💡 Try refreshing your wallet or waiting a moment before retrying.");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
