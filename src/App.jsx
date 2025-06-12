import React from 'react'
import { WalletProvider, useWallet } from './contexts/WalletContext'
import { ToastProvider } from './contexts/ToastContext'
import { ProfileProvider } from './contexts/ProfileContext'
import { ThemeProvider } from '@emotion/react'
import { theme } from './styles/theme'
import { BrowserRouter } from 'react-router-dom'
import Home from './pages/Home'
import DebugPanel from './components/DebugPanel'
import Header from './components/Header'
import styled from '@emotion/styled'

const AppContainer = styled.div`
  min-height: 100vh;
  background: #000;
  color: #fff;
  position: relative;
  overflow-x: hidden;
`

const AppContent = () => {
  const { isMobile } = useWallet()
  
  return (
    <AppContainer>
      <Header />
      <Home />
      {isMobile && <DebugPanel />}
      {!isMobile && process.env.NODE_ENV === 'development' && <DebugPanel />}
    </AppContainer>
  )
}

const App = () => {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <WalletProvider>
          <ToastProvider>
            <ProfileProvider>
              <AppContent />
            </ProfileProvider>
          </ToastProvider>
        </WalletProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App 