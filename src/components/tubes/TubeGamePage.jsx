import React from 'react'
import { useParams } from 'react-router-dom'
import GlassTubeGame from './GlassTubeGame'

const TubeGamePage = () => {
  const { gameId } = useParams()

  if (!gameId) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'url(/Images/Background/game room2.png) no-repeat center center fixed',
        backgroundSize: 'cover',
        color: '#ff6b6b',
        fontSize: '24px',
        fontFamily: 'Orbitron, sans-serif',
        fontWeight: 'bold'
      }}>
        <div style={{
          background: 'rgba(10, 15, 35, 0.9)',
          border: '2px solid #ff6b6b',
          borderRadius: '12px',
          padding: '20px 40px',
          boxShadow: '0 0 20px rgba(255, 107, 107, 0.3)'
        }}>
          ⚠️ No Game ID Provided
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <GlassTubeGame />
    </div>
  )
}

export default TubeGamePage
