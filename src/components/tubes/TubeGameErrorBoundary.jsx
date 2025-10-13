import React from 'react'

class TubeGameErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('TubeGame Error:', error, errorInfo)
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
          fontSize: '20px',
          fontFamily: 'Orbitron, sans-serif',
          fontWeight: 'bold'
        }}>
          <div style={{
            background: 'rgba(10, 15, 35, 0.9)',
            border: '2px solid #ff6b6b',
            borderRadius: '12px',
            padding: '30px 40px',
            boxShadow: '0 0 20px rgba(255, 107, 107, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
            <div style={{ marginBottom: '20px' }}>Tube Game Error</div>
            <div style={{ fontSize: '16px', opacity: 0.8, marginBottom: '20px' }}>
              Something went wrong with the tube game
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #ff1493, #ff69b4)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default TubeGameErrorBoundary
