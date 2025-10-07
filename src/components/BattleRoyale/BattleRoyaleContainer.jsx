import React from 'react'
import { useParams } from 'react-router-dom'
import { BattleRoyaleGameProvider, useBattleRoyaleGame } from '../../contexts/BattleRoyaleGameContext'
import LobbyScreen from './LobbyScreen'
import GameScreen from './GameScreen'
import PhysicsGameScreen from './PhysicsGameScreen'
import ErrorBoundary from './ErrorBoundary'
import hazeVideo from '../../../Images/Video/haze.webm'

const BackgroundVideo = () => (
  <video
    autoPlay
    loop
    muted
    playsInline
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      zIndex: -1,
      opacity: 0.7
    }}
  >
    <source src={hazeVideo} type="video/webm" />
  </video>
)

const LoadingScreen = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    color: 'white',
    fontSize: '1.5rem'
  }}>
    <div style={{
      border: '4px solid rgba(255, 255, 255, 0.1)',
      borderTop: '4px solid #00ff88',
      borderRadius: '50%',
      width: '60px',
      height: '60px',
      animation: 'spin 1s linear infinite',
      marginBottom: '1rem'
    }} />
    <div>Loading Battle Royale...</div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
)

const ErrorScreen = ({ error }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    color: '#ff6b6b',
    fontSize: '1.5rem',
    padding: '2rem',
    textAlign: 'center'
  }}>
    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
    <div>Error: {error}</div>
    <button
      onClick={() => window.location.reload()}
      style={{
        marginTop: '2rem',
        padding: '1rem 2rem',
        background: 'linear-gradient(135deg, #ff1493, #ff69b4)',
        border: 'none',
        borderRadius: '0.5rem',
        color: 'white',
        fontSize: '1rem',
        fontWeight: 'bold',
        cursor: 'pointer'
      }}
    >
      Reload Page
    </button>
  </div>
)

// Inner component that uses the context
const BattleRoyaleContent = () => {
  const { gameState, loading, error } = useBattleRoyaleGame()

  if (loading) {
    return <LoadingScreen />
  }

  if (error) {
    return <ErrorScreen error={error} />
  }

  if (!gameState) {
    return <ErrorScreen error="Game not found" />
  }

  // Simple phase-based routing
  if (gameState.phase === 'filling' || gameState.phase === 'lobby') {
    return <LobbyScreen />
  }

  // Physics game route
  const isPhysicsGame = gameState.gameId?.startsWith('physics_')
  if (isPhysicsGame) {
    return <PhysicsGameScreen />
  }

  // Non-physics default
  return <GameScreen />
}

// Main container component
const BattleRoyaleContainer = () => {
  const { gameId } = useParams()

  if (!gameId) {
    return <ErrorScreen error="No game ID provided" />
  }

  return (
    <ErrorBoundary>
      <BackgroundVideo />
      <BattleRoyaleGameProvider gameId={gameId}>
        <BattleRoyaleContent />
      </BattleRoyaleGameProvider>
    </ErrorBoundary>
  )
}

export default BattleRoyaleContainer
