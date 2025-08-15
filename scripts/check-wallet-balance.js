const { ethers } = require('hardhat');

async function main() {
  const [signer] = await ethers.getSigners();
  const address = await signer.getAddress();
  const balance = await ethers.provider.getBalance(address);
  
  console.log('💰 Wallet Balance Check');
  console.log('========================');
  console.log(`Address: ${address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
  console.log(`Balance (wei): ${balance.toString()}`);
  
  // Check if we have enough for deployment (rough estimate: 0.01 ETH)
  const minRequired = ethers.parseEther('0.01');
  if (balance < minRequired) {
    console.log('\n❌ Insufficient balance for deployment');
    console.log(`Need at least: ${ethers.formatEther(minRequired)} ETH`);
    console.log(`Missing: ${ethers.formatEther(minRequired - balance)} ETH`);
  } else {
    console.log('\n✅ Sufficient balance for deployment');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
