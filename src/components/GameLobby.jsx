import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import webSocketService from '../services/WebSocketService'
import UnifiedDepositOverlay from './UnifiedDepositOverlay'

const LobbyContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  min-height: 100vh;
  color: white;
`

const Header = styled.div`
  text-align: center;
  margin-bottom: 30px;
`

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 10px;
  background: linear-gradient(45deg, #00d4ff, #ff6b6b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: #b0b0b0;
  margin-bottom: 20px;
`

const GameGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`

const GameCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 20px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    border-color: rgba(0, 212, 255, 0.5);
  }
`

const GameStatus = styled.div`
  display: inline-block;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  text-transform: uppercase;
  margin-bottom: 15px;
`

const StatusWaiting = styled(GameStatus)`
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
  border: 1px solid rgba(255, 193, 7, 0.3);
`

const StatusDeposits = styled(GameStatus)`
  background: rgba(0, 212, 255, 0.2);
  color: #00d4ff;
  border: 1px solid rgba(0, 212, 255, 0.3);
`

const StatusActive = styled(GameStatus)`
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
  border: 1px solid rgba(76, 175, 80, 0.3);
`

const StatusComplete = styled(GameStatus)`
  background: rgba(158, 158, 158, 0.2);
  color: #9e9e9e;
  border: 1px solid rgba(158, 158, 158, 0.3);
`

const GameInfo = styled.div`
  margin-bottom: 15px;
`

const GameTitle = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 8px;
  color: #ffffff;
`

const GameDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 0.9rem;
  color: #b0b0b0;
`

const BetAmount = styled.div`
  font-size: 1.1rem;
  font-weight: bold;
  color: #00d4ff;
  margin-bottom: 10px;
`

const ActionButton = styled.button`
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(45deg, #00d4ff, #0099cc);
  color: white;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 212, 255, 0.4);
  }

  &:disabled {
    background: #666;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`

const AcceptButton = styled(ActionButton)`
  background: linear-gradient(45deg, #4caf50, #45a049);
  
  &:hover {
    box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
  }
`

const JoinButton = styled(ActionButton)`
  background: linear-gradient(45deg, #ff6b6b, #ee5a52);
  
  &:hover {
    box-shadow: 0 5px 15px rgba(255, 107, 107, 0.4);
  }
`

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.2rem;
  color: #b0b0b0;
`

const NoGamesMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #b0b0b0;
  font-size: 1.1rem;
`

export default function GameLobby() {
  const [gameData, setGameData] = useState([])
  const [gameState, setGameState] = useState({})
  const [showDepositOverlay, setShowDepositOverlay] = useState(false)
  const [isCreator, setIsCreator] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Connect to WebSocket service
    webSocketService.connect()

    // Listen for room joined event
    webSocketService.on('room_joined', (data) => {
      console.log('Room joined:', data)
      setGameState(data.gameState || {})
    })

    // Listen for deposit stage started
    webSocketService.on('deposit_stage_started', (data) => {
      console.log('Deposit stage started:', data)
      setShowDepositOverlay(true)
      setGameState(data.gameState || {})
    })

    // Listen for game started
    webSocketService.on('game_started', (data) => {
      console.log('Game started:', data)
      setShowDepositOverlay(false)
      setGameState(data.gameState || {})
      // Redirect to game page or update UI
    })

    // Load initial games
    loadGames()

    return () => {
      webSocketService.off('room_joined')
      webSocketService.off('deposit_stage_started')
      webSocketService.off('game_started')
    }
  }, [])

  const loadGames = async () => {
    try {
      const response = await fetch('/api/games')
      const games = await response.json()
      setGameData(games)
    } catch (error) {
      console.error('Error loading games:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinGame = async (gameId) => {
    try {
      webSocketService.send('join_room', { gameId })
    } catch (error) {
      console.error('Error joining game:', error)
    }
  }

  const handleAcceptOffer = async (gameId) => {
    try {
      webSocketService.send('accept_offer', { gameId })
      setIsCreator(false)
    } catch (error) {
      console.error('Error accepting offer:', error)
    }
  }

  const handleDepositComplete = () => {
    setShowDepositOverlay(false)
    // Handle deposit completion
  }

  const handleDepositTimeout = () => {
    setShowDepositOverlay(false)
    // Handle deposit timeout
  }

  const getStatusComponent = (status) => {
    switch (status) {
      case 'waiting':
        return <StatusWaiting>Waiting for Player</StatusWaiting>
      case 'waiting_deposits':
        return <StatusDeposits>Waiting for Deposits</StatusDeposits>
      case 'active':
        return <StatusActive>Game Active</StatusActive>
      case 'complete':
        return <StatusComplete>Game Complete</StatusComplete>
      default:
        return <StatusWaiting>Unknown</StatusWaiting>
    }
  }

  const getActionButton = (game) => {
    if (game.status === 'waiting') {
      return (
        <AcceptButton onClick={() => handleAcceptOffer(game.id)}>
          Accept Offer
        </AcceptButton>
      )
    } else if (game.status === 'waiting_deposits') {
      return (
        <JoinButton onClick={() => handleJoinGame(game.id)}>
          Join Game
        </JoinButton>
      )
    } else if (game.status === 'active') {
      return (
        <JoinButton onClick={() => handleJoinGame(game.id)}>
          Watch Game
        </JoinButton>
      )
    }
    return null
  }

  if (loading) {
    return (
      <LobbyContainer>
        <LoadingSpinner>Loading games...</LoadingSpinner>
      </LobbyContainer>
    )
  }

  if (gameData.length === 0) {
    return (
      <LobbyContainer>
        <Header>
          <Title>NFT Flip Game Lobby</Title>
          <Subtitle>No active games available</Subtitle>
        </Header>
        <NoGamesMessage>
          Be the first to create a game and challenge other players!
        </NoGamesMessage>
      </LobbyContainer>
    )
  }

  return (
    <LobbyContainer>
      <Header>
        <Title>NFT Flip Game Lobby</Title>
        <Subtitle>Join existing games or create your own challenge</Subtitle>
      </Header>

      <GameGrid>
        {gameData.map((game) => (
          <GameCard key={game.id}>
            {getStatusComponent(game.status)}
            
            <GameInfo>
              <GameTitle>Game #{game.id}</GameTitle>
              <GameDetails>
                <span>Creator: {game.creator_address?.slice(0, 8)}...</span>
                <span>Created: {new Date(game.created_at).toLocaleDateString()}</span>
              </GameDetails>
              <GameDetails>
                <span>Challenger: {game.challenger_address ? `${game.challenger_address.slice(0, 8)}...` : 'None'}</span>
                <span>Status: {game.status}</span>
              </GameDetails>
            </GameInfo>

            <BetAmount>
              Bet: {game.bet_amount} ETH
            </BetAmount>

            {getActionButton(game)}
          </GameCard>
        ))}
      </GameGrid>

      {showDepositOverlay && (
        <UnifiedDepositOverlay
          gameId={gameState.gameId}
          address={gameState.address}
          gameData={gameState}
          onDepositComplete={handleDepositComplete}
          onTimeout={handleDepositTimeout}
        />
      )}
    </LobbyContainer>
  )
}
