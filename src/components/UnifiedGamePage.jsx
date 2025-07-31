// 1. React imports first
import React, { useState, useEffect, useRef } from 'react'

// 2. Third-party imports
import { useParams, useNavigate } from 'react-router-dom'

// Temporary minimal component for testing
const UnifiedGamePage = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()
  
  return (
    <div style={{ 
      padding: '2rem', 
      color: 'white', 
      background: '#000',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <h1>Game Page Test</h1>
      <p>Game ID: {gameId}</p>
      <button 
        onClick={() => navigate('/')}
        style={{
          padding: '0.5rem 1rem',
          background: '#00FF41',
          color: '#000',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer'
        }}
      >
        Back to Home
      </button>
    </div>
  )
}

export default UnifiedGamePage