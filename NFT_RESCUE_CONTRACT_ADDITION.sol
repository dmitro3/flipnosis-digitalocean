// EMERGENCY NFT RESCUE FUNCTION
// Add this function to your NFTFlipGame contract to rescue NFTs that were sent directly to the contract

/**
 * @notice Emergency rescue any NFT from contract (admin only)
 * @dev This can withdraw NFTs that were sent directly to contract, not just game deposits
 */
function emergencyRescueNFT(
    address nftContract, 
    uint256 tokenId, 
    address recipient
) external onlyOwner {
    require(recipient != address(0), "Invalid recipient");
    
    // Direct transfer - doesn't require the NFT to be part of a game
    IERC721(nftContract).transferFrom(address(this), recipient, tokenId);
    
    emit AssetsReclaimed(keccak256("RESCUE"), recipient, "NFT_RESCUE");
}

/**
 * @notice Batch emergency rescue NFTs from contract (admin only)
 * @dev This can withdraw multiple NFTs that were sent directly to contract
 */
function emergencyBatchRescueNFTs(
    address[] calldata nftContracts,
    uint256[] calldata tokenIds,
    address[] calldata recipients
) external onlyOwner {
    require(nftContracts.length == tokenIds.length, "Array length mismatch");
    require(nftContracts.length == recipients.length, "Array length mismatch");
    
    for (uint i = 0; i < nftContracts.length; i++) {
        require(recipients[i] != address(0), "Invalid recipient");
        
        // Direct transfer - doesn't require the NFT to be part of a game
        IERC721(nftContracts[i]).transferFrom(address(this), recipients[i], tokenIds[i]);
        
        emit AssetsReclaimed(keccak256("RESCUE"), recipients[i], "NFT_RESCUE");
    }
}
