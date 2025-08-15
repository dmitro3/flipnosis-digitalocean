const { ethers } = require("hardhat");

async function main() {
  console.log("🧮 Testing fee calculations...");
  
  const provider = new ethers.JsonRpcProvider("https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3");
  
  const contract = new ethers.Contract(
    "0x1e87b4067Ba26cE294D157bEEC3a638541DdA0aC",
    [
      "function getETHAmount(uint256 usdAmount) view returns (uint256)",
      "function listingFeeUSD() view returns (uint256)",
      "function platformFeePercent() view returns (uint256)"
    ],
    provider
  );

  // Test $0.50 game
  const gamePriceUSD = 500000; // $0.50 in 6 decimals
  const ethAmount = await contract.getETHAmount(gamePriceUSD);
  
  console.log(`💰 Game price: $0.50`);
  console.log(`🪙 ETH amount: ${ethers.formatEther(ethAmount)} ETH`);
  
  // Calculate what the user should pay (including platform fee)
  const platformFeePercent = await contract.platformFeePercent();
  const platformFee = (ethAmount * platformFeePercent) / 10000n; // basis points
  const totalAmount = ethAmount + platformFee;
  
  console.log(`📊 Platform fee: ${Number(platformFeePercent) / 100}%`);
  console.log(`💸 Platform fee amount: ${ethers.formatEther(platformFee)} ETH`);
  console.log(`💳 Total amount user should pay: ${ethers.formatEther(totalAmount)} ETH`);
  
  // Test listing fee
  const listingFeeUSD = await contract.listingFeeUSD();
  const listingFeeETH = await contract.getETHAmount(listingFeeUSD);
  
  console.log(`📋 Listing fee: $${Number(listingFeeUSD) / 1000000}`);
  console.log(`🪙 Listing fee in ETH: ${ethers.formatEther(listingFeeETH)} ETH`);
}

main().catch(console.error); 