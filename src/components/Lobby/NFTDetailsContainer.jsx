import React, { useState } from 'react'
import styled from '@emotion/styled'
import { useWallet } from '../../contexts/WalletContext'
import { useToast } from '../../contexts/ToastContext'

const CombinedContainer = styled.div`
  background: rgba(0, 0, 40, 0.95);
  padding: 1.5rem;
  border-radius: 1rem;
  border: 2px solid #FF1493;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 30px rgba(255, 20, 147, 0.3), inset 0 0 20px rgba(255, 20, 147, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 20, 147, 0.1) 50%, transparent 70%);
    animation: shimmer 3s ease-in-out infinite;
    pointer-events: none;
  }
  
  @keyframes shimmer {
    0%, 100% { transform: translateX(-100%); }
    50% { transform: translateX(100%); }
  }
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 20, 147, 0.3);
`

const Title = styled.h3`
  margin: 0;
  color: #FF1493;
  font-size: 1.2rem;
  font-weight: bold;
`

const StatusBadge = styled.div`
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: bold;
  background: ${props => {
    switch (props.status) {
      case 'waiting_challenger': return 'rgba(255, 215, 0, 0.2)'
      case 'waiting_challenger_deposit': return 'rgba(255, 20, 147, 0.2)'
      case 'active': return 'rgba(0, 255, 65, 0.2)'
      case 'completed': return 'rgba(0, 191, 255, 0.2)'
      default: return 'rgba(255, 255, 255, 0.1)'
    }
  }};
  border: 1px solid ${props => {
    switch (props.status) {
      case 'waiting_challenger': return 'rgba(255, 215, 0, 0.4)'
      case 'waiting_challenger_deposit': return 'rgba(255, 20, 147, 0.4)'
      case 'active': return 'rgba(0, 255, 65, 0.4)'
      case 'completed': return 'rgba(0, 191, 255, 0.4)'
      default: return 'rgba(255, 255, 255, 0.2)'
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'waiting_challenger': return '#FFD700'
      case 'waiting_challenger_deposit': return '#FF1493'
      case 'active': return '#00FF41'
      case 'completed': return '#00BFFF'
      default: return '#fff'
    }
  }};
`

const VerificationBadge = styled.div`
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: bold;
  background: ${props => props.verified ? 'rgba(0, 255, 65, 0.2)' : 'rgba(255, 149, 0, 0.2)'};
  border: 1px solid ${props => props.verified ? 'rgba(0, 255, 65, 0.4)' : 'rgba(255, 149, 0, 0.4)'};
  color: ${props => props.verified ? '#00FF41' : '#FF9500'};
`

const NFTImage = styled.div`
  width: 180px;
  height: 180px;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 20, 147, 0.3);
  overflow: hidden;
  flex-shrink: 0;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const NFTHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
`

const NFTInfoSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const NFTImageSection = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`

const VerificationIcon = styled.div`
  position: absolute;
  top: -5px;
  right: -5px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${props => props.verified ? 'rgba(0, 255, 65, 0.2)' : 'rgba(255, 149, 0, 0.2)'};
  border: 1px solid ${props => props.verified ? 'rgba(0, 255, 65, 0.4)' : 'rgba(255, 149, 0, 0.4)'};
  color: ${props => props.verified ? '#00FF41' : '#FF9500'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: ${props => props.verified ? 'default' : 'help'};
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
  }
`

const Tooltip = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid rgba(255, 149, 0, 0.4);
  border-radius: 0.5rem;
  padding: 0.75rem;
  width: 250px;
  z-index: 1000;
  opacity: ${props => props.show ? 1 : 0};
  visibility: ${props => props.show ? 'visible' : 'hidden'};
  transition: all 0.2s ease;
  transform: ${props => props.show ? 'translateY(0)' : 'translateY(-10px)'};
  
  &::before {
    content: '';
    position: absolute;
    top: -5px;
    right: 10px;
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-bottom: 5px solid rgba(255, 149, 0, 0.4);
  }
`

const TooltipTitle = styled.div`
  color: #FF9500;
  font-size: 0.9rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
`

const TooltipText = styled.div`
  color: #fff;
  font-size: 0.8rem;
  line-height: 1.3;
`

const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  width: 80%;
`

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.75rem;
  transition: all 0.2s ease;
  text-decoration: none;
  justify-content: center;
  width: 100%;
  
  &.twitter {
    background: #000000;
    color: #ffffff;
    border: 1px solid #333333;
    
    &:hover {
      background: #333333;
    }
  }
  
  &.telegram {
    background: #0088cc;
    color: white;
    
    &:hover {
      background: #0077b3;
    }
  }
  
  &.opensea {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
  
  &.explorer {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const Item = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`

const Label = styled.span`
  color: #00BFFF;
  font-weight: 500;
`

const Value = styled.span`
  color: #fff;
  font-weight: bold;
  word-break: break-all;
`

const RoundContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1rem 0;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 20, 147, 0.3);
`

const PlayerRounds = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const PlayerRound = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const PlayerName = styled.span`
  color: #00BFFF;
  font-weight: 500;
  min-width: 80px;
`

const RoundDots = styled.div`
  display: flex;
  gap: 0.25rem;
`

const RoundDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.won ? '#00FF41' : props => props.played ? '#FF1493' : 'rgba(255, 255, 255, 0.2)'};
  border: 1px solid ${props => props.won ? '#00FF41' : props => props.played ? '#FF1493' : 'rgba(255, 255, 255, 0.3)'};
`

const ShareButtonsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  justify-content: center;
`

const ShareButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  
  &.twitter {
    background: #1DA1F2;
    color: white;
    
    &:hover {
      background: #0d8bd9;
    }
  }
  
  &.telegram {
    background: #0088cc;
    color: white;
    
    &:hover {
      background: #0077b3;
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const VerificationElement = styled.div`
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: ${props => props.verified ? 'rgba(0, 255, 65, 0.2)' : 'rgba(255, 149, 0, 0.2)'};
  border: 1px solid ${props => props.verified ? 'rgba(0, 255, 65, 0.4)' : 'rgba(255, 149, 0, 0.4)'};
  border-radius: 0.5rem;
  color: ${props => props.verified ? '#00FF41' : '#FF9500'};
  font-size: 0.7rem;
  font-weight: bold;
  cursor: ${props => props.verified ? 'default' : 'help'};
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`

const GameStatusAndNFTContainer = ({ gameData, isCreator, currentTurn, nftData, currentChain }) => {
  const { address } = useWallet()
  const { showSuccess, showError } = useToast()
  const [showTooltip, setShowTooltip] = useState(false)
  
  const handleCopyContract = async () => {
    const contractAddress = getNFTContract()
    if (contractAddress && contractAddress !== 'N/A') {
      try {
        await navigator.clipboard.writeText(contractAddress)
        showSuccess('Contract address copied to clipboard!')
      } catch (error) {
        console.error('Failed to copy contract address:', error)
        showError('Failed to copy contract address')
      }
    }
  }
  
  // Helper functions for chain URLs
  const getExplorerUrl = (chain) => {
    if (!chain) return 'https://etherscan.io' // Default to Ethereum explorer
    
    const explorers = {
      ethereum: 'https://etherscan.io',
      polygon: 'https://polygonscan.com',
      base: 'https://basescan.org',
      arbitrum: 'https://arbiscan.io',
      optimism: 'https://optimistic.etherscan.io',
      // Add more chains as needed
    }
    return explorers[chain.toLowerCase()] || 'https://etherscan.io'
  }

  const getMarketplaceUrl = (chain) => {
    if (!chain) return 'https://opensea.io/assets/ethereum' // Default to Ethereum marketplace
    
    const marketplaces = {
      ethereum: 'https://opensea.io/assets/ethereum',
      polygon: 'https://opensea.io/assets/matic',
      base: 'https://opensea.io/assets/base',
      arbitrum: 'https://opensea.io/assets/arbitrum',
      optimism: 'https://opensea.io/assets/optimism',
      // Add more chains as needed
    }
    return marketplaces[chain.toLowerCase()] || 'https://opensea.io/assets/ethereum'
  }
  const getStatusText = (status) => {
    switch (status) {
      case 'waiting_challenger': return 'Waiting for Challenger'
      case 'waiting_challenger_deposit': return 'Waiting for Deposit'
      case 'active': return 'Game Active'
      case 'completed': return 'Game Completed'
      default: return ''
    }
  }

  const getCurrentPlayer = () => {
    if (!gameData) return 'Unknown'
            if (currentTurn === gameData.creator) {
      return isCreator ? 'You (Creator)' : 'Creator'
    } else {
      return isCreator ? 'Challenger' : 'You (Challenger)'
    }
  }

  const getNFTImage = () => {
    if (nftData?.image) return nftData.image
    if (gameData?.nft_image) return gameData.nft_image
    return '/placeholder-nft.svg'
  }

  const getNFTName = () => {
    if (nftData?.name) return nftData.name
    if (gameData?.nft_name) return gameData.nft_name
    return 'Unknown NFT'
  }

  const getNFTContract = () => {
    if (nftData?.contract_address) return nftData.contract_address
    if (gameData?.nft_contract_address) return gameData.nft_contract_address
    return 'N/A'
  }

  const getNFTTokenId = () => {
    if (nftData?.token_id) return nftData.token_id
    if (gameData?.nft_token_id) return gameData.nft_token_id
    return 'N/A'
  }

  const isNFTVerified = () => {
    return gameData?.nft_verified === true || nftData?.verified === true
  }

  // Calculate round wins for best of 5
  const getRoundWins = () => {
    if (!gameData?.rounds) return { creator: 0, challenger: 0 }
    
    const creatorWins = gameData.rounds.filter(round => 
      round.winner === gameData.creator
    ).length
    
    const challengerWins = gameData.rounds.filter(round => 
              round.winner && round.winner !== gameData.creator
    ).length
    
    return { creator: creatorWins, challenger: challengerWins }
  }

  const roundWins = getRoundWins()
  const totalRounds = gameData?.rounds?.length || 0
  const isGameActive = gameData?.status === 'active'

  const handleShare = async (platform) => {
    if (!address || !gameData?.id) {
      showError('Please connect your wallet to share')
      return
    }

    try {
      // Create share message
      const nftName = getNFTName()
      const gameUrl = `${window.location.origin}/game/${gameData.id}`
      const message = platform === 'twitter' 
        ? `🎮 Check out this epic NFT flip game on Flipnosis! ${nftName} is up for grabs! Join the action: ${gameUrl} #Flipnosis #NFTGaming #Web3`
        : `🎮 Check out this epic NFT flip game on Flipnosis! ${nftName} is up for grabs! Join the action: ${gameUrl}`

      // Open share URL
      const shareUrls = {
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(gameUrl)}&text=${encodeURIComponent(message)}`
      }

      window.open(shareUrls[platform], '_blank', 'width=600,height=400')

      // Award XP for sharing
      const response = await fetch(`/api/games/${gameData.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: address.toLowerCase(),
          platform: platform
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.xpGained > 0) {
          showSuccess(result.message)
        } else if (result.alreadyAwarded) {
          showSuccess('Game already shared on this platform!')
        }
      } else {
        console.error('Failed to record share')
      }
    } catch (error) {
      console.error('Error sharing game:', error)
      showError('Failed to share game')
    }
  }

  return (
    <CombinedContainer>
      <Header>
        <Title>💎 NFT Details</Title>
      </Header>
      
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.5rem', 
        overflow: 'hidden'
      }}>
        {/* Show round containers when game is active, otherwise show NFT details */}
        {isGameActive ? (
          <RoundContainer>
            <PlayerRounds>
              <PlayerRound>
                <PlayerName>Creator:</PlayerName>
                <RoundDots>
                  {[1, 2, 3, 4, 5].map((round) => (
                    <RoundDot 
                      key={round}
                      won={round <= roundWins.creator}
                      played={round <= totalRounds}
                    />
                  ))}
                </RoundDots>
                <span style={{ color: '#00FF41', marginLeft: '0.5rem' }}>
                  {roundWins.creator} wins
                </span>
              </PlayerRound>
              <PlayerRound>
                <PlayerName>Challenger:</PlayerName>
                <RoundDots>
                  {[1, 2, 3, 4, 5].map((round) => (
                    <RoundDot 
                      key={round}
                      won={round <= roundWins.challenger}
                      played={round <= totalRounds}
                    />
                  ))}
                </RoundDots>
                <span style={{ color: '#00FF41', marginLeft: '0.5rem' }}>
                  {roundWins.challenger} wins
                </span>
              </PlayerRound>
            </PlayerRounds>
          </RoundContainer>
        ) : (
          <>
            {/* New NFT Header with Image and Buttons */}
            <NFTHeader>
              <NFTInfoSection>
                {/* Action Buttons */}
                <ActionButtons>
                  <ActionButton 
                    className="twitter"
                    onClick={() => handleShare('twitter')}
                    disabled={!address}
                  >
                    Share on X
                  </ActionButton>
                  <ActionButton 
                    className="telegram"
                    onClick={() => handleShare('telegram')}
                    disabled={!address}
                  >
                    Share on TG
                  </ActionButton>
                  <a
                    href={getNFTContract() !== 'N/A' && getNFTTokenId() !== 'N/A' ? 
                      `${getMarketplaceUrl(currentChain)}/${getNFTContract()}/${getNFTTokenId()}` :
                      '#'
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (getNFTContract() === 'N/A' || getNFTTokenId() === 'N/A') {
                        e.preventDefault()
                        showError('NFT contract details not available')
                      }
                    }}
                    style={{ textDecoration: 'none' }}
                  >
                    <ActionButton className="opensea">
                      <img 
                        src="/images/opensea.png" 
                        alt="OpenSea" 
                        style={{ 
                          width: '16px', 
                          height: '16px',
                          objectFit: 'contain'
                        }} 
                      />
                      OpenSea
                    </ActionButton>
                  </a>
                  <a
                    href={getNFTContract() !== 'N/A' && getNFTTokenId() !== 'N/A' ? 
                      `${getExplorerUrl(currentChain)}/token/${getNFTContract()}?a=${getNFTTokenId()}` :
                      '#'
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (getNFTContract() === 'N/A' || getNFTTokenId() === 'N/A') {
                        e.preventDefault()
                        showError('NFT contract details not available')
                      }
                    }}
                    style={{ textDecoration: 'none' }}
                  >
                    <ActionButton className="explorer">
                      🔍 Explorer
                    </ActionButton>
                  </a>
                </ActionButtons>
                
                {/* NFT Details */}
                <Item>
                  <Label>Name:</Label>
                  <Value>{getNFTName()}</Value>
                </Item>
                
                <Item>
                  <Label>Contract:</Label>
                  <Value 
                    style={{ 
                      fontSize: '0.8rem',
                      cursor: getNFTContract() !== 'N/A' ? 'pointer' : 'default',
                      color: getNFTContract() !== 'N/A' ? '#00FF41' : '#fff',
                      textDecoration: getNFTContract() !== 'N/A' ? 'underline' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={handleCopyContract}
                    title={getNFTContract() !== 'N/A' ? 'Click to copy contract address' : ''}
                  >
                    {getNFTContract() !== 'N/A' ? (
                      <>
                        {getNFTContract().slice(0, 8)}...{getNFTContract().slice(-6)}
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>📋</span>
                      </>
                    ) : (
                      'N/A'
                    )}
                  </Value>
                </Item>
                
                <Item>
                  <Label>Token ID:</Label>
                  <Value>{getNFTTokenId()}</Value>
                </Item>
                
                <Item>
                  <Label>Chain:</Label>
                  <Value>{gameData?.chain || 'Base'}</Value>
                </Item>
                
                {gameData?.nft_collection && (
                  <Item>
                    <Label>Collection:</Label>
                    <Value>{gameData.nft_collection}</Value>
                  </Item>
                )}
              </NFTInfoSection>
              
              {/* NFT Image Section */}
              <NFTImageSection>
                <div style={{ position: 'relative' }}>
                  <NFTImage>
                    <img src={getNFTImage()} alt={getNFTName()} />
                  </NFTImage>
                </div>
              </NFTImageSection>
            </NFTHeader>
            
            {/* Verification Element at Bottom Right */}
            <div style={{ position: 'relative', marginTop: 'auto' }}>
              <VerificationElement 
                verified={isNFTVerified()}
                onMouseEnter={() => !isNFTVerified() && setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                {isNFTVerified() ? '✅ Verified' : '⚠️ Unverified'}
                {!isNFTVerified() && (
                  <Tooltip show={showTooltip}>
                    <TooltipTitle>⚠️ NFT Not Verified</TooltipTitle>
                    <TooltipText>
                      This NFT has not been verified on-chain. Proceed with caution.
                    </TooltipText>
                  </Tooltip>
                )}
              </VerificationElement>
            </div>
          </>
        )}
      </div>
    </CombinedContainer>
  )
}

export default GameStatusAndNFTContainer 