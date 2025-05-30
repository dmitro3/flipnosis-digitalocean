class SettingsService {
  constructor() {
    // Set listing fee to 30 cents
    this.listingFeeUSD = 0.30;
    this.feeRecipient = '0xE1E3dFa98C39Ba5b6C643348420420aBC3556416';
  }

  getListingFeeUSD() {
    return this.listingFeeUSD;
  }

  getFeeRecipient() {
    return this.feeRecipient;
  }

  // Convert USD to ETH amount
  calculateETHFee(usdAmount) {
    try {
      // Simple ETH price - you can update this periodically or integrate with a price API
      const ethPriceUSD = 2500; // Update this when ETH price changes significantly
      const ethAmount = usdAmount / ethPriceUSD;
      
      return {
        success: true,
        ethAmount: parseFloat(ethAmount.toFixed(6)),
        usdAmount,
        ethPriceUsed: ethPriceUSD
      };
    } catch (error) {
      console.error('Error calculating ETH fee:', error);
      return {
        success: false,
        error: error.message,
        ethAmount: 0.00012 // Fallback amount
      };
    }
  }
}

export default SettingsService; 