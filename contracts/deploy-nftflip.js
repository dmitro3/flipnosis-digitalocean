const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying NFTFlipGame contract...");

  // Get the contract factory
  const NFTFlipGame = await ethers.getContractFactory("contracts/NFTFlipGame.sol:NFTFlipGame");

  // Chain-specific configuration
  const chainConfigs = {
    base: {
      ethUsdFeed: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70", // Base ETH/USD
      usdcUsdFeed: "0x7e860098F58bBFC8648a4311b374B1D669a2bc6B", // Base USDC/USD
      usdcToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base USDC
      platformFeeReceiver: process.env.PLATFORM_FEE_RECEIVER || "0x0000000000000000000000000000000000000000", // Add your admin wallet address
      rpc: "https://base.blockpi.network/v1/rpc/public"
    },
    ethereum: {
      ethUsdFeed: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", // Ethereum ETH/USD
      usdcUsdFeed: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6", // Ethereum USDC/USD
      usdcToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Ethereum USDC
      platformFeeReceiver: process.env.PLATFORM_FEE_RECEIVER || "0x0000000000000000000000000000000000000000", // Add your admin wallet address
      rpc: "https://eth.llamarpc.com"
    },
    bnb: {
      ethUsdFeed: "0x9ef1B8c0E4F7dc8bF5719Ea496883DC6401d5b2e", // BNB ETH/USD
      usdcUsdFeed: "0x51597f405303C4377E36123cBc172b13269EA163", // BNB USDC/USD
      usdcToken: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // BNB USDC
      platformFeeReceiver: process.env.PLATFORM_FEE_RECEIVER || "0x0000000000000000000000000000000000000000", // Add your admin wallet address
      rpc: "https://bsc-dataseed.binance.org/"
    },
    avalanche: {
      ethUsdFeed: "0x976B3D034E162d8bD72D6b9C989d545b839003b0", // Avalanche ETH/USD
      usdcUsdFeed: "0xF096872672F44d6EBA71458D74fe67F9a77a23B9", // Avalanche USDC/USD
      usdcToken: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // Avalanche USDC
      platformFeeReceiver: process.env.PLATFORM_FEE_RECEIVER || "0x0000000000000000000000000000000000000000", // Add your admin wallet address
      rpc: "https://api.avax.network/ext/bc/C/rpc"
    },
    polygon: {
      ethUsdFeed: "0xF9680D99D6C9589e2a93a78A04A279e509205945", // Polygon ETH/USD
      usdcUsdFeed: "0xfE4A8cc5b5B2366C1B58Bea3858e81843581b2F7", // Polygon USDC/USD
      usdcToken: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // Polygon USDC
      platformFeeReceiver: process.env.PLATFORM_FEE_RECEIVER || "0x0000000000000000000000000000000000000000", // Add your admin wallet address
      rpc: "https://polygon-rpc.com/"
    }
  };

  // Get the target chain from command line arguments
  const targetChain = process.argv[2] || "base";
  
  if (!chainConfigs[targetChain]) {
    console.error(`❌ Unsupported chain: ${targetChain}`);
    console.log("Supported chains: base, ethereum, bnb, avalanche, polygon");
    process.exit(1);
  }

  const config = chainConfigs[targetChain];
  
  console.log(`📡 Deploying to ${targetChain.toUpperCase()}...`);
  console.log(`🔗 RPC: ${config.rpc}`);
  console.log(`💰 Platform Fee Receiver: ${config.platformFeeReceiver}`);

  // Deploy the contract
  const nftFlipGame = await NFTFlipGame.deploy(
    config.ethUsdFeed,
    config.usdcUsdFeed,
    config.usdcToken,
    config.platformFeeReceiver
  );

  console.log("⏳ Waiting for deployment...");
  await nftFlipGame.waitForDeployment();

  const deployedAddress = await nftFlipGame.getAddress();
  console.log("✅ NFTFlipGame deployed successfully!");
  console.log(`📍 Contract Address: ${deployedAddress}`);
  console.log(`🌐 Chain: ${targetChain.toUpperCase()}`);
  
  // Verify deployment
  console.log("🔍 Verifying deployment...");
  
  try {
    // Check if contract is deployed
    const code = await ethers.provider.getCode(deployedAddress);
    if (code === "0x") {
      throw new Error("Contract not deployed");
    }
    
    // Verify initial settings
    const listingFee = await nftFlipGame.listingFeeUSD();
    const platformFee = await nftFlipGame.platformFeePercent();
    const owner = await nftFlipGame.owner();
    
    console.log("✅ Contract verification successful!");
    console.log(`📋 Initial Settings:`);
    console.log(`   - Listing Fee: $${Number(listingFee) / 1000000}`);
    console.log(`   - Platform Fee: ${Number(platformFee) / 100}%`);
    console.log(`   - Owner: ${owner}`);
    
  } catch (error) {
    console.error("❌ Contract verification failed:", error.message);
  }

  // Save deployment info
  const deploymentInfo = {
    chain: targetChain,
    contractAddress: deployedAddress,
    deployer: await nftFlipGame.runner.getAddress(),
    deploymentTime: new Date().toISOString(),
    constructorArgs: {
      ethUsdFeed: config.ethUsdFeed,
      usdcUsdFeed: config.usdcUsdFeed,
      usdcToken: config.usdcToken,
      platformFeeReceiver: config.platformFeeReceiver
    },
    initialSettings: {
      listingFeeUSD: "200000", // $0.20
      platformFeePercent: "350", // 3.5%
      maxFeePercent: "1000" // 10%
    }
  };

  // Write deployment info to file
  const fs = require('fs');
  const deploymentPath = `./deployments/${targetChain}-deployment.json`;
  
  // Create deployments directory if it doesn't exist
  if (!fs.existsSync('./deployments')) {
    fs.mkdirSync('./deployments');
  }
  
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📄 Deployment info saved to: ${deploymentPath}`);

  // Update contract addresses in frontend
  console.log("🔄 Updating frontend contract addresses...");
  updateFrontendAddresses(targetChain, deployedAddress);

  console.log("🎉 Deployment complete!");
  console.log("\n📝 Next steps:");
  console.log("1. Update the ADMIN_WALLET address in AdminPanel.jsx");
  console.log("2. Update contract addresses in ContractService.js");
  console.log("3. Test the contract functions");
  console.log("4. Verify the contract on block explorer");
}

function updateFrontendAddresses(chain, address) {
  const fs = require('fs');
  const path = require('path');
  
  // Update ContractService.js
  const contractServicePath = path.join(__dirname, '../src/services/ContractService.js');
  
  if (fs.existsSync(contractServicePath)) {
    let content = fs.readFileSync(contractServicePath, 'utf8');
    
    // Update the contract address for the specific chain
    const regex = new RegExp(`(contractAddress: ')([^']*)('.*?// ${chain} contract address)`, 'g');
    content = content.replace(regex, `$1${address}$3`);
    
    fs.writeFileSync(contractServicePath, content);
    console.log(`✅ Updated ${chain} contract address in ContractService.js`);
  }
  
  // Update AdminPanel.jsx
  const adminPanelPath = path.join(__dirname, '../src/components/AdminPanel.jsx');
  
  if (fs.existsSync(adminPanelPath)) {
    let content = fs.readFileSync(adminPanelPath, 'utf8');
    
    // Update the contract address for the specific chain
    const regex = new RegExp(`('${chain}': ')([^']*)('.*?// Add your deployed contract address)`, 'g');
    content = content.replace(regex, `$1${address}$3`);
    
    fs.writeFileSync(adminPanelPath, content);
    console.log(`✅ Updated ${chain} contract address in AdminPanel.jsx`);
  }
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 