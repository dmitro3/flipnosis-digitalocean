const { ethers } = require('hardhat');

async function main() {
  // Current deployed contract address
  const contractAddress = "0xa326de351a8E7118F48F08199b0EC8649Df3C1E6";
  
  console.log("🔍 Checking contract address on Base Mainnet");
  console.log("=" .repeat(60));
  
  console.log(`\n📍 Checking: ${contractAddress}`);
  
  try {
    // Check if the address has any code deployed
    const code = await ethers.provider.getCode(contractAddress);
    
    if (code === "0x") {
      console.log("❌ Contract NOT deployed - No code found at this address");
      console.log("💡 This address appears to be empty or invalid");
      console.log("\n🔍 Possible reasons:");
      console.log("   - Contract deployment failed");
      console.log("   - Wrong network");
      console.log("   - Address is incorrect");
    } else {
      console.log("✅ Contract IS deployed - Code found at this address");
      console.log("📊 Code length:", code.length, "characters");
      
      // Try to get contract info
      try {
        const contract = await ethers.getContractAt("contracts/NFTFlipGame.sol:NFTFlipGame", contractAddress);
        const owner = await contract.owner();
        console.log("👤 Contract Owner:", owner);
        
        // Check if it's the right contract by calling a function
        const listingFee = await contract.listingFeeUSD();
        console.log("💰 Listing Fee:", ethers.formatUnits(listingFee, 6), "USD");
        
      } catch (error) {
        console.log("⚠️  Could not read contract details (might be a different contract type)");
      }
      
      // Check the balance
      const balance = await ethers.provider.getBalance(contractAddress);
      console.log("💰 ETH Balance:", ethers.formatEther(balance), "ETH");
    }
    
  } catch (error) {
    console.error("❌ Error checking contract:", error.message);
  }
  
  console.log("\n📝 Summary:");
      console.log("Current deployed contract: 0xa326de351a8E7118F48F08199b0EC8649Df3C1E6");
    console.log("Contract is verified on BaseScan: https://basescan.org/address/0xa326de351a8E7118F48F08199b0EC8649Df3C1E6#code");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 