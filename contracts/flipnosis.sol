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
    enum PaymentToken { ETH, USDC, NATIVE }
    enum CoinSide { HEADS, TAILS }
    enum PlayerRole { FLIPPER, CHOOSER }
    
    // Structs - Split for stack optimization
    struct GameCore {
        uint256 gameId;
        address creator;
        address joiner;
        address nftContract;
        uint256 tokenId;
        GameState state;
        PlayerRole creatorRole;
        PlayerRole joinerRole;
        CoinSide joinerChoice;
    }
    
    struct GameFinancials {
        uint256 priceUSD;
        PaymentToken acceptedToken;
        uint256 totalPaid;
        PaymentToken paymentTokenUsed;
    }
    
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
    
    struct GameRound {
        CoinSide result;
        uint8 power;
        bool completed;
        address flipper;
    }
    
    struct CounterOffer {
        address offerer;
        uint256 priceUSD;
        PaymentToken paymentToken;
        bool active;
        uint256 expiresAt;
    }
    
    struct CreateGameParams {
        address nftContract;
        uint256 tokenId;
        uint256 priceUSD;
        PaymentToken acceptedToken;
        uint8 maxRounds;
        string authInfo;
    }
    
    struct PaymentParams {
        uint256 gameId;
        PaymentToken paymentToken;
        uint256 requiredAmount;
    }
    
    // State variables - Optimized mappings
    mapping(uint256 => GameCore) public gameCores;
    mapping(uint256 => GameFinancials) public gameFinancials;
    mapping(uint256 => GameProgress) public gameProgress;
    mapping(uint256 => mapping(uint8 => GameRound)) public gameRounds;
    mapping(uint256 => CounterOffer[]) public gameCounterOffers;
    mapping(address => uint256[]) public userGames;
    mapping(uint256 => string) public gameAuthInfo;
    
    uint256 public nextGameId = 1;
    
    // Fee structure
    uint256 public listingFeeUSD = 200000; // $0.20 in 6 decimals
    uint256 public winningsFeePercent = 500; // 5% in basis points
    uint256 public constant MAX_FEE_PERCENT = 1000;
    
    // Game settings
    uint256 public constant COUNTDOWN_DURATION = 5 seconds;
    uint256 public constant TURN_TIMEOUT = 30 seconds;
    
    // External contracts
    AggregatorV3Interface public ethUsdFeed;
    AggregatorV3Interface public usdcUsdFeed;
    address public usdcToken;
    address public nativeToken;
    
    // Platform settings
    uint256 public gameExpiryDuration = 7 days;
    uint256 public offerExpiryDuration = 1 days;
    address public feeReceiver;
    
    // Events
    event GameCreated(
        uint256 indexed gameId,
        address indexed creator,
        address indexed nftContract,
        uint256 tokenId,
        uint256 priceUSD,
        PaymentToken acceptedToken,
        string authInfo
    );
    
    event GameJoined(
        uint256 indexed gameId,
        address indexed joiner,
        CoinSide choice
    );
    
    event FlipResultEvent(
        uint256 indexed gameId,
        uint8 round,
        CoinSide result,
        uint8 power,
        address flipper
    );
    
    event GameCompleted(
        uint256 indexed gameId,
        address indexed winner,
        uint256 winnings,
        uint256 platformFee
    );
    
    event CounterOfferMade(
        uint256 indexed gameId,
        address indexed offerer,
        uint256 priceUSD,
        PaymentToken paymentToken
    );
    
    event CounterOfferAccepted(
        uint256 indexed gameId,
        address indexed offerer,
        uint256 priceUSD
    );
    
    event GameCancelled(uint256 indexed gameId, address indexed creator);
    
    event TurnStarted(
        uint256 indexed gameId,
        uint8 round,
        address flipper
    );
    
    event CountdownStarted(
        uint256 indexed gameId,
        uint8 round,
        uint256 endTime
    );
    
    constructor(
        address _ethUsdFeed,
        address _usdcUsdFeed,
        address _usdcToken,
        address _feeReceiver
    ) Ownable() {
        ethUsdFeed = AggregatorV3Interface(_ethUsdFeed);
        usdcUsdFeed = AggregatorV3Interface(_usdcUsdFeed);
        usdcToken = _usdcToken;
        feeReceiver = _feeReceiver;
    }
    
    // Modifiers
    modifier gameExists(uint256 _gameId) {
        require(_gameId < nextGameId && _gameId > 0, "Game does not exist");
        _;
    }
    
    modifier onlyGameCreator(uint256 _gameId) {
        require(gameCores[_gameId].creator == msg.sender, "Only game creator");
        _;
    }
    
    modifier gameInState(uint256 _gameId, GameState _state) {
        require(gameCores[_gameId].state == _state, "Invalid game state");
        _;
    }
    
    modifier onlyGamePlayer(uint256 _gameId) {
        require(
            msg.sender == gameCores[_gameId].creator || 
            msg.sender == gameCores[_gameId].joiner,
            "Not a game player"
        );
        _;
    }
    
    // Main functions
    function createGame(CreateGameParams calldata params) 
        external 
        whenNotPaused 
        nonReentrant 
        returns (uint256) 
    {
        _validateCreateParams(params);
        _transferNFTToContract(params.nftContract, params.tokenId);
        
        uint256 gameId = nextGameId++;
        _initializeGameStructs(gameId, params);
        
        userGames[msg.sender].push(gameId);
        
        emit GameCreated(
            gameId, 
            msg.sender, 
            params.nftContract, 
            params.tokenId, 
            params.priceUSD, 
            params.acceptedToken,
            params.authInfo
        );
        
        return gameId;
    }
    
    function joinGame(uint256 _gameId, CoinSide _choice) 
        external 
        whenNotPaused 
        nonReentrant 
        gameExists(_gameId) 
        gameInState(_gameId, GameState.Created) 
    {
        require(msg.sender != gameCores[_gameId].creator, "Cannot join own game");
        require(block.timestamp < gameProgress[_gameId].expiresAt, "Game expired");
        
        // Randomly assign roles
        bool creatorIsFlipper = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            _gameId
        ))) % 2 == 0;
        
        gameCores[_gameId].joiner = msg.sender;
        gameCores[_gameId].joinerChoice = _choice;
        gameCores[_gameId].creatorRole = creatorIsFlipper ? PlayerRole.FLIPPER : PlayerRole.CHOOSER;
        gameCores[_gameId].joinerRole = creatorIsFlipper ? PlayerRole.CHOOSER : PlayerRole.FLIPPER;
        gameCores[_gameId].state = GameState.Joined;
        
        gameProgress[_gameId].lastActionTime = block.timestamp;
        
        userGames[msg.sender].push(_gameId);
        
        emit GameJoined(_gameId, msg.sender, _choice);
    }
    
    function startCountdown(uint256 _gameId) 
        external 
        whenNotPaused 
        nonReentrant 
        gameExists(_gameId) 
        gameInState(_gameId, GameState.Joined) 
        onlyGamePlayer(_gameId) 
    {
        GameCore memory game = gameCores[_gameId];
        require(
            (game.creatorRole == PlayerRole.FLIPPER && msg.sender == game.creator) ||
            (game.joinerRole == PlayerRole.FLIPPER && msg.sender == game.joiner),
            "Not your turn to flip"
        );
        
        gameProgress[_gameId].countdownEndTime = block.timestamp + COUNTDOWN_DURATION;
        gameProgress[_gameId].lastActionTime = block.timestamp;
        
        emit CountdownStarted(_gameId, gameProgress[_gameId].currentRound, gameProgress[_gameId].countdownEndTime);
    }
    
    function flip(uint256 _gameId, uint8 _power) 
        external 
        whenNotPaused 
        nonReentrant 
        gameExists(_gameId) 
        onlyGamePlayer(_gameId) 
    {
        GameCore memory game = gameCores[_gameId];
        GameProgress storage progress = gameProgress[_gameId];
        
        require(
            (game.creatorRole == PlayerRole.FLIPPER && msg.sender == game.creator) ||
            (game.joinerRole == PlayerRole.FLIPPER && msg.sender == game.joiner),
            "Not your turn to flip"
        );
        
        require(block.timestamp >= progress.countdownEndTime, "Countdown not finished");
        require(_power > 0 && _power <= 10, "Invalid power");
        
        uint8 currentRound = progress.currentRound;
        GameRound storage round = gameRounds[_gameId][currentRound];
        
        // Generate result based on power and randomness
        bool isHeads = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            _gameId,
            currentRound,
            _power
        ))) % 2 == 0;
        
        round.result = isHeads ? CoinSide.HEADS : CoinSide.TAILS;
        round.power = _power;
        round.completed = true;
        round.flipper = msg.sender;
        
        // Update scores
        if (round.result == game.joinerChoice) {
            progress.joinerWins++;
        } else {
            progress.creatorWins++;
        }
        
        emit FlipResultEvent(_gameId, currentRound, round.result, _power, msg.sender);
        
        // Check for game completion
        uint8 winsNeeded = (progress.maxRounds / 2) + 1;
        if (progress.creatorWins >= winsNeeded || progress.joinerWins >= winsNeeded) {
            _completeGame(_gameId);
        } else {
            progress.currentRound++;
            progress.lastActionTime = block.timestamp;
            emit TurnStarted(_gameId, progress.currentRound, 
                game.creatorRole == PlayerRole.FLIPPER ? game.creator : game.joiner);
        }
    }
    
    function cancelGame(uint256 _gameId) 
        external 
        nonReentrant 
        gameExists(_gameId) 
        onlyGameCreator(_gameId) 
        gameInState(_gameId, GameState.Created) 
    {
        gameCores[_gameId].state = GameState.Cancelled;
        
        GameCore memory core = gameCores[_gameId];
        IERC721(core.nftContract).transferFrom(address(this), core.creator, core.tokenId);
        
        emit GameCancelled(_gameId, core.creator);
    }
    
    // Internal functions
    function _validateCreateParams(CreateGameParams calldata params) internal pure {
        require(params.maxRounds == 5 || params.maxRounds == 7, "Max rounds must be 5 or 7");
        require(params.priceUSD > 0, "Price must be greater than 0");
        require(params.nftContract != address(0), "Invalid NFT contract");
    }
    
    function _transferNFTToContract(address nftContract, uint256 tokenId) internal {
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
    }
    
    function _initializeGameStructs(uint256 gameId, CreateGameParams calldata params) internal {
        gameCores[gameId] = GameCore({
            gameId: gameId,
            creator: msg.sender,
            joiner: address(0),
            nftContract: params.nftContract,
            tokenId: params.tokenId,
            state: GameState.Created,
            creatorRole: PlayerRole.FLIPPER, // Temporary, will be set when joined
            joinerRole: PlayerRole.CHOOSER, // Temporary, will be set when joined
            joinerChoice: CoinSide.HEADS // Temporary, will be set when joined
        });
        
        gameFinancials[gameId] = GameFinancials({
            priceUSD: params.priceUSD,
            acceptedToken: params.acceptedToken,
            totalPaid: 0,
            paymentTokenUsed: PaymentToken.ETH
        });
        
        gameProgress[gameId] = GameProgress({
            createdAt: block.timestamp,
            expiresAt: block.timestamp + gameExpiryDuration,
            maxRounds: params.maxRounds,
            currentRound: 1,
            creatorWins: 0,
            joinerWins: 0,
            winner: address(0),
            lastActionTime: block.timestamp,
            countdownEndTime: 0
        });
        
        gameAuthInfo[gameId] = params.authInfo;
    }
    
    function _completeGame(uint256 _gameId) internal {
        GameCore memory game = gameCores[_gameId];
        GameProgress storage progress = gameProgress[_gameId];
        
        game.state = GameState.Completed;
        
        if (progress.creatorWins > progress.joinerWins) {
            progress.winner = game.creator;
        } else {
            progress.winner = game.joiner;
        }
        
        uint256 platformFee = _calculatePlatformFee(_gameId);
        uint256 winnings = gameFinancials[_gameId].totalPaid.sub(platformFee);
        
        _distributeWinnings(_gameId, progress.winner, winnings, platformFee);
        _transferNFTToWinner(_gameId, progress.winner);
        
        emit GameCompleted(_gameId, progress.winner, winnings, platformFee);
    }
    
    function _calculatePlatformFee(uint256 _gameId) internal view returns (uint256) {
        return gameFinancials[_gameId].totalPaid.mul(winningsFeePercent).div(10000);
    }
    
    function _distributeWinnings(
        uint256 _gameId, 
        address winner, 
        uint256 winnings, 
        uint256 platformFee
    ) internal {
        PaymentToken paymentToken = gameFinancials[_gameId].paymentTokenUsed;
        
        if (paymentToken == PaymentToken.ETH) {
            payable(winner).transfer(winnings);
            payable(feeReceiver).transfer(platformFee);
        } else if (paymentToken == PaymentToken.USDC) {
            IERC20(usdcToken).transfer(winner, winnings);
            IERC20(usdcToken).transfer(feeReceiver, platformFee);
        }
    }
    
    function _transferNFTToWinner(uint256 _gameId, address winner) internal {
        GameCore memory core = gameCores[_gameId];
        IERC721(core.nftContract).transferFrom(address(this), winner, core.tokenId);
    }
    
    // View functions
    function getGameBasic(uint256 _gameId) 
        external 
        view 
        gameExists(_gameId) 
        returns (
            uint256 gameId,
            address creator,
            address joiner,
            address nftContract,
            uint256 tokenId,
            uint256 priceUSD,
            PaymentToken acceptedToken,
            GameState state,
            string memory authInfo
        ) 
    {
        GameCore memory core = gameCores[_gameId];
        GameFinancials memory financials = gameFinancials[_gameId];
        
        return (
            core.gameId,
            core.creator,
            core.joiner,
            core.nftContract,
            core.tokenId,
            financials.priceUSD,
            financials.acceptedToken,
            core.state,
            gameAuthInfo[_gameId]
        );
    }
    
    function getGameProgress(uint256 _gameId) 
        external 
        view 
        gameExists(_gameId) 
        returns (
            uint256 createdAt,
            uint256 expiresAt,
            uint8 maxRounds,
            uint8 currentRound,
            uint8 creatorWins,
            uint8 joinerWins,
            address winner,
            uint256 lastActionTime,
            uint256 countdownEndTime
        ) 
    {
        GameProgress memory progress = gameProgress[_gameId];
        return (
            progress.createdAt,
            progress.expiresAt,
            progress.maxRounds,
            progress.currentRound,
            progress.creatorWins,
            progress.joinerWins,
            progress.winner,
            progress.lastActionTime,
            progress.countdownEndTime
        );
    }
    
    function getGameRound(uint256 _gameId, uint8 _round) 
        external 
        view 
        returns (
            CoinSide result,
            uint8 power,
            bool completed,
            address flipper
        ) 
    {
        GameRound memory round = gameRounds[_gameId][_round];
        return (round.result, round.power, round.completed, round.flipper);
    }
    
    function getUserGames(address _user) external view returns (uint256[] memory) {
        return userGames[_user];
    }
    
    // Admin functions
    function setFees(
        uint256 _listingFeeUSD,
        uint256 _winningsFeePercent
    ) external onlyOwner {
        require(_winningsFeePercent <= MAX_FEE_PERCENT, "Fee too high");
        listingFeeUSD = _listingFeeUSD;
        winningsFeePercent = _winningsFeePercent;
    }
    
    function setFeeReceiver(address _feeReceiver) external onlyOwner {
        require(_feeReceiver != address(0), "Invalid address");
        feeReceiver = _feeReceiver;
    }
    
    function setPriceFeeds(address _ethUsdFeed, address _usdcUsdFeed) external onlyOwner {
        ethUsdFeed = AggregatorV3Interface(_ethUsdFeed);
        usdcUsdFeed = AggregatorV3Interface(_usdcUsdFeed);
    }
    
    function setGameSettings(
        uint256 _gameExpiryDuration,
        uint256 _offerExpiryDuration
    ) external onlyOwner {
        gameExpiryDuration = _gameExpiryDuration;
        offerExpiryDuration = _offerExpiryDuration;
    }
    
    function setNativeToken(address _nativeToken) external onlyOwner {
        nativeToken = _nativeToken;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Emergency functions
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        if (_token == address(0)) {
            payable(owner()).transfer(_amount);
        } else {
            IERC20(_token).transfer(owner(), _amount);
        }
    }
    
    function emergencyWithdrawNFT(address _nftContract, uint256 _tokenId) external onlyOwner {
        IERC721(_nftContract).transferFrom(address(this), owner(), _tokenId);
    }
    
    receive() external payable {}
}