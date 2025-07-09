// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

interface AggregatorV3Interface {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 price,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
    function decimals() external view returns (uint8);
}

contract NFTFlipGame is ReentrancyGuard, Ownable, Pausable {
    using SafeMath for uint256;

    // Simplified enums
    enum GameState { Created, Joined, Completed, Cancelled, Expired }
    enum GameType { NFTvsCrypto, NFTvsNFT }
    enum PaymentToken { ETH, USDC }
    
    // Simplified game structure - only essential data
    struct Game {
        uint256 gameId;
        address creator;
        address joiner;
        address nftContract;
        uint256 tokenId;
        GameState state;
        GameType gameType;
        uint256 priceUSD;
        PaymentToken paymentToken;
        uint256 totalPaid;
        address winner;
        uint256 createdAt;
        uint256 expiresAt;
    }
    
    // NFT vs NFT specific data
    struct NFTChallenge {
        address challengerNFTContract;
        uint256 challengerTokenId;
    }
    
    // State Variables
    mapping(uint256 => Game) public games;
    mapping(uint256 => NFTChallenge) public nftChallenges;
    
    // Player mappings
    mapping(address => uint256[]) public userGames;
    mapping(address => mapping(address => mapping(uint256 => bool))) public userNFTsInContract;
    
    // Unclaimed rewards tracking
    mapping(address => uint256) public unclaimedETH;
    mapping(address => uint256) public unclaimedUSDC;
    mapping(address => mapping(address => uint256[])) public unclaimedNFTs;
    
    // Settings
    uint256 public nextGameId = 1;
    uint256 public listingFeeUSD = 200000; // $0.20 in 6 decimals
    uint256 public platformFeePercent = 350; // 3.5% in basis points
    uint256 public constant MAX_FEE_PERCENT = 1000; // 10% max
    uint256 public constant BASIS_POINTS = 10000;
    
    // Game statistics
    uint256 public totalGamesCreated = 0;
    uint256 public totalGamesCompleted = 0;
    uint256 public totalVolumeUSD = 0;
    uint256 public totalPlatformFees = 0;
    
    // Price feeds
    AggregatorV3Interface public ethUsdFeed;
    AggregatorV3Interface public usdcUsdFeed;
    address public usdcToken;
    address public platformFeeReceiver;
    
    // Events
    event GameCreated(uint256 indexed gameId, address indexed creator, GameType gameType);
    event GameJoined(uint256 indexed gameId, address indexed joiner);
    event GameCompleted(uint256 indexed gameId, address indexed winner);
    event GameCancelled(uint256 indexed gameId);
    event RewardsWithdrawn(address indexed player, uint256 ethAmount, uint256 usdcAmount);
    event NFTWithdrawn(address indexed player, address indexed nftContract, uint256 tokenId);
    event ListingFeeUpdated(uint256 newFee);
    event PlatformFeeUpdated(uint256 newPercent);
    
    // Constructor
    constructor(
        address _ethUsdFeed,
        address _usdcUsdFeed, 
        address _usdcToken,
        address _platformFeeReceiver
    ) {
        ethUsdFeed = AggregatorV3Interface(_ethUsdFeed);
        usdcUsdFeed = AggregatorV3Interface(_usdcUsdFeed);
        usdcToken = _usdcToken;
        platformFeeReceiver = _platformFeeReceiver;
    }
    
    // Modifiers
    modifier gameExists(uint256 _gameId) {
        require(games[_gameId].gameId != 0, "Game does not exist");
        _;
    }
    
    modifier onlyGameParticipant(uint256 _gameId) {
        Game memory game = games[_gameId];
        require(msg.sender == game.creator || msg.sender == game.joiner, "Not a participant");
        _;
    }
    
    // Create Game Function
    function createGame(
        address nftContract,
        uint256 tokenId,
        uint256 priceUSD,
        PaymentToken acceptedToken,
        GameType gameType,
        string calldata authInfo
    ) external payable nonReentrant whenNotPaused {
        require(nftContract != address(0), "Invalid NFT contract");
        
        // Calculate and collect listing fee
        uint256 listingFeeETH = getETHAmount(listingFeeUSD);
        require(msg.value >= listingFeeETH, "Insufficient listing fee");
        
        // Transfer NFT to contract
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        
        // Initialize game
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
            expiresAt: block.timestamp + 7 days
        });
        
        // Track user game
        userGames[msg.sender].push(gameId);
        userNFTsInContract[msg.sender][nftContract][tokenId] = true;
        
        // Update statistics
        totalGamesCreated++;
        
        // Transfer listing fee to platform
        if (msg.value > listingFeeETH) {
            payable(msg.sender).transfer(msg.value - listingFeeETH);
        }
        payable(platformFeeReceiver).transfer(listingFeeETH);
        
        emit GameCreated(gameId, msg.sender, gameType);
    }
    
    // Join Game Function
    function joinGame(
        uint256 gameId,
        PaymentToken paymentToken,
        address challengerNFTContract,
        uint256 challengerTokenId
    ) external payable nonReentrant whenNotPaused gameExists(gameId) {
        Game storage game = games[gameId];
        
        require(game.state == GameState.Created, "Game not available");
        require(msg.sender != game.creator, "Cannot join own game");
        require(game.joiner == address(0), "Game already joined");
        
        if (game.gameType == GameType.NFTvsCrypto) {
            // Handle crypto payment with immediate platform fee collection
            uint256 requiredAmount = getETHAmount(game.priceUSD);
            uint256 platformFee = requiredAmount.mul(platformFeePercent).div(BASIS_POINTS);
            uint256 gameAmount = requiredAmount.sub(platformFee);
            
            if (paymentToken == PaymentToken.ETH) {
                require(msg.value >= requiredAmount, "Insufficient ETH");
                game.totalPaid = gameAmount; // Store amount minus platform fee
                
                // Send platform fee immediately to platform fee receiver
                payable(platformFeeReceiver).transfer(platformFee);
                
                if (msg.value > requiredAmount) {
                    payable(msg.sender).transfer(msg.value - requiredAmount);
                }
            } else if (paymentToken == PaymentToken.USDC) {
                require(msg.value == 0, "ETH not needed for USDC payment");
                IERC20(usdcToken).transferFrom(msg.sender, address(this), requiredAmount);
                game.totalPaid = gameAmount; // Store amount minus platform fee
                
                // Send platform fee immediately to platform fee receiver
                IERC20(usdcToken).transfer(platformFeeReceiver, platformFee);
            }
            
            game.paymentToken = paymentToken;
        } else {
            // NFT vs NFT - transfer challenger NFT
            require(challengerNFTContract != address(0), "Invalid challenger NFT");
            IERC721(challengerNFTContract).transferFrom(
                msg.sender, 
                address(this), 
                challengerTokenId
            );
            
            nftChallenges[gameId] = NFTChallenge({
                challengerNFTContract: challengerNFTContract,
                challengerTokenId: challengerTokenId
            });
            
            userNFTsInContract[msg.sender][challengerNFTContract][challengerTokenId] = true;
        }
        
        // Update game state
        game.joiner = msg.sender;
        game.state = GameState.Joined;
        
        // Track user game
        userGames[msg.sender].push(gameId);
        
        emit GameJoined(gameId, msg.sender);
    }
    
    // Complete Game Function (called by frontend after determining winner)
    function completeGame(uint256 gameId, address winner) 
        external 
        nonReentrant 
        gameExists(gameId)
        onlyGameParticipant(gameId)
    {
        Game storage game = games[gameId];
        require(game.state == GameState.Joined, "Game not ready to complete");
        
        game.state = GameState.Completed;
        game.winner = winner;
        
        // Distribute rewards (platform fee already collected when joining)
        if (game.gameType == GameType.NFTvsCrypto && game.totalPaid > 0) {
            // Winner gets the full amount (platform fee already deducted)
            uint256 winnerPayout = game.totalPaid;
            
            // Update statistics
            totalGamesCompleted++;
            totalVolumeUSD = totalVolumeUSD.add(game.priceUSD);
            
            // Add to unclaimed rewards
            if (game.paymentToken == PaymentToken.ETH) {
                unclaimedETH[winner] = unclaimedETH[winner].add(winnerPayout);
            } else if (game.paymentToken == PaymentToken.USDC) {
                unclaimedUSDC[winner] = unclaimedUSDC[winner].add(winnerPayout);
            }
        } else {
            // NFT vs NFT game completion
            totalGamesCompleted++;
        }
        
        // Handle NFTs
        if (winner == game.creator) {
            // Creator wins - gets their NFT back
            unclaimedNFTs[game.creator][game.nftContract].push(game.tokenId);
            
            // If NFT vs NFT, creator also gets challenger NFT
            if (game.gameType == GameType.NFTvsNFT) {
                NFTChallenge memory challenge = nftChallenges[gameId];
                unclaimedNFTs[game.creator][challenge.challengerNFTContract].push(challenge.challengerTokenId);
            }
        } else {
            // Joiner wins - gets creator's NFT
            unclaimedNFTs[game.joiner][game.nftContract].push(game.tokenId);
            
            // If NFT vs NFT, joiner also gets challenger NFT
            if (game.gameType == GameType.NFTvsNFT) {
                NFTChallenge memory challenge = nftChallenges[gameId];
                unclaimedNFTs[game.joiner][challenge.challengerNFTContract].push(challenge.challengerTokenId);
            }
        }
        
        emit GameCompleted(gameId, winner);
    }
    
    // Cancel Game Function
    function cancelGame(uint256 gameId) 
        external 
        nonReentrant 
        gameExists(gameId)
    {
        Game storage game = games[gameId];
        require(msg.sender == game.creator, "Only creator can cancel");
        require(game.state == GameState.Created, "Game cannot be cancelled");
        
        game.state = GameState.Cancelled;
        
        // Return NFT to creator
        unclaimedNFTs[game.creator][game.nftContract].push(game.tokenId);
        
        emit GameCancelled(gameId);
    }
    
    // Withdraw Rewards
    function withdrawRewards() external nonReentrant {
        uint256 ethAmount = unclaimedETH[msg.sender];
        uint256 usdcAmount = unclaimedUSDC[msg.sender];
        
        require(ethAmount > 0 || usdcAmount > 0, "No rewards to claim");
        
        if (ethAmount > 0) {
            unclaimedETH[msg.sender] = 0;
            payable(msg.sender).transfer(ethAmount);
        }
        
        if (usdcAmount > 0) {
            unclaimedUSDC[msg.sender] = 0;
            IERC20(usdcToken).transfer(msg.sender, usdcAmount);
        }
        
        emit RewardsWithdrawn(msg.sender, ethAmount, usdcAmount);
    }
    
    // Withdraw NFT
    function withdrawNFT(address nftContract, uint256 tokenId) external nonReentrant {
        uint256[] storage userNFTs = unclaimedNFTs[msg.sender][nftContract];
        
        for (uint256 i = 0; i < userNFTs.length; i++) {
            if (userNFTs[i] == tokenId) {
                // Remove from array
                userNFTs[i] = userNFTs[userNFTs.length - 1];
                userNFTs.pop();
                
                // Transfer NFT
                IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
                userNFTsInContract[msg.sender][nftContract][tokenId] = false;
                
                emit NFTWithdrawn(msg.sender, nftContract, tokenId);
                return;
            }
        }
        
        revert("NFT not found in unclaimed list");
    }
    
    // Withdraw expired game NFT (free for creator)
    function withdrawExpiredGame(uint256 gameId) external nonReentrant {
        Game storage game = games[gameId];
        require(game.gameId != 0, "Game does not exist");
        require(game.state == GameState.Created, "Game not in created state");
        require(block.timestamp > game.expiresAt, "Game not expired yet");
        require(msg.sender == game.creator, "Only creator can withdraw expired game");
        
        // Mark as expired
        game.state = GameState.Expired;
        
        // Return NFT to creator
        unclaimedNFTs[game.creator][game.nftContract].push(game.tokenId);
        
        emit GameCancelled(gameId);
    }
    
    // Admin batch withdraw expired games
    function adminBatchWithdrawExpired(uint256[] calldata gameIds) external onlyOwner {
        for (uint256 i = 0; i < gameIds.length; i++) {
            uint256 gameId = gameIds[i];
            Game storage game = games[gameId];
            
            if (game.gameId != 0 && game.state == GameState.Created && block.timestamp > game.expiresAt) {
                // Mark as expired
                game.state = GameState.Expired;
                
                // Add to unclaimed for creator
                unclaimedNFTs[game.creator][game.nftContract].push(game.tokenId);
            }
        }
    }
    
    // Admin batch withdraw NFTs to specific addresses
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
            IERC721(nftContracts[i]).transferFrom(address(this), recipients[i], tokenIds[i]);
            emit NFTWithdrawn(recipients[i], nftContracts[i], tokenIds[i]);
        }
    }
    
    // View Functions
    function getGameDetails(uint256 gameId) external view returns (Game memory, NFTChallenge memory) {
        return (games[gameId], nftChallenges[gameId]);
    }
    
    // Check if game is expired
    function isGameExpired(uint256 gameId) external view returns (bool) {
        Game memory game = games[gameId];
        return game.gameId != 0 && game.state == GameState.Created && block.timestamp > game.expiresAt;
    }
    
    // Get expired games for admin
    function getExpiredGames(uint256 startIndex, uint256 count) external view returns (uint256[] memory) {
        uint256[] memory expiredGames = new uint256[](count);
        uint256 found = 0;
        
        for (uint256 i = startIndex; i < nextGameId && found < count; i++) {
            Game memory game = games[i];
            if (game.gameId != 0 && game.state == GameState.Created && block.timestamp > game.expiresAt) {
                expiredGames[found] = i;
                found++;
            }
        }
        
        // Resize array to actual count
        assembly {
            mstore(expiredGames, found)
        }
        
        return expiredGames;
    }
    
    function getETHAmount(uint256 usdAmount) public view returns (uint256) {
        (, int256 price,,,) = ethUsdFeed.latestRoundData();
        require(price > 0, "Invalid price feed");
        
        // Convert USD amount to ETH (with 18 decimals)
        return usdAmount.mul(10**18).div(uint256(price));
    }
    
    function getUSDCAmount(uint256 usdAmount) public view returns (uint256) {
        (, int256 price,,,) = usdcUsdFeed.latestRoundData();
        require(price > 0, "Invalid price feed");
        
        // Convert USD amount to USDC (with 6 decimals)
        return usdAmount.mul(10**6).div(uint256(price));
    }
    
    // Get platform fee receiver address
    function getPlatformFeeReceiver() external view returns (address) {
        return platformFeeReceiver;
    }
    
    // Admin Functions
    function setListingFee(uint256 newFee) external onlyOwner {
        listingFeeUSD = newFee;
        emit ListingFeeUpdated(newFee);
    }
    
    function setPlatformFee(uint256 newPercent) external onlyOwner {
        require(newPercent <= MAX_FEE_PERCENT, "Fee too high");
        platformFeePercent = newPercent;
        emit PlatformFeeUpdated(newPercent);
    }
    
    function emergencyWithdrawNFT(address nftContract, uint256 tokenId, address to) external onlyOwner {
        IERC721(nftContract).transferFrom(address(this), to, tokenId);
    }
    
    function emergencyWithdrawETH(address to, uint256 amount) external onlyOwner {
        payable(to).transfer(amount);
    }
    
    function emergencyWithdrawToken(address token, address to, uint256 amount) external onlyOwner {
        IERC20(token).transfer(to, amount);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
} 