const { ethers } = require('hardhat');

async function main() {
  // Contract address on Base network
  const contractAddress = "0xb2d09A3A6E502287D0acdAC31328B01AADe35941";
  
  // Get the contract instance
  const NFTFlipGame = await ethers.getContractFactory("NFTFlipGame");
  const contract = await NFTFlipGame.attach(contractAddress);

  // Get the signer (your wallet)
  const [signer] = await ethers.getSigners();
  console.log("Using signer address:", signer.address);

  try {
    // Check contract balance
    const balance = await ethers.provider.getBalance(contractAddress);
    console.log("\n=== Contract Balances ===");
    console.log("ETH Balance:", ethers.formatEther(balance), "ETH");

    // Withdraw ETH
    if (balance > 0) {
      console.log("\nWithdrawing ETH...");
      const tx = await contract.emergencyWithdraw(ethers.ZeroAddress, balance);
      console.log("Transaction sent:", tx.hash);
      await tx.wait();
      console.log("✅ ETH withdrawal successful!");
    } else {
      console.log("No ETH to withdraw");
    }

    // Check USDC balance
    const usdcAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base USDC
    const usdcContract = await ethers.getContractAt("IERC20", usdcAddress);
    const usdcBalance = await usdcContract.balanceOf(contractAddress);
    console.log("\nUSDC Balance:", ethers.formatUnits(usdcBalance, 6), "USDC");

    // Withdraw USDC if any
    if (usdcBalance > 0) {
      console.log("\nWithdrawing USDC...");
      const tx = await contract.emergencyWithdraw(usdcAddress, usdcBalance);
      console.log("Transaction sent:", tx.hash);
      await tx.wait();
      console.log("✅ USDC withdrawal successful!");
    } else {
      console.log("No USDC to withdraw");
    }

  } catch (error) {
    console.error("\n❌ Error during withdrawal:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 