import React from 'react'
import { theme } from '../styles/theme'

const WebSocketStatus = ({ connected, playerCount = 0 }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      left: '1rem',
      background: connected ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
      border: `1px solid ${connected ? '#00ff00' : '#ff0000'}`,
      borderRadius: '0.5rem',
      padding: '0.5rem 1rem',
      fontSize: '0.875rem',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: connected ? '#00ff00' : '#ff0000',
        animation: connected ? 'pulse 2s infinite' : 'none'
      }} />
      <span style={{ color: connected ? '#00ff00' : '#ff0000' }}>
        {connected ? `🟢 Connected` : '🔴 Disconnected'}
      </span>
      {connected && playerCount > 0 && (
        <span style={{ color: theme.colors.textSecondary }}>
          • {playerCount} player{playerCount !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}

export default WebSocketStatus 