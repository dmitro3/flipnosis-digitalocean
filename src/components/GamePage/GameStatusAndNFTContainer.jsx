import React from 'react'
import styled from '@emotion/styled'

const CombinedContainer = styled.div`
  background: rgba(0, 0, 40, 0.95);
  padding: 1.5rem;
  border-radius: 1rem;
  border: 2px solid #FF1493;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 30px rgba(255, 20, 147, 0.3), inset 0 0 20px rgba(255, 20, 147, 0.1);
  min-height: 200px;
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
  width: 80px;
  height: 80px;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  border: 2px solid rgba(255, 20, 147, 0.3);
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
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

const GameStatusAndNFTContainer = ({ gameData, isCreator, currentTurn, nftData }) => {
  const getStatusText = (status) => {
    switch (status) {
      case 'waiting_challenger': return 'Waiting for Challenger'
      case 'waiting_challenger_deposit': return 'Waiting for Deposit'
      case 'active': return 'Game Active'
      case 'completed': return 'Game Completed'
      default: return 'Unknown Status'
    }
  }

  const getCurrentPlayer = () => {
    if (!gameData) return 'Unknown'
    if (currentTurn === gameData.creator_address) {
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
      round.winner === gameData.creator_address
    ).length
    
    const challengerWins = gameData.rounds.filter(round => 
      round.winner && round.winner !== gameData.creator_address
    ).length
    
    return { creator: creatorWins, challenger: challengerWins }
  }

  const roundWins = getRoundWins()
  const totalRounds = gameData?.rounds?.length || 0
  const isGameActive = gameData?.status === 'active'

  return (
    <CombinedContainer>
      <Header>
        <Title>🎮 Game Status & NFT Details</Title>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <StatusBadge status={gameData?.status}>
            {getStatusText(gameData?.status)}
          </StatusBadge>
          <VerificationBadge verified={isNFTVerified()}>
            {isNFTVerified() ? '✅ Verified' : '⚠️ Unverified'}
          </VerificationBadge>
        </div>
      </Header>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {/* Show round containers when game is active, otherwise show other details */}
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
            {/* Game Status Section */}
            <div style={{ marginBottom: '1rem' }}>
              <Item>
                <Label>Game ID:</Label>
                <Value>{gameData?.id || 'N/A'}</Value>
              </Item>
              
              <Item>
                <Label>Current Turn:</Label>
                <Value>{getCurrentPlayer()}</Value>
              </Item>
              
              <Item>
                <Label>Created:</Label>
                <Value>
                  {gameData?.created_at ? new Date(gameData.created_at).toLocaleDateString() : 'N/A'}
                </Value>
              </Item>
              
              {gameData?.status === 'completed' && (
                <Item>
                  <Label>Winner:</Label>
                  <Value style={{ color: '#00FF41' }}>
                    {gameData?.winner_address ? 
                      (gameData.winner_address === gameData.creator_address ? 'Creator' : 'Challenger') : 
                      'N/A'
                    }
                  </Value>
                </Item>
              )}
            </div>

            {/* NFT Details Section */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <NFTImage>
                <img src={getNFTImage()} alt={getNFTName()} />
              </NFTImage>
            </div>
            
            <Item>
              <Label>Name:</Label>
              <Value>{getNFTName()}</Value>
            </Item>
            
            <Item>
              <Label>Contract:</Label>
              <Value style={{ fontSize: '0.8rem' }}>
                {getNFTContract().slice(0, 8)}...{getNFTContract().slice(-6)}
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
            
            {!isNFTVerified() && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '0.75rem', 
                background: 'rgba(255, 149, 0, 0.1)', 
                borderRadius: '0.5rem',
                border: '1px solid rgba(255, 149, 0, 0.3)'
              }}>
                <div style={{ color: '#FF9500', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  ⚠️ NFT Not Verified
                </div>
                <div style={{ color: '#fff', fontSize: '0.8rem' }}>
                  This NFT has not been verified on-chain. Proceed with caution.
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </CombinedContainer>
  )
}

export default GameStatusAndNFTContainer 