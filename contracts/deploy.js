// Base network addresses
const BASE_ADDRESSES = {
  ETH_USD_PRICE_FEED: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70", // Chainlink ETH/USD on Base
  USDC_USD_PRICE_FEED: "0x7e860098F58bBFC8648a4311b374B1D669a2bc6B", // Chainlink USDC/USD on Base  
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
  FEE_RECIPIENT: "YOUR_FEE_WALLET_ADDRESS" // Replace with your wallet
};

// Deployment script for Remix
const deploymentScript = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./NFTFlipGame.sol";

contract DeployNFTFlipGame {
    NFTFlipGame public nftFlipGame;
    
    constructor() {
        nftFlipGame = new NFTFlipGame(
            ${BASE_ADDRESSES.ETH_USD_PRICE_FEED}, // ETH/USD Price Feed
            ${BASE_ADDRESSES.USDC_USD_PRICE_FEED}, // USDC/USD Price Feed  
            ${BASE_ADDRESSES.USDC}, // USDC Token
            ${BASE_ADDRESSES.FEE_RECIPIENT} // Fee Recipient
        );
    }
    
    function getContractAddress() public view returns (address) {
        return address(nftFlipGame);
    }
}
`;

console.log("Base Network Deployment Script:");
console.log("================================");
console.log(deploymentScript);

console.log("\nDeployment Steps for Remix:");
console.log("1. Open Remix IDE (remix.ethereum.org)");
console.log("2. Create NFTFlipGame.sol and paste the main contract code");
console.log("3. Install OpenZeppelin contracts:");
console.log("   - @openzeppelin/contracts/token/ERC721/IERC721.sol");
console.log("   - @openzeppelin/contracts/token/ERC20/IERC20.sol");
console.log("   - @openzeppelin/contracts/security/ReentrancyGuard.sol");
console.log("   - @openzeppelin/contracts/access/Ownable.sol");  
console.log("   - @openzeppelin/contracts/security/Pausable.sol");
console.log("4. Install Chainlink contracts:");
console.log("   - @chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol");
console.log("5. Create DeployNFTFlipGame.sol and paste the deployment script above");
console.log("6. Compile with Solidity 0.8.19+");
console.log("7. Deploy to Base network");
console.log("8. Update your frontend with the deployed contract address");

// Contract ABI for frontend integration
const contractABI = [
  "function createGame(address,uint256,uint256,uint8,uint8) external",
  "function joinGameWithETH(uint256) external payable", 
  "function joinGameWithUSDC(uint256) external",
  "function makeCounterOffer(uint256,uint256,uint8) external payable",
  "function acceptCounterOffer(uint256) external",
  "function rejectCounterOffer(uint256) external", 
  "function flipCoin(uint256) external",
  "function claimWinnings(uint256) external",
  "function cancelGame(uint256) external",
  "function getActiveGames() external view returns (uint256[])",
  "function getUserGames(address) external view returns (uint256[])",
  "function getGame(uint256) external view returns (tuple)",
  "function getETHAmountForUSD(uint256) external view returns (uint256)",
  "event GameCreated(uint256 indexed,address indexed,address,uint256,uint256)",
  "event GameJoined(uint256 indexed,address indexed,uint8,uint256)",
  "event FlipResult(uint256 indexed,uint8,bool,address)",
  "event GameCompleted(uint256 indexed,address,uint256)",
  "event CounterOfferMade(uint256 indexed,address indexed,uint256,uint8)"
];

module.exports = {
  BASE_ADDRESSES,
  deploymentScript,
  contractABI
}; 