import React, { useState } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../styles/theme'
import {
  Button,
  GlassCard,
  NeonText
} from '../styles/components'

const WalletConnectionModal = ({ isOpen, onClose, onSuccess }) => {
  const { connectWallet, loading, isMobile, isMetaMaskAvailable } = useWallet()
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleConnect = async (method) => {
    try {
      setError('')
      await connectWallet(null, method)
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      console.error('Connection error:', err)
      setError(err.message)
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '1rem'
      }}>
        <GlassCard style={{
          width: '100%',
          maxWidth: '400px',
          padding: '2rem',
          position: 'relative'
        }}>
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '1.5rem',
              cursor: 'pointer',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            ✕
          </button>

          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <NeonText style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              Connect Wallet
            </NeonText>
            <p style={{ color: theme.colors.textSecondary }}>
              Choose your preferred connection method
            </p>
          </div>

          {error && (
            <div style={{
              background: 'rgba(255, 0, 0, 0.1)',
              border: '1px solid rgba(255, 0, 0, 0.2)',
              color: '#ff4444',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* MetaMask Option */}
            {(isMetaMaskAvailable || isMobile) && (
              <button
                onClick={() => handleConnect('metamask')}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #f6851b, #e2761b)',
                  border: 'none',
                  borderRadius: '1rem',
                  padding: '1rem 1.5rem',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  transition: 'all 0.3s ease',
                  opacity: loading ? 0.7 : 1,
                  transform: loading ? 'scale(0.98)' : 'scale(1)'
                }}
                onMouseEnter={(e) => !loading && (e.target.style.transform = 'scale(1.02)')}
                onMouseLeave={(e) => !loading && (e.target.style.transform = 'scale(1)')}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'white',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>
                  🦊
                </div>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ fontSize: '1.1rem' }}>MetaMask</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                    {isMobile ? 'Open in MetaMask app' : 'Browser extension'}
                  </div>
                </div>
              </button>
            )}

            {/* WalletConnect Option */}
            <button
              onClick={() => handleConnect('walletconnect')}
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #3b99fc, #1e88e5)',
                border: 'none',
                borderRadius: '1rem',
                padding: '1rem 1.5rem',
                color: 'white',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                transition: 'all 0.3s ease',
                opacity: loading ? 0.7 : 1,
                transform: loading ? 'scale(0.98)' : 'scale(1)'
              }}
              onMouseEnter={(e) => !loading && (e.target.style.transform = 'scale(1.02)')}
              onMouseLeave={(e) => !loading && (e.target.style.transform = 'scale(1)')}
            >
              <div style={{
                width: '40px',
                height: '40px',
                background: 'white',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem'
              }}>
                🔗
              </div>
              <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{ fontSize: '1.1rem' }}>WalletConnect</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                  {isMobile ? 'Connect any mobile wallet' : 'Scan QR with mobile wallet'}
                </div>
              </div>
            </button>

            {/* Mobile-specific help text */}
            {isMobile && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                background: 'rgba(59, 153, 252, 0.1)',
                border: '1px solid rgba(59, 153, 252, 0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.85rem',
                color: theme.colors.textSecondary,
                textAlign: 'center'
              }}>
                💡 <strong>Tip:</strong> For the best experience, use WalletConnect to connect with Trust Wallet, Coinbase Wallet, or other mobile wallets
              </div>
            )}
          </div>

          {loading && (
            <div style={{
              marginTop: '1.5rem',
              textAlign: 'center',
              color: theme.colors.textSecondary
            }}>
              <div style={{
                display: 'inline-block',
                width: '20px',
                height: '20px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '50%',
                borderTopColor: theme.colors.neonBlue,
                animation: 'spin 1s ease-in-out infinite',
                marginRight: '0.5rem'
              }} />
              Connecting...
            </div>
          )}

          <style>
            {`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}
          </style>
        </GlassCard>
      </div>
    </ThemeProvider>
  )
}

export default WalletConnectionModal 