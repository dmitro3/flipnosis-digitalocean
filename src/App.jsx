import React, { useState } from 'react'
import { WalletProvider, useWallet } from './contexts/WalletContext'
import { ToastProvider } from './contexts/ToastContext'
import { ProfileProvider } from './contexts/ProfileContext'
import { ThemeProvider } from '@emotion/react'
import { theme } from './styles/theme'
import { RouterProvider } from 'react-router-dom'
import { router } from './Routes'
import DebugPanel from './components/DebugPanel'
import MobileLanding from './components/MobileLanding'
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
  const [showMobileLanding, setShowMobileLanding] = useState(isMobile)
  
  if (showMobileLanding) {
    return <MobileLanding onContinue={() => setShowMobileLanding(false)} />
  }
  
  return (
    <AppContainer>
      <RouterProvider router={router} />
      {isMobile && <DebugPanel />}
      {!isMobile && process.env.NODE_ENV === 'development' && <DebugPanel />}
    </AppContainer>
  )
}

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <WalletProvider>
        <ToastProvider>
          <ProfileProvider>
            <AppContent />
          </ProfileProvider>
        </ToastProvider>
      </WalletProvider>
    </ThemeProvider>
  )
}

export default App 