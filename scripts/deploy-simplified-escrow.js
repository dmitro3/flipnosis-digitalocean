const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying NFTFlipGame Simplified Escrow Contract...");

  // Check if private key is available
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deploying from address:", deployer.address);
  console.log("💰 Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // Get the contract factory
  const NFTFlipGame = await ethers.getContractFactory("NFTFlipGame");
  
  // Contract configuration for Base mainnet
  const USDC_TOKEN = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base mainnet USDC
  const PLATFORM_FEE_RECEIVER = "0xDd6377919ef1Ad4baBBEAd667eFE3F6607558628"; // Your fee receiver address

  console.log("📋 Contract parameters:");
  console.log("  USDC Token:", USDC_TOKEN);
  console.log("  Platform Fee Receiver:", PLATFORM_FEE_RECEIVER);
  console.log("  Platform Fee: 2.5%");
  console.log("  Deposit Timeout: 2 hours");

  try {
    // Deploy the contract
    console.log("📦 Deploying simplified escrow contract...");
    const contract = await NFTFlipGame.deploy(
      PLATFORM_FEE_RECEIVER,
      USDC_TOKEN
    );

    console.log("⏳ Waiting for deployment...");
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();

    console.log("✅ NFTFlipGame Simplified Escrow deployed to:", contractAddress);
    console.log("🔗 New simplified functions available:");
    console.log("   - depositNFT(gameId, nftContract, tokenId)");
    console.log("   - depositETH(gameId) payable");
    console.log("   - depositUSDC(gameId, amount)");
    console.log("   - isGameReady(gameId)");
    console.log("   - completeGame(gameId, winner)");
    console.log("   - reclaimNFT(gameId)");
    console.log("   - reclaimCrypto(gameId)");

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

    // Test the new functions exist
    try {
      const abi = [
        "function depositNFT(bytes32 gameId, address nftContract, uint256 tokenId)",
        "function depositETH(bytes32 gameId) payable",
        "function isGameReady(bytes32 gameId) view returns (bool)",
        "function completeGame(bytes32 gameId, address winner)"
      ];
      const testContract = new ethers.Contract(contractAddress, abi, ethers.provider);
      console.log("✅ New simplified functions are available");
    } catch (error) {
      console.error("❌ Error verifying new functions:", error.message);
    }

    // Save deployment info
    const deploymentInfo = {
      network: "base",
      contractAddress: contractAddress,
      deployer: deployer.address,
      deploymentTime: new Date().toISOString(),
      constructorArgs: {
        platformFeeReceiver: PLATFORM_FEE_RECEIVER,
        usdcToken: USDC_TOKEN
      },
      contractType: "simplified-escrow",
      features: [
        "Auto-detection of deposits",
        "No player management needed",
        "2.5% platform fee",
        "2-hour deposit timeout",
        "Reclaim functions for timeouts"
      ]
    };

    const fs = require('fs');
    fs.writeFileSync('deployments/simplified-escrow-deployment.json', JSON.stringify(deploymentInfo, null, 2));
    console.log("💾 Deployment info saved to deployments/simplified-escrow-deployment.json");

    console.log("\n🎉 Simplified Escrow Contract Deployment Complete!");
    console.log("📋 Next steps:");
    console.log("  1. Update CONTRACT_ADDRESS in ContractService.js to:", contractAddress);
    console.log("  2. Update CONTRACT_ADDRESS in server/services/blockchain.js to:", contractAddress);
    console.log("  3. Test the new simplified deposit flow");
    console.log("  4. Update environment variables with new contract address");

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
