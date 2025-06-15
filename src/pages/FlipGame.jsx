import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
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
  const { isConnected } = useWallet()

  if (!isConnected) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <ContentWrapper>
            <GlassCard style={{ textAlign: 'center', padding: '3rem' }}>
              <NeonText>Connect Your Wallet</NeonText>
              <ConnectButton />
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