const { ethers } = require("hardhat");

async function main() {
  console.log("🏆 Deploying NFTFlipGame contract with Battle Royale functionality...");
  console.log("=" .repeat(70));

  // Admin wallet (will be the contract owner)
  const adminWallet = "0xDd6377919ef1Ad4baBBEAd667eFE3F6607558628";
  
  // USDC token address on Base
  const usdcTokenAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

  console.log(`👤 Admin Wallet: ${adminWallet}`);
  console.log(`💰 USDC Token: ${usdcTokenAddress}`);

  try {
    // Get the signer (connected wallet)
    const [signer] = await ethers.getSigners();
    const signerAddress = await signer.getAddress();
    console.log(`🔑 Connected Wallet: ${signerAddress}`);

    // Verify we're using the correct wallet
    if (signerAddress.toLowerCase() !== adminWallet.toLowerCase()) {
      console.log("❌ ERROR: You need to connect with the admin wallet!");
      console.log("💡 Please connect wallet:", adminWallet);
      console.log("💡 Currently connected:", signerAddress);
      return;
    }

    console.log("\n📦 Deploying NFTFlipGame contract with Battle Royale...");
    
    // Deploy the contract with Battle Royale functionality
    const NFTFlipGame = await ethers.getContractFactory("NFTFlipGame");
    const contract = await NFTFlipGame.deploy(adminWallet, usdcTokenAddress);
    
    console.log(`📝 Deploy transaction hash: ${contract.deploymentTransaction().hash}`);
    
    // Wait for deployment
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    
    console.log("✅ Contract deployed successfully!");
    console.log(`📍 Contract Address: ${contractAddress}`);
    
    // Verify ownership
    const owner = await contract.owner();
    console.log(`👤 Contract Owner: ${owner}`);
    
    // Verify platform fee receiver
    const platformFeeReceiver = await contract.platformFeeReceiver();
    console.log(`💰 Platform Fee Receiver: ${platformFeeReceiver}`);
    
    // Get contract info
    const depositTimeout = await contract.depositTimeout();
    const platformFeePercent = await contract.platformFeePercent();
    
    console.log("\n📋 Contract Configuration:");
    console.log(`   - Deposit Timeout: ${Number(depositTimeout)} seconds`);
    console.log(`   - Platform Fee: ${Number(platformFeePercent) / 100}%`);
    console.log(`   - USDC Token: ${usdcTokenAddress}`);
    
    // Test Battle Royale functions exist
    console.log("\n🏆 Verifying Battle Royale Functions:");
    try {
      // These calls will fail if functions don't exist
      await contract.battleRoyaleGames.staticCall("0x0000000000000000000000000000000000000000000000000000000000000000");
      console.log("   ✅ battleRoyaleGames mapping exists");
      
      // Check if createBattleRoyale function exists by getting its selector
      const createBRSelector = contract.interface.getFunction("createBattleRoyale").selector;
      console.log(`   ✅ createBattleRoyale function exists (${createBRSelector})`);
      
      const joinBRSelector = contract.interface.getFunction("joinBattleRoyale").selector;
      console.log(`   ✅ joinBattleRoyale function exists (${joinBRSelector})`);
      
      const completeBRSelector = contract.interface.getFunction("completeBattleRoyale").selector;
      console.log(`   ✅ completeBattleRoyale function exists (${completeBRSelector})`);
      
      console.log("   🎉 All Battle Royale functions verified!");
    } catch (error) {
      console.log("   ❌ Battle Royale functions missing:", error.message);
      console.log("   💡 Make sure you deployed the updated contract with Battle Royale functions");
    }
    
    // Save deployment info
    const deploymentInfo = {
      network: "base",
      contractAddress: contractAddress,
      deployer: adminWallet,
      deploymentTime: new Date().toISOString(),
      features: ["1v1Games", "BattleRoyale"],
      constructorArgs: {
        platformFeeReceiver: adminWallet,
        usdcToken: usdcTokenAddress
      },
      battleRoyaleConfig: {
        maxPlayers: 8,
        defaultEntryFee: "5.00",
        defaultServiceFee: "0.50",
        platformFeePercent: "3.5%"
      }
    };
    
    // Write to file
    const fs = require('fs');
    const deploymentFile = `deployments/battle-royale-contract-${Date.now()}.json`;
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
    console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);
    
    console.log("\n🎉 Battle Royale contract deployment complete!");
    console.log("💡 Contract includes both 1v1 games AND Battle Royale functionality.");
    console.log("💡 Update your application to use the new contract address.");
    
    // Instructions for next steps
    console.log("\n📝 Next Steps:");
    console.log("1. Update CONTRACT_ADDRESS in environment variables");
    console.log("2. Update src/services/ContractService.js with new address");
    console.log("3. Test both 1v1 games and Battle Royale creation");
    console.log("4. Deploy the application with Battle Royale features");
    
    console.log("\n🎮 Battle Royale Features Available:");
    console.log("   - 8-player elimination tournaments");
    console.log("   - NFT prizes with crypto entry fees");
    console.log("   - Real-time elimination rounds");
    console.log("   - Creator earnings + platform fees");
    
    console.log(`\n📍 NEW CONTRACT ADDRESS: ${contractAddress}`);
    console.log("🔗 Add this to your environment variables!");

  } catch (error) {
    console.error("❌ Error deploying contract:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.log("💡 Make sure your wallet has enough ETH for deployment.");
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
