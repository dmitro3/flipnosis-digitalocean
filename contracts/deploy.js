const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting NFTFlipGame deployment...");

  // Base network addresses
  const BASE_ADDRESSES = {
    ETH_USD_PRICE_FEED: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70", // Chainlink ETH/USD on Base
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
    FEE_RECIPIENT: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" // Using USDC address as fee recipient for now
  };

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // Deploy NFTFlipGame contract
  console.log("🏗️ Deploying NFTFlipGame...");
  const NFTFlipGame = await ethers.getContractFactory("NFTFlipGame");
  const nftFlipGame = await NFTFlipGame.deploy(
    BASE_ADDRESSES.ETH_USD_PRICE_FEED, // ETH/USD Price Feed
    BASE_ADDRESSES.USDC, // USDC Token
    BASE_ADDRESSES.FEE_RECIPIENT // Fee Recipient
  );

  await nftFlipGame.waitForDeployment();
  const contractAddress = await nftFlipGame.getAddress();

  console.log("✅ NFTFlipGame deployed to:", contractAddress);
  console.log("🔗 Contract address:", contractAddress);

  // Save deployment info
  const deploymentInfo = {
    network: "base",
    contractAddress: contractAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    constructorArgs: {
      ethUsdFeed: BASE_ADDRESSES.ETH_USD_PRICE_FEED,
      usdcToken: BASE_ADDRESSES.USDC,
      platformFeeReceiver: BASE_ADDRESSES.FEE_RECIPIENT
    }
  };

  // Write to deployment file
  const fs = require('fs');
  const path = require('path');
  const deploymentPath = path.join(__dirname, '..', 'deployments', 'base-deployment.json');
  
  // Ensure deployments directory exists
  const deploymentsDir = path.dirname(deploymentPath);
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("📄 Deployment info saved to:", deploymentPath);

  // Verify deployment
  console.log("🔍 Verifying deployment...");
  try {
    const listingFee = await nftFlipGame.listingFeeUSD();
    const platformFee = await nftFlipGame.platformFeePercent();
    const nextGameId = await nftFlipGame.nextGameId();
    
    console.log("✅ Contract verification successful:");
    console.log("   - Listing fee:", listingFee.toString(), "(in 6 decimals)");
    console.log("   - Platform fee:", platformFee.toString(), "%");
    console.log("   - Next game ID:", nextGameId.toString());
  } catch (error) {
    console.error("❌ Contract verification failed:", error.message);
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("📋 Next steps:");
  console.log("1. Update contract address in src/services/ContractService.js");
  console.log("2. Update contract address in src/config/rainbowkit.js (if needed)");
  console.log("3. Test the contract functions");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 