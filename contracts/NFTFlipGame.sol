// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract NFTFlipGame is ReentrancyGuard, Ownable, Pausable {
    
    // Payment tokens
    enum PaymentToken { ETH, USDC }
    
    // Game deposits
    mapping(bytes32 => NFTDeposit) public nftDeposits;
    mapping(bytes32 => ETHDeposit) public ethDeposits;
    mapping(bytes32 => USDCDeposit) public usdcDeposits;
    mapping(bytes32 => GameResult) public gameResults;
    
    struct NFTDeposit {
        address depositor;
        address nftContract;
        uint256 tokenId;
        bool claimed;
        uint256 depositTime;
    }
    
    struct ETHDeposit {
        address depositor;
        uint256 amount;
        bool claimed;
        uint256 depositTime;
    }
    
    struct USDCDeposit {
        address depositor;
        uint256 amount;
        bool claimed;
        uint256 depositTime;
    }
    
    struct GameResult {
        address winner;
        bool completed;
        uint256 completionTime;
    }
    
    // Configuration
    uint256 public depositTimeout = 2 minutes;
    uint256 public platformFeePercent = 350; // 3.5%
    uint256 public constant BASIS_POINTS = 10000;
    address public platformFeeReceiver;
    address public usdcToken;
    
    // Events
    event NFTDeposited(bytes32 indexed gameId, address indexed depositor, address nftContract, uint256 tokenId);
    event ETHDeposited(bytes32 indexed gameId, address indexed depositor, uint256 amount);
    event USDCDeposited(bytes32 indexed gameId, address indexed depositor, uint256 amount);
    event GameReady(bytes32 indexed gameId, address nftDepositor, address cryptoDepositor);
    event GameCompleted(bytes32 indexed gameId, address indexed winner);
    event AssetsReclaimed(bytes32 indexed gameId, address indexed reclaimer, string assetType);
    
    constructor(address _platformFeeReceiver, address _usdcToken) {
        platformFeeReceiver = _platformFeeReceiver;
        usdcToken = _usdcToken;
    }
    
    /**
     * @notice Deposit NFT for a game
     */
    function depositNFT(bytes32 gameId, address nftContract, uint256 tokenId) 
        external nonReentrant whenNotPaused {
        
        require(nftDeposits[gameId].depositor == address(0), "NFT already deposited for this game");
        require(gameResults[gameId].completed == false, "Game already completed");
        
        // Transfer NFT to contract
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        
        // Record deposit
        nftDeposits[gameId] = NFTDeposit({
            depositor: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            claimed: false,
            depositTime: block.timestamp
        });
        
        emit NFTDeposited(gameId, msg.sender, nftContract, tokenId);
        
        // Check if game is ready
        _checkGameReady(gameId);
    }
    
    /**
     * @notice Deposit ETH for a game
     */
    function depositETH(bytes32 gameId) 
        external payable nonReentrant whenNotPaused {
        
        require(ethDeposits[gameId].depositor == address(0), "ETH already deposited for this game");
        require(usdcDeposits[gameId].depositor == address(0), "USDC already deposited for this game");
        require(gameResults[gameId].completed == false, "Game already completed");
        require(msg.value > 0, "Must send some ETH");
        
        // Record deposit
        ethDeposits[gameId] = ETHDeposit({
            depositor: msg.sender,
            amount: msg.value,
            claimed: false,
            depositTime: block.timestamp
        });
        
        emit ETHDeposited(gameId, msg.sender, msg.value);
        
        // Check if game is ready
        _checkGameReady(gameId);
    }
    
    /**
     * @notice Deposit USDC for a game
     */
    function depositUSDC(bytes32 gameId, uint256 amount) 
        external nonReentrant whenNotPaused {
        
        require(usdcDeposits[gameId].depositor == address(0), "USDC already deposited for this game");
        require(ethDeposits[gameId].depositor == address(0), "ETH already deposited for this game");
        require(gameResults[gameId].completed == false, "Game already completed");
        require(amount > 0, "Must deposit some USDC");
        
        // Transfer USDC to contract
        require(IERC20(usdcToken).transferFrom(msg.sender, address(this), amount), "USDC transfer failed");
        
        // Record deposit
        usdcDeposits[gameId] = USDCDeposit({
            depositor: msg.sender,
            amount: amount,
            claimed: false,
            depositTime: block.timestamp
        });
        
        emit USDCDeposited(gameId, msg.sender, amount);
        
        // Check if game is ready
        _checkGameReady(gameId);
    }
    
    /**
     * @notice Check if both assets are deposited and emit GameReady
     */
    function _checkGameReady(bytes32 gameId) internal {
        bool hasNFT = nftDeposits[gameId].depositor != address(0);
        bool hasCrypto = ethDeposits[gameId].depositor != address(0) || usdcDeposits[gameId].depositor != address(0);
        
        if (hasNFT && hasCrypto) {
            address cryptoDepositor = ethDeposits[gameId].depositor != address(0) 
                ? ethDeposits[gameId].depositor 
                : usdcDeposits[gameId].depositor;
                
            emit GameReady(gameId, nftDeposits[gameId].depositor, cryptoDepositor);
        }
    }
    
    /**
     * @notice Check if game has both deposits and is ready to play
     */
    function isGameReady(bytes32 gameId) external view returns (bool) {
        bool hasNFT = nftDeposits[gameId].depositor != address(0) && !nftDeposits[gameId].claimed;
        bool hasCrypto = (ethDeposits[gameId].depositor != address(0) && !ethDeposits[gameId].claimed) ||
                        (usdcDeposits[gameId].depositor != address(0) && !usdcDeposits[gameId].claimed);
        bool notCompleted = !gameResults[gameId].completed;
        
        return hasNFT && hasCrypto && notCompleted;
    }
    
    /**
     * @notice Get game participants
     */
    function getGameParticipants(bytes32 gameId) external view returns (address nftPlayer, address cryptoPlayer) {
        nftPlayer = nftDeposits[gameId].depositor;
        cryptoPlayer = ethDeposits[gameId].depositor != address(0) 
            ? ethDeposits[gameId].depositor 
            : usdcDeposits[gameId].depositor;
    }
    
    /**
     * @notice Complete game and declare winner (only owner/backend)
     */
    function completeGame(bytes32 gameId, address winner) external onlyOwner nonReentrant {
        require(this.isGameReady(gameId), "Game not ready");
        require(gameResults[gameId].completed == false, "Game already completed");
        
        // Verify winner is one of the participants
        address nftPlayer = nftDeposits[gameId].depositor;
        address cryptoPlayer = ethDeposits[gameId].depositor != address(0) 
            ? ethDeposits[gameId].depositor 
            : usdcDeposits[gameId].depositor;
            
        require(winner == nftPlayer || winner == cryptoPlayer, "Winner must be a game participant");
        
        // Mark game as completed
        gameResults[gameId] = GameResult({
            winner: winner,
            completed: true,
            completionTime: block.timestamp
        });
        
        // Transfer NFT to winner
        NFTDeposit storage nftDep = nftDeposits[gameId];
        IERC721(nftDep.nftContract).transferFrom(address(this), winner, nftDep.tokenId);
        nftDep.claimed = true;
        
        // Transfer crypto to winner (minus platform fee)
        if (ethDeposits[gameId].depositor != address(0)) {
            ETHDeposit storage ethDep = ethDeposits[gameId];
            uint256 platformFee = (ethDep.amount * platformFeePercent) / BASIS_POINTS;
            uint256 winnerAmount = ethDep.amount - platformFee;
            
            // Transfer fee to platform
            (bool feeSuccess,) = platformFeeReceiver.call{value: platformFee}("");
            require(feeSuccess, "Platform fee transfer failed");
            
            // Transfer remaining to winner
            (bool winnerSuccess,) = winner.call{value: winnerAmount}("");
            require(winnerSuccess, "Winner ETH transfer failed");
            
            ethDep.claimed = true;
        } else {
            USDCDeposit storage usdcDep = usdcDeposits[gameId];
            uint256 platformFee = (usdcDep.amount * platformFeePercent) / BASIS_POINTS;
            uint256 winnerAmount = usdcDep.amount - platformFee;
            
            // Transfer fee to platform
            require(IERC20(usdcToken).transfer(platformFeeReceiver, platformFee), "Platform USDC fee transfer failed");
            
            // Transfer remaining to winner
            require(IERC20(usdcToken).transfer(winner, winnerAmount), "Winner USDC transfer failed");
            
            usdcDep.claimed = true;
        }
        
        emit GameCompleted(gameId, winner);
    }
    
    /**
     * @notice Reclaim NFT if no crypto deposited within timeout
     */
    function reclaimNFT(bytes32 gameId) external nonReentrant {
        NFTDeposit storage nftDep = nftDeposits[gameId];
        require(nftDep.depositor == msg.sender, "Not your NFT");
        require(!nftDep.claimed, "Already claimed");
        require(gameResults[gameId].completed == false, "Game completed");
        
        // Check timeout or no crypto deposited
        bool hasNoCrypto = ethDeposits[gameId].depositor == address(0) && usdcDeposits[gameId].depositor == address(0);
        bool hasTimedOut = block.timestamp > nftDep.depositTime + depositTimeout;
        
        require(hasNoCrypto || hasTimedOut, "Cannot reclaim yet");
        
        // Transfer NFT back
        IERC721(nftDep.nftContract).transferFrom(address(this), msg.sender, nftDep.tokenId);
        nftDep.claimed = true;
        
        emit AssetsReclaimed(gameId, msg.sender, "NFT");
    }
    
    /**
     * @notice Reclaim crypto if no NFT deposited within timeout
     */
    function reclaimCrypto(bytes32 gameId) external nonReentrant {
        require(gameResults[gameId].completed == false, "Game completed");
        
        bool hasNoNFT = nftDeposits[gameId].depositor == address(0);
        
        if (ethDeposits[gameId].depositor == msg.sender) {
            ETHDeposit storage ethDep = ethDeposits[gameId];
            require(!ethDep.claimed, "Already claimed");
            
            bool hasTimedOut = block.timestamp > ethDep.depositTime + depositTimeout;
            require(hasNoNFT || hasTimedOut, "Cannot reclaim yet");
            
            (bool success,) = msg.sender.call{value: ethDep.amount}("");
            require(success, "ETH refund failed");
            ethDep.claimed = true;
            
            emit AssetsReclaimed(gameId, msg.sender, "ETH");
            
        } else if (usdcDeposits[gameId].depositor == msg.sender) {
            USDCDeposit storage usdcDep = usdcDeposits[gameId];
            require(!usdcDep.claimed, "Already claimed");
            
            bool hasTimedOut = block.timestamp > usdcDep.depositTime + depositTimeout;
            require(hasNoNFT || hasTimedOut, "Cannot reclaim yet");
            
            require(IERC20(usdcToken).transfer(msg.sender, usdcDep.amount), "USDC refund failed");
            usdcDep.claimed = true;
            
            emit AssetsReclaimed(gameId, msg.sender, "USDC");
        } else {
            revert("Not your crypto deposit");
        }
    }
    
    // Admin functions
    function setPlatformFeePercent(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= 1000, "Fee too high"); // Max 10%
        platformFeePercent = _feePercent;
    }
    
    function setPlatformFeeReceiver(address _receiver) external onlyOwner {
        platformFeeReceiver = _receiver;
    }
    
    function setDepositTimeout(uint256 _timeout) external onlyOwner {
        depositTimeout = _timeout;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Emergency withdraw NFT (admin only)
     */
    function emergencyWithdrawNFT(bytes32 gameId, address recipient) external onlyOwner {
        NFTDeposit storage nftDep = nftDeposits[gameId];
        require(nftDep.depositor != address(0), "No NFT deposited");
        require(!nftDep.claimed, "Already claimed");
        
        // Transfer NFT to recipient
        IERC721(nftDep.nftContract).transferFrom(address(this), recipient, nftDep.tokenId);
        nftDep.claimed = true;
        
        emit AssetsReclaimed(gameId, recipient, "NFT_EMERGENCY");
    }
    
    /**
     * @notice Emergency withdraw ETH (admin only)
     */
    function emergencyWithdrawETH(bytes32 gameId, address recipient) external onlyOwner {
        ETHDeposit storage ethDep = ethDeposits[gameId];
        require(ethDep.depositor != address(0), "No ETH deposited");
        require(!ethDep.claimed, "Already claimed");
        
        // Transfer ETH to recipient
        (bool success,) = recipient.call{value: ethDep.amount}("");
        require(success, "ETH transfer failed");
        ethDep.claimed = true;
        
        emit AssetsReclaimed(gameId, recipient, "ETH_EMERGENCY");
    }
    
    /**
     * @notice Emergency withdraw USDC (admin only)
     */
    function emergencyWithdrawUSDC(bytes32 gameId, address recipient) external onlyOwner {
        USDCDeposit storage usdcDep = usdcDeposits[gameId];
        require(usdcDep.depositor != address(0), "No USDC deposited");
        require(!usdcDep.claimed, "Already claimed");
        
        // Transfer USDC to recipient
        require(IERC20(usdcToken).transfer(recipient, usdcDep.amount), "USDC transfer failed");
        usdcDep.claimed = true;
        
        emit AssetsReclaimed(gameId, recipient, "USDC_EMERGENCY");
    }
    
    /**
     * @notice Batch emergency withdraw NFTs (admin only)
     */
    function adminBatchWithdrawNFTs(
        bytes32[] calldata gameIds,
        address[] calldata recipients
    ) external onlyOwner {
        require(gameIds.length == recipients.length, "Array length mismatch");
        
        for (uint i = 0; i < gameIds.length; i++) {
            NFTDeposit storage nftDep = nftDeposits[gameIds[i]];
            if (nftDep.depositor != address(0) && !nftDep.claimed) {
                IERC721(nftDep.nftContract).transferFrom(address(this), recipients[i], nftDep.tokenId);
                nftDep.claimed = true;
                emit AssetsReclaimed(gameIds[i], recipients[i], "NFT_BATCH");
            }
        }
    }
} 