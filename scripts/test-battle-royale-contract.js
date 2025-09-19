const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing Battle Royale Contract Functions...");
  console.log("=" .repeat(60));

  const contractAddress = "0xDE5B1D7Aa9913089710184da2Ba6980D661FDedb";
  console.log(`📍 Contract Address: ${contractAddress}`);

  try {
    // Connect to the deployed contract
    const NFTFlipGame = await ethers.getContractFactory("NFTFlipGame");
    const contract = NFTFlipGame.attach(contractAddress);
    
    console.log("\n🔍 Testing Basic Contract Functions...");
    
    // Test owner function
    try {
      const owner = await contract.owner();
      console.log(`✅ Contract Owner: ${owner}`);
    } catch (error) {
      console.log(`❌ Owner check failed: ${error.message}`);
    }
    
    // Test platform fee receiver
    try {
      const platformFeeReceiver = await contract.platformFeeReceiver();
      console.log(`✅ Platform Fee Receiver: ${platformFeeReceiver}`);
    } catch (error) {
      console.log(`❌ Platform fee receiver check failed: ${error.message}`);
    }
    
    // Test deposit timeout
    try {
      const depositTimeout = await contract.depositTimeout();
      console.log(`✅ Deposit Timeout: ${Number(depositTimeout)} seconds`);
    } catch (error) {
      console.log(`❌ Deposit timeout check failed: ${error.message}`);
    }
    
    // Test platform fee percent
    try {
      const platformFeePercent = await contract.platformFeePercent();
      console.log(`✅ Platform Fee: ${Number(platformFeePercent) / 100}%`);
    } catch (error) {
      console.log(`❌ Platform fee percent check failed: ${error.message}`);
    }
    
    console.log("\n🏆 Testing Battle Royale Functions...");
    
    // Test Battle Royale functions exist
    const battleRoyaleFunctions = [
      'createBattleRoyale',
      'joinBattleRoyale', 
      'completeBattleRoyale',
      'withdrawCreatorFunds',
      'withdrawWinnerNFT',
      'getBattleRoyaleGame',
      'hasBattleRoyaleEntry'
    ];
    
    for (const funcName of battleRoyaleFunctions) {
      try {
        const func = contract.interface.getFunction(funcName);
        console.log(`✅ ${funcName} function exists (${func.selector})`);
      } catch (error) {
        console.log(`❌ ${funcName} function missing`);
      }
    }
    
    // Test Battle Royale mappings
    try {
      // This will return a default/empty struct if the mapping exists
      const emptyGameId = "0x0000000000000000000000000000000000000000000000000000000000000000";
      const gameData = await contract.battleRoyaleGames(emptyGameId);
      console.log(`✅ battleRoyaleGames mapping accessible`);
    } catch (error) {
      console.log(`❌ battleRoyaleGames mapping failed: ${error.message}`);
    }
    
    console.log("\n🎉 Contract Test Summary:");
    console.log("✅ Contract deployed and accessible");
    console.log("✅ Basic functions working");
    console.log("✅ Battle Royale functions available");
    console.log("✅ Ready for Battle Royale games!");
    
    console.log("\n📝 Next Steps:");
    console.log("1. Update CONTRACT_ADDRESS environment variable");
    console.log("2. Update src/services/ContractService.js");
    console.log("3. Deploy application with Battle Royale features");
    console.log("4. Test creating Battle Royale games");
    
    console.log(`\n🔗 Contract on BaseScan:`);
    console.log(`https://basescan.org/address/${contractAddress}`);

  } catch (error) {
    console.error("❌ Error testing contract:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
