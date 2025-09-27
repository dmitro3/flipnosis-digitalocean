import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error boundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          background: 'linear-gradient(135deg, rgba(255, 0, 0, 0.2), rgba(139, 0, 0, 0.2))',
          border: '2px solid #ff0000',
          borderRadius: '1rem',
          color: 'white',
          textAlign: 'center'
        }}>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message || 'An error occurred'}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'linear-gradient(135deg, #ff1493, #ff69b4)',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
