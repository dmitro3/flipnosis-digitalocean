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


const PlayersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(15px);
  border: 6px solid rgba(255, 20, 147, 0.3);
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
  border: 4px solid ${props => {
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
  background: rgba(0, 0, 0, 0.2);
  border-radius: 1rem;
  border: 6px solid rgba(255, 20, 147, 0.3);
  backdrop-filter: blur(15px);
  
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
      <GameStatus>
        <div className="status-text">
          {gameStatus === 'filling' ? 'Waiting for game to begin' : 
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
