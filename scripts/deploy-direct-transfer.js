const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying updated NFTFlipGame contract with direct transfer functions...");

  // Get the contract factory
  const NFTFlipGame = await ethers.getContractFactory("NFTFlipGame");
  
  // Deploy with the same constructor parameters as the current contract
  const platformFeeReceiver = "0xDd6377919ef1Ad4baBBEAd667eFE3F6607558628"; // Admin address
  const usdcToken = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base
  
  console.log("📋 Deploying with parameters:");
  console.log("  Platform Fee Receiver:", platformFeeReceiver);
  console.log("  USDC Token:", usdcToken);
  
  const nftFlipGame = await NFTFlipGame.deploy(platformFeeReceiver, usdcToken);
  
  await nftFlipGame.waitForDeployment();
  
  const address = await nftFlipGame.getAddress();
  console.log("✅ NFTFlipGame deployed to:", address);
  
  console.log("🔧 New functions added:");
  console.log("  - directTransferNFT(address nftContract, uint256 tokenId, address recipient)");
  console.log("  - directBatchTransferNFTs(address[] nftContracts, uint256[] tokenIds, address[] recipients)");
  
  console.log("💡 These functions bypass the game system entirely and work for any NFT owned by the contract");
  console.log("💡 Gas fees should be 2-5 cents like the deposit functions");
  
  return address;
}

main()
  .then((address) => {
    console.log("🎉 Deployment successful!");
    console.log("📝 Contract address:", address);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
