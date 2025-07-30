const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Verifying contract status...");

  // Contract address on Base
  const contractAddress = "0x9876c900B6f8B834a25c3DBB06f3cd0292e552f1";
  
  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log(`🔗 BaseScan URL: https://basescan.org/address/${contractAddress}`);

  try {
    // Get provider
    const provider = new ethers.JsonRpcProvider("https://base.blockpi.network/v1/rpc/public");
    
    // Check if contract exists
    const code = await provider.getCode(contractAddress);
    
    if (code === "0x") {
      console.log("❌ Contract NOT deployed - No bytecode found");
      console.log("💡 This means the contract was never deployed or was self-destructed");
    } else {
      console.log("✅ Contract IS deployed - Bytecode found");
      console.log(`📊 Bytecode length: ${code.length} characters`);
      
      // Check ETH balance
      const balance = await provider.getBalance(contractAddress);
      console.log(`💰 Contract ETH Balance: ${ethers.formatEther(balance)} ETH`);
      
      // Try to get transaction count
      const txCount = await provider.getTransactionCount(contractAddress);
      console.log(`📈 Transaction Count: ${txCount}`);
    }

  } catch (error) {
    console.error("❌ Error checking contract:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 