import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { useWalletConnection } from '../utils/useWalletConnection'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../styles/theme'
import styled from '@emotion/styled'
import {
  Container,
  ContentWrapper,
  GlassCard,
  NeonText,
  Button
} from '../styles/components'

const GameLayoutContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  
  @media (max-width: 768px) {
    padding: 0.5rem;
    margin-top: 80px; /* Account for fixed header */
  }
`

const DesktopLayout = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  gap: 2rem;
  align-items: start;
  min-height: 500px;
  
  @media (max-width: 768px) {
    display: none;
  }
`

const MobileLayout = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }
`

const MobilePlayerSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
`

const MobileCoinContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
`

const MobileGameInfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
`

const MobileChatContainer = styled.div`
  width: 100%;
  margin-top: 1rem;
`

const FlipGame = () => {
  const navigate = useNavigate()
  const { isFullyConnected, connectionError, address } = useWalletConnection()

  if (!isFullyConnected || !address) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <ContentWrapper>
            <GlassCard style={{ textAlign: 'center', padding: '3rem' }}>
              <NeonText>Connect Your Wallet</NeonText>
              <ConnectButton />
              {connectionError && (
                <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#FF6B6B' }}>
                  {connectionError}
                </div>
              )}
              <br />
              <Button onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>Go Home</Button>
            </GlassCard>
          </ContentWrapper>
        </Container>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <Container>
        <ContentWrapper>
          {/* Main Game Area - Responsive Layout */}
          <div style={{ 
            // Desktop Layout
            display: window.innerWidth > 768 ? 'grid' : 'none',
            gridTemplateColumns: '300px 1fr 300px',
            gap: '2rem', 
            marginBottom: '2rem',
            alignItems: 'start',
            minHeight: '500px'
          }}>
            {/* Your existing desktop layout code stays exactly the same */}
          </div>

          {/* NEW: Mobile Layout - Only shows on mobile */}
          <div style={{
            display: window.innerWidth <= 768 ? 'flex' : 'none',
            flexDirection: 'column',
            gap: '1rem',
            width: '100%',
            marginBottom: '2rem'
          }}>
            {/* Mobile: Player 1 Container */}
            <div style={{
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              width: '100%'
            }}>
              {/* Player 1 content */}
            </div>

            {/* Mobile: Coin Container - Smaller */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              width: '100%'
            }}>
              <div style={{ width: '200px', height: '200px' }}>
                {/* Coin component */}
              </div>
            </div>

            {/* Mobile: Player 2 Container */}
            <div style={{
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              width: '100%'
            }}>
              {/* Player 2 content */}
            </div>

            {/* Mobile: Power Display */}
            <div style={{
              width: '100%',
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              {/* Power display content */}
            </div>

            {/* Mobile: Game Info */}
            <div style={{
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
              width: '100%'
            }}>
              {/* Game info content */}
            </div>

            {/* Mobile: NFT Details */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '1rem',
              padding: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              width: '100%'
            }}>
              {/* NFT details content */}
            </div>

            {/* Mobile: Chat Box */}
            <div style={{ width: '100%' }}>
              {/* Chat component */}
            </div>
          </div>
        </ContentWrapper>
      </Container>
    </ThemeProvider>
  )
}

export default FlipGame 