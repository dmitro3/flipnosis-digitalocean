const { ethers } = require('hardhat');

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.log('❌ No PRIVATE_KEY found in environment');
    return;
  }

  try {
    // Create wallet from private key
    const wallet = new ethers.Wallet(privateKey);
    const address = wallet.address;
    
    console.log('🔑 Private Key Analysis');
    console.log('========================');
    console.log(`Address: ${address}`);
    console.log(`Private Key (first 10 chars): ${privateKey.substring(0, 10)}...`);
    
    // Check if this matches the platform fee receiver
    const platformFeeReceiver = process.env.PLATFORM_FEE_RECEIVER;
    console.log(`Platform Fee Receiver: ${platformFeeReceiver}`);
    console.log(`Addresses match: ${address.toLowerCase() === platformFeeReceiver.toLowerCase()}`);
    
  } catch (error) {
    console.error('❌ Error analyzing private key:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
