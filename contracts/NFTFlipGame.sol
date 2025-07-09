// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTFlipGame is ReentrancyGuard, Ownable {
    struct Game {
        address creator;
        address joiner;
        address nftContract;
        uint256 tokenId;
        uint256 weiAmount; // Amount in Wei that player 2 needs to pay
        bool completed;
        address winner;
    }
    
    mapping(uint256 => Game) public games;
    uint256 public nextGameId = 1;
    
    address public feeReceiver;
    uint256 public feePercent = 350; // 3.5% in basis points (350/10000)
    
    event GameCreated(uint256 indexed gameId, address indexed creator, uint256 weiAmount);
    event GameJoined(uint256 indexed gameId, address indexed joiner);
    event GameCompleted(uint256 indexed gameId, address indexed winner);
    event FeesTransferred(address indexed receiver, uint256 amount);
    
    constructor(address _feeReceiver) {
        feeReceiver = _feeReceiver;
    }
    
    // Create game - just escrow NFT and set price in Wei
    function createGame(
        address nftContract,
        uint256 tokenId,
        uint256 weiAmount
    ) external nonReentrant {
        require(weiAmount > 0, "Price must be greater than 0");
        
        // Transfer NFT to contract
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        
        uint256 gameId = nextGameId++;
        games[gameId] = Game({
            creator: msg.sender,
            joiner: address(0),
            nftContract: nftContract,
            tokenId: tokenId,
            weiAmount: weiAmount,
            completed: false,
            winner: address(0)
        });
        
        emit GameCreated(gameId, msg.sender, weiAmount);
    }
    
    // Join game - pay exact Wei amount
    function joinGame(uint256 gameId) external payable nonReentrant {
        Game storage game = games[gameId];
        require(game.creator != address(0), "Game does not exist");
        require(game.joiner == address(0), "Game already joined");
        require(!game.completed, "Game already completed");
        require(msg.value == game.weiAmount, "Incorrect payment amount");
        
        game.joiner = msg.sender;
        
        // Calculate and transfer platform fee immediately
        uint256 feeAmount = (msg.value * feePercent) / 10000;
        uint256 gameAmount = msg.value - feeAmount;
        
        // Transfer fee to platform
        payable(feeReceiver).transfer(feeAmount);
        
        emit GameJoined(gameId, msg.sender);
        emit FeesTransferred(feeReceiver, feeAmount);
    }
    
    // Complete game - transfer assets to winner
    function completeGame(uint256 gameId, address winner) external onlyOwner nonReentrant {
        Game storage game = games[gameId];
        require(game.creator != address(0), "Game does not exist");
        require(game.joiner != address(0), "Game not joined yet");
        require(!game.completed, "Game already completed");
        require(winner == game.creator || winner == game.joiner, "Invalid winner");
        
        game.completed = true;
        game.winner = winner;
        
        // Calculate amount after fees (fee already sent during join)
        uint256 feeAmount = (game.weiAmount * feePercent) / 10000;
        uint256 payoutAmount = game.weiAmount - feeAmount;
        
        // Transfer NFT to winner
        IERC721(game.nftContract).transferFrom(address(this), winner, game.tokenId);
        
        // Transfer ETH to winner (fee was already sent)
        payable(winner).transfer(payoutAmount);
        
        emit GameCompleted(gameId, winner);
    }
    
    // Emergency functions
    function emergencyWithdrawETH() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    function emergencyWithdrawNFT(address nftContract, uint256 tokenId) external onlyOwner {
        IERC721(nftContract).transferFrom(address(this), owner(), tokenId);
    }
} 