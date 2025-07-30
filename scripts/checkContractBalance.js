
const { ethers } = require('hardhat');

async function main() {
  // Contract address on Base network
  const contractAddress = "0xcB4395C79C80Dc0ebd04a420AaEd705B69B73101";
  
  // Get the contract instance
  const NFTFlipGame = await ethers.getContractFactory("contracts/NFTFlipGame.sol:NFTFlipGame");
  const contract = await NFTFlipGame.attach(contractAddress);

  try {
    // Check ETH balance
    const balance = await ethers.provider.getBalance(contractAddress);
    console.log("\n=== Contract Balances ===");
    console.log("ETH Balance:", ethers.formatEther(balance), "ETH");

    // Check USDC balance if you're using USDC
    const usdcAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base USDC address
    const usdcContract = await ethers.getContractAt("IERC20", usdcAddress);
    const usdcBalance = await usdcContract.balanceOf(contractAddress);
    console.log("USDC Balance:", ethers.formatUnits(usdcBalance, 6), "USDC");

    // Get contract owner
    const owner = await contract.owner();
    console.log("\nContract Owner:", owner);

    // Get fee receiver
    const feeReceiver = await contract.feeReceiver();
    console.log("Fee Receiver:", feeReceiver);

    // Get current fees
    const listingFee = await contract.listingFeeUSD();
    const winningsFee = await contract.winningsFeePercent();
    console.log("\nCurrent Fees:");
    console.log("Listing Fee:", ethers.formatUnits(listingFee, 6), "USD");
    console.log("Winnings Fee:", winningsFee / 100, "%");

  } catch (error) {
    console.error("Error checking contract:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 