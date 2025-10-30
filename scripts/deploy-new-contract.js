const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying new NFTFlipGame contract...");
  console.log("=" .repeat(60));

  // Get the signer (connected wallet) - will be the contract owner
  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();
  console.log(`🔑 Connected Wallet (will be contract owner): ${signerAddress}`);
  
  // USDC token address on Base
  const usdcTokenAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

  console.log(`💰 USDC Token: ${usdcTokenAddress}`);

  try {
    console.log("\n📦 Deploying NFTFlipGame contract...");
    
    // Deploy the contract - signer address will be the owner and platform fee receiver
    const NFTFlipGame = await ethers.getContractFactory("contracts/NFTFlipGame.sol:NFTFlipGame");
    const contract = await NFTFlipGame.deploy(signerAddress, usdcTokenAddress);
    
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
    
    // Save deployment info
    const deploymentInfo = {
      network: "base",
      contractAddress: contractAddress,
      deployer: signerAddress,
      deploymentTime: new Date().toISOString(),
      constructorArgs: {
        platformFeeReceiver: signerAddress,
        usdcToken: usdcTokenAddress
      }
    };
    
    // Write to file
    const fs = require('fs');
    const deploymentFile = `deployments/new-contract-deployment-${Date.now()}.json`;
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
    console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);
    
    console.log("\n🎉 New contract deployment complete!");
    console.log("💡 You can now use the admin panel with your new wallet.");
    console.log("💡 Update your application to use the new contract address.");
    
    // Instructions for next steps
    console.log("\n📝 Next Steps:");
    console.log("1. Update the contract address in your application");
    console.log("2. Test the admin panel with your new wallet");
    console.log("3. The old contract can be abandoned (compromised wallet)");

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
