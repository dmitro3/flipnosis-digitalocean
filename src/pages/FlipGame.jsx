import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { useWalletConnection } from '../utils/useWalletConnection'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../styles/theme'
import {
  Container,
  ContentWrapper,
  GlassCard,
  NeonText,
  Button
} from '../styles/components'

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

  // ... rest of the component code ...
}

export default FlipGame 