const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying updated NFTFlipGame contract...");

  const USDC_TOKEN = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base mainnet USDC
  const PLATFORM_FEE_RECEIVER = "0xF5980979c1B0B43f78c8EeAaB697d25C611c0E0a"; // Your fee receiver address

  console.log("📋 Deployment parameters:");
  console.log("  - Platform Fee Receiver:", PLATFORM_FEE_RECEIVER);
  console.log("  - USDC Token:", USDC_TOKEN);
  console.log("  - Platform Fee: 3.5%");
  console.log("  - Deposit Timeout: 2 minutes");

  const NFTFlipGame = await hre.ethers.getContractFactory("NFTFlipGame");
  
  console.log("📦 Deploying contract...");
  const contract = await NFTFlipGame.deploy(
    PLATFORM_FEE_RECEIVER,
    USDC_TOKEN
  );

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("✅ Contract deployed successfully!");
  console.log("📝 Contract address:", contractAddress);
  console.log("🔗 BaseScan URL: https://basescan.org/address/" + contractAddress);

  // Verify the contract settings
  console.log("\n🔍 Verifying contract settings...");
  const platformFee = await contract.platformFeePercent();
  const depositTimeout = await contract.depositTimeout();
  const feeReceiver = await contract.platformFeeReceiver();
  const usdcToken = await contract.usdcToken();

  console.log("  - Platform Fee Percent:", platformFee.toString(), "basis points (", (platformFee / 100).toString(), "%)");
  console.log("  - Deposit Timeout:", depositTimeout.toString(), "seconds (", (depositTimeout / 60).toString(), "minutes)");
  console.log("  - Platform Fee Receiver:", feeReceiver);
  console.log("  - USDC Token:", usdcToken);

  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    deployer: await contract.runner.getAddress(),
    platformFeeReceiver: PLATFORM_FEE_RECEIVER,
    usdcToken: USDC_TOKEN,
    platformFeePercent: platformFee.toString(),
    depositTimeout: depositTimeout.toString(),
    deploymentTime: new Date().toISOString(),
    network: "base-mainnet"
  };

  const fs = require('fs');
  fs.writeFileSync(
    'deployments/updated-escrow-deployment.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n💾 Deployment info saved to: deployments/updated-escrow-deployment.json");
  console.log("\n🎉 Deployment complete! Update your environment variables with the new contract address.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
