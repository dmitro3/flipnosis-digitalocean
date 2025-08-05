import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true }
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('🚨 Error boundary caught error:', error, errorInfo)
    
    // Enhanced error logging for specific error types
    if (error && error.message) {
      if (error.message.includes('props is not defined')) {
        console.error('🔍 Props reference error in React component:', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack
        })
      } else if (error.message.includes('Cannot read properties of null')) {
        console.error('🔍 Null reference error in React component:', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack
        })
      }
    }
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          color: '#00FF41',
          background: '#000',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '20px',
          fontFamily: 'monospace'
        }}>
          <h1>🚨 Application Error</h1>
          <p>Something went wrong while loading the application.</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              padding: '10px 20px',
              background: '#00FF41',
              color: '#000',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontFamily: 'monospace'
            }}
          >
            Reload Page
          </button>
          <details style={{ marginTop: '20px', color: '#FF6B6B' }}>
            <summary>Error Details</summary>
            <pre style={{ marginTop: '10px', fontSize: '12px' }}>
              {this.state.error?.message}
            </pre>
            <pre style={{ fontSize: '10px', color: '#888' }}>
              {this.state.error?.stack}
            </pre>
            {this.state.errorInfo && (
              <pre style={{ fontSize: '10px', color: '#666' }}>
                {this.state.errorInfo.componentStack}
              </pre>
            )}
          </details>
        </div>
      )
    }
    
    return this.props.children
  }
}

export default ErrorBoundary 