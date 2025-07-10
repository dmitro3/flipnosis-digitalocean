// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

interface AggregatorV3Interface {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 price,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
}

contract NFTFlipGame is ReentrancyGuard, Ownable, Pausable {
    // Enums
    enum GameState { Created, Joined, Active, Completed, Cancelled }
    enum GameType { NFTvsCrypto, NFTvsNFT }
    enum PaymentToken { ETH, USDC }
    
    // Coin information structure
    struct CoinInfo {
        string coinType; // "default", "custom", "mario", "luigi", etc.
        string headsImage;
        string tailsImage;
        bool isCustom;
    }
    
    // Main game structure with round tracking
    struct Game {
        uint256 gameId;
        address creator;
        address joiner;
        address nftContract;
        uint256 tokenId;
        GameState state;
        GameType gameType;
        uint256 priceUSD; // in 6 decimals
        PaymentToken paymentToken;
        uint256 totalPaid; // Amount minus platform fee
        address winner;
        uint256 createdAt;
        // Round tracking
        uint256 creatorWins;
        uint256 joinerWins;
        uint256 currentRound;
        uint256 lastFlipResult; // 0 = creator won round, 1 = joiner won round
        bytes32 lastFlipHash; // For transparency
        // Coin information
        CoinInfo coinInfo;
    }
    
    // State variables
    mapping(uint256 => Game) public games;
    mapping(address => uint256[]) public userGames;
    
    // Unclaimed rewards
    mapping(address => uint256) public unclaimedETH;
    mapping(address => uint256) public unclaimedUSDC;
    mapping(address => mapping(address => uint256[])) public unclaimedNFTs;
    
    // Settings
    uint256 public nextGameId = 1;
    uint256 public listingFeeUSD = 200000; // $0.20 in 6 decimals
    uint256 public platformFeePercent = 350; // 3.5%
    uint256 public constant BASIS_POINTS = 10000;
    address public platformFeeReceiver;
    
    // Price feeds
    AggregatorV3Interface public ethUsdFeed;
    address public usdcToken;
    
    // Events
    event GameCreated(uint256 indexed gameId, address indexed creator);
    event GameJoined(uint256 indexed gameId, address indexed joiner);
    event RoundPlayed(uint256 indexed gameId, uint256 round, uint256 result, address roundWinner);
    event GameCompleted(uint256 indexed gameId, address indexed winner);
    event GameCancelled(uint256 indexed gameId);
    event RewardsWithdrawn(address indexed player, uint256 ethAmount, uint256 usdcAmount, uint256 nftCount);
    
    constructor(
        address _ethUsdFeed,
        address _usdcToken,
        address _platformFeeReceiver
    ) {
        ethUsdFeed = AggregatorV3Interface(_ethUsdFeed);
        usdcToken = _usdcToken;
        platformFeeReceiver = _platformFeeReceiver;
    }
    
    // Create game
    function createGame(
        address nftContract,
        uint256 tokenId,
        uint256 priceUSD,
        PaymentToken acceptedToken,
        GameType gameType,
        string memory coinType,
        string memory headsImage,
        string memory tailsImage,
        bool isCustom
    ) external payable nonReentrant whenNotPaused {
        require(nftContract != address(0), "Invalid NFT contract");
        
        // Calculate listing fee in ETH
        uint256 listingFeeETH = getETHAmount(listingFeeUSD);
        require(msg.value >= listingFeeETH, "Insufficient listing fee");
        
        // Transfer NFT to contract
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        
        // Create coin info
        CoinInfo memory coinInfo = CoinInfo({
            coinType: coinType,
            headsImage: headsImage,
            tailsImage: tailsImage,
            isCustom: isCustom
        });
        
        // Create game
        uint256 gameId = nextGameId++;
        games[gameId] = Game({
            gameId: gameId,
            creator: msg.sender,
            joiner: address(0),
            nftContract: nftContract,
            tokenId: tokenId,
            state: GameState.Created,
            gameType: gameType,
            priceUSD: priceUSD,
            paymentToken: acceptedToken,
            totalPaid: 0,
            winner: address(0),
            createdAt: block.timestamp,
            creatorWins: 0,
            joinerWins: 0,
            currentRound: 0,
            lastFlipResult: 0,
            lastFlipHash: 0,
            coinInfo: coinInfo
        });
        
        userGames[msg.sender].push(gameId);
        
        // Send listing fee to platform
        (bool success,) = platformFeeReceiver.call{value: listingFeeETH}("");
        require(success, "Fee transfer failed");
        
        // Refund excess
        if (msg.value > listingFeeETH) {
            (bool refundSuccess,) = msg.sender.call{value: msg.value - listingFeeETH}("");
            require(refundSuccess, "Refund failed");
        }
        
        emit GameCreated(gameId, msg.sender);
    }
    
    // Join game
    function joinGame(uint256 gameId) external payable nonReentrant whenNotPaused {
        Game storage game = games[gameId];
        require(game.state == GameState.Created, "Game not available");
        require(msg.sender != game.creator, "Cannot join own game");
        
        // Calculate required amount
            uint256 requiredAmount = getETHAmount(game.priceUSD);
        uint256 platformFee = (requiredAmount * platformFeePercent) / BASIS_POINTS;
        uint256 gameAmount = requiredAmount - platformFee;
        
        require(msg.value >= requiredAmount, "Insufficient payment");
        
        // Store amount minus platform fee
        game.totalPaid = gameAmount;
        game.joiner = msg.sender;
        game.state = GameState.Joined;
        
        userGames[msg.sender].push(gameId);
        
        // Send platform fee immediately
        (bool feeSuccess,) = platformFeeReceiver.call{value: platformFee}("");
        require(feeSuccess, "Platform fee transfer failed");
        
        // Refund excess
        if (msg.value > requiredAmount) {
            (bool refundSuccess,) = msg.sender.call{value: msg.value - requiredAmount}("");
            require(refundSuccess, "Refund failed");
        }
        
        emit GameJoined(gameId, msg.sender);
    }
    
    // Play a round
    function playRound(uint256 gameId) external nonReentrant {
        Game storage game = games[gameId];
        require(game.state == GameState.Joined || game.state == GameState.Active, "Game not ready");
        require(msg.sender == game.creator || msg.sender == game.joiner, "Not a player");
        require(game.creatorWins < 3 && game.joinerWins < 3, "Game already complete");
        
        // Update state to active
        if (game.state == GameState.Joined) {
            game.state = GameState.Active;
        }
        
        // Generate deterministic randomness
        bytes32 flipHash = keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            gameId,
            game.currentRound,
            msg.sender
        ));
        
        uint256 result = uint256(flipHash) % 2;
        
        // Update scores
        if (result == 0) {
            game.creatorWins++;
            emit RoundPlayed(gameId, game.currentRound + 1, result, game.creator);
        } else {
            game.joinerWins++;
            emit RoundPlayed(gameId, game.currentRound + 1, result, game.joiner);
        }
        
        game.currentRound++;
        game.lastFlipResult = result;
        game.lastFlipHash = flipHash;
        
        // Check if game is complete (best of 5)
        if (game.creatorWins >= 3 || game.joinerWins >= 3) {
            game.winner = game.creatorWins >= 3 ? game.creator : game.joiner;
            game.state = GameState.Completed;
            
            // Add rewards to unclaimed
            unclaimedNFTs[game.winner][game.nftContract].push(game.tokenId);
            if (game.totalPaid > 0) {
                unclaimedETH[game.winner] += game.totalPaid;
            }
            
            emit GameCompleted(gameId, game.winner);
        }
    }
    
    // Withdraw all unclaimed rewards
    function withdrawRewards() external nonReentrant {
        uint256 ethAmount = unclaimedETH[msg.sender];
        uint256 usdcAmount = unclaimedUSDC[msg.sender];
        
        // Reset balances first
        unclaimedETH[msg.sender] = 0;
        unclaimedUSDC[msg.sender] = 0;
        
        // Transfer ETH
        if (ethAmount > 0) {
            (bool success,) = msg.sender.call{value: ethAmount}("");
            require(success, "ETH transfer failed");
        }
        
        // Transfer USDC
        if (usdcAmount > 0) {
            IERC20(usdcToken).transfer(msg.sender, usdcAmount);
        }
        
        // Transfer all NFTs
        uint256 nftCount = 0;
        address[] memory nftContracts = new address[](10); // Reasonable limit
        uint256 contractCount = 0;
        
        // Collect unique NFT contracts (simplified approach)
        // In production, you'd want a more sophisticated approach
        
        emit RewardsWithdrawn(msg.sender, ethAmount, usdcAmount, nftCount);
    }
    
    // Withdraw specific NFT
    function withdrawNFT(address nftContract, uint256 tokenId) external nonReentrant {
        uint256[] storage userNFTs = unclaimedNFTs[msg.sender][nftContract];
        bool found = false;
        
        for (uint256 i = 0; i < userNFTs.length; i++) {
            if (userNFTs[i] == tokenId) {
                // Remove from array by swapping with last element
                userNFTs[i] = userNFTs[userNFTs.length - 1];
                userNFTs.pop();
                found = true;
                break;
            }
        }
        
        require(found, "NFT not found in unclaimed");
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
    }
    
    // Cancel game (only if not joined)
    function cancelGame(uint256 gameId) external nonReentrant {
        Game storage game = games[gameId];
        require(msg.sender == game.creator, "Only creator can cancel");
        require(game.state == GameState.Created, "Can only cancel unjoined games");
        
        game.state = GameState.Cancelled;
        
        // Return NFT to creator
        unclaimedNFTs[game.creator][game.nftContract].push(game.tokenId);
        
        emit GameCancelled(gameId);
    }
    
    // Get ETH amount for USD value using Chainlink
    function getETHAmount(uint256 usdAmount) public view returns (uint256) {
        (, int256 ethPrice,,,) = ethUsdFeed.latestRoundData();
        require(ethPrice > 0, "Invalid price feed");
        
        // ethPrice has 8 decimals, usdAmount has 6 decimals
        // Result needs 18 decimals (ETH)
        return (usdAmount * 1e20) / uint256(ethPrice);
    }
    
    // Admin functions
    function setListingFee(uint256 newFee) external onlyOwner {
        listingFeeUSD = newFee;
    }
    
    function setPlatformFee(uint256 newPercent) external onlyOwner {
        require(newPercent <= 1000, "Max 10%");
        platformFeePercent = newPercent;
    }
    
    function emergencyPause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function emergencyWithdrawETH() external onlyOwner {
        (bool success,) = owner().call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }
    
    // Admin function to withdraw multiple NFTs to specific addresses
    function adminBatchWithdrawNFTs(
        address[] calldata nftContracts,
        uint256[] calldata tokenIds,
        address[] calldata recipients
    ) external onlyOwner {
        require(
            nftContracts.length == tokenIds.length && 
            tokenIds.length == recipients.length,
            "Array lengths must match"
        );
        
        for (uint256 i = 0; i < nftContracts.length; i++) {
            require(nftContracts[i] != address(0), "Invalid NFT contract");
            require(recipients[i] != address(0), "Invalid recipient");
            
            // Check if the contract owns the NFT
            try IERC721(nftContracts[i]).ownerOf(tokenIds[i]) returns (address owner) {
                require(owner == address(this), "Contract does not own this NFT");
            } catch {
                revert("Failed to check NFT ownership");
            }
            
            // Transfer the NFT
            IERC721(nftContracts[i]).transferFrom(address(this), recipients[i], tokenIds[i]);
        }
    }
    
    // View functions
    function getUserGames(address user) external view returns (uint256[] memory) {
        return userGames[user];
    }
    
    function getGameRoundDetails(uint256 gameId) external view returns (
        uint256 creatorWins,
        uint256 joinerWins,
        uint256 currentRound,
        uint256 lastResult
    ) {
        Game memory game = games[gameId];
        return (game.creatorWins, game.joinerWins, game.currentRound, game.lastFlipResult);
    }

    function getGameDetails(uint256 gameId) external view returns (
        uint256 gameId_,
        address creator_,
        address joiner_,
        address nftContract_,
        uint256 tokenId_,
        GameState state_,
        GameType gameType_,
        uint256 priceUSD_,
        PaymentToken paymentToken_,
        uint256 totalPaid_,
        address winner_,
        uint256 createdAt_,
        uint256 creatorWins_,
        uint256 joinerWins_,
        uint256 currentRound_,
        uint256 lastFlipResult_,
        bytes32 lastFlipHash_,
        string memory coinType_,
        string memory headsImage_,
        string memory tailsImage_,
        bool isCustom_
    ) {
        Game memory game = games[gameId];
        return (
            game.gameId,
            game.creator,
            game.joiner,
            game.nftContract,
            game.tokenId,
            game.state,
            game.gameType,
            game.priceUSD,
            game.paymentToken,
            game.totalPaid,
            game.winner,
            game.createdAt,
            game.creatorWins,
            game.joinerWins,
            game.currentRound,
            game.lastFlipResult,
            game.lastFlipHash,
            game.coinInfo.coinType,
            game.coinInfo.headsImage,
            game.coinInfo.tailsImage,
            game.coinInfo.isCustom
        );
    }
} 