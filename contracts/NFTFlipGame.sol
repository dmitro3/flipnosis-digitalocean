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

    // Enums
    enum GameState { Created, Joined, InProgress, Completed, Expired, Cancelled }
    enum GameType { NFTvsCrypto, NFTvsNFT }
    enum PaymentToken { ETH, USDC, NATIVE }
    enum CoinSide { HEADS, TAILS }
    enum PlayerRole { FLIPPER, CHOOSER }
    
    // Game Core Structure
    struct GameCore {
        uint256 gameId;
        address creator;
        address joiner;
        address nftContract;
        uint256 tokenId;
        GameState state;
        GameType gameType;
        PlayerRole creatorRole;
        PlayerRole joinerRole;
        CoinSide joinerChoice;
    }
    
    // Financial Details
    struct GameFinancials {
        uint256 priceUSD; // Price in USD with 6 decimals
        PaymentToken acceptedToken;
        uint256 totalPaid;
        PaymentToken paymentTokenUsed;
        uint256 listingFeePaid;
        uint256 platformFeeCollected;
    }
    
    // Game Progress
    struct GameProgress {
        uint256 createdAt;
        uint256 expiresAt;
        uint8 maxRounds;
        uint8 currentRound;
        uint8 creatorWins;
        uint8 joinerWins;
        address winner;
        uint256 lastActionTime;
        uint256 countdownEndTime;
    }
    
    // Round Details
    struct GameRound {
        CoinSide result;
        uint8 power;
        bool completed;
        address flipper;
    }
    
    // NFT vs NFT specific
    struct NFTChallenge {
        address challengerNFTContract;
        uint256 challengerTokenId;
        bool isNFTvsNFT;
    }
    
    // Create Game Parameters
    struct CreateGameParams {
        address nftContract;
        uint256 tokenId;
        uint256 priceUSD;
        PaymentToken acceptedToken;
        uint8 maxRounds;
        GameType gameType;
        string authInfo;
    }
    
    // Join Game Parameters  
    struct JoinGameParams {
        uint256 gameId;
        CoinSide coinChoice;
        PlayerRole roleChoice;
        PaymentToken paymentToken;
        address challengerNFTContract; // For NFT vs NFT
        uint256 challengerTokenId; // For NFT vs NFT
    }
    
    // State Variables
    mapping(uint256 => GameCore) public gameCores;
    mapping(uint256 => GameFinancials) public gameFinancials;
    mapping(uint256 => GameProgress) public gameProgress;
    mapping(uint256 => NFTChallenge) public nftChallenges;
    mapping(uint256 => mapping(uint8 => GameRound)) public gameRounds;
    
    // Player mappings
    mapping(address => uint256[]) public userGames;
    mapping(address => uint256[]) public userActiveGames;
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
    
    // Price feeds
    AggregatorV3Interface public ethUsdFeed;
    AggregatorV3Interface public usdcUsdFeed;
    address public usdcToken;
    address public platformFeeReceiver;
    
    // Events
    event GameCreated(uint256 indexed gameId, address indexed creator, GameType gameType);
    event GameJoined(uint256 indexed gameId, address indexed joiner);
    event GameStarted(uint256 indexed gameId);
    event FlipResult(uint256 indexed gameId, uint8 round, CoinSide result, uint8 power);
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
        require(gameCores[_gameId].gameId != 0, "Game does not exist");
        _;
    }
    
    modifier onlyGameParticipant(uint256 _gameId) {
        GameCore memory game = gameCores[_gameId];
        require(msg.sender == game.creator || msg.sender == game.joiner, "Not a participant");
        _;
    }
    
    // Create Game Functions
    function createGame(CreateGameParams calldata params) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        require(params.maxRounds == 5 || params.maxRounds == 7, "Invalid rounds");
        require(params.nftContract != address(0), "Invalid NFT contract");
        
        // Calculate and collect listing fee
        uint256 listingFeeETH = getETHAmount(listingFeeUSD);
        require(msg.value >= listingFeeETH, "Insufficient listing fee");
        
        // Transfer NFT to contract
        IERC721(params.nftContract).transferFrom(msg.sender, address(this), params.tokenId);
        
        // Initialize game
        uint256 gameId = nextGameId++;
        
        gameCores[gameId] = GameCore({
            gameId: gameId,
            creator: msg.sender,
            joiner: address(0),
            nftContract: params.nftContract,
            tokenId: params.tokenId,
            state: GameState.Created,
            gameType: params.gameType,
            creatorRole: PlayerRole.FLIPPER,
            joinerRole: PlayerRole.CHOOSER,
            joinerChoice: CoinSide.HEADS
        });
        
        gameFinancials[gameId] = GameFinancials({
            priceUSD: params.priceUSD,
            acceptedToken: params.acceptedToken,
            totalPaid: 0,
            paymentTokenUsed: PaymentToken.ETH,
            listingFeePaid: listingFeeETH,
            platformFeeCollected: 0
        });
        
        gameProgress[gameId] = GameProgress({
            createdAt: block.timestamp,
            expiresAt: block.timestamp + 7 days,
            maxRounds: params.maxRounds,
            currentRound: 1,
            creatorWins: 0,
            joinerWins: 0,
            winner: address(0),
            lastActionTime: block.timestamp,
            countdownEndTime: 0
        });
        
        if (params.gameType == GameType.NFTvsNFT) {
            nftChallenges[gameId] = NFTChallenge({
                challengerNFTContract: address(0),
                challengerTokenId: 0,
                isNFTvsNFT: true
            });
        }
        
        // Track user game
        userGames[msg.sender].push(gameId);
        userActiveGames[msg.sender].push(gameId);
        userNFTsInContract[msg.sender][params.nftContract][params.tokenId] = true;
        
        // Transfer listing fee to platform
        if (msg.value > listingFeeETH) {
            payable(msg.sender).transfer(msg.value - listingFeeETH);
        }
        payable(platformFeeReceiver).transfer(listingFeeETH);
        
        emit GameCreated(gameId, msg.sender, params.gameType);
    }
    
    // Join Game Functions
    function joinGame(JoinGameParams calldata params) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        gameExists(params.gameId)
    {
        GameCore storage game = gameCores[params.gameId];
        GameFinancials storage financials = gameFinancials[params.gameId];
        
        require(game.state == GameState.Created, "Game not available");
        require(msg.sender != game.creator, "Cannot join own game");
        require(game.joiner == address(0), "Game already joined");
        
        // Set player choices
        game.joinerChoice = params.coinChoice;
        game.creatorRole = params.roleChoice == PlayerRole.FLIPPER ? PlayerRole.CHOOSER : PlayerRole.FLIPPER;
        game.joinerRole = params.roleChoice;
        
        if (game.gameType == GameType.NFTvsCrypto) {
            // Handle crypto payment
            uint256 requiredAmount = getRequiredPaymentAmount(params.gameId, params.paymentToken);
            
            if (params.paymentToken == PaymentToken.ETH) {
                require(msg.value >= requiredAmount, "Insufficient ETH");
                financials.totalPaid = requiredAmount;
                if (msg.value > requiredAmount) {
                    payable(msg.sender).transfer(msg.value - requiredAmount);
                }
            } else if (params.paymentToken == PaymentToken.USDC) {
                require(msg.value == 0, "ETH not needed for USDC payment");
                IERC20(usdcToken).transferFrom(msg.sender, address(this), requiredAmount);
                financials.totalPaid = requiredAmount;
            }
            
            financials.paymentTokenUsed = params.paymentToken;
        } else {
            // NFT vs NFT - transfer challenger NFT
            require(params.challengerNFTContract != address(0), "Invalid challenger NFT");
            IERC721(params.challengerNFTContract).transferFrom(
                msg.sender, 
                address(this), 
                params.challengerTokenId
            );
            
            nftChallenges[params.gameId] = NFTChallenge({
                challengerNFTContract: params.challengerNFTContract,
                challengerTokenId: params.challengerTokenId,
                isNFTvsNFT: true
            });
            
            userNFTsInContract[msg.sender][params.challengerNFTContract][params.challengerTokenId] = true;
        }
        
        // Update game state
        game.joiner = msg.sender;
        game.state = GameState.InProgress;
        gameProgress[params.gameId].lastActionTime = block.timestamp;
        
        // Track user game
        userGames[msg.sender].push(params.gameId);
        userActiveGames[msg.sender].push(params.gameId);
        
        emit GameJoined(params.gameId, msg.sender);
        emit GameStarted(params.gameId);
    }
    
    // Flip Coin Function
    function flipCoin(uint256 _gameId, uint8 _power) 
        external 
        nonReentrant 
        gameExists(_gameId)
        onlyGameParticipant(_gameId)
    {
        GameCore storage game = gameCores[_gameId];
        GameProgress storage progress = gameProgress[_gameId];
        
        require(game.state == GameState.InProgress, "Game not in progress");
        require(progress.currentRound <= progress.maxRounds, "Game over");
        
        // Verify it's the flipper's turn
        address currentFlipper = (progress.currentRound % 2 == 1) 
            ? (game.creatorRole == PlayerRole.FLIPPER ? game.creator : game.joiner)
            : (game.creatorRole == PlayerRole.FLIPPER ? game.joiner : game.creator);
            
        require(msg.sender == currentFlipper, "Not your turn to flip");
        
        // Simulate coin flip (simplified - use Chainlink VRF in production)
        CoinSide result = (block.timestamp + block.difficulty + _power) % 2 == 0 
            ? CoinSide.HEADS 
            : CoinSide.TAILS;
        
        // Record round
        gameRounds[_gameId][progress.currentRound] = GameRound({
            result: result,
            power: _power,
            completed: true,
            flipper: msg.sender
        });
        
        // Update scores
        if (result == game.joinerChoice) {
            progress.joinerWins++;
        } else {
            progress.creatorWins++;
        }
        
        emit FlipResult(_gameId, progress.currentRound, result, _power);
        
        // Check for winner
        uint8 winsNeeded = (progress.maxRounds / 2) + 1;
        if (progress.creatorWins >= winsNeeded || progress.joinerWins >= winsNeeded) {
            _completeGame(_gameId);
        } else {
            progress.currentRound++;
            progress.lastActionTime = block.timestamp;
        }
    }
    
    // Complete Game
    function _completeGame(uint256 _gameId) internal {
        GameCore storage game = gameCores[_gameId];
        GameProgress storage progress = gameProgress[_gameId];
        GameFinancials storage financials = gameFinancials[_gameId];
        
        game.state = GameState.Completed;
        progress.winner = progress.creatorWins > progress.joinerWins ? game.creator : game.joiner;
        
        // Calculate platform fee
        uint256 platformFee = 0;
        uint256 winnerPayout = 0;
        
        if (game.gameType == GameType.NFTvsCrypto) {
            platformFee = financials.totalPaid.mul(platformFeePercent).div(BASIS_POINTS);
            winnerPayout = financials.totalPaid.sub(platformFee);
            financials.platformFeeCollected = platformFee;
            
            // Add to unclaimed rewards
            if (financials.paymentTokenUsed == PaymentToken.ETH) {
                unclaimedETH[progress.winner] = unclaimedETH[progress.winner].add(winnerPayout);
                unclaimedETH[platformFeeReceiver] = unclaimedETH[platformFeeReceiver].add(platformFee);
            } else if (financials.paymentTokenUsed == PaymentToken.USDC) {
                unclaimedUSDC[progress.winner] = unclaimedUSDC[progress.winner].add(winnerPayout);
                unclaimedUSDC[platformFeeReceiver] = unclaimedUSDC[platformFeeReceiver].add(platformFee);
            }
        }
        
        // Handle NFTs
        if (progress.winner == game.creator) {
            // Creator wins - gets their NFT back
            unclaimedNFTs[game.creator][game.nftContract].push(game.tokenId);
            
            if (game.gameType == GameType.NFTvsNFT) {
                // Creator also wins challenger's NFT
                NFTChallenge memory challenge = nftChallenges[_gameId];
                unclaimedNFTs[game.creator][challenge.challengerNFTContract].push(challenge.challengerTokenId);
            }
        } else {
            // Joiner wins - gets creator's NFT
            unclaimedNFTs[game.joiner][game.nftContract].push(game.tokenId);
            userNFTsInContract[game.creator][game.nftContract][game.tokenId] = false;
            
            if (game.gameType == GameType.NFTvsNFT) {
                // Joiner gets their NFT back
                NFTChallenge memory challenge = nftChallenges[_gameId];
                unclaimedNFTs[game.joiner][challenge.challengerNFTContract].push(challenge.challengerTokenId);
            }
        }
        
        // Remove from active games
        _removeFromActiveGames(game.creator, _gameId);
        _removeFromActiveGames(game.joiner, _gameId);
        
        emit GameCompleted(_gameId, progress.winner);
    }
    
    // Cancel Game
    function cancelGame(uint256 _gameId) 
        external 
        nonReentrant 
        gameExists(_gameId)
    {
        GameCore storage game = gameCores[_gameId];
        require(msg.sender == game.creator, "Only creator can cancel");
        require(game.state == GameState.Created, "Can only cancel waiting games");
        
        game.state = GameState.Cancelled;
        
        // Return NFT to creator
        IERC721(game.nftContract).transferFrom(address(this), game.creator, game.tokenId);
        userNFTsInContract[game.creator][game.nftContract][game.tokenId] = false;
        
        // Remove from active games
        _removeFromActiveGames(game.creator, _gameId);
        
        emit GameCancelled(_gameId);
    }
    
    // Withdraw Functions
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
    
    function withdrawNFT(address nftContract, uint256 tokenId) external nonReentrant {
        uint256[] storage nftIds = unclaimedNFTs[msg.sender][nftContract];
        bool found = false;
        uint256 index;
        
        for (uint256 i = 0; i < nftIds.length; i++) {
            if (nftIds[i] == tokenId) {
                found = true;
                index = i;
                break;
            }
        }
        
        require(found, "NFT not found in unclaimed");
        
        // Remove from array
        nftIds[index] = nftIds[nftIds.length - 1];
        nftIds.pop();
        
        // Transfer NFT
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
        userNFTsInContract[msg.sender][nftContract][tokenId] = false;
        
        emit NFTWithdrawn(msg.sender, nftContract, tokenId);
    }
    
    function withdrawAllNFTs() external nonReentrant {
        // This function would iterate through all unclaimed NFTs
        // Implementation depends on gas optimization needs
    }
    
    // Admin Functions
    function setListingFee(uint256 _newFeeUSD) external onlyOwner {
        require(_newFeeUSD <= 1000000, "Fee too high"); // Max $1
        listingFeeUSD = _newFeeUSD;
        emit ListingFeeUpdated(_newFeeUSD);
    }
    
    function setPlatformFeePercent(uint256 _newPercent) external onlyOwner {
        require(_newPercent <= MAX_FEE_PERCENT, "Fee too high");
        platformFeePercent = _newPercent;
        emit PlatformFeeUpdated(_newPercent);
    }
    
    function emergencyWithdrawNFT(address nftContract, uint256 tokenId, address to) 
        external 
        onlyOwner 
    {
        IERC721(nftContract).transferFrom(address(this), to, tokenId);
    }
    
    function emergencyWithdrawETH(address to, uint256 amount) external onlyOwner {
        payable(to).transfer(amount);
    }
    
    function emergencyWithdrawToken(address token, address to, uint256 amount) 
        external 
        onlyOwner 
    {
        IERC20(token).transfer(to, amount);
    }
    
    // View Functions
    function getETHAmount(uint256 usdAmount) public view returns (uint256) {
        (, int256 price,,,) = ethUsdFeed.latestRoundData();
        uint8 decimals = ethUsdFeed.decimals();
        uint256 ethPrice = uint256(price) * 10**(18 - decimals);
        return (usdAmount * 1e18) / ethPrice;
    }
    
    function getRequiredPaymentAmount(uint256 gameId, PaymentToken token) 
        public 
        view 
        returns (uint256) 
    {
        uint256 priceUSD = gameFinancials[gameId].priceUSD;
        
        if (token == PaymentToken.ETH) {
            return getETHAmount(priceUSD);
        } else if (token == PaymentToken.USDC) {
            return priceUSD; // USDC has 6 decimals like our USD representation
        }
        
        revert("Unsupported token");
    }
    
    function getUserActiveGames(address user) external view returns (uint256[] memory) {
        return userActiveGames[user];
    }
    
    function getUserUnclaimedNFTs(address user, address nftContract) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return unclaimedNFTs[user][nftContract];
    }
    
    function getGameDetails(uint256 gameId) 
        external 
        view 
        returns (
            GameCore memory core,
            GameFinancials memory financials,
            GameProgress memory progress
        ) 
    {
        return (gameCores[gameId], gameFinancials[gameId], gameProgress[gameId]);
    }
    
    // Internal Helpers
    function _removeFromActiveGames(address user, uint256 gameId) internal {
        uint256[] storage games = userActiveGames[user];
        for (uint256 i = 0; i < games.length; i++) {
            if (games[i] == gameId) {
                games[i] = games[games.length - 1];
                games.pop();
                break;
            }
        }
    }
} 