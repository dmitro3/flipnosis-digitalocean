const { ethers } = require('ethers');
try {
  require('dotenv').config();
} catch (e) {
  console.warn('⚠️ dotenv not available, wallet monitor will use environment variables');
}

async function checkAdminWalletBalance() {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const adminAddress = new ethers.Wallet(process.env.CONTRACT_OWNER_KEY).address;
    
    const balance = await provider.getBalance(adminAddress);
    const balanceInEth = parseFloat(ethers.formatEther(balance));
    
    if (balanceInEth < 0.01) {
      console.error(`⚠️ URGENT: Admin wallet balance is ${balanceInEth} ETH - needs refill!`);
      // Send alert to admin (email/Discord/etc)
    } else if (balanceInEth < 0.05) {
      console.warn(`Admin wallet balance is ${balanceInEth} ETH - consider refilling soon`);
    } else {
      console.log(`Admin wallet balance OK: ${balanceInEth} ETH`);
    }
  } catch (error) {
    console.error('⚠️ Wallet monitor error:', error.message);
  }
}

// Check every hour
setInterval(checkAdminWalletBalance, 60 * 60 * 1000);
checkAdminWalletBalance(); // Initial check
