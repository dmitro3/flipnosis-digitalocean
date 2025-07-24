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

/**
 * @title NFTFlipGame - Clean Architecture (ETH & USDC Support)
 * @notice This contract only handles asset custody and payouts. All game logic is off-chain.
 */
contract NFTFlipGame is ReentrancyGuard, Ownable, Pausable {
    enum PaymentToken { ETH, USDC }

    struct ActiveGame {
        address player1;
        address player2;
        address nftContract;
        uint256 tokenId;
        uint256 ethAmount;
        uint256 usdcAmount;
        PaymentToken paymentToken;
        uint256 depositTime;
        bool player1Deposited;
        bool player2Deposited;
        bool completed;
        address winner;
    }

    // State
    mapping(bytes32 => ActiveGame) public games;
    mapping(address => uint256) public listingFees;
    mapping(address => bytes32[]) public userGames;

    // Settings
    uint256 public listingFeeUSD = 200000; // $0.20 in 6 decimals
    uint256 public platformFeePercent = 350; // 3.5%
    uint256 public depositTimeout = 120; // 2 minutes
    uint256 public constant BASIS_POINTS = 10000;
    address public platformFeeReceiver;
    AggregatorV3Interface public ethUsdFeed;
    address public usdcToken;

    // Events
    event ListingFeePaid(address indexed creator, uint256 amount);
    event GameCreated(bytes32 indexed gameId, address player1, address player2, PaymentToken paymentToken);
    event AssetsDeposited(bytes32 indexed gameId, address player, bool isNFT, PaymentToken paymentToken);
    event GameStarted(bytes32 indexed gameId);
    event GameCompleted(bytes32 indexed gameId, address winner);
    event GameCancelled(bytes32 indexed gameId, string reason);
    event AssetsReclaimed(bytes32 indexed gameId, address player);

    constructor(address _ethUsdFeed, address _usdcToken, address _platformFeeReceiver) {
        ethUsdFeed = AggregatorV3Interface(_ethUsdFeed);
        usdcToken = _usdcToken;
        platformFeeReceiver = _platformFeeReceiver;
    }

    /**
     * @notice Pay listing fee to create a listing (no NFT transfer)
     */
    function payListingFee() external payable nonReentrant whenNotPaused {
        uint256 requiredFee = getETHAmount(listingFeeUSD);
        require(msg.value >= requiredFee, "Insufficient listing fee");
        listingFees[msg.sender] += requiredFee;
        (bool success,) = platformFeeReceiver.call{value: requiredFee}("");
        require(success, "Fee transfer failed");
        if (msg.value > requiredFee) {
            (bool refundSuccess,) = msg.sender.call{value: msg.value - requiredFee}("");
            require(refundSuccess, "Refund failed");
        }
        emit ListingFeePaid(msg.sender, requiredFee);
    }

    /**
     * @notice Initialize a game when offer is accepted (no deposits yet)
     */
    function initializeGame(
        bytes32 gameId,
        address player1,
        address player2,
        address nftContract,
        uint256 tokenId,
        uint256 priceUSD,
        PaymentToken paymentToken
    ) external onlyOwner {
        require(games[gameId].player1 == address(0), "Game already exists");
        require(player1 != player2, "Cannot play against yourself");
        uint256 ethAmount = 0;
        uint256 usdcAmount = 0;
        if (paymentToken == PaymentToken.ETH) {
            ethAmount = getETHAmount(priceUSD);
        } else {
            usdcAmount = priceUSD; // USDC is 6 decimals, priceUSD is 6 decimals
        }
        games[gameId] = ActiveGame({
            player1: player1,
            player2: player2,
            nftContract: nftContract,
            tokenId: tokenId,
            ethAmount: ethAmount,
            usdcAmount: usdcAmount,
            paymentToken: paymentToken,
            depositTime: block.timestamp,
            player1Deposited: false,
            player2Deposited: false,
            completed: false,
            winner: address(0)
        });
        userGames[player1].push(gameId);
        userGames[player2].push(gameId);
        emit GameCreated(gameId, player1, player2, paymentToken);
    }

    /**
     * @notice Player 1 deposits their NFT
     */
    function depositNFT(bytes32 gameId) external nonReentrant whenNotPaused {
        ActiveGame storage game = games[gameId];
        require(game.player1 != address(0), "Game does not exist");
        require(msg.sender == game.player1, "Not player 1");
        require(!game.player1Deposited, "Already deposited");
        require(!game.completed, "Game completed");
        require(block.timestamp <= game.depositTime + depositTimeout, "Deposit timeout");
        IERC721(game.nftContract).transferFrom(msg.sender, address(this), game.tokenId);
        game.player1Deposited = true;
        emit AssetsDeposited(gameId, msg.sender, true, game.paymentToken);
        if (game.player1Deposited && game.player2Deposited) {
            emit GameStarted(gameId);
        }
    }

    /**
     * @notice Player 2 deposits their ETH or USDC
     */
    function depositETH(bytes32 gameId) external payable nonReentrant whenNotPaused {
        ActiveGame storage game = games[gameId];
        require(game.player2 != address(0), "Game does not exist");
        require(msg.sender == game.player2, "Not player 2");
        require(!game.player2Deposited, "Already deposited");
        require(!game.completed, "Game completed");
        require(block.timestamp <= game.depositTime + depositTimeout, "Deposit timeout");
        require(game.paymentToken == PaymentToken.ETH, "Not an ETH game");
        uint256 platformFee = (game.ethAmount * platformFeePercent) / BASIS_POINTS;
        uint256 totalRequired = game.ethAmount;
        require(msg.value >= totalRequired, "Insufficient ETH");
        game.player2Deposited = true;
        (bool feeSuccess,) = platformFeeReceiver.call{value: platformFee}("");
        require(feeSuccess, "Platform fee transfer failed");
        game.ethAmount = game.ethAmount - platformFee;
        if (msg.value > totalRequired) {
            (bool refundSuccess,) = msg.sender.call{value: msg.value - totalRequired}("");
            require(refundSuccess, "Refund failed");
        }
        emit AssetsDeposited(gameId, msg.sender, false, game.paymentToken);
        if (game.player1Deposited && game.player2Deposited) {
            emit GameStarted(gameId);
        }
    }

    function depositUSDC(bytes32 gameId, uint256 amount) external nonReentrant whenNotPaused {
        ActiveGame storage game = games[gameId];
        require(game.player2 != address(0), "Game does not exist");
        require(msg.sender == game.player2, "Not player 2");
        require(!game.player2Deposited, "Already deposited");
        require(!game.completed, "Game completed");
        require(block.timestamp <= game.depositTime + depositTimeout, "Deposit timeout");
        require(game.paymentToken == PaymentToken.USDC, "Not a USDC game");
        uint256 platformFee = (game.usdcAmount * platformFeePercent) / BASIS_POINTS;
        uint256 totalRequired = game.usdcAmount;
        require(amount >= totalRequired, "Insufficient USDC");
        game.player2Deposited = true;
        // Transfer USDC from player2 to contract
        require(IERC20(usdcToken).transferFrom(msg.sender, address(this), totalRequired), "USDC transfer failed");
        // Send platform fee to receiver
        require(IERC20(usdcToken).transfer(platformFeeReceiver, platformFee), "USDC fee transfer failed");
        game.usdcAmount = game.usdcAmount - platformFee;
        emit AssetsDeposited(gameId, msg.sender, false, game.paymentToken);
        if (game.player1Deposited && game.player2Deposited) {
            emit GameStarted(gameId);
        }
    }

    /**
     * @notice Complete game and transfer assets to winner (called by backend)
     */
    function completeGame(bytes32 gameId, address winner) external onlyOwner nonReentrant {
        ActiveGame storage game = games[gameId];
        require(game.player1 != address(0), "Game does not exist");
        require(!game.completed, "Game already completed");
        require(game.player1Deposited && game.player2Deposited, "Assets not deposited");
        require(winner == game.player1 || winner == game.player2, "Invalid winner");
        game.completed = true;
        game.winner = winner;
        IERC721(game.nftContract).transferFrom(address(this), winner, game.tokenId);
        if (game.paymentToken == PaymentToken.ETH) {
            (bool success,) = winner.call{value: game.ethAmount}("");
            require(success, "ETH transfer failed");
        } else {
            require(IERC20(usdcToken).transfer(winner, game.usdcAmount), "USDC transfer failed");
        }
        emit GameCompleted(gameId, winner);
    }

    /**
     * @notice Reclaim assets if other player doesn't deposit in time
     */
    function reclaimAssets(bytes32 gameId) external nonReentrant {
        ActiveGame storage game = games[gameId];
        require(game.player1 != address(0), "Game does not exist");
        require(!game.completed, "Game completed");
        require(block.timestamp > game.depositTime + depositTimeout, "Timeout not reached");
        require(msg.sender == game.player1 || msg.sender == game.player2, "Not a player");
        if (game.player1Deposited && !game.player2Deposited) {
            require(msg.sender == game.player1, "Not your assets");
            game.completed = true;
            IERC721(game.nftContract).transferFrom(address(this), game.player1, game.tokenId);
            emit AssetsReclaimed(gameId, game.player1);
        } else if (!game.player1Deposited && game.player2Deposited) {
            require(msg.sender == game.player2, "Not your assets");
            game.completed = true;
            if (game.paymentToken == PaymentToken.ETH) {
                (bool success,) = game.player2.call{value: game.ethAmount + (game.ethAmount * platformFeePercent / BASIS_POINTS)}("");
                require(success, "ETH refund failed");
            } else {
                require(IERC20(usdcToken).transfer(game.player2, game.usdcAmount + (game.usdcAmount * platformFeePercent / BASIS_POINTS)), "USDC refund failed");
            }
            emit AssetsReclaimed(gameId, game.player2);
        } else if (!game.player1Deposited && !game.player2Deposited) {
            game.completed = true;
            emit GameCancelled(gameId, "No deposits made");
        }
    }

    /**
     * @notice Cancel game before deposits (only by backend in case of issues)
     */
    function cancelGame(bytes32 gameId) external onlyOwner {
        ActiveGame storage game = games[gameId];
        require(game.player1 != address(0), "Game does not exist");
        require(!game.completed, "Game already completed");
        require(!game.player1Deposited && !game.player2Deposited, "Cannot cancel after deposits");
        game.completed = true;
        emit GameCancelled(gameId, "Cancelled by system");
    }

    /**
     * @notice Get ETH amount for USD value
     */
    function getETHAmount(uint256 usdAmount) public view returns (uint256) {
        (, int256 ethPrice,,,) = ethUsdFeed.latestRoundData();
        require(ethPrice > 0, "Invalid price feed");
        return (usdAmount * 1e20) / uint256(ethPrice);
    }

    /**
     * @notice Get USDC amount for USD value (1:1, 6 decimals)
     */
    function getUSDCAmount(uint256 usdAmount) public pure returns (uint256) {
        return usdAmount; // USDC is 6 decimals, priceUSD is 6 decimals
    }

    /**
     * @notice Check if game can start
     */
    function canStartGame(bytes32 gameId) external view returns (bool) {
        ActiveGame memory game = games[gameId];
        return game.player1Deposited && game.player2Deposited && !game.completed;
    }

    /**
     * @notice Check if deposits are still allowed
     */
    function canDeposit(bytes32 gameId) external view returns (bool) {
        ActiveGame memory game = games[gameId];
        return game.player1 != address(0) && 
               !game.completed && 
               block.timestamp <= game.depositTime + depositTimeout;
    }

    // Admin functions
    function setListingFee(uint256 newFee) external onlyOwner {
        listingFeeUSD = newFee;
    }

    function setPlatformFee(uint256 newPercent) external onlyOwner {
        require(newPercent <= 1000, "Max 10%");
        platformFeePercent = newPercent;
    }

    function setDepositTimeout(uint256 newTimeout) external onlyOwner {
        require(newTimeout >= 60 && newTimeout <= 600, "Timeout must be 1-10 minutes");
        depositTimeout = newTimeout;
    }

    function emergencyPause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Emergency functions
    function emergencyWithdrawETH() external onlyOwner {
        (bool success,) = owner().call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }

    function emergencyWithdrawNFT(address nftContract, uint256 tokenId, address to) external onlyOwner {
        IERC721(nftContract).transferFrom(address(this), to, tokenId);
    }

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
            try IERC721(nftContracts[i]).ownerOf(tokenIds[i]) returns (address owner) {
                require(owner == address(this), "Contract does not own this NFT");
            } catch {
                revert("Failed to check NFT ownership");
            }
            IERC721(nftContracts[i]).transferFrom(address(this), recipients[i], tokenIds[i]);
        }
    }

    // View functions
    function getUserGames(address user) external view returns (bytes32[] memory) {
        return userGames[user];
    }

    function getGameDetails(bytes32 gameId) external view returns (
        address player1,
        address player2,
        address nftContract,
        uint256 tokenId,
        uint256 ethAmount,
        uint256 usdcAmount,
        PaymentToken paymentToken,
        uint256 depositTime,
        bool player1Deposited,
        bool player2Deposited,
        bool completed,
        address winner
    ) {
        ActiveGame memory game = games[gameId];
        return (
            game.player1,
            game.player2,
            game.nftContract,
            game.tokenId,
            game.ethAmount,
            game.usdcAmount,
            game.paymentToken,
            game.depositTime,
            game.player1Deposited,
            game.player2Deposited,
            game.completed,
            game.winner
        );
    }
} 