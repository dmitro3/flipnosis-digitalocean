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
    
    // Battle Royale structures
    struct BattleRoyaleGame {
        address creator;
        address nftContract;
        uint256 tokenId;
        uint256 entryFee;
        uint256 serviceFee;
        uint8 maxPlayers;
        uint8 currentPlayers;
        address winner;
        bool completed;
        bool creatorPaid;
        bool nftClaimed;
        uint256 totalPool; // Total entry fees collected
        uint256 createdAt;
        bool isUnder20; // Creator's listed USD price < $20
        uint256 minUnder20Wei; // Minimum platform fee in wei when isUnder20
    }
    
    // Battle Royale mappings
    mapping(bytes32 => BattleRoyaleGame) public battleRoyaleGames;
    mapping(bytes32 => mapping(address => bool)) public battleRoyaleEntries;
    mapping(bytes32 => mapping(address => uint256)) public battleRoyaleEntryAmounts;
    
    // Configuration
    uint256 public depositTimeout = 2 minutes;
    uint256 public platformFeePercent = 500; // 5%
    uint256 public constant BASIS_POINTS = 10000;
    address public platformFeeReceiver;
    address public usdcToken;
    
    // Events
    event NFTDeposited(bytes32 indexed gameId, address indexed depositor, address nftContract, uint256 tokenId);
    event ETHDeposited(bytes32 indexed gameId, address indexed depositor, uint256 amount);
    event USDCDeposited(bytes32 indexed gameId, address indexed depositor, uint256 amount);
    event GameReady(bytes32 indexed gameId, address nftDepositor, address cryptoDepositor);
    event GameCompleted(bytes32 indexed gameId, address indexed winner);
    event WinningsWithdrawn(bytes32 indexed gameId, address indexed winner);
    event AssetsReclaimed(bytes32 indexed gameId, address indexed reclaimer, string assetType);
    
    // Battle Royale Events
    event BattleRoyaleCreated(bytes32 indexed gameId, address indexed creator, uint256 entryFee, uint256 serviceFee);
    event BattleRoyaleJoined(bytes32 indexed gameId, address indexed player, uint256 amount);
    event BattleRoyaleStarted(bytes32 indexed gameId, uint8 playerCount);
    event BattleRoyaleCompleted(bytes32 indexed gameId, address indexed winner);
    event BattleRoyaleCreatorPaid(bytes32 indexed gameId, address indexed creator, uint256 amount);
    event BattleRoyaleNFTClaimed(bytes32 indexed gameId, address indexed winner);
    
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
     * @notice Complete game and declare winner (only owner/backend) - NO AUTO TRANSFER
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
        
        // Mark game as completed - NO TRANSFERS HAPPEN HERE
        gameResults[gameId] = GameResult({
            winner: winner,
            completed: true,
            completionTime: block.timestamp
        });
        
        emit GameCompleted(gameId, winner);
    }

    /**
     * @notice Winner withdraws their winnings (NFT + crypto)
     */
    function withdrawWinnings(bytes32 gameId) external nonReentrant {
        require(gameResults[gameId].completed == true, "Game not completed");
        require(gameResults[gameId].winner == msg.sender, "Only winner can withdraw");
        
        NFTDeposit storage nftDep = nftDeposits[gameId];
        require(!nftDep.claimed, "Winnings already claimed");
        
        // Transfer NFT to winner
        IERC721(nftDep.nftContract).transferFrom(address(this), msg.sender, nftDep.tokenId);
        nftDep.claimed = true;
        
        // Transfer crypto to winner (minus platform fee)
        if (ethDeposits[gameId].depositor != address(0)) {
            ETHDeposit storage ethDep = ethDeposits[gameId];
            require(!ethDep.claimed, "ETH already claimed");
            
            uint256 platformFee = (ethDep.amount * platformFeePercent) / BASIS_POINTS;
            uint256 winnerAmount = ethDep.amount - platformFee;
            
            // Transfer fee to platform
            (bool feeSuccess,) = platformFeeReceiver.call{value: platformFee}("");
            require(feeSuccess, "Platform fee transfer failed");
            
            // Transfer remaining to winner
            (bool winnerSuccess,) = msg.sender.call{value: winnerAmount}("");
            require(winnerSuccess, "Winner ETH transfer failed");
            
            ethDep.claimed = true;
        } else {
            USDCDeposit storage usdcDep = usdcDeposits[gameId];
            require(!usdcDep.claimed, "USDC already claimed");
            
            uint256 platformFee = (usdcDep.amount * platformFeePercent) / BASIS_POINTS;
            uint256 winnerAmount = usdcDep.amount - platformFee;
            
            // Transfer fee to platform
            require(IERC20(usdcToken).transfer(platformFeeReceiver, platformFee), "Platform USDC fee transfer failed");
            
            // Transfer remaining to winner
            require(IERC20(usdcToken).transfer(msg.sender, winnerAmount), "Winner USDC transfer failed");
            
            usdcDep.claimed = true;
        }
        
        emit WinningsWithdrawn(gameId, msg.sender);
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
    
    /**
     * @notice Direct NFT transfer - transfer any NFT owned by this contract (admin only)
     * This bypasses the game system entirely and works for any NFT the contract owns
     */
    function directTransferNFT(
        address nftContract,
        uint256 tokenId,
        address recipient
    ) external onlyOwner {
        // Transfer NFT directly to recipient
        IERC721(nftContract).transferFrom(address(this), recipient, tokenId);
        
        emit AssetsReclaimed(bytes32(0), recipient, "NFT_DIRECT");
    }
    
    /**
     * @notice Batch direct NFT transfer - transfer multiple NFTs owned by this contract (admin only)
     */
    function directBatchTransferNFTs(
        address[] calldata nftContracts,
        uint256[] calldata tokenIds,
        address[] calldata recipients
    ) external onlyOwner {
        require(nftContracts.length == tokenIds.length, "Contracts and tokenIds length mismatch");
        require(nftContracts.length == recipients.length, "Contracts and recipients length mismatch");
        
        for (uint i = 0; i < nftContracts.length; i++) {
            IERC721(nftContracts[i]).transferFrom(address(this), recipients[i], tokenIds[i]);
            emit AssetsReclaimed(bytes32(0), recipients[i], "NFT_DIRECT_BATCH");
        }
    }
    
    // ===== BATTLE ROYALE FUNCTIONS =====
    
    /**
     * @notice Create a Battle Royale game
     * @param creatorParticipates If true, creator is automatically added as a participant (free entry)
     */
    function createBattleRoyale(
        bytes32 gameId,
        address nftContract,
        uint256 tokenId,
        uint256 entryFee,
        uint256 serviceFee,
        bool isUnder20,
        uint256 minUnder20Wei,
        bool creatorParticipates
    ) external nonReentrant whenNotPaused {
        require(battleRoyaleGames[gameId].creator == address(0), "Game already exists");
        require(entryFee > 0, "Entry fee must be greater than 0");
        
        // Transfer NFT to contract
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        
        uint8 initialPlayers = 0;
        
        // Auto-add creator as participant if they want to participate (free entry)
        if (creatorParticipates) {
            battleRoyaleEntries[gameId][msg.sender] = true;
            battleRoyaleEntryAmounts[gameId][msg.sender] = 0; // Creator plays for free
            initialPlayers = 1;
        }
        
        // Create game
        battleRoyaleGames[gameId] = BattleRoyaleGame({
            creator: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            entryFee: entryFee,
            serviceFee: serviceFee,
            maxPlayers: 4,
            currentPlayers: initialPlayers,
            winner: address(0),
            completed: false,
            creatorPaid: false,
            nftClaimed: false,
            totalPool: 0,
            createdAt: block.timestamp,
            isUnder20: isUnder20,
            minUnder20Wei: minUnder20Wei
        });
        
        emit BattleRoyaleCreated(gameId, msg.sender, entryFee, serviceFee);
        
        // Emit join event for creator if they participate
        if (creatorParticipates) {
            emit BattleRoyaleJoined(gameId, msg.sender, 0);
        }
    }
    
    /**
     * @notice Join a Battle Royale game
     */
    function joinBattleRoyale(bytes32 gameId) external payable nonReentrant whenNotPaused {
        BattleRoyaleGame storage game = battleRoyaleGames[gameId];
        require(game.creator != address(0), "Game does not exist");
        require(!game.completed, "Game already completed");
        require(game.currentPlayers < game.maxPlayers, "Game is full");
        require(!battleRoyaleEntries[gameId][msg.sender], "Already joined this game");
        
        uint256 totalRequired = game.entryFee + game.serviceFee;
        require(msg.value >= totalRequired, "Insufficient payment");
        
        // Mark player as joined
        battleRoyaleEntries[gameId][msg.sender] = true;
        battleRoyaleEntryAmounts[gameId][msg.sender] = msg.value;
        game.currentPlayers++;
        game.totalPool += game.entryFee; // Only entry fee goes to pool, service fee goes to platform
        
        // Immediately forward the per-join service fee to the platform
        if (game.serviceFee > 0) {
            (bool feeSuccess,) = platformFeeReceiver.call{value: game.serviceFee}("");
            require(feeSuccess, "Service fee transfer failed");
        }
        
        emit BattleRoyaleJoined(gameId, msg.sender, msg.value);
        
        // Check if game is ready to start
        if (game.currentPlayers == game.maxPlayers) {
            emit BattleRoyaleStarted(gameId, game.currentPlayers);
        }
        
        // Refund excess payment
        if (msg.value > totalRequired) {
            (bool success,) = msg.sender.call{value: msg.value - totalRequired}("");
            require(success, "Refund failed");
        }
    }
    
    /**
     * @notice Complete Battle Royale and declare winner (only owner/backend)
     */
    function completeBattleRoyale(bytes32 gameId, address winner) external onlyOwner nonReentrant {
        BattleRoyaleGame storage game = battleRoyaleGames[gameId];
        require(game.creator != address(0), "Game does not exist");
        require(!game.completed, "Game already completed");
        require(game.currentPlayers == game.maxPlayers, "Game not full yet");
        // Allow creator as winner even if not in battleRoyaleEntries (they were auto-added during creation)
        require(battleRoyaleEntries[gameId][winner] || winner == game.creator, "Winner must be a participant");
        
        game.winner = winner;
        game.completed = true;
        
        emit BattleRoyaleCompleted(gameId, winner);
    }
    
    /**
     * @notice Complete Battle Royale early with fewer players (only owner/backend)
     * Allows completion when game has 2+ players but less than max
     */
    function completeBattleRoyaleEarly(bytes32 gameId, address winner) external onlyOwner nonReentrant {
        BattleRoyaleGame storage game = battleRoyaleGames[gameId];
        require(game.creator != address(0), "Game does not exist");
        require(!game.completed, "Game already completed");
        require(game.currentPlayers >= 2, "Need at least 2 players");
        require(game.currentPlayers < game.maxPlayers, "Use completeBattleRoyale for full games");
        // Allow creator as winner even if not in battleRoyaleEntries (they were auto-added during creation)
        require(battleRoyaleEntries[gameId][winner] || winner == game.creator, "Winner must be a participant");
        
        game.winner = winner;
        game.completed = true;
        
        emit BattleRoyaleCompleted(gameId, winner);
    }
    
    /**
     * @notice Creator starts Battle Royale game early (creator only)
     * Allows game to start with 2+ players but less than max
     * Only the creator can trigger this - gives them control to start when ready
     */
    function startBattleRoyaleEarly(bytes32 gameId) external nonReentrant whenNotPaused {
        BattleRoyaleGame storage game = battleRoyaleGames[gameId];
        require(game.creator != address(0), "Game does not exist");
        require(game.creator == msg.sender, "Only creator can start early");
        require(!game.completed, "Game already completed");
        require(game.currentPlayers >= 2, "Need at least 2 players to start");
        require(game.currentPlayers < game.maxPlayers, "Game is full - no need to start early");
        
        // Emit event to signal game can start early
        emit BattleRoyaleStarted(gameId, game.currentPlayers);
    }
    
    /**
     * @notice Creator withdraws their earnings (entry fees minus platform fee)
     */
    function withdrawCreatorFunds(bytes32 gameId) external nonReentrant {
        BattleRoyaleGame storage game = battleRoyaleGames[gameId];
        require(game.creator == msg.sender, "Not the creator");
        require(game.completed, "Game not completed");
        require(!game.creatorPaid, "Already withdrawn");
        
        uint256 platformFee = (game.totalPool * platformFeePercent) / BASIS_POINTS;
        if (game.isUnder20 && game.minUnder20Wei > platformFee) {
            platformFee = game.minUnder20Wei;
        }
        uint256 creatorAmount = game.totalPool - platformFee;
        
        game.creatorPaid = true;
        
        // Transfer platform fee
        (bool feeSuccess,) = platformFeeReceiver.call{value: platformFee}("");
        require(feeSuccess, "Platform fee transfer failed");
        
        // Transfer creator amount
        (bool creatorSuccess,) = msg.sender.call{value: creatorAmount}("");
        require(creatorSuccess, "Creator transfer failed");
        
        emit BattleRoyaleCreatorPaid(gameId, msg.sender, creatorAmount);
    }
    
    /**
     * @notice Winner claims the NFT prize
     */
    function withdrawWinnerNFT(bytes32 gameId) external nonReentrant {
        BattleRoyaleGame storage game = battleRoyaleGames[gameId];
        require(game.winner == msg.sender, "Not the winner");
        require(game.completed, "Game not completed");
        require(!game.nftClaimed, "NFT already claimed");
        
        game.nftClaimed = true;
        
        // Transfer NFT to winner
        IERC721(game.nftContract).transferFrom(address(this), msg.sender, game.tokenId);
        
        emit BattleRoyaleNFTClaimed(gameId, msg.sender);
    }
    
    /**
     * @notice Get Battle Royale game info
     */
    function getBattleRoyaleGame(bytes32 gameId) external view returns (BattleRoyaleGame memory) {
        return battleRoyaleGames[gameId];
    }
    
    /**
     * @notice Check if player has joined a Battle Royale game
     */
    function hasBattleRoyaleEntry(bytes32 gameId, address player) external view returns (bool) {
        return battleRoyaleEntries[gameId][player];
    }
    
    /**
     * @notice Get player's entry amount for Battle Royale game
     */
    function getBattleRoyaleEntryAmount(bytes32 gameId, address player) external view returns (uint256) {
        return battleRoyaleEntryAmounts[gameId][player];
    }
    
    /**
     * @notice Cancel Battle Royale game (creator only, before game starts)
     * Players must withdraw their funds themselves using withdrawBattleRoyaleEntry()
     */
    function cancelBattleRoyale(bytes32 gameId) external nonReentrant {
        BattleRoyaleGame storage game = battleRoyaleGames[gameId];
        require(game.creator == msg.sender, "Not the creator");
        require(!game.completed, "Game already completed");
        require(!game.nftClaimed, "NFT already claimed");
        require(game.currentPlayers < game.maxPlayers, "Game is full - cannot cancel");
        
        // Mark game as completed/cancelled
        game.completed = true;
        game.nftClaimed = true;
        
        // Return NFT to creator immediately (no waiting period)
        IERC721(game.nftContract).transferFrom(address(this), msg.sender, game.tokenId);
        
        emit BattleRoyaleCompleted(gameId, address(0)); // address(0) = cancelled
        emit AssetsReclaimed(gameId, msg.sender, "BR_NFT_CANCELLED");
    }
    
    /**
     * @notice Reclaim NFT if game never filled (no waiting period)
     */
    function reclaimBattleRoyaleNFT(bytes32 gameId) external nonReentrant {
        BattleRoyaleGame storage game = battleRoyaleGames[gameId];
        require(game.creator == msg.sender, "Not the creator");
        require(!game.completed, "Game completed");
        require(!game.nftClaimed, "NFT already claimed");
        require(game.currentPlayers < game.maxPlayers, "Game is full");
        
        // NO WAITING PERIOD - can reclaim immediately
        game.nftClaimed = true;
        
        // Return NFT to creator
        IERC721(game.nftContract).transferFrom(address(this), msg.sender, game.tokenId);
        
        emit AssetsReclaimed(gameId, msg.sender, "BR_NFT");
    }
    
    /**
     * @notice Player withdraws their entry fee
     * Can be called to:
     * - Leave game voluntarily before it starts
     * - Get refund after creator cancels
     * - Get refund if game never fills and creator reclaims NFT
     */
    function withdrawBattleRoyaleEntry(bytes32 gameId) external nonReentrant {
        BattleRoyaleGame storage game = battleRoyaleGames[gameId];
        require(battleRoyaleEntries[gameId][msg.sender], "Not a participant");
        
        uint256 entryAmount = battleRoyaleEntryAmounts[gameId][msg.sender];
        require(entryAmount > 0, "Already withdrawn");
        
        // Can only withdraw if:
        // 1. Game hasn't filled yet (voluntary leave), OR
        // 2. Game was cancelled (NFT reclaimed)
        bool gameNotStarted = game.currentPlayers < game.maxPlayers;
        bool gameCancelled = game.nftClaimed; // NFT reclaimed = game cancelled
        require(gameNotStarted || gameCancelled, "Game is in progress");
        
        // Calculate refund amount
        // NOTE: Service fee was already sent to platform (line 537-539 in joinBattleRoyale)
        // So we only refund the entry fee portion
        uint256 refundAmount = game.entryFee;
        
        // Mark as withdrawn
        battleRoyaleEntryAmounts[gameId][msg.sender] = 0;
        battleRoyaleEntries[gameId][msg.sender] = false;
        game.currentPlayers--;
        game.totalPool -= game.entryFee;
        
        // Refund entry fee to player
        (bool success,) = msg.sender.call{value: refundAmount}("");
        require(success, "Refund failed");
        
        emit AssetsReclaimed(gameId, msg.sender, "BR_ENTRY_FEE");
    }
    
    /**
     * @notice Check if player can withdraw their entry (for UI buttons)
     */
    function canWithdrawEntry(bytes32 gameId, address player) external view returns (bool) {
        BattleRoyaleGame storage game = battleRoyaleGames[gameId];
        
        // Must be a participant with funds
        if (!battleRoyaleEntries[gameId][player]) return false;
        if (battleRoyaleEntryAmounts[gameId][player] == 0) return false;
        
        // Can withdraw if game not started OR if cancelled
        bool gameNotStarted = game.currentPlayers < game.maxPlayers;
        bool gameCancelled = game.nftClaimed;
        
        return gameNotStarted || gameCancelled;
    }
} 