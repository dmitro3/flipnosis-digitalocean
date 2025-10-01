import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import { useParams } from 'react-router-dom'
import { useWallet } from '../../contexts/WalletContext'
import { useToast } from '../../contexts/ToastContext'
import { getApiUrl } from '../../config/api'
import BattleRoyaleTabbedInterface from './BattleRoyaleTabbedInterface'

const LobbyContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
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
    border: 2px solid ${props => props.theme.colors.neonBlue};
  }
  
  h3 {
    color: ${props => props.theme.colors.textPrimary};
    margin: 0;
    text-align: center;
  }
  
  p {
    color: ${props => props.theme.colors.textSecondary};
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
    color: ${props => props.theme.colors.neonBlue};
    margin: 0;
    font-size: 2rem;
    text-align: center;
  }
  
  .prize-info {
    text-align: center;
    
    .prize-label {
      color: ${props => props.theme.colors.textSecondary};
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }
    
    .prize-value {
      color: ${props => props.theme.colors.neonPink};
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
        color: ${props => props.theme.colors.textSecondary};
        font-size: 0.8rem;
        margin-bottom: 0.5rem;
      }
      
      .value {
        color: ${props => props.theme.colors.textPrimary};
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
    color: ${props => props.theme.colors.textSecondary};
    font-size: 0.9rem;
  }
  
  .creator-address {
    color: ${props => props.theme.colors.neonBlue};
    font-family: monospace;
    font-size: 0.8rem;
    background: rgba(0, 191, 255, 0.1);
    padding: 0.5rem 1rem;
    border-radius: 2rem;
    border: 1px solid rgba(0, 191, 255, 0.3);
  }
  
  .status {
    color: ${props => props.theme.colors.textSecondary};
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
    color: ${props => props.theme.colors.textSecondary};
    font-size: 0.8rem;
    font-weight: bold;
  }
  
  .player-address {
    color: ${props => props.occupied ? props.theme.colors.textPrimary : props.theme.colors.textSecondary};
    font-family: monospace;
    font-size: 0.7rem;
    text-align: center;
    word-break: break-all;
    padding: 0 0.5rem;
  }
  
  .join-text {
    color: ${props => props.theme.colors.neonPink};
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
    color: ${props => props.theme.colors.neonPink};
    font-size: 1.1rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
  
  .players-count {
    color: ${props => props.theme.colors.textSecondary};
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

const BattleRoyaleLobby = ({ gameId: propGameId, gameData: propGameData, onJoinGame, onSpectate }) => {
  const { gameId: paramGameId } = useParams()
  const { address } = useWallet()
  const { showToast } = useToast()
  
  // Use gameId from props or URL params
  const gameId = propGameId || paramGameId
  
  const [gameData, setGameData] = useState(propGameData || null)
  const [loading, setLoading] = useState(!propGameData)
  const [players, setPlayers] = useState(new Array(8).fill(null))
  const [gameStatus, setGameStatus] = useState('filling')
  const [currentPlayers, setCurrentPlayers] = useState(0)
  const [isJoining, setIsJoining] = useState(false)

  // Fetch game data if not provided as prop
  useEffect(() => {
    if (!propGameData && gameId) {
      const fetchGameData = async () => {
        try {
          setLoading(true)
          const response = await fetch(getApiUrl(`/battle-royale/${gameId}`))
          if (response.ok) {
            const data = await response.json()
            setGameData(data)
          } else {
            throw new Error('Failed to fetch game data')
          }
        } catch (error) {
          console.error('Error fetching game data:', error)
          showToast('Failed to load game data', 'error')
        } finally {
          setLoading(false)
        }
      }
      fetchGameData()
    }
  }, [gameId, propGameData, showToast])

  // Initialize creator in slot 0 when game loads (only if creator participates)
  useEffect(() => {
    if (gameData && gameData.creator && gameData.creator_participates) {
      const newPlayers = [...players]
      if (!newPlayers[0] || newPlayers[0].address?.toLowerCase() !== gameData.creator?.toLowerCase()) {
        const defaultCoin = { id: 'plain', type: 'default', name: 'Classic' }
        newPlayers[0] = {
          address: gameData.creator,
          joinedAt: new Date().toISOString(),
          coin: defaultCoin,
          isCreator: true,
          entryPaid: true
        }
        setPlayers(newPlayers)
        setCurrentPlayers(prev => {
          // Only increment if creator wasn't already counted
          return prev === 0 ? 1 : prev
        })
        
        console.log('🪙 Creator initialized in lobby slot 0:', {
          address: gameData.creator,
          coin: defaultCoin,
          isCreator: true
        })
      }
    }
  }, [gameData])

  // Check if current user can join
  const userAlreadyJoined = players.some(player => player?.address?.toLowerCase() === address?.toLowerCase())
  const isCreator = gameData?.creator?.toLowerCase() === address?.toLowerCase()
  const canJoin = !userAlreadyJoined && !isCreator && currentPlayers < 8 && gameStatus === 'filling'

  const handleSlotClick = async (slotIndex) => {
    if (!canJoin || players[slotIndex] !== null) return
    
    setIsJoining(true)
    try {
      await onJoinGame(slotIndex)
    } catch (error) {
      showToast('Failed to join game', 'error')
    }
    setIsJoining(false)
  }

  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Show loading state
  if (loading || !gameData) {
    return (
      <LobbyContainer>
        <div style={{ 
          textAlign: 'center', 
          color: 'white', 
          fontSize: '1.2rem',
          padding: '2rem'
        }}>
          {loading ? 'Loading Battle Royale...' : 'Game not found'}
        </div>
      </LobbyContainer>
    )
  }

  return (
    <BattleRoyaleTabbedInterface 
      gameId={gameId}
      gameData={gameData}
    />
  )
}

export default BattleRoyaleLobby
