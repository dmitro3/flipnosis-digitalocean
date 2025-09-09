import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ThemeProvider } from '@emotion/react'
import styled from '@emotion/styled'

// Context imports
import { useWallet } from '../../contexts/WalletContext'
import { useToast } from '../../contexts/ToastContext'

// Component imports - Use new LobbyFinal
import LobbyFinal from '../LobbyFinal'
import { TabbedGameInterface } from '../TabbedGame'

// Lobby-specific hooks
import { useLobbyState } from './hooks/useLobbyState'
import socketService from '../../services/SocketService'

// Styles
import { theme } from '../../styles/theme'
import { LoadingSpinner } from '../../styles/components'

const Container = styled.div`
  min-height: 100vh;
  position: relative;
  z-index: 1;
`

const GameContainer = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  color: white;
  gap: 2rem;
`

const ErrorContainer = styled.div`
  text-align: center;
  color: white;
  padding: 2rem;
`

const BackButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #00FF41;
  color: #000;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: bold;
  margin-top: 1rem;
  transition: all 0.3s ease;
  
  &:hover {
    background: #00CC33;
    transform: translateY(-2px);
  }
`

const GameLobby = () => {
  const { gameId, listingId } = useParams()
  const navigate = useNavigate()
  const { address } = useWallet()
  const { showError, showSuccess, showInfo } = useToast()
  
  // Use the lobby state hook
  const {
    gameData,
    loading,
    error,
    connected,
    offers,
    isCreator,
    isJoiner,
    loadGameData
  } = useLobbyState(gameId || listingId, address)
  
  // Create coin config from game data
  const coinConfig = React.useMemo(() => ({
    headsImage: gameData?.coinData?.headsImage || '/coins/plainh.png',
    tailsImage: gameData?.coinData?.tailsImage || '/coins/plaint.png',
    material: gameData?.coinData?.material || 'gold'
  }), [gameData])
  
  // Handle offer accepted
  const handleOfferAccepted = React.useCallback((offer) => {
    console.log('🎯 GameLobby: Offer accepted:', offer)
    showSuccess('Offer accepted! Waiting for deposit...')
    loadGameData()
  }, [showSuccess, loadGameData])
  
  // Show loading state
  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <GameBackground />
          <GameContainer>
            <LoadingContainer>
              <LoadingSpinner />
              <div>Loading game...</div>
            </LoadingContainer>
          </GameContainer>
        </Container>
      </ThemeProvider>
    )
  }
  
  // Show error state
  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <GameBackground />
          <GameContainer>
            <ErrorContainer>
              <h2>Error Loading Game</h2>
              <p>{error}</p>
              <BackButton onClick={() => navigate('/')}>
                Back to Home
              </BackButton>
            </ErrorContainer>
          </GameContainer>
        </Container>
      </ThemeProvider>
    )
  }
  
  // No game data state
  if (!gameData) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <GameBackground />
          <GameContainer>
            <ErrorContainer>
              <h2>Game Not Found</h2>
              <p>The game you're looking for doesn't exist or has been removed.</p>
              <BackButton onClick={() => navigate('/')}>
                Back to Home
              </BackButton>
            </ErrorContainer>
          </GameContainer>
        </Container>
      </ThemeProvider>
    )
  }
  
  // Main render - use new LobbyFinal
  return (
    <ThemeProvider theme={theme}>
      <Container>
        <LobbyFinal />
      </Container>
    </ThemeProvider>
  )
}

export default GameLobby