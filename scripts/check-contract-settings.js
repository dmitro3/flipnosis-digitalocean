const { ethers } = require("ethers");

async function main() {
  console.log("🔍 Checking contract fee settings...");
  
  const provider = new ethers.JsonRpcProvider("https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3");
  
  const contract = new ethers.Contract(
    "0xDE5B1D7Aa9913089710184da2Ba6980D661FDedb",
    [
      "function listingFeeUSD() view returns (uint256)",
      "function platformFeePercent() view returns (uint256)",
      "function getETHAmount(uint256 usdAmount) view returns (uint256)"
    ],
    provider
  );

  try {
    const listingFeeUSD = await contract.listingFeeUSD();
    const platformFeePercent = await contract.platformFeePercent();
    
    console.log(`📋 Listing Fee: $${Number(listingFeeUSD) / 1000000}`);
    console.log(`📊 Platform Fee: ${Number(platformFeePercent) / 100}%`);
    
    // Test fee calculation for a $0.13 game
    const gamePriceUSD = 130000; // $0.13 in 6 decimals
    const ethAmount = await contract.getETHAmount(gamePriceUSD);
    const platformFee = (ethAmount * BigInt(platformFeePercent)) / 10000n;
    const totalAmount = ethAmount + platformFee;
    
    console.log(`\n🎮 For a $0.13 game:`);
    console.log(`   ETH amount: ${ethers.formatEther(ethAmount)} ETH`);
    console.log(`   Platform fee: ${ethers.formatEther(platformFee)} ETH`);
    console.log(`   Total amount: ${ethers.formatEther(totalAmount)} ETH`);
    console.log(`   Total USD value: $${(Number(totalAmount) * 4646.30 / 1e18).toFixed(4)}`);
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main().catch(console.error);
