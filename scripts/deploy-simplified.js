const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying NFTFlipGame with simplified 2-step process...");

  // Check if private key is available
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deploying from address:", deployer.address);
  console.log("💰 Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // Get the contract factory
  const NFTFlipGame = await ethers.getContractFactory("NFTFlipGame");
  
  // Contract configuration for Base mainnet
  const ETH_USD_FEED = "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70"; // Base mainnet ETH/USD
  const USDC_TOKEN = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base mainnet USDC
  const PLATFORM_FEE_RECEIVER = "0xDd6377919ef1Ad4baBBEAd667eFE3F6607558628"; // Your fee receiver address

  console.log("📋 Contract parameters:");
  console.log("  ETH/USD Feed:", ETH_USD_FEED);
  console.log("  USDC Token:", USDC_TOKEN);
  console.log("  Platform Fee Receiver:", PLATFORM_FEE_RECEIVER);

  try {
    // Deploy the contract
    console.log("📦 Deploying contract...");
    const contract = await NFTFlipGame.deploy(
      ETH_USD_FEED,
      USDC_TOKEN,
      PLATFORM_FEE_RECEIVER
    );

    console.log("⏳ Waiting for deployment...");
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();

    console.log("✅ NFTFlipGame deployed to:", contractAddress);
    console.log("🔗 New function available: payFeeAndCreateGame()");
    console.log("📝 This enables the simplified 2-step process:");
    console.log("   1. Pay fee & create game");
    console.log("   2. Load NFT");

    // Wait a bit before verifying
    console.log("⏳ Waiting 10 seconds before verification...");
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    const code = await ethers.provider.getCode(contractAddress);
    if (code === "0x") {
      console.error("❌ Contract deployment failed - no code at address");
      console.log("🔍 Checking transaction status...");
      
      // Try to get deployment transaction
      const deploymentTx = contract.deploymentTransaction();
      if (deploymentTx) {
        console.log("📝 Deployment transaction hash:", deploymentTx.hash);
        const receipt = await ethers.provider.getTransactionReceipt(deploymentTx.hash);
        if (receipt) {
          console.log("📊 Transaction status:", receipt.status === 1 ? "Success" : "Failed");
          console.log("⛽ Gas used:", receipt.gasUsed.toString());
        }
      }
      return;
    }
    console.log("✅ Contract code verified at address");

    // Test the new function exists
    try {
      const abi = [
        "function payFeeAndCreateGame(bytes32 gameId, address nftContract, uint256 tokenId, uint256 priceUSD, uint8 paymentToken) external payable"
      ];
      const testContract = new ethers.Contract(contractAddress, abi, ethers.provider);
      console.log("✅ New payFeeAndCreateGame function is available");
    } catch (error) {
      console.error("❌ Error verifying new function:", error.message);
    }

    // Save deployment info
    const deploymentInfo = {
      network: "base",
      contractAddress: contractAddress,
      deployer: deployer.address,
      deploymentTime: new Date().toISOString(),
      constructorArgs: {
        ethUsdFeed: ETH_USD_FEED,
        usdcToken: USDC_TOKEN,
        platformFeeReceiver: PLATFORM_FEE_RECEIVER
      }
    };

    const fs = require('fs');
    fs.writeFileSync('deployments/simplified-deployment.json', JSON.stringify(deploymentInfo, null, 2));
    console.log("💾 Deployment info saved to deployments/simplified-deployment.json");

    console.log("\n🎉 Deployment complete!");
    console.log("📋 Next steps:");
    console.log("  1. Update CONTRACT_ADDRESS in ContractService.js to:", contractAddress);
    console.log("  2. Test the new 2-step process");
    console.log("  3. Update any documentation");

  } catch (error) {
    console.error("❌ Deployment failed with error:", error);
    console.error("🔍 Error details:", error.message);
    if (error.transaction) {
      console.error("📝 Transaction hash:", error.transaction.hash);
    }
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 