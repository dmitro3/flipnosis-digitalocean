import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import { useWallet } from '../../../contexts/WalletContext'
import { useToast } from '../../../contexts/ToastContext'
import { getApiUrl } from '../../../config/api'

const TabContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  overflow-y: auto;
`

const GameInfo = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 2rem;
  align-items: start;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 191, 255, 0.3);
  border-radius: 1rem;
  padding: 2rem;
`

const NFTDisplay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  
  img {
    width: 200px;
    height: 200px;
    border-radius: 1rem;
    object-fit: cover;
    border: 2px solid ${props => props.theme?.colors?.neonBlue || '#00BFFF'};
  }
  
  h3 {
    color: ${props => props.theme?.colors?.textPrimary || 'white'};
    margin: 0;
    text-align: center;
  }
  
  p {
    color: ${props => props.theme?.colors?.textSecondary || '#aaa'};
    margin: 0;
    text-align: center;
    font-size: 0.9rem;
  }
`

const GameDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  h2 {
    color: ${props => props.theme?.colors?.neonBlue || '#00BFFF'};
    margin: 0;
    font-size: 2rem;
    text-align: center;
  }
  
  .prize-info {
    text-align: center;
    
    .prize-label {
      color: ${props => props.theme?.colors?.textSecondary || '#aaa'};
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }
    
    .prize-value {
      color: ${props => props.theme?.colors?.neonPink || '#FF1493'};
      font-size: 1.2rem;
      font-weight: bold;
    }
  }
  
  .entry-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-top: 1rem;
    
    .info-box {
      background: rgba(0, 191, 255, 0.1);
      border: 1px solid rgba(0, 191, 255, 0.3);
      border-radius: 0.5rem;
      padding: 1rem;
      text-align: center;
      
      .label {
        color: ${props => props.theme?.colors?.textSecondary || '#aaa'};
        font-size: 0.8rem;
        margin-bottom: 0.5rem;
      }
      
      .value {
        color: ${props => props.theme?.colors?.textPrimary || 'white'};
        font-size: 1.1rem;
        font-weight: bold;
      }
    }
  }
`

const CreatorInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  
  .creator-label {
    color: ${props => props.theme?.colors?.textSecondary || '#aaa'};
    font-size: 0.9rem;
  }
  
  .creator-address {
    color: ${props => props.theme?.colors?.neonBlue || '#00BFFF'};
    font-family: monospace;
    font-size: 0.8rem;
    background: rgba(0, 191, 255, 0.1);
    padding: 0.5rem 1rem;
    border-radius: 2rem;
    border: 1px solid rgba(0, 191, 255, 0.3);
  }
  
  .status {
    color: ${props => props.theme?.colors?.textSecondary || '#aaa'};
    font-size: 0.8rem;
    font-style: italic;
  }
`

const PlayersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 20, 147, 0.3);
  border-radius: 1rem;
  padding: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`

const PlayerSlot = styled.div`
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: ${props => {
    if (props.occupied) {
      return props.isCurrentUser 
        ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.2) 0%, rgba(0, 204, 106, 0.2) 100%)'
        : 'linear-gradient(135deg, rgba(0, 191, 255, 0.2) 0%, rgba(138, 43, 226, 0.2) 100%)'
    }
    return 'rgba(255, 255, 255, 0.05)'
  }};
  border: 2px solid ${props => {
    if (props.occupied) {
      return props.isCurrentUser ? '#00ff88' : '#00bfff'
    }
    return 'rgba(255, 255, 255, 0.2)'
  }};
  border-radius: 1rem;
  transition: all 0.3s ease;
  cursor: ${props => !props.occupied && props.canJoin ? 'pointer' : 'default'};
  position: relative;
  
  &:hover {
    ${props => !props.occupied && props.canJoin && `
      border-color: #ff1493;
      background: rgba(255, 20, 147, 0.1);
      transform: translateY(-2px);
    `}
  }
  
  .slot-number {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    color: ${props => props.theme?.colors?.textSecondary || '#aaa'};
    font-size: 0.8rem;
    font-weight: bold;
  }
  
  .player-address {
    color: ${props => props.occupied ? (props.theme?.colors?.textPrimary || 'white') : (props.theme?.colors?.textSecondary || '#aaa')};
    font-family: monospace;
    font-size: 0.7rem;
    text-align: center;
    word-break: break-all;
    padding: 0 0.5rem;
  }
  
  .join-text {
    color: ${props => props.theme?.colors?.neonPink || '#FF1493'};
    font-size: 0.9rem;
    font-weight: bold;
    text-align: center;
  }
  
  .status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => props.occupied ? '#00ff88' : '#666'};
  }
`

const GameStatus = styled.div`
  text-align: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 1rem;
  border: 1px solid rgba(255, 20, 147, 0.3);
  
  .status-text {
    color: ${props => props.theme?.colors?.neonPink || '#FF1493'};
    font-size: 1.1rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
  
  .players-count {
    color: ${props => props.theme?.colors?.textSecondary || '#aaa'};
    font-size: 0.9rem;
  }
`

const JoinButton = styled.button`
  background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 2rem;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(255, 20, 147, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

const BattleRoyaleGamePageTab = ({ gameData, gameId, address, isCreator }) => {
  const { showToast } = useToast()
  
  const [players, setPlayers] = useState(new Array(8).fill(null))
  const [gameStatus, setGameStatus] = useState('filling')
  const [currentPlayers, setCurrentPlayers] = useState(0)
  const [isJoining, setIsJoining] = useState(false)

  // Check if current user can join
  const userAlreadyJoined = players.some(player => player?.address === address)
  const canJoin = !userAlreadyJoined && !isCreator && currentPlayers < 8 && gameStatus === 'filling'

  const handleSlotClick = async (slotIndex) => {
    if (!canJoin || players[slotIndex] !== null) return
    
    setIsJoining(true)
    try {
      // TODO: Implement join game logic
      console.log('Joining slot:', slotIndex)
      showToast('Joining game...', 'info')
    } catch (error) {
      showToast('Failed to join game', 'error')
    }
    setIsJoining(false)
  }

  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (!gameData) {
    return (
      <TabContainer>
        <div style={{ 
          textAlign: 'center', 
          color: 'white', 
          fontSize: '1.2rem',
          padding: '2rem'
        }}>
          Loading Battle Royale Game Page...
        </div>
      </TabContainer>
    )
  }

  return (
    <TabContainer>
      <GameInfo>
        <NFTDisplay>
          <img src={gameData.nftImage || gameData.nft_image || '/placeholder-nft.svg'} alt={gameData.nftName || gameData.nft_name || 'NFT'} />
          <h3>{gameData.nftName || gameData.nft_name || 'Unknown NFT'}</h3>
          <p>{gameData.nftCollection || gameData.nft_collection || 'Unknown Collection'}</p>
        </NFTDisplay>
        
        <GameDetails>
          <h2>🏆 Battle Royale</h2>
          
          <div className="prize-info">
            <div className="prize-label">Winner Takes All</div>
            <div className="prize-value">{gameData.nftName || gameData.nft_name || 'Unknown NFT'}</div>
          </div>
          
          <div className="entry-info">
            <div className="info-box">
              <div className="label">Entry Fee</div>
              <div className="value">${gameData.entryFee || gameData.entry_fee || 0}</div>
            </div>
            <div className="info-box">
              <div className="label">Service Fee</div>
              <div className="value">${gameData.serviceFee || gameData.service_fee || 0}</div>
            </div>
          </div>
        </GameDetails>
        
        <CreatorInfo>
          <div className="creator-label">Created by</div>
          <div className="creator-address">{formatAddress(gameData.creator)}</div>
          <div className="status">Waiting for players...</div>
        </CreatorInfo>
      </GameInfo>

      <GameStatus>
        <div className="status-text">
          {gameStatus === 'filling' ? 'Filling Lobby' : 
           gameStatus === 'starting' ? 'Starting Soon!' : 
           'Game In Progress'}
        </div>
        <div className="players-count">
          {currentPlayers} / 8 Players Joined
        </div>
      </GameStatus>

      <PlayersGrid>
        {players.map((player, index) => (
          <PlayerSlot
            key={index}
            occupied={player !== null}
            isCurrentUser={player?.address === address}
            canJoin={canJoin}
            onClick={() => handleSlotClick(index)}
          >
            <div className="slot-number">{index + 1}</div>
            {player ? (
              <>
                <div className="player-address">
                  {formatAddress(player.address)}
                </div>
                <div className="status-indicator" />
              </>
            ) : (
              canJoin ? (
                <div className="join-text">
                  {isJoining ? 'Joining...' : 'Click to Join'}
                </div>
              ) : (
                <div className="player-address">Empty</div>
              )
            )}
          </PlayerSlot>
        ))}
      </PlayersGrid>

      {isCreator && (
        <div style={{ textAlign: 'center', color: '#ff1493' }}>
          <p>You are the creator of this Battle Royale. You cannot participate but will receive the entry fees when the game completes!</p>
        </div>
      )}

      {!isCreator && !userAlreadyJoined && gameStatus === 'filling' && (
        <div style={{ textAlign: 'center' }}>
          <JoinButton 
            onClick={() => handleSlotClick(players.findIndex(p => p === null))}
            disabled={!canJoin || isJoining}
          >
            {isJoining ? 'Joining Game...' : `Join Battle Royale - $${((gameData.entryFee || gameData.entry_fee || 0) + (gameData.serviceFee || gameData.service_fee || 0)).toFixed(2)}`}
          </JoinButton>
        </div>
      )}

      {userAlreadyJoined && (
        <div style={{ textAlign: 'center', color: '#00ff88' }}>
          <p>✅ You've joined the Battle Royale! Waiting for other players...</p>
        </div>
      )}
    </TabContainer>
  )
}

export default BattleRoyaleGamePageTab
