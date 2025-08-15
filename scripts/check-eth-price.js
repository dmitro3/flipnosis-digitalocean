const { ethers } = require("ethers");

async function main() {
  console.log("🔍 Checking ETH price on Base network...");
  
  const provider = new ethers.JsonRpcProvider("https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3");
  
  const contract = new ethers.Contract(
    "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70",
    [
      "function latestRoundData() external view returns (uint80 roundId, int256 price, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)"
    ],
    provider
  );

  try {
    const data = await contract.latestRoundData();
    const ethPriceUSD = Number(data[1]) / 1e8;
    
    console.log(`💰 Current ETH price on Base: $${ethPriceUSD}`);
    
    // Test the getETHAmount calculation
    const testUSD = 1000000; // $1.00 in 6 decimals
    const ethAmount = (BigInt(testUSD) * BigInt(1e20)) / BigInt(Math.floor(ethPriceUSD * 1e8));
    
    console.log(`🧮 For $1.00 USD:`);
    console.log(`   ETH amount: ${ethers.formatEther(ethAmount)} ETH`);
    console.log(`   This should be approximately: ${(1 / ethPriceUSD).toFixed(6)} ETH`);
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main().catch(console.error);
