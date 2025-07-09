const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying simplified NFTFlipGame contract...");

  // Get the contract factory
  const NFTFlipGame = await ethers.getContractFactory("NFTFlipGame");

  // Fee receiver address
  const feeReceiver = "0x47d80671Bcb7Ec368ef4d3ca6E1C20173CCc9a28";
  
  console.log(`💰 Fee Receiver: ${feeReceiver}`);

  // Deploy the contract with only the fee receiver
  const nftFlipGame = await NFTFlipGame.deploy(feeReceiver);

  console.log("⏳ Waiting for deployment...");
  await nftFlipGame.waitForDeployment();

  const deployedAddress = await nftFlipGame.getAddress();
  console.log("✅ NFTFlipGame deployed successfully!");
  console.log(`📍 Contract Address: ${deployedAddress}`);
  
  // Verify deployment
  console.log("🔍 Verifying deployment...");
  
  try {
    // Check if contract is deployed
    const code = await ethers.provider.getCode(deployedAddress);
    if (code === "0x") {
      throw new Error("Contract not deployed");
    }
    
    // Verify initial settings
    const feeReceiverFromContract = await nftFlipGame.feeReceiver();
    const feePercent = await nftFlipGame.feePercent();
    const owner = await nftFlipGame.owner();
    
    console.log("✅ Contract verification successful!");
    console.log(`📋 Initial Settings:`);
    console.log(`   - Fee Receiver: ${feeReceiverFromContract}`);
    console.log(`   - Fee Percent: ${Number(feePercent) / 100}%`);
    console.log(`   - Owner: ${owner}`);
    
  } catch (error) {
    console.error("❌ Contract verification failed:", error.message);
  }

  // Save deployment info
  const deploymentInfo = {
    chain: "base",
    contractAddress: deployedAddress,
    deployer: await nftFlipGame.runner.getAddress(),
    deploymentTime: new Date().toISOString(),
    constructorArgs: {
      feeReceiver: feeReceiver
    },
    initialSettings: {
      feePercent: "350", // 3.5%
    }
  };

  // Write deployment info to file
  const fs = require('fs');
  const deploymentPath = `./deployments/base-deployment.json`;
  
  // Create deployments directory if it doesn't exist
  if (!fs.existsSync('./deployments')) {
    fs.mkdirSync('./deployments');
  }
  
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📄 Deployment info saved to: ${deploymentPath}`);

  console.log("🎉 Deployment complete!");
  console.log("\n📝 Next steps:");
  console.log("1. Update the contract address in ContractService.js");
  console.log("2. Test the contract functions");
  console.log("3. Verify the contract on block explorer");
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 