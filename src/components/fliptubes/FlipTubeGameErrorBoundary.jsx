import React from 'react'

class FlipTubeGameErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('FlipTube Game Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
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
            boxShadow: '0 0 20px rgba(255, 107, 107, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '20px' }}>🚨 Game Error</div>
            <div style={{ fontSize: '16px', marginBottom: '20px' }}>
              Something went wrong with the FlipTube Game
            </div>
            <button 
              onClick={() => window.location.reload()}
              style={{
                background: '#ff6b6b',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontFamily: 'Orbitron, sans-serif',
                fontWeight: 'bold'
              }}
            >
              Reload Game
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default FlipTubeGameErrorBoundary
