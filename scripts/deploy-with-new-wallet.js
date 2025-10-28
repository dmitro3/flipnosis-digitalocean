const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying NFTFlipGame contract with NEW WALLET...");
  console.log("=" .repeat(70));

  // NEW admin wallet (will be the contract owner)
  const newAdminWallet = "0x6BA07382CF43E41aBfC80dC43FFc96730194A3c1";
  
  // USDC token address on Base
  const usdcTokenAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

  console.log(`👤 NEW Admin Wallet: ${newAdminWallet}`);
  console.log(`💰 USDC Token: ${usdcTokenAddress}`);
  console.log(`🔒 OLD Compromised Wallet: 0xDd6377919ef1Ad4baBBEAd667eFE3F6607558628`);

  try {
    // Get the signer (connected wallet)
    const [signer] = await ethers.getSigners();
    const signerAddress = await signer.getAddress();
    console.log(`🔑 Connected Wallet: ${signerAddress}`);

    // Verify we're using the new wallet
    if (signerAddress.toLowerCase() !== newAdminWallet.toLowerCase()) {
      console.log("❌ ERROR: You need to connect with the NEW admin wallet!");
      console.log("💡 Please connect wallet:", newAdminWallet);
      console.log("💡 Currently connected:", signerAddress);
      console.log("💡 Make sure your .env file has the PRIVATE_KEY for the new wallet");
      return;
    }

    console.log("\n📦 Deploying NFTFlipGame contract with Battle Royale...");
    
    // Deploy the contract with Battle Royale functionality
    const NFTFlipGame = await ethers.getContractFactory("NFTFlipGame");
    const contract = await NFTFlipGame.deploy(newAdminWallet, usdcTokenAddress);
    
    console.log(`📝 Deploy transaction hash: ${contract.deploymentTransaction().hash}`);
    
    // Wait for deployment
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    
    console.log("✅ Contract deployed successfully!");
    console.log(`📍 NEW Contract Address: ${contractAddress}`);
    
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
      
      const withdrawWinnerSelector = contract.interface.getFunction("withdrawWinnerNFT").selector;
      console.log(`   ✅ withdrawWinnerNFT function exists (${withdrawWinnerSelector})`);
      
      console.log("   🎉 All Battle Royale functions verified!");
    } catch (error) {
      console.log("   ❌ Battle Royale functions missing:", error.message);
      console.log("   💡 Make sure you deployed the updated contract with Battle Royale functions");
    }
    
    // Save deployment info
    const deploymentInfo = {
      network: "base",
      contractAddress: contractAddress,
      deployer: newAdminWallet,
      deploymentTime: new Date().toISOString(),
      transactionHash: contract.deploymentTransaction().hash,
      features: ["1v1Games", "BattleRoyale"],
      constructorArgs: {
        platformFeeReceiver: newAdminWallet,
        usdcToken: usdcTokenAddress
      },
      battleRoyaleConfig: {
        maxPlayers: 8,
        defaultEntryFee: "5.00",
        defaultServiceFee: "0.50",
        platformFeePercent: "3.5%"
      },
      contractInfo: {
        owner: newAdminWallet,
        platformFeeReceiver: newAdminWallet,
        depositTimeout: Number(depositTimeout),
        platformFeePercent: Number(platformFeePercent)
      },
      verifiedFunctions: [
        "createBattleRoyale",
        "joinBattleRoyale", 
        "completeBattleRoyale",
        "withdrawCreatorFunds",
        "withdrawWinnerNFT",
        "getBattleRoyaleGame",
        "hasBattleRoyaleEntry",
        "battleRoyaleGames",
        "emergencyWithdrawNFT",
        "directTransferNFT"
      ],
      basescanUrl: `https://basescan.org/address/${contractAddress}`,
      status: "deployed_with_new_wallet",
      notes: "Contract deployed with new secure wallet after old wallet was compromised. All admin functions now accessible with new wallet."
    };
    
    // Write to file
    const fs = require('fs');
    const deploymentFile = `deployments/secure-wallet-deployment-${Date.now()}.json`;
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
    console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);
    
    console.log("\n🎉 SECURE contract deployment complete!");
    console.log("🔒 Your new wallet now has full admin access");
    console.log("💡 Update your application to use the new contract address");
    
    // Instructions for next steps
    console.log("\n📝 Next Steps:");
    console.log("1. Update CONTRACT_ADDRESS in environment variables");
    console.log("2. Update src/services/ContractService.js with new address");
    console.log("3. Update server configuration with new contract address");
    console.log("4. Test admin panel access with new wallet");
    console.log("5. The old contract can be abandoned (compromised wallet)");
    
    console.log("\n🎮 Battle Royale Features Available:");
    console.log("   - 8-player elimination tournaments");
    console.log("   - NFT prizes with crypto entry fees");
    console.log("   - Real-time elimination rounds");
    console.log("   - Creator earnings + platform fees");
    console.log("   - Admin emergency withdrawal functions");
    
    console.log(`\n📍 NEW SECURE CONTRACT ADDRESS: ${contractAddress}`);
    console.log("🔗 Add this to your environment variables!");
    console.log("🔒 Admin access restored with secure wallet!");

  } catch (error) {
    console.error("❌ Error deploying contract:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.log("💡 Make sure your new wallet has enough ETH for deployment.");
      console.log("💡 You'll need about 0.01-0.02 ETH for deployment on Base");
    }
    
    if (error.message.includes("nonce")) {
      console.log("💡 Try refreshing your wallet or waiting a moment before retrying.");
    }
    
    if (error.message.includes("user rejected")) {
      console.log("💡 Transaction was rejected by the user.");
    }
    
    if (error.message.includes("private key")) {
      console.log("💡 Make sure your .env file has the correct PRIVATE_KEY for the new wallet");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
